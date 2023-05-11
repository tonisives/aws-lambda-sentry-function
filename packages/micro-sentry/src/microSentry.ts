import { BrowserMicroSentryClient } from "@micro-sentry/browser";
import { Severity } from "@micro-sentry/core";
// @ts-ignore
import { XMLHttpRequest } from "xmlhttprequest"

export class MicroSentry {
  private static instance: MicroSentry;
  private microSentry: BrowserMicroSentryClient

  private constructor(dsn: string, projectName: string = "micro-sentry") {
    this.mimicBrowser(projectName)
    this.microSentry = new BrowserMicroSentryClient({ dsn: dsn });
  }

  mimicBrowser = (projectName: string) => {
    globalThis.window = {
      title: projectName,
      navigator: {
        userAgent: "nodejs"
      },
      location: projectName
    } as any

    globalThis.XMLHttpRequest = XMLHttpRequest
  }

  close = () => {
    // TODO: wait a few seconds    
  }

  static init(dsn: string) {
    if (!MicroSentry.instance) {
      MicroSentry.instance = new MicroSentry(dsn);
    }
    return MicroSentry.instance;
  }

  static captureError(error: Error) {
    return MicroSentry.instance.microSentry.report(error);
  }

  static captureMessage(message: string, level: Severity) {
    return MicroSentry.instance.microSentry.captureMessage(message, level);
  }
}