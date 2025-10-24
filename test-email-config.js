import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    console.log('🧪 Testing Resend Email Configuration...\n');
    console.log('API Key:', process.env.RESEND_API_KEY ? '✅ Found' : '❌ Missing');
    console.log('From:', process.env.EMAIL_FROM);
    console.log('Reply-To:', process.env.EMAIL_REPLY_TO);
    console.log('\n📧 Sending test email...\n');
    
    const data = await resend.emails.send({
      from: `Polymer Hub <${process.env.EMAIL_FROM}>`,
      to: 'shabeebkaip@gmail.com',
      subject: 'Test Email - Polymer Hub via Resend',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px; background-color: #007bff; color: white;">
            <h1 style="margin: 0;">Polymer Hub</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <h2>✅ Email Configuration Test</h2>
            <p>This email confirms that Resend is properly configured!</p>
            <ul>
              <li>Sender: ${process.env.EMAIL_FROM}</li>
              <li>Reply-To: ${process.env.EMAIL_REPLY_TO}</li>
              <li>Service: Resend</li>
            </ul>
            <p><strong>Status:</strong> <span style="color: green;">Working perfectly!</span></p>
          </div>
        </div>
      `,
      reply_to: process.env.EMAIL_REPLY_TO
    });
    
    console.log('✅ Email sent successfully!');
    console.log('📬 Email ID:', data.data.id);
    console.log('\n📮 Check your inbox (and spam folder) at: shabeebkaip@gmail.com');
    console.log('\n💡 If you receive this email, Resend is working correctly!');
  } catch (error) {
    console.error('\n❌ Error sending email:');
    console.error('Message:', error.message);
    if (error.statusCode) console.error('Status:', error.statusCode);
    if (error.name) console.error('Error Type:', error.name);
  }
}

testEmail();
