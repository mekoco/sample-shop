# Guest Checkout Journey

## Overview
This journey maps the complete flow of a customer who makes a purchase without creating an account or logging in. This is a critical path as it reduces friction for first-time buyers and impulse purchases.

## User Persona
- **Type**: Guest User
- **Motivation**: Quick purchase without commitment
- **Pain Points**: Doesn't want to create an account, values privacy, wants fast checkout
- **Technical Comfort**: Low to Medium

## Journey Stages

### 1. Entry Point
**User Action**: Arrives at PetSupplies Shop
- **Via**: Direct URL, search engine, social media ad, or referral link
- **Landing Page**: Homepage or specific product page
- **Session**: New session initiated with unique sessionId
- **API Call**: None initially
- **Storage**: Session cookie created

### 2. Product Discovery
**User Action**: Browses product catalog
- **Page**: `/products` or `/category/:categoryName`
- **API Calls**: 
  - `GET /api/products` - Fetch all products
  - `GET /api/categories` - Load category list
- **User Behavior**: 
  - Scrolls through product grid
  - May use filters (price, category)
  - Clicks on interesting products
- **Session State**: Browsing history tracked in session

### 3. Product Evaluation
**User Action**: Views product details
- **Page**: `/product/:productId`
- **API Call**: `GET /api/products/:id`
- **Information Displayed**:
  - Product name and description
  - Price and availability
  - Product images
  - Specifications
- **Decision Points**:
  - Add to cart
  - Continue browsing
  - Leave site

### 4. Add to Cart
**User Action**: Clicks "Add to Cart" button
- **API Call**: `POST /api/cart/items`
  ```json
  {
    "productId": "123",
    "quantity": 1,
    "sessionId": "guest-session-xyz"
  }
  ```
- **Response**: Cart updated with item
- **UI Feedback**: 
  - Cart icon updates with item count
  - Success notification shown
  - Mini cart preview may appear
- **Storage**: Cart data stored in Redis with sessionId key

### 5. Cart Review
**User Action**: Views shopping cart
- **Page**: `/cart`
- **API Call**: `GET /api/cart`
- **Cart Operations**:
  - Update quantities: `PUT /api/cart/items/:id`
  - Remove items: `DELETE /api/cart/items/:id`
  - Apply coupon codes (if available)
- **Information Displayed**:
  - Item list with prices
  - Subtotal calculation
  - Estimated shipping
  - Total amount

### 6. Proceed to Checkout
**User Action**: Clicks "Checkout" button
- **Page**: `/checkout`
- **Session Check**: System identifies user as guest
- **Options Presented**:
  - Continue as guest
  - Create account for faster checkout
  - Login if existing customer

### 7. Guest Information Collection
**User Action**: Fills checkout form
- **Required Information**:
  ```
  Personal Details:
  - Email address (for order confirmation)
  - First name
  - Last name
  - Phone number
  
  Shipping Address:
  - Street address
  - City
  - State/Province
  - ZIP/Postal code
  - Country
  
  Billing Address:
  - Same as shipping (checkbox)
  - Or separate billing details
  ```
- **Validation**: Real-time field validation
- **API Call**: None yet (data collected client-side)

### 8. Shipping Method Selection
**User Action**: Chooses shipping option
- **API Call**: `GET /api/shipping/options`
- **Options**:
  - Standard shipping (5-7 days)
  - Express shipping (2-3 days)
  - Next day delivery
- **Cart Update**: Shipping cost added to total

### 9. Payment Information
**User Action**: Enters payment details
- **Payment Methods**:
  - Credit/Debit card
  - PayPal (redirect flow)
  - Apple Pay/Google Pay
- **Security**: 
  - SSL/TLS encryption
  - PCI compliance
  - No card data stored for guests
- **Validation**: Card number, expiry, CVV checks

### 10. Order Review
**User Action**: Reviews complete order
- **Page Section**: Order summary
- **Information Displayed**:
  - Items with quantities
  - Shipping address
  - Billing information (masked)
  - Total cost breakdown
- **Final Actions**:
  - Edit any section
  - Apply promo code
  - Proceed with order

### 11. Order Submission
**User Action**: Clicks "Place Order"
- **API Call**: `POST /api/orders`
  ```json
  {
    "items": [...],
    "shippingAddress": {...},
    "billingAddress": {...},
    "paymentMethod": {...},
    "email": "customer@email.com",
    "sessionId": "guest-session-xyz"
  }
  ```
- **Payment Processing**: 
  - Payment gateway integration
  - Authorization and capture
- **Response**: Order confirmation with order ID

### 12. Order Confirmation
**User Action**: Views confirmation page
- **Page**: `/order/confirmation/:orderId`
- **Information Displayed**:
  - Order number
  - Estimated delivery date
  - Order summary
  - Total paid
- **Email Sent**: Confirmation email to provided address
- **Options**:
  - Print receipt
  - Create account to track order
  - Continue shopping

### 13. Post-Purchase (Optional)
**User Action**: Receives follow-up communications
- **Email Sequence**:
  1. Immediate: Order confirmation
  2. Day 1: Shipping notification with tracking
  3. Day of delivery: Delivery confirmation
  4. Day 7: Review request
  5. Day 14: Account creation incentive

## Technical Flow Diagram

```
[Homepage] --> [Product Catalog] --> [Product Details]
     |              |                      |
     v              v                      v
[Search] -----> [Filtered View] -----> [Add to Cart]
                                           |
                                           v
                                    [Shopping Cart]
                                           |
                                           v
                                    [Checkout Page]
                                           |
                                           v
                                  [Guest Information]
                                           |
                                           v
                                  [Shipping Selection]
                                           |
                                           v
                                   [Payment Details]
                                           |
                                           v
                                    [Order Review]
                                           |
                                           v
                                   [Place Order]
                                           |
                                           v
                                 [Order Confirmation]
```

## Edge Cases & Error Handling

### Cart Persistence
- **Scenario**: Guest closes browser and returns
- **Solution**: Cart persists for 7 days via session cookie
- **API**: Cart retrieved using sessionId

### Out of Stock
- **Scenario**: Item becomes unavailable during checkout
- **Solution**: 
  - Real-time stock check at checkout
  - Alert user and offer alternatives
  - Update cart automatically

### Payment Failure
- **Scenario**: Card declined or payment error
- **Solution**:
  - Clear error message
  - Preserve all form data
  - Suggest alternative payment methods
  - Cart remains intact

### Session Timeout
- **Scenario**: Guest takes too long at checkout
- **Solution**:
  - 30-minute session timeout warning
  - Auto-save form progress
  - Easy cart recovery via email

### Email Typo
- **Scenario**: Guest enters wrong email
- **Solution**:
  - Email validation and suggestions
  - Confirmation email preview
  - Order lookup by order ID + ZIP code

## Conversion Optimization Points

1. **Reduce Form Fields**: Only collect essential information
2. **Progress Indicator**: Show checkout steps clearly
3. **Trust Badges**: Display security certifications
4. **Guest Option Prominent**: Don't force registration
5. **Auto-fill Support**: Enable browser auto-complete
6. **Mobile Optimization**: Responsive design for all devices
7. **Loading States**: Clear feedback during API calls
8. **Error Recovery**: Preserve user input on errors

## Metrics to Track

- **Cart Abandonment Rate**: Where guests drop off
- **Checkout Completion Time**: Average time to complete
- **Form Error Rate**: Which fields cause issues
- **Payment Success Rate**: Payment method performance
- **Guest vs. Account Ratio**: Preference for guest checkout
- **Return Visitor Conversion**: Guests who return and buy

## Security Considerations

1. **Session Security**:
   - Secure session cookies (httpOnly, secure flags)
   - Session rotation after checkout
   - Rate limiting on cart operations

2. **Data Protection**:
   - No storage of guest personal data beyond order
   - PCI compliance for payment handling
   - Email address hashing for privacy

3. **Fraud Prevention**:
   - Velocity checks on guest orders
   - Address verification (AVS)
   - CVV verification
   - IP geolocation checks

## Mobile Considerations

- **Responsive Design**: Full functionality on mobile
- **Touch Optimization**: Large tap targets
- **Mobile Payments**: Apple Pay, Google Pay integration
- **Simplified Forms**: Mobile-friendly input types
- **Performance**: Optimized images and lazy loading

## Accessibility Requirements

- **Keyboard Navigation**: Full checkout via keyboard
- **Screen Reader**: Proper ARIA labels
- **Color Contrast**: WCAG 2.1 AA compliance
- **Error Messages**: Clear and descriptive
- **Focus Management**: Logical tab order

## Testing Scenarios

1. **Happy Path**: Complete purchase without issues
2. **Multiple Items**: Various products in cart
3. **Coupon Application**: Valid and invalid codes
4. **Address Validation**: Various formats
5. **Payment Methods**: All supported types
6. **Stock Changes**: During checkout process
7. **Network Issues**: Slow or interrupted connection
8. **Browser Compatibility**: All major browsers
9. **Session Recovery**: Browser crash/close
10. **International Orders**: Different countries/currencies