import type { SQSEvent, SQSRecord } from "aws-lambda";
import { Appointment } from "../models/appointment";
const { saveAppointmentRDS } = require('../services/rdsService');
const { sendToSQS } = require('../services/sqsService');

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('====== VARIABLES DE ENTORNO ======');
  console.log('SQS_CONFIRMATIONS_URL:', process.env.SQS_CONFIRMATIONS_URL);
  console.log('APPOINTMENTS_TABLE:', process.env.APPOINTMENTS_TABLE);
  console.log('=================================');

  for (const record of event.Records) {
    await processRecord(record);
  }
};

const processRecord = async (record: SQSRecord) => {
  try {
    const appointmentData: Appointment = JSON.parse(record.body);
    console.log('Datos de la cita procesados (CL):', appointmentData);

    // Guardar en RDS_CL
    await saveAppointmentRDS(appointmentData);
    console.log(`Cita ${appointmentData.appointmentId} guardada/ignorada en RDS.`);

    // Enviar mensaje a SQS_CONFIRMATIONS
    await sendToSQS(process.env.SQS_CONFIRMATIONS_URL!, {
      appointmentId: appointmentData.appointmentId,
      insuredId: appointmentData.insuredId,
      scheduleId: appointmentData.scheduleId,
      countryISO: appointmentData.countryISO,
      status: "completed"
    });
    console.log(`Mensaje enviado a SQS_CONFIRMATIONS para ${appointmentData.appointmentId}`);

  } catch (error) {
    console.error('Error al procesar el registro CL:', {
      messageId: record.messageId,
      body: record.body,
      error,
    });
    throw error;
  }
};
