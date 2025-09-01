/**
 * 認証システム専用型定義
 * タスク管理くん - セキュアログイン機能
 */

import type { User } from './index';

// ============================================
// 認証関連の型定義
// ============================================

// ログイン認証情報
export interface AuthCredentials {
  email: string;    // メールアドレスまたはユーザーID
  password: string; // パスワード
  rememberMe?: boolean;
}

// 認証結果
export interface AuthResult {
  success: boolean;
  data?: {
    user: User;
    sessionToken: string;
    expiresAt: Date;
  };
  error?: AuthError;
}

// 認証エラー
export interface AuthError {
  code: 'INVALID_CREDENTIALS' | 'USER_NOT_FOUND' | 'USER_INACTIVE' | 'SESSION_EXPIRED' | 'AUTHENTICATION_ERROR' | 'PERMISSION_DENIED';
  message: string;
  timestamp: Date;
}

// 認証状態
export interface AuthState {
  isAuthenticated: boolean;
  user: User;
  sessionToken?: string;
  loginTime: Date;
  lastActivity: Date;
  sessionId?: string;
}

// ログインフォーム状態
export interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
  isLoading: boolean;
  error: string | null;
  showPassword: boolean;
}

// ユーザー登録フォーム
export interface UserRegistrationForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: User['role'];
  department?: string;
  position?: string;
  teamIds?: string[];
  primaryTeamId?: string;
}

// ============================================
// セッション管理
// ============================================

// セッション情報
export interface SessionInfo {
  userId: string;
  sessionToken: string;
  loginTime: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

// セッション検証結果
export interface SessionVerification {
  valid: boolean;
  expired?: boolean;
  userId?: string;
  error?: string;
}

// ============================================
// 権限管理
// ============================================

// 権限定義
export interface Permission {
  feature: string;
  requiredRole: User['role'];
  description: string;
}

// ユーザー権限情報
export interface UserPermissions {
  userId: string;
  role: User['role'];
  availableFeatures: string[];
  canCreateUser: boolean;
  canManageTeams: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canManageSettings: boolean;
}

// ============================================
// 管理者機能
// ============================================

// ユーザー管理操作
export interface UserManagementAction {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE' | 'RESET_PASSWORD';
  targetUserId?: string;
  performedBy: string;
  timestamp: Date;
  data?: Record<string, any>;
}

// ユーザー一覧フィルター
export interface UserListFilter {
  search?: string;
  role?: User['role'][];
  department?: string[];
  isActive?: boolean;
  teamId?: string;
  createdDateRange?: {
    from: Date;
    to: Date;
  };
}

// ============================================
// セキュリティ監査
// ============================================

// 監査ログエントリ
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'USER_CREATED' | 'USER_UPDATED' | 'PERMISSION_DENIED';
  details: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

// セキュリティ設定
export interface SecurityConfig {
  sessionTimeout: number; // ミリ秒
  maxLoginAttempts: number;
  lockoutDuration: number; // ミリ秒
  passwordMinLength: number;
  requirePasswordComplexity: boolean;
  enableAuditLog: boolean;
  enableRememberMe: boolean;
}

// ============================================
// 認証状態管理
// ============================================

// 認証コンテキストの値
export interface AuthContextValue {
  // 状態
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  permissions: UserPermissions | null;
  
  // アクション
  login: (credentials: AuthCredentials) => Promise<AuthResult>;
  logout: () => void;
  switchUser: (user: User) => Promise<void>;
  
  // セッション管理
  refreshSession: () => Promise<boolean>;
  isSessionValid: () => boolean;
  
  // 権限チェック
  hasPermission: (feature: string) => boolean;
  hasRole: (role: User['role']) => boolean;
  
  // ユーティリティ
  getRememberedUser: () => string | null;
  clearRememberedUser: () => void;
}

// ============================================
// API型定義（将来のバックエンド連携用）
// ============================================

// ログインAPI リクエスト
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// ログインAPI レスポンス
export interface LoginResponse {
  success: boolean;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresAt: string; // ISO文字列
  };
  error?: {
    code: string;
    message: string;
  };
}

// ユーザー作成API リクエスト
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: User['role'];
  department?: string;
  position?: string;
  teamIds?: string[];
}

// ============================================
// フロントエンド固有の型
// ============================================

// ログイン画面の状態
export interface LoginScreenState {
  showLoginForm: boolean;
  showUserRegistration: boolean;
  showForgotPassword: boolean;
  isFirstTimeSetup: boolean;
}

// パスワードリセット
export interface PasswordResetForm {
  email: string;
  isLoading: boolean;
  success: boolean;
  error: string | null;
}

export default AuthCredentials;