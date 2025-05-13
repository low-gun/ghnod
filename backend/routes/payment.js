const express = require("express");
const router = express.Router();
const db = require("../config/db");

/**
 * [GET] /api/admin/payments
 * 전체 결제 목록 조회
 */
router.get("/", async (req, res) => {
  try {
    const [payments] = await db.query(`
      SELECT 
        p.id AS payment_id,
        p.amount,
        p.status,
        p.payment_method,
        p.created_at,
        p.updated_at,
        u.username,
        u.email,
        o.total_amount,
        o.used_point,
        (
          SELECT ct.discount_amount
          FROM coupons c
          JOIN coupon_templates ct ON c.template_id = ct.id
          WHERE c.id = o.coupon_id
          LIMIT 1
        ) AS coupon_discount,
        (
          SELECT SUM(quantity)
          FROM order_items
          WHERE order_id = o.id
        ) AS total_quantity,
        o.id AS order_id
      FROM payments p
      JOIN orders o ON p.id = o.payment_id
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);

    return res.json({ success: true, payments });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "결제 목록 조회 실패" });
  }
});

/**
 * [GET] /api/admin/payments/:id
 * 특정 결제 내역 상세 조회
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [payment] = await db.query(
      `
      SELECT 
        p.id AS payment_id,
        p.amount,
        p.status,
        p.payment_method,
        p.created_at,
        p.updated_at,
        u.username,
        u.email,
        o.total_amount,
        o.used_point,
        (
          SELECT ct.discount_amount
          FROM coupons c
          JOIN coupon_templates ct ON c.template_id = ct.id
          WHERE c.id = o.coupon_id
          LIMIT 1
        ) AS coupon_discount,
        (
          SELECT SUM(quantity)
          FROM order_items
          WHERE order_id = o.id
        ) AS total_quantity,
        o.id AS order_id,
        p.admin_memo
      FROM payments p
      JOIN orders o ON p.id = o.payment_id
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `,
      [id]
    );

    if (payment.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "결제 내역을 찾을 수 없습니다." });
    }
    return res.json({ success: true, payment: payment[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "결제 내역 조회 실패" });
  }
});

/**
 * [POST] /api/admin/payments/charge
 * 결제 생성
 */
router.post("/charge", async (req, res) => {
  try {
    const { user_id, amount, cardNumber, expiry, cvc } = req.body;
    const [result] = await db.query(
      `
      INSERT INTO payments (user_id, amount, status, payment_method, created_at)
      VALUES (?, ?, 'paid', 'credit_card', NOW())
    `,
      [user_id, amount]
    );
    const newPaymentId = result.insertId;
    const [rows] = await db.query("SELECT * FROM payments WHERE id = ?", [
      newPaymentId,
    ]);

    return res.json({
      success: true,
      message: "가짜 결제가 완료되었습니다!",
      payment: rows[0],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "결제 생성에 실패했습니다." });
  }
});

/**
 * [PUT] /api/admin/payments/:id/status
 * 결제 상태 변경
 */
router.put("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { new_status } = req.body;
  try {
    const [existing] = await db.query(
      "SELECT status FROM payments WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "결제 내역을 찾을 수 없습니다." });
    }

    const old_status = existing[0].status;
    await db.query(
      "UPDATE payments SET status = ?, updated_at = NOW() WHERE id = ?",
      [new_status, id]
    );
    await db.query(
      `
      INSERT INTO payment_history (payment_id, old_status, new_status, changed_at)
      VALUES (?, ?, ?, NOW())
    `,
      [id, old_status, new_status]
    );

    return res.json({ success: true, message: "결제 상태가 변경되었습니다." });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "결제 상태를 변경하지 못했습니다.",
    });
  }
});

/**
 * [DELETE] /api/admin/payments/:id
 * 결제 내역 삭제
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.query("SELECT * FROM payments WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "결제 내역을 찾을 수 없습니다." });
    }

    await db.query("DELETE FROM payments WHERE id = ?", [id]);
    return res.json({
      success: true,
      message: "결제 내역이 삭제되었습니다.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "결제 내역 삭제 실패" });
  }
});
router.put("/:id/memo", async (req, res) => {
  const { id } = req.params;
  const { memo } = req.body;

  try {
    await db.query("UPDATE payments SET admin_memo = ? WHERE id = ?", [
      memo,
      id,
    ]);
    res.json({ success: true, message: "메모 저장됨" });
  } catch (err) {
    console.error("❌ 메모 저장 실패:", err);
    res.status(500).json({ success: false, message: "메모 저장 실패" });
  }
});

module.exports = router;
