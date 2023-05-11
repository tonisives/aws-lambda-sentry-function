import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Sentry, { SeverityLevel, captureException } from "@sentry/node";
import { SENTRY_DSN } from "./env.js";
import { MicroSentry } from "./microSentry.js";


export const run = async (

) => {
  console.log("Hello, world!");

  MicroSentry.init(SENTRY_DSN)
  MicroSentry.captureError(new Error("Hello from MicroSentry!"))
}

run().then((it) => console.log(it)).catch((err) => console.log(err)).finally(() => process.exit(0))