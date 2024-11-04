// utils/apiGatewayClient.js
// WebSocket 연결을 통해 클라이언트에게 메시지를 전송하는 유틸리티 함수

const {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");

const apigatewayManagementApi = new ApiGatewayManagementApiClient({
    endpoint: `https://${process.env.DOMAIN_NAME}/${process.env.STAGE}`,
});

function sendMessageToClient(connectionId, message) {
    try {
        const command = new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: Buffer.from(JSON.stringify(message)),
        });
        apigatewayManagementApi.send(command);
        console.log(
            `Message sent to ConnectionId: ${connectionId}, Data: ${message}`
        );
    } catch (error) {
        if (error.$metadata?.httpStatusCode == 410) {
            // 연결 끊어진 경우 처리(connection id 삭제)
            deleteConnection(connectionId);
            console.error(
                `Client disconnected(410) - deleting ConnectionId: ${connectionId}`
            );
        } else {
            console.error(
                `Error sending message to ConnectionId: ${connectionId}`,
                error
            );
        }
    }
}

module.exports = { sendMessageToClient };
