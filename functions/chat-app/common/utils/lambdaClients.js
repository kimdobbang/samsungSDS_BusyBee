// utils/lambdaClient.js
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });

async function invokeDisconnectHandler(orderId, connectionId) {
  const disconnectCommand = new InvokeCommand({
    FunctionName: process.env.DISCONNECT_FUNCTION_NAME,
    InvocationType: "Event",
    Payload: JSON.stringify({
      requestContext: {
        connectionId,
      },
      orderId,
    }),
  });

  await lambdaClient.send(disconnectCommand);
  console.log(`$disconnect handler invoked for orderId: ${orderId}`);
}

module.exports = { invokeDisconnectHandler };
