import { Resend } from 'resend';
import { config } from '../config/config.js';
import { getBaseUrl, getLoginUrl, getDashboardUrl } from '../utils/urlHelper.js';

// Initialize Resend with API key
const resend = new Resend(config.resend.apiKey);

// Test Resend connection
const testResendConnection = async () => {
    try {
        if (!config.resend.apiKey) {
            console.log('⚠️  Resend API key not configured');
            return;
        }
        console.log('✅ Resend email service initialized');
        console.log(`📧 Emails will be sent from: ${config.resend.from}`);
    } catch (error) {
        console.log('⚠️  Error initializing Resend:', error.message);
    }
};

// Call test on module load
testResendConnection();

// Generic email sender function
const sendEmail = async (mailOptions) => {
    try {
        const data = await resend.emails.send({
            from: `Polymer Hub <${config.resend.from}>`,
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.html,
            reply_to: config.resend.replyTo,
        });
        console.log('✅ Email sent successfully:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error: error.message };
    }
};

// Registration OTP email
export const sendRegistrationOtp = async (name, email, otp) => {
    const baseUrl = getBaseUrl();
    const mailOptions = {
        to: email,
        subject: 'Verify Your Email - Polymer Hub Registration',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; padding: 20px; background-color: #007bff; color: white;">
                    <h1 style="margin: 0;">Polymer Hub</h1>
                </div>
                
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Welcome to Polymer Hub!</h2>
                    <p style="color: #555; font-size: 16px;">Hi ${name},</p>
                    <p style="color: #555; font-size: 16px;">Thank you for registering with Polymer Hub. To complete your registration, please verify your email address using the OTP below:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; font-size: 32px; font-weight: bold; background-color: #f8f9fa; padding: 20px 40px; border-radius: 8px; border: 3px solid #007bff; color: #007bff; letter-spacing: 5px; font-family: 'Courier New', monospace;">${otp}</div>
                    </div>

                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #856404; font-size: 14px;">
                            <strong>⏰ Important:</strong> This OTP is valid for <strong>10 minutes</strong> only.
                        </p>
                    </div>

                    <p style="color: #555; font-size: 16px;">Once verified, you can access your dashboard at:</p>
                    <p style="text-align: center;">
                        <a href="${baseUrl}" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 10px 0;">Visit Polymer Hub</a>
                    </p>
                    
                    <p style="color: #777; font-size: 14px; margin-top: 30px;">If you didn't create an account with us, please ignore this email.</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="margin: 0; color: #6c757d; font-size: 14px;">Best regards,<br>The Polymer Hub Team</p>
                    <p style="margin: 10px 0 0 0; color: #868e96; font-size: 12px;">
                        <i>This is an automated email. Please do not reply to this message.</i>
                    </p>
                </div>
            </div>
        `,
    };
    return await sendEmail(mailOptions);
};

export const accountCreationMail = async (name, to, password) => {
    const baseUrl = getBaseUrl();
    const loginUrl = getLoginUrl();
    
    const mailOptions = {
        to,
        subject: 'Polymer Hub Account Created Successfully',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; padding: 20px; background-color: #28a745; color: white;">
                    <h1 style="margin: 0;">Polymer Hub</h1>
                </div>
                
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Welcome to Polymer Hub!</h2>
                    <p style="color: #555; font-size: 16px;">Hi ${name},</p>
                    <p style="color: #555; font-size: 16px;">Your account has been successfully created and activated.</p>
                    
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <h3 style="color: #007bff; margin-top: 0;">Your Login Credentials:</h3>
                        <p style="margin: 8px 0;"><strong>Email:</strong> ${to}</p>
                        <p style="margin: 8px 0;"><strong>Password:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px;">${password}</code></p>
                    </div>

                    <div style="background-color: #d1ecf1; border: 1px solid #b8daff; border-radius: 6px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #0c5460; font-size: 14px;">
                            <strong>🔒 Security Tip:</strong> Please change your password after your first login for better security.
                        </p>
                    </div>
                    
                    <p style="color: #555; font-size: 16px;">You can log in to your account using the button below:</p>
                    <p style="text-align: center;">
                        <a href="${loginUrl}" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: bold; margin: 15px 0; font-size: 16px;">Login to Polymer Hub</a>
                    </p>
                    
                    <p style="color: #555; font-size: 16px;">Or visit: <a href="${baseUrl}" style="color: #007bff;">${baseUrl}</a></p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="margin: 0; color: #6c757d; font-size: 14px;">Best regards,<br>The Polymer Hub Team</p>
                    <p style="margin: 10px 0 0 0; color: #868e96; font-size: 12px;">
                        <i>This is an automated email. Please do not reply to this message.</i>
                    </p>
                </div>
            </div>
        `,
    };
    return await sendEmail(mailOptions);
};

export const forgotPasswordOtpMail = async (email, otp) => {
  const baseUrl = getBaseUrl();
  const mailOptions = {
    to: email,
    subject: 'Reset Your Polymer Hub Password - OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px; background-color: #dc3545; color: white;">
            <h1 style="margin: 0;">Polymer Hub</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Password Reset Request</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Reset Your Password</h2>
            <p style="color: #555; font-size: 16px;">Hi,</p>
            <p style="color: #555; font-size: 16px;">We received a request to reset your Polymer Hub password. If you made this request, please use the OTP below to proceed:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; font-size: 32px; font-weight: bold; background-color: #f8f9fa; padding: 20px 40px; border-radius: 8px; border: 3px solid #dc3545; color: #dc3545; letter-spacing: 5px; font-family: 'Courier New', monospace;">${otp}</div>
            </div>

            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #721c24; font-size: 14px;">
                    <strong>⏰ Important:</strong> This OTP is valid for <strong>10 minutes</strong> only.
                </p>
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                    <strong>🔐 Security Notice:</strong> If you did not request this password reset, please ignore this email. Your password will remain unchanged.
                </p>
            </div>
            
            <p style="color: #555; font-size: 16px;">After verification, you'll be able to set a new password for your account.</p>
            <p style="text-align: center;">
                <a href="${baseUrl}/reset-password" style="display: inline-block; background-color: #dc3545; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 10px 0;">Reset Password</a>
            </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">Best regards,<br>The Polymer Hub Team</p>
            <p style="margin: 10px 0 0 0; color: #868e96; font-size: 12px;">
                <i>This is an automated email. Please do not reply to this message.</i>
            </p>
        </div>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

// Quote request notification email
export const sendQuoteRequestNotification = async (recipientEmail, quoteDetails) => {
    const baseUrl = getBaseUrl();
    const dashboardUrl = getDashboardUrl();
    
    const mailOptions = {
        to: recipientEmail,
        subject: 'New Quote Request - Polymer Hub',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; padding: 20px; background-color: #17a2b8; color: white;">
                    <h1 style="margin: 0;">Polymer Hub</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">New Quote Request</p>
                </div>
                
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">You have a new quote request!</h2>
                    <p style="color: #555; font-size: 16px;">A new quote request has been submitted on Polymer Hub.</p>
                    
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <h3 style="color: #17a2b8; margin-top: 0;">Request Details:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #555;">Product:</td>
                                <td style="padding: 8px 0; color: #333;">${quoteDetails.productName || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #555;">Quantity:</td>
                                <td style="padding: 8px 0; color: #333;">${quoteDetails.quantity || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #555;">Requested by:</td>
                                <td style="padding: 8px 0; color: #333;">${quoteDetails.requesterName || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #555;">Company:</td>
                                <td style="padding: 8px 0; color: #333;">${quoteDetails.company || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                                <td style="padding: 8px 0; color: #333;">${quoteDetails.email || 'N/A'}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background-color: #d1ecf1; border: 1px solid #b8daff; border-radius: 6px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #0c5460; font-size: 14px;">
                            <strong>💼 Action Required:</strong> Please log in to your dashboard to view the complete request details and respond to the client.
                        </p>
                    </div>
                    
                    <p style="color: #555; font-size: 16px;">Please log in to your account to view and respond to this request:</p>
                    <p style="text-align: center;">
                        <a href="${dashboardUrl}" style="display: inline-block; background-color: #17a2b8; color: white; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: bold; margin: 15px 0; font-size: 16px;">View Request</a>
                    </p>
                    
                    <p style="color: #555; font-size: 14px; margin-top: 30px;">Thank you for being part of the Polymer Hub community!</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="margin: 0; color: #6c757d; font-size: 14px;">Best regards,<br>The Polymer Hub Team</p>
                    <p style="margin: 10px 0 0 0; color: #868e96; font-size: 12px;">
                        <i>This is an automated email. Please do not reply to this message.</i>
                    </p>
                </div>
            </div>
        `,
    };
    return await sendEmail(mailOptions);
};