import { describe, expect, it } from 'vitest'
import module from '../src/module'

describe('nuxt-auth-idp module', () => {
  it('exposes expected metadata', async () => {
    const meta = await module.getMeta()
    expect(meta.name).toBe('@openape/nuxt-auth-idp')
    expect(meta.configKey).toBe('openapeIdp')
  })
})
