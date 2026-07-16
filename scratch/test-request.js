const http = require("https");

const data = JSON.stringify({
  email: "admin@example.com",
  password: "admin"
});

const options = {
  hostname: "auravisual.vercel.app",
  port: 443,
  path: "/api/auth/login",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let body = "";
  res.on("data", (chunk) => body += chunk);
  res.on("end", () => {
    console.log("Response:", body);
  });
});

req.on("error", (e) => {
  console.error(e);
});

req.write(data);
req.end();
