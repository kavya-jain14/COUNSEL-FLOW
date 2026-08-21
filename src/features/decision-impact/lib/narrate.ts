import { formatINR, formatINRExact, formatKm, formatRank } from '../../../lib/format'
import type {
  DecisionImpact,
  ImpactCode,
  ImpactFacts,
  ImpactFinding,
} from './types'

export interface NarratedFinding extends ImpactFinding {
  headline: string
  detail: string
  clause: string
  yourWords: string | null
}

export interface NarratedImpact {
  impact: DecisionImpact
  source: 'template' | 'assisted'
  blocking: NarratedFinding[]
  works: NarratedFinding[]
  compromises: NarratedFinding[]
  risks: NarratedFinding[]
  consequences: NarratedFinding[]
  unknowns: NarratedFinding[]
  bottomLine: string[]
}

export type ImpactNarrator = (impact: DecisionImpact) => NarratedImpact

interface Rendered {
  headline: string
  detail: string
  clause?: string
  yourWords?: string
}

interface RenderInput {
  facts: ImpactFacts
  impact: DecisionImpact
}

function num(facts: ImpactFacts, key: string): number {
  const value = facts[key]
  return typeof value === 'number' ? value : 0
}

function maybeNum(facts: ImpactFacts, key: string): number | null {
  const value = facts[key]
  return typeof value === 'number' ? value : null
}

function str(facts: ImpactFacts, key: string, fallback = ''): string {
  const value = facts[key]
  return value == null ? fallback : String(value)
}

function bool(facts: ImpactFacts, key: string): boolean {
  return facts[key] === true
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}

function limitWord(mode: string): string {
  return mode === 'hard' ? 'hard limit' : 'soft preference'
}

const RENDERERS: Record<ImpactCode, (input: RenderInput) => Rendered> = {
  BRANCH_FIRST_CHOICE: ({ facts }) => ({
    headline: `${str(facts, 'branch')} is your first-choice branch`,
    detail: `You ranked ${str(facts, 'order')}. This option gives you the branch at the top of that list, so nothing about the branch is being traded away here.`,
    clause: `your first-choice branch`,
    yourWords: `Branch order: ${str(facts, 'order')}`,
  }),

  BRANCH_DOWNGRADE: ({ facts }) => {
    const choice = num(facts, 'choiceNumber')
    const steps = num(facts, 'stepsDown')
    return {
      headline: `${str(facts, 'branch')} is your #${choice} branch, not your first choice`,
      detail: `You ranked ${str(facts, 'order')}. Taking this means accepting ${str(facts, 'branch')} over ${str(facts, 'passedOver')}: ${steps === 1 ? 'a one-step' : `a ${steps}-step`} move down your own order, ${steps === 1 ? 'which is the smallest branch compromise on offer' : 'which is a real branch compromise'}.`,
      clause: `${str(facts, 'branch')} instead of your first-choice ${str(facts, 'firstChoice')}`,
      yourWords: `Branch order: ${str(facts, 'order')}`,
    }
  },

  BRANCH_UNRANKED: ({ facts }) => ({
    headline: `${str(facts, 'branch')} is not in your branch order at all`,
    detail: `You ranked ${str(facts, 'order')} and never placed ${str(facts, 'branch')} among them. Choosing this is a branch you did not ask for, not a lower-ranked one you did.`,
    clause: `a branch you never ranked`,
    yourWords: `Branch order: ${str(facts, 'order')}`,
  }),

  BRANCH_EXCLUDED: ({ facts }) => ({
    headline: `You marked ${str(facts, 'branch')} as never-accept`,
    detail: `Your profile carries the exclusion "${str(facts, 'exclusionLabel')}". This option is in exactly that branch, so keeping it contradicts a limit you set as absolute: not one you weighted.`,
    clause: `a branch you excluded outright`,
    yourWords: str(facts, 'exclusionLabel'),
  }),

  BRANCH_AVAILABLE_ELSEWHERE: ({ facts }) => {
    const count = num(facts, 'count')
    const ahead = num(facts, 'aheadOfThis')
    return {
      headline: `${count} ${plural(count, 'option', 'options')} on your list ${plural(count, 'sits', 'sit')} in a branch you ranked higher`,
      detail: `${str(facts, 'exampleName')} at #${num(facts, 'examplePosition')} (${str(facts, 'exampleTier').toLowerCase()}) is one of them. ${ahead > 0 ? `${ahead} of them already sit above this option, so the branch compromise only bites if those close above your rank.` : 'All of them sit below this option, so you would reach this one first.'}`,
      clause: `a better-ranked branch that is still on your list`,
    }
  },

  FEE_WITHIN: ({ facts }) => ({
    headline: `${formatINRExact(num(facts, 'fee'))}/yr leaves ${formatINRExact(num(facts, 'spare'))} under your ceiling`,
    detail: `You set ${formatINR(num(facts, 'limit'))} a year as a ${limitWord(str(facts, 'mode'))} and rated lower fees "${str(facts, 'weightWord')}". Across four years that spare adds up to about ${formatINR(num(facts, 'spareFourYears'))}.`,
    clause: `real room under your budget`,
    yourWords: `Annual budget: ${formatINR(num(facts, 'limit'))}, ${limitWord(str(facts, 'mode'))}`,
  }),

  FEE_TIGHT: ({ facts }) => ({
    headline: `Uses ${num(facts, 'usedPct')}% of your annual budget`,
    detail: `${formatINRExact(num(facts, 'fee'))}/yr against your ${formatINR(num(facts, 'limit'))} ceiling leaves only ${formatINRExact(num(facts, 'spare'))} of room. ${str(facts, 'mode') === 'hard' ? 'A fee revision would push this past a limit you marked non-negotiable.' : 'A fee revision would push this past the budget you named.'}`,
    clause: `almost no budget headroom`,
    yourWords: `Annual budget: ${formatINR(num(facts, 'limit'))}, ${limitWord(str(facts, 'mode'))}`,
  }),

  FEE_HARD_BREACH: ({ facts }) => ({
    headline: `${formatINRExact(num(facts, 'over'))}/yr above the ceiling you called non-negotiable`,
    detail: `${formatINRExact(num(facts, 'fee'))}/yr against the ${formatINR(num(facts, 'limit'))} you set as a hard limit: about ${formatINR(num(facts, 'overFourYears'))} extra across four years. Keeping this means raising the ceiling or softening it, not ignoring it.`,
    clause: `a budget you declared as absolute`,
    yourWords: `Annual budget: ${formatINR(num(facts, 'limit'))}, hard limit`,
  }),

  FEE_SOFT_BREACH: ({ facts }) => ({
    headline: `${formatINRExact(num(facts, 'over'))}/yr above your preferred budget`,
    detail: `${formatINRExact(num(facts, 'fee'))}/yr against the ${formatINR(num(facts, 'limit'))} you named. You marked budget a soft preference, so this stays eligible: it costs you about ${formatINR(num(facts, 'overFourYears'))} more across four years than you planned for.`,
    clause: `${formatINR(num(facts, 'over'))}/yr more than you planned to pay`,
    yourWords: `Annual budget: ${formatINR(num(facts, 'limit'))}, soft preference`,
  }),

  FEE_ABOVE_LIST: ({ facts }) => {
    const cheaper = num(facts, 'cheaperCount')
    return {
      headline: `Costs more than ${cheaper} of the ${num(facts, 'comparedCount')} priced options on your list`,
      detail: `${str(facts, 'cheapestName')} at #${num(facts, 'cheapestPosition')} is ${formatINRExact(num(facts, 'delta'))}/yr cheaper: about ${formatINR(num(facts, 'deltaFourYears'))} over the degree. You rated lower fees "${str(facts, 'weightWord')}", so this is a cost you are choosing to carry.`,
      clause: `a higher fee than most of your own list`,
    }
  },

  FEE_UNKNOWN: ({ facts }) => ({
    headline: 'Annual fee is not on record',
    detail: `Your ${formatINR(num(facts, 'limit'))} ${limitWord(str(facts, 'mode'))} cannot be checked against this option. The fee was excluded from scoring rather than guessed, so treat any budget claim here as unverified.`,
    clause: `an unverified fee`,
  }),

  DISTANCE_WITHIN: ({ facts }) => ({
    headline:
      num(facts, 'km') === 0
        ? `In ${str(facts, 'homeCity', 'your home city')} itself: no travel against a ${formatKm(num(facts, 'limit'))} limit`
        : `${formatKm(num(facts, 'km'))} from ${str(facts, 'homeCity', 'home')}: ${formatKm(num(facts, 'spare'))} inside your limit`,
    detail: `You set ${formatKm(num(facts, 'limit'))} as a ${limitWord(str(facts, 'mode'))} and rated staying close to home "${str(facts, 'weightWord')}". ${num(facts, 'nearerCount') === 0 ? 'Nothing else on your list is closer.' : `${num(facts, 'nearerCount')} ${plural(num(facts, 'nearerCount'), 'option is', 'options are')} closer and ${num(facts, 'fartherCount')} ${plural(num(facts, 'fartherCount'), 'is', 'are')} further.`}${bool(facts, 'commutable') ? ' Close enough to consider living at home.' : ''}`,
    clause: `a location that matches your distance preference`,
    yourWords: `Distance from home: ${formatKm(num(facts, 'limit'))}, ${limitWord(str(facts, 'mode'))}`,
  }),

  DISTANCE_TIGHT: ({ facts }) => ({
    headline: `${formatKm(num(facts, 'km'))}: ${num(facts, 'usedPct')}% of the distance you said you would travel`,
    detail: `Only ${formatKm(num(facts, 'spare'))} of margin against your ${formatKm(num(facts, 'limit'))} ${limitWord(str(facts, 'mode'))} from ${str(facts, 'homeCity', 'home')}. Distances are straight-line between city centres, so real travel is typically 20-30% longer than this figure.`,
    clause: `a distance sitting at the edge of your limit`,
    yourWords: `Distance from home: ${formatKm(num(facts, 'limit'))}, ${limitWord(str(facts, 'mode'))}`,
  }),

  DISTANCE_HARD_BREACH: ({ facts }) => ({
    headline: `${formatKm(num(facts, 'over'))} beyond the travel limit you called non-negotiable`,
    detail: `${str(facts, 'city')} is ${formatKm(num(facts, 'km'))} from ${str(facts, 'homeCity', 'your home city')}, against the ${formatKm(num(facts, 'limit'))} you set as a hard limit. Keeping this means extending that radius for every option, not just this one.`,
    clause: `a distance you declared as absolute`,
    yourWords: `Distance from home: ${formatKm(num(facts, 'limit'))}, hard limit`,
  }),

  DISTANCE_SOFT_BREACH: ({ facts }) => ({
    headline: `${formatKm(num(facts, 'over'))} further than you wanted to travel`,
    detail: `${str(facts, 'city')} is ${formatKm(num(facts, 'km'))} from ${str(facts, 'homeCity', 'your home city')} against the ${formatKm(num(facts, 'limit'))} you named. You marked distance a soft preference and rated staying close "${str(facts, 'weightWord')}", so this ranks lower rather than being removed.`,
    clause: `${formatKm(num(facts, 'over'))} more travel than you asked for`,
    yourWords: `Distance from home: ${formatKm(num(facts, 'limit'))}, soft preference`,
  }),

  DISTANCE_UNKNOWN: ({ facts }) => ({
    headline: `Distance from ${str(facts, 'homeCity', 'home')} could not be measured`,
    detail: `${str(facts, 'city')} is not in the distance table, so your travel limit was not applied to this option and location did not contribute to its score.`,
    clause: `an unmeasured distance`,
  }),

  PLACEMENT_STRONG: ({ facts }) => ({
    headline: `Placement index ${num(facts, 'score')}/100: you rated placements "${str(facts, 'weightWord')}"`,
    detail: `${num(facts, 'betterCount') === 0 ? 'No option on your list records a stronger placement figure.' : `${num(facts, 'betterCount')} of ${num(facts, 'comparedCount')} other options record higher, led by ${str(facts, 'bestName')} at #${maybeNum(facts, 'bestPosition') ?? 0} on ${maybeNum(facts, 'bestScore') ?? 0}/100.`} This is the factor you weighted most of your ordering on.`,
    clause: `the placement record you weighted "${str(facts, 'weightWord')}"`,
    yourWords: `Placement record: ${str(facts, 'weightWord')}`,
  }),

  PLACEMENT_MID: ({ facts }) => ({
    headline: `Placement index ${num(facts, 'score')}/100 is mid-table for a factor you rated "${str(facts, 'weightWord')}"`,
    detail: `${num(facts, 'betterCount')} of ${num(facts, 'comparedCount')} other options on your list record higher, and ${num(facts, 'betterBelowCount')} of those sit below this one. You are ranking a weaker placement record above stronger ones.`,
    clause: `a mid-table placement record`,
    yourWords: `Placement record: ${str(facts, 'weightWord')}`,
  }),

  PLACEMENT_WEAK: ({ facts }) => ({
    headline: `Placement index ${num(facts, 'score')}/100 against a factor you rated "${str(facts, 'weightWord')}"`,
    detail: `${str(facts, 'bestName')} at #${maybeNum(facts, 'bestPosition') ?? 0} records ${maybeNum(facts, 'bestScore') ?? 0}/100. Choosing this one means accepting the weaker record on the single factor you said should tip the balance.`,
    clause: `a weak placement record on the factor you weighted "${str(facts, 'weightWord')}"`,
    yourWords: `Placement record: ${str(facts, 'weightWord')}`,
  }),

  PLACEMENT_UNKNOWN: ({ facts }) => ({
    headline: 'No placement record on file',
    detail: `You rated placements "${str(facts, 'weightWord')}", but this option has no recorded placement index. It was excluded from scoring rather than estimated, so this option's position understates nothing and promises nothing.`,
    clause: `no placement evidence`,
  }),

  CAMPUS_STRONG: ({ facts }) => ({
    headline: `Campus index ${num(facts, 'score')}/100: you rated facilities "${str(facts, 'weightWord')}"`,
    detail: `${num(facts, 'betterCount')} of ${num(facts, 'comparedCount')} other options record higher on the campus factor you weighted.`,
    clause: `the campus quality you asked for`,
    yourWords: `Campus & facilities: ${str(facts, 'weightWord')}`,
  }),

  CAMPUS_WEAK: ({ facts }) => ({
    headline: `Campus index ${num(facts, 'score')}/100 against a factor you rated "${str(facts, 'weightWord')}"`,
    detail: `${str(facts, 'bestName')} at #${maybeNum(facts, 'bestPosition') ?? 0} records ${maybeNum(facts, 'bestScore') ?? 0}/100. Campus quality is something you said should move options, and this one is on the wrong side of it.`,
    clause: `weaker campus facilities than you weighted for`,
    yourWords: `Campus & facilities: ${str(facts, 'weightWord')}`,
  }),

  HOSTEL_AVAILABLE: ({ facts }) => ({
    headline: `Hostel is listed: you rated hostel availability "${str(facts, 'weightWord')}"`,
    detail: `${maybeNum(facts, 'km') == null ? 'Accommodation on campus is on record for this college.' : `At ${formatKm(num(facts, 'km'))} from ${str(facts, 'homeCity', 'home')}, on-campus accommodation is what makes this option practical day to day.`}`,
    clause: `hostel accommodation you said you needed`,
    yourWords: `Hostel availability: ${str(facts, 'weightWord')}`,
  }),

  HOSTEL_MISSING: ({ facts }) => ({
    headline: `No hostel on record: you rated hostel availability "${str(facts, 'weightWord')}"`,
    detail: `${str(facts, 'college')} lists no hostel in the dataset. You weighted this factor, so accepting the option means solving accommodation yourself.`,
    clause: `no hostel, on a factor you weighted "${str(facts, 'weightWord')}"`,
    yourWords: `Hostel availability: ${str(facts, 'weightWord')}`,
  }),

  HOSTEL_EXCLUDED: ({ facts }) => ({
    headline: 'You marked colleges without a hostel as never-accept',
    detail: `Your profile carries "${str(facts, 'exclusionLabel')}" and ${str(facts, 'college')} lists no hostel. This is an absolute exclusion you set, not a weighted preference.`,
    clause: `a college with no hostel, which you excluded outright`,
    yourWords: str(facts, 'exclusionLabel'),
  }),

  HOSTEL_NO_COMMUTE: ({ facts }) => ({
    headline: `${formatKm(num(facts, 'km'))} from home with no hostel on record`,
    detail: `${str(facts, 'city')} is well past the ${formatKm(num(facts, 'commuteKm'))} you could realistically commute from ${str(facts, 'homeCity', 'home')} daily, and no campus accommodation is listed. Private accommodation is an unpriced cost on top of the fee shown here.`,
    clause: `an unpriced accommodation cost`,
  }),

  TYPE_EXCLUDED: ({ facts }) => ({
    headline: `You marked ${str(facts, 'instituteType')} colleges as never-accept`,
    detail: `Your profile carries "${str(facts, 'exclusionLabel')}" and ${str(facts, 'college')} is a ${str(facts, 'instituteType').toLowerCase()} institute. This is an absolute exclusion, not a ranking penalty.`,
    clause: `an institute type you excluded outright`,
    yourWords: str(facts, 'exclusionLabel'),
  }),

  CITY_EXCLUDED: ({ facts }) => ({
    headline: `You marked ${str(facts, 'city')} as never-accept`,
    detail: `Your profile carries "${str(facts, 'exclusionLabel')}" and ${str(facts, 'college')} is in ${str(facts, 'city')}. This is an absolute exclusion, not a ranking penalty.`,
    clause: `a city you excluded outright`,
    yourWords: str(facts, 'exclusionLabel'),
  }),

  REACH_DREAM: ({ facts }) => ({
    headline: `Closed ${num(facts, 'gapPct')}% above your rank last cycle`,
    detail: `In the ${str(facts, 'pool')} pool this closed at ${formatRank(num(facts, 'closingRank'))} in ${num(facts, 'year')}; your rank is ${formatRank(num(facts, 'rank'))}. It is a stretch, not a plan: worth holding high because a favourable cycle costs you nothing, but the list still needs something below it that closes for you.`,
    clause: `a seat that closed above your rank last cycle`,
    yourWords: `Your rank: ${formatRank(num(facts, 'rank'))} in ${str(facts, 'pool')}`,
  }),

  REACH_TARGET: ({ facts }) => ({
    headline: `Closed within reach of your rank last cycle`,
    detail: `In the ${str(facts, 'pool')} pool this closed at ${formatRank(num(facts, 'closingRank'))} in ${num(facts, 'year')} against your ${formatRank(num(facts, 'rank'))}. Realistic in a normal cycle: this is the band where your list does most of its work.`,
    clause: `a realistic shot at your rank`,
    yourWords: `Your rank: ${formatRank(num(facts, 'rank'))} in ${str(facts, 'pool')}`,
  }),

  REACH_SAFE: ({ facts }) => ({
    headline: `Closed ${num(facts, 'gapPct')}% below your rank last cycle`,
    detail: `In the ${str(facts, 'pool')} pool this closed at ${formatRank(num(facts, 'closingRank'))} in ${num(facts, 'year')} against your ${formatRank(num(facts, 'rank'))}. ${num(facts, 'safeCount') <= 1 ? 'It is the only fallback of its kind on your list: if it goes, the list has no floor.' : `It is one of ${num(facts, 'safeCount')} options likely to still be open when your turn comes.`}`,
    clause: `a fallback that is likely to still be open`,
    yourWords: `Your rank: ${formatRank(num(facts, 'rank'))} in ${str(facts, 'pool')}`,
  }),

  REACH_UNKNOWN: ({ facts }) => ({
    headline: 'No closing rank on record for your seat pool',
    detail: `Nothing in the dataset ties ${str(facts, 'college')} to a closing rank in the ${str(facts, 'pool')} pool, so reachability was not estimated. No number was invented in its place.`,
    clause: `no reachability evidence`,
  }),

  QUOTA_NOT_MODELLED: ({ facts }) => ({
    headline: `Your ${str(facts, 'quotas')} claim is not in this estimate`,
    detail: `Reachability here is measured in the ${str(facts, 'pool')} pool only. The loaded cutoffs do not carry sub-quota rows, so any extra pool you qualify for is excluded: the estimate is pessimistic rather than optimistic on that account.`,
    clause: `a quota pool this estimate cannot see`,
    yourWords: `Quotas claimed: ${str(facts, 'quotas')}`,
  }),

  ORDER_FORFEIT: ({ facts }) => {
    const below = num(facts, 'belowCount')
    const betterBranch = num(facts, 'betterBranchBelowCount')
    return {
      headline: `Being allotted this closes off the ${below} ${plural(below, 'option', 'options')} below it`,
      detail: `Allotment stops at the first choice that clears. Landing at #${num(facts, 'position')} means ${str(facts, 'firstBelowName')} and everything after it never gets considered this round${betterBranch > 0 ? `, including ${betterBranch} ${plural(betterBranch, 'option', 'options')} in a branch you ranked above this one${str(facts, 'betterBranchBelowName') && str(facts, 'betterBranchBelowName') !== str(facts, 'firstBelowName') ? ` such as ${str(facts, 'betterBranchBelowName')}` : ''}` : ''}.`,
      clause: `everything below #${num(facts, 'position')}`,
    }
  },

  ORDER_AHEAD: ({ facts }) => {
    const above = num(facts, 'aboveCount')
    const dream = num(facts, 'dreamAbove')
    if (above === 0) {
      return {
        headline: 'This is your first choice: nothing is tried before it',
        detail: `At #1 of ${num(facts, 'total')}, this is the option the system attempts first. Everything else on your list only comes into play if this one closes above your rank.`,
        clause: `first refusal on the whole list`,
      }
    }
    return {
      headline: `You only reach this if the ${above} ${plural(above, 'choice', 'choices')} above it close above your rank`,
      detail: `${str(facts, 'firstAboveName')} sits immediately above at #${num(facts, 'position') - 1}. ${dream > 0 ? `${dream} of the choices ahead ${plural(dream, 'is', 'are')} a stretch, which is what makes this position realistic rather than decorative.` : 'None of the choices ahead is a long shot, so this position is a genuine fallback rather than a likely landing spot.'}`,
      clause: `a position behind ${above} other ${plural(above, 'choice', 'choices')}`,
    }
  },

  CONTRADICTS_WEIGHT: ({ facts }) => ({
    headline: `You rated ${str(facts, 'factorLabel').toLowerCase()} "${str(facts, 'weightWord')}", yet this is the worst on your list for it`,
    detail: `This option records ${str(facts, 'thisValue')} against ${str(facts, 'bestName')}'s ${str(facts, 'bestValue')} at #${num(facts, 'bestPosition')}, and it still sits at #${num(facts, 'position')}. Either the weight or the position is not what you meant.`,
    clause: `a position that contradicts your "${str(facts, 'weightWord')}" rating on ${str(facts, 'factorLabel').toLowerCase()}`,
    yourWords: `${str(facts, 'factorLabel')}: ${str(facts, 'weightWord')}`,
  }),

  CONTRADICTS_BRANCH_ORDER: ({ facts }) => ({
    headline: `Sits above ${str(facts, 'counterpartBranch')}, which you ranked higher than ${str(facts, 'thisBranch')}`,
    detail: `Your order is ${str(facts, 'order')}, but ${str(facts, 'thisBranch')} is at #${num(facts, 'position')} and ${str(facts, 'counterpartName')} is at #${maybeNum(facts, 'counterpartPosition') ?? 0}. The audit raised this as a ${str(facts, 'severity').toLowerCase()}: resolve it there if the order was not deliberate.`,
    clause: `an order that inverts your own branch ranking`,
    yourWords: `Branch order: ${str(facts, 'order')}`,
  }),

  DOMINATED_BY_NEIGHBOUR: ({ facts }) => ({
    headline: `${str(facts, 'counterpartName')} matches or beats this on every factor you weighted`,
    detail: `It sits at #${maybeNum(facts, 'counterpartPosition') ?? 0}, ${bool(facts, 'aboveThis') ? 'just above' : 'just below'} this option at #${num(facts, 'position')}. Nothing you declared explains why this one is ranked where it is.`,
    clause: `a neighbour that beats it on your own factors`,
  }),

  NO_SAFE_FALLBACK: ({ facts }) => ({
    headline: 'Your list has no safe fallback under this choice',
    detail: `All ${num(facts, 'total')} options are dream or target reach, this one included (${str(facts, 'tier').toLowerCase()}). If cut-offs move against you, the list produces no seat at all: that is a list-level risk this option inherits.`,
    clause: `a list with no floor under it`,
  }),

  DUPLICATE_SLOT: ({ facts }) => ({
    headline: 'This option appears twice on your list',
    detail: `The same canonical option is at #${num(facts, 'position')} and #${maybeNum(facts, 'counterpartPosition') ?? 0}. The second slot is wasted: a repeated choice does not improve your chances of getting it.`,
    clause: `a wasted duplicate slot`,
  }),

  EVIDENCE_MISSING: ({ facts }) => ({
    headline: `${num(facts, 'count')} ${plural(num(facts, 'count'), 'fact', 'facts')} could not be verified`,
    detail: `${str(facts, 'facts')} ${plural(num(facts, 'count'), 'is', 'are')} missing for ${str(facts, 'college')}, so confidence is ${str(facts, 'confidence')}. Missing facts were excluded from scoring rather than guessed, which means this option was neither rewarded nor punished for them.`,
    clause: `unverified facts`,
  }),
}

function render(finding: ImpactFinding, impact: DecisionImpact): NarratedFinding {
  const rendered = RENDERERS[finding.code]({ facts: finding.facts, impact })
  return {
    ...finding,
    headline: rendered.headline,
    detail: rendered.detail,
    clause: rendered.clause ?? rendered.headline,
    yourWords: rendered.yourWords ?? null,
  }
}

function joinClauses(findings: NarratedFinding[], limit: number): string {
  const parts = findings.slice(0, limit).map((finding) => finding.clause)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

function buildBottomLine(
  impact: DecisionImpact,
  blocking: NarratedFinding[],
  works: NarratedFinding[],
  compromises: NarratedFinding[],
  risks: NarratedFinding[],
  consequences: NarratedFinding[],
): string[] {
  const lines: string[] = []

  if (blocking.length > 0) {
    lines.push(
      `Choosing ${impact.name} means overriding ${blocking.length} ${plural(blocking.length, 'limit', 'limits')} you set as absolute: ${joinClauses(blocking, 3)}. That is a change to your profile, not a detail to wave through: the list will not lock while it stands.`,
    )
  } else if (works.length > 0 && compromises.length > 0) {
    lines.push(
      `${impact.name} works for you if you are willing to trade ${joinClauses(compromises, 2)} for ${joinClauses(works, 2)}.`,
    )
  } else if (works.length > 0) {
    lines.push(
      `Nothing you declared argues against ${impact.name}: it gives you ${joinClauses(works, 3)}, and no preference of yours is compromised to get it.`,
    )
  } else if (compromises.length > 0) {
    lines.push(
      `${impact.name} asks you to accept ${joinClauses(compromises, 3)} without giving you anything you weighted in return.`,
    )
  } else {
    lines.push(
      `Nothing in your profile separates ${impact.name} from the rest of your list: it neither matches nor contradicts what you declared.`,
    )
  }

  const contradiction = risks.find((finding) => finding.label === 'CONTRADICTION')
  if (contradiction) {
    lines.push(`One thing does not line up. ${contradiction.headline}.`)
  }

  const reach = [...works, ...risks].find((finding) => finding.dimension === 'reach')
  const forfeit = consequences.find((finding) => finding.code === 'ORDER_FORFEIT')
  if (reach && forfeit) {
    lines.push(
      `At #${impact.position} of ${impact.total} it is ${reach.clause}, and being allotted it closes off ${forfeit.clause}.`,
    )
  } else if (reach) {
    lines.push(`At #${impact.position} of ${impact.total} it is ${reach.clause}.`)
  }

  return lines
}

export const narrateImpact: ImpactNarrator = (impact) => {
  const blocking = impact.blocking.map((finding) => render(finding, impact))
  const works = impact.works.map((finding) => render(finding, impact))
  const compromises = impact.compromises.map((finding) => render(finding, impact))
  const risks = impact.risks.map((finding) => render(finding, impact))
  const consequences = impact.consequences.map((finding) => render(finding, impact))
  const unknowns = impact.unknowns.map((finding) => render(finding, impact))

  return {
    impact,
    source: 'template',
    blocking,
    works,
    compromises,
    risks,
    consequences,
    unknowns,
    bottomLine: buildBottomLine(impact, blocking, works, compromises, risks, consequences),
  }
}
