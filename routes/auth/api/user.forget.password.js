import express from 'express';
import bcrypt from 'bcrypt';
import User from '../../../models/user.js';
import Otp from '../../../models/otp.js';
import { forgotPasswordOtpMail } from '../../../tools/mail.js';

const forgetPassword = express.Router();

function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000);
}

forgetPassword.post('/', async (req, res) => {
    try {
        const email = req.body.email?.toLowerCase();

        if (!email) {
            return res.status(400).json({ status: false, message: 'Email is required.' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'User not found. Please register.',
            });
        }

        const existingOtp = await Otp.findOne({ email, expiresAt: { $gt: new Date() } });

        if (existingOtp) {
            return res.status(400).json({
                status: false,
                message: 'An OTP was already sent. Please try again later.',
            });
        }

        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(String(otp), 10);

        await forgotPasswordOtpMail(email, otp);
        // console.log(otp);

        const otpRecord = new Otp({
            email,
            otp: hashedOtp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        await otpRecord.save();

        res.status(200).json({
            status: true,
            message: 'OTP has been sent to your email successfully.',
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({
            status: false,
            message: 'An error occurred while sending OTP.',
        });
    }
});

export default forgetPassword;