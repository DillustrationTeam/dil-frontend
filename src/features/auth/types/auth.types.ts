export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
  createdAt: string;
  // Cùng bộ field với `@/types/auth.types`.UserDto — /auth/login và /auth/me đều trả về.
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
}

export interface AuthResponseDto {
  user: UserDto;
  roles: string[];
  tokens: TokenDto;
}

export interface LoginRequest {
  email?: string;
  emailOrUsername?: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
}
