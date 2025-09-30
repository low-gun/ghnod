// backend/utils/mailer.js
const Brevo = require("@getbrevo/brevo");

const brevoClient = new Brevo.TransactionalEmailsApi();
brevoClient.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

async function sendInquiryMail(inquiry) {
  const {
    title,
    message,
    guest_name,
    guest_email,
    guest_phone,
    company_name,
    department,
    position,
    product_id,
    product_name,   // ✅ inquiry.js에서 조인한 상품명
    created_at,
  } = inquiry;

  // 상품명 조건부 문자열
  const productInfo = product_id
    ? `상품명: ${product_name || product_id}\n`
    : "";

  // 버튼 링크 (상품 문의일 경우 상품 상세로, 없으면 마이페이지 문의로)
  const buttonLink = "https://orpconsulting.co.kr";

  // 텍스트 버전 (plain text)
  const textContent = `
제목: ${title}

내용:
${message}

이름: ${guest_name || ""}
이메일: ${guest_email || ""}
전화번호: ${guest_phone || ""}
회사명: ${company_name || ""}
부서: ${department || ""}
직책: ${position || ""}
${productInfo}등록 시각: ${created_at}
링크: ${buttonLink}
`;

  // HTML 버전 (가독성 향상 + UTF-8 명시)
  const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
</head>
<body style="font-family: '맑은 고딕', Arial, sans-serif; line-height: 1.6; color: #333;">
  ${product_id ? `<p><strong>상품명:</strong> ${product_name || product_id}</p>` : ""}
  <p><strong>제목:</strong> ${title}</p>
  <p><strong>내용:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>
  <hr/>
  <p><strong>이름:</strong> ${guest_name || ""}</p>
  <p><strong>이메일:</strong> ${guest_email || ""}</p>
  <p><strong>전화번호:</strong> ${guest_phone || ""}</p>
  <p><strong>회사명:</strong> ${company_name || ""}</p>
  <p><strong>부서:</strong> ${department || ""}</p>
  <p><strong>직책:</strong> ${position || ""}</p>
  <p><strong>등록 시각:</strong> ${created_at}</p>
  <div style="margin-top:20px;">
    <a href="${buttonLink}" target="_blank"
       style="display:inline-block;padding:10px 20px;
              background-color:#2563eb;color:#fff;
              border-radius:6px;text-decoration:none;
              font-weight:500;">
      이동하기
    </a>
  </div>
</body>
</html>
`;

  // ✅ 수신자 파싱 보강 (콤마, 세미콜론, 공백 모두 허용)
  const recipients = String(process.env.ADMIN_MAIL || "")
    .split(/[;,]/)
    .map((e) => e.trim())
    .filter(Boolean);

  const sendSmtpEmail = {
    sender: { email: process.env.BREVO_USER },
    to: recipients.map((email) => ({ email })), // 여러 수신자 지원
    subject: `[orpconsulting] 문의등록: ${title}`,
    textContent,
    htmlContent,
  };

  try {
    const result = await brevoClient.sendTransacEmail(sendSmtpEmail);
    console.log("📧 Brevo 메일 발송 성공:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ 문의 메일 발송 오류:", error?.response?.body || error);
  }
}

module.exports = { sendInquiryMail };
