import { IAddress, IShippingAddress } from '../address.interface';

describe('IAddress Interface', () => {
  describe('Interface Structure', () => {
    it('should have all required properties', () => {
      // Test 1: Verify IAddress interface has all required properties
      // Expected properties:
      // - firstName: string
      // - lastName: string
      // - company?: string (optional)
      // - addressLine1: string
      // - addressLine2?: string (optional)
      // - city: string
      // - state: string
      // - postalCode: string
      // - country: string
      // - isValid?: boolean (optional, for address verification)
      
      const mockAddress: IAddress = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US'
      };
      
      expect(mockAddress.firstName).toBeDefined();
      expect(mockAddress.lastName).toBeDefined();
      expect(mockAddress.addressLine1).toBeDefined();
      expect(mockAddress.city).toBeDefined();
      expect(mockAddress.state).toBeDefined();
      expect(mockAddress.postalCode).toBeDefined();
      expect(mockAddress.country).toBeDefined();
    });

    it('should enforce correct property types', () => {
      // Test 2: Verify type safety for all properties
      
      const validAddress: IAddress = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        isValid: true
      };
      
      expect(typeof validAddress.firstName).toBe('string');
      expect(typeof validAddress.lastName).toBe('string');
      expect(typeof validAddress.addressLine1).toBe('string');
      expect(typeof validAddress.city).toBe('string');
      expect(typeof validAddress.state).toBe('string');
      expect(typeof validAddress.postalCode).toBe('string');
      expect(typeof validAddress.country).toBe('string');
      expect(typeof validAddress.isValid).toBe('boolean');
    });

    it('should allow optional fields', () => {
      // Test 3: Verify optional properties work correctly
      
      const minimalAddress: IAddress = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US'
        // Optional fields not included: company, addressLine2, isValid
      };
      
      const fullAddress: IAddress = {
        firstName: 'Jane',
        lastName: 'Smith',
        company: 'Acme Corp',
        addressLine1: '456 Business Ave',
        addressLine2: 'Suite 200',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
        isValid: true
      };
      
      expect(minimalAddress.company).toBeUndefined();
      expect(minimalAddress.addressLine2).toBeUndefined();
      expect(minimalAddress.isValid).toBeUndefined();
      expect(fullAddress.company).toBe('Acme Corp');
      expect(fullAddress.addressLine2).toBe('Suite 200');
      expect(fullAddress.isValid).toBe(true);
    });
  });

  describe('Personal Information', () => {
    it('should store first and last name', () => {
      // Test 4: Verify name fields
      
      const address: IAddress = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US'
      };
      
      expect(address.firstName).toBe('John');
      expect(address.lastName).toBe('Doe');
    });

    it('should optionally store company name', () => {
      // Test 5: Verify company field is optional
      
      const personalAddress: IAddress = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Home St',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'US'
        // No company field for personal address
      };
      
      const businessAddress: IAddress = {
        firstName: 'Jane',
        lastName: 'Smith',
        company: 'Tech Solutions Inc',
        addressLine1: '789 Corporate Blvd',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94101',
        country: 'US'
      };
      
      expect(personalAddress.company).toBeUndefined();
      expect(businessAddress.company).toBe('Tech Solutions Inc');
    });
  });

  describe('Address Lines', () => {
    it('should require addressLine1', () => {
      // Test 6: Verify addressLine1 is required
      
      const address: IAddress = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St', // Required
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'US'
      };
      
      expect(address.addressLine1).toBeDefined();
      expect(address.addressLine1).not.toBe('');
      expect(address.addressLine1).toBe('123 Main St');
    });

    it('should optionally support addressLine2', () => {
      // Test 7: Verify addressLine2 is optional
      
      const houseAddress: IAddress = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'US'
        // No addressLine2 needed
      };
      
      const apartmentAddress: IAddress = {
        firstName: 'Jane',
        lastName: 'Smith',
        addressLine1: '456 Oak Ave',
        addressLine2: 'Apartment 3B',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'US'
      };
      
      expect(houseAddress.addressLine2).toBeUndefined();
      expect(apartmentAddress.addressLine2).toBe('Apartment 3B');
    });
  });

  describe('Location Fields', () => {
    it('should store city, state, and postal code', () => {
      // Test 8: Verify location fields
      
      const address: IAddress = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'Miami',
        state: 'FL',
        postalCode: '33101',
        country: 'US'
      };
      
      expect(address.city).toBe('Miami');
      expect(address.state).toBe('FL');
      expect(address.postalCode).toBe('33101');
    });

    it('should support international addresses', () => {
      // Test 9: Verify international address support
      
      const usAddress: IAddress = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US'
      };
      
      const ukAddress: IAddress = {
        firstName: 'James',
        lastName: 'Smith',
        addressLine1: '10 Downing Street',
        city: 'London',
        state: 'England',
        postalCode: 'SW1A 2AA',
        country: 'UK'
      };
      
      const canadaAddress: IAddress = {
        firstName: 'Marie',
        lastName: 'Tremblay',
        addressLine1: '123 Maple Ave',
        city: 'Toronto',
        state: 'ON',
        postalCode: 'M5H 2N2',
        country: 'CA'
      };
      
      expect(usAddress.country).toBe('US');
      expect(ukAddress.country).toBe('UK');
      expect(canadaAddress.country).toBe('CA');
      expect(ukAddress.postalCode).toBe('SW1A 2AA');
      expect(canadaAddress.postalCode).toBe('M5H 2N2');
    });
  });

  describe('Address Validation', () => {
    it('should support address verification flag', () => {
      // Test 10: Verify isValid flag for address verification
      
      const unverifiedAddress: IAddress = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'US'
        // isValid not set (unverified)
      };
      
      const verifiedAddress: IAddress = {
        firstName: 'Jane',
        lastName: 'Smith',
        addressLine1: '456 Verified Rd',
        city: 'Dallas',
        state: 'TX',
        postalCode: '75201',
        country: 'US',
        isValid: true
      };
      
      const invalidAddress: IAddress = {
        firstName: 'Bob',
        lastName: 'Jones',
        addressLine1: '789 Fake St',
        city: 'Houston',
        state: 'TX',
        postalCode: '77001',
        country: 'US',
        isValid: false
      };
      
      expect(unverifiedAddress.isValid).toBeUndefined();
      expect(verifiedAddress.isValid).toBe(true);
      expect(invalidAddress.isValid).toBe(false);
    });
  });
});

describe('IShippingAddress Interface', () => {
  describe('Interface Extension', () => {
    it('should extend IAddress interface', () => {
      // Test 1: Verify IShippingAddress extends IAddress
      // Should have all IAddress properties plus additional shipping-specific ones
      
      const shippingAddress: IShippingAddress = {
        // All IAddress properties
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'Phoenix',
        state: 'AZ',
        postalCode: '85001',
        country: 'US',
        // Additional shipping properties
        instructions: 'Leave package at back door'
      };
      
      // Should have all base address properties
      expect(shippingAddress.firstName).toBeDefined();
      expect(shippingAddress.lastName).toBeDefined();
      expect(shippingAddress.addressLine1).toBeDefined();
      expect(shippingAddress.instructions).toBeDefined();
      expect(shippingAddress.instructions).toBe('Leave package at back door');
    });
  });

  describe('Delivery Instructions', () => {
    it('should optionally support delivery instructions', () => {
      // Test 2: Verify instructions field is optional
      
      const shippingWithoutInstructions: IShippingAddress = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'Denver',
        state: 'CO',
        postalCode: '80201',
        country: 'US'
        // No special instructions
      };
      
      const shippingWithInstructions: IShippingAddress = {
        firstName: 'Jane',
        lastName: 'Smith',
        addressLine1: '456 Oak Ave',
        addressLine2: 'Apt 5C',
        city: 'Boulder',
        state: 'CO',
        postalCode: '80301',
        country: 'US',
        instructions: 'Ring doorbell twice. If no answer, leave with neighbor at 5D.'
      };
      
      expect(shippingWithoutInstructions.instructions).toBeUndefined();
      expect(shippingWithInstructions.instructions).toContain('doorbell');
    });

    it('should support various delivery instruction types', () => {
      // Test 3: Verify instructions can handle various scenarios
      
      const gateCodeInstructions: IShippingAddress = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '789 Gated Community',
        city: 'Las Vegas',
        state: 'NV',
        postalCode: '89101',
        country: 'US',
        instructions: 'Gate code: #1234. Building B, Unit 10'
      };
      
      const businessHoursInstructions: IShippingAddress = {
        firstName: 'Business',
        lastName: 'Owner',
        company: 'Local Shop',
        addressLine1: '321 Commerce St',
        city: 'Reno',
        state: 'NV',
        postalCode: '89501',
        country: 'US',
        instructions: 'Deliver between 9 AM - 5 PM on weekdays only'
      };
      
      const secureDeliveryInstructions: IShippingAddress = {
        firstName: 'Security',
        lastName: 'Conscious',
        addressLine1: '555 Safe Ave',
        city: 'Sacramento',
        state: 'CA',
        postalCode: '94203',
        country: 'US',
        instructions: 'Signature required. Do not leave unattended.'
      };
      
      expect(gateCodeInstructions.instructions).toContain('Gate code');
      expect(businessHoursInstructions.instructions).toContain('weekdays');
      expect(secureDeliveryInstructions.instructions).toContain('Signature required');
    });
  });

  describe('Type Compatibility', () => {
    it('should be assignable to IAddress type', () => {
      // Test 4: Verify IShippingAddress is compatible with IAddress
      // This ensures shipping addresses can be used wherever addresses are expected
      
      const shippingAddress: IShippingAddress = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'Atlanta',
        state: 'GA',
        postalCode: '30301',
        country: 'US',
        instructions: 'Handle with care'
      };
      
      // Should be assignable to IAddress
      const address: IAddress = shippingAddress;
      expect(address.firstName).toBe('John');
      expect(address.lastName).toBe('Doe');
      expect(address.addressLine1).toBe('123 Main St');
      
      // But IAddress should not necessarily be assignable to IShippingAddress
      // unless it has the instructions property
    });
  });
});