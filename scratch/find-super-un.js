const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../node_modules/@neondatabase/serverless/index.js");
const content = fs.readFileSync(filePath, "utf8");

let pos = 0;
while (true) {
  pos = content.indexOf("Un", pos);
  if (pos === -1) break;
  console.log(`\nMatch at position ${pos}:`);
  console.log(content.substring(Math.max(0, pos - 100), Math.min(content.length, pos + 100)));
  pos += 2;
}
