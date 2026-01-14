import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Professional Email Service
 * Centralized email handling using Nodemailer with Office 365 SMTP
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
    this.templatesPath = path.join(__dirname, "../templates/emails");
  }

  /**
   * Load and process email template
   * @private
   * @param {string} templateName - Name of the template file (without .html)
   * @param {Object} variables - Variables to replace in template
   * @returns {string} Processed HTML
   */
  _loadTemplate(templateName, variables = {}) {
    try {
      const templatePath = path.join(
        this.templatesPath,
        `${templateName}.html`
      );
      let html = fs.readFileSync(templatePath, "utf-8");

      // Replace all variables in template
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        html = html.replace(regex, variables[key]);
      });

      return html;
    } catch (error) {
      console.error(`Failed to load template ${templateName}:`, error.message);
      throw new Error(`Email template ${templateName} not found`);
    }
  }

  /**
   * Get logo URL based on environment
   * @private
   * @returns {string}
   */
  _getLogoUrl() {
    return "https://res.cloudinary.com/dm5c31z7w/image/upload/v1768391009/logo_tunohj.png";
  }

  /**
   * Initialize email transporter
   * @private
   */
  _initializeTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false, // use STARTTLS
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          ciphers: "SSLv3",
        },
      });
    }
    return this.transporter;
  }

  /**
   * Verify email connection
   * @returns {Promise<boolean>}
   */
  async verifyConnection() {
    try {
      const transporter = this._initializeTransporter();
      await transporter.verify();
      console.log("✅ Email service connected successfully");
      console.log(`📧 Sending from: ${process.env.EMAIL}`);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("❌ Email service connection failed:", error.message);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @param {string|string[]} options.to - Recipient email(s)
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} [options.text] - Plain text content (optional)
   * @param {string} [options.from] - Custom sender name (optional)
   * @param {string} [options.replyTo] - Reply-to address (optional)
   * @param {Array} [options.attachments] - Email attachments (optional)
   * @returns {Promise<Object>}
   */
  async sendEmail({ to, subject, html, text, from, replyTo, attachments }) {
    try {
      // Validate required fields
      if (!to || !subject || !html) {
        throw new Error(
          "Missing required fields: to, subject, and html are required"
        );
      }

      const transporter = this._initializeTransporter();

      // Prepare email options
      const mailOptions = {
        from: from
          ? `"${from}" <${process.env.EMAIL}>`
          : `"PolymersHub" <${process.env.EMAIL}>`,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html,
        text: text || undefined,
        replyTo: replyTo || process.env.EMAIL_REPLY_TO || process.env.EMAIL,
        attachments: attachments || undefined,
      };

      console.log(`📤 Sending email to: ${mailOptions.to}`);
      console.log(`📧 Subject: ${subject}`);

      const info = await transporter.sendMail(mailOptions);

      console.log("✅ Email sent successfully");
      console.log(`📬 Message ID: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      console.error("❌ Email send failed:", error.message);
      return {
        success: false,
        error: error.message,
        details: error.code || "UNKNOWN_ERROR",
      };
    }
  }

  /**
   * Send OTP email for registration
   * @param {string} name - User's name
   * @param {string} email - User's email
   * @param {string} otp - OTP code
   * @returns {Promise<Object>}
   */
  async sendRegistrationOTP(name, email, otp) {
    const html = this._loadTemplate("registration-otp", {
      NAME: name,
      OTP: otp,
      LOGO_URL: this._getLogoUrl(),
      SUPPORT_EMAIL: process.env.EMAIL,
      YEAR: new Date().getFullYear(),
    });

    return this.sendEmail({
      to: email,
      subject: "Verify Your Email - PolymersHub Registration",
      html,
    });
  }

  /**
   * Send OTP email for password reset
   * @param {string} name - User's name
   * @param {string} email - User's email
   * @param {string} otp - OTP code
   * @returns {Promise<Object>}
   */
  async sendPasswordResetOTP(name, email, otp) {
    const html = this._loadTemplate("password-reset-otp", {
      NAME: name,
      OTP: otp,
      LOGO_URL: this._getLogoUrl(),
      SUPPORT_EMAIL: process.env.EMAIL,
      YEAR: new Date().getFullYear(),
    });

    return this.sendEmail({
      to: email,
      subject: "Password Reset Request - PolymersHub",
      html,
    });
  }

  /**
   * Send welcome email after successful registration
   * @param {string} name - User's name
   * @param {string} email - User's email
   * @returns {Promise<Object>}
   */
  async sendWelcomeEmail(name, email) {
    const html = this._loadTemplate("welcome", {
      NAME: name,
      LOGO_URL: this._getLogoUrl(),
      DASHBOARD_URL: process.env.BASE_URL || "https://polymershub.com",
      SUPPORT_EMAIL: process.env.EMAIL,
      YEAR: new Date().getFullYear(),
    });

    return this.sendEmail({
      to: email,
      subject: "Welcome to PolymersHub - Account Activated! 🎉",
      html,
    });
  }

  /**
   * Send account creation email with credentials
   * @param {string} name - User's name
   * @param {string} email - User's email
   * @param {string} password - Temporary password
   * @returns {Promise<Object>}
   */
  async sendAccountCreationEmail(name, email, password) {
    const html = this._loadTemplate("account-creation", {
      NAME: name,
      EMAIL: email,
      PASSWORD: password,
      LOGO_URL: this._getLogoUrl(),
      LOGIN_URL: `${process.env.BASE_URL || "https://polymershub.com"}/login`,
      SUPPORT_EMAIL: process.env.EMAIL,
      YEAR: new Date().getFullYear(),
    });

    return this.sendEmail({
      to: email,
      subject: "PolymersHub Account Created - Login Credentials",
      html,
    });
  }

  /**
   * Send notification email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} message - Message content
   * @returns {Promise<Object>}
   */
  async sendNotification(to, subject, message) {
    const html = this._loadTemplate("notification", {
      MESSAGE: message,
      LOGO_URL: this._getLogoUrl(),
      YEAR: new Date().getFullYear(),
    });

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send early access confirmation email to user
   * @param {string} email - User's email
   * @param {string} userType - 'buyer' or 'supplier'
   * @returns {Promise<Object>}
   */
  async sendEarlyAccessConfirmation(email, userType) {
    const userTypeDisplay = userType.charAt(0).toUpperCase() + userType.slice(1);
    
    const html = this._loadTemplate("early-access-confirmation", {
      LOGO_URL: this._getLogoUrl(),
      USER_TYPE: userTypeDisplay,
      SUPPORT_EMAIL: process.env.EMAIL || "info@polymershub.com",
      YEAR: new Date().getFullYear(),
    });

    return this.sendEmail({
      to: email,
      subject: "Early Access Request Received - PolymersHub",
      html,
    });
  }

  /**
   * Send early access notification to admin
   * @param {string} adminEmail - Admin email
   * @param {string} userEmail - User's email
   * @param {string} userType - 'buyer' or 'supplier'
   * @returns {Promise<Object>}
   */
  async sendEarlyAccessAdminNotification(adminEmail, userEmail, userType) {
    const userTypeDisplay = userType.charAt(0).toUpperCase() + userType.slice(1);
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    });
    
    const html = this._loadTemplate("early-access-admin-notification", {
      USER_EMAIL: userEmail,
      USER_TYPE: userType.toLowerCase(),
      USER_TYPE_DISPLAY: userTypeDisplay,
      TIMESTAMP: timestamp,
      YEAR: new Date().getFullYear(),
    });

    return this.sendEmail({
      to: adminEmail,
      subject: `New Early Access Request: ${userTypeDisplay} - ${userEmail}`,
      html,
    });
  }
}

// Export singleton instance
const emailService = new EmailService();

// Auto-verify connection on initialization
emailService.verifyConnection().catch((err) => {
  console.error("Failed to initialize email service:", err.message);
});

export default emailService;

// Named exports for backward compatibility
export const sendEmail = (options) => emailService.sendEmail(options);
export const sendRegistrationOtp = (name, email, otp) =>
  emailService.sendRegistrationOTP(name, email, otp);
export const sendPasswordResetOtp = (name, email, otp) =>
  emailService.sendPasswordResetOTP(name, email, otp);
export const sendWelcomeEmail = (name, email) =>
  emailService.sendWelcomeEmail(name, email);
export const sendAccountCreationEmail = (name, email, password) =>
  emailService.sendAccountCreationEmail(name, email, password);
export const sendNotification = (to, subject, message) =>
  emailService.sendNotification(to, subject, message);
