export interface LambdaFunctionConfig {
  name: string,
  path: string,
  handler: string,
  runtime: string,
  version: string,
}

export const REGION = "us-west-2"
export const STACK_NAME = "aws-lambda-sentry-function"
export const LAMBDA_TIMEOUT = 60

export const lambdaRolePolicy = {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}