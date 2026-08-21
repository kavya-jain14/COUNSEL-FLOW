import type { StrategyItem } from '../types'

export interface RoundRecord {
  round: number
  items: StrategyItem[]
  snapshotId: string | null
  allottedOptionId: string | null
  allottedLabel: string | null
}

export interface ImprovementResult {
  items: StrategyItem[]
  droppedCount: number
  heldPosition: number | null
  exhausted: boolean
}

export function labelFor(item: StrategyItem): string {
  return `${item.option.collegeShort} · ${item.option.branch}`
}

export function improvementsOver(
  items: StrategyItem[],
  allottedOptionId: string | null,
): ImprovementResult {
  if (!allottedOptionId) {
    return { items, droppedCount: 0, heldPosition: null, exhausted: items.length === 0 }
  }

  const heldIndex = items.findIndex((item) => item.option.id === allottedOptionId)
  if (heldIndex < 0) {
    return { items, droppedCount: 0, heldPosition: null, exhausted: items.length === 0 }
  }

  const better = items.slice(0, heldIndex)
  return {
    items: better.map((item, i) => ({ ...item, position: i + 1 })),
    droppedCount: items.length - better.length,
    heldPosition: heldIndex + 1,
    exhausted: better.length === 0,
  }
}
