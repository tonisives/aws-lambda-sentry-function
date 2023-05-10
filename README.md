# Sentry lambda function

Invoke Sentry via this lambda to reduce your bundle size.

Deploy this lambda and then call it with

```
{
  "dsn": "https://<your sentry dsn>",
  "event": {
    "message": "Hello, world!",
    "level": "warning"
    "tags": {
      "foo": "bar"
    }
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

check https://develop.sentry.dev/sdk/event-payloads/ for more details

## Setup

`yarn`
- change stack name and region in `config.ts`

## plan and deply

`yarn plan`
`yarn apply`
