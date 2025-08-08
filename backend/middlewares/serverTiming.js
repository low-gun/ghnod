const onHeaders = require("on-headers");

module.exports = function serverTiming(req, res, next) {
  const start = process.hrtime.bigint();
  const marks = [];
  req.mark = (name) => {
    const now = process.hrtime.bigint();
    marks.push({ name, dur: Number(now - start) / 1e6 }); // ms
  };

  // ⬇️ 헤더가 쓰이기 직전에 Server-Timing을 세팅
  onHeaders(res, () => {
    const total = Number(process.hrtime.bigint() - start) / 1e6;
    const header = [
      ...marks.map((m) => `${m.name};dur=${m.dur.toFixed(1)}`),
      `total;dur=${total.toFixed(1)}`,
    ].join(", ");
    res.setHeader("Server-Timing", header);
  });

  // 로그는 응답 종료 후
  const finish = () => {
    const total = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(
      `[${req.method}] ${req.originalUrl} ${res.statusCode} - ${total.toFixed(1)}ms`,
      Object.fromEntries(marks.map((m) => [m.name, `${m.dur.toFixed(1)}ms`]))
    );
  };
  res.on("finish", finish);
  res.on("close", finish);

  next();
};
