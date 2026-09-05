import { runStrategyEngine } from '../src/mock/engine'
import { runAudit } from '../src/mock/audit'
import { latestSetFor } from '../src/data/generated'
import type { AuthorityId } from '../src/data/authorities'
import type { CandidateProfile } from '../src/types'

const profile: CandidateProfile = {
  rank: 12500,
  rankType: 'CRL',
  category: 'GEN',
  domicile: 'UP',
  subQuotas: [],
  homeCity: 'Lucknow',
  branchPriority: ['CSE', 'IT', 'ECE'],
  budget: { value: 150000, mode: 'hard' },
  distance: { value: 300, mode: 'hard' },
  hardExclusions: [],
  factorWeights: { placements: 4, fees: 3, location: 3, campus: 2, hostel: 2 },
}

for (const authority of ['UPTAC', 'JOSAA', 'IPU'] satisfies AuthorityId[]) {
  const set = latestSetFor(authority)
  const items = runStrategyEngine(profile, {
    authority,
    year: set?.year ?? 2024,
    round: set?.round ?? 1,
  })
  const audit = runAudit(profile, items, [])
  const duplicateLabels = items.length - new Set(items.map((item) => `${item.option.college}|${item.option.branch}`)).size
  console.log(JSON.stringify({
    authority,
    set,
    count: items.length,
    tiers: Object.fromEntries(
      ['DREAM', 'TARGET', 'SAFE', 'UNKNOWN'].map((tier) => [
        tier,
        items.filter((item) => item.tier === tier).length,
      ]),
    ),
    lowConfidence: items.filter((item) => item.confidence === 'low').length,
    unknownDistance: items.filter((item) => item.option.distanceKm == null).length,
    unknownFee: items.filter((item) => item.option.annualFee == null).length,
    duplicateLabels,
    audit: audit.counts,
    sample: items.slice(0, 6).map((item) => ({
      option: `${item.option.collegeShort} / ${item.option.branch}`,
      city: item.option.city,
      closingRank: item.option.closingRank,
      tier: item.tier,
    })),
  }, null, 2))
}
