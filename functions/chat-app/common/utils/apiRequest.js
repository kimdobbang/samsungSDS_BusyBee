// utils/apiRequest.js

const { HttpRequest } = require("@aws-sdk/protocol-http");
const { NodeHttpHandler } = require("@aws-sdk/node-http-handler");
const { saveChat } = require("../common/ddb/dynamoDbClient");
async function makeApiRequest(orderId, url, data) {
  const { hostname, pathname } = new URL(url);
  const request = new HttpRequest({
    protocol: "https:",
    hostname,
    path: pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const client = new NodeHttpHandler();
  try {
    const { response } = await client.handle(request);
    const responseData = await new Promise((resolve, reject) => {
      let data = "";
      response.body.on("data", (chunk) => (data += chunk));
      response.body.on("end", () => resolve(JSON.parse(data)));
      response.body.on("error", reject);
    });
    await saveChat(orderId, chatMessage);
    console.log(`makeApiRequest 성공:${JSON.stringify(responseData)} `);
    return responseData;
  } catch (error) {
    console.log("API 요청 실패:", error);
    throw new Error("API 요청 실패");
  }
}

module.exports = { makeApiRequest };
