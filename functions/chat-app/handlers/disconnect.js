// handlers/disconnect.js

const { markSessionInactive, removeConnectionId } = require("../common/ddb/dynamoDbClient");
const { disconnectClient } = require("../common/utils/apiGatewayClient");

module.exports.handler = async (event) => {
  const { orderId } = JSON.parse(event.body);
  const connectionId = event.requestContext.connectionId;
  console.log(`Disconnected - ConnectionId: ${connectionId}`);

  try {
    await markSessionInactive(orderId);
    console.log(`Order ID ${orderId} successfully marked as inactive.`);
  } catch (error) {
    console.log(`Failed to mark session as inactive for orderId: ${orderId}`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error marking session as inactive" }),
    };
  }

  try {
    await removeConnectionId(orderId);
    console.log(`connectionId field removed from DynamoDB for orderId: ${orderId}`);
  } catch (error) {
    console.log(`Failed to remove connectionId for orderId: ${orderId}`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error removing connectionId" }),
    };
  }

  try {
    await disconnectClient(connectionId);
    console.log(`Connection ${connectionId} has been forcefully disconnected.`);
  } catch (error) {
    console.log(`Failed to disconnect client for connectionId: ${connectionId}`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error disconnecting client" }),
    };
  }

  return {
    statusCode: 200,
    body: `완죠니 연결종료 - orderId: ${JSON.stringify(orderId)}`,
  };
};

module.exports.disconnectSession = async function (orderId, connectionId) {
  return await module.exports.handler({ body: JSON.stringify({ orderId, connectionId }) });
};
