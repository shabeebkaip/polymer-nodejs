# Email Templates

This directory contains HTML email templates used by the Email Service.

## Template Files

- **registration-otp.html** - OTP verification email for new registrations
- **password-reset-otp.html** - OTP email for password reset requests
- **welcome.html** - Welcome email sent after successful account verification
- **account-creation.html** - Account credentials email sent when admin creates an account
- **notification.html** - Generic notification template

## Template Variables

Templates use `{{VARIABLE_NAME}}` syntax for dynamic content replacement.

### Common Variables

- `{{NAME}}` - User's name
- `{{LOGO_URL}}` - Company logo URL (Cloudinary)
- `{{SUPPORT_EMAIL}}` - Support email address
- `{{YEAR}}` - Current year for copyright

### Template-Specific Variables

**registration-otp.html & password-reset-otp.html:**
- `{{OTP}}` - One-time password code

**welcome.html:**
- `{{DASHBOARD_URL}}` - Link to user dashboard

**account-creation.html:**
- `{{EMAIL}}` - User's email address
- `{{PASSWORD}}` - Temporary password
- `{{LOGIN_URL}}` - Link to login page

**notification.html:**
- `{{MESSAGE}}` - HTML message content

## Usage

Templates are automatically loaded by the EmailService class using the `_loadTemplate()` method:

```javascript
const html = this._loadTemplate('registration-otp', {
  NAME: 'John Doe',
  OTP: '123456',
  LOGO_URL: this._getLogoUrl(),
  SUPPORT_EMAIL: process.env.EMAIL,
  YEAR: new Date().getFullYear()
});
```

## Design Guidelines

All templates follow these design principles:

- **Brand Colors:**
  - Primary Green: #009966
  - Footer Background: #122019
  - Footer Brand: #3DB2A2
  
- **Responsive Design:** Mobile-optimized with media queries
- **Email Client Compatibility:** Tested for major email clients
- **Accessibility:** Clear typography and sufficient color contrast

## Modifying Templates

1. Edit the HTML file directly
2. Use `{{VARIABLE_NAME}}` for dynamic content
3. Maintain consistent styling with other templates
4. Test in multiple email clients before deploying
5. No server restart required - templates are loaded on each email send
