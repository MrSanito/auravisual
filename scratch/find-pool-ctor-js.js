const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../node_modules/@neondatabase/serverless/index.js");
const content = fs.readFileSync(filePath, "utf8");

const keyword = "class Pool_2";
let pos = content.indexOf(keyword);
if (pos === -1) {
  pos = content.indexOf("Pool_2 = class");
}
if (pos === -1) {
  console.log("Pool_2 not found");
} else {
  console.log("Found Pool_2 at pos:", pos);
  console.log(content.substring(pos - 500, pos + 1500));
}
