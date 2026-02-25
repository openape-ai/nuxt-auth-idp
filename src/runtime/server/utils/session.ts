import type { H3Event } from 'h3'
import { useSession } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'

export async function getAppSession(event: H3Event) {
  const config = useRuntimeConfig()
  return await useSession(event, {
    name: 'openape-idp',
    password: config.openapeIdp.sessionSecret,
  })
}
