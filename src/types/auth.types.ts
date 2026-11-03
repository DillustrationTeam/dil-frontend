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
  emailOrUsername: string;
  password: string;
}

export interface TwoFactorRequiredDto {
  requiresTwoFactor: true;
  twoFactorTicket: string;
  email: string;
}

export interface GoogleRegistrationRequiredDto {
  requiresRegistration: true;
  registrationTicket: string;
  suggestedEmail: string;
  suggestedFullName: string | null;
}

export interface PasswordSetupRequiredDto {
  requiresPasswordSetup: true;
  passwordSetupTicket: string;
  email: string;
  fullName: string | null;
}

export type LoginResult =
  | AuthResponseDto
  | TwoFactorRequiredDto
  | GoogleRegistrationRequiredDto
  | PasswordSetupRequiredDto;

export function isTwoFactorRequired(result: LoginResult): result is TwoFactorRequiredDto {
  return (result as TwoFactorRequiredDto).requiresTwoFactor === true;
}

export function isGoogleRegistrationRequired(result: LoginResult): result is GoogleRegistrationRequiredDto {
  return (result as GoogleRegistrationRequiredDto).requiresRegistration === true;
}

export function isPasswordSetupRequired(result: LoginResult): result is PasswordSetupRequiredDto {
  return (result as PasswordSetupRequiredDto).requiresPasswordSetup === true;
}

export interface CompleteGoogleRegistrationRequest {
  registrationTicket: string;
  username: string;
  password: string;
}

export interface CompleteAccountPasswordSetupRequest {
  email: string;
  setupTicket: string;
  username: string;
  password: string;
}

export interface VerifyTwoFactorLoginRequest {
  email: string;
  twoFactorTicket: string;
  code: string;
}

export type VerifyTwoFactorLoginResult = AuthResponseDto | PasswordSetupRequiredDto;

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
