/**
 * 사용법:
 * 1) 백업 먼저:
 *    CREATE TABLE schedules_backup_YYYYMMDD AS SELECT * FROM schedules;
 * 2) 실행:
 *    NODE_ENV=production node backend/scripts/migrate_detail_images.js --limit=50 --dry-run
 *    NODE_ENV=production node backend/scripts/migrate_detail_images.js --limit=50
 */
const path = require("path");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env.production") });

const pool = require("../config/db");

const AZURE_CS = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";
const DETAIL_WIDTH = 1200;
const DETAIL_QUALITY = 80;

let containerClient = null;
if (AZURE_CS) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CS);
  containerClient = blobServiceClient.getContainerClient(CONTAINER);
} else {
  console.warn("⚠️ No Azure connection string. data:image는 /images/no-image.png로 대체됩니다.");
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { limit: 100, dry: false };
  args.forEach((a) => {
    if (a.startsWith("--limit=")) opts.limit = parseInt(a.split("=")[1], 10) || 100;
    if (a === "--dry-run" || a === "--dry") opts.dry = true;
  });
  return opts;
}

async function uploadFromDataUrl(dataUrl) {
  try {
    const [, mime, b64] = dataUrl.match(/^data:([^;]+);base64,(.+)$/i) || [];
    if (!mime || !b64) return "/images/no-image.png";
    const buf = Buffer.from(b64, "base64");
    const out = await sharp(buf).resize({ width: DETAIL_WIDTH }).webp({ quality: DETAIL_QUALITY }).toBuffer();

    if (!containerClient) return "/images/no-image.png";

    const name = `${Date.now()}-${uuidv4()}-detail-from-dataurl.webp`;
    const blob = containerClient.getBlockBlobClient(name);
    await blob.uploadData(out, { blobHTTPHeaders: { blobContentType: "image/webp" } });
    return blob.url;
  } catch (e) {
    console.error("uploadFromDataUrl error:", e?.message);
    return "/images/no-image.png";
  }
}

async function run() {
  const { limit, dry } = parseArgs();
  console.log("▶ options:", { limit, dry });

  // data:image 포함 row 선정
  const [rows] = await pool.query(
    `SELECT id, detail FROM schedules
     WHERE detail LIKE '%src="data:image/%'
        OR detail LIKE "%src='data:image/%"
     ORDER BY id DESC
     LIMIT ?`, [limit]
  );

  console.log(`▶ 대상 rows: ${rows.length}`);
  for (const r of rows) {
    const { id, detail } = r;
    const IMG_RE = /(<img\b[^>]*?\bsrc=["'])(data:image\/[^"']+)(["'][^>]*>)/gi;
    let changed = false;
    const replacements = [];

    let m;
    while ((m = IMG_RE.exec(detail)) !== null) {
      const dataUrl = m[2];
      if (replacements.find(x => x.from === dataUrl)) continue;
      const url = await uploadFromDataUrl(dataUrl);
      replacements.push({ from: dataUrl, to: url });
    }

    let newHtml = detail;
    for (const { from, to } of replacements) {
      const esc = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      newHtml = newHtml.replace(new RegExp(esc, "g"), to);
      changed = true;
    }

    if (changed) {
      console.log(`🛠 id=${id} replace ${replacements.length}개`);
      if (!dry) {
        await pool.query(`UPDATE schedules SET detail = ? WHERE id = ?`, [newHtml, id]);
      }
    } else {
      console.log(`- id=${id} 변경 없음`);
    }
  }

  console.log("✅ 완료");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ migrate failed:", e);
  process.exit(1);
});
