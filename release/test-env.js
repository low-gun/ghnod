require("dotenv").config();

console.log("✅ 환경 변수 테스트");
console.log("PORT:", process.env.PORT);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
