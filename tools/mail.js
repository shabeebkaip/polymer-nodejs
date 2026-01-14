/**
 * @deprecated This file is DEPRECATED and kept for reference only.
 * 
 * ⚠️ DO NOT USE THIS FILE FOR NEW CODE ⚠️
 * 
 * Use the centralized email service instead:
 * 
 *   import emailService from '../services/email.service.js';
 *   // or
 *   import { sendRegistrationOtp, sendPasswordResetOtp } from '../services/email.service.js';
 * 
 * See documentation/EMAIL_SERVICE.md for full details.
 * 
 * This file will be removed in a future version.
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { config } from '../config/config.js';
import { getBaseUrl, getLoginUrl, getDashboardUrl } from '../utils/urlHelper.js';

dotenv.config();

// Create reusable transporter
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: 'smtp.office365.com',
            port: 587,
            secure: false, // use STARTTLS
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                ciphers: 'SSLv3'
            }
        });
    }
    return transporter;
};

// Test email connection
const testEmailConnection = async () => {
    try {
        if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
            console.log('⚠️  Email credentials not configured');
            return;
        }
        const transporter = getTransporter();
        await transporter.verify();
        console.log('✅ Email service initialized (Nodemailer + Office 365)');
        console.log(`📧 Emails will be sent from: ${process.env.EMAIL}`);
    } catch (error) {
        console.log('⚠️  Error initializing email service:', error.message);
    }
};

// Call test on module load
testEmailConnection();

// Generic email sender function
const sendEmail = async (mailOptions) => {
    try {
        console.log(`📤 Sending email to: ${mailOptions.to}, Subject: ${mailOptions.subject}`);
        const transporter = getTransporter();
        
        const info = await transporter.sendMail({
            from: `"PolymersHub" <${process.env.EMAIL}>`,
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.html,
            replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL,
        });
        
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        console.error('❌ Email error details:', error.message);
        return { success: false, error: error.message };
    }
};

// Registration OTP email
export const sendRegistrationOtp = async (name, email, otp) => {
    const baseUrl = getBaseUrl();
    const mailOptions = {
        to: email,
        subject: 'Verify Your Email - PolymersHub Registration',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; padding: 20px; background-color: #007bff; color: white;">
                    <h1 style="margin: 0;">PolymersHub</h1>
                </div>
                
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Welcome to PolymersHub!</h2>
                    <p style="color: #555; font-size: 16px;">Hi ${name},</p>
                    <p style="color: #555; font-size: 16px;">Thank you for registering with PolymersHub. To complete your registration, please verify your email address using the OTP below:</p>
                    
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
                        <a href="${baseUrl}" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 10px 0;">Visit PolymersHub</a>
                    </p>
                    
                    <p style="color: #777; font-size: 14px; margin-top: 30px;">If you didn't create an account with us, please ignore this email.</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="margin: 0; color: #6c757d; font-size: 14px;">Best regards,<br>The PolymersHub Team</p>
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
        subject: 'PolymersHub Account Created Successfully',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; padding: 20px; background-color: #28a745; color: white;">
                    <h1 style="margin: 0;">PolymersHub</h1>
                </div>
                
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Welcome to PolymersHub!</h2>
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
                        <a href="${loginUrl}" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: bold; margin: 15px 0; font-size: 16px;">Login to PolymersHub</a>
                    </p>
                    
                    <p style="color: #555; font-size: 16px;">Or visit: <a href="${baseUrl}" style="color: #007bff;">${baseUrl}</a></p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="margin: 0; color: #6c757d; font-size: 14px;">Best regards,<br>The PolymersHub Team</p>
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
    subject: 'Reset Your PolymersHub Password - OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px; background-color: #dc3545; color: white;">
            <h1 style="margin: 0;">PolymersHub</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Password Reset Request</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Reset Your Password</h2>
            <p style="color: #555; font-size: 16px;">Hi,</p>
            <p style="color: #555; font-size: 16px;">We received a request to reset your PolymersHub password. If you made this request, please use the OTP below to proceed:</p>
            
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
            <p style="margin: 0; color: #6c757d; font-size: 14px;">Best regards,<br>The PolymersHub Team</p>
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
        subject: 'New Quote Request - PolymersHub',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; padding: 20px; background-color: #17a2b8; color: white;">
                    <h1 style="margin: 0;">PolymersHub</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">New Quote Request</p>
                </div>
                
                <div style="padding: 30px; background-color: #ffffff;">
                    <h2 style="color: #333; text-align: center; margin-bottom: 30px;">You have a new quote request!</h2>
                    <p style="color: #555; font-size: 16px;">A new quote request has been submitted on PolymersHub.</p>
                    
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
                    
                    <p style="color: #555; font-size: 14px; margin-top: 30px;">Thank you for being part of the PolymersHub community!</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="margin: 0; color: #6c757d; font-size: 14px;">Best regards,<br>The PolymersHub Team</p>
                    <p style="margin: 10px 0 0 0; color: #868e96; font-size: 12px;">
                        <i>This is an automated email. Please do not reply to this message.</i>
                    </p>
                </div>
            </div>
        `,
    };
    return await sendEmail(mailOptions);
};