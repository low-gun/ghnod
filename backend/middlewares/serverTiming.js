// /backend/middlewares/serverTiming.js
module.exports = function serverTiming(req, res, next) {
  const start = process.hrtime.bigint();
  const marks = [];
  req.mark = (name) => {
    const now = process.hrtime.bigint();
    marks.push({ name, dur: Number(now - start) / 1e6 }); // ms
  };

  res.on("finish", () => {
    const total = Number(process.hrtime.bigint() - start) / 1e6;
    // Server-Timing 헤더 구성
    const header = [
      ...marks.map((m, i) => `${m.name};dur=${m.dur.toFixed(1)}`),
      `total;dur=${total.toFixed(1)}`,
    ].join(", ");
    res.setHeader("Server-Timing", header);

    // 콘솔 로깅
    console.log(
      `[${req.method}] ${req.originalUrl} ${res.statusCode} - ${total.toFixed(1)}ms`,
      marks.reduce(
        (acc, m) => ({ ...acc, [m.name]: `${m.dur.toFixed(1)}ms` }),
        {}
      )
    );
  });

  next();
};
