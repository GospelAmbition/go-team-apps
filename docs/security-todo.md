# Security Checklist

This document tracks security improvements and best practices for the Loomsly project.

## 🚨 Critical - Must Fix Before Production

- [x] **Add authentication to video upload URL endpoint**
  - File: `server/api/videos/upload-url.post.ts`
  - Issue: Endpoint allows unauthenticated users to generate S3 upload URLs
  - Fix: Add `const user = requireAuth(event)` at the beginning of the handler
  - Impact: Without this, anyone can upload files to your S3 bucket

- [x] **Verify JWT_SECRET in Vercel**
  - Confirm JWT_SECRET is set to a strong random value in Vercel environment variables
  - Should be at least 64 characters of random data
  - Never use default/example values in production

## ⚠️ High Priority

- [x] **Add password validation to registration**
  - File: `server/api/auth/register.post.ts`
  - Issue: No password length requirement (users can register with "123")
  - Fix: Add validation requiring minimum 8 characters
  - Standardized across all endpoints (register, reset-password, profile all require 8-128 characters)

- [x] **Reduce JWT expiration time**
  - File: `server/api/auth/login.post.ts:45`
  - Changed from: 120 days → 30 days
  - JWT and cookie now expire after 30 days
  - Note: For longer sessions, consider implementing refresh token pattern

## 🔶 Medium Priority

- [ ] **Implement rate limiting**
  - Endpoints to protect:
    - `/api/auth/login` - prevent credential stuffing
    - `/api/auth/register` - prevent spam registrations
    - `/api/auth/forgot-password` - prevent email bombing
  - Recommended solution: [@upstash/ratelimit](https://www.npmjs.com/package/@upstash/ratelimit) with Upstash Redis
  - Can create Upstash Redis from Vercel dashboard (Storage tab)

- [x] **Verify S3 bucket is private**
  - Ensure Backblaze B2 bucket is configured as private (not public)
  - Confirm signed URLs are required for access
  - Review CORS configuration for production domain

## 📋 Ongoing Security Practices

- [ ] **Dependency security**
  - Run `npm audit` regularly
  - Keep dependencies updated
  - Currently: 0 vulnerabilities ✅

- [ ] **Environment variables**
  - All secrets managed in Vercel (not in code)
  - Never commit `.env` files
  - Rotate credentials if exposed

- [ ] **Monitor security events**
  - Review activity logs for suspicious patterns
  - Set up alerts for failed login attempts
  - Monitor S3 usage for anomalies

## ✅ Security Strengths (Already Implemented)

The following security best practices are already in place:

- SQL injection protection (parameterized queries)
- Strong password hashing (bcrypt with 12 rounds)
- HTTP-only secure cookies for auth tokens
- User enumeration prevention on forgot-password
- Activity logging for security events
- Proper authorization checks (users can only modify their own videos)
- SSL/TLS enforcement on database connections
- No XSS vulnerabilities detected
- Secrets properly excluded from git

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Vercel Security Best Practices](https://vercel.com/docs/security)
- [Upstash Rate Limiting](https://upstash.com/blog/edge-rate-limiting)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated:** 2025-11-03
**Next Review:** Before production deployment
