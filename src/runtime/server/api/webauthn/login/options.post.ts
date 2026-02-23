import { createAuthenticationOptions } from '@openape/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)

  const { credentialStore, challengeStore } = useIdpStores()
  const rpConfig = getRPConfig()

  let credentials
  if (body.email) {
    credentials = await credentialStore.findByUser(body.email)
    if (credentials.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'No passkeys found for this email' })
    }
  }

  const { options, challenge } = await createAuthenticationOptions(rpConfig, credentials)

  const challengeToken = crypto.randomUUID()
  await challengeStore.save(challengeToken, {
    challenge,
    userEmail: body.email,
    type: 'authentication',
    expiresAt: Date.now() + 5 * 60 * 1000,
  })

  return { options, challengeToken }
})
