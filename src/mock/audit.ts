import type {
  CandidateProfile,
  Conflict,
  ConflictAction,
  Resolution,
  Severity,
  StrategyItem,
} from '../types'
import { formatINR, formatINRExact, formatKm } from '../lib/format'

function conflictId(code: string, ...parts: string[]): string {
  return [code, ...parts].join(':')
}

function violatesHardConstraint(item: StrategyItem, profile: CandidateProfile): boolean {
  const { option } = item
  if (
    profile.budget.mode === 'hard' &&
    option.annualFee != null &&
    option.annualFee > profile.budget.value
  ) {
    return true
  }
  if (
    profile.distance.mode === 'hard' &&
    option.distanceKm != null &&
    option.distanceKm > profile.distance.value
  ) {
    return true
  }
  return matchedExclusion(item, profile) != null
}

function matchedExclusion(item: StrategyItem, profile: CandidateProfile) {
  return profile.hardExclusions.find((ex) => {
    switch (ex.kind) {
      case 'branch':
        return item.option.branch === ex.value
      case 'instituteType':
        return item.option.instituteType === ex.value
      case 'location':
        return item.option.city === ex.value
      case 'noHostel':
        return !item.option.hostelAvailable
      default:
        return false
    }
  })
}

const removeAction = (itemId: string, label = 'Remove option'): ConflictAction => ({
  id: `${itemId}:remove`,
  kind: 'REMOVE_OPTION',
  label,
  effect: 'Drops this option from your list. Everything below moves up one place.',
  intent: 'primary',
  target: { itemId },
})

function budgetConflicts(profile: CandidateProfile, items: StrategyItem[]): Conflict[] {
  const out: Conflict[] = []
  for (const item of items) {
    const fee = item.option.annualFee
    if (fee == null || fee <= profile.budget.value) continue

    const hard = profile.budget.mode === 'hard'
    const headroom = Math.ceil(fee / 10000) * 10000

    out.push({
      id: conflictId('CF-02', item.itemId),
      code: 'CF-02',
      severity: hard ? 'CRITICAL' : 'INFO',
      title: 'Budget violation',
      summary: hard
        ? `${formatINR(fee)} option is above your ${formatINR(profile.budget.value)} limit.`
        : `${formatINR(fee)} option is above your preferred ${formatINR(
          profile.budget.value,
        )} budget, but budget is a soft preference so it stays eligible.`,
      evidence: [
        `${item.option.collegeShort} · ${item.option.branch} — annual fee ${formatINRExact(fee)}`,
        `Your declared ceiling — ${formatINRExact(profile.budget.value)} per year (${hard ? 'hard constraint' : 'soft preference'
        })`,
        `Source: ${item.option.sourceLabel} ${item.option.sourceYear}`,
      ],
      causedBy: hard ? 'Hard constraint · Annual budget' : 'Soft preference · Annual budget',
      itemIds: [item.itemId],
      actions: hard
        ? [
          removeAction(item.itemId),
          {
            id: `${item.itemId}:raise-budget`,
            kind: 'CHANGE_CONSTRAINT',
            label: `Raise budget to ${formatINR(headroom)}`,
            effect: `Changes your hard ceiling to ${formatINRExact(
              headroom,
            )}/year. This re-checks every option, not just this one.`,
            intent: 'secondary',
            target: { itemId: item.itemId, constraint: 'budget', newValue: headroom },
          },
          {
            id: `${item.itemId}:soften-budget`,
            kind: 'CONVERT_TO_SOFT',
            label: 'Make budget a soft preference',
            effect:
              'Budget stops blocking options. Expensive colleges rank lower but are no longer removed.',
            intent: 'secondary',
            requiresReason: true,
            target: { constraint: 'budget' },
          },
        ]
        : [
          {
            id: `${item.itemId}:ack`,
            kind: 'ACKNOWLEDGE',
            label: 'Understood',
            effect: 'Keeps the option and records that you saw the tradeoff.',
            intent: 'secondary',
          },
        ],
    })
  }
  return out
}

function distanceConflicts(profile: CandidateProfile, items: StrategyItem[]): Conflict[] {
  const out: Conflict[] = []
  for (const item of items) {
    const km = item.option.distanceKm
    if (km == null || km <= profile.distance.value) continue

    const hard = profile.distance.mode === 'hard'
    const headroom = Math.ceil(km / 50) * 50

    out.push({
      id: conflictId('CF-03', item.itemId),
      code: 'CF-03',
      severity: hard ? 'CRITICAL' : 'INFO',
      title: 'Distance violation',
      summary: hard
        ? `${item.option.collegeShort} is ${formatKm(km)} away — past your ${formatKm(
          profile.distance.value,
        )} limit.`
        : `${item.option.collegeShort} is ${formatKm(
          km,
        )} away, further than you prefer, but distance is a soft preference.`,
      evidence: [
        `${item.option.collegeShort}, ${item.option.city} — ${formatKm(km)} from your home location`,
        `Your declared limit — ${formatKm(profile.distance.value)} (${hard ? 'hard constraint' : 'soft preference'
        })`,
      ],
      causedBy: hard ? 'Hard constraint · Distance limit' : 'Soft preference · Distance',
      itemIds: [item.itemId],
      actions: hard
        ? [
          removeAction(item.itemId),
          {
            id: `${item.itemId}:raise-distance`,
            kind: 'CHANGE_CONSTRAINT',
            label: `Extend limit to ${formatKm(headroom)}`,
            effect: `Changes your hard travel radius to ${formatKm(
              headroom,
            )}. This re-checks every option.`,
            intent: 'secondary',
            target: { itemId: item.itemId, constraint: 'distance', newValue: headroom },
          },
          {
            id: `${item.itemId}:soften-distance`,
            kind: 'CONVERT_TO_SOFT',
            label: 'Make distance a soft preference',
            effect:
              'Distance stops blocking options. Far colleges rank lower but stay on the list.',
            intent: 'secondary',
            requiresReason: true,
            target: { constraint: 'distance' },
          },
        ]
        : [
          {
            id: `${item.itemId}:ack`,
            kind: 'ACKNOWLEDGE',
            label: 'Understood',
            effect: 'Keeps the option and records that you saw the tradeoff.',
            intent: 'secondary',
          },
        ],
    })
  }
  return out
}

function exclusionConflicts(profile: CandidateProfile, items: StrategyItem[]): Conflict[] {
  const out: Conflict[] = []
  for (const item of items) {
    const ex = matchedExclusion(item, profile)
    if (!ex) continue
    out.push({
      id: conflictId('CF-06', item.itemId, ex.id),
      code: 'CF-06',
      severity: 'CRITICAL',
      title: 'Unwanted fallback',
      summary: `${item.option.collegeShort} · ${item.option.branch} matches something you marked "never accept".`,
      evidence: [
        `Your exclusion — ${ex.label}`,
        `This option — ${item.option.college}, ${item.option.branch}`,
      ],
      causedBy: `Hard constraint · Never accept: ${ex.label}`,
      itemIds: [item.itemId],
      actions: [
        removeAction(item.itemId),
        {
          id: `${item.itemId}:drop-exclusion`,
          kind: 'CHANGE_CONSTRAINT',
          label: 'Remove this exclusion instead',
          effect: `Deletes "${ex.label}" from your never-accept list. Other blocked options may come back.`,
          intent: 'secondary',
          requiresReason: true,
          target: { exclusionId: ex.id },
        },
      ],
    })
  }
  return out
}

function collegeQuality(item: StrategyItem, profile: CandidateProfile): number | null {
  const { placementScore, campusScore } = item.option
  if (placementScore == null || campusScore == null) return null
  const wPlace = profile.factorWeights.placements
  const wCampus = profile.factorWeights.campus
  const total = wPlace + wCampus
  if (total === 0) return (placementScore + campusScore) / 2
  return (placementScore * wPlace + campusScore * wCampus) / total
}

function branchPriorityConflicts(
  profile: CandidateProfile,
  items: StrategyItem[],
): Conflict[] {
  const out: Conflict[] = []
  const rankOf = (branch: string) => (profile.branchPriority as string[]).indexOf(branch)

  for (let i = 0; i < items.length - 1; i++) {
    const upper = items[i]
    const lower = items[i + 1]

    if (violatesHardConstraint(upper, profile) || violatesHardConstraint(lower, profile)) {
      continue
    }

    const upperRank = rankOf(upper.option.branch)
    const lowerRank = rankOf(lower.option.branch)
    if (upperRank < 0 || lowerRank < 0) continue
    if (upperRank <= lowerRank) continue

    const upperQuality = collegeQuality(upper, profile)
    const lowerQuality = collegeQuality(lower, profile)
    const comparable =
      upperQuality == null || lowerQuality == null || lowerQuality >= upperQuality

    const positions = [
      `#${upper.position} ${upper.option.collegeShort} · ${upper.option.branch} (your #${upperRank + 1
      } branch)`,
      `#${lower.position} ${lower.option.collegeShort} · ${lower.option.branch} (your #${lowerRank + 1
      } branch)`,
    ]

    if (comparable) {
      out.push({
        id: conflictId('CF-01', upper.itemId, lower.itemId),
        code: 'CF-01',
        severity: 'WARNING',
        title: 'Branch priority conflict',
        summary: `You said ${lower.option.branch} > ${upper.option.branch}, but ${upper.option.branch} is ranked higher.`,
        evidence: [
          `Your branch order — ${profile.branchPriority.join(' > ')}`,
          ...positions,
          'Both options satisfy every hard constraint.',
          lowerQuality != null && upperQuality != null
            ? `The lower option is not the weaker college either (${lowerQuality.toFixed(
              0,
            )} vs ${upperQuality.toFixed(0)} on placements and campus), so swapping costs you nothing.`
            : 'We have no college-quality evidence that would justify the current order.',
        ],
        causedBy: `Soft preference · Branch order — you ranked ${lower.option.branch} above ${upper.option.branch}`,
        itemIds: [upper.itemId, lower.itemId],
        actions: [
          {
            id: `${upper.itemId}:swap`,
            kind: 'SWAP',
            label: 'Swap',
            effect: `Moves ${lower.option.collegeShort} · ${lower.option.branch} to #${upper.position} and ${upper.option.collegeShort} · ${upper.option.branch} to #${lower.position}.`,
            intent: 'primary',
            target: { itemId: upper.itemId, withItemId: lower.itemId },
          },
          {
            id: `${upper.itemId}:keep`,
            kind: 'KEEP',
            label: 'Keep anyway',
            effect:
              'Keeps your order. Tell us why — usually this means you prefer the college over the branch.',
            intent: 'secondary',
            requiresReason: true,
          },
        ],
      })
    } else {
      out.push({
        id: conflictId('CF-01', upper.itemId, lower.itemId),
        code: 'CF-01',
        severity: 'INFO',
        title: 'College chosen over branch',
        summary: `${upper.option.branch} sits above ${lower.option.branch} here, but the college above is the stronger one.`,
        evidence: [
          `Your branch order — ${profile.branchPriority.join(' > ')}`,
          ...positions,
          `${upper.option.collegeShort} scores ${upperQuality!.toFixed(
            0,
          )} against ${lower.option.collegeShort}'s ${lowerQuality!.toFixed(
            0,
          )} on the placements and campus factors you weighted.`,
          'This is a tradeoff, not a mistake — we are only making sure you meant it.',
        ],
        causedBy: 'Soft preference · Branch order vs college quality',
        itemIds: [upper.itemId, lower.itemId],
        actions: [
          {
            id: `${upper.itemId}:keep-info`,
            kind: 'ACKNOWLEDGE',
            label: 'Yes, I meant that',
            effect: 'Keeps your order. Nothing is blocked by this.',
            intent: 'primary',
          },
          {
            id: `${upper.itemId}:swap-info`,
            kind: 'SWAP',
            label: 'Actually, swap them',
            effect: `Puts ${lower.option.collegeShort} · ${lower.option.branch} back above ${upper.option.collegeShort} · ${upper.option.branch}.`,
            intent: 'secondary',
            target: { itemId: upper.itemId, withItemId: lower.itemId },
          },
        ],
      })
    }
  }
  return out
}

type Comparison = { label: string; betterBelow: boolean; equal: boolean; detail: string }

function compareAdjacent(
  profile: CandidateProfile,
  upper: StrategyItem,
  lower: StrategyItem,
): Comparison[] | null {
  const a = upper.option
  const b = lower.option
  const cmp: Comparison[] = []

  if (profile.factorWeights.fees > 0) {
    if (a.annualFee == null || b.annualFee == null) return null
    cmp.push({
      label: 'Annual fee',
      betterBelow: b.annualFee < a.annualFee,
      equal: b.annualFee === a.annualFee,
      detail: `${formatINRExact(b.annualFee)} vs ${formatINRExact(a.annualFee)}`,
    })
  }
  if (profile.factorWeights.location > 0) {
    if (a.distanceKm == null || b.distanceKm == null) return null
    cmp.push({
      label: 'Distance',
      betterBelow: b.distanceKm < a.distanceKm,
      equal: b.distanceKm === a.distanceKm,
      detail: `${formatKm(b.distanceKm)} vs ${formatKm(a.distanceKm)}`,
    })
  }
  if (profile.factorWeights.placements > 0) {
    if (a.placementScore == null || b.placementScore == null) return null
    cmp.push({
      label: 'Placements',
      betterBelow: b.placementScore > a.placementScore,
      equal: b.placementScore === a.placementScore,
      detail: `${b.placementScore}/100 vs ${a.placementScore}/100`,
    })
  }
  if (profile.factorWeights.campus > 0) {
    if (a.campusScore == null || b.campusScore == null) return null
    cmp.push({
      label: 'Campus',
      betterBelow: b.campusScore > a.campusScore,
      equal: b.campusScore === a.campusScore,
      detail: `${b.campusScore}/100 vs ${a.campusScore}/100`,
    })
  }
  if (profile.factorWeights.hostel > 0) {
    cmp.push({
      label: 'Hostel',
      betterBelow: b.hostelAvailable === true && a.hostelAvailable !== true,
      equal: b.hostelAvailable === a.hostelAvailable,
      detail: `${b.hostelAvailable ? 'available' : 'not listed'} vs ${a.hostelAvailable ? 'available' : 'not listed'
        }`,
    })
  }
  return cmp
}

function dominatedConflicts(profile: CandidateProfile, items: StrategyItem[]): Conflict[] {
  const out: Conflict[] = []

  for (let i = 0; i < items.length - 1; i++) {
    const upper = items[i]
    const lower = items[i + 1]

    if (upper.option.branch !== lower.option.branch) continue
    if (violatesHardConstraint(upper, profile) || violatesHardConstraint(lower, profile)) continue

    const cmp = compareAdjacent(profile, upper, lower)
    if (!cmp || cmp.length === 0) continue

    const dominates =
      cmp.every((c) => c.betterBelow || c.equal) && cmp.some((c) => c.betterBelow)
    if (!dominates) continue

    out.push({
      id: conflictId('CF-04', upper.itemId, lower.itemId),
      code: 'CF-04',
      severity: 'WARNING',
      title: 'Dominated adjacent option',
      summary: `#${lower.position} ${lower.option.collegeShort} matches or beats #${upper.position} ${upper.option.collegeShort} on every factor you weighted.`,
      evidence: cmp.map(
        (c) =>
          `${c.label} — ${c.detail} (${c.equal ? 'equal' : c.betterBelow ? 'better below' : 'better above'
          })`,
      ),
      causedBy: 'Soft preferences · Your factor weights',
      itemIds: [upper.itemId, lower.itemId],
      actions: [
        {
          id: `${upper.itemId}:swap-dominated`,
          kind: 'SWAP',
          label: 'Swap',
          effect: `Moves ${lower.option.collegeShort} · ${lower.option.branch} above ${upper.option.collegeShort} · ${upper.option.branch}.`,
          intent: 'primary',
          target: { itemId: upper.itemId, withItemId: lower.itemId },
        },
        {
          id: `${upper.itemId}:keep-dominated`,
          kind: 'KEEP',
          label: 'Keep anyway',
          effect: 'Keeps your order — record a reason we did not capture as a factor.',
          intent: 'secondary',
          requiresReason: true,
        },
      ],
    })
  }
  return out
}

function coverageConflicts(profile: CandidateProfile, items: StrategyItem[]): Conflict[] {
  const acceptable = items.filter((it) => !violatesHardConstraint(it, profile))
  if (acceptable.length === 0) return []
  if (acceptable.some((it) => it.tier === 'SAFE')) return []

  return [
    {
      id: conflictId('CF-05', 'coverage'),
      code: 'CF-05',
      severity: 'WARNING',
      title: 'Unsafe coverage',
      summary: 'Your list has no fallback you would actually accept.',
      evidence: [
        `Acceptable options — ${acceptable.length}`,
        `Reachability spread — ${acceptable
          .map((it) => it.tier)
          .filter((t, i, arr) => arr.indexOf(t) === i)
          .join(', ')}`,
        'If none of these close in your favour, the list produces no seat.',
      ],
      causedBy: 'Coverage rule · No Safe option below your Dream/Target choices',
      itemIds: acceptable.map((it) => it.itemId),
      actions: [
        {
          id: 'coverage:review-constraints',
          kind: 'CHANGE_CONSTRAINT',
          label: 'Review my constraints',
          effect:
            'Takes you back to your profile. Widening budget, distance or branches may surface a safe fallback.',
          intent: 'primary',
          target: { constraint: 'budget', newValue: profile.budget.value },
        },
        {
          id: 'coverage:accept-risk',
          kind: 'ACKNOWLEDGE',
          label: 'Accept the risk',
          effect:
            'Keeps the list as-is. We will not insert a college you did not ask for.',
          intent: 'secondary',
          requiresReason: true,
        },
      ],
    },
  ]
}

function duplicateConflicts(items: StrategyItem[]): Conflict[] {
  const seen = new Map<string, StrategyItem>()
  const out: Conflict[] = []

  for (const item of items) {
    const first = seen.get(item.option.id)
    if (!first) {
      seen.set(item.option.id, item)
      continue
    }
    out.push({
      id: conflictId('CF-07', first.itemId, item.itemId),
      code: 'CF-07',
      severity: 'WARNING',
      title: 'Duplicate option',
      summary: `${item.option.collegeShort} · ${item.option.branch} appears twice in your list.`,
      evidence: [
        `#${first.position} — ${item.option.college}, ${item.option.branch}`,
        `#${item.position} — same canonical option (${item.option.id})`,
        'A repeated choice wastes a slot; it does not improve your chances.',
      ],
      causedBy: 'Data rule · Canonical option id appears more than once',
      itemIds: [first.itemId, item.itemId],
      actions: [
        {
          id: `${item.itemId}:dedupe`,
          kind: 'DEDUPE',
          label: `Remove the copy at #${item.position}`,
          effect: `Keeps #${first.position} and drops the later duplicate.`,
          intent: 'primary',
          target: { itemId: item.itemId },
        },
      ],
    })
  }
  return out
}

const FACT_LABELS: Record<string, string> = {
  annualFee: 'annual fee',
  closingRank: 'closing rank',
  placementScore: 'placement record',
  distanceKm: 'distance',
}

function evidenceConflicts(items: StrategyItem[]): Conflict[] {
  return items
    .filter((it) => it.option.missingFacts.length > 0)
    .map((item) => ({
      id: conflictId('CF-08', item.itemId),
      code: 'CF-08' as const,
      severity: 'WARNING' as Severity,
      title: 'Evidence gap',
      summary: `We cannot verify ${item.option.missingFacts
        .map((f) => FACT_LABELS[f] ?? f)
        .join(', ')} for ${item.option.collegeShort}.`,
      evidence: [
        `Missing facts — ${item.option.missingFacts.map((f) => FACT_LABELS[f] ?? f).join(', ')}`,
        `Source: ${item.option.sourceLabel} ${item.option.sourceYear}`,
        'Confidence downgraded to low. These facts were excluded from scoring rather than guessed.',
      ],
      causedBy: 'Evidence rule · Required fact missing from the dataset',
      itemIds: [item.itemId],
      actions: [
        removeAction(item.itemId, 'Remove until verified'),
        {
          id: `${item.itemId}:keep-unverified`,
          kind: 'ACKNOWLEDGE',
          label: 'Keep with low confidence',
          effect:
            'Keeps the option and marks it low-confidence. We will not claim it meets your budget.',
          intent: 'secondary',
          requiresReason: true,
        },
      ],
    }))
}

export const SEVERITY_ORDER: Severity[] = ['CRITICAL', 'WARNING', 'INFO']

export function runAudit(
  profile: CandidateProfile,
  items: StrategyItem[],
  resolutions: Resolution[],
): { conflicts: Conflict[]; counts: Record<Severity, number>; canLock: boolean } {
  const resolvedIds = new Set(resolutions.map((r) => r.conflictId))

  const all = [
    ...budgetConflicts(profile, items),
    ...distanceConflicts(profile, items),
    ...exclusionConflicts(profile, items),
    ...branchPriorityConflicts(profile, items),
    ...dominatedConflicts(profile, items),
    ...duplicateConflicts(items),
    ...evidenceConflicts(items),
    ...coverageConflicts(profile, items),
  ]

  const conflicts = all
    .filter((c) => c.severity === 'CRITICAL' || !resolvedIds.has(c.id))
    .sort(
      (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
    )

  const counts: Record<Severity, number> = { CRITICAL: 0, WARNING: 0, INFO: 0 }
  for (const c of conflicts) counts[c.severity] += 1

  return {
    conflicts,
    counts,
    canLock: counts.CRITICAL === 0 && counts.WARNING === 0,
  }
}
