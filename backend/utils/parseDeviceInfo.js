// backend/utils/parseDeviceInfo.js

function parseDeviceInfo(userAgent) {
  if (!userAgent) return "Unknown Device";

  const ua = userAgent.toLowerCase();

  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("android")) return "Android";
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("macintosh")) return "Mac";
  if (ua.includes("windows")) return "Windows PC";
  if (ua.includes("linux")) return "Linux";

  return "Unknown Device";
}

module.exports = { parseDeviceInfo };
