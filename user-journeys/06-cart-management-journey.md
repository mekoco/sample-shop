# Cart Management Journey

## Overview
This journey details all interactions users have with their shopping cart, from adding the first item to proceeding to checkout or abandoning. The cart is a critical conversion point where users make final decisions about their purchases.

## User Types & Cart Behavior
- **Decisive Shopper**: Quick add and checkout
- **Comparison Shopper**: Multiple add/remove cycles
- **Budget-Conscious**: Careful price monitoring
- **Bulk Buyer**: Large quantities, multiple items
- **Window Shopper**: Cart as wishlist
- **Abandoned Cart User**: Returns later to complete

## Cart Lifecycle Stages

### 1. Cart Initialization

#### First Item Addition
**Trigger Points**:
- Product page "Add to Cart" button
- Quick add from listing page
- Reorder from history
- Voice/chat commerce add
- Barcode scan add

**Cart Creation Logic**:
```javascript
// Guest User
if (!user.isAuthenticated) {
  sessionId = generateSessionId();
  createGuestCart(sessionId);
  setCookie('cart_session', sessionId, { expires: 7 days });
}

// Authenticated User
if (user.isAuthenticated) {
  cart = getUserCart(userId) || createUserCart(userId);
  mergeGuestCart(sessionId, userId); // If switching from guest
}
```

**API Call**: `POST /api/cart/items`
```json
{
  "productId": "SKU-12345",
  "quantity": 1,
  "variantId": "size-medium",
  "sessionId": "guest-xyz" || "userId": "123"
}
```

### 2. Cart States & Persistence

#### Cart Storage Architecture
```
┌─────────────────────────────────────────┐
│           Cart State Manager            │
├─────────────────────────────────────────┤
│  Guest Cart:                            │
│  • Session Cookie (7 days)              │
│  • Redis Cache (sessionId:cart)         │
│  • Local Storage (backup)               │
│                                         │
│  User Cart:                            │
│  • Database (persistent)                │
│  • Redis Cache (userId:cart)            │
│  • Cross-device sync                   │
└─────────────────────────────────────────┘
```

#### State Synchronization
- **Real-time Updates**: WebSocket for multi-tab sync
- **Conflict Resolution**: Last-write-wins strategy
- **Offline Support**: Queue operations for sync

### 3. Cart Interface Types

#### Mini Cart (Dropdown/Slide-out)
```
┌─────────────────────────────────────────┐
│  Shopping Cart (3 items)           [X] │
├─────────────────────────────────────────┤
│  Dog Food Premium 15lb                  │
│  $34.99 × 2                [-][2][+] 🗑️│
│                                         │
│  Cat Litter Natural 20lb                │
│  $19.99 × 1                [-][1][+] 🗑️│
│                                         │
│  Pet Treats Variety Pack                │
│  $12.99 × 3                [-][3][+] 🗑️│
├─────────────────────────────────────────┤
│  Subtotal:                    $107.95  │
│  Shipping:              Calculate at   │
│                         checkout       │
├─────────────────────────────────────────┤
│  [View Cart]  [Checkout →]             │
└─────────────────────────────────────────┘
```

#### Full Cart Page
```
┌─────────────────────────────────────────┐
│  Shopping Cart                          │
├─────────────────────────────────────────┤
│  ┌──────┬────────────────┬──────┬─────┐│
│  │ Item │ Details        │ Qty  │Price││
│  ├──────┼────────────────┼──────┼─────┤│
│  │ [img]│ Product Name   │ [-] 2│$70  ││
│  │      │ Size: Large    │ [+]  │     ││
│  │      │ Color: Blue    │      │     ││
│  │      │ [Remove][Save] │      │     ││
│  └──────┴────────────────┴──────┴─────┘│
├─────────────────────────────────────────┤
│  Apply Coupon: [________] [Apply]      │
├─────────────────────────────────────────┤
│  Order Summary:                        │
│  Subtotal:              $107.95       │
│  Discount:               -$10.00      │
│  Est. Tax:                $8.64       │
│  Shipping:          [Calculate]       │
│  ─────────────────────────────────     │
│  Total:                 $106.59       │
│                                        │
│  [Continue Shopping]  [Checkout →]     │
└─────────────────────────────────────────┘
```

### 4. Cart Operations

#### Add to Cart Variations
**Single Product Add**:
- Standard add with quantity
- Quick add (quantity = 1)
- Add with options/variants
- Add from wishlist
- Subscribe & Save add

**Bulk Operations**:
- Add multiple items
- Import shopping list
- Reorder entire order
- Add bundle/kit

**API Patterns**:
```javascript
// Single item
POST /api/cart/items
{ productId, quantity, options }

// Multiple items
POST /api/cart/items/bulk
{ items: [{ productId, quantity }] }

// Bundle
POST /api/cart/bundles
{ bundleId, customizations }
```

#### Quantity Management
**Update Mechanisms**:
- Plus/minus buttons
- Direct input field
- Dropdown selector
- Slider (for bulk)

**Validation Rules**:
```javascript
validateQuantity(product, requestedQty) {
  // Stock check
  if (requestedQty > product.stock) {
    return { valid: false, max: product.stock };
  }
  
  // Purchase limits
  if (requestedQty > product.maxPerOrder) {
    return { valid: false, max: product.maxPerOrder };
  }
  
  // Minimum quantity
  if (requestedQty < product.minQuantity) {
    return { valid: false, min: product.minQuantity };
  }
  
  return { valid: true };
}
```

#### Item Removal
**Removal Options**:
- Remove single item
- Clear entire cart
- Move to wishlist
- Save for later

**Confirmation UX**:
- Inline confirmation
- Undo option (5 seconds)
- Toast notification
- No confirmation (with undo)

### 5. Cart Features & Functionality

#### Save for Later
```
┌─────────────────────────────────────────┐
│  Saved for Later (5 items)             │
├─────────────────────────────────────────┤
│  • Dog Bed Luxury         $89.99       │
│    [Move to Cart] [Remove]             │
│  • Cat Tree Tower         $129.99      │
│    Out of Stock - [Notify Me]          │
└─────────────────────────────────────────┘
```

#### Price & Stock Monitoring
**Real-time Updates**:
```javascript
// Price change detection
cartItems.forEach(item => {
  currentPrice = getProductPrice(item.productId);
  if (currentPrice !== item.addedPrice) {
    showPriceAlert(item, currentPrice - item.addedPrice);
  }
});

// Stock monitoring
checkStockAvailability(cartItems).then(results => {
  results.unavailable.forEach(item => {
    markAsUnavailable(item);
    suggestAlternatives(item);
  });
});
```

#### Shipping Calculator
**Inline Shipping Estimate**:
```
Estimate Shipping:
ZIP Code: [_____] [Calculate]

Shipping Options:
○ Standard (5-7 days): $5.99
○ Express (2-3 days): $15.99
○ Next Day: $29.99
```

### 6. Promotional Features

#### Coupon/Promo Code System
**Application Flow**:
1. Enter code in input field
2. Validate via API
3. Apply discount to eligible items
4. Show savings breakdown
5. Stack rules enforcement

**API Call**: `POST /api/cart/coupons`
```json
{
  "cartId": "cart-123",
  "couponCode": "SAVE20",
  "userId": "user-456"
}
```

**Validation Response**:
```json
{
  "valid": true,
  "discount": {
    "type": "percentage",
    "value": 20,
    "appliedTo": ["item-1", "item-3"],
    "savings": 21.58
  },
  "message": "Coupon applied successfully!"
}
```

#### Automatic Promotions
- Buy One Get One (BOGO)
- Volume discounts
- Bundle pricing
- Free shipping threshold
- Member exclusive pricing

### 7. Cart Recovery Mechanisms

#### Abandonment Prevention
**Exit Intent Detection**:
```javascript
// Mouse leave detection
document.addEventListener('mouseleave', (e) => {
  if (e.clientY <= 0 && cart.hasItems) {
    showExitModal({
      title: "Wait! Don't leave yet",
      offer: "Get 10% off your order",
      cta: "Apply Discount"
    });
  }
});
```

#### Persistent Cart Strategies
**Guest Users**:
- 7-day cookie persistence
- Email capture for recovery
- Browser notification API
- Local storage backup

**Registered Users**:
- Permanent cart storage
- Email reminders
- Push notifications
- Cross-device access

### 8. Cart Recovery Campaigns

#### Email Recovery Sequence
```
Hour 1: "You left something behind"
- Show cart items
- Direct cart link

Hour 24: "Still thinking it over?"
- 10% discount offer
- Customer reviews
- Limited time urgency

Day 3: "Last chance to save"
- 15% discount
- Stock warnings
- Expire in 24 hours

Day 7: "We miss you"
- Different products
- Category suggestions
```

#### Recovery Landing Page
```
┌─────────────────────────────────────────┐
│  Welcome Back!                         │
│  Your cart is waiting for you          │
├─────────────────────────────────────────┤
│  Your Items (may have price changes):  │
│                                         │
│  ✓ Dog Food 15lb - $34.99 (same)       │
│  ⚠ Cat Litter - $22.99 (was $19.99)    │
│  ✗ Pet Toy - Out of Stock              │
│    [View Alternatives]                 │
├─────────────────────────────────────────┤
│  Special Offer: RETURN10 for 10% off   │
│  [Continue to Checkout]                │
└─────────────────────────────────────────┘
```

## Cart Analytics & Optimization

### 9. Performance Metrics

#### Cart Metrics Dashboard
```javascript
const cartMetrics = {
  // Engagement
  addToCartRate: "12.3%",        // Views → Add
  cartViewRate: "67.8%",         // Add → View Cart
  cartUpdateRate: "34.5%",       // Modify quantity
  
  // Conversion
  cartAbandonmentRate: "68.2%",  // Not completed
  checkoutInitiationRate: "31.8%", // Cart → Checkout
  cartConversionRate: "28.4%",   // Cart → Purchase
  
  // Value
  averageCartValue: "$87.43",
  averageItemsPerCart: 3.2,
  couponUsageRate: "23.4%",
  
  // Recovery
  recoveryEmailSentRate: "100%",
  recoveryClickRate: "18.2%",
  recoveryConversionRate: "5.7%"
};
```

### 10. A/B Testing Opportunities

#### Cart UI Tests
- **Sticky cart summary**: Fixed vs scrolling
- **Update behavior**: Auto-save vs manual
- **Remove confirmation**: Modal vs inline
- **Mobile layout**: Full page vs drawer
- **Quantity selector**: Buttons vs dropdown

#### Promotional Tests
- **Free shipping**: Threshold amounts
- **Discount display**: Percentage vs dollar
- **Urgency messages**: Stock vs time
- **Cross-sell placement**: In cart vs separate
- **Coupon field**: Prominent vs collapsed

## Technical Implementation

### Cart State Management
```javascript
// Redux/Context state structure
const cartState = {
  items: [
    {
      id: 'item-1',
      productId: 'SKU-123',
      quantity: 2,
      price: 34.99,
      addedAt: '2024-01-15T10:30:00Z',
      options: { size: 'L', color: 'blue' }
    }
  ],
  coupons: ['SAVE10'],
  giftMessage: '',
  subtotal: 107.95,
  discount: 10.00,
  tax: 8.64,
  shipping: null,
  total: 106.59,
  lastUpdated: '2024-01-15T10:35:00Z',
  expiresAt: '2024-01-22T10:30:00Z'
};
```

### API Endpoints
```
# Cart Operations
GET    /api/cart              # Get current cart
POST   /api/cart/items        # Add item
PUT    /api/cart/items/:id    # Update quantity
DELETE /api/cart/items/:id    # Remove item
DELETE /api/cart              # Clear cart
POST   /api/cart/merge        # Merge guest→user

# Cart Features
POST   /api/cart/save-for-later/:itemId
POST   /api/cart/move-to-cart/:itemId
POST   /api/cart/coupons
DELETE /api/cart/coupons/:code
GET    /api/cart/shipping-estimate
POST   /api/cart/validate     # Pre-checkout validation
```

## Mobile Cart Optimization

### Mobile-Specific Features
- **Swipe to remove**: Gesture support
- **Bottom sheet cart**: Slide-up interface
- **Thumb-friendly controls**: Bottom placement
- **Simplified view**: Essential info only
- **One-thumb operation**: Reachable controls

### Progressive Web App Features
- **Offline cart**: Local storage sync
- **Add to home screen**: Quick access
- **Push notifications**: Abandonment recovery
- **Background sync**: Update when online

## Accessibility Considerations

### Cart Accessibility
- **Screen reader announcements**: Item updates
- **Keyboard navigation**: Full functionality
- **Focus management**: Logical flow
- **ARIA labels**: Clear descriptions
- **Error announcements**: Validation feedback

## Security & Validation

### Cart Security Measures
```javascript
// CSRF protection
validateCSRFToken(request.token);

// Rate limiting
rateLimiter.check(userId, 'cart_update', {
  maxRequests: 30,
  window: '1m'
});

// Input validation
validateCartItem({
  productId: sanitize(productId),
  quantity: parseInt(quantity, 10),
  maxQuantity: 99,
  minQuantity: 1
});

// Price verification
verifyPriceIntegrity(cartItems);
```

## Edge Cases & Error Handling

### Common Edge Cases
1. **Product discontinued**: While in cart
2. **Price changes**: During session
3. **Stock depletion**: Before checkout
4. **Coupon expiration**: While applied
5. **Session timeout**: During editing
6. **Payment limits**: Cart too expensive
7. **Shipping restrictions**: Location issues
8. **Browser issues**: Storage disabled

### Error Recovery
- **Auto-save drafts**: Prevent data loss
- **Graceful degradation**: Fallback options
- **Clear messaging**: User guidance
- **Alternative actions**: Suggested solutions
- **Support integration**: Easy help access

## Future Enhancements

### Advanced Cart Features
- **Smart bundling**: AI-suggested bundles
- **Price tracking**: Historical price data
- **Group carts**: Shared family carts
- **Subscription management**: In-cart setup
- **AR preview**: See products in space
- **Voice editing**: "Remove dog food"
- **Social sharing**: Share cart for advice
- **Budget tracker**: Spending limits