'use client'

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next'

// Password-reset links carry a secret token in the path; never send it to analytics.
function redactSensitivePaths(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url)
  if (url.pathname.startsWith('/reset-password/')) {
    url.pathname = '/reset-password/[token]'
    return { ...event, url: url.toString() }
  }
  return event
}

export function VercelAnalytics() {
  return <Analytics beforeSend={redactSensitivePaths} />
}
