const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendRecoveryEmail(to, name, emailContent) {
  console.log(`📧 Attempting to send to: ${to}`);
  console.log(`📧 Using sender: ${process.env.SENDER_EMAIL}`);
  console.log(`📧 API key starts with: ${process.env.SENDGRID_API_KEY?.substring(0,6)}`);
  if (process.env.SENDER_EMAIL && process.env.SENDER_EMAIL.endsWith('@gmail.com')) {
    logger.warn(`⚠️  DMARC Warning: Using a @gmail.com email (${process.env.SENDER_EMAIL}) as SENDER_EMAIL via SendGrid. Gmail's DMARC policy prevents third-party services from sending mail as @gmail.com. These emails will likely be dropped/blocked by Gmail or other receivers. Use a custom domain sender for real delivery.`);
  }
  const msg = {
    to,
    from: process.env.SENDER_EMAIL,
    subject: emailContent.subject,
    text: emailContent.body,
  };
  try {
    // Only send if API key is actually configured (prevent crashing during demo if fake key)
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.') && process.env.SENDGRID_API_KEY !== 'SG.xxxx') {
      await sgMail.send(msg);
      logger.info(`📧 Email sent successfully to ${to}`);
    } else {
      logger.warn(`⚠️  SendGrid API key not configured or is demo key. Mocking email send to ${to}`);
    }
  } catch (error) {
    console.error('SendGrid error:', JSON.stringify(error.response?.body));
    logger.error(`Error sending email to ${to}: ${error.message}`);
    // Don't throw so that the demo can continue and the attempt is logged to the dashboard
  }
}

module.exports = { sendRecoveryEmail };
