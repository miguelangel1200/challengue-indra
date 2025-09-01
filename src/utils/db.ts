const mysql = require("mysql2/promise");

/**
 * Ejecuta una consulta SQL en la BD correspondiente al país.
 * @param {string} sql - Consulta SQL
 * @param {any[]} [params=[]] - Parámetros de la consulta
 * @param {"PE"|"CL"} [country="PE"] - País al que apunta la BD
 * @returns {Promise<any[]>}
 */
async function queryDB(sql, params = [], country = "PE") {
  const config =
    country === "PE"
      ? {
          host: process.env.DB_HOST_PE,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME_PE,
        }
      : {
          host: process.env.DB_HOST_CL,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME_CL,
        };

  const conn = await mysql.createConnection(config);
  const [rows] = await conn.execute(sql, params);
  await conn.end();
  return rows;
}

module.exports = { queryDB };
