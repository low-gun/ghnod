const db = require("../config/db");

module.exports = async function trackVisitor(req, res, next) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  try {
    await db.query(
      `INSERT INTO visit_logs (ip_address, visited_at) VALUES (?, NOW())`,
      [ip]
    );
  } catch (err) {
    console.error("❌ 방문자 IP 기록 실패:", err);
  }

  next();
};
