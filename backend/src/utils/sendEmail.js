const nodemailer = require('nodemailer');

// Email sending is enabled when ENABLE_EMAIL_SENDING=true is set explicitly.
// In all other cases (e.g. local development), emails are logged to the console
// so the full forgot-password flow can be tested without any SMTP credentials.
// This intentionally decouples email behaviour from NODE_ENV so that developers
// can keep NODE_ENV=development for error verbosity / logging while still
// optionally testing real SMTP (e.g. Mailtrap) by setting ENABLE_EMAIL_SENDING=true.
const isEmailEnabled = () => process.env.ENABLE_EMAIL_SENDING === 'true';

const createTransporter = () => {
  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Add connection timeout and better error handling
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,
    socketTimeout: 30000,
    // Log connection details in development
    logger: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development'
  };

  console.log('📧 Email transporter config:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user
  });

  return nodemailer.createTransport(config);
};

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
  try {
    const result = await getTransporter().sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Guerreiros do Segundo Lugar'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log('✅ Email sent successfully:', { messageId: result.messageId, to });
    return result;
  } catch (error) {
    console.error('❌ Email sending failed:', {
      error: error.message,
      code: error.code,
      command: error.command,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE
    });
    throw error;
  }
};

module.exports = sendEmail;
