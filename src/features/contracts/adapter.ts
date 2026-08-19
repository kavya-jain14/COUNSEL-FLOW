import {
  apiErrorEnvelopeSchema,
  CONTRACT_VERSION,
  type ApiErrorEnvelope,
  type CandidateProfile,
  type StrategyItem,
} from '@counselflow/contracts'

type ValidationIssue = {
  message?: unknown
  path?: readonly unknown[]
}

let requestSequence = 0

export class ContractAdapterError extends Error {
  readonly envelope: ApiErrorEnvelope

  constructor(envelope: ApiErrorEnvelope) {
    super(envelope.error.message)
    this.name = 'ContractAdapterError'
    this.envelope = envelope
  }
}

export function nextRequestId(operation: 'generate' | 'audit' | 'lock'): string {
  requestSequence += 1
  return `web-${operation}-${String(requestSequence).padStart(4, '0')}`
}

function issuesFrom(cause: unknown): ValidationIssue[] {
  if (!cause || typeof cause !== 'object' || !('issues' in cause)) return []
  const issues = (cause as { issues?: unknown }).issues
  return Array.isArray(issues) ? (issues as ValidationIssue[]) : []
}

function validationEnvelope(requestId: string, cause: unknown): ApiErrorEnvelope {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of issuesFrom(cause)) {
    const field = issue.path?.map(String).join('.') || '_root'
    const message = typeof issue.message === 'string' ? issue.message : 'Invalid value.'
    ;(fieldErrors[field] ??= []).push(message)
  }

  return apiErrorEnvelopeSchema.parse({
    contractVersion: CONTRACT_VERSION,
    requestId,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'The strategy exchange did not match the CounselFlow contract.',
      retryable: false,
      ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
    },
  })
}

export function validateContract<T>(requestId: string, parse: () => T): T {
  try {
    return parse()
  } catch (cause) {
    throw new ContractAdapterError(validationEnvelope(requestId, cause))
  }
}

export function toApiError(cause: unknown): ApiErrorEnvelope {
  if (cause instanceof ContractAdapterError) return cause.envelope
  return apiErrorEnvelopeSchema.parse({
    contractVersion: CONTRACT_VERSION,
    error: {
      code: 'INTERNAL_ERROR',
      message: cause instanceof Error ? cause.message : 'The operation could not be completed.',
      retryable: true,
    },
  })
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

function revision(prefix: 'profile' | 'list', value: unknown): string {
  const input = canonical(value)
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `${prefix}-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

export function profileRevisionFor(profile: CandidateProfile): string {
  return revision('profile', profile)
}

export function listRevisionFor(items: StrategyItem[]): string {
  return revision('list', items)
}
