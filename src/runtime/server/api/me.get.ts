import { createError, defineEventHandler } from 'h3'
import { isAdmin } from '../utils/admin'
import { getAppSession } from '../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getAppSession(event)

  if (!session.data.userId) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  return {
    email: session.data.userId,
    name: session.data.userName,
    isAdmin: isAdmin(session.data.userId as string) || session.data.isSuperAdmin === true,
  }
})
