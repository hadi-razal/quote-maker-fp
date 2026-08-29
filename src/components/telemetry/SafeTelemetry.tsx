"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

function withoutFragment(url: string): string {
  return url.split("#", 1)[0];
}

function sanitizeAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent {
  return { ...event, url: withoutFragment(event.url) };
}

/** Prevents encoded quotation snapshots in URL fragments from entering telemetry. */
export function SafeTelemetry() {
  return (
    <>
      <Analytics beforeSend={sanitizeAnalyticsEvent} />
      <SpeedInsights beforeSend={(event) => ({ ...event, url: withoutFragment(event.url) })} />
    </>
  );
}
