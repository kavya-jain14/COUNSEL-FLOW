import type { CollegeOption } from '../types'
import type { AuthorityId } from './authorities'
import rawOptions from './generated/options.json'
import rawCutoffs from './generated/cutoffs.json'

interface GeneratedOption extends CollegeOption {
  authority: AuthorityId
}

interface GeneratedCutoff {
  a: string
  y: number
  r: number
  o: string
  p: string
  c: number
}

const ALL_OPTIONS = rawOptions as GeneratedOption[]
const ALL_CUTOFFS = rawCutoffs as GeneratedCutoff[]

export const GENERATED_OPTIONS_BY_AUTHORITY: Partial<Record<AuthorityId, CollegeOption[]>> = {}
for (const option of ALL_OPTIONS) {
  const list = (GENERATED_OPTIONS_BY_AUTHORITY[option.authority] ??= [])
  const { authority: _authority, ...rest } = option
  void _authority
  list.push(rest)
}

const GENERATED_INDEX = new Map<string, number>()
for (const cutoff of ALL_CUTOFFS) {
  GENERATED_INDEX.set(`${cutoff.a}|${cutoff.y}|${cutoff.r}|${cutoff.o}|${cutoff.p}`, cutoff.c)
}

export function generatedClosingRank(
  authority: AuthorityId,
  year: number,
  round: number,
  optionId: string,
  seatPool: string,
): number | null {
  return GENERATED_INDEX.get(`${authority}|${year}|${round}|${optionId}|${seatPool}`) ?? null
}

export const GENERATED_SETS = [...new Set(ALL_CUTOFFS.map((c) => `${c.a}|${c.y}|${c.r}`))].map(
  (key) => {
    const [authority, year, round] = key.split('|')
    return { authority: authority as AuthorityId, year: Number(year), round: Number(round) }
  },
)

export function latestSetFor(authority: AuthorityId): { year: number; round: number } | null {
  const sets = GENERATED_SETS.filter((s) => s.authority === authority)
  if (sets.length === 0) return null
  return sets.sort((a, b) => b.year - a.year || b.round - a.round)[0]
}
