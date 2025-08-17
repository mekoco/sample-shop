# User Profile Management Journey

## Overview
This journey encompasses all user interactions with their account profile, including personal information updates, preferences management, address book maintenance, payment methods, pet profiles, and account settings. This is essential for maintaining accurate user data and personalizing the shopping experience.

## User Personas
- **Profile Perfectionist**: Keeps everything updated and organized
- **Privacy-Conscious**: Minimal information, strict settings
- **Multi-Pet Owner**: Complex household with various pets
- **Convenience Seeker**: Saves everything for quick checkout
- **Security-Focused**: Regular password changes, 2FA enabled
- **Casual Updater**: Only updates when necessary

## Account Dashboard

### 1. Main Profile Hub

#### Account Overview
```
┌─────────────────────────────────────────┐
│  My Account                            │
│  Welcome back, John!                   │
├─────────────────────────────────────────┤
│  Quick Links:                          │
│  [Orders] [Addresses] [Payments]       │
│  [Pets] [Wishlist] [Settings]          │
├─────────────────────────────────────────┤
│  Account Summary:                      │
│  Member Since: January 2022            │
│  Loyalty Tier: 🥇 Gold (2,450 points)  │
│  Next Reward: 50 points away           │
│                                         │
│  Recent Activity:                      │
│  • Order #0847 delivered (2 days ago)  │
│  • Password updated (15 days ago)      │
│  • New address added (1 month ago)     │
│                                         │
│  [Complete Your Profile] 85% complete  │
└─────────────────────────────────────────┘
```

### 2. Personal Information Management

#### Basic Profile Information
```
┌─────────────────────────────────────────┐
│  Personal Information                   │
├─────────────────────────────────────────┤
│  First Name: * [John_______________]   │
│  Last Name: * [Doe_________________]   │
│  Display Name: [JohnD______________]   │
│                                         │
│  Email: * [john.doe@email.com_____]   │
│  ✅ Verified                           │
│  [Change Email] [Add Secondary]        │
│                                         │
│  Phone: [+1 (555) 123-4567________]   │
│  ☑ Enable SMS notifications           │
│  [Verify Phone]                        │
│                                         │
│  Birthday: [MM] [DD] [YYYY]           │
│  🎁 Get special birthday offers        │
│                                         │
│  Gender: (Optional)                    │
│  ○ Male ○ Female ○ Other ○ Prefer not │
│                                         │
│  [Save Changes] [Cancel]               │
└─────────────────────────────────────────┘
```

#### Email Management
```javascript
const emailManagement = {
  primary: 'john.doe@email.com',
  verified: true,
  secondary: ['john.work@company.com'],
  preferences: {
    marketing: true,
    transactional: true,
    frequency: 'weekly',
    categories: ['dogs', 'deals', 'new_products']
  },
  changeProcess: {
    requirePassword: true,
    sendVerification: true,
    graceperiod: 7 // days to revert
  }
};
```

### 3. Address Book Management

#### Address List View
```
┌─────────────────────────────────────────┐
│  My Addresses                          │
├─────────────────────────────────────────┤
│  Default Shipping Address:             │
│  ┌───────────────────────────────┐     │
│  │ 🏠 Home (Default)              │     │
│  │ John Doe                       │     │
│  │ 123 Main Street, Apt 4B       │     │
│  │ New York, NY 10001            │     │
│  │ United States                  │     │
│  │ Phone: (555) 123-4567         │     │
│  │ [Edit] [Remove] [Set Default] │     │
│  └───────────────────────────────┘     │
│                                         │
│  Other Addresses:                      │
│  ┌───────────────────────────────┐     │
│  │ 🏢 Work                        │     │
│  │ John Doe                       │     │
│  │ 456 Office Park, Suite 200    │     │
│  │ New York, NY 10002            │     │
│  │ [Edit] [Remove] [Set Default] │     │
│  └───────────────────────────────┘     │
│                                         │
│  [+ Add New Address]                   │
└─────────────────────────────────────────┘
```

#### Add/Edit Address Form
```
┌─────────────────────────────────────────┐
│  Add New Address                       │
├─────────────────────────────────────────┤
│  Address Label: [Home/Work/Other___]   │
│                                         │
│  Country: * [United States ▼]          │
│                                         │
│  Full Name: * [____________________]   │
│  Company: [_______________________]    │
│                                         │
│  Street Address: * [_______________]   │
│  Apt/Suite/Unit: [________________]    │
│                                         │
│  City: * [________________________]   │
│  State: * [Select State ▼]            │
│  ZIP Code: * [___________]            │
│                                         │
│  Phone: * [______________________]     │
│                                         │
│  Delivery Instructions:                │
│  [________________________________]    │
│                                         │
│  ☑ Set as default shipping address    │
│  ☑ Also use for billing               │
│                                         │
│  [Validate Address] [Save] [Cancel]    │
└─────────────────────────────────────────┘
```

### 4. Payment Methods Management

#### Saved Payment Methods
```
┌─────────────────────────────────────────┐
│  Payment Methods                       │
├─────────────────────────────────────────┤
│  Default Payment:                      │
│  ┌───────────────────────────────┐     │
│  │ 💳 •••• •••• •••• 4242        │     │
│  │ Visa - Expires 08/2025        │     │
│  │ John Doe                      │     │
│  │ [Edit] [Remove] [Set Default] │     │
│  └───────────────────────────────┘     │
│                                         │
│  Other Payment Methods:                │
│  ┌───────────────────────────────┐     │
│  │ 💳 •••• •••• •••• 8765        │     │
│  │ Mastercard - Expires 12/2024  │     │
│  │ [Edit] [Remove]               │     │
│  └───────────────────────────────┘     │
│  ┌───────────────────────────────┐     │
│  │ 💰 PayPal                      │     │
│  │ john.doe@email.com            │     │
│  │ [Disconnect]                  │     │
│  └───────────────────────────────┘     │
│                                         │
│  [+ Add Payment Method]                │
│                                         │
│  💡 Tip: Add multiple payment methods  │
│  for seamless checkout                 │
└─────────────────────────────────────────┘
```

#### Add Payment Method
```javascript
const paymentMethodTypes = {
  creditCard: {
    fields: ['number', 'expiry', 'cvv', 'name'],
    validation: 'stripe',
    tokenization: true
  },
  bankAccount: {
    fields: ['routing', 'account', 'type'],
    verification: 'micro-deposits'
  },
  digitalWallet: {
    types: ['paypal', 'apple_pay', 'google_pay'],
    oauth: true
  },
  buyNowPayLater: {
    providers: ['klarna', 'afterpay'],
    prequalification: true
  }
};
```

### 5. Pet Profile Management

#### My Pets Dashboard
```
┌─────────────────────────────────────────┐
│  My Pets                               │
├─────────────────────────────────────────┤
│  ┌─────────────────┬─────────────────┐ │
│  │  🐕 Max         │  🐈 Whiskers    │ │
│  │  Golden Retriever│  Tabby Cat      │ │
│  │  Age: 5 years   │  Age: 3 years   │ │
│  │  Weight: 75 lbs │  Weight: 12 lbs │ │
│  │  [Edit] [Remove]│  [Edit] [Remove]│ │
│  └─────────────────┴─────────────────┘ │
│                                         │
│  [+ Add Another Pet]                   │
│                                         │
│  Personalized Recommendations:         │
│  Based on Max's profile:              │
│  • Large breed dog food               │
│  • Joint supplements (5+ years)       │
│  • Durable toys for strong chewers    │
│  [View Recommendations]                │
└─────────────────────────────────────────┘
```

#### Pet Profile Form
```
┌─────────────────────────────────────────┐
│  Add Pet Profile                       │
├─────────────────────────────────────────┤
│  Pet Name: * [____________________]    │
│                                         │
│  Pet Type: * [Select ▼]               │
│  • Dog  • Cat  • Bird  • Fish         │
│  • Rabbit  • Hamster  • Other         │
│                                         │
│  Breed: [____________________]        │
│  [Not sure? Browse breeds]            │
│                                         │
│  Birthday/Age: [MM/DD/YYYY]           │
│  Or approximate: [Select age ▼]       │
│                                         │
│  Gender: ○ Male ○ Female ○ Unknown    │
│  Neutered/Spayed: ○ Yes ○ No          │
│                                         │
│  Weight: [___] [lbs/kg ▼]            │
│  Size: ○ Small ○ Medium ○ Large       │
│                                         │
│  Special Needs:                       │
│  ☐ Senior pet                        │
│  ☐ Special diet required             │
│  ☐ Allergies                         │
│  ☐ Medical conditions                │
│  Notes: [_______________________]     │
│                                         │
│  Photo: [📷 Upload Photo]             │
│                                         │
│  [Save Pet] [Save & Add Another]      │
└─────────────────────────────────────────┘
```

### 6. Communication Preferences

#### Notification Settings
```
┌─────────────────────────────────────────┐
│  Communication Preferences             │
├─────────────────────────────────────────┤
│  Email Notifications:                  │
│  ☑ Order updates                      │
│  ☑ Shipping notifications             │
│  ☑ Promotional offers                 │
│  ☐ Product recommendations            │
│  ☑ Loyalty program updates            │
│  ☐ Pet care tips                      │
│  ☐ Survey invitations                 │
│                                         │
│  Frequency: [Weekly digest ▼]          │
│                                         │
│  SMS Notifications:                    │
│  ☑ Order confirmations                │
│  ☑ Delivery updates                   │
│  ☐ Promotional texts                  │
│  ☐ Flash sales                        │
│                                         │
│  Push Notifications (App):             │
│  ☑ Order status changes               │
│  ☑ Delivery alerts                    │
│  ☑ Price drops on wishlist            │
│  ☐ New product launches               │
│                                         │
│  [Save Preferences]                    │
└─────────────────────────────────────────┘
```

### 7. Security Settings

#### Account Security
```
┌─────────────────────────────────────────┐
│  Security Settings                     │
├─────────────────────────────────────────┤
│  Password:                             │
│  Last changed: 15 days ago            │
│  Strength: ████████░░ Strong          │
│  [Change Password]                     │
│                                         │
│  Two-Factor Authentication:            │
│  Status: ⚠️ Not enabled                │
│  [Enable 2FA] Recommended              │
│                                         │
│  Login Activity:                       │
│  Current session: Chrome, Windows      │
│  Last login: Jan 14, 2:30 PM          │
│  [View All Sessions]                   │
│                                         │
│  Connected Accounts:                   │
│  Google: ✅ Connected                  │
│  Facebook: Not connected              │
│  Apple: Not connected                 │
│  [Manage Connections]                  │
│                                         │
│  Security Questions:                   │
│  Status: ✅ Set up (2 questions)       │
│  [Update Questions]                    │
│                                         │
│  Account Recovery:                     │
│  Recovery email: j***@backup.com      │
│  Recovery phone: ***-***-4567         │
│  [Update Recovery Options]             │
└─────────────────────────────────────────┘
```

#### Two-Factor Setup
```
┌─────────────────────────────────────────┐
│  Enable Two-Factor Authentication      │
├─────────────────────────────────────────┤
│  Step 1: Choose your method           │
│                                         │
│  ○ Authenticator App (Recommended)    │
│    Use Google Authenticator, Authy    │
│                                         │
│  ○ SMS Text Message                   │
│    Receive codes at ***-***-4567      │
│                                         │
│  ○ Hardware Security Key               │
│    Use YubiKey or similar device      │
│                                         │
│  Step 2: Scan QR Code                 │
│  ┌─────────────────┐                   │
│  │                 │                   │
│  │    [QR CODE]    │                   │
│  │                 │                   │
│  └─────────────────┘                   │
│                                         │
│  Step 3: Enter verification code       │
│  [__ __ __ __ __ __]                  │
│                                         │
│  Step 4: Save backup codes            │
│  [Download Codes] [Print]              │
│                                         │
│  [Enable 2FA]                         │
└─────────────────────────────────────────┘
```

### 8. Privacy & Data Management

#### Privacy Controls
```
┌─────────────────────────────────────────┐
│  Privacy & Data Management             │
├─────────────────────────────────────────┤
│  Data Sharing:                         │
│  ☐ Share data with partners           │
│  ☐ Personalized advertising           │
│  ☑ Product improvement research       │
│                                         │
│  Data Collection:                      │
│  ☐ Track browsing behavior            │
│  ☑ Purchase history analysis          │
│  ☑ Customer service improvement       │
│                                         │
│  Your Rights:                          │
│  [Download My Data] GDPR/CCPA         │
│  [Request Data Deletion]              │
│  [Data Portability]                   │
│  [Opt-Out Preferences]                │
│                                         │
│  Cookie Preferences:                   │
│  Essential: ✅ Always On               │
│  Analytics: ☑ Enabled                 │
│  Marketing: ☐ Disabled                │
│  [Manage Cookies]                     │
│                                         │
│  Account Deletion:                     │
│  ⚠️ This action cannot be undone       │
│  [Delete My Account]                  │
└─────────────────────────────────────────┘
```

### 9. Loyalty & Rewards

#### Loyalty Program Dashboard
```
┌─────────────────────────────────────────┐
│  PetSupplies Rewards                   │
├─────────────────────────────────────────┤
│  Your Status: 🥇 Gold Member           │
│  Points Balance: 2,450                │
│                                         │
│  Progress to Platinum:                │
│  [████████████░░░░] 550 points to go  │
│                                         │
│  Available Rewards:                    │
│  • $10 off - 1,000 points [Redeem]    │
│  • $25 off - 2,000 points [Redeem]    │
│  • Free shipping - 500 points         │
│                                         │
│  Points History:                       │
│  +250 - Order #0847 (Jan 12)          │
│  +500 - Birthday bonus (Dec 15)       │
│  -1000 - Redeemed for $10 (Nov 30)    │
│  [View Full History]                   │
│                                         │
│  Earn More Points:                     │
│  • Refer a friend: 500 points         │
│  • Write reviews: 50 points each      │
│  • Complete profile: 100 points       │
│  [View All Ways to Earn]              │
└─────────────────────────────────────────┘
```

### 10. Subscription Management

#### Active Subscriptions
```
┌─────────────────────────────────────────┐
│  Subscription & Auto-Delivery          │
├─────────────────────────────────────────┤
│  Active Subscriptions:                 │
│                                         │
│  Dog Food - Premium Blend             │
│  Every 30 days | Next: Jan 25         │
│  Quantity: 2 bags | $59.98/delivery   │
│  Savings: 15% + Free shipping         │
│  [Modify] [Skip Next] [Pause] [Cancel]│
│                                         │
│  Cat Litter - Natural                 │
│  Every 45 days | Next: Feb 5          │
│  Quantity: 3 boxes | $47.97/delivery  │
│  [Modify] [Skip Next] [Pause] [Cancel]│
│                                         │
│  Subscription Benefits:                │
│  ✅ 15% discount on all deliveries     │
│  ✅ Free shipping always               │
│  ✅ Priority customer service          │
│  ✅ Exclusive subscriber deals         │
│                                         │
│  [Add New Subscription]                │
└─────────────────────────────────────────┘
```

## Profile Completion Gamification

### 11. Profile Progress

#### Completion Incentives
```
┌─────────────────────────────────────────┐
│  Complete Your Profile                 │
├─────────────────────────────────────────┤
│  85% Complete                         │
│  [████████████████░░░]                │
│                                         │
│  Complete these for 200 bonus points:  │
│  ✅ Add profile photo                  │
│  ✅ Verify email                       │
│  ✅ Add phone number                   │
│  ⭕ Add a pet profile (+50 pts)        │
│  ⭕ Enable 2FA (+100 pts)              │
│  ⭕ Add birthday (+50 pts)             │
│                                         │
│  [Complete Now]                        │
└─────────────────────────────────────────┘
```

## Mobile App Settings

### 12. App-Specific Settings

#### Mobile Preferences
```
┌─────────────────────────────────────────┐
│  Mobile App Settings                   │
├─────────────────────────────────────────┤
│  Biometric Login:                     │
│  Face ID: ✅ Enabled                   │
│  Touch ID: Not available              │
│                                         │
│  App Notifications:                    │
│  Badge Count: ✅ Show                  │
│  Sounds: ✅ Enabled                    │
│  Banners: ✅ Show                      │
│                                         │
│  Offline Mode:                         │
│  ☑ Save data for offline browsing     │
│  Cache size: 124 MB [Clear Cache]     │
│                                         │
│  Location Services:                    │
│  ○ Always ○ While Using ● Never       │
│                                         │
│  Camera Permissions:                   │
│  ✅ Allowed (for barcode scanning)     │
│                                         │
│  [Reset App Settings]                 │
└─────────────────────────────────────────┘
```

## API Endpoints

### Profile Management APIs
```
# User Information
GET    /api/users/profile
PUT    /api/users/profile
DELETE /api/users/account

# Addresses
GET    /api/users/addresses
POST   /api/users/addresses
PUT    /api/users/addresses/:id
DELETE /api/users/addresses/:id

# Payment Methods
GET    /api/users/payment-methods
POST   /api/users/payment-methods
PUT    /api/users/payment-methods/:id
DELETE /api/users/payment-methods/:id

# Pets
GET    /api/users/pets
POST   /api/users/pets
PUT    /api/users/pets/:id
DELETE /api/users/pets/:id

# Preferences
GET    /api/users/preferences
PUT    /api/users/preferences

# Security
POST   /api/users/change-password
POST   /api/users/enable-2fa
POST   /api/users/verify-2fa
GET    /api/users/sessions
DELETE /api/users/sessions/:id

# Loyalty
GET    /api/users/loyalty/points
GET    /api/users/loyalty/history
POST   /api/users/loyalty/redeem
```

## Data Validation

### Form Validation Rules
```javascript
const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    unique: true,
    verification: 'required'
  },
  phone: {
    pattern: /^\+?[\d\s\-\(\)]+$/,
    minLength: 10,
    format: 'international'
  },
  address: {
    validation: 'google_places_api',
    requiresAllFields: true,
    postalCodeValidation: true
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: true,
    preventCommon: true
  }
};
```

## Testing Scenarios

### Profile Management Tests
1. Update all profile fields
2. Add/edit/delete addresses
3. Payment method management
4. Pet profile creation
5. Preference updates
6. 2FA enable/disable
7. Password change flow
8. Email change verification
9. Data export request
10. Account deletion

## Future Enhancements

### Planned Features
- Social profile integration
- Voice profile updates
- AI-powered pet recommendations
- Household account sharing
- Subscription bundling
- Virtual pet health tracking
- Augmented reality pet sizing
- Blockchain identity verification