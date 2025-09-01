// src/services/dynamoService.ts
const { DynamoDB } = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
import type { Appointment } from "../models/appointment";

const dynamo = new DynamoDB.DocumentClient();
const TableName = process.env.APPOINTMENTS_TABLE as string;

/**
 * @param {Appointment} appointment
 * @returns {Promise<Appointment>}
 */
const saveAppointment = async (appointment: Appointment): Promise<Appointment> => {
  const item: Appointment = {
    ...appointment,
    appointmentId: uuidv4(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await dynamo.put({ TableName, Item: item }).promise();
  return item;
};

/**
 * @param {string} appointmentId
 * @param {"pending"|"completed"} status
 */
const updateAppointmentStatus = async (appointmentId: string, status: "pending" | "completed"): Promise<void> => {
  await dynamo
    .update({
      TableName,
      Key: { appointmentId },
      UpdateExpression: "set #s = :status",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":status": status },
    })
    .promise();
};

/**
 * @param {string} insuredId
 * @returns {Promise<any[]>}
 */
const getAppointmentsByInsured = async (insuredId: string): Promise<any[]> => {
  const result = await dynamo
    .query({
      TableName,
      IndexName: "insuredId-index",
      KeyConditionExpression: "insuredId = :id",
      ExpressionAttributeValues: { ":id": insuredId },
    })
    .promise();
  return result.Items as any[];
};

module.exports = { saveAppointment, updateAppointmentStatus, getAppointmentsByInsured };
