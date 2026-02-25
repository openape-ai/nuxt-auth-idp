import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '../../../utils/admin'
import { useIdpStores } from '../../../utils/stores'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { agentStore } = useIdpStores()

  const body = await readBody<{
    email: string
    name: string
    owner: string
    approver: string
    publicKey: string
  }>(event)

  if (!body.email || !body.name || !body.owner || !body.approver || !body.publicKey) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields: email, name, owner, approver, publicKey' })
  }

  if (!body.publicKey.startsWith('ssh-ed25519 ')) {
    throw createError({ statusCode: 400, statusMessage: 'Public key must be in ssh-ed25519 format' })
  }

  const duplicate = await agentStore.findByEmail(body.email)
  if (duplicate) {
    throw createError({ statusCode: 409, statusMessage: 'An agent with this email already exists' })
  }

  const agent = await agentStore.create({
    id: crypto.randomUUID(),
    email: body.email,
    name: body.name,
    owner: body.owner,
    approver: body.approver,
    publicKey: body.publicKey,
    createdAt: Date.now(),
    isActive: true,
  })

  return agent
})
