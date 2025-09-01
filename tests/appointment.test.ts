const AWS = require('aws-sdk-mock');
const { handler } = require('../lambda/getAppointment');

describe('GET /appointments', () => {
  afterEach(() => AWS.restore());

  test('Recupera cita existente', async () => {
    AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      callback(null, { Item: { appointmentId: '1', insuredId: '123', status: 'pending' } });
    });

    const event = { pathParameters: { appointmentId: '1' } };
    const result = await handler(event);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.appointmentId).toBe('1');
    expect(body.status).toBe('pending');
  });

  test('Cita no encontrada', async () => {
    AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      callback(null, {});
    });

    const event = { pathParameters: { appointmentId: '999' } };
    const result = await handler(event);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(404);
    expect(body.message).toBe('Cita no encontrada');
  });
});
