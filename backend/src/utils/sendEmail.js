const nodemailer = require('nodemailer');

// Email sending is enabled when ENABLE_EMAIL_SENDING=true is set explicitly.
// In all other cases (e.g. local development), emails are logged to the console
// so the full forgot-password flow can be tested without any SMTP credentials.
// This intentionally decouples email behaviour from NODE_ENV so that developers
// can keep NODE_ENV=development for error verbosity / logging while still
// optionally testing real SMTP (e.g. Mailtrap) by setting ENABLE_EMAIL_SENDING=true.
const isEmailEnabled = () => process.env.ENABLE_EMAIL_SENDING === 'true';

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

// Lazily-created transporter instance (only used when email is enabled)
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  // Email not enabled — log to console for easy local testing
  if (!isEmailEnabled()) {
    console.log('\n📧 ========== EMAIL (Development Mode) ==========');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html);
    console.log('================================================\n');
    return;
  }

  // Real SMTP send
  await getTransporter().sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'Guerreiros do Segundo Lugar'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};

module.exports = sendEmail;
