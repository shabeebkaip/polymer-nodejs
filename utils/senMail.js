/**
 * @deprecated This file is DEPRECATED and kept for reference only.
 * 
 * ⚠️ DO NOT USE THIS FILE FOR NEW CODE ⚠️
 * 
 * Use the centralized email service instead:
 * 
 *   import emailService from '../services/email.service.js';
 *   await emailService.sendEmail({ to, subject, html });
 * 
 * See documentation/EMAIL_SERVICE.md for full details.
 * 
 * This file will be removed in a future version.
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendMail = async ({ to, subject, html }) => {
  try {
    // Create transporter with Office 365/Outlook SMTP
    const transporter = nodemailer.createTransport({
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

    // Send email
    const info = await transporter.sendMail({
      from: `"PolymersHub" <${process.env.EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw error;
  }
};

export default sendMail;