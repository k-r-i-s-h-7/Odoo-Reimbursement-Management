const nodemailer = require("nodemailer");

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // bypasses self-signed cert error
    },
  });
};

/**
 * Send a temporary/reset password email to a user.
 * @param {string} to      - Recipient email address
 * @param {string} name    - Recipient display name
 * @param {string} password - The plain-text temporary password to include in the email
 */
const sendPasswordEmail = async (to, name, password) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Reimbursement Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Temporary Password – Reimbursement Portal",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f8fc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e2ee;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 32px 36px;">
          <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.75);">Reimbursement Portal</p>
          <h1 style="margin: 8px 0 0; font-size: 24px; font-weight: 700; color: #ffffff;">Your Temporary Password</h1>
        </div>

        <!-- Body -->
        <div style="padding: 32px 36px;">
          <p style="margin: 0 0 16px; color: #374151; font-size: 15px;">Hi <strong>${name}</strong>,</p>
          <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.6;">
            A temporary password has been generated for your account. Use it to sign in, then change your password as soon as possible.
          </p>

          <!-- Password box -->
          <div style="background: #1e1b4b; border-radius: 8px; padding: 20px 24px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; color: #a5b4fc; text-transform: uppercase;">Temporary Password</p>
            <p style="margin: 0; font-size: 26px; font-weight: 700; font-family: 'Courier New', monospace; color: #e0e7ff; letter-spacing: 0.08em;">${password}</p>
          </div>

          <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; line-height: 1.6;">
            ⚠️ This password was auto-generated. Please log in and change it immediately.
          </p>
          <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
            If you did not request this, please contact your administrator.
          </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding: 20px 36px; background: #f3f4f6;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated message from your Reimbursement Portal. Do not reply to this email.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordEmail };
