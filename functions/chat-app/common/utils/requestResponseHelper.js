// utils/requestResponseHelper.js

const MAX_MESSAGE_LENGTH = 300;
const validActions = ['sendMessage', 'getQuestion'];

class ClientError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ClientError';
  }
}

function parseClientMessage(eventBody) {
  try {
    const body = JSON.parse(eventBody);
    const { action, data: clientMessage } = body;

    if (!action || clientMessage === undefined) {
      throw new ClientError('Missing action or message data');
    }

    if (typeof clientMessage !== 'string' || clientMessage.trim() === '') {
      throw new ClientError('빈 문자열을 입력하셨습니다. 다시 입력 바랍니다.');
    }
    if (clientMessage.length > MAX_MESSAGE_LENGTH) {
      throw new ClientError('허용된 입력 글자수를 초과하였습니다. 다시 입력 바랍니다.');
    }
    if (!validActions.includes(action)) {
      throw new ClientError(`Invalid action type - ${action}`);
    }

    return { action, clientMessage };
  } catch (error) {
    // JSON 구문 오류일 경우에도 오류 메시지 구체적으로 전달
    if (error instanceof SyntaxError) {
      return { action: null, clientMessage: null, error: 'JSON 형식이 잘못되었습니다.' };
    }
    throw error;
  }
}

// createChatbotRequestMessage는 메시지그대로 반환하지만,,리팩토링 할 가능성이 있어서 일단 구조변경에 용이하도록 함수로 만들어둠

// 요청 객체 생성
function createChatbotRequest(inputMessage, chatHistory, pendingFields) {
  return {
    inputMessage,
    chat_history: chatHistory,
    pending_fields: pendingFields,
  };
}

// 요청 메시지 생성
function createChatbotRequestMessage(inputMessage, pendingFields) {
  return {
    inputMessage,
    pendingFields,
  };
}

// 응답 객체 파싱
function parseChatbotResponse(response) {
  const { intent, language, response: botResponse } = response;

  if (!botResponse) {
    throw new Error("Response does not contain a valid 'response' field.");
  }

  let parsedUpdatedFields = {};
  try {
    // JSON 문자열 파싱
    const parsedBotResponse = JSON.parse(botResponse);

    if (parsedBotResponse.updatedFields) {
      parsedUpdatedFields = parsedBotResponse.updatedFields;
    }
  } catch (error) {
    console.error('Failed to parse botResponse as JSON:', error.message);
  }

  return {
    botResponse,
    language: language || 'korean',
    intent: intent || '3',
    updatedFields: parsedUpdatedFields,
  };
}

module.exports = {
  createChatbotRequest,
  createChatbotRequestMessage,
  parseChatbotResponse,
  parseClientMessage,
  ClientError,
};
