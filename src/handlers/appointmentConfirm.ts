import type { SQSEvent, SQSRecord } from "aws-lambda";
import * as AWS from "aws-sdk";

const ddb = new AWS.DynamoDB.DocumentClient({ region: "us-east-2" });
const eventBridge = new AWS.EventBridge({ region: "us-east-2" });

interface AppointmentKeys {
  appointmentId: string;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log("Evento recibido en appointmentConfirm:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      await processConfirmation(record);
    } catch (error) {
      console.error("Error procesando registro SQS:", {
        messageId: record.messageId,
        body: record.body,
        error,
      });
      // No throw aquí para que no detenga el procesamiento del resto de registros
    }
  }
};

const processConfirmation = async (record: SQSRecord): Promise<void> => {
  const appointmentKeys: AppointmentKeys = JSON.parse(record.body);
  console.log("Procesando confirmación para appointmentId:", appointmentKeys.appointmentId);

  // 1️⃣ Actualizar DynamoDB
  const params = {
    TableName: process.env.APPOINTMENTS_TABLE!,
    Key: { appointmentId: appointmentKeys.appointmentId },
    UpdateExpression: "SET #status = :status",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: { ":status": "completed" },
  };

  await ddb.update(params).promise();
  console.log(`✅ Estado actualizado a 'completed' para ${appointmentKeys.appointmentId}`);

  // 2️⃣ Enviar evento a EventBridge
  const eventParams = {
    Entries: [
      {
        Source: "rimac.appointments",
        DetailType: "Appointment Confirmed",
        Detail: JSON.stringify({ appointmentId: appointmentKeys.appointmentId }),
        EventBusName: "default",
      },
    ],
  };

  await eventBridge.putEvents(eventParams).promise();
  console.log(`✅ Evento enviado a EventBridge para ${appointmentKeys.appointmentId}`);
};
