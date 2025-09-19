// SVG アセットが空ファイルになっていないかを検証し、必要なら最小構成で補完するスクリプト

const fs = require("fs");
const path = require("path");

// SVG が格納されているディレクトリ。必要に応じて変更する。
const SVG_DIR = path.join(__dirname, "..", "assets");

// ディレクトリ配下のファイルを再帰的に列挙
function walk(dir) {
  return fs.readdirSync(dir).flatMap((file) => {
    const fullPath = path.join(dir, file);
    return fs.statSync(fullPath).isDirectory() ? walk(fullPath) : fullPath;
  });
}

const svgFiles = walk(SVG_DIR).filter((f) => f.endsWith(".svg"));

// 空の SVG を検出した場合に最小構成のファイルへ差し替える
function ensureSvgContent(filePath) {
  const content = fs.readFileSync(filePath, "utf-8").trim();
  if (content) {
    return;
  }
  console.error(`❌ SVG file is empty: ${filePath}`);
  fs.writeFileSync(
    filePath,
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="none" /></svg>`
  );
  console.log(`✅ Replaced with minimal SVG: ${filePath}`);
}

svgFiles.forEach(ensureSvgContent);
