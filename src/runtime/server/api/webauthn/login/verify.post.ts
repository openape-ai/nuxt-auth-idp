import { createError, defineEventHandler, readBody } from 'h3'
import { verifyAuthentication } from '@openape/auth'
import { getAppSession } from '../../../utils/session'
import { getRPConfig } from '../../../utils/rp-config'
import { useIdpStores } from '../../../utils/stores'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ challengeToken: string, response: any }>(event)
  if (!body.challengeToken || !body.response) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields: challengeToken, response' })
  }

  const { challengeStore, credentialStore, userStore } = useIdpStores()
  const rpConfig = getRPConfig()

  const challenge = await challengeStore.consume(body.challengeToken)
  if (!challenge) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired challenge' })
  }

  // Find the credential that was used
  const credentialId = body.response.id
  const credential = await credentialStore.findById(credentialId)
  if (!credential) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown credential' })
  }

  // If email was specified during options, verify it matches
  if (challenge.userEmail && credential.userEmail !== challenge.userEmail) {
    throw createError({ statusCode: 400, statusMessage: 'Credential does not belong to specified user' })
  }

  const { verified, newCounter } = await verifyAuthentication(body.response, challenge.challenge, rpConfig, credential)
  if (!verified) {
    throw createError({ statusCode: 400, statusMessage: 'Authentication verification failed' })
  }

  // Update counter
  if (newCounter !== undefined) {
    await credentialStore.updateCounter(credential.credentialId, newCounter)
  }

  const user = await userStore.findByEmail(credential.userEmail)
  if (!user) {
    throw createError({ statusCode: 400, statusMessage: 'User not found' })
  }

  // Create session
  const session = await getAppSession(event)
  await session.update({ userId: user.email, userName: user.name })

  return { ok: true, email: user.email, name: user.name }
})
