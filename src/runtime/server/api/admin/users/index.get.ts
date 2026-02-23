export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { userStore } = useIdpStores()
  return await userStore.listUsers()
})
