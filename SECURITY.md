# Security Configuration

## Environment Variables

### Backend (.env)

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRE=7d

# Server Configuration
NODE_ENV=production
PORT=5000

# Frontend URL for CORS
FRONTEND_URL=https://guerreiros-do-segundo-lugar.vercel.app

# Rate Limiting
ENABLE_RATE_LIMITING=true
```

### Frontend (.env.local)

```env
# API URL
NEXT_PUBLIC_API_URL=https://your-backend-api-url.com/api
```

## Security Checklist

### ✅ Implemented

- [x] Password hashing with bcrypt (12 rounds)
- [x] JWT authentication with secure tokens
- [x] HTTPS enforcement via middleware
- [x] Security headers (HSTS, CSP, X-Frame-Options, etc.)
- [x] Rate limiting on API endpoints
- [x] Input validation and sanitization
- [x] CORS configuration with whitelist
- [x] HttpOnly cookies for tokens
- [x] SQL injection protection (Mongoose)
- [x] XSS protection headers
- [x] CSRF protection (SameSite cookies)
- [x] Privacy Policy page
- [x] Contact page
- [x] security.txt file
- [x] robots.txt file
- [x] Sitemap for SEO

### 🔧 Additional Recommendations

1. **SSL/TLS Certificate**: Ensure your hosting provider (Vercel/Render) has valid SSL certificates
2. **Environment Variables**: Never commit `.env` files to git
3. **API Keys**: Rotate JWT_SECRET regularly
4. **Database**: Enable MongoDB authentication and IP whitelisting
5. **Monitoring**: Set up error tracking (e.g., Sentry)
6. **Backups**: Regular database backups
7. **Updates**: Keep all dependencies updated regularly

## Security Headers Explained

### Backend (Express)

```javascript
Strict-Transport-Security: Forces HTTPS connections
X-Content-Type-Options: Prevents MIME type sniffing
X-Frame-Options: Prevents clickjacking attacks
X-XSS-Protection: Enables browser XSS filtering
Content-Security-Policy: Controls resource loading
Permissions-Policy: Controls browser features
Referrer-Policy: Controls referrer information
```

### Frontend (Next.js Middleware)

```javascript
- HTTPS redirect in production
- Security headers on all responses
- CORS handling
```

## Password Security

The application uses bcrypt with 12 salt rounds:
- Passwords are hashed before storage
- Original passwords are never stored
- Comparison is done using secure bcrypt.compare()

## JWT Token Security

- Tokens expire after 7 days (configurable)
- Stored in HttpOnly cookies (not accessible via JavaScript)
- SameSite='strict' prevents CSRF attacks
- Secure flag enabled in production (HTTPS only)

## Database Security

- Mongoose handles query sanitization
- No raw MongoDB queries that could lead to injection
- Validation on all user inputs
- ObjectId validation prevents injection

## Rate Limiting

- 100 requests per 15 minutes per IP (production)
- 1000 requests per 15 minutes (development)
- Prevents brute force attacks and DDoS

## Input Validation

Uses express-validator for:
- Email format validation
- Password strength requirements
- String length limits
- URL validation for images
- Data type enforcement

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email: security@guerreiros-do-segundo-lugar.vercel.app
3. Include details and steps to reproduce
4. We'll respond within 48 hours

See `/.well-known/security.txt` for more information.
