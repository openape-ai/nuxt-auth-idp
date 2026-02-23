import { createAgentStore } from './agent-store'
import { createCodeStore } from './code-store'
import { createKeyStore } from './key-store'
import { createUserStore } from './user-store'

let _stores: ReturnType<typeof initStores> | null = null

function initStores() {
  return {
    userStore: createUserStore(),
    codeStore: createCodeStore(),
    keyStore: createKeyStore(),
    agentStore: createAgentStore(),
  }
}

function getStores() {
  if (!_stores) {
    _stores = initStores()
  }
  return _stores
}

export const useIdpStores = getStores

export function getIdpIssuer(): string {
  const config = useRuntimeConfig()
  return config.openapeIdp?.issuer || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}
