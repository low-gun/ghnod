// backend/utils/nhnAlimtalk.js
const axios = require("axios");

/**
 * 회원가입 인증번호 발송 (알림톡 → 실패 시 대체 SMS 발송)
 * @param {string} phone 수신번호 (숫자만, 예: 01012345678)
 * @param {string} verifyCode 인증번호 (6자리 문자열)
 */
async function sendAlimtalkVerify(phone, verifyCode) {
  const appKey = (
    process.env.NHN_ALIMTALK_APP_KEY ||
    process.env.NHN_ALIMTALK_APPKEY ||
    ""
  ).trim();
  const secretKey = (process.env.NHN_ALIMTALK_SECRET_KEY || "").trim(); // ★ 추가
  const senderKey = (process.env.NHN_ALIMTALK_SENDER_KEY || "").trim();
  const templateCode = (
    process.env.NHN_ALIMTALK_TEMPLATE_CODE_SIGNUP || ""
  ).trim();
  const sendNo = (process.env.NHN_SMS_SEND_NO || "").trim();

  if (!appKey || !secretKey || !senderKey || !templateCode || !sendNo) {
    throw new Error("NHN 알림톡 환경변수가 설정되지 않았습니다.");
  }

  if (!appKey || !senderKey || !templateCode || !sendNo) {
    throw new Error("NHN 알림톡 환경변수가 설정되지 않았습니다.");
  }

  // NHN Cloud 알림톡 API URL
  const alimtalkUrl = `https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/${appKey}/messages`;

  // NHN Cloud에 맞는 형식 (#{인증번호} 변수를 치환)
  const requestBody = {
    senderKey,
    templateCode,
    recipientList: [
      {
        recipientNo: phone,
        templateParameter: {
          인증번호: verifyCode,
        },
      },
    ],
    // 대체 발송 설정
    plusFriendId: "", // 선택
    altSendType: "SMS", // 알림톡 실패 시 SMS
    altSendNo: sendNo,
    altContent: `[오알피컨설팅]\n본인확인 인증번호 : ${verifyCode}`,
  };

  try {
    const response = await axios.post(alimtalkUrl, requestBody, {
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Secret-Key": secretKey, // ★ 필수
      },
      timeout: parseInt(process.env.NHN_TIMEOUT_MS || "10000", 10),
    });

    // NHN 응답 처리
    if (response.data.header && response.data.header.isSuccessful) {
      console.log("✅ 알림톡 발송 요청 성공:", response.data);
    } else {
      console.error("❌ 알림톡 발송 실패:", response.data);
      throw new Error("NHN 알림톡 발송 실패");
    }
  } catch (err) {
    console.error("❌ 알림톡 API 호출 오류:", err.message);
    throw err;
  }
}

module.exports = { sendAlimtalkVerify };
