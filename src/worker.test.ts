import { expect, test } from 'bun:test'

test('worker module imports without Cloudflare bindings at module load time', async () => {
  const worker = await import('./worker')

  expect(worker.default.fetch).toBeFunction()
})
