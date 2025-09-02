// frontend/src/components/LoginSystem.tsx
import React, { useState, useCallback } from 'react';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, Loader2, Shield, Users, Database } from 'lucide-react';

// 型定義
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  department?: string;
  teamIds: string[];
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

interface LoginCredentials {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

interface LoginSystemProps {
  onLoginSuccess: (user: User) => void;
}

// デモ用データ
const DEMO_USERS: User[] = [
  {
    id: 'admin001',
    name: '管理者 太郎',
    email: 'admin@company.com',
    role: 'admin',
    department: 'IT',
    teamIds: ['team001'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2025-09-01')
  },
  {
    id: 'emp001',
    name: '社員 花子',
    email: 'employee@company.com',
    role: 'employee',
    department: '営業',
    teamIds: ['team002'],
    isActive: true,
    createdAt: new Date('2024-02-01'),
    lastLoginAt: new Date('2025-08-30')
  }
];

const LoginSystem: React.FC<LoginSystemProps> = ({ onLoginSuccess }) => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    identifier: '',
    password: '',
    rememberMe: false
  });

  // ============================================
  // ログイン処理
  // ============================================
  
  const handleLogin = useCallback(async (loginData: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      // デモ用認証ロジック
      const user = DEMO_USERS.find(u => 
        (u.email === loginData.identifier || u.id === loginData.identifier) &&
        u.isActive
      );

      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      // パスワード検証（デモ用）
      const validPassword = user.role === 'admin' ? 'admin123' : 'emp123';
      if (loginData.password !== validPassword) {
        throw new Error('パスワードが正しくありません');
      }

      // ログイン成功
      const updatedUser = {
        ...user,
        lastLoginAt: new Date()
      };

      // Remember機能
      if (loginData.rememberMe) {
        localStorage.setItem('rememberedEmail', loginData.identifier);
      }

      // 親コンポーネントに通知
      onLoginSuccess(updatedUser);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [onLoginSuccess]);

  // ログイン実行
  const executeLogin = useCallback(() => {
    if (credentials.identifier && credentials.password) {
      handleLogin(credentials);
    }
  }, [credentials, handleLogin]);

  // キーボードイベント処理
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && credentials.identifier && credentials.password) {
      executeLogin();
    }
  }, [credentials, executeLogin]);

  // パスワード表示切り替え
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // ============================================
  // レンダリング
  // ============================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ログインカード */}
        <div className="bg-white rounded-2xl shadow-xl border p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">タスク管理くん</h1>
            <p className="text-gray-600 mt-2">ログインしてください</p>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* ログインフォーム */}
          <div className="space-y-6">
            {/* ID/Email入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ユーザーID / メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={credentials.identifier}
                  onChange={(e) => setCredentials(prev => ({ ...prev, identifier: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="user@company.com または user001"
                  required
                />
              </div>
            </div>

            {/* パスワード入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="パスワードを入力"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={credentials.rememberMe}
                onChange={(e) => setCredentials(prev => ({ ...prev, rememberMe: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                ログイン状態を保持する
              </label>
            </div>

            {/* ログインボタン */}
            <button
              onClick={executeLogin}
              disabled={isLoading || !credentials.identifier || !credentials.password}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  ログイン中...
                </>
              ) : (
                'ログイン'
              )}
            </button>
          </div>

          {/* デモ用クイックログイン */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">デモ用クイックログイン</p>
            <div className="space-y-2">
              <button
                onClick={() => setCredentials({
                  identifier: 'admin@company.com',
                  password: 'admin123',
                  rememberMe: false
                })}
                className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">管理者アカウント</div>
                    <div className="text-sm text-blue-700">admin@company.com / admin123</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setCredentials({
                  identifier: 'employee@company.com',
                  password: 'emp123',
                  rememberMe: false
                })}
                className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900">社員アカウント</div>
                    <div className="text-sm text-green-700">employee@company.com / emp123</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* システム情報 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Version 2.0 - 強化版認証システム</p>
          <p className="mt-1">管理者・社員の2段階権限システム対応</p>
        </div>
      </div>
    </div>
  );
};

export default LoginSystem;