import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('#config', () => {
  test('Should not throw and should report isProduction false outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('SESSION_COOKIE_PASSWORD', undefined)

    const { config } = await import('./config.js')

    expect(config.get('isProduction')).toBe(false)
  })

  test('Should throw on import when running in production with the default insecure cookie password', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('SESSION_COOKIE_PASSWORD', undefined)

    await expect(import('./config.js')).rejects.toThrow(
      'SESSION_COOKIE_PASSWORD must be set in production'
    )
  })

  test('Should not throw in production when SESSION_COOKIE_PASSWORD is overridden', async () => {
    const overriddenPassword =
      'a-unique-production-password-that-is-at-least-32-characters-long'
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('SESSION_COOKIE_PASSWORD', overriddenPassword)

    const { config } = await import('./config.js')

    expect(config.get('isProduction')).toBe(true)
    expect(config.get('session.cookie.password')).toBe(overriddenPassword)
  })
})
