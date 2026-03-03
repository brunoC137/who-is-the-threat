# Email Setup - Password Reset Feature

This document explains how to configure (or skip configuring) email for the
**Forgot Password** feature, both in development and in production.

---

## How it works

When a user requests a password reset:

1. The API generates a secure, time-limited reset token (expires in **10 minutes**).
2. It tries to send an email containing the reset link.
3. The user clicks the link and sets a new password.

The behaviour of step 2 is controlled by a single env var:

| `ENABLE_EMAIL_SENDING` | What happens |
|------------------------|-------------|
| not set / `false` (default) | No email is sent. The reset link is **printed to the server console**. |
| `true` | A real email is sent via the `EMAIL_*` SMTP settings in your `.env`. |

This flag is independent of `NODE_ENV`, so you can keep `NODE_ENV=development`
for detailed error logging and debug output while still testing real SMTP
(e.g. Mailtrap) by also setting `ENABLE_EMAIL_SENDING=true`.

---

## Development - no configuration needed

By default (`ENABLE_EMAIL_SENDING` is not set), you can test the entire
forgot-password flow **without any email credentials**.

### Steps

1. Make sure your `backend/.env` does **not** have `ENABLE_EMAIL_SENDING=true`
   (or the line is commented out -- this is the default in `.env.example`).
2. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```
3. In the frontend (or via curl/Postman), submit a password-reset request:
   ```bash
   curl -X POST http://localhost:5001/api/auth/forgotpassword \
     -H "Content-Type: application/json" \
     -d '{"email": "your-registered-email@example.com"}'
   ```
4. Look at the **server terminal**. You will see output like this:
   ```
   📧 ========== EMAIL (Development Mode) ==========
   To: your-registered-email@example.com
   Subject: Password Reset - Guerreiros do Segundo Lugar
   HTML: <div ...>...</div>
   ================================================

   🔐 ========== PASSWORD RESET TOKEN ==========
   Reset URL: http://localhost:3001/reset-password/abc123...token...
   Token expires in 10 minutes
   ===========================================
   ```
5. Copy the **Reset URL** from the terminal and open it in your browser.
6. Enter your new password and submit.

> **You do NOT need to fill in `EMAIL_HOST`, `EMAIL_USER`, or any other
> `EMAIL_*` variables** in your `.env` for local development.

---

## Optional: real email in development (e.g. Mailtrap / Ethereal)

If you want emails to actually be delivered during development (useful for
testing the HTML template), you can use a test inbox service.

### Option A - Mailtrap (recommended for teams)

[Mailtrap](https://mailtrap.io) gives you a free sandbox inbox that captures
outgoing emails without delivering them to real addresses.

1. Create a free account at https://mailtrap.io.
2. In **Email Testing -> Inboxes**, click your inbox and choose **SMTP Settings**.
3. Copy the credentials and add them to `backend/.env`:
   ```env
   ENABLE_EMAIL_SENDING=true
   EMAIL_HOST=sandbox.smtp.mailtrap.io
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=<your-mailtrap-username>
   EMAIL_PASS=<your-mailtrap-password>
   EMAIL_FROM=noreply@guerreiros.app
   EMAIL_FROM_NAME=Guerreiros do Segundo Lugar
   ```
   > `NODE_ENV` does **not** need to change -- keep it as `development`.

### Option B - Ethereal (auto-generated throwaway account)

[Ethereal](https://ethereal.email) creates a temporary SMTP account in seconds.

1. Go to https://ethereal.email and click **Create Ethereal Account**.
2. Copy the generated credentials into `backend/.env` using the same structure
   as above (set `ENABLE_EMAIL_SENDING=true` and fill in Ethereal's host/port/user/pass).

---

## Production - Render deployment

In production you need a reliable transactional email provider. Below are the
most common choices.

> **Important:** Set `ENABLE_EMAIL_SENDING=true` in your Render environment
> variables, otherwise no emails will be sent (the console-fallback path will
> run instead).

### Option 1 - Gmail (simplest, good for small groups)

> Gmail works but has sending limits (~500/day for free accounts). Suitable for
> a small friend group.

1. Enable **2-Step Verification** on your Google account.
2. Go to **Google Account -> Security -> App Passwords** and generate a password
   for "Mail / Other".
3. Add to Render environment variables:
   ```
   ENABLE_EMAIL_SENDING=true
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=you@gmail.com
   EMAIL_PASS=<your-16-char-app-password>
   EMAIL_FROM=you@gmail.com
   EMAIL_FROM_NAME=Guerreiros do Segundo Lugar
   ```

### Option 2 - SendGrid (recommended for production)

[SendGrid](https://sendgrid.com) offers 100 free emails/day on their free tier.

1. Create an account and verify your sender domain/email.
2. Generate an **API Key** (Settings -> API Keys -> Create API Key, with "Mail Send" permission).
3. Add to Render environment variables:
   ```
   ENABLE_EMAIL_SENDING=true
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASS=<your-sendgrid-api-key>
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Guerreiros do Segundo Lugar
   ```

### Option 3 - Resend (modern alternative, generous free tier)

[Resend](https://resend.com) offers 3,000 free emails/month.

1. Create an account and add/verify your domain.
2. Generate an API key.
3. Add to Render environment variables:
   ```
   ENABLE_EMAIL_SENDING=true
   EMAIL_HOST=smtp.resend.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=resend
   EMAIL_PASS=<your-resend-api-key>
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Guerreiros do Segundo Lugar
   ```

### How to set environment variables on Render

1. Open your backend service on https://dashboard.render.com.
2. Go to **Environment -> Environment Variables**.
3. Add `ENABLE_EMAIL_SENDING=true` and each `EMAIL_*` variable.
4. Click **Save Changes** -- Render will restart the service automatically.

---

## Summary

| Scenario | `ENABLE_EMAIL_SENDING` | Email config needed? |
|----------|------------------------|----------------------|
| Local development / testing | not set (default) | No -- reset link prints to console |
| Local dev with real inbox (Mailtrap) | `true` | Yes -- Mailtrap credentials |
| Production on Render | `true` | Yes -- Gmail / SendGrid / Resend |

---

## Troubleshooting

**"Email could not be sent. Please try again later."**
- Check that `ENABLE_EMAIL_SENDING=true` is set (if it's missing or `false`,
  the console-fallback runs instead and no error should occur).
- Verify your `EMAIL_HOST`, `EMAIL_USER`, and `EMAIL_PASS` are correct.
- If using Gmail, make sure you're using an **App Password**, not your account
  password.
- Check the server logs for the underlying SMTP error message.

**Reset link not arriving in inbox**
- Check your spam/junk folder.
- Verify `EMAIL_FROM` is a valid sender for your SMTP provider (some require
  domain verification).

**Reset link expired**
- The link is valid for **10 minutes**. Request a new one if it expires.
