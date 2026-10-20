import type { StrategyItem } from '../types'

export function renumber(items: StrategyItem[]): StrategyItem[] {
  return items.map((item, i) => ({ ...item, position: i + 1 }))
}
