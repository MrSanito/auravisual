const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../node_modules/@neondatabase/serverless/index.js");
const content = fs.readFileSync(filePath, "utf8");

const pos = content.indexOf("newClient(e){");
if (pos === -1) {
  console.log("newClient not found");
} else {
  console.log("Found newClient at pos:", pos);
  console.log(content.substring(pos - 3000, pos));
}
