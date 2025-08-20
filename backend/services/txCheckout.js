// backend/services/txCheckout.js  // [신규 파일 전체]
const pool = require("../config/db");

/**
 * 결제(=payment)와 주문(=order) 및 아이템(order_items)을 한 트랜잭션으로 처리
 * - inputs:
 *   - userId: number
 *   - items: Array<{ schedule_id:number, quantity:number, unit_price:number }>
 *   - payment: { amount:number, currency:'KRW', payment_method:'card'|'transfer'|'vbank', status:'paid'|'완료', toss_payment_key?:string, toss_order_id?:string }
 *   - discounts?: { used_point?:number, coupon_id?:number }  // 선택
 * - returns: { orderId, paymentId, totalQuantity, totalAmount }
 */
async function finalizeCheckoutAtomic({
  userId,
  items,
  payment,
  discounts = {},
}) {
  if (!userId) throw new Error("userId 필요");
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("items가 비어 있음 (최소 1개 필요)");
  }
  // 수량/가격 유효성
  for (const it of items) {
    if (!it?.schedule_id || !Number.isInteger(it.schedule_id)) {
      throw new Error("schedule_id 누락/유효하지 않음");
    }
    if (!Number.isFinite(it.quantity) || it.quantity <= 0) {
      throw new Error("quantity는 1 이상이어야 함");
    }
    if (!Number.isFinite(it.unit_price) || it.unit_price < 0) {
      throw new Error("unit_price는 0 이상이어야 함");
    }
  }
  if (
    !payment ||
    !Number.isFinite(payment.amount) ||
    !payment.currency ||
    !payment.payment_method
  ) {
    throw new Error("payment 정보 불완전");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) 주문 생성 (pending)
    const [orderRes] = await conn.query(
      `INSERT INTO orders (user_id, order_status, total_amount, used_point, coupon_id, created_at, updated_at)
       VALUES (?, 'pending', 0, 0, NULL, NOW(), NOW())`,
      [userId]
    );
    const orderId = orderRes.insertId;

    // 2) 아이템 일괄 입력
    const values = items.map((it) => [
      orderId,
      it.schedule_id,
      it.quantity,
      it.unit_price,
    ]);
    await conn.query(
      `INSERT INTO order_items (order_id, schedule_id, quantity, unit_price)
       VALUES ?`,
      [values]
    );

    // 3) 금액 계산
    const subtotal = items.reduce(
      (sum, it) => sum + it.unit_price * it.quantity,
      0
    );
    const used_point = Number(discounts.used_point || 0);
    const coupon_id = discounts.coupon_id || null;

    // 쿠폰 금액(%) 계산 (주문 금액 기준)
    let coupon_discount = 0;
    if (coupon_id) {
      const [[ctRow]] = await conn.query(
        `
        SELECT ct.discount_type, ct.discount_value, ct.discount_amount
        FROM coupons c
        JOIN coupon_templates ct ON c.template_id = ct.id
        WHERE c.id = ? AND c.is_used = 0
        LIMIT 1
      `,
        [coupon_id]
      );
      if (ctRow) {
        if (ctRow.discount_type === "fixed") {
          coupon_discount = Number(ctRow.discount_amount || 0);
        } else if (ctRow.discount_type === "percent") {
          const p = Number(ctRow.discount_value || 0);
          coupon_discount = Math.floor((subtotal * p) / 100);
        }
      }
    }

    const total_amount = Math.max(0, subtotal - used_point - coupon_discount);

    // 4) 결제 생성
    const [payRes] = await conn.query(
      `INSERT INTO payments
       (user_id, amount, currency, payment_method, status, created_at, updated_at, toss_payment_key, toss_order_id)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)`,
      [
        userId,
        payment.amount,
        payment.currency,
        payment.payment_method,
        payment.status, // 'paid' 또는 '완료'
        payment.toss_payment_key || null,
        payment.toss_order_id || null,
      ]
    );
    const paymentId = payRes.insertId;

    // 5) 주문-결제 연결 + 금액/할인 반영 + 상태 paid
    await conn.query(
      `UPDATE orders
       SET payment_id = ?, total_amount = ?, used_point = ?, coupon_id = ?, order_status = 'paid', updated_at = NOW()
       WHERE id = ?`,
      [paymentId, total_amount, used_point, coupon_id, orderId]
    );

    // 6) 쿠폰 사용 처리 (있으면)
    if (coupon_id) {
      await conn.query(`UPDATE coupons SET is_used = 1 WHERE id = ?`, [
        coupon_id,
      ]);
    }
    // 7) 포인트 차감 처리 (있으면)
    if (used_point > 0) {
      await conn.query(
        `INSERT INTO points (user_id, change_type, amount, description, created_at)
         VALUES (?, '사용', ?, '주문 결제 차감', NOW())`,
        [userId, used_point]
      );
    }

    // 8) 검증: 최소 1개 아이템 & 결제-주문 매핑 보장
    const [[check]] = await conn.query(
      `SELECT
         (SELECT COUNT(*) FROM order_items WHERE order_id = ?) AS item_count,
         (SELECT payment_id FROM orders WHERE id = ?) AS linked_payment_id
       `,
      [orderId, orderId]
    );
    if (
      !check ||
      Number(check.item_count) <= 0 ||
      Number(check.linked_payment_id) !== paymentId
    ) {
      throw new Error("트랜잭션 내부 정합성 실패 (아이템/결제 매핑)");
    }

    await conn.commit();

    const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);
    return { orderId, paymentId, totalQuantity, totalAmount: total_amount };
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {}
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { finalizeCheckoutAtomic };
