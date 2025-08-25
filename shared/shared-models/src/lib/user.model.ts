export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface InvoiceInfo {
  companyName: string;
  vatNumber: string;
}

export interface User {
  id: number;
  email: string;
  contactName: string;
  phone: string;
  role?: string;
  shippingAddress: Address;
  billingAddress: Address;
  invoiceInfo: InvoiceInfo;
}
