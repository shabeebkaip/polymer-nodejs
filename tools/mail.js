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