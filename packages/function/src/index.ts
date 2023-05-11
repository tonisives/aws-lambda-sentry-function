import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Sentry, { SeverityLevel, captureException } from "@sentry/node";

export interface Input {
  dsn: string;
  event: Event;
}

export interface Event {
  message: string;
  level: string;
  tags?: Tags;
  errors?: (Error)[] | null;
}

export interface Tags {
  [key: string]: string;
}

export interface Error {
  type: string;
  path: string;
  details: string;
}


export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  let body = JSON.parse(event.body ?? "") as Input

  // construct a sentry message
  Sentry.init({ dsn: body.dsn })

  let captureContext = {
    level: body.event.level as SeverityLevel,
    tags: body.event.tags ?? {},
    errors: body.event.errors ?? [],
  }

  let response = Sentry.captureMessage(body.event.message, captureContext)

  return {
    statusCode: 200,
    body: response,
  }
}