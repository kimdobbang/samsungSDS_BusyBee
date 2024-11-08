const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient();

module.exports.responsedDataReplication = async (event) => {
  for (const record of event.Records) {
    if (record.eventName === "INSERT" || record.eventName === "MODIFY") {
      const newData = AWS.DynamoDB.Converter.unmarshall(
        record.dynamodb.NewImage
      );

      try {
        const parsedData = JSON.parse(newData.data);

        const {
          Weight,
          ContainerSize,
          DepartureDate,
          ArrivalDate,
          DepartureCity,
          ArrivalCity,
        } = parsedData;

        if (
          Weight === 0 ||
          ContainerSize === 0 ||
          [DepartureDate, ArrivalDate, DepartureCity, ArrivalCity].some(
            (field) => field === "" || field === "unknown"
          )
        ) {
          console.log("조건에 맞는 데이터 발견");

          const formattedData = {
            orderId: newData.Id,
            sender: newData.sender,
            connectionId: "",
            isSessionActive: false,
            sessionStatus: "inProgress",
            chatHistory: [],
            lastInteractionTimestamp: "",
            pendingFields: {},
            responsedData: parsedData,
          };

          const requiredFields = [
            "Weight",
            "ContainerSize",
            "DepartureDate",
            "ArrivalDate",
            "ArrivalCity",
            "DepartureCity",
          ];
          requiredFields.forEach((field) => {
            if (!formattedData.responsedData[field]) {
              formattedData.pendingFields[field] = "omission";
            } else if (formattedData.responsedData[field] === "unknown") {
              formattedData.pendingFields[field] = "unknown";
            } else if (formattedData.responsedData[field] === "0") {
              formattedData.pendingFields[field] = "omission";
            }
          });

          const params = {
            TableName: "chat-app-CustomerChatSessions",
            Item: formattedData,
          };

          // DynamoDB에 데이터 삽입
          await dynamoDB.put(params).promise();
          console.log("데이터 삽입 완료");
        }
      } catch (error) {
        console.error("JSON 파싱 오류:", error.message);
      }
    }
  }
};
