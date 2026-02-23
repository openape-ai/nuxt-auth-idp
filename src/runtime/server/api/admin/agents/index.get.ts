export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { agentStore } = useIdpStores()
  return await agentStore.listAll()
})
