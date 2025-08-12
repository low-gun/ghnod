// CommonJS 기준
const axios = require("axios");

exports.confirmToss = async (req, res) => {
  const { paymentKey, orderId, amount } = req.body;
  if (!paymentKey || !orderId || typeof amount !== "number") {
    return res
      .status(400)
      .json({ success: false, error: "필수 파라미터 누락" });
  }

  try {
    const secret = process.env.TOSS_SECRET_KEY; // test_sk_... (Azure 환경변수)
    if (!secret)
      return res
        .status(500)
        .json({ success: false, error: "서버 시크릿키 미설정" });

    const basic = Buffer.from(`${secret}:`).toString("base64");

    const { data, headers } = await axios.post(
      "https://api.tosspayments.com/v1/payments/confirm",
      { paymentKey, orderId: String(orderId), amount: Number(amount) }, // orderId는 문자열 그대로
      {
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/json",
        },
      }
    );

    // TODO: 여기서 주문/결제 DB 업데이트 (orders.payment_id, status=paid 등)
    return res.json({ success: true, data });
  } catch (e) {
    const r = e.response;
    console.error("[TOSS FAIL]", {
      status: r?.status,
      code: r?.data?.code,
      message: r?.data?.message,
      trace: r?.headers?.["x-tosspayments-trace-id"],
    });
    return res.status(r?.status || 500).json({
      success: false,
      code: r?.data?.code,
      error: r?.data?.message || e.message,
    });
  }
};
