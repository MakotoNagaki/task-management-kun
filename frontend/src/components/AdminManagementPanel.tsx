// ディレクトリ: frontend/src/components/AdminManagementPanel.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { 
  Plus, Edit3, Trash2, Save, X, Users, User, Shield, 
  Mail, Building, Tag, Hash, Settings, Search,
  UserPlus, UserX, Check, AlertCircle, Eye, EyeOff,
  ChevronDown, ChevronRight, Filter, MoreVertical,
  Calendar, ListTodo, Target, BookmarkIcon,
  UserIcon, PencilIcon, CalendarIcon
} from 'lucide-react';

// 型定義
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
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
  isActive: boolean;
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

interface TodoItem {
  id: string;
  title: string;
  memo?: string;
  dueDate?: Date;
  type: 'daily' | 'spot';
  isCompleted: boolean;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  order: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assigneeIds: string[];
  assigneeNames: string[];
  createdBy: string;
  createdByName: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'pending-review' | 'done' | 'blocked';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// プロパティ
interface AdminManagementPanelProps {
  currentUser: User;
  users: User[];
  teams: Team[];
  tags: SystemTag[];
  todos: TodoItem[];
  tasks: Task[];
  onUserCreate: (user: User) => void;
  onUserUpdate: (user: User) => void;
  onUserDelete: (userId: string) => void;
  onTeamCreate: (team: Team) => void;
  onTeamUpdate: (team: Team) => void;
  onTeamDelete: (teamId: string) => void;
  onTagCreate: (tag: SystemTag) => void;
  onTagUpdate: (tag: SystemTag) => void;
  onTagDelete: (tagId: string) => void;
}

// スタイル定数
const FONT_STYLES = {
  body: 'font-sans',
  heading: 'font-medium',
  soft: 'tracking-wide leading-relaxed'
};

// チームカラーオプション
const TEAM_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
];

// タグカテゴリ
const TAG_CATEGORIES = [
  { id: 'priority', name: '優先度', color: '#EF4444' },
  { id: 'department', name: '部署', color: '#3B82F6' },
  { id: 'project', name: 'プロジェクト', color: '#10B981' },
  { id: 'status', name: 'ステータス', color: '#F59E0B' },
  { id: 'custom', name: 'カスタム', color: '#8B5CF6' }
];

const AdminManagementPanel: React.FC<AdminManagementPanelProps> = ({
  currentUser,
  users,
  teams,
  tags,
  todos,
  tasks,
  onUserCreate,
  onUserUpdate,
  onUserDelete,
  onTeamCreate,
  onTeamUpdate,
  onTeamDelete,
  onTagCreate,
  onTagUpdate,
  onTagDelete
}) => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'tags' | 'user-todos'>('users');
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // フォーム状態
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
    color: TEAM_COLORS[0],
    memberIds: [] as string[],
    leaderId: ''
  });
  
  const [newTagForm, setNewTagForm] = useState({
    name: '',
    color: '#6B7280',
    description: '',
    category: 'custom' as SystemTag['category']
  });

  // 検索・フィルター
  const [userSearch, setUserSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  // ============================================
  // ユーザー管理
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

    onUserCreate(newUser);
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
  }, [newUserForm, users, onUserCreate]);

  const handleToggleUserActive = useCallback((user: User) => {
    onUserUpdate({ ...user, isActive: !user.isActive });
  }, [onUserUpdate]);

  // ============================================
  // チーム管理
  // ============================================
  
  const handleCreateTeam = useCallback(() => {
    if (!newTeamForm.name) {
      alert('チーム名を入力してください');
      return;
    }

    if (teams.some(t => t.name === newTeamForm.name)) {
      alert('このチーム名は既に使用されています');
      return;
    }

    const newTeam: Team = {
      id: `team_${Date.now()}`,
      name: newTeamForm.name,
      description: newTeamForm.description || undefined,
      color: newTeamForm.color,
      memberIds: newTeamForm.memberIds,
      leaderId: newTeamForm.leaderId || undefined,
      isActive: true,
      createdAt: new Date()
    };

    onTeamCreate(newTeam);
    setNewTeamForm({
      name: '',
      description: '',
      color: TEAM_COLORS[0],
      memberIds: [],
      leaderId: ''
    });
    setShowNewTeamForm(false);
  }, [newTeamForm, teams, onTeamCreate]);

  const handleDeleteTeam = useCallback((teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team && confirm(`チーム「${team.name}」を削除しますか？`)) {
      onTeamDelete(teamId);
    }
  }, [teams, onTeamDelete]);

  // ============================================
  // タグ管理
  // ============================================
  
  const handleCreateTag = useCallback(() => {
    if (!newTagForm.name) {
      alert('タグ名を入力してください');
      return;
    }

    if (tags.some(t => t.name === newTagForm.name)) {
      alert('このタグ名は既に使用されています');
      return;
    }

    const newTag: SystemTag = {
      id: `tag_${Date.now()}`,
      name: newTagForm.name,
      color: newTagForm.color,
      description: newTagForm.description || undefined,
      category: newTagForm.category,
      isDefault: false,
      usageCount: 0,
      createdAt: new Date()
    };

    onTagCreate(newTag);
    setNewTagForm({
      name: '',
      color: '#6B7280',
      description: '',
      category: 'custom'
    });
    setShowNewTagForm(false);
  }, [newTagForm, tags, onTagCreate]);

  const handleDeleteTag = useCallback((tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (tag && !tag.isDefault && confirm(`タグ「${tag.name}」を削除しますか？`)) {
      onTagDelete(tagId);
    }
  }, [tags, onTagDelete]);

  // ============================================
  // フィルター済みデータ
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

  // 選択ユーザーのToDoとタスク
  const selectedUserData = useMemo(() => {
    if (!selectedUserId) return null;
    
    const user = users.find(u => u.id === selectedUserId);
    if (!user) return null;
    
    const userTodos = todos.filter(todo => todo.createdBy === selectedUserId);
    const userTasks = tasks.filter(task => 
      task.createdBy === selectedUserId || task.assigneeIds.includes(selectedUserId)
    );
    
    return { user, todos: userTodos, tasks: userTasks };
  }, [selectedUserId, users, todos, tasks]);

  // ============================================
  // コンポーネント
  // ============================================
  
  const UserCard: React.FC<{ user: User }> = ({ user }) => (
    <div className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
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
            <h3 className={`font-semibold text-gray-900 ${FONT_STYLES.heading}`}>{user.name}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            user.role === 'admin' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {user.role === 'admin' ? '管理者' : '社員'}
          </span>
          
          <button
            onClick={() => handleToggleUserActive(user)}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
              user.isActive
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            {user.isActive ? '有効' : '無効'}
          </button>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        {user.department && (
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-400" />
            <span>{user.department}{user.position && ` - ${user.position}`}</span>
          </div>
        )}
        
        {user.teamIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span>
              {user.teamIds.map(teamId => {
                const team = teams.find(t => t.id === teamId);
                return team ? team.name : teamId;
              }).join(', ')}
            </span>
          </div>
        )}
        
        {user.lastLoginAt && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>最終ログイン: {user.lastLoginAt.toLocaleDateString('ja-JP')}</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setSelectedUserId(user.id)}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
        >
          <Eye className="w-3 h-3" />
          ToDo確認
        </button>
        
        <button
          onClick={() => {
            if (confirm(`ユーザー「${user.name}」を削除しますか？`)) {
              onUserDelete(user.id);
            }
          }}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
          disabled={user.id === currentUser.id}
        >
          <Trash2 className="w-3 h-3" />
          削除
        </button>
      </div>
    </div>
  );

  const TeamCard: React.FC<{ team: Team }> = ({ team }) => (
    <div className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: team.color }}
          />
          <div>
            <h3 className={`font-semibold text-gray-900 ${FONT_STYLES.heading}`}>{team.name}</h3>
            {team.description && (
              <p className="text-sm text-gray-600">{team.description}</p>
            )}
          </div>
        </div>
        
        <button
          onClick={() => handleDeleteTeam(team.id)}
          className="p-1 text-red-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span>メンバー: {team.memberIds.length}名</span>
        </div>
        
        {team.leaderId && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span>
              リーダー: {users.find(u => u.id === team.leaderId)?.name || '不明'}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>作成日: {team.createdAt.toLocaleDateString('ja-JP')}</span>
        </div>
      </div>
    </div>
  );

  const TagCard: React.FC<{ tag: SystemTag }> = ({ tag }) => {
    const category = TAG_CATEGORIES.find(c => c.id === tag.category);
    
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <div>
              <h3 className={`font-semibold text-gray-900 ${FONT_STYLES.heading}`}>{tag.name}</h3>
              {tag.description && (
                <p className="text-sm text-gray-600">{tag.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {tag.isDefault && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                デフォルト
              </span>
            )}
            
            {!tag.isDefault && (
              <button
                onClick={() => handleDeleteTag(tag.id)}
                className="p-1 text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-gray-400" />
            <span>カテゴリ: {category?.name || tag.category}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-400" />
            <span>使用回数: {tag.usageCount}回</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>作成日: {tag.createdAt.toLocaleDateString('ja-JP')}</span>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // メインレンダリング
  // ============================================
  
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">管理者権限が必要です</p>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto ${FONT_STYLES.body}`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${FONT_STYLES.heading}`}>管理者パネル</h1>
        <p className="text-gray-600">ユーザー・チーム・タグを管理します</p>
      </div>

      {/* タブナビゲーション */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'users'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          ユーザー管理 ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'teams'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          チーム管理 ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'tags'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Tag className="w-4 h-4 inline mr-2" />
          タグ管理 ({tags.length})
        </button>
        <button
          onClick={() => setActiveTab('user-todos')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'user-todos'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ListTodo className="w-4 h-4 inline mr-2" />
          ユーザーToDo確認
        </button>
      </div>

      {/* ユーザー管理 */}
      {activeTab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ユーザーを検索..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowNewUserForm(true)}
              className="w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center shadow-md"
              title="新規ユーザー作成"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      )}

      {/* チーム管理 */}
      {activeTab === 'teams' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="チームを検索..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowNewTeamForm(true)}
              className="w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center shadow-md"
              title="新規チーム作成"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map(team => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </div>
      )}

      {/* タグ管理 */}
      {activeTab === 'tags' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="タグを検索..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowNewTagForm(true)}
              className="w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center shadow-md"
              title="新規タグ作成"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTags.map(tag => (
              <TagCard key={tag.id} tag={tag} />
            ))}
          </div>
        </div>
      )}

      {/* ユーザーToDo確認 */}
      {activeTab === 'user-todos' && (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ユーザーを選択
            </label>
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value || null)}
              className="w-full md:w-1/3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ユーザーを選択してください</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {selectedUserData && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${FONT_STYLES.heading}`}>
                  {selectedUserData.user.name}のToDo・タスク状況
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <ListTodo className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedUserData.todos.length}
                    </p>
                    <p className="text-sm text-blue-700">総ToDo数</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">
                      {selectedUserData.todos.filter(t => t.isCompleted).length}
                    </p>
                    <p className="text-sm text-green-700">完了ToDo</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedUserData.tasks.length}
                    </p>
                    <p className="text-sm text-purple-700">関連タスク</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* ToDo一覧 */}
                  <div>
                    <h4 className={`font-medium text-gray-900 mb-3 ${FONT_STYLES.heading}`}>ToDo一覧</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedUserData.todos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <ListTodo className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>ToDoがありません</p>
                        </div>
                      ) : (
                        selectedUserData.todos.map(todo => (
                          <div
                            key={todo.id}
                            className={`p-3 bg-gray-50 rounded-lg ${
                              todo.isCompleted ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                todo.isCompleted 
                                  ? 'bg-green-500 border-green-500 text-white' 
                                  : 'border-gray-300'
                              }`}>
                                {todo.isCompleted && <Check className="w-2 h-2" />}
                              </div>
                              
                              <div className="flex-1">
                                <div className={`font-medium ${
                                  todo.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                                }`}>
                                  {todo.title}
                                </div>
                                {todo.memo && (
                                  <div className="text-sm text-gray-600">{todo.memo}</div>
                                )}
                                {todo.dueDate && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    {new Date(todo.dueDate).toLocaleString('ja-JP')}
                                  </div>
                                )}
                              </div>
                              
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                todo.type === 'daily' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {todo.type === 'daily' ? 'デイリー' : 'スポット'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* タスク一覧 */}
                  <div>
                    <h4 className={`font-medium text-gray-900 mb-3 ${FONT_STYLES.heading}`}>関連タスク</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedUserData.tasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>関連タスクがありません</p>
                        </div>
                      ) : (
                        selectedUserData.tasks.map(task => (
                          <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className={`font-medium text-gray-900 ${FONT_STYLES.heading}`}>
                                {task.title}
                              </h5>
                              <div className="flex gap-1">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  task.status === 'done' ? 'bg-green-100 text-green-800' :
                                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                  task.status === 'pending-review' ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {task.status === 'done' ? '完了' :
                                   task.status === 'in-progress' ? '進行中' :
                                   task.status === 'pending-review' ? '確認待ち' : '待機中'}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {task.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <UserIcon className="w-3 h-3" />
                                <span>
                                  {task.createdBy === selectedUserId ? '作成者' : '担当者'}
                                </span>
                              </div>
                              
                              {task.dueDate && (
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="w-3 h-3" />
                                  <span>{new Date(task.dueDate).toLocaleDateString('ja-JP')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 新規ユーザー作成モーダル */}
      {showNewUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
             onClick={(e) => e.target === e.currentTarget && setShowNewUserForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold text-gray-900 ${FONT_STYLES.heading}`}>新規ユーザー作成</h2>
                <button
                  onClick={() => setShowNewUserForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">名前 *</label>
                  <input
                    type="text"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="山田太郎"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス *</label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="yamada@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">パスワード *</label>
                  <input
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="パスワードを入力"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">権限</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'employee' }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="営業部"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">役職</label>
                  <input
                    type="text"
                    value={newUserForm.position}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="主任"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">所属チーム</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {teams.map(team => (
                    <label key={team.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newUserForm.teamIds.includes(team.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUserForm(prev => ({ 
                              ...prev, 
                              teamIds: [...prev.teamIds, team.id] 
                            }));
                          } else {
                            setNewUserForm(prev => ({ 
                              ...prev, 
                              teamIds: prev.teamIds.filter(id => id !== team.id) 
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">{team.name}</span>
                    </label>
                  ))}
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
                  onClick={handleCreateUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  作成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新規チーム作成モーダル */}
      {showNewTeamForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
             onClick={(e) => e.target === e.currentTarget && setShowNewTeamForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold text-gray-900 ${FONT_STYLES.heading}`}>新規チーム作成</h2>
                <button
                  onClick={() => setShowNewTeamForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">チーム名 *</label>
                    <input
                      type="text"
                      value={newTeamForm.name}
                      onChange={(e) => setNewTeamForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="開発チーム"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">チームカラー</label>
                    <div className="flex gap-2">
                      {TEAM_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewTeamForm(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newTeamForm.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
                  <textarea
                    value={newTeamForm.description}
                    onChange={(e) => setNewTeamForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="チームの説明を入力してください（任意）"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">リーダー</label>
                  <select
                    value={newTeamForm.leaderId}
                    onChange={(e) => setNewTeamForm(prev => ({ ...prev, leaderId: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">リーダーを選択（任意）</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">メンバー</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {users.map(user => (
                      <label key={user.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newTeamForm.memberIds.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTeamForm(prev => ({ 
                                ...prev, 
                                memberIds: [...prev.memberIds, user.id] 
                              }));
                            } else {
                              setNewTeamForm(prev => ({ 
                                ...prev, 
                                memberIds: prev.memberIds.filter(id => id !== user.id) 
                              }));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">{user.name}</span>
                      </label>
                    ))}
                  </div>
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
                  onClick={handleCreateTeam}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  作成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新規タグ作成モーダル */}
      {showNewTagForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
             onClick={(e) => e.target === e.currentTarget && setShowNewTagForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold text-gray-900 ${FONT_STYLES.heading}`}>新規タグ作成</h2>
                <button
                  onClick={() => setShowNewTagForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">タグ名 *</label>
                  <input
                    type="text"
                    value={newTagForm.name}
                    onChange={(e) => setNewTagForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="緊急"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
                    <select
                      value={newTagForm.category}
                      onChange={(e) => setNewTagForm(prev => ({ ...prev, category: e.target.value as SystemTag['category'] }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {TAG_CATEGORIES.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">カラー</label>
                    <input
                      type="color"
                      value={newTagForm.color}
                      onChange={(e) => setNewTagForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-12 p-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
                  <textarea
                    value={newTagForm.description}
                    onChange={(e) => setNewTagForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="タグの説明を入力してください（任意）"
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
                  onClick={handleCreateTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  作成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagementPanel;