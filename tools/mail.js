import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export const accountCreationMail = (name, to, password) => {

    const mailOptions = {
        from: process.env.EMAIL,
        to,
        subject: 'Polymer Account Creation',
        html: `
            <h2>Welcome to Polymer hub</h2>
            <p>Hi ${name},Your account has been successfully created.</p>
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p>You can log in to your account by clicking the link below: </p>
            <a href="${process.env.BASE_URL}">Polymer Hub</a>
            <p>Best regards,</p>
            <p>Polymer Hub</p>

            <hr />
            <p><i>This is an auto-generated email. Please do not reply to this email.</i></p>
        `,
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('Error sending email:', error);
        }
        console.log('Email sent:', info.response);
    });
};

export const forgotPasswordOtpMail = (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to,
    subject: 'Reset Your Polymer Hub Password - OTP',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi,</p>
      <p>We received a request to reset your Polymer Hub password.</p>
      <p>Please use the OTP below to proceed:</p>
      
      <p style="font-size: 20px; font-weight: bold; background-color: #f5f5f5; padding: 10px 20px; display: inline-block; border-radius: 6px;">${otp}</p>

      <p>This OTP is valid for <strong>10 minutes</strong>.</p>
      
      <p>If you did not request this, please ignore this email. Your password will remain unchanged.</p>
      
      <p>Best regards,</p>
      <p>Polymer Hub Team</p>

      <hr />
      <p><i>This is an auto-generated email. Please do not reply to this email.</i></p>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending OTP email:', error);
    } else {
      console.log('OTP email sent:', info.response);
    }
  });
};