const { SNS } = require("aws-sdk");
import type { Appointment } from "../models/appointment";

const sns = new SNS();
const TopicArn = process.env.SNS_TOPIC_ARN as string;

/**
 * @param {Appointment} appointment
 */
const publishToSNS = async (appointment: Appointment): Promise<void> => {
  await sns
    .publish({
      TopicArn,
      Message: JSON.stringify(appointment),
      MessageAttributes: {
        countryISO: {
          DataType: "String",
          StringValue: appointment.countryISO,
        },
      },
    })
    .promise();
};

module.exports = { publishToSNS };
