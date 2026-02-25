import { createError, defineEventHandler, getRouterParam } from 'h3'
import { requireAdmin } from '../../../utils/admin'
import { useIdpStores } from '../../../utils/stores'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { agentStore } = useIdpStores()

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Agent ID is required' })
  }

  const agent = await agentStore.findById(id)
  if (!agent) {
    throw createError({ statusCode: 404, statusMessage: 'Agent not found' })
  }

  return agent
})
