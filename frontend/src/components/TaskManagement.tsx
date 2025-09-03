// frontend/src/components/TaskManagement.tsx - カンバンボード版
import React, { useState, useCallback, useMemo } from 'react';
import { 
  Plus, Edit3, Trash2, Save, X, Users, User, Calendar, 
  Tag, Hash, Filter, Search, MoreVertical, Clock,
  Building, Target, CheckCircle, AlertCircle, Star,
  ExternalLink, Link, Paperclip, FileText, Image,
  Globe, Eye, ChevronDown, ChevronRight, Settings
} from 'lucide-react';

// 型定義（見積時間削除）
interface Task {
  id: string;
  title: string;
  description: string;
  assigneeType: 'individual' | 'team' | 'company';
  assigneeIds: string[]; // 複数人対応
  assigneeNames: string[]; // 複数人対応
  teamId?: string;
  teamName?: string;
  createdBy: string;
  createdByName: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  tags: string[];
  relatedLinks: RelatedLink[];
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

// プロップス型定義
interface TaskManagementProps {
  currentUser: User;
}

// ステータス定義
const TASK_STATUSES = [
  { id: 'todo', name: '待機中', color: 'bg-gray-100', textColor: 'text-gray-700' },
  { id: 'in-progress', name: '進行中', color: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 'done', name: '完了', color: 'bg-green-100', textColor: 'text-green-700' },
  { id: 'blocked', name: 'ブロック', color: 'bg-red-100', textColor: 'text-red-700' }
] as const;

// デモデータ
const DEMO_TEAMS: Team[] = [
  { id: 'team001', name: 'コーポレート', code: 'CP', description: '企業戦略・法務', color: '#3B82F6', memberIds: ['user001', 'user006'], leaderId: 'user001' },
  { id: 'team002', name: 'マーケティング/PR', code: 'MK/PR', description: 'マーケティング・広報', color: '#10B981', memberIds: ['user002', 'user007'], leaderId: 'user002' },
  { id: 'team003', name: 'HR', code: 'HR', description: '人事・人材開発', color: '#F59E0B', memberIds: ['user003', 'user008'], leaderId: 'user003' },
  { id: 'team004', name: 'ビジネス開発', code: 'BC', description: '事業開発・営業', color: '#EF4444', memberIds: ['user005', 'user009'], leaderId: 'user005' }
];

const DEMO_USERS: User[] = [
  { id: 'user001', name: '田中太郎', email: 'tanaka@company.com', role: 'admin', teamIds: ['team001'], primaryTeamId: 'team001' },
  { id: 'user002', name: '佐藤花子', email: 'sato@company.com', role: 'employee', teamIds: ['team002'], primaryTeamId: 'team002' },
  { id: 'user003', name: '鈴木一郎', email: 'suzuki@company.com', role: 'employee', teamIds: ['team003'], primaryTeamId: 'team003' },
  { id: 'user005', name: '高橋美咲', email: 'takahashi@company.com', role: 'employee', teamIds: ['team004'], primaryTeamId: 'team004' },
  { id: 'user006', name: '渡辺健太', email: 'watanabe@company.com', role: 'employee', teamIds: ['team001'], primaryTeamId: 'team001' },
  { id: 'user007', name: '山田優子', email: 'yamada@company.com', role: 'employee', teamIds: ['team002'], primaryTeamId: 'team002' },
  { id: 'user008', name: '中村慎吾', email: 'nakamura@company.com', role: 'employee', teamIds: ['team003'], primaryTeamId: 'team003' },
  { id: 'user009', name: '小林あかり', email: 'kobayashi@company.com', role: 'employee', teamIds: ['team004'], primaryTeamId: 'team004' }
];

const DEMO_TASKS: Task[] = [
  {
    id: 'task001',
    title: '2025年度事業計画策定',
    description: '来年度の事業計画を策定し、各部門との調整を行う。市場調査、競合分析、売上目標設定などを含む包括的な計画作成が必要。',
    assigneeType: 'individual',
    assigneeIds: ['user001', 'user002'],
    assigneeNames: ['田中太郎', '佐藤花子'],
    createdBy: 'user001',
    createdByName: '田中太郎',
    dueDate: new Date('2025-09-15T19:00:00'),
    priority: 'high',
    status: 'in-progress',
    tags: ['戦略', '企画', '重要'],
    relatedLinks: [
      {
        id: 'link001',
        title: '事業計画テンプレート',
        url: 'https://docs.google.com/spreadsheets/d/sample',
        type: 'spreadsheet',
        description: '昨年度テンプレート',
        addedBy: 'user001',
        addedAt: new Date('2025-09-01')
      }
    ],
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date('2025-09-01')
  },
  {
    id: 'task002',
    title: 'マーケティング施策検討',
    description: '新商品のマーケティング戦略を立案し、具体的な施策を提案する。',
    assigneeType: 'team',
    assigneeIds: ['user002', 'user007'],
    assigneeNames: ['佐藤花子', '山田優子'],
    teamId: 'team002',
    teamName: 'マーケティング/PR',
    createdBy: 'user002',
    createdByName: '佐藤花子',
    dueDate: new Date('2025-09-20T19:00:00'),
    priority: 'medium',
    status: 'todo',
    tags: ['マーケティング', '新商品'],
    relatedLinks: [],
    createdAt: new Date('2025-09-02'),
    updatedAt: new Date('2025-09-02')
  },
  {
    id: 'task003',
    title: 'システムメンテナンス実施',
    description: 'サーバーの定期メンテナンスを実施する。',
    assigneeType: 'individual',
    assigneeIds: ['user006'],
    assigneeNames: ['渡辺健太'],
    createdBy: 'user001',
    createdByName: '田中太郎',
    dueDate: new Date('2025-09-10T19:00:00'),
    priority: 'high',
    status: 'done',
    tags: ['システム', 'メンテナンス'],
    relatedLinks: [],
    createdAt: new Date('2025-08-25'),
    updatedAt: new Date('2025-09-02')
  },
  {
    id: 'task004',
    title: 'クライアント提案書作成',
    description: '新規クライアント向けの提案書を作成する。',
    assigneeType: 'individual',
    assigneeIds: ['user005'],
    assigneeNames: ['高橋美咲'],
    createdBy: 'user005',
    createdByName: '高橋美咲',
    dueDate: new Date('2025-09-08T19:00:00'),
    priority: 'medium',
    status: 'blocked',
    tags: ['営業', '提案書'],
    relatedLinks: [
      {
        id: 'link002',
        title: '提案書テンプレート',
        url: 'https://docs.google.com/document/d/sample',
        type: 'document',
        description: '標準テンプレート',
        addedBy: 'user005',
        addedAt: new Date('2025-09-01')
      }
    ],
    createdAt: new Date('2025-08-28'),
    updatedAt: new Date('2025-09-01')
  }
];

const TaskManagement: React.FC<TaskManagementProps> = ({ currentUser }) => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [teams] = useState<Team[]>(DEMO_TEAMS);
  const [users] = useState<User[]>(DEMO_USERS);
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);
  
  // フィルター状態（タグフィルター追加）
  const [filter, setFilter] = useState({
    scope: 'all' as 'all' | 'my-assigned' | 'my-created' | 'company' | 'team' | 'individual',
    teamId: '',
    search: '',
    tags: [] as string[],
    priority: [] as string[],
    status: [] as string[],
    dateRange: 'all' as 'all' | 'overdue' | 'today' | 'within3days' | 'within7days' | 'longterm'
  });

  // UI状態
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null); // 詳細表示用
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  // 新規タスクフォーム（見積時間削除）
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    assigneeType: 'individual' as 'individual' | 'team' | 'company',
    selectedUserIds: [] as string[],
    teamId: '',
    dueDate: '',
    dueTime: '19:00', // デフォルト19:00
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: [] as string[],
    relatedLinks: [] as RelatedLink[]
  });

  // 関連リンクフォーム
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    type: 'external' as RelatedLink['type'],
    description: ''
  });

  // ============================================
  // フィルタリング処理（タグフィルター追加）
  // ============================================
  
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // スコープフィルタ
      switch (filter.scope) {
        case 'my-assigned':
          if (!task.assigneeIds.includes(currentUser.id)) return false;
          break;
        case 'my-created':
          if (task.createdBy !== currentUser.id) return false;
          break;
        case 'company':
          if (task.assigneeType !== 'company') return false;
          break;
        case 'team':
          if (task.assigneeType !== 'team') return false;
          break;
        case 'individual':
          if (task.assigneeType !== 'individual') return false;
          break;
      }

      // チームフィルタ
      if (filter.teamId && task.teamId !== filter.teamId) return false;

      // 検索フィルタ
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        if (!task.title.toLowerCase().includes(searchTerm) &&
            !task.description.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // タグフィルタ
      if (filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tag => task.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // 優先度フィルタ
      if (filter.priority.length > 0 && !filter.priority.includes(task.priority)) {
        return false;
      }

      // ステータスフィルタ
      if (filter.status.length > 0 && !filter.status.includes(task.status)) {
        return false;
      }

      // 期間フィルタ
      if (filter.dateRange !== 'all' && task.dueDate) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const taskDate = new Date(task.dueDate.getFullYear(), task.dueDate.getMonth(), task.dueDate.getDate());
        const diffDays = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

        switch (filter.dateRange) {
          case 'overdue':
            if (diffDays >= 0) return false;
            break;
          case 'today':
            if (diffDays !== 0) return false;
            break;
          case 'within3days':
            if (diffDays < 0 || diffDays > 3) return false;
            break;
          case 'within7days':
            if (diffDays < 0 || diffDays > 7) return false;
            break;
          case 'longterm':
            if (diffDays <= 7) return false;
            break;
        }
      }

      return true;
    });
  }, [tasks, filter, currentUser]);

  // ステータス別にタスクをグループ化
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    
    TASK_STATUSES.forEach(status => {
      grouped[status.id] = filteredTasks.filter(task => task.status === status.id);
    });

    return grouped;
  }, [filteredTasks]);

  // チーム別にグループ化されたユーザー
  const usersByTeam = useMemo(() => {
    const grouped: Record<string, User[]> = {};
    
    teams.forEach(team => {
      grouped[team.id] = users.filter(user => user.teamIds.includes(team.id));
    });

    return grouped;
  }, [users, teams]);

  // 全タグリスト
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(task => {
      task.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [tasks]);

  // ============================================
  // タスク操作
  // ============================================

  const createTask = useCallback(() => {
    if (!newTaskForm.title.trim()) {
      window.alert('タスク名を入力してください');
      return;
    }

    if (newTaskForm.assigneeType === 'individual' && newTaskForm.selectedUserIds.length === 0) {
      window.alert('担当者を選択してください');
      return;
    }

    let assigneeNames: string[] = [];
    if (newTaskForm.assigneeType === 'individual') {
      assigneeNames = users.filter(u => newTaskForm.selectedUserIds.includes(u.id)).map(u => u.name);
    } else if (newTaskForm.assigneeType === 'team') {
      const team = teams.find(t => t.id === newTaskForm.teamId);
      assigneeNames = team ? [team.name] : [];
    } else {
      assigneeNames = ['全社'];
    }

    const dueDateTime = newTaskForm.dueDate && newTaskForm.dueTime
      ? new Date(`${newTaskForm.dueDate}T${newTaskForm.dueTime}:00`)
      : undefined;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: newTaskForm.title,
      description: newTaskForm.description,
      assigneeType: newTaskForm.assigneeType,
      assigneeIds: newTaskForm.assigneeType === 'individual' ? newTaskForm.selectedUserIds : [],
      assigneeNames,
      teamId: newTaskForm.assigneeType === 'team' ? newTaskForm.teamId : undefined,
      teamName: newTaskForm.assigneeType === 'team' ? teams.find(t => t.id === newTaskForm.teamId)?.name : undefined,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      dueDate: dueDateTime,
      priority: newTaskForm.priority,
      status: 'todo',
      tags: newTaskForm.tags,
      relatedLinks: newTaskForm.relatedLinks,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setTasks(prev => [newTask, ...prev]);
    
    // フォームリセット
    setNewTaskForm({
      title: '',
      description: '',
      assigneeType: 'individual',
      selectedUserIds: [],
      teamId: '',
      dueDate: '',
      dueTime: '19:00',
      priority: 'medium',
      tags: [],
      relatedLinks: []
    });
    
    setShowNewTaskForm(false);
  }, [newTaskForm, users, teams, currentUser]);

  const deleteTask = useCallback((taskId: string) => {
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setShowTaskDetail(false);
      setSelectedTask(null);
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
        const names = task.assigneeNames.length > 2 
          ? `${task.assigneeNames.slice(0, 2).join(', ')} 他${task.assigneeNames.length - 2}名`
          : task.assigneeNames.join(', ');
        return { icon: User, text: names || '未設定', color: 'text-green-600' };
      default:
        return { icon: User, text: '未設定', color: 'text-gray-600' };
    }
  }, []);

  const getDueDateColor = useCallback((dueDate?: Date) => {
    if (!dueDate) return 'text-gray-500';
    
    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return 'text-red-600'; // 期限切れ
    if (diffDays === 0) return 'text-orange-600'; // 今日
    if (diffDays <= 3) return 'text-yellow-600'; // 3日以内
    return 'text-gray-500'; // それ以外
  }, []);

  // 複数人選択の切り替え
  const toggleUserSelection = useCallback((userId: string) => {
    setNewTaskForm(prev => ({
      ...prev,
      selectedUserIds: prev.selectedUserIds.includes(userId)
        ? prev.selectedUserIds.filter(id => id !== userId)
        : [...prev.selectedUserIds, userId]
    }));
  }, []);

  // タグ選択の切り替え
  const toggleTagFilter = useCallback((tag: string) => {
    setFilter(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  }, []);

  // タスク詳細表示
  const showTaskDetails = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  }, []);

  // ============================================
  // レンダリング
  // ============================================
  
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">タスク管理</h1>
          <p className="text-gray-600">個人・チーム・全社のタスクを統合管理</p>
        </div>
        
        <button
          onClick={() => setShowNewTaskForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新規タスク作成
        </button>
      </div>

      {/* フィルター（タグフィルター追加） */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">フィルター</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">表示範囲</label>
            <select
              value={filter.scope}
              onChange={(e) => setFilter(prev => ({ ...prev, scope: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="my-assigned">自分が担当</option>
              <option value="my-created">自分が依頼</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">期限</label>
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="overdue">期限切れ</option>
              <option value="today">今日期限</option>
              <option value="within3days">3日以内</option>
              <option value="within7days">7日以内</option>
              <option value="longterm">1週間以上</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">チーム</label>
            <select
              value={filter.teamId}
              onChange={(e) => setFilter(prev => ({ ...prev, teamId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">すべてのチーム</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* タグフィルター */}
        {allTags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">タグで絞り込み</label>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTagFilter(tag)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    filter.tags.includes(tag)
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
            {filter.tags.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-600">選択中:</span>
                <div className="flex flex-wrap gap-1">
                  {filter.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setFilter(prev => ({ ...prev, tags: [] }))}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  クリア
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* カンバンボード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TASK_STATUSES.map(status => (
          <div key={status.id} className="bg-white rounded-lg shadow-sm border">
            <div className={`p-4 ${status.color} rounded-t-lg`}>
              <h3 className={`font-semibold ${status.textColor} flex items-center justify-between`}>
                <span>{status.name}</span>
                <span className="text-sm bg-white bg-opacity-70 px-2 py-1 rounded-full">
                  {tasksByStatus[status.id]?.length || 0}
                </span>
              </h3>
            </div>
            
            <div className="p-4 space-y-3 min-h-[400px]">
              {tasksByStatus[status.id]?.map(task => {
                const assigneeDisplay = getAssigneeDisplay(task);
                const dueDateColor = getDueDateColor(task.dueDate);
                
                return (
                  <div
                    key={task.id}
                    onClick={() => showTaskDetails(task)}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <div className="space-y-3">
                      {/* タイトルと優先度 */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-gray-900 flex-1">{task.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                        </span>
                      </div>
                      
                      {/* 担当者 */}
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-medium text-gray-600">担当:</span>
                        <assigneeDisplay.icon className={`w-3 h-3 ${assigneeDisplay.color}`} />
                        <span className={`${assigneeDisplay.color} truncate`}>{assigneeDisplay.text}</span>
                      </div>
                      
                      {/* 依頼者 */}
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-medium text-gray-600">依頼:</span>
                        <span className="text-gray-700 truncate">{task.createdByName}</span>
                      </div>
                      
                      {/* 期限 */}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className={`w-3 h-3 ${dueDateColor}`} />
                          <span className={dueDateColor}>
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      )}
                      
                      {/* リンク情報 */}
                      {task.relatedLinks.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <Link className="w-3 h-3" />
                          <span>{task.relatedLinks.length}件のリンク</span>
                        </div>
                      )}
                      
                      {/* タグ */}
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                              #{tag}
                            </span>
                          ))}
                          {task.tags.length > 2 && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                              +{task.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* タスク詳細フローティングウィンドウ */}
      {showTaskDetail && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">タスク詳細</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTask.status}
                    onChange={(e) => updateTaskStatus(selectedTask.id, e.target.value as Task['status'])}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="todo">待機</option>
                    <option value="in-progress">進行中</option>
                    <option value="done">完了</option>
                    <option value="blocked">ブロック</option>
                  </select>
                  <button
                    onClick={() => deleteTask(selectedTask.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowTaskDetail(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* タイトルと優先度 */}
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h4>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    selectedTask.priority === 'high' ? 'bg-red-100 text-red-800' :
                    selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedTask.priority === 'high' ? '高優先度' : 
                     selectedTask.priority === 'medium' ? '中優先度' : '低優先度'}
                  </span>
                </div>

                {/* 基本情報 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const assigneeDisplay = getAssigneeDisplay(selectedTask);
                        return (
                          <>
                            <assigneeDisplay.icon className={`w-4 h-4 ${assigneeDisplay.color}`} />
                            <span className={assigneeDisplay.color}>{assigneeDisplay.text}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">依頼者</label>
                    <span className="text-gray-900">{selectedTask.createdByName}</span>
                  </div>
                  {selectedTask.dueDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">期限</label>
                      <span className={getDueDateColor(selectedTask.dueDate)}>
                        {formatDate(selectedTask.dueDate)}
                      </span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">作成日</label>
                    <span className="text-gray-900">{formatDate(selectedTask.createdAt)}</span>
                  </div>
                </div>

                {/* 説明 */}
                {selectedTask.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
                    <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedTask.description}</p>
                  </div>
                )}

                {/* タグ */}
                {selectedTask.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">タグ</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 関連リンク */}
                {selectedTask.relatedLinks.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">関連リンク</label>
                    <div className="space-y-2">
                      {selectedTask.relatedLinks.map(link => (
                        <div key={link.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div className="flex-1">
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-800"
                            >
                              {link.title}
                            </a>
                            {link.description && (
                              <p className="text-sm text-gray-500 mt-1">{link.description}</p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新規タスク作成フォーム（見積時間削除版） */}
      {showNewTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">新規タスク作成</h3>
                <button
                  onClick={() => setShowNewTaskForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">タスク名 *</label>
                  <input
                    type="text"
                    value={newTaskForm.title}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="タスクの名前を入力"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
                  <textarea
                    value={newTaskForm.description}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="タスクの詳細を入力"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">担当タイプ</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="individual"
                        checked={newTaskForm.assigneeType === 'individual'}
                        onChange={(e) => setNewTaskForm(prev => ({ ...prev, assigneeType: e.target.value as any }))}
                        className="mr-2"
                      />
                      個人（複数人可）
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="team"
                        checked={newTaskForm.assigneeType === 'team'}
                        onChange={(e) => setNewTaskForm(prev => ({ ...prev, assigneeType: e.target.value as any }))}
                        className="mr-2"
                      />
                      チーム
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="company"
                        checked={newTaskForm.assigneeType === 'company'}
                        onChange={(e) => setNewTaskForm(prev => ({ ...prev, assigneeType: e.target.value as any }))}
                        className="mr-2"
                      />
                      全社
                    </label>
                  </div>
                </div>

                {/* 個人選択（複数人・チーム別表示） */}
                {newTaskForm.assigneeType === 'individual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">担当者 *</label>
                    <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                      {teams.map(team => (
                        <div key={team.id} className="mb-4 last:mb-0">
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: team.color}}></div>
                            {team.name} ({team.code})
                          </h4>
                          <div className="space-y-2 ml-5">
                            {usersByTeam[team.id]?.map(user => (
                              <label key={user.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={newTaskForm.selectedUserIds.includes(user.id)}
                                  onChange={() => toggleUserSelection(user.id)}
                                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm">{user.name}</span>
                                {user.id === team.leaderId && (
                                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">リーダー</span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {newTaskForm.selectedUserIds.length > 0 && (
                      <p className="text-sm text-blue-600 mt-2">
                        {newTaskForm.selectedUserIds.length}人選択中
                      </p>
                    )}
                  </div>
                )}

                {/* チーム選択 */}
                {newTaskForm.assigneeType === 'team' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">担当チーム *</label>
                    <select
                      value={newTaskForm.teamId}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, teamId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">チームを選択</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">期限日</label>
                    <input
                      type="date"
                      value={newTaskForm.dueDate}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">期限時刻</label>
                    <input
                      type="time"
                      value={newTaskForm.dueTime}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, dueTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

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

                {/* タグ入力 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">タグ</label>
                  <input
                    type="text"
                    placeholder="カンマ区切りで入力（例: 企画,重要,新商品）"
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                      setNewTaskForm(prev => ({ ...prev, tags }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {newTaskForm.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {newTaskForm.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
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
        </div>
      )}
    </div>
  );
};

export default TaskManagement;