import type { AuthorizeParams } from '@openape/auth'
import type { ActorType } from '@openape/core'
import { createError, defineEventHandler, getQuery, getRequestURL, sendRedirect } from 'h3'
import { extractDomain, resolveDDISA } from '@openape/core'
import { evaluatePolicy, validateAuthorizeRequest } from '@openape/auth'
import { tryAgentAuth } from '../utils/agent-auth'
import { getAppSession } from '../utils/session'
import { useIdpStores } from '../utils/stores'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { codeStore } = useIdpStores()

  const params: AuthorizeParams = {
    sp_id: String(query.sp_id ?? ''),
    redirect_uri: String(query.redirect_uri ?? ''),
    state: String(query.state ?? ''),
    code_challenge: String(query.code_challenge ?? ''),
    code_challenge_method: String(query.code_challenge_method ?? ''),
    nonce: String(query.nonce ?? ''),
    response_type: String(query.response_type ?? ''),
  }

  const error = validateAuthorizeRequest(params)
  if (error) {
    throw createError({ statusCode: 400, statusMessage: error })
  }

  // Determine userId: Agent Bearer Token or Human Session
  const agentPayload = await tryAgentAuth(event)
  let userId: string
  let actorType: ActorType | undefined

  if (agentPayload) {
    userId = agentPayload.sub
    actorType = 'agent'
  }
  else {
    const session = await getAppSession(event)
    const loginHint = String(query.login_hint ?? '')
    if (!session.data.userId || (loginHint && session.data.userId !== loginHint)) {
      const returnTo = `/authorize?${new URLSearchParams(query as Record<string, string>).toString()}`
      await session.update({ pendingAuthorize: params, returnTo })
      const loginUrl = new URL('/login', getRequestURL(event).origin)
      loginUrl.searchParams.set('returnTo', returnTo)
      if (loginHint) {
        loginUrl.searchParams.set('login_hint', loginHint)
      }
      return sendRedirect(event, loginUrl.pathname + loginUrl.search)
    }
    userId = session.data.userId
  }

  const userDomain = extractDomain(userId)
  const ddisaRecord = await resolveDDISA(userDomain)
  const policyMode = ddisaRecord?.mode ?? 'open'
  const noopConsentStore = { hasConsent: async () => false, save: async () => {} }
  const decision = await evaluatePolicy(policyMode, params.sp_id, userId, noopConsentStore)

  if (decision !== 'allow') {
    const redirectUrl = new URL(params.redirect_uri)
    redirectUrl.searchParams.set('error', 'access_denied')
    redirectUrl.searchParams.set('state', params.state)
    return sendRedirect(event, redirectUrl.toString())
  }

  const code = crypto.randomUUID()
  await codeStore.save({
    code,
    spId: params.sp_id,
    redirectUri: params.redirect_uri,
    codeChallenge: params.code_challenge,
    userId,
    nonce: params.nonce,
    expiresAt: Date.now() + 60_000,
    act: actorType,
  })

  const redirectUrl = new URL(params.redirect_uri)
  redirectUrl.searchParams.set('code', code)
  redirectUrl.searchParams.set('state', params.state)

  // Session cleanup only for human flow
  if (!agentPayload) {
    const session = await getAppSession(event)
    await session.update({ pendingAuthorize: undefined, returnTo: undefined })
  }

  return sendRedirect(event, redirectUrl.toString())
})
