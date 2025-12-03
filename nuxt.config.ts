// https://nuxt.com/docs/api/configuration/nuxt-config
import {fileURLToPath} from "url";

export default defineNuxtConfig({
  // Extend the nuxt-base layer for auth, theme, and common utilities
  extends: ['github:corsacca/nuxt-base#master'],

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  ssr: false,
  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'light',
    classSuffix: ''
  },

  ui: {
    primary: 'gray',
    gray: 'neutral'
  },

  icon: {
    serverBundle: 'local'
  },

  alias: {
    '#server': fileURLToPath(new URL('./server', import.meta.url))
  },

  nitro: {
    preset: 'vercel',
  },

  runtimeConfig: {
    // Private keys (only available on the server-side)
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,

    // SMTP configuration
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpSecure: process.env.SMTP_SECURE,
    smtpFrom: process.env.SMTP_FROM,
    smtpRejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED,

    // S3 Storage configuration (for private bucket with signed URLs)
    s3Endpoint: process.env.S3_ENDPOINT,
    s3Region: process.env.S3_REGION,
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    s3BucketName: process.env.S3_BUCKET_NAME,

    // Public keys (exposed to the frontend)
    public: {
      nodeEnv: process.env.NODE_ENV || 'development',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  }
})
