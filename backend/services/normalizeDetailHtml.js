const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

const AZURE_CS = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

// detail 크기(너비) 기준
const DETAIL_WIDTH = 1200;
const DETAIL_QUALITY = 80;

let containerClient = null;
if (AZURE_CS) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CS);
  containerClient = blobServiceClient.getContainerClient(CONTAINER);
}

// data:image 태그를 찾아 업로드 후 URL로 치환
async function normalizeDetailHtml(html) {
  if (!html || typeof html !== "string") return html || "";

  // data:image 태그가 없으면 그대로 반환
  if (!/src=["']data:image\//i.test(html)) return html;

  // 모든 data:image src 추출
  const IMG_TAG_RE = /<img\b[^>]*?\bsrc=["'](data:image\/[^"']+)["'][^>]*>/gi;

  const tasks = [];
  const replacements = []; // { from:string, to:string }

  let m;
  while ((m = IMG_TAG_RE.exec(html)) !== null) {
    const dataUrl = m[1];
    // 이미 처리된 동일 문자열은 건너뜀
    if (replacements.find(r => r.from === dataUrl)) continue;

    tasks.push(
      (async () => {
        try {
          // data:image/png;base64,xxxxx
          const [, mime, b64] = dataUrl.match(/^data:([^;]+);base64,(.+)$/i) || [];
          if (!mime || !b64) return;

          const buf = Buffer.from(b64, "base64");
          // detail 사이즈 webp 변환
          const out = await sharp(buf).resize({ width: DETAIL_WIDTH }).webp({ quality: DETAIL_QUALITY }).toBuffer();

          if (!containerClient) {
            // 스토리지 없는 환경이면 dataURL 삭제(또는 /images/no-image.png로 대체)
            replacements.push({ from: dataUrl, to: "/images/no-image.png" });
            return;
          }

          const name = `${Date.now()}-${uuidv4()}-detail-from-dataurl.webp`;
          const blob = containerClient.getBlockBlobClient(name);
          await blob.uploadData(out, { blobHTTPHeaders: { blobContentType: "image/webp" } });

          replacements.push({ from: dataUrl, to: blob.url });
        } catch (e) {
          console.error("normalizeDetailHtml error:", e?.message);
          // 실패 시 placeholder
          replacements.push({ from: dataUrl, to: "/images/no-image.png" });
        }
      })()
    );
  }

  await Promise.all(tasks);

  // 문자열 치환(많아도 O(n)로 처리)
  let outHtml = html;
  for (const { from, to } of replacements) {
    // 안전치환: 특수문자 이스케이프
    const esc = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    outHtml = outHtml.replace(new RegExp(esc, "g"), to);
  }
  return outHtml;
}

module.exports = { normalizeDetailHtml };
