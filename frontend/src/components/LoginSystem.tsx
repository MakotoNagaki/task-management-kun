// ディレクトリ: frontend/src/components/LoginSystem.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, Loader2, Shield, Users, Plus, LogIn } from 'lucide-react';

// 型定義
interface User {
  id: string;
  name: string;
  email: string;
  password: string; // 本番環境では暗号化必須
  role: 'admin' | 'employee';
  department?: string;
  position?: string;
  teamIds: string[];
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  color: string;
  memberIds: string[];
  leaderId?: string;
  createdAt: Date;
}

interface SystemTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  category: 'priority' | 'department' | 'project' | 'status' | 'custom';
  isDefault: boolean;
  usageCount: number;
  createdAt: Date;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginSystemProps {
  onLoginSuccess: (user: User) => void;
}

// デモ用ユーザーデータ（本番環境では削除）
const DEMO_USERS: User[] = [
  {
    id: 'admin001',
    name: '管理者 太郎',
    email: 'admin@company.com',
    password: 'admin123', // 本番では暗号化
    role: 'admin',
    department: 'IT',
    position: 'システム管理者',
    teamIds: ['team001'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2025-09-01')
  },
  {
    id: 'emp001',
    name: '社員 花子',
    email: 'employee@company.com',
    password: 'emp123', // 本番では暗号化
    role: 'employee',
    department: '営業',
    position: '営業担当',
    teamIds: ['team002'],
    isActive: true,
    createdAt: new Date('2024-02-01'),
    lastLoginAt: new Date('2025-08-30')
  },
  {
    id: 'emp002',
    name: '鈴木 一郎',
    email: 'suzuki@company.com',
    password: 'suzuki123',
    role: 'employee',
    department: '開発',
    position: 'エンジニア',
    teamIds: ['team003'],
    isActive: true,
    createdAt: new Date('2024-03-01'),
    lastLoginAt: new Date('2025-08-29')
  }
];

const DEMO_TEAMS: Team[] = [
  {
    id: 'team001',
    name: 'IT部',
    description: 'システム管理・開発',
    color: '#3B82F6',
    memberIds: ['admin001'],
    leaderId: 'admin001',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'team002',
    name: '営業部',
    description: '営業・販売',
    color: '#10B981',
    memberIds: ['emp001'],
    leaderId: 'emp001',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'team003',
    name: '開発部',
    description: 'システム開発',
    color: '#8B5CF6',
    memberIds: ['emp002'],
    leaderId: 'emp002',
    createdAt: new Date('2024-01-01')
  }
];

const DEMO_TAGS: SystemTag[] = [
  {
    id: 'tag001',
    name: '緊急',
    color: '#DC2626',
    description: '緊急度の高いタスク',
    category: 'priority',
    isDefault: true,
    usageCount: 25,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'tag002',
    name: '開発',
    color: '#2563EB',
    description: '開発関連のタスク',
    category: 'project',
    isDefault: true,
    usageCount: 42,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'tag003',
    name: '営業',
    color: '#059669',
    description: '営業関連のタスク',
    category: 'department',
    isDefault: true,
    usageCount: 18,
    createdAt: new Date('2024-01-01')
  }
];

const LoginSystem: React.FC<LoginSystemProps> = ({ onLoginSuccess }) => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false
  });

  // 管理者パネル用の状態
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [teams, setTeams] = useState<Team[]>(DEMO_TEAMS);
  const [tags, setTags] = useState<SystemTag[]>(DEMO_TAGS);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'admin' | 'employee',
    department: '',
    position: '',
    teamIds: [] as string[]
  });

  // ローカルストレージから記憶されたメールアドレスを取得
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('taskapp_remembered_email');
    if (rememberedEmail) {
      setCredentials(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }));
    }
  }, []);

  // ============================================
  // ログイン処理
  // ============================================
  
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 入力値検証
      if (!credentials.email || !credentials.password) {
        throw new Error('メールアドレスとパスワードを入力してください');
      }

      // ユーザー認証
      const user = users.find(u => 
        u.email.toLowerCase() === credentials.email.toLowerCase() &&
        u.password === credentials.password &&
        u.isActive
      );

      if (!user) {
        throw new Error('メールアドレスまたはパスワードが正しくありません');
      }

      // Remember機能
      if (credentials.rememberMe) {
        localStorage.setItem('taskapp_remembered_email', credentials.email);
      } else {
        localStorage.removeItem('taskapp_remembered_email');
      }

      // ログイン成功
      const updatedUser = {
        ...user,
        lastLoginAt: new Date()
      };

      // 1秒の遅延でログイン感を演出
      setTimeout(() => {
        onLoginSuccess(updatedUser);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'ログインに失敗しました');
      setIsLoading(false);
    }
  }, [credentials, users, onLoginSuccess]);

  // ============================================
  // 新規ユーザー作成（管理者機能）
  // ============================================
  
  const handleCreateUser = useCallback(() => {
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      alert('必須項目を入力してください');
      return;
    }

    if (users.some(u => u.email === newUserForm.email)) {
      alert('このメールアドレスは既に使用されています');
      return;
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: newUserForm.name,
      email: newUserForm.email,
      password: newUserForm.password,
      role: newUserForm.role,
      department: newUserForm.department || undefined,
      position: newUserForm.position || undefined,
      teamIds: newUserForm.teamIds,
      isActive: true,
      createdAt: new Date()
    };

    setUsers(prev => [...prev, newUser]);
    setNewUserForm({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      department: '',
      position: '',
      teamIds: []
    });

    alert(`ユーザー「${newUser.name}」を作成しました`);
  }, [newUserForm, users]);

  // ============================================
  // レンダリング
  // ============================================
  
  if (showAdminPanel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl">
          {/* ヘッダー */}
          <div className="p-6 bg-blue-600 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8" />
                <div>
                  <h1 className="text-xl font-bold">管理者パネル</h1>
                  <p className="text-blue-100 text-sm">ユーザー・チーム・タグ管理</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminPanel(false)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-700 rounded-lg transition-colors"
              >
                ログイン画面に戻る
              </button>
            </div>
          </div>

          {/* 新規ユーザー作成フォーム */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              新規ユーザー作成
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="名前"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder="メールアドレス"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="password"
                placeholder="パスワード"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={newUserForm.role}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'employee' }))}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="employee">社員</option>
                <option value="admin">管理者</option>
              </select>
              <input
                type="text"
                placeholder="部署"
                value={newUserForm.department}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, department: e.target.value }))}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="役職"
                value={newUserForm.position}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, position: e.target.value }))}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="mt-4">
              <button
                onClick={handleCreateUser}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                ユーザー作成
              </button>
            </div>
          </div>

          {/* ユーザー一覧 */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              登録ユーザー ({users.length}名)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">名前</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">メール</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">権限</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">部署</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">最終ログイン</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {user.role === 'admin' ? (
                            <Shield className="w-4 h-4 text-blue-600" />
                          ) : (
                            <User className="w-4 h-4 text-green-600" />
                          )}
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'admin' ? '管理者' : '社員'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.lastLoginAt ? user.lastLoginAt.toLocaleDateString('ja-JP') : '未ログイン'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* ヘッダー */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">タスク管理システム</h1>
            <p className="text-gray-600">メールアドレスとパスワードでログイン</p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* ログインフォーム */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="パスワードを入力"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={credentials.rememberMe}
                  onChange={(e) => setCredentials(prev => ({ ...prev, rememberMe: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-600">メールアドレスを記憶</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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
          </form>

          {/* 管理者パネルリンク */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <button
              onClick={() => setShowAdminPanel(true)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto"
            >
              <Shield className="w-4 h-4" />
              管理者パネル
            </button>
          </div>

          {/* デモ用クイックログイン */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">デモ用アカウント</p>
            <div className="space-y-2">
              <button
                onClick={() => setCredentials({
                  email: 'admin@company.com',
                  password: 'admin123',
                  rememberMe: false
                })}
                className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">管理者</div>
                    <div className="text-sm text-blue-700">admin@company.com / admin123</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setCredentials({
                  email: 'employee@company.com',
                  password: 'emp123',
                  rememberMe: false
                })}
                className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900">社員</div>
                    <div className="text-sm text-green-700">employee@company.com / emp123</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* システム情報 */}
        <div className="px-8 pb-6 text-center text-sm text-gray-500">
          <p>Version 2.1 - ID/PW認証対応版</p>
        </div>
      </div>
    </div>
  );
};

export default LoginSystem;