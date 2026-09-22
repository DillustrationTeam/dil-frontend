export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
  createdAt: string;
}

export interface TokenDto {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface AuthResponseDto {
  user: UserDto;
  roles: string[];
  tokens: TokenDto;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  verificationTicket: string;
  role?: string;
}

export interface SendVerificationCodeRequest {
  email: string;
}

export interface ConfirmVerificationCodeRequest {
  email: string;
  code: string;
}

export interface ConfirmVerificationCodeResponse {
  verificationTicket: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}
