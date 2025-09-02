// frontend/src/components/AdminPanel.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { 
  Plus, Edit3, Trash2, Save, X, Users, User, Shield, 
  Mail, Phone, Building, Tag, Hash, Settings, Search,
  UserPlus, UserX, Eye, EyeOff, Check, AlertCircle,
  ChevronDown, ChevronRight, Filter, MoreVertical
} from 'lucide-react';

// 型定義
interface User {
  id: string;
  name: string;
  email: string;
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

// デモデータ
const DEMO_USERS: User[] = [
  {
    id: 'admin001',
    name: '管理者 太郎',
    email: 'admin@company.com',
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
    role: 'employee',
    department: '営業',
    position: '営業担当',
    teamIds: ['team002'],
    isActive: true,
    createdAt: new Date('2024-02-01'),
    lastLoginAt: new Date('2025-08-30')
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
  }
];

const AdminPanel: React.FC = () => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'tags'>('users');
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [teams, setTeams] = useState<Team[]>(DEMO_TEAMS);
  const [tags, setTags] = useState<SystemTag[]>(DEMO_TAGS);
  
  // フォーム状態
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'admin' | 'employee',
    department: '',
    position: '',
    teamIds: [] as string[]
  });
  
  const [newTeamForm, setNewTeamForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    memberIds: [] as string[],
    leaderId: ''
  });
  
  const [newTagForm, setNewTagForm] = useState({
    name: '',
    color: '#6B7280',
    description: '',
    category: 'custom' as 'priority' | 'department' | 'project' | 'status' | 'custom'
  });

  // 検索・フィルター
  const [userSearch, setUserSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  // ============================================
  // ユーザー管理
  // ============================================
  
  // 新規ユーザー作成
  const createUser = useCallback(() => {
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      window.alert('必須項目を入力してください');
      return;
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: newUserForm.name,
      email: newUserForm.email,
      role: newUserForm.role,
      department: newUserForm.department,
      position: newUserForm.position,
      teamIds: newUserForm.teamIds,
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: undefined
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
    setShowNewUserForm(false);
  }, [newUserForm]);

  // 新規チーム作成
  const createTeam = useCallback(() => {
    if (!newTeamForm.name) {
      window.alert('チーム名を入力してください');
      return;
    }

    const newTeam: Team = {
      id: `team_${Date.now()}`,
      name: newTeamForm.name,
      description: newTeamForm.description,
      color: newTeamForm.color,
      memberIds: newTeamForm.memberIds,
      leaderId: newTeamForm.leaderId || undefined,
      createdAt: new Date()
    };

    setTeams(prev => [...prev, newTeam]);
    setNewTeamForm({
      name: '',
      description: '',
      color: '#3B82F6',
      memberIds: [],
      leaderId: ''
    });
    setShowNewTeamForm(false);
  }, [newTeamForm]);

  // ユーザー削除
  const deleteUser = useCallback((userId: string) => {
    if (window.confirm('このユーザーを削除しますか？')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  }, []);

  // ユーザーアクティブ状態切り替え
  const toggleUserActive = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    ));
  }, []);

  // チーム削除
  const deleteTeam = useCallback((teamId: string) => {
    if (window.confirm('このチームを削除しますか？')) {
      setTeams(prev => prev.filter(t => t.id !== teamId));
      setUsers(prev => prev.map(u => ({
        ...u,
        teamIds: u.teamIds.filter(id => id !== teamId)
      })));
    }
  }, []);

  // 新規タグ作成
  const createTag = useCallback(() => {
    if (!newTagForm.name) {
      window.alert('タグ名を入力してください');
      return;
    }

    const newTag: SystemTag = {
      id: `tag_${Date.now()}`,
      name: newTagForm.name,
      color: newTagForm.color,
      description: newTagForm.description,
      category: newTagForm.category,
      isDefault: false,
      usageCount: 0,
      createdAt: new Date()
    };

    setTags(prev => [...prev, newTag]);
    setNewTagForm({
      name: '',
      color: '#6B7280',
      description: '',
      category: 'custom'
    });
    setShowNewTagForm(false);
  }, [newTagForm]);

  // タグ削除
  const deleteTag = useCallback((tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (tag?.isDefault) {
      window.alert('デフォルトタグは削除できません');
      return;
    }
    
    if (window.confirm('このタグを削除しますか？')) {
      setTags(prev => prev.filter(t => t.id !== tagId));
    }
  }, [tags]);

  // ============================================
  // フィルタリング
  // ============================================
  
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(userSearch.toLowerCase()))
    );
  }, [users, userSearch]);

  const filteredTeams = useMemo(() => {
    return teams.filter(team => 
      team.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
      (team.description && team.description.toLowerCase().includes(teamSearch.toLowerCase()))
    );
  }, [teams, teamSearch]);

  const filteredTags = useMemo(() => {
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
      (tag.description && tag.description.toLowerCase().includes(tagSearch.toLowerCase()))
    );
  }, [tags, tagSearch]);

  // ============================================
  // レンダリング
  // ============================================
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">管理者パネル</h1>
          <p className="text-gray-600">システム全体の設定とユーザー管理</p>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                ユーザー管理
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'teams'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                チーム管理
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'tags'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                タグ管理
              </div>
            </button>
          </div>
        </div>

        {/* ユーザー管理タブ */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* ユーザー管理ヘッダー */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">ユーザー管理</h2>
                <button
                  onClick={() => setShowNewUserForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  新規ユーザー作成
                </button>
              </div>
              
              {/* 検索 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ユーザー名、メール、部署で検索..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* ユーザー一覧 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <div className="grid gap-4">
                  {filteredUsers.map(user => (
                    <div key={user.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            user.role === 'admin' ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            {user.role === 'admin' ? (
                              <Shield className="w-5 h-5 text-blue-600" />
                            ) : (
                              <User className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          
                          <div>
                            <h3 className="font-medium text-gray-900">{user.name}</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-gray-500">{user.department}</span>
                              <span className="text-xs text-gray-500">{user.position}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                user.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.isActive ? 'アクティブ' : '無効'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleUserActive(user.id)}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              user.isActive
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {user.isActive ? '無効化' : '有効化'}
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 新規ユーザー作成フォーム */}
            {showNewUserForm && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">新規ユーザー作成</h3>
                  <button
                    onClick={() => setShowNewUserForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">氏名</label>
                    <input
                      type="text"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="山田 太郎"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
                    <input
                      type="email"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="yamada@company.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
                    <input
                      type="password"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="パスワード"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">権限</label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'employee' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="employee">社員</option>
                      <option value="admin">管理者</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">部署</label>
                    <input
                      type="text"
                      value={newUserForm.department}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="営業部"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">役職</label>
                    <input
                      type="text"
                      value={newUserForm.position}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="営業担当"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowNewUserForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={createUser}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    作成
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* チーム管理タブ */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">チーム管理</h2>
                <button
                  onClick={() => setShowNewTeamForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  新規チーム作成
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  placeholder="チーム名、説明で検索..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map(team => (
                <div key={team.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <h3 className="font-semibold text-gray-900">{team.name}</h3>
                    </div>
                    
                    <button
                      onClick={() => deleteTeam(team.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{team.description}</p>
                  
                  <div className="text-sm text-gray-500">
                    <div className="flex items-center gap-1 mb-1">
                      <Users className="w-4 h-4" />
                      メンバー: {team.memberIds.length}人
                    </div>
                    {team.leaderId && (
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        リーダー: {users.find(u => u.id === team.leaderId)?.name || '未設定'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 新規チーム作成フォーム */}
            {showNewTeamForm && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">新規チーム作成</h3>
                  <button
                    onClick={() => setShowNewTeamForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">チーム名</label>
                    <input
                      type="text"
                      value={newTeamForm.name}
                      onChange={(e) => setNewTeamForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="開発チーム"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">カラー</label>
                    <input
                      type="color"
                      value={newTeamForm.color}
                      onChange={(e) => setNewTeamForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
                    <input
                      type="text"
                      value={newTeamForm.description}
                      onChange={(e) => setNewTeamForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="チームの説明"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowNewTeamForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={createTeam}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    作成
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* タグ管理タブ */}
        {activeTab === 'tags' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">タグ管理</h2>
                <button
                  onClick={() => setShowNewTagForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  新規タグ作成
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="タグ名、説明で検索..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <div className="grid gap-4">
                  {filteredTags.map(tag => (
                    <div key={tag.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div 
                            className="px-3 py-1 rounded-full text-white text-sm font-medium"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600">{tag.description}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-gray-500">カテゴリ: {tag.category}</span>
                              <span className="text-xs text-gray-500">使用回数: {tag.usageCount}</span>
                              {tag.isDefault && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                  デフォルト
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {!tag.isDefault && (
                          <button
                            onClick={() => deleteTag(tag.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 新規タグ作成フォーム */}
            {showNewTagForm && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">新規タグ作成</h3>
                  <button
                    onClick={() => setShowNewTagForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">タグ名</label>
                    <input
                      type="text"
                      value={newTagForm.name}
                      onChange={(e) => setNewTagForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="新規プロジェクト"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">カラー</label>
                    <input
                      type="color"
                      value={newTagForm.color}
                      onChange={(e) => setNewTagForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
                    <select
                      value={newTagForm.category}
                      onChange={(e) => setNewTagForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="custom">カスタム</option>
                      <option value="priority">優先度</option>
                      <option value="department">部署</option>
                      <option value="project">プロジェクト</option>
                      <option value="status">ステータス</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
                    <input
                      type="text"
                      value={newTagForm.description}
                      onChange={(e) => setNewTagForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="タグの説明"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowNewTagForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={createTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    作成
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;