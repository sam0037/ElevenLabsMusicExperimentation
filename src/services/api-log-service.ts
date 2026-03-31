const LOG_ENDPOINT = '/api/logs'

interface ApiLogEnvelope {
  apiName: string
  operation: string
  startTime: number
  endTime?: number
  request: {
    url: string
    method: string
    headers?: Record<string, string>
    body?: unknown
  }
  response?: {
    status: number
    statusText: string
    headers?: Record<string, string>
    body?: unknown
  }
  error?: {
    name: string
    message: string
    stack?: string
    details?: unknown
  }
  metadata?: Record<string, unknown>
}

const SENSITIVE_HEADERS = new Set(['authorization', 'xi-api-key'])

function maskSecret(value: string) {
  if (!value) {
    return value
  }

  if (value.length <= 8) {
    return '***'
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

function sanitizeHeaders(headers?: Record<string, string>) {
  if (!headers) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => {
      const normalizedKey = key.toLowerCase()
      return [key, SENSITIVE_HEADERS.has(normalizedKey) ? maskSecret(value) : value]
    }),
  )
}

function normalizeError(error: unknown, details?: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      details,
    }
  }

  return {
    name: 'UnknownError',
    message: typeof error === 'string' ? error : 'Unknown API error',
    details,
  }
}

export class ApiLogService {
  static async log(envelope: ApiLogEnvelope): Promise<void> {
    const endTime = envelope.endTime ?? Date.now()
    const payload = {
      apiName: envelope.apiName,
      operation: envelope.operation,
      fileEpochMs: envelope.startTime,
      loggedAt: new Date(endTime).toISOString(),
      performance: {
        startedAtEpochMs: envelope.startTime,
        endedAtEpochMs: endTime,
        durationMs: endTime - envelope.startTime,
      },
      request: {
        ...envelope.request,
        headers: sanitizeHeaders(envelope.request.headers),
      },
      response: envelope.response
        ? {
            ...envelope.response,
            headers: sanitizeHeaders(envelope.response.headers),
          }
        : undefined,
      error: envelope.error,
      metadata: envelope.metadata,
    }

    try {
      await fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
    } catch {
      // Logging should never break the primary API workflow.
    }
  }

  static buildError(error: unknown, details?: unknown) {
    return normalizeError(error, details)
  }

  static headersToObject(headers: Headers) {
    return Object.fromEntries(headers.entries())
  }
}
