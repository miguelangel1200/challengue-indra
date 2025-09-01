// src/services/reportService.ts
const db = require("../utils/db");

async function getAppointmentsReport(insuredId) {
  const sql = `
    SELECT 
      a.appointment_id,
      a.insured_id,
      a.country_iso,
      c.name AS center_name,
      s.name AS specialty_name,
      m.name AS medic_name,
      a.appointment_date,
      a.status
    FROM appointments a
    JOIN centers c ON a.center_id = c.center_id
    JOIN specialties s ON a.specialty_id = s.specialty_id
    JOIN medics m ON a.medic_id = m.medic_id
    ${insuredId ? "WHERE a.insured_id = ?" : ""}
    ORDER BY a.appointment_date DESC
  `;
  return db.queryDB(sql, insuredId ? [insuredId] : []);
}

async function getStatsReport() {
  const statusSQL = `SELECT status, COUNT(*) AS total FROM appointments GROUP BY status`;
  const specialtySQL = `
    SELECT s.name AS specialty, COUNT(*) AS total
    FROM appointments a
    JOIN specialties s ON a.specialty_id = s.specialty_id
    GROUP BY s.name
  `;

  const [status, specialties] = await Promise.all([
    db.queryDB(statusSQL),
    db.queryDB(specialtySQL),
  ]);

  return { status, specialties };
}

module.exports = { getAppointmentsReport, getStatsReport };
