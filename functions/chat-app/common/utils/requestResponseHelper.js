// utils/requestResponseHelper.js

function parseClientMessage(eventBody) {
  try {
    const body = JSON.parse(eventBody);
    const { action, data: clientMessage } = body;
    if (!action || !clientMessage) {
      throw new Error("Missing action or message data");
    }
    return { action, clientMessage };
  } catch (error) {
    throw new Error("Invalid message format");
  }
}

// 요청 객체 생성
function createChatbotRequest(inputMessage, chatHistory, pendingFields) {
  return {
    inputMessage,
    chat_history: chatHistory,
    pending_fields: pendingFields,
  };
}

// 요청 메시지 생성
function createChatbotRequestMessage(inputMessage) {
  return {
    inputMessage,
  };
}

// 응답 객체 파싱
function parseChatbotResponse(response) {
  const { llmResponse, validatedFields } = response;
  return {
    llmResponse,
    validatedFields: validatedFields || {},
  };
}

module.exports = {
  createChatbotRequest,
  createChatbotRequestMessage,
  parseChatbotResponse,
  parseClientMessage,
};
