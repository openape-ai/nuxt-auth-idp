import type { RPConfig } from '@openape/auth'
import { useRuntimeConfig } from 'nitropack/runtime'

export function getRPConfig(): RPConfig {
  const config = useRuntimeConfig()
  const idpConfig = config.openapeIdp || {} as Record<string, any>

  const rpName = idpConfig.rpName || 'OpenAPE Identity Server'
  // Nuxt env mapping can produce various casings — check all possibilities
  const rpID = idpConfig.rpID || idpConfig.rpId || idpConfig.rpid || idpConfig.rPID || idpConfig.rp_id || 'localhost'
  const origin = idpConfig.rpOrigin || idpConfig.rporigin || `http://${rpID}:3000`
  // Debug: log the actual keys to diagnose env mapping
  if (rpID === 'localhost') {
    console.warn('[rp-config] rpID resolved to localhost! idpConfig keys:', Object.keys(idpConfig).filter(k => k.toLowerCase().includes('rp')), 'values:', JSON.stringify({ rpID: idpConfig.rpID, rpId: idpConfig.rpId, rpid: idpConfig.rpid }))
  }

  return {
    rpName,
    rpID,
    origin,
    requireUserVerification: idpConfig.requireUserVerification ?? false,
    residentKey: idpConfig.residentKey || 'preferred',
    attestationType: idpConfig.attestationType || 'none',
  }
}
