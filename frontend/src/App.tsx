// frontend/src/App.tsx - 完全版タスク管理システム
import React, { useState } from 'react';
import { 
  Shield, Users, MessageSquare, Target, LogOut,
  Settings, Calendar, Plus, Home, BarChart3, Bell, Menu, X,
  Eye, EyeOff, Lock, Mail, User
} from 'lucide-react';

// コンポーネントのインポート
import TaskManagement from './components/TaskManagement';
import AdminPanel from './components/AdminPanel';

// メインアプリケーション
const TaskManagementApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'tasks' | 'admin'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ログイン処理
  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  // ログアウト処理
  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveScreen('dashboard');
  };

  // ログイン画面
  const LoginScreen: React.FC = () => {
    const [credentials, setCredentials] = useState({
      identifier: '',
      password: '',
      rememberMe: false
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // デモ用認証
        if (credentials.identifier === 'admin@company.com' && credentials.password === 'admin123') {
          handleLoginSuccess({
            id: 'admin001',
            name: '管理者 太郎',
            email: 'admin@company.com',
            role: 'admin',
            department: 'IT部',
            position: 'システム管理者'
          });
        } else if (credentials.identifier === 'employee@company.com' && credentials.password === 'emp123') {
          handleLoginSuccess({
            id: 'emp001',
            name: '社員 花子',
            email: 'employee@company.com',
            role: 'employee',
            department: '営業部',
            position: '営業担当'
          });
        } else {
          throw new Error('ログイン情報が正しくありません');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'ログインに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    const handleQuickLogin = (type: 'admin' | 'employee') => {
      if (type === 'admin') {
        setCredentials({
          identifier: 'admin@company.com',
          password: 'admin123',
          rememberMe: false
        });
      } else {
        setCredentials({
          identifier: 'employee@company.com',
          password: 'emp123',
          rememberMe: false
        });
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-width-md p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">タスク管理くん</h1>
            <p className="text-gray-600">ログインしてご利用ください</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                メールアドレス
              </label>
              <input
                type="email"
                value={credentials.identifier}
                onChange={(e) => setCredentials(prev => ({ ...prev, identifier: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="admin@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                パスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={credentials.rememberMe}
                onChange={(e) => setCredentials(prev => ({ ...prev, rememberMe: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                ログイン状態を保持
              </label>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading || !credentials.identifier || !credentials.password}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ログイン中...
                </div>
              ) : (
                'ログイン'
              )}
            </button>

            {/* デモ用クイックログイン */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center mb-4">デモ用クイックログイン</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleQuickLogin('admin')}
                  className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-left transition-colors"
                >
                  <Shield className="w-5 h-5 text-blue-600 mb-1" />
                  <div className="text-xs font-medium text-blue-900">管理者</div>
                  <div className="text-xs text-blue-700">admin@company.com</div>
                </button>
                
                <button
                  onClick={() => handleQuickLogin('employee')}
                  className="p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-left transition-colors"
                >
                  <User className="w-5 h-5 text-green-600 mb-1" />
                  <div className="text-xs font-medium text-green-900">社員</div>
                  <div className="text-xs text-green-700">employee@company.com</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ダッシュボード画面
  const DashboardScreen: React.FC = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ようこそ、{currentUser?.name}さん！
          </h2>
          <p className="text-gray-600 mb-6">
            {currentUser?.department}・{currentUser?.position}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              onClick={() => setActiveScreen('tasks')}
              className="p-6 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
            >
              <Target className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-blue-900 mb-2">タスク管理</h3>
              <p className="text-sm text-blue-700">個人・チーム・全社のタスクを管理</p>
            </div>
            
            <div className="p-6 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors">
              <MessageSquare className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="font-semibold text-purple-900 mb-2">Slack連携</h3>
              <p className="text-sm text-purple-700">Slackメッセージからタスク作成</p>
            </div>
            
            {currentUser?.role === 'admin' && (
              <div 
                onClick={() => setActiveScreen('admin')}
                className="p-6 bg-orange-50 rounded-lg border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors"
              >
                <Shield className="w-8 h-8 text-orange-600 mb-4" />
                <h3 className="font-semibold text-orange-900 mb-2">管理者機能</h3>
                <p className="text-sm text-orange-700">ユーザー・チーム・システム管理</p>
              </div>
            )}
            
            <div className="p-6 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
              <BarChart3 className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="font-semibold text-green-900 mb-2">レポート</h3>
              <p className="text-sm text-green-700">タスクの進捗状況を分析</p>
            </div>
            
            <div className="p-6 bg-indigo-50 rounded-lg border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors">
              <Calendar className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-semibold text-indigo-900 mb-2">カレンダー</h3>
              <p className="text-sm text-indigo-700">スケジュールとタスクを統合管理</p>
            </div>
            
            <div className="p-6 bg-rose-50 rounded-lg border border-rose-200 cursor-pointer hover:bg-rose-100 transition-colors">
              <Bell className="w-8 h-8 text-rose-600 mb-4" />
              <h3 className="font-semibold text-rose-900 mb-2">通知設定</h3>
              <p className="text-sm text-rose-700">タスクの通知をカスタマイズ</p>
            </div>
          </div>
        </div>

        {/* 最近のタスク */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近のタスク</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="flex-1">新規機能の要件定義</span>
              <span className="text-sm text-gray-500">進行中</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="flex-1">月次レポート作成</span>
              <span className="text-sm text-gray-500">完了</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="flex-1">システムメンテナンス</span>
              <span className="text-sm text-gray-500">待機中</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ナビゲーションアイテム
  const navigationItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: Home },
    { id: 'tasks', label: 'タスク管理', icon: Target },
    ...(currentUser?.role === 'admin' ? [{ id: 'admin', label: '管理者機能', icon: Shield }] : []),
  ];

  // メイン画面
  const MainScreen: React.FC = () => {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* サイドバー */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">タスク管理くん</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="mt-8 px-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveScreen(item.id as any);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* オーバーレイ */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {/* ヘッダー */}
          <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {navigationItems.find(item => item.id === activeScreen)?.label}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentUser?.role === 'admin' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {currentUser?.role === 'admin' ? (
                    <Shield className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Users className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div className="hidden sm:block text-sm">
                  <div className="font-medium text-gray-900">{currentUser?.name}</div>
                  <div className="text-gray-500">
                    {currentUser?.role === 'admin' ? '管理者' : '社員'}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="ログアウト"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* メインコンテンツエリア */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {activeScreen === 'dashboard' && <DashboardScreen />}
            {activeScreen === 'tasks' && <TaskManagement currentUser={currentUser} />}
            {activeScreen === 'admin' && currentUser?.role === 'admin' && <AdminPanel />}
          </main>
        </div>
      </div>
    );
  };

  return (
    <>
      {isAuthenticated ? <MainScreen /> : <LoginScreen />}
    </>
  );
};

// メインAppコンポーネント
const App: React.FC = () => {
  return <TaskManagementApp />;
};

export default App;