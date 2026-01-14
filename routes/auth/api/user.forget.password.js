import express from 'express';
import User from '../../../models/user.js';
import { generateOtp, saveOtp } from '../../../utils/otpHelper.js';
import { sendPasswordResetOtp } from '../../../services/email.service.js';

const forgetPassword = express.Router();

forgetPassword.post('/', async (req, res) => {
    try {
        const email = req.body.email?.toLowerCase().trim();

        if (!email) {
            return res.status(400).json({ 
                status: false, 
                message: 'Email is required.' 
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'User not found. Please register.',
            });
        }

        // Generate and save OTP
        const otp = generateOtp();
        const otpSaved = await saveOtp(email, otp);

        if (!otpSaved) {
            return res.status(500).json({
                status: false,
                message: 'Failed to generate OTP. Please try again.',
            });
        }

        // Send OTP via email
        const emailResult = await sendPasswordResetOtp(user.name || 'User', email, otp);

        if (!emailResult.success) {
            return res.status(500).json({
                status: false,
                message: 'Failed to send OTP email. Please try again.',
            });
        }

        res.status(200).json({
            status: true,
            message: 'OTP has been sent to your email successfully.',
        });
        
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({
            status: false,
            message: 'An error occurred while sending OTP.',
            error: error.message,
        });
    }
});

export default forgetPassword;