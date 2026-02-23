import type { RPConfig } from '@openape/auth'

export function getRPConfig(): RPConfig {
  const config = useRuntimeConfig()
  const idpConfig = config.openapeIdp || {} as Record<string, string>

  const rpName = idpConfig.rpName || 'OpenAPE Identity Server'
  const rpID = idpConfig.rpID || 'localhost'
  const origin = idpConfig.rpOrigin || `http://${rpID}:3000`

  return { rpName, rpID, origin }
}
