export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const email = getRouterParam(event, 'email')
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Missing email parameter' })
  }

  const { credentialStore } = useIdpStores()
  const credentials = await credentialStore.findByUser(email)

  return credentials.map(c => ({
    credentialId: c.credentialId,
    name: c.name,
    deviceType: c.deviceType,
    backedUp: c.backedUp,
    createdAt: c.createdAt,
    transports: c.transports,
  }))
})
