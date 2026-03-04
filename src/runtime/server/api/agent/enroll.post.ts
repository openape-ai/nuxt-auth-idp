import { createError, defineEventHandler, readBody } from 'h3'
import { useIdpStores } from '../../utils/stores'
import { requireAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const adminEmail = await requireAdmin(event)

  const body = await readBody<{
    id?: string
    email: string
    name: string
    publicKey: string
    owner?: string
    approver?: string
  }>(event)

  if (!body.email || !body.name || !body.publicKey) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields: email, name, publicKey' })
  }

  if (!body.publicKey.startsWith('ssh-ed25519 ')) {
    throw createError({ statusCode: 400, statusMessage: 'Public key must be in ssh-ed25519 format' })
  }

  const { agentStore } = useIdpStores()

  const duplicateEmail = await agentStore.findByEmail(body.email)
  if (duplicateEmail) {
    throw createError({ statusCode: 409, statusMessage: 'An agent with this email already exists' })
  }

  const existingAgents = await agentStore.listAll()
  const duplicateKey = existingAgents.find(a => a.publicKey === body.publicKey)
  if (duplicateKey) {
    throw createError({ statusCode: 409, statusMessage: 'An agent with this public key already exists' })
  }

  const agent = await agentStore.create({
    id: body.id || crypto.randomUUID(),
    email: body.email,
    name: body.name,
    owner: body.owner || adminEmail,
    approver: body.approver || adminEmail,
    publicKey: body.publicKey,
    createdAt: Date.now(),
    isActive: true,
  })

  return {
    agent_id: agent.id,
    email: agent.email,
    name: agent.name,
    owner: agent.owner,
    approver: agent.approver,
    status: 'active',
  }
})
