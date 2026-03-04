import { createError, defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    agent_id: string
    challenge: string
    signature: string
  }>(event)

  if (!body.agent_id || !body.challenge || !body.signature) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields: agent_id, challenge, signature' })
  }

  const { agentStore, keyStore } = useIdpStores()
  const { challengeStore } = useGrantStores()

  const valid = await challengeStore.consumeChallenge(body.challenge, body.agent_id)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid, expired, or already used challenge' })
  }

  const agent = await agentStore.findById(body.agent_id)
  if (!agent || !agent.isActive) {
    throw createError({ statusCode: 404, statusMessage: 'Agent not found or inactive' })
  }

  const signatureBuffer = Buffer.from(body.signature, 'base64')
  const isValid = verifyEd25519Signature(agent.publicKey, body.challenge, signatureBuffer)
  if (!isValid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  const signingKey = await keyStore.getSigningKey()
  const token = await issueAgentToken(
    { sub: agent.email },
    getIdpIssuer(),
    signingKey.privateKey,
    signingKey.kid,
  )

  return {
    token,
    agent_id: agent.id,
    email: agent.email,
    name: agent.name,
    expires_in: 3600,
  }
})
