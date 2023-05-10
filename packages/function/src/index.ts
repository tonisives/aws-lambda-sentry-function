import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  let body = { hello: "hello" }
  let statusCode = 200

  return {
    statusCode: statusCode,
    body: JSON.stringify(body),
  }
}