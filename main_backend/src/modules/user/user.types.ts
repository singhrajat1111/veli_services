export type UserId = string;

export enum UserAccountStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
  Suspended = "SUSPENDED",
  PendingVerification = "PENDING_VERIFICATION",
}

export enum UserAuthProvider {
  Local = "LOCAL",
  Google = "GOOGLE",
  Apple = "APPLE",
}

export interface NewUserProps {
  firstName: string;
  lastName: string;
  email: string;
  termsConditionVersionAccepted: string;
  phoneNumber: string;
}

export interface ContactNumberProjection {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  accountStatus: string | null;
}
