const nodemailer = require('nodemailer');

const createTransporter = () => {
  // In development mode without email config, use ethereal/test account
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_HOST) {
    console.log('⚠️  Email service not configured - emails will be logged to console');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Lazily-created transporter (recreated if env vars change between calls in tests)
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  const transport = getTransporter();
  
  // Development mode without email config - log to console
  if (!transport) {
    console.log('\n📧 ========== EMAIL (Development Mode) ==========');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML:', html);
    console.log('================================================\n');
    return; // Successfully "sent" (logged)
  }

  // Production mode - actually send email
  await transport.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'Guerreiros do Segundo Lugar'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};

module.exports = sendEmail;
