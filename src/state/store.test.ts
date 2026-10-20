import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { expect, test, vi } from 'vitest'

vi.mock('../mock/api', () => { throw new Error('Strategy API loaded before an operation') })
vi.mock('../data/generated', () => { throw new Error('Generated data loaded on the landing page') })
vi.mock('../data/cutoffs', () => { throw new Error('Cutoffs loaded on the landing page') })

test('renders the initial candidate state without loading strategy data', async () => {
  const { AppProvider, useAppState } = await import('./store')
  function Probe() {
    const { step, profile, items, audit, busy } = useAppState()
    return createElement('output', null, JSON.stringify({ step, rank: profile.rank, items, audit, busy }))
  }

  const output = renderToString(createElement(AppProvider, null, createElement(Probe)))
  expect(output).toContain('&quot;step&quot;:&quot;landing&quot;')
  expect(output).toContain('&quot;rank&quot;:null')
  expect(output).toContain('&quot;items&quot;:[]')
  expect(output).toContain('&quot;audit&quot;:null')
  expect(output).toContain('&quot;busy&quot;:null')
})
