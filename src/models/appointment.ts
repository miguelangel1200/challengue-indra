export interface Appointment {
  appointmentId?: string; // UUID generado
  insuredId: string; // asegurado
  scheduleId: number; // espacio
  countryISO: "PE" | "CL";
  status?: "pending" | "completed"; // estado en DynamoDB
  createdAt?: string;
}
