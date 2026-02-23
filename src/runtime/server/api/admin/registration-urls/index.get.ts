export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { registrationUrlStore } = useIdpStores()
  return await registrationUrlStore.list()
})
