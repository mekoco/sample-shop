export interface IAddress {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isValid?: boolean;  // For address verification
}

export interface IShippingAddress extends IAddress {
  instructions?: string;  // Delivery instructions
}