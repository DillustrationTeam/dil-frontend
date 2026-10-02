export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
  createdAt: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  socialLinks?: string[];
}

export interface TokenDto {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  sessionId: string;
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

export interface TwoFactorRequiredDto {
  requiresTwoFactor: true;
  twoFactorTicket: string;
  email: string;
}

export type LoginResult = AuthResponseDto | TwoFactorRequiredDto;

export function isTwoFactorRequired(result: LoginResult): result is TwoFactorRequiredDto {
  return (result as TwoFactorRequiredDto).requiresTwoFactor === true;
}

export interface VerifyTwoFactorLoginRequest {
  email: string;
  twoFactorTicket: string;
  code: string;
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
