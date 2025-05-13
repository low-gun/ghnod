const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

async function generateCertificatePdf({ html, filename }) {
  const browser = await puppeteer.launch({
    headless: "new", // 최신버전 puppeteer에서 이렇게 해야 에러 안 남
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // 서버 배포 대비
  });

  const page = await browser.newPage();

  // HTML 코드 렌더링
  await page.setContent(html, { waitUntil: "networkidle0" });

  // 파일 저장 경로
  const savePath = path.resolve(__dirname, "..", "uploads", "certificates");
  if (!fs.existsSync(savePath)) {
    fs.mkdirSync(savePath, { recursive: true });
  }

  const filePath = path.join(savePath, filename);

  // PDF 저장
  await page.pdf({
    path: filePath,
    format: "A4",
    printBackground: true,
    margin: { top: "30px", bottom: "30px", left: "30px", right: "30px" },
  });

  await browser.close();

  return filePath; // 생성된 파일 경로 반환
}

module.exports = { generateCertificatePdf };
