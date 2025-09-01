import * as mysql from 'mysql2/promise';
import { Appointment } from '../models/appointment';
import { EventBridge } from 'aws-sdk'; // <-- Usamos EventBridge

const eventBridge = new EventBridge({ region: 'us-east-2' });
const connections: { [key: string]: mysql.Connection } = {};

/**
 * Obtiene una conexión a la base de datos para el país especificado.
 * @param {"PE" | "CL"} countryISO
 * @returns {Promise<mysql.Connection>}
 */
export const getConnection = async (countryISO: "PE" | "CL"): Promise<mysql.Connection> => {
  if (connections[countryISO]) {
    return connections[countryISO];
  }

  const config = {
    host: countryISO === "PE" ? process.env.DB_PE_HOST : process.env.DB_CL_HOST,
    port: Number(countryISO === "PE" ? process.env.DB_PE_PORT : process.env.DB_CL_PORT),
    user: countryISO === "PE" ? process.env.DB_PE_USER : process.env.DB_CL_USER,
    password: countryISO === "PE" ? process.env.DB_PE_PASS : process.env.DB_CL_PASS,
    database: countryISO === "PE" ? process.env.DB_PE_NAME : process.env.DB_CL_NAME,
  };

  connections[countryISO] = await mysql.createConnection(config);
  return connections[countryISO];
};

/**
 * Guarda una cita en RDS y luego publica un evento de confirmación en EventBridge.
 * @param {Appointment} appointment
 */
export const saveAppointmentRDS = async (appointment: Appointment): Promise<void> => {
  const conn = await getConnection(appointment.countryISO);

  const centerId = 1, specialtyId = 1, medicId = 1;

  const query = `
    INSERT IGNORE INTO appointments 
    (appointment_id, insured_id, schedule_id, country_iso, status, center_id, specialty_id, medic_id, appointment_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    appointment.appointmentId,
    appointment.insuredId,
    appointment.scheduleId,
    appointment.countryISO,
    appointment.status ?? "pending",
    centerId,
    specialtyId,
    medicId,
    appointment.createdAt,
  ];

  try {
    console.log('Ejecutando INSERT IGNORE en RDS...');
    await conn.execute(query, values);
    console.log(`Cita ${appointment.appointmentId} guardada/ignorada en RDS.`);

    // --- LÓGICA PARA PUBLICAR EN EVENTBRIDGE ---
    const eventParams = {
      Entries: [
        {
          Source: 'rimac.appointments',
          DetailType: 'Appointment Confirmed',
          Detail: JSON.stringify({
            insuredId: appointment.insuredId,
            scheduleId: appointment.scheduleId,
          }),
          EventBusName: process.env.EVENT_BUS_NAME!,
        },
      ],
    };

    console.log('Enviando evento a EventBridge:', eventParams);
    await eventBridge.putEvents(eventParams).promise();
    console.log('Evento enviado a EventBridge exitosamente.');

  } catch (error) {
    console.error('Error en saveAppointmentRDS:', error);
    throw error;
  }
};