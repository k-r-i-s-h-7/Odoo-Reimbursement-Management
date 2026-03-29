const nodemailer = require('nodemailer')

// ─── Transporter ─────────────────────────────────────────────────────────────
const createTransporter = () => {
  // Log configuration for debugging (without sensitive data)
  console.log('[EmailService] Creating transporter with:')
  console.log('  Host:', process.env.SMTP_HOST || 'smtp.gmail.com')
  console.log('  Port:', Number(process.env.SMTP_PORT) || 587)
  console.log('  User:', process.env.SMTP_USER ? '***' : 'NOT SET')
  console.log('  Pass:', process.env.SMTP_PASS ? '***' : 'NOT SET')

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // TLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    logger: true,
    debug: true,
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const FROM = process.env.EMAIL_FROM || 'Expense Portal <no-reply@expenseportal.com>'
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// ─── Email senders ────────────────────────────────────────────────────────────

/**
 * Sent to a newly created user with their temporary password and a reset link.
 */
const sendWelcomeEmail = async ({ to, name, tempPassword, resetToken }) => {
  try {
    const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`

    console.log(`[EmailService] Sending welcome email to ${to}...`)

    const transporter = createTransporter()
    
    // Verify connection before sending
    await transporter.verify()
    console.log('[EmailService] SMTP connection verified ✓')

    const result = await transporter.sendMail({
      from: FROM,
      to,
      subject: 'Welcome to Expense Portal — Set Your Password',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;">
          <h2 style="color:#3b1f2b;margin-bottom:8px;">Welcome, ${name}!</h2>
          <p style="color:#555;">Your account has been created on the <strong>Expense Portal</strong>.</p>
          <p style="color:#555;">Use the temporary password below to log in, or click the button to set your own password directly.</p>

          <div style="background:#f5f5f5;border-radius:8px;padding:16px 20px;margin:24px 0;font-size:18px;font-family:monospace;letter-spacing:2px;color:#222;">
            ${tempPassword}
          </div>

          <a href="${resetUrl}"
             style="display:inline-block;background:#5b2244;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:14px;">
            Set My Password
          </a>

          <p style="color:#999;font-size:12px;margin-top:24px;">
            This reset link expires in 24 hours. If you did not expect this email, please ignore it.
          </p>
        </div>
      `,
    })

    console.log(`[EmailService] Welcome email sent successfully to ${to} - Message ID: ${result.messageId}`)
  } catch (error) {
    console.error(`[EmailService] Failed to send welcome email to ${to}:`, error.message)
    throw error
  }
}

/**
 * Sent to a user who requests a password reset.
 */
const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  try {
    const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`

    console.log(`[EmailService] Sending password reset email to ${to}...`)
    const transporter = createTransporter()
    
    const result = await transporter.sendMail({
      from: FROM,
      to,
      subject: 'Reset Your Expense Portal Password',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;">
          <h2 style="color:#3b1f2b;margin-bottom:8px;">Password Reset Request</h2>
          <p style="color:#555;">Hi ${name}, we received a request to reset your password.</p>

          <a href="${resetUrl}"
             style="display:inline-block;background:#5b2244;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:14px;margin:20px 0;">
            Reset Password
          </a>

          <p style="color:#999;font-size:12px;margin-top:16px;">
            This link expires in 1 hour. If you did not request this, please ignore it.
          </p>
        </div>
      `,
    })

    console.log(`[EmailService] Password reset email sent to ${to} - Message ID: ${result.messageId}`)
  } catch (error) {
    console.error(`[EmailService] Failed to send password reset email to ${to}:`, error.message)
    throw error
  }
}

/**
 * Notify an approver that a new expense request is awaiting their review.
 */
const sendApprovalRequestEmail = async ({ to, approverName, submitterName, description, expenseId }) => {
  try {
    const reviewUrl = `${BASE_URL}/approvals/${expenseId}`

    console.log(`[EmailService] Sending approval request email to ${to}...`)
    const transporter = createTransporter()

    const result = await transporter.sendMail({
      from: FROM,
      to,
      subject: `Action Required: Expense Approval — "${description}"`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;">
          <h2 style="color:#3b1f2b;margin-bottom:8px;">Expense Approval Required</h2>
          <p style="color:#555;">Hi ${approverName},</p>
          <p style="color:#555;">
            <strong>${submitterName}</strong> has submitted an expense request:
            <strong>"${description}"</strong>
          </p>
          <p style="color:#555;">Your approval is required to proceed.</p>

          <a href="${reviewUrl}"
             style="display:inline-block;background:#5b2244;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:14px;margin:20px 0;">
            Review Request
          </a>
        </div>
      `,
    })

    console.log(`[EmailService] Approval request email sent to ${to} - Message ID: ${result.messageId}`)
  } catch (error) {
    console.error(`[EmailService] Failed to send approval request email to ${to}:`, error.message)
    throw error
  }
}

/**
 * Notify the expense owner of the final decision.
 */
const sendExpenseDecisionEmail = async ({ to, ownerName, description, status }) => {
  try {
    const isApproved = status === 'APPROVED'

    console.log(`[EmailService] Sending expense decision email to ${to}...`)
    const transporter = createTransporter()

    const result = await transporter.sendMail({
      from: FROM,
      to,
      subject: `Expense ${isApproved ? 'Approved' : 'Rejected'}: "${description}"`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;">
          <h2 style="color:${isApproved ? '#1a7a4a' : '#b91c1c'};margin-bottom:8px;">
            Expense ${isApproved ? 'Approved ✓' : 'Rejected ✗'}
          </h2>
          <p style="color:#555;">Hi ${ownerName},</p>
          <p style="color:#555;">
            Your expense request <strong>"${description}"</strong> has been
            <strong>${isApproved ? 'approved' : 'rejected'}</strong>.
          </p>
          ${!isApproved ? '<p style="color:#555;">Please contact your manager for further details.</p>' : ''}
        </div>
      `,
    })

    console.log(`[EmailService] Expense decision email sent to ${to} - Message ID: ${result.messageId}`)
  } catch (error) {
    console.error(`[EmailService] Failed to send expense decision email to ${to}:`, error.message)
    throw error
  }
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendApprovalRequestEmail,
  sendExpenseDecisionEmail,
}