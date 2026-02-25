import { createError, defineEventHandler, getRouterParam } from 'h3'
import { requireAuth } from '../../../utils/admin'
import { useIdpStores } from '../../../utils/stores'

export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)
  const credentialId = getRouterParam(event, 'id')
  if (!credentialId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing credential ID' })
  }

  const { credentialStore } = useIdpStores()

  const credential = await credentialStore.findById(credentialId)
  if (!credential || credential.userEmail !== userId) {
    throw createError({ statusCode: 404, statusMessage: 'Credential not found' })
  }

  // Prevent deleting the last credential
  const allCredentials = await credentialStore.findByUser(userId)
  if (allCredentials.length <= 1) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot delete the last credential' })
  }

  await credentialStore.delete(credentialId)
  return { ok: true }
})
