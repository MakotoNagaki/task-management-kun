// frontend/src/components/TaskManagement.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { 
  Plus, Edit3, Trash2, Save, X, Users, User, Calendar, 
  Tag, Hash, Filter, Search, MoreVertical, Clock,
  Building, Target, CheckCircle, AlertCircle, Star,
  ExternalLink, Link, Paperclip, FileText, Image,
  Globe, Eye, ChevronDown, ChevronRight, Settings
} from 'lucide-react';

// 型定義
interface Task {
  id: string;
  title: string;
  description: string;
  assigneeType: 'individual' | 'team' | 'company';
  assigneeId?: string;
  assigneeName?: string;
  teamId?: string;
  teamName?: string;
  createdBy: string;
  createdByName: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  tags: string[];
  relatedLinks: RelatedLink[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface RelatedLink {
  id: string;
  title: string;
  url: string;
  type: 'spreadsheet' | 'document' | 'presentation' | 'external' | 'slack';
  description?: string;
  addedBy: string;
  addedAt: Date;
}

interface Team {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  memberIds: string[];
  leaderId?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  teamIds: string[];
  primaryTeamId?: string;
}

// デモデータ
const DEMO_TEAMS: Team[] = [
  { id: 'team001', name: 'コーポレート', code: 'CP', description: '企業戦略・法務', color: '#3B82F6', memberIds: ['user001'], leaderId: 'user001' },
  { id: 'team002', name: 'マーケティング/PR', code: 'MK/PR', description: 'マーケティング・広報', color: '#10B981', memberIds: ['user002'], leaderId: 'user002' },
  { id: 'team003', name: 'HR', code: 'HR', description: '人事・人材開発', color: '#F59E0B', memberIds: ['user003'], leaderId: 'user003' },
  { id: 'team004', name: 'ビジネス開発', code: 'BC', description: '事業開発・営業', color: '#EF4444', memberIds: ['user005'], leaderId: 'user005' }
];

const DEMO_USERS: User[] = [
  { id: 'user001', name: '田中太郎', email: 'tanaka@company.com', role: 'admin', teamIds: ['team001'], primaryTeamId: 'team001' },
  { id: 'user002', name: '佐藤花子', email: 'sato@company.com', role: 'employee', teamIds: ['team002'], primaryTeamId: 'team002' },
  { id: 'user003', name: '鈴木一郎', email: 'suzuki@company.com', role: 'employee', teamIds: ['team003'], primaryTeamId: 'team003' }
];

const DEMO_TASKS: Task[] = [
  {
    id: 'task001',
    title: '2025年度事業計画策定',
    description: '来年度の事業計画を策定し、各部門との調整を行う',
    assigneeType: 'company',
    createdBy: 'user001',
    createdByName: '田中太郎',
    dueDate: new Date('2025-09-15'),
    priority: 'high',
    status: 'in-progress',
    tags: ['戦略', '企画'],
    relatedLinks: [
      {
        id: 'link001',
        title: '事業計画テンプレート',
        url: 'https://docs.google.com/spreadsheets/d/1234567890',
        type: 'spreadsheet',
        description: '過去の事業計画データ',
        addedBy: 'user001',
        addedAt: new Date('2025-09-01')
      }
    ],
    estimatedHours: 40,
    actualHours: 15,
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date('2025-09-01')
  }
];

const TaskManagement: React.FC = () => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [currentUser] = useState<User>(DEMO_USERS[0]);
  const [teams] = useState<Team[]>(DEMO_TEAMS);
  const [users] = useState<User[]>(DEMO_USERS);
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);
  
  // フィルター状態
  const [filter, setFilter] = useState({
    scope: 'all' as 'all' | 'company' | 'team' | 'individual',
    teamId: '',
    search: '',
    priority: [] as string[],
    status: [] as string[],
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month'
  });

  // UI状態
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // 新規タスクフォーム
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    assigneeType: 'individual' as 'individual' | 'team' | 'company',
    assigneeId: '',
    teamId: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: [] as string[],
    estimatedHours: '',
    relatedLinks: [] as RelatedLink[]
  });

  // 関連リンクフォーム
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    type: 'external' as 'spreadsheet' | 'document' | 'presentation' | 'external' | 'slack',
    description: ''
  });

  // ============================================
  // フィルタリング
  // ============================================
  
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    if (filter.scope !== 'all') {
      filtered = filtered.filter(task => {
        if (filter.scope === 'company') return task.assigneeType === 'company';
        if (filter.scope === 'team') return task.assigneeType === 'team';
        if (filter.scope === 'individual') return task.assigneeType === 'individual';
        return true;
      });
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [tasks, filter]);

  // ============================================
  // タスク操作
  // ============================================
  
  const createTask = useCallback(() => {
    if (!newTaskForm.title) {
      window.alert('タスクタイトルを入力してください');
      return;
    }

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: newTaskForm.title,
      description: newTaskForm.description,
      assigneeType: newTaskForm.assigneeType,
      assigneeId: newTaskForm.assigneeType === 'individual' ? newTaskForm.assigneeId : undefined,
      assigneeName: newTaskForm.assigneeType === 'individual' 
        ? users.find(u => u.id === newTaskForm.assigneeId)?.name 
        : undefined,
      teamId: newTaskForm.assigneeType === 'team' ? newTaskForm.teamId : undefined,
      teamName: newTaskForm.assigneeType === 'team' 
        ? teams.find(t => t.id === newTaskForm.teamId)?.name 
        : undefined,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      dueDate: newTaskForm.dueDate ? new Date(newTaskForm.dueDate) : undefined,
      priority: newTaskForm.priority,
      status: 'todo',
      tags: newTaskForm.tags,
      relatedLinks: newTaskForm.relatedLinks,
      estimatedHours: newTaskForm.estimatedHours ? parseInt(newTaskForm.estimatedHours) : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskForm({
      title: '',
      description: '',
      assigneeType: 'individual',
      assigneeId: '',
      teamId: '',
      dueDate: '',
      priority: 'medium',
      tags: [],
      estimatedHours: '',
      relatedLinks: []
    });
    setShowNewTaskForm(false);
  }, [newTaskForm, users, teams, currentUser]);

  const deleteTask = useCallback((taskId: string) => {
    if (window.confirm('このタスクを削除しますか？')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  }, []);

  const updateTaskStatus = useCallback((taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date() } : t
    ));
  }, []);

  const addRelatedLink = useCallback(() => {
    if (!linkForm.title || !linkForm.url) {
      window.alert('タイトルとURLを入力してください');
      return;
    }

    const newLink: RelatedLink = {
      id: `link_${Date.now()}`,
      title: linkForm.title,
      url: linkForm.url,
      type: linkForm.type,
      description: linkForm.description,
      addedBy: currentUser.id,
      addedAt: new Date()
    };

    setNewTaskForm(prev => ({
      ...prev,
      relatedLinks: [...prev.relatedLinks, newLink]
    }));

    setLinkForm({
      title: '',
      url: '',
      type: 'external',
      description: ''
    });
    setShowLinkForm(false);
  }, [linkForm, currentUser]);

  const toggleTaskExpansion = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getAssigneeDisplay = useCallback((task: Task) => {
    switch (task.assigneeType) {
      case 'company':
        return { icon: Globe, text: '全社', color: 'text-purple-600' };
      case 'team':
        return { icon: Users, text: task.teamName || '未設定', color: 'text-blue-600' };
      case 'individual':
        return { icon: User, text: task.assigneeName || '未設定', color: 'text-green-600' };
      default:
        return { icon: User, text: '未設定', color: 'text-gray-600' };
    }
  }, []);

  // ============================================
  // レンダリング
  // ============================================
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">タスク管理システム</h1>
              <p className="text-gray-600">全社・チーム・個人のタスクを統合管理</p>
            </div>
            
            <button
              onClick={() => setShowNewTaskForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新規タスク作成
            </button>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">フィルター</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">表示範囲</label>
              <select
                value={filter.scope}
                onChange={(e) => setFilter(prev => ({ ...prev, scope: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">すべて</option>
                <option value="company">全社タスク</option>
                <option value="team">チームタスク</option>
                <option value="individual">個人タスク</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">検索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="タスク名、説明で検索..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">期間</label>
              <select
                value={filter.dateRange}
                onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">すべて</option>
                <option value="today">今日</option>
                <option value="week">1週間以内</option>
                <option value="month">1ヶ月以内</option>
              </select>
            </div>
          </div>
        </div>

        {/* タスク一覧 */}
        <div className="space-y-4">
          {filteredTasks.map(task => {
            const assigneeDisplay = getAssigneeDisplay(task);
            const isExpanded = expandedTasks.has(task.id);
            
            return (
              <div key={task.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => toggleTaskExpansion(task.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                        </span>
                        
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.status === 'todo' ? 'bg-gray-100 text-gray-800' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'done' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {task.status === 'todo' ? '未着手' :
                           task.status === 'in-progress' ? '進行中' :
                           task.status === 'done' ? '完了' : 'ブロック中'}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{task.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <assigneeDisplay.icon className={`w-4 h-4 ${assigneeDisplay.color}`} />
                          {assigneeDisplay.text}
                        </div>
                        
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(task.dueDate)}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          作成: {task.createdByName}
                        </div>
                      </div>
                      
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {task.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as Task['status'])}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="todo">未着手</option>
                        <option value="in-progress">進行中</option>
                        <option value="done">完了</option>
                        <option value="blocked">ブロック中</option>
                      </select>
                      
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* 展開時の詳細情報 */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      {task.relatedLinks.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">関連リンク</h4>
                          <div className="space-y-2">
                            {task.relatedLinks.map(link => (
                              <div key={link.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <div className="flex-1">
                                  <a 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                  >
                                    {link.title}
                                  </a>
                                  {link.description && (
                                    <p className="text-xs text-gray-500">{link.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 新規タスク作成フォーム */}
        {showNewTaskForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">新規タスク作成</h2>
                  <button
                    onClick={() => setShowNewTaskForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">タスクタイトル</label>
                    <input
                      type="text"
                      value={newTaskForm.title}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="タスクのタイトル"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">詳細説明</label>
                    <textarea
                      value={newTaskForm.description}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="タスクの詳細説明"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">担当者タイプ</label>
                      <select
                        value={newTaskForm.assigneeType}
                        onChange={(e) => setNewTaskForm(prev => ({ 
                          ...prev, 
                          assigneeType: e.target.value as any,
                          assigneeId: '',
                          teamId: ''
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="individual">個人</option>
                        <option value="team">チーム</option>
                        <option value="company">全社</option>
                      </select>
                    </div>
                    
                    {newTaskForm.assigneeType === 'individual' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">担当者</label>
                        <select
                          value={newTaskForm.assigneeId}
                          onChange={(e) => setNewTaskForm(prev => ({ ...prev, assigneeId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">担当者を選択</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {newTaskForm.assigneeType === 'team' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">チーム</label>
                        <select
                          value={newTaskForm.teamId}
                          onChange={(e) => setNewTaskForm(prev => ({ ...prev, teamId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">チームを選択</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name} ({team.code})</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">期限</label>
                      <input
                        type="datetime-local"
                        value={newTaskForm.dueDate}
                        onChange={(e) => setNewTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">優先度</label>
                      <select
                        value={newTaskForm.priority}
                        onChange={(e) => setNewTaskForm(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">低</option>
                        <option value="medium">中</option>
                        <option value="high">高</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">見積時間（時間）</label>
                      <input
                        type="number"
                        value={newTaskForm.estimatedHours}
                        onChange={(e) => setNewTaskForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="8"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>

                  {/* 関連リンク */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">関連リンク</label>
                      <button
                        onClick={() => setShowLinkForm(true)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        リンク追加
                      </button>
                    </div>
                    
                    {newTaskForm.relatedLinks.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {newTaskForm.relatedLinks.map(link => (
                          <div key={link.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <Paperclip className="w-4 h-4 text-gray-600" />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">{link.title}</div>
                              <div className="text-xs text-gray-500">{link.url}</div>
                            </div>
                            <button
                              onClick={() => setNewTaskForm(prev => ({
                                ...prev,
                                relatedLinks: prev.relatedLinks.filter(l => l.id !== link.id)
                              }))}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {showLinkForm && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={linkForm.title}
                            onChange={(e) => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="リンクタイトル"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="url"
                            value={linkForm.url}
                            onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={addRelatedLink}
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                          >
                            追加
                          </button>
                          <button
                            onClick={() => setShowLinkForm(false)}
                            className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setShowNewTaskForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={createTask}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    タスク作成
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManagement;