const { HttpRequest } = require("@aws-sdk/protocol-http");
const { NodeHttpHandler } = require("@aws-sdk/node-http-handler");

async function makeApiRequest(url, data) {
  const { hostname, pathname, search } = new URL(url);
  const request = new HttpRequest({
    protocol: "https:",
    hostname,
    path: pathname + search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const client = new NodeHttpHandler();
  try {
    const { response } = await client.handle(request);
    console.log("Received response status:", response.statusCode);
    console.log("Received response headers:", response.headers);

    const responseData = await new Promise((resolve, reject) => {
      let data = "";
      response.body.on("data", (chunk) => {
        console.log("Received chunk:", chunk.toString());
        data += chunk;
      });
      response.body.on("end", () => {
        if (!data) {
          console.error("Error: No data received in response.");
          // reject(new Error("No data received in response.")); // dev
          resolve({ llmResponse: "LLM 응답 없음 - 디버깅 위해 없어도 응답보내게 해둠" }); // 디버깅용
        } else {
          try {
            console.log("Complete response data:", data);
            resolve(JSON.parse(data));
          } catch (error) {
            // reject(new Error("Invalid JSON format in response")); // dev
            resolve({ llmResponse: "ws에서 JSON 파싱 오류 - 디버깅 위해 없어도 응답보내게 해둠" }); // 디버깅용
          }
        }
      });
      response.body.on("error", (error) => {
        console.log("Error receiving response data:", error);
        reject(error);
      });
    });
    console.log(`llmResponse - makeApiRequest 성공: ${JSON.stringify(responseData)} `);
    return responseData;
  } catch (error) {
    console.log("API 요청 실패:", error);
    throw new Error("API 요청 실패");
  }
}

module.exports = { makeApiRequest };
