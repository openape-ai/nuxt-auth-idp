import { createError, defineEventHandler, getRouterParam } from 'h3'
import { requireAdmin } from '../../../utils/admin'
import { useIdpStores } from '../../../utils/stores'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const { registrationUrlStore } = useIdpStores()
  await registrationUrlStore.delete(token)
  return { ok: true }
})
