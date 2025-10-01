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
    product_name,
    created_at,
  } = inquiry;

  const productInfo = product_id
    ? `상품명: ${product_name || product_id}\n`
    : "";

  const buttonLink = "https://orpconsulting.co.kr";

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

  const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
</head>
<body style="font-family:'맑은 고딕',Arial,sans-serif; line-height:1.6; color:#333;">
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
  <div style="margin-top:20px;text-align:center;">
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

  const recipients = String(process.env.ADMIN_MAIL || "")
    .split(/[;,]/)
    .map((e) => e.trim())
    .filter(Boolean);

  const sendSmtpEmail = {
    sender: { email: process.env.BREVO_USER },
    to: recipients.map((email) => ({ email })),
    subject: `[ORP컨설팅] 문의등록: ${title}`,
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

async function sendAnswerMail(inquiry) {
  const {
    title, message, answer,
    guest_email, user_email, guest_name, user_name,
    product_name, created_at, answered_at
  } = inquiry;

  const recipient = user_email || guest_email;
  if (!recipient) return;

  const textContent = `
${user_name || guest_name || "고객"}님 안녕하세요.
문의주신 내용에 답변이 완료되었습니다.

제목: ${title}
${product_name ? `상품명: ${product_name}` : ""}
문의자: ${user_name || guest_name || ""}
이메일: ${user_email || guest_email || ""}

문의일시: ${created_at || "-"}
답변일시: ${answered_at || "-"}

문의 내용:
${message}

답변:
${answer}

※ 이 메일은 발신전용 메일입니다.
추가 문의사항은 홈페이지 내에서 문의해주시기 바랍니다.
`;

  const htmlContent = `
  <div style="font-family:'맑은 고딕',Arial,sans-serif; line-height:1.6; color:#333;">
    <p>${user_name || guest_name || "고객"}님 안녕하세요.<br/>
       문의주신 내용에 답변이 완료되었습니다.</p>
    <div style="background:#f1f5f9;padding:12px;border-radius:6px;margin-bottom:16px;">
      <p><strong>제목:</strong> ${title}</p>
      ${product_name ? `<p><strong>상품명:</strong> ${product_name}</p>` : ""}
      <p><strong>문의자:</strong> ${user_name || guest_name || ""} (${user_email || guest_email || ""})</p>
    </div>
    <h3 style="color:#111827;">문의내용 
      <span style="float:right;font-weight:normal;color:#6b7280;font-size:13px;">
        문의일시: ${created_at || "-"}
      </span>
    </h3>
    <blockquote style="background:#f9fafb;padding:12px;border-left:4px solid #9ca3af;border-radius:4px;">
      ${message.replace(/\n/g,"<br/>")}
    </blockquote>
    <h3 style="color:#111827;margin-top:20px;">문의답변 
      <span style="float:right;font-weight:normal;color:#6b7280;font-size:13px;">
        답변일시: ${answered_at || "-"}
      </span>
    </h3>
    <blockquote style="background:#eef7ff;padding:12px;border-left:4px solid #2563eb;border-radius:4px;">
      ${answer.replace(/\n/g,"<br/>")}
    </blockquote>
    <div style="margin-top:24px; text-align:center;">
      <p style="margin-bottom:8px;color:#374151;">자세한 내용은 홈페이지에서 확인하세요.</p>
      <a href="https://orpconsulting.co.kr" target="_blank"
         style="display:inline-block; padding:12px 24px;
                background-color:#2563eb; color:#fff;
                border-radius:8px; text-decoration:none;
                font-size:15px;font-weight:600;">
        문의 확인하기
      </a>
    </div>
    <p style="margin-top:20px;font-size:12px;color:#6b7280;text-align:center;">
      ※ 이 메일은 발신전용 메일입니다.<br/>
      추가 문의사항은 홈페이지 내에서 문의해주시기 바랍니다.
    </p>
  </div>
`;

  const sendSmtpEmail = {
    sender: { email: process.env.BREVO_USER },
    to: [{ email: recipient }],
    subject: `[ORP컨설팅] 문의답변: ${title}`,
    textContent,
    htmlContent,
  };

  try {
    await brevoClient.sendTransacEmail(sendSmtpEmail);
    console.log("📧 사용자 답변 메일 발송 성공:", recipient);
  } catch (error) {
    console.error("❌ 사용자 답변 메일 발송 오류:", error?.response?.body || error);
  }
}

module.exports = { sendInquiryMail, sendAnswerMail };
