const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../node_modules/@neondatabase/serverless/index.js");
const content = fs.readFileSync(filePath, "utf8");

const keyword = "var Pool =";
let pos = content.indexOf(keyword);
if (pos === -1) {
  pos = content.indexOf("class Pool");
}
if (pos === -1) {
  pos = content.indexOf("exports.Pool =");
}

if (pos === -1) {
  console.log("Pool not found");
} else {
  console.log("Found Pool at pos:", pos);
  console.log(content.substring(pos - 500, pos + 1500));
}
