import express from 'express';
import { sendRegistrationOtp } from '../../tools/mail.js';

const testEmailRouter = express.Router();

// Test email endpoint
testEmailRouter.post('/send-test-email', async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Generate a test OTP
        const testOtp = '123456';

        // Send test email
        const result = await sendRegistrationOtp(
            name || 'Test User',
            email,
            testOtp
        );

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Test email sent successfully!',
                details: {
                    recipient: email,
                    from: 'noreply@polymershub.com',
                    messageId: result.messageId
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to send test email',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error in test email endpoint:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Simple GET endpoint to check if the route is working
testEmailRouter.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Test email endpoint is working',
        instructions: 'Send a POST request to /send-test-email with { "email": "your@email.com", "name": "Your Name" }'
    });
});

export default testEmailRouter;
