import type { ConflictCode } from '../types'

export interface LabScenario {
  id: string
  title: string
  proves: string
  setup: readonly string[]
  expectedConflictCodes: readonly ConflictCode[]
  expectedLockBlocked: boolean
}

/**
 * Shared acceptance scenarios for manual demo checks today and automated tests later.
 * Keep the setup readable: a judge or reviewer should understand the contradiction
 * without reading the engine implementation.
 */
export const LAB_SCENARIOS: readonly LabScenario[] = [
  {
    id: 'golden-fix-and-lock',
    title: 'Critical conflicts are fixed before lock',
    proves: 'The complete profile → audit → fix → re-audit → lock loop converges.',
    setup: [
      'Use the default sample profile and generated list.',
      'Resolve every critical conflict and justify any warning kept.',
      'Re-audit after the final edit.',
    ],
    expectedConflictCodes: [],
    expectedLockBlocked: false,
  },
  {
    id: 'hard-budget-breach',
    title: '₹1.5L hard budget blocks a ₹2L option',
    proves: 'A hard constraint cannot be acknowledged away.',
    setup: [
      'Set annual budget to ₹1,50,000 and mode to hard.',
      'Include an option whose annual fee is above ₹2,00,000.',
    ],
    expectedConflictCodes: ['CF-02'],
    expectedLockBlocked: true,
  },
  {
    id: 'branch-priority-inversion',
    title: 'CSE preference catches a comparable ECE-over-CSE inversion',
    proves: 'Order is audited against declared branch priority without hiding tradeoffs.',
    setup: [
      'Declare CSE above ECE in branch priority.',
      'Place a comparable ECE option immediately above a CSE option.',
    ],
    expectedConflictCodes: ['CF-01'],
    expectedLockBlocked: false,
  },
  {
    id: 'stale-audit-after-manual-move',
    title: 'A manual reorder invalidates the previous audit',
    proves: 'The candidate cannot lock a list that the engine has not audited.',
    setup: [
      'Start from an audited list with no critical conflicts.',
      'Move any option to a new position and do not re-audit.',
    ],
    expectedConflictCodes: [],
    expectedLockBlocked: true,
  },
  {
    id: 'missing-evidence',
    title: 'Missing fee/rank facts lower confidence instead of becoming fiction',
    proves: 'Unknown data is explicit and cannot be invented by an explanation layer.',
    setup: [
      'Include REC Banda from the seed dataset.',
      'Inspect reasons and evidence for its missing fee, closing-rank and placement facts.',
    ],
    expectedConflictCodes: ['CF-08'],
    expectedLockBlocked: false,
  },
] as const
