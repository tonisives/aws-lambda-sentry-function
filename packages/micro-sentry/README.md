# how to use

yarn add @micro-sentry/browser xmlhttprequest
Manually add MicroSentry class to your project

```
  MicroSentry.init(SENTRY_DSN)
  MicroSentry.captureError(new Error("Hello from MicroSentry!"))
```
