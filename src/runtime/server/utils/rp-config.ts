import type { RPConfig } from '@openape/auth'
import { useRuntimeConfig } from 'nitropack/runtime'

export function getRPConfig(): RPConfig {
  const config = useRuntimeConfig()
  const idpConfig = config.openapeIdp || {} as Record<string, any>

  const rpName = idpConfig.rpName || 'OpenApe Identity Server'
  const rpID = idpConfig.rpID || 'localhost'
  const origin = idpConfig.rpOrigin || `http://${rpID}:3000`

  return {
    rpName,
    rpID,
    origin,
    requireUserVerification: idpConfig.requireUserVerification ?? false,
    residentKey: idpConfig.residentKey || 'preferred',
    attestationType: idpConfig.attestationType || 'none',
  }
}
