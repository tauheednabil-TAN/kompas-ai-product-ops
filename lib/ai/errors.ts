/**
 * Error taxonomy.
 *
 * Codes, not messages. The UI translates the code through the active dictionary,
 * because an error message is interface chrome and must obey C1 like every other
 * string. A Danish string thrown from a server module would be untranslatable.
 */
export const AGENT_ERROR_CODES = [
  'rate_limit',
  'timeout',
  'auth',
  'server',
  'schema',
  'cpr_blocked',
  'too_long',
  'consent_required',
  'no_database',
  'unknown_agent',
  'unknown_version',
  'bad_request',
  'unknown',
] as const

export type AgentErrorCode = (typeof AGENT_ERROR_CODES)[number]

export class AgentError extends Error {
  readonly code: AgentErrorCode
  /** HTTP status to return to the client. */
  readonly status: number
  /** Original provider detail, for the audit log — never shown to the user. */
  readonly detail?: string

  constructor(code: AgentErrorCode, status: number, detail?: string) {
    super(`${code}${detail ? `: ${detail}` : ''}`)
    this.name = 'AgentError'
    this.code = code
    this.status = status
    this.detail = detail
  }
}

type MaybeApiError = {
  statusCode?: unknown
  status?: unknown
  name?: unknown
  message?: unknown
  cause?: unknown
}

function statusOf(error: MaybeApiError): number | undefined {
  const raw = error.statusCode ?? error.status
  return typeof raw === 'number' ? raw : undefined
}

/**
 * Map anything thrown by the provider or the SDK onto our taxonomy.
 *
 * Deliberately not exhaustive over provider error classes: the SDK's error
 * shapes change between versions, and a switch on class names would rot
 * silently. Status code plus name covers what actually matters operationally.
 */
export function toAgentError(error: unknown): AgentError {
  if (error instanceof AgentError) return error

  if (typeof error === 'object' && error !== null) {
    const e = error as MaybeApiError
    const name = typeof e.name === 'string' ? e.name : ''
    const message = typeof e.message === 'string' ? e.message : String(error)
    const status = statusOf(e)

    // AbortSignal.timeout() rejects with a TimeoutError; a user-cancelled
    // request rejects with AbortError. Both mean "no result", but only the
    // first is our fault.
    if (name === 'TimeoutError' || name === 'AbortError') {
      return new AgentError('timeout', 504, message)
    }
    // Zod validation of the model's final object.
    if (name === 'AI_TypeValidationError' || name === 'AI_NoObjectGeneratedError') {
      return new AgentError('schema', 502, message)
    }
    if (status === 429) return new AgentError('rate_limit', 429, message)
    if (status === 401 || status === 403) return new AgentError('auth', 502, message)
    if (typeof status === 'number' && status >= 500) {
      return new AgentError('server', 502, message)
    }

    return new AgentError('unknown', 500, message)
  }

  return new AgentError('unknown', 500, String(error))
}
