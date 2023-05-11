# Sentry lambda function

Invoke Sentry via this lambda to reduce your bundle size.

Deploy this lambda and then call it with a body like this

```
{
  "dsn": "https://<your sentry dsn>",
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
}
```

eg 

```
curl -X POST https://{deploy}.execute-api.us-west-2.amazonaws.com/prod/lambda-sentry
-d '{"dsn":"{https://<your sentry dsn>}","event":{"message":"Hello, world!","level":"warning","tags":{"foo":"bar"},"errors":[{"type":"unknown_error","path":"/var/logs/errors.log.1","details":"Failed to read attachment"}]}}'
```

check https://develop.sentry.dev/sdk/event-payloads/ for more payload details

## Setup

`yarn`

- change stack name and region in `config.ts`

## plan and deply

`yarn plan`
`yarn apply`

### extra: micro sentry node.js implementation

Micro sentry is implemented for browser and angular.js. My package mocks the browser to make micro
sentry work in node.js.
