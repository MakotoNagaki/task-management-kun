/**
 * LoginScreen - セキュアログイン画面コンポーネント
 * タスク管理くん - ID/パスワード認証システム
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, 
  User as UserIcon, Shield, Tag, Info, CheckCircle 
} from 'lucide-react';
import type { LoginFormState, AuthCredentials } from '../types/auth';
import type { User } from '../types';

interface LoginScreenProps {
  onLogin: (credentials: AuthCredentials) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  rememberedEmail: string | null;
  onShowUserManagement?: () => void;
  isAdminSetupMode?: boolean;
}

/**
 * セキュアログイン画面
 */
const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  isLoading,
  error,
  rememberedEmail,
  onShowUserManagement,
  isAdminSetupMode = false
}) => {
  // フォーム状態
  const [formState, setFormState] = useState<LoginFormState>({
    email: rememberedEmail || '',
    password: '',
    rememberMe: !!rememberedEmail,
    isLoading: false,
    error: null,
    showPassword: false
  });

  // 記憶されたメールアドレスを復元
  useEffect(() => {
    if (rememberedEmail) {
      setFormState(prev => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true
      }));
    }
  }, [rememberedEmail]);

  // エラー状態を同期
  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      error: error,
      isLoading: isLoading
    }));
  }, [error, isLoading]);

  /**
   * フォーム送信処理
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.email.trim() || !formState.password.trim()) {
      setFormState(prev => ({
        ...prev,
        error: 'メールアドレスとパスワードを入力してください'
      }));
      return;
    }

    const credentials: AuthCredentials = {
      email: formState.email.trim(),
      password: formState.password,
      rememberMe: formState.rememberMe
    };

    try {
      await onLogin(credentials);
    } catch (err) {
      console.error('ログイン処理エラー:', err);
    }
  }, [formState, onLogin]);

  /**
   * パスワード表示切り替え
   */
  const togglePasswordVisibility = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      showPassword: !prev.showPassword
    }));
  }, []);

  /**
   * フォーム入力変更
   */
  const handleInputChange = useCallback((field: keyof LoginFormState, value: string | boolean) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
      error: null // エラーをクリア
    }));
  }, []);

  /**
   * デモアカウント情報
   */
  const demoAccounts = [
    { email: 'admin@company.com', password: 'admin123', role: '管理者' },
    { email: 'tanaka@company.com', password: 'password123', role: 'マネージャー' },
    { email: 'sato@company.com', password: 'password123', role: 'メンバー' }
  ];

  return (
    <div className="login-screen">
      <div className="login-container">
        {/* ヘッダー */}
        <div className="login-header">
          <div className="app-icon-large">
            <Tag size={48} />
          </div>
          <h1 className="login-title">タスク管理くん</h1>
          <p className="login-subtitle">
            {isAdminSetupMode ? '初期セットアップ' : 'ログインして開始'}
          </p>
        </div>

        {/* ログインフォーム */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* メールアドレス */}
          <div className="form-group">
            <label className="form-label">
              <Mail size={18} />
              <span>メールアドレス</span>
            </label>
            <div className="input-container">
              <input
                type="email"
                value={formState.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@company.com"
                className="form-input"
                disabled={formState.isLoading}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* パスワード */}
          <div className="form-group">
            <label className="form-label">
              <Lock size={18} />
              <span>パスワード</span>
            </label>
            <div className="input-container password-container">
              <input
                type={formState.showPassword ? 'text' : 'password'}
                value={formState.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="パスワードを入力"
                className="form-input"
                disabled={formState.isLoading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle"
                disabled={formState.isLoading}
              >
                {formState.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* ログイン記憶 */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formState.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                disabled={formState.isLoading}
              />
              <span className="checkbox-text">ログイン情報を記憶する</span>
            </label>
          </div>

          {/* エラー表示 */}
          {formState.error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{formState.error}</span>
            </div>
          )}

          {/* ログインボタン */}
          <button
            type="submit"
            className="login-button"
            disabled={formState.isLoading || !formState.email.trim() || !formState.password.trim()}
          >
            {formState.isLoading ? (
              <>
                <div className="loading-spinner" />
                <span>認証中...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>ログイン</span>
              </>
            )}
          </button>
        </form>

        {/* デモアカウント情報 */}
        <div className="demo-accounts">
          <div className="demo-header">
            <Info size={16} />
            <span>デモアカウント</span>
          </div>
          <div className="demo-list">
            {demoAccounts.map((account, index) => (
              <div key={index} className="demo-account">
                <div className="demo-info">
                  <UserIcon size={14} />
                  <span className="demo-role">{account.role}</span>
                </div>
                <div className="demo-credentials">
                  <code>{account.email}</code>
                  <span>/</span>
                  <code>{account.password}</code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormState(prev => ({
                      ...prev,
                      email: account.email,
                      password: account.password,
                      rememberMe: true
                    }));
                  }}
                  className="demo-fill-button"
                  disabled={formState.isLoading}
                >
                  入力
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 管理者機能へのリンク */}
        {onShowUserManagement && (
          <div className="admin-link">
            <button
              type="button"
              onClick={onShowUserManagement}
              className="admin-button"
              disabled={formState.isLoading}
            >
              <Shield size={16} />
              <span>管理者機能</span>
            </button>
          </div>
        )}

        {/* セキュリティ情報 */}
        <div className="security-info">
          <div className="security-features">
            <div className="security-item">
              <CheckCircle size={14} />
              <span>パスワード暗号化</span>
            </div>
            <div className="security-item">
              <CheckCircle size={14} />
              <span>セッション管理</span>
            </div>
            <div className="security-item">
              <CheckCircle size={14} />
              <span>権限制御</span>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="login-footer">
          <p>
            タスク管理くん v3.3 - セキュア認証版
          </p>
          <p className="login-footer-note">
            ログイン情報はローカルに暗号化して保存されます
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;