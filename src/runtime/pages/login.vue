<script setup lang="ts">
const { fetchUser } = useIdpAuth()
const { login, error: webauthnError, loading: webauthnLoading } = useWebAuthn()
const route = useRoute()

const email = ref((route.query.login_hint as string) ?? '')
const error = ref('')

async function handleLogin() {
  error.value = ''
  try {
    await login(email.value || undefined)
    await fetchUser()
    const returnTo = route.query.returnTo as string | undefined
    if (returnTo) {
      await navigateTo(returnTo, { external: true })
    }
    else {
      await navigateTo('/')
    }
  }
  catch {
    error.value = webauthnError.value
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold text-center">
          Login
        </h1>
      </template>

      <UAlert
        v-if="error"
        color="error"
        :title="error"
        class="mb-4"
      />

      <div class="space-y-4">
        <UFormField label="Email (optional)">
          <UInput
            id="email"
            v-model="email"
            type="email"
            placeholder="user@example.com"
          />
        </UFormField>

        <UButton
          color="primary"
          block
          :loading="webauthnLoading"
          :disabled="webauthnLoading"
          :label="webauthnLoading ? 'Authenticating...' : 'Sign in with Passkey'"
          @click="handleLogin"
        />
      </div>

      <template #footer>
        <div class="text-center">
          <UButton
            to="/"
            variant="link"
            label="Back to Home"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
