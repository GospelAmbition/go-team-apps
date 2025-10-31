import bcrypt from 'bcrypt'
import sql, { ensureInitialized } from '#server/utils/database'
import { randomUUID } from 'crypto'
import { sendTemplateEmail } from '#server/utils/email'

export default defineEventHandler(async (event) => {
  await ensureInitialized()

  const { email, password, display_name } = await readBody(event)

  if (!email || !password || !display_name) {
    throw createError({ statusCode: 400, statusMessage: 'Email, password, and display name are required' })
  }

  if (display_name.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Display name must be at least 2 characters long' })
  }

  // Check if user already exists
  const existingUser = await sql`
    SELECT id FROM users WHERE email = ${email}
  `

  if (existingUser.length > 0) {
    throw createError({ statusCode: 409, statusMessage: 'User with this email already exists' })
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Generate unique ID and token key
  const userId = randomUUID()
  const tokenKey = randomUUID()
  const now = new Date().toISOString()

  try {
    // Create user (initially unverified)
    await sql`
      INSERT INTO users (
        id, created, updated, email, password,
        verified, superadmin, display_name, avatar, token_key, email_visibility
      ) VALUES (
        ${userId}, ${now}, ${now}, ${email}, ${hashedPassword},
        false, false, ${display_name}, '', ${tokenKey}, false
      )
    `

    // Send verification email
    const baseUrl = getRequestURL(event).origin
    const verificationUrl = `${baseUrl}/api/auth/verify?token=${tokenKey}`

    const emailSent = await sendTemplateEmail({
      to: email,
      template: 'verification',
      data: {
        userName: display_name,
        verificationUrl
      }
    })

    if (!emailSent) {
      // If email fails, we should still create the user but log the error
      console.error('Failed to send verification email to:', email)
      // Don't throw error here as user was created successfully
    }

    return {
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      requiresVerification: true
    }
  } catch (error) {
    console.error('Registration error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create user' })
  }
})
