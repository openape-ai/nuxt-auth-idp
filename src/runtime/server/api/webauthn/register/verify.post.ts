import { createError, defineEventHandler, readBody } from 'h3'
import { verifyRegistration } from '@openape/auth'
import { getAppSession } from '../../../utils/session'
import { getRPConfig } from '../../../utils/rp-config'
import { useIdpStores } from '../../../utils/stores'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token: string, challengeToken: string, response: any, deviceName?: string }>(event)
  if (!body.token || !body.challengeToken || !body.response) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields: token, challengeToken, response' })
  }

  const { registrationUrlStore, challengeStore, credentialStore, userStore } = useIdpStores()
  const rpConfig = getRPConfig()

  const regUrl = await registrationUrlStore.find(body.token)
  if (!regUrl) {
    throw createError({ statusCode: 404, statusMessage: 'Invalid or expired registration URL' })
  }

  const challenge = await challengeStore.consume(body.challengeToken)
  if (!challenge) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired challenge' })
  }

  const { verified, credential } = await verifyRegistration(body.response, challenge.challenge, rpConfig, regUrl.email)
  if (!verified || !credential) {
    throw createError({ statusCode: 400, statusMessage: 'Registration verification failed' })
  }

  if (body.deviceName) {
    credential.name = body.deviceName
  }

  // Create user if not exists
  const existingUser = await userStore.findByEmail(regUrl.email)
  if (!existingUser) {
    await userStore.create(regUrl.email, regUrl.name)
  }

  await credentialStore.save(credential)

  // Only consume the token after everything succeeded
  await registrationUrlStore.consume(body.token)

  // Create session
  const session = await getAppSession(event)
  await session.update({ userId: regUrl.email, userName: regUrl.name })

  return { ok: true, email: regUrl.email, name: regUrl.name }
})
