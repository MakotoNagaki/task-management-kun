/**
 * useAuth - 認証管理カスタムフック
 * タスク管理くん用認証・ユーザー管理機能
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage, STORAGE_KEYS } from './useLocalStorage';

// 型定義をインポート
import type {
  User,
  UserSession,
  LoginForm,
  LoginRequest,
  LoginResponse,
  PasswordResetForm,
  PasswordChangeForm,
  ApiResponse
} from '../types';

/**
 * 認証状態の型定義
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

/**
 * 認証API応答の型定義
 */
interface AuthApiResponse extends ApiResponse {
  user?: User;
  token?: string;
  expiresAt?: Date;
}

/**
 * 認証フックの戻り値
 */
interface UseAuthReturn {
  // 認証状態
  authState: AuthState;
  
  // 認証メソッド
  login: (email: string, password: string) => Promise<AuthApiResponse>;
  logout: () => Promise<void>;
  register: (userData: Partial<User>) => Promise<AuthApiResponse>;
  
  // パスワード管理
  changePassword: (passwordData: PasswordChangeForm) => Promise<AuthApiResponse>;
  requestPasswordReset: (resetData: PasswordResetForm) => Promise<AuthApiResponse>;
  
  // ユーザー情報管理
  updateProfile: (updates: Partial<User>) => Promise<AuthApiResponse>;
  refreshToken: () => Promise<AuthApiResponse>;
  
  // 開発用機能
  createSimpleLoginForm: (users: User[]) => LoginForm[];
  loginAsUser: (userId: string) => Promise<AuthApiResponse>;
  
  // ユーザー記憶機能
  getRememberedEmail: () => string | null;
  setRememberedEmail: (email: string) => void;
  getRememberedUser: () => User | null;
  clearRememberedUser: () => void;
  loginWithRemember: (email: string, password: string, rememberMe?: boolean) => Promise<AuthApiResponse>;
  
  // ユーティリティ
  isTokenExpired: () => boolean;
  clearAuthError: () => void;
}

/**
 * 認証管理カスタムフック
 */
export function useAuth(): UseAuthReturn {
  // ============================================
  // 状態管理
  // ============================================
  
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  const [authToken, setAuthToken] = useLocalStorage<string | null>('auth-token', null);
  const [users] = useLocalStorage<User[]>(STORAGE_KEYS.USERS, []);
  const [rememberedUser, setRememberedUser] = useLocalStorage<string | null>('task-management-kun-remember-user', null);
  const [authSession, setAuthSession] = useLocalStorage<any>('task-management-kun-auth-session', null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // 認証状態の計算
  // ============================================
  
  const authState: AuthState = useMemo(() => ({
    user: currentUser,
    isAuthenticated: !!currentUser && !!authToken,
    isLoading,
    error,
    token: authToken,
  }), [currentUser, authToken, isLoading, error]);

  // ============================================
  // トークンの期限チェック
  // ============================================
  
  const isTokenExpired = useCallback((): boolean => {
    if (!authToken) return true;
    
    try {
      // JWTトークンの場合のデコード例（本格的な実装では適切なライブラリを使用）
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      // トークンの解析に失敗した場合は期限切れとみなす
      return true;
    }
  }, [authToken]);

  // ============================================
  // 認証メソッド（基本的な順序で定義）
  // ============================================
  
  /**
   * ログイン処理
   */
  const login = useCallback(async (email: string, password: string): Promise<AuthApiResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // 開発環境では簡易認証（実際のAPIを使う場合はここでAPI呼び出し）
      const user = users.find(u => u.email === email);
      
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      if (!user.isActive) {
        throw new Error('無効なユーザーです');
      }

      // 実際のプロダクションではここでパスワード検証を行う
      // if (!bcrypt.compare(password, user.hashedPassword)) {
      //   throw new Error('パスワードが正しくありません');
      // }

      // 開発用の簡易トークン生成
      const token = `dev-token-${user.id}-${Date.now()}`;
      
      setCurrentUser(user);
      setAuthToken(token);

      return {
        success: true,
        user,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
        message: 'ログインに成功しました'
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [users, setCurrentUser, setAuthToken]);

  /**
   * ユーザーを記憶してログイン（loginより後に定義）
   */
  const loginWithRemember = useCallback(async (email: string, password: string, rememberMe: boolean = false): Promise<AuthApiResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // 開発環境では簡易認証
      const user = users.find(u => u.email === email);
      
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      if (!user.isActive) {
        throw new Error('無効なユーザーです');
      }

      // 開発用の簡易トークン生成
      const token = `dev-token-${user.id}-${Date.now()}`;
      
      setCurrentUser(user);
      setAuthToken(token);

      // 記憶機能
      if (rememberMe) {
        setRememberedUser(user.id);
        setAuthSession({
          userId: user.id,
          timestamp: new Date().toISOString(),
          rememberMe: true
        });
      }

      return {
        success: true,
        user,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
        message: 'ログインに成功しました'
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [users, setCurrentUser, setAuthToken, setRememberedUser, setAuthSession]);

  /**
   * ログアウト処理
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // ローカルストレージからユーザー情報とトークンを削除
      setCurrentUser(null);
      setAuthToken(null);
      
      // エラー状態もクリア
      setError(null);
      
    } catch (err) {
      console.error('Logout error:', err);
      setError('ログアウト処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentUser, setAuthToken]);

  /**
   * ユーザー登録処理
   */
  const register = useCallback(async (userData: Partial<User>): Promise<AuthApiResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // 開発環境での簡易登録（実際のAPIを使う場合はここでAPI呼び出し）
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'member',
        department: userData.department,
        position: userData.position,
        teamIds: userData.teamIds || [],
        primaryTeamId: userData.primaryTeamId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          theme: 'auto',
          language: 'ja',
          notifications: {
            email: true,
            slack: false,
            browser: true,
            sound: false,
            dueDate: true,
            taskAssigned: true,
            taskCompleted: false,
            teamMention: true
          },
          defaultAssigneeType: 'user',
          workingHours: {
            start: '09:00',
            end: '18:00'
          }
        }
      };

      const token = `dev-token-${newUser.id}-${Date.now()}`;
      
      setCurrentUser(newUser);
      setAuthToken(token);

      return {
        success: true,
        user: newUser,
        token,
        message: 'ユーザー登録に成功しました'
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登録に失敗しました';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentUser, setAuthToken]);

  /**
   * パスワード変更処理
   */
  const changePassword = useCallback(async (passwordData: PasswordChangeForm): Promise<AuthApiResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!currentUser) {
        throw new Error('ログインが必要です');
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('新しいパスワードが一致しません');
      }

      // 実際のAPIでは現在のパスワードの検証とパスワード更新を行う
      
      return {
        success: true,
        message: 'パスワードが正常に変更されました'
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'パスワード変更に失敗しました';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  /**
   * パスワードリセット要求
   */
  const requestPasswordReset = useCallback(async (resetData: PasswordResetForm): Promise<AuthApiResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // 実際のAPIではパスワードリセットメールの送信を行う
      
      return {
        success: true,
        message: `${resetData.email} にパスワードリセットメールを送信しました`
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'パスワードリセット要求に失敗しました';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * プロフィール更新
   */
  const updateProfile = useCallback(async (updates: Partial<User>): Promise<AuthApiResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!currentUser) {
        throw new Error('ログインが必要です');
      }

      const updatedUser: User = {
        ...currentUser,
        ...updates,
        updatedAt: new Date()
      };

      setCurrentUser(updatedUser);

      return {
        success: true,
        user: updatedUser,
        message: 'プロフィールが正常に更新されました'
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'プロフィール更新に失敗しました';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, setCurrentUser]);

  /**
   * トークンリフレッシュ
   */
  const refreshToken = useCallback(async (): Promise<AuthApiResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!currentUser) {
        throw new Error('ログインが必要です');
      }

      // 新しいトークンを生成（開発用）
      const newToken = `dev-token-${currentUser.id}-${Date.now()}`;
      setAuthToken(newToken);

      return {
        success: true,
        token: newToken,
        message: 'トークンがリフレッシュされました'
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'トークンリフレッシュに失敗しました';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, setAuthToken]);

  // ============================================
  // 開発用機能
  // ============================================

  /**
   * パスワードなしの簡易ログイン（開発用）
   */
  const createSimpleLoginForm = useCallback((users: User[]): LoginForm[] => {
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isSelected: false
    }));
  }, []);

  /**
   * 指定ユーザーとしてログイン（開発用）
   */
  const loginAsUser = useCallback(async (userId: string): Promise<AuthApiResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      if (!user.isActive) {
        throw new Error('無効なユーザーです');
      }

      const token = `dev-token-${user.id}-${Date.now()}`;
      
      setCurrentUser(user);
      setAuthToken(token);

      return {
        success: true,
        user,
        token,
        message: `${user.name} としてログインしました`
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ユーザー切り替えに失敗しました';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [users, setCurrentUser, setAuthToken]);

  // ============================================
  // ユーザー記憶機能
  // ============================================

  /**
   * 記憶されたユーザーのメールアドレスを取得
   */
  const getRememberedEmail = useCallback((): string | null => {
    try {
      if (rememberedUser) {
        const user = users.find(u => u.id === rememberedUser);
        return user?.email || null;
      }
      return null;
    } catch (err) {
      console.error('Error getting remembered email:', err);
      return null;
    }
  }, [rememberedUser, users]);

  /**
   * ユーザーのメールアドレスを記憶
   */
  const setRememberedEmail = useCallback((email: string): void => {
    try {
      const user = users.find(u => u.email === email);
      if (user) {
        setRememberedUser(user.id);
      }
    } catch (err) {
      console.error('Error setting remembered email:', err);
    }
  }, [users, setRememberedUser]);

  /**
   * 記憶されたユーザー情報を取得
   */
  const getRememberedUser = useCallback((): User | null => {
    try {
      if (rememberedUser) {
        return users.find(u => u.id === rememberedUser) || null;
      }
      return null;
    } catch (err) {
      console.error('Error getting remembered user:', err);
      return null;
    }
  }, [rememberedUser, users]);

  /**
   * 記憶されたユーザー情報をクリア
   */
  const clearRememberedUser = useCallback((): void => {
    try {
      setRememberedUser(null);
      setAuthSession(null);
    } catch (err) {
      console.error('Error clearing remembered user:', err);
    }
  }, [setRememberedUser, setAuthSession]);

  // ============================================
  // ユーティリティ
  // ============================================

  const clearAuthError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================
  // エフェクト（自動ログアウト等）
  // ============================================

  // トークン期限チェック
  useEffect(() => {
    const checkTokenExpiration = () => {
      if (authToken && isTokenExpired()) {
        console.log('Token expired, logging out automatically');
        logout();
      }
    };

    // 1分ごとにトークン期限をチェック
    const interval = setInterval(checkTokenExpiration, 60 * 1000);

    return () => clearInterval(interval);
  }, [authToken, isTokenExpired, logout]);

  // ============================================
  // フックの戻り値
  // ============================================

  return {
    authState,
    login,
    logout,
    register,
    changePassword,
    requestPasswordReset,
    updateProfile,
    refreshToken,
    createSimpleLoginForm,
    loginAsUser,
    getRememberedEmail,
    setRememberedEmail,
    getRememberedUser,
    clearRememberedUser,
    loginWithRemember,
    isTokenExpired,
    clearAuthError
  };
}

export default useAuth;