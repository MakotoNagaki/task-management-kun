/**
 * useAuth - セキュア認証管理カスタムフック
 * タスク管理くん用セキュア認証機能
 * 
 * 機能:
 * - ID/パスワード認証
 * - セッション管理
 * - 権限チェック
 * - セキュリティ監査
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Auth } from '../utils/auth';
import type { User, AuthState } from '../types';
import type { AuthCredentials, AuthResult, UserPermissions, AuthError } from '../types/auth';

// 認証関連の定数
export const AUTH_KEYS = {
  SESSION: 'task-management-kun-auth-session',
  REMEMBER_USER: 'task-management-kun-remember-user'
} as const;

/**
 * セキュア認証管理フック
 */
export function useAuth() {
  // セッション情報をローカルストレージで管理
  const [authSession, setAuthSession, clearAuthSession, sessionLoading] = useLocalStorage<AuthState | null>(
    AUTH_KEYS.SESSION, 
    null
  );

  // 前回ログインユーザーのメールアドレスを記憶
  const [rememberedEmail, setRememberedEmail] = useLocalStorage<string | null>(
    AUTH_KEYS.REMEMBER_USER, 
    null
  );

  // 認証状態
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  // ユーザーリスト（認証用）
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // セッションから認証状態を復元
  useEffect(() => {
    if (sessionLoading) return;
    
    if (authSession && authSession.isAuthenticated && authSession.user) {
      // セッション有効性チェック
      if (authSession.sessionToken) {
        const verification = Auth.TokenGenerator.verifySessionToken(authSession.sessionToken);
        if (verification.valid) {
          setIsAuthenticated(true);
          setCurrentUser(authSession.user);
          updateUserPermissions(authSession.user);
          console.log('セッションを復元しました:', authSession.user.name);
        } else {
          // 無効なセッションをクリア
          clearAuthSession();
          setIsAuthenticated(false);
          setCurrentUser(null);
          console.log('無効なセッションをクリアしました');
        }
      }
    } else {
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
    
    setIsLoading(false);
  }, [authSession, sessionLoading, clearAuthSession]);

  /**
   * ユーザー権限を更新
   */
  const updateUserPermissions = useCallback((user: User) => {
    const permissions: UserPermissions = {
      userId: user.id,
      role: user.role,
      availableFeatures: Auth.PermissionManager.getAvailableFeatures(user),
      canCreateUser: Auth.PermissionManager.hasPermission(user, 'create_user'),
      canManageTeams: Auth.PermissionManager.hasPermission(user, 'manage_teams'),
      canViewReports: Auth.PermissionManager.hasPermission(user, 'view_reports'),
      canExportData: Auth.PermissionManager.hasPermission(user, 'export_data'),
      canManageSettings: Auth.PermissionManager.hasPermission(user, 'manage_settings')
    };
    setUserPermissions(permissions);
  }, []);

  /**
   * セキュアログイン処理
   */
  const login = useCallback(async (credentials: AuthCredentials): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      // 認証実行
      const result = await Auth.AuthService.authenticate(credentials, availableUsers);
      
      // 監査ログ記録
      Auth.SecurityAudit.logLoginAttempt(credentials.email, result.success);
      
      if (result.success && result.data) {
        const { user, sessionToken, expiresAt } = result.data;
        
        // 認証セッションを作成
        const session: AuthState = {
          isAuthenticated: true,
          user,
          sessionToken,
          loginTime: new Date(),
          lastActivity: new Date()
        };

        // セッション情報を保存
        setAuthSession(session);
        setIsAuthenticated(true);
        setCurrentUser(user);
        updateUserPermissions(user);

        // ユーザーを記憶する場合
        if (credentials.rememberMe) {
          setRememberedEmail(credentials.email);
        }

        // 最終ログイン時刻を更新
        const updatedUser = { ...user, lastLoginAt: new Date() };
        setCurrentUser(updatedUser);

        console.log('ログイン成功:', user.name);
      } else if (result.error) {
        setAuthError(result.error);
        console.error('ログイン失敗:', result.error.message);
      }

      return result;
    } catch (error) {
      const authError: AuthError = {
        code: 'AUTHENTICATION_ERROR',
        message: '認証処理中にエラーが発生しました',
        timestamp: new Date()
      };
      setAuthError(authError);
      console.error('認証エラー:', error);
      return { success: false, error: authError };
    } finally {
      setIsLoading(false);
    }
  }, [availableUsers, setAuthSession, setRememberedEmail, updateUserPermissions]);

  /**
   * ログアウト処理
   */
  const logout = useCallback((): void => {
    try {
      // 監査ログ記録
      if (currentUser) {
        Auth.SecurityAudit.logLoginAttempt(currentUser.email, true);
      }

      // セッション情報をクリア
      clearAuthSession();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUserPermissions(null);
      setAuthError(null);

      console.log('ログアウト完了');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  }, [currentUser, clearAuthSession]);

  /**
   * ユーザーリストを設定（初期化用）
   */
  const setUsers = useCallback((users: User[]): void => {
    setAvailableUsers(users);
  }, []);

  /**
   * 権限チェック
   */
  const hasPermission = useCallback((feature: string): boolean => {
    return Auth.PermissionManager.hasPermission(currentUser, feature);
  }, [currentUser]);

  /**
   * ロールチェック
   */
  const hasRole = useCallback((role: User['role']): boolean => {
    return Auth.PermissionManager.hasRole(currentUser, role);
  }, [currentUser]);

  /**
   * セッション有効性チェック
   */
  const isSessionValid = useCallback((): boolean => {
    if (!authSession || !authSession.isAuthenticated || !authSession.sessionToken) {
      return false;
    }

    const verification = Auth.TokenGenerator.verifySessionToken(authSession.sessionToken);
    if (!verification.valid) {
      if (verification.expired) {
        console.log('セッションがタイムアウトしました');
      }
      logout();
      return false;
    }

    return true;
  }, [authSession, logout]);

  /**
   * セッション更新（アクティビティ記録）
   */
  const updateActivity = useCallback((): void => {
    if (authSession && authSession.isAuthenticated) {
      const updatedSession: AuthState = {
        ...authSession,
        lastActivity: new Date()
      };
      setAuthSession(updatedSession);
    }
  }, [authSession, setAuthSession]);

  /**
   * 記憶されたメールアドレス取得
   */
  const getRememberedEmail = useCallback((): string | null => {
    return rememberedEmail;
  }, [rememberedEmail]);

  /**
   * 記憶されたメールアドレスをクリア
   */
  const clearRememberedEmail = useCallback((): void => {
    setRememberedEmail(null);
  }, [setRememberedEmail]);

  /**
   * 認証が必要かチェック
   */
  const requiresAuth = useCallback((): boolean => {
    return !isAuthenticated || !currentUser;
  }, [isAuthenticated, currentUser]);

  /**
   * 管理者権限チェック
   */
  const isAdmin = useCallback((): boolean => {
    return Auth.PermissionManager.isAdmin(currentUser);
  }, [currentUser]);

  /**
   * マネージャー以上の権限チェック
   */
  const isManagerOrAbove = useCallback((): boolean => {
    return Auth.PermissionManager.isManagerOrAbove(currentUser);
  }, [currentUser]);

  return {
    // 状態
    isAuthenticated,
    currentUser,
    userPermissions,
    isLoading,
    authError,
    
    // アクション
    login,
    logout,
    setUsers,
    updateActivity,
    
    // 権限チェック
    hasPermission,
    hasRole,
    isAdmin,
    isManagerOrAbove,
    
    // ユーティリティ
    isSessionValid,
    getRememberedEmail,
    clearRememberedEmail,
    requiresAuth
  };
}

/**
 * 認証状態プロバイダー用のコンテキスト値
 */
export interface AuthContextValue {
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  login: (user: User, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  switchUser: (user: User) => Promise<void>;
  updateActivity: () => void;
  isSessionValid: () => boolean;
  getRememberedUserId: () => string | null;
  requiresAuth: () => boolean;
}

/**
 * 簡易認証ヘルパー関数
 */
export const authHelpers = {
  /**
   * パスワードなしの簡易ログイン（開発用）
   */
  createSimpleLoginForm: (users: User[]): LoginForm[] => {
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      position: user.position,
      role: user.role,
      avatar: user.avatar
    }));
  },

  /**
   * ユーザー権限チェック
   */
  hasPermission: (user: User | null, requiredRole: User['role']): boolean => {
    if (!user) return false;
    
    const roleHierarchy = {
      'viewer': 1,
      'member': 2,
      'manager': 3,
      'admin': 4
    };
    
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  },

  /**
   * ユーザー表示名取得
   */
  getDisplayName: (user: User | null): string => {
    if (!user) return 'ゲスト';
    return `${user.name} (${user.role})`;
  }
};

export default useAuth;