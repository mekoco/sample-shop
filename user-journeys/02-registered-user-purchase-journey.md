# Registered User Purchase Journey

## Overview
This journey details the complete flow for existing users who have an account and are logged in while making a purchase. This path offers a streamlined experience with saved preferences, addresses, and payment methods.

## User Persona
- **Type**: Registered/Returning Customer
- **Motivation**: Convenience, loyalty rewards, order tracking
- **Pain Points**: Forgotten passwords, outdated saved information
- **Technical Comfort**: Medium to High
- **Purchase History**: Has made at least one previous purchase or created an account

## Journey Stages

### 1. Entry Point & Recognition
**User Action**: Arrives at PetSupplies Shop
- **Via**: Direct bookmark, email campaign, loyalty program link
- **Landing Page**: Homepage with personalized elements
- **Session Check**: 
  - Check for existing auth token/cookie
  - If valid session exists, auto-login
  - If expired, show login prompt
- **API Call**: `GET /api/auth/session`
- **Personalization**: Welcome message with user's name

### 2. Login Process
**User Action**: Logs into account
- **Page**: `/login` or modal overlay
- **Login Methods**:
  ```
  Standard Login:
  - Email/Username
  - Password
  
  Social Login:
  - Google OAuth
  - Facebook Login
  - Apple ID
  
  Passwordless:
  - Magic link via email
  - SMS OTP
  ```
- **API Call**: `POST /api/auth/login`
  ```json
  {
    "email": "user@example.com",
    "password": "hashedPassword"
  }
  ```
- **Response**: JWT token and user profile data
- **Session**: Token stored in httpOnly cookie

### 3. Personalized Dashboard
**User Action**: Views personalized homepage
- **API Calls**:
  - `GET /api/users/profile`
  - `GET /api/recommendations/:userId`
  - `GET /api/users/orders?limit=5`
- **Personalized Elements**:
  - Recommended products based on history
  - Recently viewed items
  - Wishlist items
  - Reorder suggestions
  - Loyalty points balance
  - Exclusive member deals

### 4. Product Browsing (Enhanced)
**User Action**: Explores products
- **Page**: `/products` with user context
- **API Call**: `GET /api/products?userId=123`
- **Enhanced Features**:
  - "Previously purchased" badges
  - Personalized sorting (relevance to user)
  - Saved filters from last session
  - Quick add from purchase history
  - Wishlist quick add button
- **Behavior Tracking**: Views logged for recommendations

### 5. Product Details (Personalized)
**User Action**: Views specific product
- **Page**: `/product/:productId`
- **API Calls**:
  - `GET /api/products/:id`
  - `GET /api/products/:id/user-history/:userId`
- **Personalized Information**:
  - "You last purchased this on [date]"
  - "You usually buy [quantity]"
  - Personal reviews/ratings if any
  - Friends who bought this (if social features enabled)
  - Complementary products based on history

### 6. Add to Cart (Streamlined)
**User Action**: Adds product to cart
- **Quick Actions**:
  - One-click add from history
  - Auto-suggest previous quantity
  - Subscribe & Save option
- **API Call**: `POST /api/cart/items`
  ```json
  {
    "productId": "123",
    "quantity": 2,
    "userId": "456",
    "subscription": false
  }
  ```
- **Cart Sync**: Cart synced across devices

### 7. Shopping Cart (Enhanced)
**User Action**: Reviews cart
- **Page**: `/cart`
- **API Call**: `GET /api/cart/:userId`
- **Enhanced Features**:
  - Saved for later items
  - Price drop alerts on cart items
  - Bulk actions (save all for later)
  - Loyalty points application
  - Personalized coupons auto-applied
  - Shipping threshold indicator
- **Cross-sell**: "Customers also bought" section

### 8. Express Checkout
**User Action**: Proceeds to checkout
- **Page**: `/checkout`
- **API Calls**:
  - `GET /api/users/addresses`
  - `GET /api/users/payment-methods`
  - `GET /api/loyalty/points/:userId`
- **Pre-filled Information**:
  ```
  Shipping Address:
  - Primary address selected
  - Alternative addresses dropdown
  - Recently used addresses
  
  Payment Method:
  - Saved cards (masked)
  - Default payment selected
  - Saved PayPal/wallet connections
  
  Contact Info:
  - Email (verified)
  - Phone (for delivery updates)
  ```

### 9. One-Page Checkout
**User Action**: Reviews and confirms order
- **Sections** (all on one page):
  1. **Delivery Address**
     - Select from saved addresses
     - Add new address option
     - Address validation API
  
  2. **Delivery Options**
     - Standard/Express/Same-day
     - Scheduled delivery
     - Delivery instructions
  
  3. **Payment Selection**
     - Saved payment methods
     - Add new payment option
     - Split payment option
     - Use loyalty points
  
  4. **Order Review**
     - Items with images
     - Gift options
     - Add note to seller

### 10. Loyalty & Rewards
**User Action**: Applies rewards
- **API Call**: `GET /api/loyalty/available-rewards/:userId`
- **Options**:
  - Apply points for discount
  - Use member coupons
  - Birthday discount auto-applied
  - Tier benefits (free shipping, etc.)
- **Display**: Points earned from this purchase

### 11. Order Placement
**User Action**: Confirms purchase
- **API Call**: `POST /api/orders`
  ```json
  {
    "userId": "456",
    "items": [...],
    "shippingAddressId": "789",
    "paymentMethodId": "321",
    "loyaltyPointsUsed": 500,
    "couponCodes": ["MEMBER10"]
  }
  ```
- **Processing**:
  - Payment authorization
  - Inventory reservation
  - Points deduction
  - Order confirmation generation

### 12. Order Confirmation (Enhanced)
**User Action**: Views confirmation
- **Page**: `/orders/:orderId`
- **Information Displayed**:
  - Order details with timeline
  - Loyalty points earned
  - Next tier progress
  - Subscription details (if applicable)
  - Social sharing options
- **Actions Available**:
  - Track order
  - Modify order (within time limit)
  - Add to calendar
  - Share with friends
  - Print invoice

### 13. Post-Purchase Experience
**User Journey Continues**:
- **Immediate**: 
  - Confirmation email with tracking
  - SMS notification option
  - App push notification
- **Ongoing**:
  - Shipping updates
  - Delivery confirmation
  - Review request
  - Replenishment reminder
  - Cross-sell emails

## Technical Flow Diagram

```
[Login Page] --> [Authenticated Session] --> [Personalized Homepage]
      |                    |                         |
      v                    v                         v
[Social Login]    [Remember Me]            [Recommendations]
      |                    |                         |
      └──────────┬─────────┘                        v
                 v                          [Product Browse]
         [User Dashboard]                         |
                 |                                v
                 v                          [Quick Reorder]
         [Purchase History]                      |
                 |                                v
                 └────────────────────> [Shopping Cart]
                                              |
                                              v
                                     [Express Checkout]
                                              |
                                              v
                                    [Saved Information]
                                              |
                                              v
                                     [Apply Rewards]
                                              |
                                              v
                                      [Place Order]
                                              |
                                              v
                                  [Order Management]
```

## User Account Features

### Profile Management
- **Personal Information**: Name, email, phone, birthday
- **Preferences**: Email frequency, categories of interest
- **Privacy Settings**: Data sharing, social features
- **Security**: Two-factor authentication, login history

### Saved Information
- **Addresses**: Home, work, gift addresses
- **Payment Methods**: Cards, wallets, bank accounts
- **Pets Profile**: Pet names, types, dietary needs
- **Wishlist**: Saved items for later

### Order Management
- **Order History**: Full purchase history
- **Tracking**: Real-time order tracking
- **Returns**: Initiate returns/exchanges
- **Reorder**: One-click reorder past purchases
- **Invoices**: Download tax invoices

### Loyalty Program
- **Points Balance**: Current points and history
- **Tier Status**: Current tier and benefits
- **Rewards Catalog**: Available rewards
- **Referral Program**: Share and earn

## Edge Cases & Error Handling

### Session Management
- **Scenario**: Session expires during checkout
- **Solution**: 
  - Save cart state
  - Smooth re-authentication
  - Resume from last step

### Payment Method Issues
- **Scenario**: Saved card expired
- **Solution**:
  - Proactive notification before expiry
  - Easy update flow
  - Alternative payment suggestions

### Address Validation
- **Scenario**: Saved address no longer valid
- **Solution**:
  - Real-time validation
  - Suggestion for corrections
  - Easy edit interface

### Inventory Issues
- **Scenario**: Saved item out of stock
- **Solution**:
  - Wishlist notification when back
  - Similar product recommendations
  - Pre-order option if available

### Account Security
- **Scenario**: Suspicious login attempt
- **Solution**:
  - Email/SMS alert
  - Require additional verification
  - Account recovery options

## Conversion Optimization

### Reducing Friction
1. **Single Sign-On**: Social login options
2. **Persistent Cart**: Across devices and sessions
3. **One-Click Purchase**: For frequent buyers
4. **Auto-fill Everything**: Leverage saved data
5. **Smart Defaults**: Pre-select likely choices

### Engagement Features
1. **Personalized Recommendations**: AI-driven suggestions
2. **Loyalty Rewards**: Points and tier benefits
3. **Subscribe & Save**: Recurring deliveries
4. **Early Access**: Member-only sales
5. **Birthday Rewards**: Special occasion offers

### Trust Building
1. **Purchase History**: Easy access to past orders
2. **Review System**: User reviews and ratings
3. **Customer Service**: Priority support for members
4. **Easy Returns**: Simplified return process
5. **Order Protection**: Purchase guarantees

## Metrics to Track

### Engagement Metrics
- **Login Frequency**: How often users return
- **Session Duration**: Time spent per visit
- **Pages per Session**: Engagement depth
- **Wishlist Usage**: Items saved vs. purchased
- **Recommendation CTR**: Click-through on suggestions

### Purchase Metrics
- **Repeat Purchase Rate**: Percentage who buy again
- **Average Order Value**: Compared to guests
- **Purchase Frequency**: Time between orders
- **Lifetime Value**: Total customer value
- **Cart Abandonment**: Lower than guest rate

### Loyalty Metrics
- **Points Redemption Rate**: Usage of rewards
- **Tier Progression**: Movement between tiers
- **Referral Rate**: Successful referrals
- **Review Submission**: Post-purchase reviews
- **Subscription Adoption**: Recurring orders

## Mobile App Integration

### App-Specific Features
- **Biometric Login**: Face ID/Touch ID
- **Push Notifications**: Order updates, deals
- **Barcode Scanner**: Quick product lookup
- **Location Services**: Nearest store/delivery
- **Offline Mode**: Browse cached content

### Cross-Platform Sync
- **Universal Cart**: Sync across all devices
- **Notification Preferences**: Centralized control
- **Order Tracking**: Real-time on all platforms
- **Wishlist Sync**: Available everywhere
- **Points Balance**: Always current

## Security & Privacy

### Account Protection
- **Two-Factor Authentication**: SMS/App-based
- **Login Alerts**: New device notifications
- **Password Requirements**: Strong password policy
- **Session Management**: Auto-logout options
- **Account Recovery**: Multiple verification methods

### Data Privacy
- **GDPR Compliance**: Data access/deletion rights
- **Consent Management**: Granular permissions
- **Data Encryption**: At rest and in transit
- **PCI Compliance**: Secure payment handling
- **Audit Trail**: User activity logging

## Testing Scenarios

### Functional Tests
1. **Login Methods**: All authentication types
2. **Session Persistence**: Across page refreshes
3. **Data Synchronization**: Multi-device testing
4. **Saved Information**: CRUD operations
5. **Loyalty Functions**: Points calculation/redemption

### User Experience Tests
1. **Personalization**: Recommendation accuracy
2. **Checkout Speed**: Time to complete
3. **Error Recovery**: Form validation/retry
4. **Mobile Experience**: App and web
5. **Performance**: Page load times

### Security Tests
1. **Authentication**: Invalid credentials
2. **Authorization**: Access control
3. **Session Hijacking**: Token security
4. **Data Validation**: Input sanitization
5. **Payment Security**: PCI compliance