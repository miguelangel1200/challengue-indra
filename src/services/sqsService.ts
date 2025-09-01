// src/services/sqsService.ts
const { SQS } = require("aws-sdk");

/**
 * @param {string} queueUrl
 * @param {any} message
 */
const sqs = new SQS();

const sendToSQS = async (queueUrl: string, message: any): Promise<void> => {
  await sqs
    .sendMessage({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    })
    .promise();
};

module.exports = { sendToSQS };
