import { defineEventHandler } from 'h3'
import { exportJWK } from 'jose'
import { useIdpStores } from '../../utils/stores'

export default defineEventHandler(async () => {
  const { keyStore } = useIdpStores()
  const entries = await keyStore.getAllPublicKeys()
  const keys = await Promise.all(
    entries.map(async (entry) => {
      const jwk = await exportJWK(entry.publicKey)
      return { ...jwk, kid: entry.kid, alg: 'ES256', use: 'sig' }
    }),
  )
  return { keys }
})
