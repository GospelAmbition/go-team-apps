import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import sql, { ensureInitialized } from '#server/utils/database'
import { logLogin, logLoginFailed } from '#server/utils/activity-logger'

export default defineEventHandler(async (event) => {
  await ensureInitialized()

  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }

  // Query existing user from database
  const users = await sql`
    SELECT * FROM users WHERE email = ${email}
  `

  const user = users[0]
  const userAgent = getHeader(event, 'user-agent') || undefined

  if (!user) {
    logLoginFailed(email, userAgent, { reason: 'user_not_found' })
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  // Check if user is verified
  if (!user.verified) {
    logLoginFailed(email, userAgent, { reason: 'not_verified' })
    throw createError({ statusCode: 401, statusMessage: 'Please verify your email address before logging in' })
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    logLoginFailed(email, userAgent, { reason: 'invalid_password' })
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  // Generate new JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, display_name: user.display_name },
    useRuntimeConfig().jwtSecret,
    { expiresIn: '120d' }
  )

  // Set secure cookie
  setCookie(event, 'auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 120 // 120 days
  })

  // Log successful login
  logLogin(user.id, userAgent)

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar: user.avatar,
      verified: user.verified,
      superadmin: user.superadmin
    }
  }
})
