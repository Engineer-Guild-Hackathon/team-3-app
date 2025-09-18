// scripts/validate-svgs.js

const fs = require("fs");
const path = require("path");

const SVG_DIR = path.join(__dirname, "..", "assets"); // adjust if your SVGs are in a different folder

function walk(dir) {
  return fs.readdirSync(dir).flatMap((file) => {
    const fullPath = path.join(dir, file);
    return fs.statSync(fullPath).isDirectory() ? walk(fullPath) : fullPath;
  });
}

const svgFiles = walk(SVG_DIR).filter((f) => f.endsWith(".svg"));

svgFiles.forEach((file) => {
  const content = fs.readFileSync(file, "utf-8").trim();
  if (!content) {
    console.error(`❌ SVG file is empty: ${file}`);
    fs.writeFileSync(
      file,
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="none" /></svg>`
    );
    console.log(`✅ Replaced with minimal SVG: ${file}`);
  }
});
