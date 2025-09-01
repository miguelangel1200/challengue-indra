const { getAppointmentsReport, getStatsReport } = require("../services/reportService");
import type { APIGatewayProxyHandler } from "aws-lambda";

/**
 * @type {APIGatewayProxyHandler}
 */
const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === "GET" && event.path === "/admin/appointments") {
      const insuredId = event.queryStringParameters?.insuredId;
      const data = await getAppointmentsReport(insuredId);
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    if (event.httpMethod === "GET" && event.path === "/admin/stats") {
      const data = await getStatsReport();
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    return { statusCode: 404, body: JSON.stringify({ error: "Not Found" }) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

module.exports = { handler };
