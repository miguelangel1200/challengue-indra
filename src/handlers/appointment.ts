import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Inicializa los clientes de AWS fuera del handler para mejorar el rendimiento
const awsConfig = {
  region: "us-east-2"
};

const ddb = new AWS.DynamoDB.DocumentClient(awsConfig);
const sns = new AWS.SNS(awsConfig);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // LOG 1: Imprime el evento completo para ver qué estás recibiendo
  console.log('EVENTO RECIBIDO:', JSON.stringify(event, null, 2));

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Cuerpo de la petición vacío.' }),
      };
    }

    const body = JSON.parse(event.body);

    // LOG 2: Imprime el cuerpo ya parseado
    console.log('BODY PARSEADO:', body);

    // --- VALIDACIÓN DE ENTRADA ---
    // Esta es la verdadera solución para prevenir errores como el de NaN
    const { insuredId, scheduleId, countryISO } = body;

    if (!insuredId || scheduleId === undefined || !countryISO) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Faltan parámetros obligatorios: insuredId, scheduleId o countryISO.' }),
      };
    }

    if (typeof scheduleId !== 'number') {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'El parámetro scheduleId debe ser un número.' }),
      };
    }
    
    if (countryISO !== 'PE' && countryISO !== 'CL') {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'El parámetro countryISO solo puede ser "PE" o "CL".' }),
        };
    }

    const appointmentId = uuidv4();
    const createdAt = new Date().toISOString();

    const dbItem = {
      appointmentId,
      insuredId,
      scheduleId,
      countryISO,
      status: 'pending',
      createdAt,
    };

    const paramsDb = {
      TableName: process.env.APPOINTMENTS_TABLE!,
      Item: dbItem,
    };

    // LOG 3: Imprime los parámetros que se enviarán a DynamoDB
    console.log('PARAMETROS PARA DYNAMODB:', JSON.stringify(paramsDb, null, 2));
    await ddb.put(paramsDb).promise();
    console.log('Cita guardada en DynamoDB exitosamente.');

    const paramsSns = {
      TopicArn: process.env.SNS_TOPIC_ARN!,
      Message: JSON.stringify(dbItem),
      MessageAttributes: {
        countryISO: {
          DataType: 'String',
          StringValue: countryISO,
        },
      },
    };

    // LOG 4: Imprime los parámetros que se enviarán a SNS
    console.log('PARAMETROS PARA SNS:', JSON.stringify(paramsSns, null, 2));
    await sns.publish(paramsSns).promise();
    console.log('Mensaje publicado en SNS exitosamente.');

    return {
      statusCode: 201, // 201 Created es más apropiado para un POST exitoso
      body: JSON.stringify({
        message: 'Agendamiento en proceso.',
        appointmentId: appointmentId,
      }),
    };
  } catch (error) {
    // LOG 5: Captura y muestra cualquier error inesperado
    console.error('ERROR EN EL HANDLER:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Ha ocurrido un error interno en el servidor.' }),
    };
  }
};