import dotenv from 'dotenv';
dotenv.config();

// Environment configuration
export const config = {
    // Server configuration
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Database configuration
    mongoUri: process.env.MONGO,
    
    // JWT configuration
    jwtSecret: process.env.JWT_KEY,
    
    // Email configuration (Resend)
    resend: {
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.EMAIL_FROM || 'noreply@polymershub.com',
        replyTo: process.env.EMAIL_REPLY_TO || 'shabeebkaip@gmail.com',
    },
    
    // Legacy Gmail configuration (for backup/fallback)
    email: {
        user: process.env.EMAIL,
        password: process.env.EMAIL_PASSWORD,
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use TLS
    },
    
    // URLs based on environment
    urls: {
        development: process.env.BASE_URL || 'http://localhost:3000',
        staging: process.env.STAGING_URL || 'https://staging.polymershub.com',
        production: process.env.PRODUCTION_URL || 'https://polymershub.com'
    },
    
    // Cloudinary configuration
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET
    },
    
    // OTP configuration
    otp: {
        expiryMinutes: 10,
        length: 6
    },
    
    // Redis configuration (Upstash REST API)
    redis: {
        restUrl: process.env.UPSTASH_REDIS_REST_URL,
        restToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    }
};

// Get current environment URL
export const getCurrentUrl = () => {
    const env = config.nodeEnv;
    return config.urls[env] || config.urls.development;
};

// Validate required environment variables
export const validateConfig = () => {
    const required = [
        'MONGO',
        'JWT_KEY',
        'RESEND_API_KEY'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};

export default config;
