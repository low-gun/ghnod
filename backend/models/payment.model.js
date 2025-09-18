const db = require("../config/db");

exports.getPaymentHistoryByUser = async (userId) => {
  // 1) orders만 우선 조회
  // 1) orders ↔ payments 조인: 실제 결제 금액/상태/수단/시각은 payments 기준
const [orders] = await db.query(
  `
  SELECT 
    o.id          AS order_id,
    p.id          AS payment_id,
    p.amount      AS amount,            -- ✅ 실제 결제 금액
    o.used_point,
    COALESCE(
      o.coupon_discount,
      (
        SELECT CASE 
          WHEN ct.discount_type = 'fixed'   THEN ct.discount_amount
          WHEN ct.discount_type = 'percent' THEN FLOOR(o.total_amount * ct.discount_value / 100)
          ELSE 0 END
        FROM coupons c
        JOIN coupon_templates ct ON c.template_id = ct.id
        WHERE c.id = o.coupon_id
        LIMIT 1
      )
    )            AS coupon_discount,    -- ✅ orders.coupon_discount 우선, 없으면 계산
    p.status     AS status,             -- ✅ 결제 상태는 payments 기준
    p.payment_method,                   -- ✅ 결제 수단도 payments 기준
    p.created_at AS created_at          -- ✅ 목록시간도 결제시각 기준
  FROM orders o
  JOIN payments p ON p.id = o.payment_id
  WHERE o.user_id = ?
    AND o.order_status IN ('paid','refunded')
    AND TRIM(LOWER(p.status)) IN ('paid','refunded')
  ORDER BY p.created_at DESC
  `,
  [userId]
);


  if (orders.length === 0) return [];

  // 2) order_id 기준으로 items 조회
  const orderIds = orders.map(o => o.order_id);
  let items = [];
  if (orderIds.length > 0) {
    const placeholders = orderIds.map(() => "?").join(",");
    const [rows] = await db.query(
      `
SELECT 
  oi.order_id,
  s.id    AS schedule_id,
  s.title AS schedule_title,
  p.title AS product_title,     -- ✅ 상품명 추가
  p.type  AS product_type,
  oi.quantity
FROM order_items oi
LEFT JOIN schedules s ON oi.schedule_id = s.id
LEFT JOIN products p ON s.product_id = p.id
WHERE oi.order_id IN (${placeholders})

      `,
      orderIds
    );
    items = rows;
  }

  // 3) orderId별 items 합치기
  const itemsByOrder = {};
  for (const it of items) {
    if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
    itemsByOrder[it.order_id].push(it);
  }

  return orders.map(o => ({
    ...o,
    items: itemsByOrder[o.order_id] || []
  }));
};
