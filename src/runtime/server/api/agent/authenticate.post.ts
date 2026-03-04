import { createError, defineEventHandler, readBody } from 'h3'
import { getIdpIssuer, useIdpStores } from '../../utils/stores'
import { useGrantStores } from '../../utils/grant-stores'
import { verifyEd25519Signature } from '../../utils/ed25519'
import { issueAgentToken } from '../../utils/agent-token'

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

  const agent = body.agent_id.includes('@')
    ? await agentStore.findByEmail(body.agent_id)
    : await agentStore.findById(body.agent_id)
  if (!agent || !agent.isActive) {
    throw createError({ statusCode: 404, statusMessage: 'Agent not found or inactive' })
  }

  const valid = await challengeStore.consumeChallenge(body.challenge, agent.id)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid, expired, or already used challenge' })
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
