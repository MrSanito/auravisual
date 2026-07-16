const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../node_modules/@neondatabase/serverless/index.js");
const content = fs.readFileSync(filePath, "utf8");

const keyword = "newClient(e){";
const pos = content.indexOf(keyword);
if (pos === -1) {
  console.log("Keyword not found");
} else {
  console.log("Found newClient at pos:", pos);
  console.log(content.substring(pos - 1500, pos + 500));
}
