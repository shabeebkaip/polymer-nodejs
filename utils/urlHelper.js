import dotenv from 'dotenv';
dotenv.config();

// Get the appropriate base URL based on environment
export const getBaseUrl = () => {
    const env = process.env.NODE_ENV || 'development';
    
    switch (env) {
        case 'production':
            return process.env.PRODUCTION_URL || 'https://polymershub.com';
        case 'staging':
            return process.env.STAGING_URL || 'https://staging.polymershub.com';
        case 'development':
        default:
            return process.env.BASE_URL || 'http://localhost:3000';
    }
};

// Generate URLs for different purposes
export const generateUrl = (path = '') => {
    const baseUrl = getBaseUrl();
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

// Specific URL generators
export const getLoginUrl = () => generateUrl('/login');
export const getDashboardUrl = () => generateUrl('/dashboard');
export const getVerificationUrl = () => generateUrl('/verify-email');
export const getResetPasswordUrl = () => generateUrl('/reset-password');
export const getHomeUrl = () => generateUrl('/');

// Email-specific URLs
export const getEmailVerificationUrl = (token) => generateUrl(`/verify-email?token=${token}`);
export const getPasswordResetUrl = (token) => generateUrl(`/reset-password?token=${token}`);

export default {
    getBaseUrl,
    generateUrl,
    getLoginUrl,
    getDashboardUrl,
    getVerificationUrl,
    getResetPasswordUrl,
    getHomeUrl,
    getEmailVerificationUrl,
    getPasswordResetUrl
};
