# Security Guidelines

This document outlines the security measures implemented in the Property Management Platform.

## Authentication & Authorization

- **Session-based authentication** using HTTP-only cookies
- **Password hashing** using SHA-256 (consider upgrading to bcrypt for production)
- **User ownership verification** on all API endpoints
- **Automatic session expiration** after 7 days

## Rate Limiting

Rate limiting is implemented to prevent abuse and DDoS attacks:

- **Authentication endpoints**: 5 requests per 15 minutes
- **Write operations**: 30 requests per minute
- **Read operations**: 100 requests per minute
- **General API**: 60 requests per minute

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Security Headers

The following security headers are automatically added to all responses:

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-XSS-Protection: 1; mode=block` - Enables XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Content-Security-Policy` - Restricts resource loading
- `Permissions-Policy` - Controls browser features

## Input Validation & Sanitization

All user inputs are validated and sanitized:

- **Email validation** using regex patterns
- **UUID validation** for database IDs
- **Date validation** for date fields
- **Amount validation** for financial data
- **String sanitization** to remove XSS vectors

## CORS Configuration

CORS is configured to allow requests only from trusted origins:

- Development: `http://localhost:3000`
- Production: Configure your production domain in `lib/middleware/cors-middleware.ts`

## Database Security

- **Parameterized queries** to prevent SQL injection
- **User ownership checks** on all data access
- **Row-level security** should be enabled in production

## Best Practices for Production

1. **Use environment variables** for sensitive configuration
2. **Enable HTTPS** for all connections
3. **Upgrade password hashing** to bcrypt or Argon2
4. **Implement Redis** for distributed rate limiting
5. **Add request logging** for audit trails
6. **Enable database backups** and encryption
7. **Set up monitoring** and alerting
8. **Regular security audits** and dependency updates
9. **Implement CSRF protection** for state-changing operations
10. **Add API key authentication** for third-party integrations

## Reporting Security Issues

If you discover a security vulnerability, please email security@yourcompany.com
