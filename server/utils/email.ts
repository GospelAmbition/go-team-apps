import nodemailer from 'nodemailer'
import { renderEmailTemplate, type EmailTemplateData } from './email-templates'

// Determine if we're in development or production
const isDevelopment = (process.env.NODE_ENV || 'development') === 'development'

// Create transporter lazily to avoid database access during startup
let transporter: nodemailer.Transporter | null = null

// Get SMTP settings from environment variables
function getSmtpEnvironmentSettings() {
  // Try to get runtime config first (for production builds), then fallback to process.env
  let SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE, SMTP_REJECT_UNAUTHORIZED

  try {
    // Use runtime config if available (production build)
    const config = useRuntimeConfig()
    SMTP_HOST = config.smtpHost || process.env.SMTP_HOST
    SMTP_PORT = config.smtpPort || process.env.SMTP_PORT
    SMTP_USER = config.smtpUser || process.env.SMTP_USER
    SMTP_PASS = config.smtpPass || process.env.SMTP_PASS
    SMTP_FROM = config.smtpFrom || process.env.SMTP_FROM
    SMTP_SECURE = config.smtpSecure || process.env.SMTP_SECURE
    SMTP_REJECT_UNAUTHORIZED = config.smtpRejectUnauthorized || process.env.SMTP_REJECT_UNAUTHORIZED
  } catch {
    // Fallback to process.env (development mode)
    SMTP_HOST = process.env.SMTP_HOST
    SMTP_PORT = process.env.SMTP_PORT
    SMTP_USER = process.env.SMTP_USER
    SMTP_PASS = process.env.SMTP_PASS
    SMTP_FROM = process.env.SMTP_FROM
    SMTP_SECURE = process.env.SMTP_SECURE
    SMTP_REJECT_UNAUTHORIZED = process.env.SMTP_REJECT_UNAUTHORIZED
  }

  return {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    SMTP_SECURE,
    SMTP_REJECT_UNAUTHORIZED
  }
}

function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter
  }

  if (isDevelopment) {
    // Development: Use MailHog
    transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    })
  } else {
    // Production: Use SMTP from environment variables
    const envSettings = getSmtpEnvironmentSettings()

    const smtpConfig = {
      host: envSettings.SMTP_HOST,
      port: parseInt(envSettings.SMTP_PORT || '587'),
      secure: envSettings.SMTP_SECURE === 'true',
      auth: {
        user: envSettings.SMTP_USER,
        pass: envSettings.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: envSettings.SMTP_REJECT_UNAUTHORIZED !== 'false'
      }
    }

    // Validate SMTP configuration
    if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
      throw new Error('SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.')
    }

    transporter = nodemailer.createTransport(smtpConfig)
  }

  return transporter
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export interface TemplateEmailOptions {
  to: string | string[]
  template: 'test' | 'welcome' | 'notification' | 'bulk' | 'verification' | 'emailChangeVerification' | 'passwordReset' | 'commentNotification' | 'subscriberCommentNotification' | 'entryClaimedNotification' | 'dailySummary'
  data: EmailTemplateData
  from?: string,
  subject?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Get from email from environment
    let fromEmail = options.from
    if (!fromEmail) {
      if (isDevelopment) {
        fromEmail = 'noreply@localhost.local'
      } else {
        const envSettings = getSmtpEnvironmentSettings()
        fromEmail = envSettings.SMTP_FROM || 'noreply@yourdomain.com'
      }
    }

    const mailOptions = {
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    }

    const info = await getTransporter().sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)

    if (isDevelopment) {
      console.log('Development mode: Email intercepted by MailHog. View at http://localhost:8025')
    } else {
      console.log('Production mode: Email sent via SMTP')
    }

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export async function sendBulkEmails(emails: EmailOptions[]): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (const email of emails) {
    const result = await sendEmail(email)
    if (result) {
      success++
    } else {
      failed++
    }
  }

  return { success, failed }
}

export async function sendTemplateEmail(options: TemplateEmailOptions): Promise<boolean> {
  try {
    const { subject, html, text } = renderEmailTemplate(options.template, options.data)

    return await sendEmail({
      to: options.to,
      subject: options.subject || subject,
      html,
      text,
      from: options.from
    })
  } catch (error) {
    console.error('Error sending template email:', error)
    return false
  }
}

export async function sendBulkTemplateEmails(emails: TemplateEmailOptions[]): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (const email of emails) {
    const result = await sendTemplateEmail(email)
    if (result) {
      success++
    } else {
      failed++
    }
  }

  return { success, failed }
}