import { handler } from "../index.js"
import { APIGatewayProxyEvent } from 'aws-lambda';

export const run = async () => {
  return await handler({
    httpMethod: "POST",
    body: "",
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