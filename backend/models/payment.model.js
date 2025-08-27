const db = require("../config/db");

exports.getPaymentHistoryByUser = async (userId) => {
  // 1) orders만 우선 조회
  const [orders] = await db.query(
    `
    SELECT 
      o.id AS order_id,
      o.total_amount AS amount,
      o.used_point,
      (
        SELECT CASE 
          WHEN ct.discount_type = 'fixed' THEN ct.discount_amount
          WHEN ct.discount_type = 'percent' THEN FLOOR(o.total_amount * ct.discount_value / 100)
          ELSE 0 END
        FROM coupons c
        JOIN coupon_templates ct ON c.template_id = ct.id
        WHERE c.id = o.coupon_id
        LIMIT 1
      ) AS coupon_discount,
      o.order_status AS status,
      o.payment_method,
      o.created_at
    FROM orders o
    WHERE o.user_id = ?
      AND o.order_status IN ('paid','refunded')
    ORDER BY o.created_at DESC
    `,
    [userId]
  );

  if (orders.length === 0) return [];

  // 2) order_id 기준으로 items 조회
  const orderIds = orders.map(o => o.order_id);
  const [items] = await db.query(
    `
    SELECT 
      oi.order_id,
      s.id AS schedule_id,
      s.title AS schedule_title,
      s.image_url,
      p.type AS product_type,
      oi.quantity
    FROM order_items oi
    LEFT JOIN schedules s ON oi.schedule_id = s.id
    LEFT JOIN products p ON s.product_id = p.id
    WHERE oi.order_id IN (?)
    `,
    [orderIds]
  );

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
