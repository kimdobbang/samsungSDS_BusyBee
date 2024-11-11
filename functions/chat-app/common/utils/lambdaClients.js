// utils/lambdaClient.js
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });

// Lambda 호출
async function invokeLambda(functionName, payload) {
  const command = new InvokeCommand({
    FunctionName: functionName,
    InvocationType: "Event",
    Payload: JSON.stringify(payload),
  });
  await lambdaClient.send(command);
  console.log(`Lambda function invoked: ${functionName}`);
}

async function invokeDisconnectHandler(orderId, connectionId) {
  const disconnectCommand = new InvokeCommand({
    FunctionName: process.env.DISCONNECT_FUNCTION_NAME,
    InvocationType: "Event",
    Payload: JSON.stringify({
      orderId,
      connectionId,
    }),
  });

  await lambdaClient.send(disconnectCommand);
  console.log(`$disconnect handler invoked for orderId: ${orderId}`);
}

module.exports = { invokeDisconnectHandler };
