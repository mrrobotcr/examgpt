// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  // Enable server API routes
  nitro: {
    experimental: {
      websocket: false // Using SSE instead
    }
  },

  // App configuration
  app: {
    head: {
      title: 'ExamsGPT - Live Answers',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Real-time exam answers powered by AI' }
      ]
    }
  },

  // Development server
  devServer: {
    port: 3000
  }
})
