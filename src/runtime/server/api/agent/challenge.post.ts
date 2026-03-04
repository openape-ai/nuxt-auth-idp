import { createError, defineEventHandler, readBody } from 'h3'
import { useIdpStores } from '../../utils/stores'
import { useGrantStores } from '../../utils/grant-stores'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ agent_id: string }>(event)

  if (!body.agent_id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required field: agent_id' })
  }

  const { agentStore } = useIdpStores()
  const { challengeStore } = useGrantStores()

  const agent = body.agent_id.includes('@')
    ? await agentStore.findByEmail(body.agent_id)
    : await agentStore.findById(body.agent_id)
  if (!agent || !agent.isActive) {
    throw createError({ statusCode: 404, statusMessage: 'Agent not found or inactive' })
  }

  const challenge = await challengeStore.createChallenge(agent.id)
  return { challenge }
})
