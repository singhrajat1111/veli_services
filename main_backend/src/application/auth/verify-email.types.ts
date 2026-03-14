export interface VerifyEmailInput {
  token: string;
}

export interface VerifyEmailResult {
  userId: string;
  accountStatus: "ACTIVE";
}
