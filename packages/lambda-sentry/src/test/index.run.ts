import { handler } from "../index.js"
import { APIGatewayProxyEvent } from 'aws-lambda';
import { SENTRY_DSN } from "./env.js";

let body = `{
  "dsn": "${SENTRY_DSN}",
  "event": {
    "message": "Hello, world!",
    "level": "warning",
    "tags": {
      "foo": "bar"
    },
    "errors": [
      {
        "type": "unknown_error",
        "path": "/var/logs/errors.log.1",
        "details": "Failed to read attachment"
      }
    ]
  }
}`

export const run = async () => {
  return await handler({
    httpMethod: "POST",
    body: body,
  } as unknown as APIGatewayProxyEvent)
}

// loops until full range has been received
run()
  .then(async (it) => {
    console.log(it)
  })
  .catch((err) => {
    console.log(err)
  })
  .finally(() => {
    process.exit(0)
  })