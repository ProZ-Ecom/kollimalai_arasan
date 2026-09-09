export interface CustomerProfileResponse {
  id: string; // Customer profile UUID
  userId: string; // User UUID
  name: string | null;
  email: string | null;
  phone: string | null;
  isWhatsapp: boolean;
  whatsappNo: string | null;
  dob: string | null; // ISO YYYY-MM-DD string
  gender: "male" | "female" | "other" | null;
  profileImage: string | null;
  referralCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export * from "./customer-address.types";
export * from "./catalog.types";
export * from "./admin-customer.types";
