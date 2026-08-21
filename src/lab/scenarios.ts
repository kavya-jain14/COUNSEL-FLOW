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
      'Leave the warning unresolved; an explained override followed by re-audit unblocks it.',
    ],
    expectedConflictCodes: ['CF-01'],
    expectedLockBlocked: true,
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
      'Leave the warning unresolved; accepting uncertainty with a reason and re-auditing unblocks it.',
    ],
    expectedConflictCodes: ['CF-08'],
    expectedLockBlocked: true,
  },
  {
    id: 'tier-boundary-classification',
    title: 'Tier labels derive from named ratio buffers, not opaque guesses',
    proves: 'The deterministic classification is transparent: DREAM < 90% of rank, TARGET 90–140%, SAFE ≥ 140%.',
    setup: [
      'Use rank 10000 with the default seed dataset.',
      'Verify HBTU Kanpur CSE (closingRank 8900, ratio ≈ 0.89) shows as Dream.',
      'Verify IET Lucknow IT (closingRank 11400, ratio 1.14) shows as Target.',
      'Verify HBTU Kanpur EE (closingRank 19500, ratio 1.95) shows as Safe.',
      'Hover each tier badge to confirm the tooltip cites the buffer boundary, not a "chance" or "probability".',
    ],
    expectedConflictCodes: [],
    expectedLockBlocked: false,
  },
  {
    id: 'deterministic-factor-scoring',
    title: 'Factor weights change the order — not the tier classification',
    proves: 'The scoring engine ranks by declared weights; changing weights produces a different deterministic order.',
    setup: [
      'Use rank 12500 with homeCity set to Lucknow.',
      'Set placements weight to 5 and all others to 1. Note position of HBTU Kanpur CSE (placementScore 82) vs KIET Ghaziabad CSE (placementScore 80).',
      'Now swap: set fees weight to 5 and placements to 1. UIET Kanpur EE (fee ₹1.2L) should rank above KIET Ghaziabad CSE (fee ₹1.48L) among same-tier options.',
      'Confirm the inspector shows why each option sits where it does — matching the declared weights.',
    ],
    expectedConflictCodes: [],
    expectedLockBlocked: false,
  },
  {
    id: 'hard-distance-filter',
    title: 'Hard distance limit removes distant options before scoring',
    proves: 'Hard constraints filter before scoring — a far option cannot score its way back onto the list.',
    setup: [
      'Set homeCity to Lucknow, distance to 100 km hard.',
      'Generate the list. Gorakhpur (≈290 km from Lucknow) must not appear.',
      'Switch distance to soft. Gorakhpur should reappear but rank lower among non-distance-weighted profiles.',
    ],
    expectedConflictCodes: [],
    expectedLockBlocked: false,
  },
  {
    id: 'decision-impact-is-personal',
    title: 'Decision impact reads the candidate profile, never the college reputation',
    proves:
      'Every advantage and cost in the modal is derived from a declared preference; nothing generic is emitted.',
    setup: [
      'Use rank 12500, GEN, UP domicile, homeCity Lucknow, branches CSE > IT > ECE.',
      'Generate the list and open any row to see the Decision Impact modal.',
      'Set every factor weight to 0 except hostel. Reopen the modal: placement and campus statements must disappear entirely rather than turn neutral.',
      'Set distance to 60 km hard. Reopen a Gorakhpur or Jhansi option: it must appear under HARD CONSTRAINT VIOLATION, not as a compromise.',
      'Switch the same limit to soft. The identical option must move to "What you are compromising" and the fit band must stop being BLOCKED.',
      'Open an IT option while CSE is your first choice: the compromise must name CSE and count the steps down your own order.',
    ],
    expectedConflictCodes: [],
    expectedLockBlocked: false,
  },
  {
    id: 'decision-impact-is-deterministic',
    title: 'The same profile and list produce the same impact wording every time',
    proves:
      'The constraint layer decides and the narration layer only renders, so no explanation can invent a verdict.',
    setup: [
      'Open the Decision Impact modal for any option and note the bottom line.',
      'Close it, reopen the same option, and confirm the wording is identical.',
      'Change one factor weight, reopen, and confirm the wording changes because the structured evaluation changed.',
      'Confirm no statement claims an admission chance or calls a college good or bad on its own.',
    ],
    expectedConflictCodes: [],
    expectedLockBlocked: false,
  },
] as const
