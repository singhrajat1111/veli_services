export interface LoginProjection {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
}

export interface LoginRequest {
  contactNumber: string;
  otp: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    contactNumber: string;
  };
}
