# Password Recovery Journey

## Overview
This journey maps the complete flow for users who have forgotten their password or need to reset it for security reasons. This is a critical trust-building and account recovery path that must balance security with user convenience.

## User Personas
- **Forgetful User**: Simply forgot their password
- **Returning User**: Haven't logged in for months/years
- **Security-Conscious**: Proactive password reset
- **Compromised Account**: Suspicious activity detected
- **Multiple Account User**: Confusion about which password
- **Tech-Challenged**: Needs extra guidance

## Password Reset Entry Points

### 1. Login Page Trigger

#### Failed Login Attempt
```
┌─────────────────────────────────────────┐
│  Sign In to PetSupplies Shop           │
├─────────────────────────────────────────┤
│  Email: john.doe@email.com             │
│  Password: ••••••••                    │
│                                         │
│  ❌ Invalid email or password          │
│                                         │
│  [Try Again]                           │
│                                         │
│  Forgot your password?                 │
│  [Reset Password] ← Primary recovery   │
│                                         │
│  Don't have an account? [Sign Up]      │
└─────────────────────────────────────────┘
```

#### Multiple Failed Attempts
```javascript
const loginAttemptHandler = {
  maxAttempts: 5,
  lockoutDuration: 900, // 15 minutes
  actions: {
    attempt_1_2: 'show_error',
    attempt_3: 'show_password_hint',
    attempt_4: 'prominent_reset_link',
    attempt_5: 'temporary_lockout'
  },
  messages: {
    attempt_3: "Having trouble? Your password was last changed 45 days ago.",
    attempt_4: "One more attempt before temporary lockout. Reset password?",
    attempt_5: "Account temporarily locked. Check email for unlock instructions."
  }
};
```

### 2. Proactive Reset Triggers

#### Security-Initiated Reset
```
Email Subject: Important: Unusual activity on your account

We noticed unusual sign-in activity on your account.
Location: Unknown location
Device: New device

If this wasn't you, secure your account now:
[Reset Password Immediately]

If this was you, you can ignore this email.
```

#### Expired Password
```
┌─────────────────────────────────────────┐
│  Password Expired                       │
├─────────────────────────────────────────┤
│  Your password expired on Jan 1, 2024  │
│                                         │
│  For your security, passwords must be  │
│  updated every 90 days.                │
│                                         │
│  [Create New Password]                 │
│                                         │
│  Need help? [Contact Support]          │
└─────────────────────────────────────────┘
```

## Password Reset Flow

### 3. Reset Request Initiation

#### Email/Username Entry
```
┌─────────────────────────────────────────┐
│  Reset Your Password                    │
├─────────────────────────────────────────┤
│  Enter your email address and we'll    │
│  send you instructions to reset your   │
│  password.                             │
│                                         │
│  Email or Username:                    │
│  [_________________________________]   │
│                                         │
│  [Send Reset Instructions]             │
│                                         │
│  Remember your password? [Sign In]     │
│                                         │
│  Security Note:                        │
│  • Check your spam folder              │
│  • Link expires in 1 hour              │
│  • Contact support if issues persist   │
└─────────────────────────────────────────┘
```

#### API Call
```javascript
POST /api/auth/reset-password-request
{
  "email": "john.doe@email.com",
  "recaptcha": "token_xyz"
}

Response:
{
  "success": true,
  "message": "If an account exists, reset instructions sent",
  "rateLimit": {
    "remaining": 2,
    "resetIn": 3600
  }
}
```

### 4. Security Verification

#### Additional Verification Methods
```
┌─────────────────────────────────────────┐
│  Verify Your Identity                   │
├─────────────────────────────────────────┤
│  For added security, please verify     │
│  your identity:                        │
│                                         │
│  Choose verification method:           │
│                                         │
│  ○ Email                              │
│    Send code to j***@email.com        │
│                                         │
│  ○ SMS                                │
│    Send code to ***-***-4567          │
│                                         │
│  ○ Security Questions                 │
│    Answer your security questions     │
│                                         │
│  ○ Account Information                │
│    Verify recent order details        │
│                                         │
│  [Continue]                            │
└─────────────────────────────────────────┘
```

#### Security Questions
```
┌─────────────────────────────────────────┐
│  Answer Security Questions              │
├─────────────────────────────────────────┤
│  Question 1:                           │
│  What was your first pet's name?      │
│  [_________________________________]   │
│                                         │
│  Question 2:                           │
│  In what city were you born?          │
│  [_________________________________]   │
│                                         │
│  [Verify Answers]                     │
│                                         │
│  Can't remember? [Try Another Method]  │
└─────────────────────────────────────────┘
```

### 5. Reset Email Communication

#### Password Reset Email
```
Subject: Reset your PetSupplies password

Hi John,

We received a request to reset your password.

[Reset Password] <- Button, expires in 1 hour

Or copy this link:
https://petshop.com/reset?token=abc123...

If you didn't request this, please ignore this email.
Your password won't be changed.

For security, this link expires in 1 hour.

Security tip: Never share your password or this link.

Need help? Contact support@petshop.com
```

#### Email Security Features
```javascript
const emailSecurity = {
  linkExpiration: 3600, // 1 hour
  tokenType: 'JWT',
  encryption: 'AES-256',
  features: {
    oneTimeUse: true,
    ipValidation: true,
    deviceFingerprint: true
  },
  rateLimit: {
    maxRequests: 3,
    window: 3600
  }
};
```

### 6. Password Reset Page

#### New Password Creation
```
┌─────────────────────────────────────────┐
│  Create New Password                    │
├─────────────────────────────────────────┤
│  Email: john.doe@email.com             │
│                                         │
│  New Password:                         │
│  [_________________________________]   │
│  Password Strength: [████░░░░] Medium  │
│                                         │
│  Requirements:                         │
│  ✅ At least 8 characters              │
│  ✅ One uppercase letter               │
│  ❌ One number                        │
│  ❌ One special character              │
│                                         │
│  Confirm New Password:                 │
│  [_________________________________]   │
│  ❌ Passwords don't match              │
│                                         │
│  ☑ Sign me in after reset             │
│                                         │
│  [Reset Password]                     │
└─────────────────────────────────────────┘
```

#### Password Strength Indicator
```javascript
const passwordStrength = {
  calculateScore: (password) => {
    let score = 0;
    // Length
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    // Complexity
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    return score;
  },
  levels: {
    0-20: { label: 'Very Weak', color: 'red' },
    21-40: { label: 'Weak', color: 'orange' },
    41-60: { label: 'Fair', color: 'yellow' },
    61-80: { label: 'Good', color: 'light-green' },
    81-100: { label: 'Strong', color: 'green' }
  }
};
```

### 7. Reset Confirmation

#### Success Confirmation
```
┌─────────────────────────────────────────┐
│  ✅ Password Reset Successful          │
├─────────────────────────────────────────┤
│  Your password has been reset          │
│  successfully.                         │
│                                         │
│  Security Actions:                     │
│  • All devices have been signed out    │
│  • Email confirmation sent             │
│  • Login from new devices will require │
│    additional verification             │
│                                         │
│  [Continue to Homepage]                │
│  [Go to My Account]                    │
│                                         │
│  Tip: Consider enabling two-factor     │
│  authentication for added security.    │
│  [Enable 2FA]                         │
└─────────────────────────────────────────┘
```

## Alternative Recovery Methods

### 8. Account Recovery Options

#### No Email Access
```
┌─────────────────────────────────────────┐
│  Can't Access Your Email?              │
├─────────────────────────────────────────┤
│  Alternative Recovery Options:         │
│                                         │
│  1. SMS Recovery                       │
│     Verify via phone: ***-***-4567    │
│     [Send SMS Code]                   │
│                                         │
│  2. Account Verification               │
│     Answer questions about your       │
│     account and recent activity        │
│     [Start Verification]               │
│                                         │
│  3. Customer Support                   │
│     Chat with an agent for help       │
│     Available 24/7                    │
│     [Start Chat]                      │
│                                         │
│  4. Identity Verification              │
│     Upload ID for manual review       │
│     Response within 24 hours          │
│     [Upload Documents]                │
└─────────────────────────────────────────┘
```

#### Social Account Recovery
```
┌─────────────────────────────────────────┐
│  Recover via Social Account            │
├─────────────────────────────────────────┤
│  Your account is linked to:           │
│                                         │
│  [Google] Sign in with Google          │
│  [Facebook] Sign in with Facebook      │
│  [Apple] Sign in with Apple           │
│                                         │
│  After signing in, you can set a      │
│  new password for direct login.       │
└─────────────────────────────────────────┘
```

### 9. Customer Support Path

#### Live Chat Support
```
┌─────────────────────────────────────────┐
│  Chat Support - Password Help          │
├─────────────────────────────────────────┤
│  Agent: Hi! I see you're having       │
│  trouble with your password.          │
│                                         │
│  To help you, I'll need to verify:    │
│  1. Email address on account          │
│  2. Last 4 digits of a recent order   │
│  3. Billing ZIP code                  │
│                                         │
│  You: My email is john@...            │
│                                         │
│  Agent: Great! I've sent a special    │
│  recovery link to your email.         │
│  This link bypasses normal limits.    │
│                                         │
│  [End Chat] [Email Transcript]        │
└─────────────────────────────────────────┘
```

## Security Measures

### 10. Fraud Prevention

#### Suspicious Activity Detection
```javascript
const suspiciousPatterns = {
  rapidRequests: {
    threshold: 5,
    timeWindow: 300, // 5 minutes
    action: 'block_and_notify'
  },
  unusualLocation: {
    check: 'geoip',
    action: 'additional_verification'
  },
  multipleAccounts: {
    sameIP: true,
    action: 'flag_for_review'
  },
  patterns: [
    'password_spray',
    'credential_stuffing',
    'brute_force'
  ]
};
```

#### Rate Limiting
```
┌─────────────────────────────────────────┐
│  ⚠️ Too Many Attempts                  │
├─────────────────────────────────────────┤
│  You've exceeded the maximum number    │
│  of password reset attempts.           │
│                                         │
│  For security, please wait:            │
│  [14:59] before trying again           │
│                                         │
│  If you're locked out:                │
│  • Check spam for previous emails      │
│  • Try alternative recovery method     │
│  • Contact customer support            │
│                                         │
│  [Contact Support] [Other Options]     │
└─────────────────────────────────────────┘
```

### 11. Audit Trail

#### Security Logging
```javascript
const auditLog = {
  resetRequested: {
    timestamp: '2024-01-15T10:30:00Z',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    email: 'john.doe@email.com',
    status: 'email_sent'
  },
  resetCompleted: {
    timestamp: '2024-01-15T10:45:00Z',
    ip: '192.168.1.1',
    tokenUsed: 'abc123...',
    passwordStrength: 85,
    status: 'success'
  },
  notifications: [
    'email_sent_to_user',
    'security_alert_sent',
    'devices_logged_out'
  ]
};
```

## Mobile Experience

### 12. Mobile Password Reset

#### Mobile-Optimized Flow
```
┌─────────────────────────────────────────┐
│📱 Reset Password                        │
├─────────────────────────────────────────┤
│  Email:                                │
│  [john.doe@email.com        ]         │
│                                         │
│  [Send Reset Link]                     │
│                                         │
│  Or use:                              │
│  [📧 Open Email App]                   │
│  [💬 SMS Code]                         │
│  [🔐 Biometric Reset]                  │
└─────────────────────────────────────────┘
```

#### App-Specific Features
- Biometric authentication bypass
- Deep linking from email
- Push notification with reset code
- Secure password manager integration
- Face ID/Touch ID for verification

## Edge Cases & Error Handling

### Common Edge Cases

#### Non-Existent Email
```
┌─────────────────────────────────────────┐
│  Reset Instructions Sent               │
├─────────────────────────────────────────┤
│  If an account exists with this email,│
│  you'll receive reset instructions.    │
│                                         │
│  Note: For security, we don't confirm  │
│  whether an email exists in our system.│
│                                         │
│  Not received? Check:                  │
│  • Spam/junk folder                   │
│  • Correct email spelling              │
│  • Alternative email addresses         │
└─────────────────────────────────────────┘
```

#### Expired Token
```
┌─────────────────────────────────────────┐
│  Link Expired                          │
├─────────────────────────────────────────┤
│  This password reset link has expired  │
│  or has already been used.            │
│                                         │
│  Password reset links expire after:    │
│  • 1 hour from request                │
│  • Single use only                    │
│                                         │
│  [Request New Link]                   │
│  [Return to Login]                    │
└─────────────────────────────────────────┘
```

#### Account Locked
```
┌─────────────────────────────────────────┐
│  Account Temporarily Locked            │
├─────────────────────────────────────────┤
│  Due to multiple failed attempts,     │
│  this account is temporarily locked.   │
│                                         │
│  Unlock options:                      │
│  • Wait 15 minutes                    │
│  • Verify via email                   │
│  • Contact support                    │
│                                         │
│  [Send Unlock Email] [Chat Support]    │
└─────────────────────────────────────────┘
```

## Success Metrics

### Password Reset Analytics
```javascript
const metrics = {
  requestRate: '2.3% of MAU',
  successRate: '87%',
  averageCompletionTime: '3.2 minutes',
  dropOffPoints: {
    emailEntry: '5%',
    emailNotReceived: '8%',
    passwordCreation: '3%',
    technical: '2%'
  },
  supportTickets: '0.3% of resets',
  fraudulentAttempts: '0.05%'
};
```

## API Endpoints

### Password Reset APIs
```
POST /api/auth/reset-password-request
POST /api/auth/verify-reset-token
POST /api/auth/reset-password
POST /api/auth/validate-security-questions
POST /api/auth/send-sms-code
POST /api/auth/verify-sms-code
GET  /api/auth/reset-options
POST /api/auth/unlock-account
```

## Testing Scenarios

### Reset Flow Testing
1. Standard email reset flow
2. Multiple failed login attempts
3. Expired token handling
4. Rate limiting enforcement
5. Security question validation
6. SMS backup verification
7. Social login recovery
8. Cross-device reset
9. Concurrent reset requests
10. Support-assisted reset

## Future Enhancements

### Planned Improvements
- Passwordless authentication
- Magic link login
- Biometric-only accounts
- Hardware key support
- Blockchain identity verification
- AI-powered fraud detection
- Progressive authentication
- Zero-knowledge proofs