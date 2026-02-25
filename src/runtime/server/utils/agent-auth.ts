import type { H3Event } from 'h3'
import { createError, getHeader } from 'h3'
import type { AgentTokenPayload } from './agent-token'
import { verifyAgentToken } from './agent-token'
import { getIdpIssuer, useIdpStores } from './stores'

export async function requireAgent(event: H3Event): Promise<AgentTokenPayload> {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Bearer token required' })
  }

  const token = authHeader.slice(7)
  const { keyStore } = useIdpStores()
  const signingKey = await keyStore.getSigningKey()

  try {
    return await verifyAgentToken(token, getIdpIssuer(), signingKey.publicKey)
  }
  catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired agent token' })
  }
}

export async function tryAgentAuth(event: H3Event): Promise<AgentTokenPayload | null> {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer '))
    return null

  const token = authHeader.slice(7)
  const { keyStore } = useIdpStores()
  const signingKey = await keyStore.getSigningKey()

  try {
    return await verifyAgentToken(token, getIdpIssuer(), signingKey.publicKey)
  }
  catch {
    return null
  }
}
