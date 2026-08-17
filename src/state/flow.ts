import type { Step } from '../types'

export const FLOW: Array<{ step: Step; label: string; short: string }> = [
  { step: 'profile', label: 'Build my profile', short: 'Profile' },
  { step: 'summary', label: 'Profile summary', short: 'Summary' },
  { step: 'strategy', label: 'My strategy', short: 'Strategy' },
  { step: 'conflicts', label: 'Conflicts & re-audit', short: 'Conflicts' },
  { step: 'locked', label: 'Locked list', short: 'Lock' },
]

export function flowIndex(step: Step): number {
  return FLOW.findIndex((f) => f.step === step)
}
