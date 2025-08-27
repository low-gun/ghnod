// backend/utils/nhnAlimtalk.js
const axios = require("axios");

/**
 * 회원가입 인증번호 발송 (알림톡 요청 → NHN 설정상 실패 시 SMS 대체)
 * @param {string} phone 수신번호 (숫자만, 예: 01012345678)
 * @param {string} verifyCode 인증번호 (6자리 문자열)
 * @returns {{channel: 'alimtalk', requestId?: string, providerResponse?: any}}
 */
async function sendAlimtalkVerify(phone, verifyCode) {
  const appKey = (
    process.env.NHN_ALIMTALK_APP_KEY ||
    process.env.NHN_ALIMTALK_APPKEY ||
    ""
  ).trim();
  const secretKey = (process.env.NHN_ALIMTALK_SECRET_KEY || "").trim();
  const senderKey = (process.env.NHN_ALIMTALK_SENDER_KEY || "").trim();
  const templateCode = (
    process.env.NHN_ALIMTALK_TEMPLATE_CODE_SIGNUP || ""
  ).trim();
  const sendNo = (process.env.NHN_SMS_SEND_NO || "").trim();
  const templateParamName = (
    process.env.NHN_ALIMTALK_TEMPLATE_PARAM_NAME || "인증번호"
  ).trim();

  if (!appKey || !secretKey || !senderKey || !templateCode || !sendNo) {
    throw new Error("NHN 알림톡 환경변수가 설정되지 않았습니다.");
  }

  // NHN Cloud 알림톡 API URL
  const alimtalkUrl = `https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/${appKey}/messages`;

  // NHN Cloud에 맞는 형식 (#{...} 변수를 치환)
  const requestBody = {
    senderKey,
    templateCode,
    recipientList: [
      {
        recipientNo: phone,
        templateParameter: {
          [templateParamName]: verifyCode,
        },
      },
    ],
    // 대체 발송 설정 (알림톡 실패 시 SMS)
    plusFriendId: "",
    altSendType: "SMS",
    altSendNo: sendNo,
    altContent: `[오알피컨설팅]\n본인확인 인증번호 : ${verifyCode}`,
  };

  try {
    const response = await axios.post(alimtalkUrl, requestBody, {
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Secret-Key": secretKey,
      },
      timeout: parseInt(process.env.NHN_TIMEOUT_MS || "10000", 10),
    });

    // NHN 응답 처리 (요청 수락 여부)
    // NHN 응답 처리 (요청 수락 여부)
const isOk = !!(response?.data?.header?.isSuccessful);
const requestId =
  response?.data?.header?.transactionId ||
  response?.data?.header?.resultCode ||
  "";

if (!isOk) {
  console.error("❌ 알림톡 발송 실패:", response?.data);
  throw new Error("NHN 알림톡 발송 실패");
}

// ✅ 실제 발송 채널 판별 (body.data[0] 참고)
const item = Array.isArray(response?.data?.body?.data)
  ? response.data.body.data[0]
  : null;

let channel = "alimtalk";
const sendResult = (item?.sendResult || "").toString().toUpperCase();
const resultMessage = (item?.resultMessage || "").toString().toUpperCase();

// 조건: NHN이 내부적으로 SMS 대체 발송했는지 판별
if (sendResult.includes("SMS") || resultMessage.includes("SMS")) {
  channel = "sms";
}

console.log("✅ 인증번호 발송 요청 성공:", {
  requestId,
  templateCode,
  templateParamName,
  recipient: phone,
  resolvedChannel: channel,
  rawSendResult: item?.sendResult,
  rawResultMessage: item?.resultMessage,
  altSendTypeRequested: "SMS",
});

return {
  channel,            // "alimtalk" | "sms"
  requestId,
  providerResponse: response.data,
};

  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error("❌ 알림톡 API 호출 오류:", { message: err.message, status, data });
    // 요청 자체가 실패하면 NHN 측 대체 발송이 동작하지 않음
    throw err;
  }
}

module.exports = { sendAlimtalkVerify };
