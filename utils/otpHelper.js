import bcrypt from 'bcrypt';
import Otp from '../models/otp.js';
import { config } from '../config/config.js';

// Generate 6-digit OTP
export const generateOtp = () => {
    const length = config.otp.length;
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

// Save OTP to database with expiration (configurable minutes)
export const saveOtp = async (email, otp) => {
    try {
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + config.otp.expiryMinutes);

        // Remove any existing OTP for this email
        await Otp.deleteMany({ email });

        // Create new OTP record
        const otpRecord = new Otp({
            email,
            otp: hashedOtp,
            expiresAt
        });

        await otpRecord.save();
        console.log(`OTP saved for ${email}, expires at ${expiresAt}`);
        return true;
    } catch (error) {
        console.error('Error saving OTP:', error);
        return false;
    }
};

// Verify OTP
export const verifyOtp = async (email, providedOtp) => {
    try {
        const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return { success: false, message: "Invalid OTP or OTP has expired." };
        }

        if (otpRecord.expiresAt < new Date()) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return { success: false, message: "OTP has expired." };
        }

        const isOtpValid = await bcrypt.compare(String(providedOtp), otpRecord.otp);
        if (!isOtpValid) {
            return { success: false, message: "Invalid OTP." };
        }

        // Delete the OTP after successful verification
        await Otp.deleteOne({ _id: otpRecord._id });
        return { success: true, message: "OTP verified successfully." };

    } catch (error) {
        console.error('Error verifying OTP:', error);
        return { success: false, message: "An error occurred during OTP verification." };
    }
};
