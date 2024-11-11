// handlers/connect.js
const { updateConnection, getSessionData } = require("../common/ddb/dynamoDbClient");
const { invokeDefaultHandler } = require("../common/utils/lambdaClients");

module.exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const orderId = event.queryStringParameters?.orderId;

  console.log(`연결 성공 - ConnectionId: ${connectionId}, OrderId: ${orderId}`);

  try {
    if (!orderId || !connectionId) {
      throw new Error("Missing orderId or connectionId");
    }

    const existingSessionData = await getSessionData(orderId);
    if (!existingSessionData) {
      throw new Error("Session data not found");
    }

    await updateConnection(orderId, connectionId, true);
    await invokeDefaultHandler(connectionId, existingSessionData);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Connected - ConnectionId: ${connectionId}`,
      }),
    };
  } catch (error) {
    console.log(`Error during connection process for ConnectionId: ${connectionId}`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
