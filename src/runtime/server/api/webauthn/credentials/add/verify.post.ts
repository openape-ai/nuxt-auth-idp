import { createError, defineEventHandler, readBody } from 'h3'
import { verifyRegistration } from '@openape/auth'
import { requireAuth } from '../../../../utils/admin'
import { getRPConfig } from '../../../../utils/rp-config'
import { useIdpStores } from '../../../../utils/stores'

export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)
  const body = await readBody<{ challengeToken: string, response: any, deviceName?: string }>(event)
  if (!body.challengeToken || !body.response) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields: challengeToken, response' })
  }

  const { challengeStore, credentialStore } = useIdpStores()
  const rpConfig = getRPConfig()

  const challenge = await challengeStore.consume(body.challengeToken)
  if (!challenge || challenge.userEmail !== userId) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired challenge' })
  }

  const { verified, credential } = await verifyRegistration(body.response, challenge.challenge, rpConfig, userId)
  if (!verified || !credential) {
    throw createError({ statusCode: 400, statusMessage: 'Registration verification failed' })
  }

  if (body.deviceName) {
    credential.name = body.deviceName
  }

  await credentialStore.save(credential)

  return { ok: true, credentialId: credential.credentialId }
})
