import { Resend } from 'resend';

const resend = new Resend('re_PJAiN3Sm_MeKJNZhpACUpLfputBrMu1mr');

async function testResend() {
  try {
    console.log('Testing Resend API...');
    
    const data = await resend.emails.send({
      from: 'Polymer Hub <onboarding@resend.dev>',
      to: 'shabeebkaip@gmail.com',
      subject: 'Test from Resend - Polymer Hub',
      html: '<h1>Test Email</h1><p>This is a test email from Resend to verify the API is working!</p>'
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', data.id);
    console.log('Data:', data);
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
}

testResend();
