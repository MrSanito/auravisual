const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../node_modules/@neondatabase/serverless/index.js");
const content = fs.readFileSync(filePath, "utf8");

const keyword = "No database host or connection string wa";
const pos = content.indexOf(keyword);
if (pos === -1) {
  console.log("Keyword not found");
} else {
  console.log("Found error check at pos:", pos);
  // Print the surrounding function/class
  console.log(content.substring(pos - 1500, pos + 500));
}
