require('dotenv').config()
const nodemailer = require('nodemailer')

console.log('\n📧 EMAIL CONFIGURATION TEST\n')
console.log('Configuration:')
console.log('  SMTP_HOST:', process.env.SMTP_HOST)
console.log('  SMTP_PORT:', process.env.SMTP_PORT)
console.log('  SMTP_USER:', process.env.SMTP_USER)
console.log('  SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : '❌ NOT SET')
console.log('  EMAIL_FROM:', process.env.EMAIL_FROM)
console.log('')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  logger: true,
  debug: true,
})

async function testEmail() {
  try {
    console.log('🔍 Testing SMTP connection...\n')
    await transporter.verify()
    console.log('✅ SMTP connection verified!\n')

    console.log('📤 Sending test email...\n')
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Expense Portal <sodhi.krish05@gmail.com>',
      to: 'sodhi.krish05@gmail.com',
      subject: '✅ Email Test - Expense Portal',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;">
          <h2 style="color:#1a7a4a;">✅ Email Test Successful!</h2>
          <p style="color:#555;">This is a test email from the Expense Portal.</p>
          <p style="color:#555;">If you received this, your email configuration is working correctly.</p>
          <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
          <p style="color:#999;font-size:12px;">
            Test timestamp: ${new Date().toISOString()}
          </p>
        </div>
      `,
    })

    console.log('\n✅ EMAIL SENT SUCCESSFULLY!')
    console.log('Message ID:', result.messageId)
    console.log('\n📬 Check your inbox: sodhi.krish05@gmail.com')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ EMAIL TEST FAILED')
    console.error('Error:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('1. Verify SMTP credentials are correct')
    console.error('2. Check Gmail 2FA is enabled')
    console.error('3. Verify App Password (not regular password)')
    console.error('4. Allow "Less secure app access" if using regular password')
    console.error('5. Check if Gmail account has 2-step verification enabled')
    process.exit(1)
  }
}

testEmail()
