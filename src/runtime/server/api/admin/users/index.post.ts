export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { userStore } = useIdpStores()

  const body = await readBody<{ email: string, name: string }>(event)
  if (!body.email || !body.name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields: email, name' })
  }

  const existing = await userStore.findByEmail(body.email)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'User already exists' })
  }

  const user = await userStore.create(body.email, body.name)
  return { ok: true, email: user.email, name: user.name }
})
