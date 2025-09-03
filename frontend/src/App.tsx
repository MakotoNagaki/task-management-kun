import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Target, MessageSquare, Shield, Home, LogOut, 
  BarChart3, Calendar, Bell, Settings, Users, User,
  ListTodo, Plus, Clock, CheckCircle, AlertCircle,
  Filter, Search, X, ChevronDown, ChevronRight,
  Play, Pause, Eye, RotateCcw, Check, UserCheck,
  Save, Edit3, Trash2, Star, Copy, ExternalLink,
  Tag, FileText, Link, History, Archive
} from 'lucide-react';

// 型定義
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  department?: string;
  position?: string;
  avatar?: string;
  teamIds: string[];
  primaryTeamId?: string;
  isActive: boolean;
  createdAt: Date;
  todoSettings: {
    notificationEnabled: boolean;
    notificationTime?: string;
    autoCreateFromTemplate: boolean;
    dailyTemplateCreationTime?: string;
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  assigneeType: 'individual' | 'team' | 'company';
  assigneeIds: string[];
  assigneeNames: string[];
  teamId?: string;
  teamName?: string;
  createdBy: string;
  createdByName: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'pending-review' | 'done' | 'blocked';
  tags: string[];
  relatedLinks: RelatedLink[];
  createdAt: Date;
  updatedAt: Date;
  completedBy?: string;
  reviewedBy?: string;
  reviewComment?: string;
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

interface TodoItem {
  id: string;
  title: string;
  memo?: string;
  dueDate?: Date;
  isCompleted: boolean;
  type: 'daily' | 'spot';
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  templateId?: string;
  order: number;
}

interface TodoTemplate {
  id: string;
  title: string;
  memo?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  dayOfWeek?: number[];
  order: number;
}

interface Team {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  memberIds: string[];
  leaderId?: string;
  isActive: boolean;
  createdAt: Date;
}

// 定数
const TASK_STATUSES = [
  {
    id: 'todo',
    name: '待機中',
    color: 'bg-gray-200',
    textColor: 'text-gray-800',
    description: 'まだ開始していないタスク'
  },
  {
    id: 'in-progress',
    name: '進行中',
    color: 'bg-blue-200',
    textColor: 'text-blue-800',
    description: '現在作業中のタスク'
  },
  {
    id: 'pending-review',
    name: '確認待ち',
    color: 'bg-orange-200',
    textColor: 'text-orange-800',
    description: '完了したが確認待ちのタスク'
  },
  {
    id: 'done',
    name: '完了',
    color: 'bg-green-200',
    textColor: 'text-green-800',
    description: '完了・承認されたタスク'
  },
  {
    id: 'blocked',
    name: 'ブロック',
    color: 'bg-red-200',
    textColor: 'text-red-800',
    description: '何らかの理由で進行できないタスク'
  }
];

const PRIORITY_LEVELS = [
  { id: 'low', name: '低', color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 'medium', name: '中', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { id: 'high', name: '高', color: 'text-red-600', bgColor: 'bg-red-100' }
];

const DAYS_OF_WEEK = [
  { id: 0, name: '日', short: '日' },
  { id: 1, name: '月', short: '月' },
  { id: 2, name: '火', short: '火' },
  { id: 3, name: '水', short: '水' },
  { id: 4, name: '木', short: '木' },
  { id: 5, name: '金', short: '金' },
  { id: 6, name: '土', short: '土' }
];

// デモデータ
const DEMO_USERS: User[] = [
  { 
    id: 'user001', 
    name: '田中太郎', 
    email: 'tanaka@company.com', 
    role: 'admin', 
    department: '経営企画', 
    position: '部長',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
    teamIds: ['team001'], 
    primaryTeamId: 'team001',
    isActive: true,
    createdAt: new Date(),
    todoSettings: {
      notificationEnabled: true,
      notificationTime: '09:00',
      autoCreateFromTemplate: true,
      dailyTemplateCreationTime: '00:00'
    }
  },
  { 
    id: 'user002', 
    name: '佐藤花子', 
    email: 'sato@company.com', 
    role: 'member', 
    department: 'マーケティング', 
    position: '主任',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
    teamIds: ['team002'], 
    primaryTeamId: 'team002',
    isActive: true,
    createdAt: new Date(),
    todoSettings: {
      notificationEnabled: true,
      notificationTime: '08:30',
      autoCreateFromTemplate: true,
      dailyTemplateCreationTime: '00:00'
    }
  },
  { 
    id: 'user003', 
    name: '鈴木一郎', 
    email: 'suzuki@company.com', 
    role: 'member', 
    department: '開発', 
    position: 'エンジニア',
    teamIds: ['team003'], 
    primaryTeamId: 'team003',
    isActive: true,
    createdAt: new Date(),
    todoSettings: {
      notificationEnabled: true,
      notificationTime: '10:00',
      autoCreateFromTemplate: true,
      dailyTemplateCreationTime: '00:00'
    }
  }
];

// メインアプリケーション
const App: React.FC = () => {
  // ============================================
  // 基本状態管理
  // ============================================
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'tasks' | 'settings'>('dashboard');
  const [activeTab, setActiveTab] = useState<'kanban' | 'todo'>('kanban');
  
  // データ状態
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todoTemplates, setTodoTemplates] = useState<TodoTemplate[]>([]);
  
  // UI状態
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // フィルター状態
  const [filter, setFilter] = useState({
    scope: 'all',
    status: [],
    searchTerm: '',
    tags: [],
    priority: [],
    dueDateRange: 'all'
  });

  // ドラッグ＆ドロップ状態
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // 通知状態
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    createdAt: Date;
  }>>([]);

  // ============================================
  // 通知システム
  // ============================================
  
  const showNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const notification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date()
    };
    
    setNotifications(prev => [notification, ...prev].slice(0, 20));
    
    // ブラウザ通知
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { 
        body: message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showNotification('通知設定', 'デスクトップ通知が有効になりました', 'success');
      }
    }
  }, [showNotification]);

  // ============================================
  // 認証処理
  // ============================================
  
  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setShowLoginModal(false);
    
    // サンプルデータを初期化
    initializeSampleData(user);
    
    // 通知権限を要求
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setShowLoginModal(true);
    setActiveScreen('dashboard');
    setTasks([]);
    setTodos([]);
    setTodoTemplates([]);
  }, []);

  const initializeSampleData = useCallback((user: User) => {
    // サンプルタスクデータ
    const sampleTasks: Task[] = [
      {
        id: 'task001',
        title: '2025年度事業計画策定',
        description: '来年度の事業計画を策定し、各部門との調整を行う。市場調査、競合分析、売上目標設定などを含む包括的な計画作成が必要。',
        assigneeType: 'individual',
        assigneeIds: [user.id],
        assigneeNames: [user.name],
        createdBy: user.id,
        createdByName: user.name,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        priority: 'high',
        status: 'in-progress',
        tags: ['戦略', '企画', '重要'],
        relatedLinks: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'task002',
        title: 'システム改修作業',
        description: '既存システムの改修を行い、パフォーマンスを向上させる。',
        assigneeType: 'individual',
        assigneeIds: [user.id],
        assigneeNames: [user.name],
        createdBy: user.id,
        createdByName: user.name,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        status: 'pending-review',
        tags: ['開発', 'システム'],
        relatedLinks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        completedBy: user.id,
        reviewComment: '動作確認をお願いします'
      },
      {
        id: 'task003',
        title: 'クライアント提案書作成',
        description: '新規クライアント向けの提案書を作成する。',
        assigneeType: 'individual',
        assigneeIds: [user.id],
        assigneeNames: [user.name],
        createdBy: user.id,
        createdByName: user.name,
        dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2時間前（期限切れ）
        priority: 'high',
        status: 'in-progress',
        tags: ['営業', '提案'],
        relatedLinks: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // サンプルToDoデータ
    const sampleTodos: TodoItem[] = [
      {
        id: 'todo001',
        title: 'メールチェック',
        memo: '重要なメールと未読メールを確認',
        type: 'daily',
        isCompleted: false,
        createdBy: user.id,
        createdAt: new Date(),
        order: 1
      },
      {
        id: 'todo002',
        title: 'プレゼン資料作成',
        memo: '来週の重要会議用',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        type: 'spot',
        isCompleted: false,
        createdBy: user.id,
        createdAt: new Date(),
        order: 2
      }
    ];

    // サンプルテンプレートデータ
    const sampleTemplates: TodoTemplate[] = [
      {
        id: 'template001',
        title: 'メールチェック',
        memo: '重要なメールと未読メールを確認',
        isActive: true,
        createdBy: user.id,
        createdAt: new Date(),
        dayOfWeek: [1, 2, 3, 4, 5], // 平日のみ
        order: 1
      },
      {
        id: 'template002',
        title: '日次報告書作成',
        memo: '昨日の実績と今日の予定をまとめる',
        isActive: true,
        createdBy: user.id,
        createdAt: new Date(),
        dayOfWeek: [], // 毎日
        order: 2
      }
    ];

    setTasks(sampleTasks);
    setTodos(sampleTodos);
    setTodoTemplates(sampleTemplates);
  }, []);

  // ============================================
  // 統計計算
  // ============================================
  
  const stats = useMemo(() => {
    if (!currentUser) return null;
    
    const myTasks = tasks.filter(task => task.assigneeIds.includes(currentUser.id));
    const myTodos = todos.filter(todo => todo.createdBy === currentUser.id);
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const todayTodos = myTodos.filter(t => {
      if (t.type === 'daily') return new Date(t.createdAt) >= todayStart;
      if (t.dueDate) {
        const dueDate = new Date(t.dueDate);
        return dueDate >= todayStart && dueDate < todayEnd;
      }
      return new Date(t.createdAt) >= todayStart;
    });
    
    return {
      totalTasks: myTasks.length,
      completedTasks: myTasks.filter(t => t.status === 'done').length,
      pendingReview: myTasks.filter(t => t.status === 'pending-review').length,
      overdueTasks: myTasks.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'done').length,
      todayTodos: todayTodos.length,
      completedTodos: todayTodos.filter(t => t.isCompleted).length,
      completionRate: myTasks.length > 0 ? Math.round((myTasks.filter(t => t.status === 'done').length / myTasks.length) * 100) : 0
    };
  }, [tasks, todos, currentUser]);

  // フィルター済みタスク
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter.scope === 'personal' && !task.assigneeIds.includes(currentUser?.id || '')) return false;
      if (filter.status.length > 0 && !filter.status.includes(task.status)) return false;
      if (filter.searchTerm && !task.title.toLowerCase().includes(filter.searchTerm.toLowerCase())) return false;
      if (filter.tags.length > 0 && !filter.tags.some(tag => task.tags.includes(tag))) return false;
      if (filter.priority.length > 0 && !filter.priority.includes(task.priority)) return false;
      
      if (filter.dueDateRange === 'overdue') {
        return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
      }
      if (filter.dueDateRange === 'today') {
        if (!task.dueDate) return false;
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        const dueDate = new Date(task.dueDate);
        return dueDate >= todayStart && dueDate < todayEnd;
      }
      
      return true;
    });
  }, [tasks, filter, currentUser]);

  // ステータス別タスク
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    TASK_STATUSES.forEach(status => {
      grouped[status.id] = filteredTasks.filter(task => task.status === status.id);
    });
    return grouped;
  }, [filteredTasks]);

  // 今日のToDo
  const todayTodos = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return todos.filter(todo => {
      if (todo.createdBy !== currentUser?.id) return false;
      if (todo.type === 'daily') return new Date(todo.createdAt) >= todayStart;
      
      if (todo.dueDate) {
        const dueDate = new Date(todo.dueDate);
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        return dueDate >= todayStart && dueDate < todayEnd;
      }
      
      return new Date(todo.createdAt) >= todayStart;
    }).sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return a.order - b.order;
    });
  }, [todos, currentUser]);

  // ============================================
  // タスク操作関数
  // ============================================
  
  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedTask && draggedTask.status !== targetStatus) {
      const updatedTask = { 
        ...draggedTask, 
        status: targetStatus as Task['status'],
        updatedAt: new Date()
      };
      
      if (targetStatus === 'pending-review' && draggedTask.status === 'in-progress') {
        updatedTask.completedBy = currentUser?.id;
        updatedTask.reviewComment = '確認をお願いします';
      }
      
      if (targetStatus === 'done' && draggedTask.status === 'pending-review') {
        updatedTask.reviewedBy = currentUser?.id;
      }
      
      setTasks(prev => prev.map(task => 
        task.id === draggedTask.id ? updatedTask : task
      ));
      
      const statusName = TASK_STATUSES.find(s => s.id === targetStatus)?.name;
      showNotification(
        'タスクステータス更新', 
        `「${draggedTask.title}」を「${statusName}」に移動しました`,
        'success'
      );
    }
    
    setDraggedTask(null);
  }, [draggedTask, currentUser, showNotification]);

  const handleTaskComplete = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: 'pending-review' as const,
          completedBy: currentUser?.id,
          reviewComment: '確認をお願いします',
          updatedAt: new Date()
        };
      }
      return task;
    }));
    
    showNotification('タスク完了', 'タスクが確認待ちになりました', 'success');
  }, [currentUser, showNotification]);

  const handleTaskReview = useCallback((taskId: string, approved: boolean, comment?: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: approved ? 'done' as const : 'in-progress' as const,
          reviewedBy: approved ? currentUser?.id : undefined,
          reviewComment: comment || (approved ? '承認完了' : '修正が必要です'),
          updatedAt: new Date()
        };
      }
      return task;
    }));
    
    showNotification(
      approved ? 'タスク承認' : 'タスク差し戻し',
      approved ? 'タスクが正式に完了しました' : 'タスクを作業中に戻しました',
      approved ? 'success' : 'warning'
    );
  }, [currentUser, showNotification]);

  // ============================================
  // ToDo操作関数
  // ============================================
  
  const handleToggleTodo = useCallback((todoId: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === todoId) {
        const updated = {
          ...todo,
          isCompleted: !todo.isCompleted,
          completedAt: !todo.isCompleted ? new Date() : undefined
        };
        
        if (updated.isCompleted) {
          showNotification('ToDo完了', `「${todo.title}」が完了しました`, 'success');
        }
        
        return updated;
      }
      return todo;
    }));
  }, [showNotification]);

  const handleAddTodo = useCallback((formData: { title: string; memo?: string; dueDate?: string; type: 'daily' | 'spot' }) => {
    const newTodo: TodoItem = {
      id: `todo${Date.now()}`,
      title: formData.title,
      memo: formData.memo,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      type: formData.type,
      isCompleted: false,
      createdBy: currentUser?.id || '',
      createdAt: new Date(),
      order: todos.length + 1
    };
    
    setTodos(prev => [...prev, newTodo]);
    showNotification('ToDo追加', `「${newTodo.title}」を追加しました`, 'success');
  }, [todos.length, currentUser, showNotification]);

  const createTodosFromTemplates = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    const applicableTemplates = todoTemplates.filter(template => 
      template.isActive && (
        !template.dayOfWeek || 
        template.dayOfWeek.length === 0 || 
        template.dayOfWeek.includes(dayOfWeek)
      )
    );
    
    const newTodos = applicableTemplates.map(template => ({
      id: `todo${Date.now()}_${template.id}`,
      title: template.title,
      memo: template.memo,
      type: 'daily' as const,
      isCompleted: false,
      createdBy: currentUser?.id || '',
      createdAt: new Date(),
      templateId: template.id,
      order: template.order
    }));
    
    if (newTodos.length > 0) {
      setTodos(prev => [...prev, ...newTodos]);
      showNotification('デイリーToDo作成', `${newTodos.length}件のToDoを作成しました`, 'success');
    }
  }, [todoTemplates, currentUser, showNotification]);

  // ============================================
  // 画面コンポーネント
  // ============================================
  
  const LoginScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
        <div className="p-8">
          <div className="text-center mb-8">
            <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">タスク管理システム</h1>
            <p className="text-gray-600">ユーザーを選択してログインしてください</p>
          </div>
          
          <div className="space-y-3">
            {DEMO_USERS.map(user => (
              <button
                key={user.id}
                onClick={() => handleLogin(user)}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.department} - {user.position}
                    </div>
                    <div className="text-xs text-gray-400">
                      {user.role === 'admin' ? '管理者' : '社員'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const DashboardScreen = () => (
    <div className="space-y-6">
      {/* ウェルカムメッセージ */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-4">
          {currentUser?.avatar && (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              おはようございます、{currentUser?.name}さん！
            </h2>
            <p className="text-gray-600">
              {currentUser?.department}・{currentUser?.position}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              今日は{new Date().toLocaleDateString('ja-JP', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                weekday: 'long' 
              })}です
            </p>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総タスク数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">確認待ち</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingReview}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">完了率</p>
                <p className="text-2xl font-bold text-green-600">{stats.completionRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">今日のToDo</p>
                <p className="text-2xl font-bold text-purple-600">{stats.todayTodos}</p>
                <p className="text-xs text-gray-500">完了: {stats.completedTodos}</p>
              </div>
              <ListTodo className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* クイックアクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          onClick={() => setActiveScreen('tasks')}
          className="p-6 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
        >
          <Target className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="font-semibold text-blue-900 mb-2">タスク管理</h3>
          <p className="text-sm text-blue-700">カンバンボード形式でタスクを管理</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-blue-600">
            <span>進行中: {tasks.filter(t => t.status === 'in-progress' && t.assigneeIds.includes(currentUser?.id || '')).length}</span>
            <span>確認待ち: {tasks.filter(t => t.status === 'pending-review' && t.assigneeIds.includes(currentUser?.id || '')).length}</span>
          </div>
        </div>
        
        <div 
          onClick={() => {
            setActiveScreen('tasks');
            setActiveTab('todo');
          }}
          className="p-6 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
        >
          <ListTodo className="w-8 h-8 text-purple-600 mb-4" />
          <h3 className="font-semibold text-purple-900 mb-2">ToDo管理</h3>
          <p className="text-sm text-purple-700">デイリールーティンとスポット作業</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-purple-600">
            <span>今日: {todayTodos.length}</span>
            <span>完了: {todayTodos.filter(t => t.isCompleted).length}</span>
          </div>
        </div>
        
        <div className="p-6 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
          <BarChart3 className="w-8 h-8 text-green-600 mb-4" />
          <h3 className="font-semibold text-green-900 mb-2">進捗レポート</h3>
          <p className="text-sm text-green-700">タスクとToDoの進捗を分析</p>
          <div className="mt-3 text-xs text-green-600">
            完了率: {stats?.completionRate || 0}%
          </div>
        </div>
      </div>

      {/* 期限切れアラート */}
      {stats && stats.overdueTasks > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <div className="font-medium text-red-900">期限切れタスク</div>
              <div className="text-sm text-red-700">
                {stats.overdueTasks}件のタスクが期限切れです。確認してください。
              </div>
            </div>
            <button
              onClick={() => {
                setActiveScreen('tasks');
                setFilter(prev => ({ ...prev, dueDateRange: 'overdue' }));
              }}
              className="ml-auto px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              確認する
            </button>
          </div>
        </div>
      )}

      {/* 最近のアクティビティ */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">最近のアクティビティ</h3>
        <div className="space-y-3">
          {tasks
            .filter(task => task.assigneeIds.includes(currentUser?.id || ''))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5)
            .map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  task.status === 'done' ? 'bg-green-500' :
                  task.status === 'in-progress' ? 'bg-blue-500' :
                  task.status === 'pending-review' ? 'bg-orange-500' :
                  task.status === 'blocked' ? 'bg-red-500' :
                  'bg-gray-500'
                }`} />
                <span className="flex-1">{task.title}</span>
                <span className="text-sm text-gray-500">
                  {TASK_STATUSES.find(s => s.id === task.status)?.name}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const TaskScreen = () => (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">タスク・ToDo管理</h1>
          <p className="text-gray-600">カンバンボードとToDo管理を統合</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* タブ切り替え */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'kanban' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              カンバン
            </button>
            <button
              onClick={() => setActiveTab('todo')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'todo' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ToDo
            </button>
          </div>
          
          {/* フィルターボタン */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            フィルター
            {Object.values(filter).some(v => Array.isArray(v) ? v.length > 0 : v !== 'all' && v !== '') && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                適用中
              </span>
            )}
          </button>
          
          {/* 追加ボタン */}
          <button
            onClick={() => activeTab === 'kanban' ? setShowTaskForm(true) : setShowTodoForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'kanban' ? '新規タスク' : '新規ToDo'}
          </button>
        </div>
      </div>

      {/* フィルターパネル */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">表示範囲</label>
              <select
                value={filter.scope}
                onChange={(e) => setFilter(prev => ({ ...prev, scope: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">すべて</option>
                <option value="personal">個人</option>
                <option value="team">チーム</option>
                <option value="company">全社</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">検索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filter.searchTerm}
                  onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                  placeholder="タスクを検索..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">期限</label>
              <select
                value={filter.dueDateRange}
                onChange={(e) => setFilter(prev => ({ ...prev, dueDateRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">すべて</option>
                <option value="overdue">期限切れ</option>
                <option value="today">今日</option>
                <option value="this-week">今週</option>
                <option value="this-month">今月</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => setFilter({
                  scope: 'all',
                  status: [],
                  searchTerm: '',
                  tags: [],
                  priority: [],
                  dueDateRange: 'all'
                })}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      )}

      {/* カンバンボード */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {TASK_STATUSES.map(status => (
            <div 
              key={status.id} 
              className={`bg-gray-50 rounded-lg transition-all ${
                dragOverColumn === status.id ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, status.id)}
              onDrop={(e) => handleDrop(e, status.id)}
              onDragLeave={() => setDragOverColumn(null)}
            >
              <div className={`p-4 ${status.color} rounded-t-lg`}>
                <h3 className={`font-semibold ${status.textColor} flex items-center justify-between`}>
                  <span>{status.name}</span>
                  <span className="text-sm bg-white bg-opacity-70 px-2 py-1 rounded-full">
                    {tasksByStatus[status.id]?.length || 0}
                  </span>
                </h3>
                <p className="text-xs mt-1 opacity-75">{status.description}</p>
              </div>
              
              <div className="p-3 space-y-3 min-h-[400px]">
                {tasksByStatus[status.id]?.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={() => setDraggedTask(null)}
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskDetail(true);
                    }}
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-gray-900 flex-1">{task.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {PRIORITY_LEVELS.find(p => p.id === task.priority)?.name}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>

                      {task.dueDate && (
                        <div className={`text-xs flex items-center gap-1 ${
                          new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString('ja-JP')}
                        </div>
                      )}

                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              #{tag}
                            </span>
                          ))}
                          {task.tags.length > 2 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              +{task.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 確認待ちの場合のアクション */}
                      {task.status === 'pending-review' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskReview(task.id, true);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            承認
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskReview(task.id, false, '修正が必要です');
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            差し戻し
                          </button>
                        </div>
                      )}

                      {/* 進行中タスクの完了ボタン */}
                      {task.status === 'in-progress' && task.assigneeIds.includes(currentUser?.id || '') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskComplete(task.id);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                          完了
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ToDo管理 */}
      {activeTab === 'todo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 bg-blue-50 rounded-t-lg border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-900">今日のToDo</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-blue-700">
                      {todayTodos.filter(t => t.isCompleted).length} / {todayTodos.length} 完了
                    </span>
                    <button
                      onClick={createTodosFromTemplates}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      テンプレート実行
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {todayTodos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>今日のToDoはありません</p>
                    <p className="text-sm text-gray-400 mt-1">テンプレートを実行するか、新規ToDoを作成してください</p>
                  </div>
                ) : (
                  todayTodos.map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <button
                        onClick={() => handleToggleTodo(todo.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          todo.isCompleted 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {todo.isCompleted && <Check className="w-3 h-3" />}
                      </button>
                      
                      <div className="flex-1">
                        <div className={`font-medium ${todo.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {todo.title}
                        </div>
                        {todo.memo && (
                          <div className="text-sm text-gray-600">{todo.memo}</div>
                        )}
                        {todo.dueDate && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
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
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* サイドパネル */}
          <div className="space-y-6">
            {/* 統計 */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h4 className="font-semibold text-gray-900 mb-3">今日の進捗</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">完了率</span>
                  <span className="font-bold text-blue-600">
                    {todayTodos.length > 0 ? Math.round((todayTodos.filter(t => t.isCompleted).length / todayTodos.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${todayTodos.length > 0 ? (todayTodos.filter(t => t.isCompleted).length / todayTodos.length) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* テンプレート管理 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 bg-green-50 rounded-t-lg border-b">
                <h4 className="font-semibold text-green-900">デイリーテンプレート</h4>
              </div>
              <div className="p-4 space-y-2">
                {todoTemplates.map(template => (
                  <div key={template.id} className="p-3 bg-gray-50 rounded border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{template.title}</div>
                        {template.memo && (
                          <div className="text-sm text-gray-600">{template.memo}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {!template.dayOfWeek || template.dayOfWeek.length === 0 
                            ? '毎日' 
                            : template.dayOfWeek.map(day => DAYS_OF_WEEK[day].short).join(',')}
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        template.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const NotificationPanel = () => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    return (
      <div className="relative">
        <button
          onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
          className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  };

  // ============================================
  // メインレンダリング
  // ============================================
  
  if (!isAuthenticated || !currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* サイドバー */}
      <nav className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r z-30">
        <div className="p-6">
          {/* ロゴ */}
          <div className="flex items-center gap-3 mb-8">
            <Target className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="font-bold text-xl text-gray-900">タスク管理</h1>
              <p className="text-sm text-gray-500">統合管理システム</p>
            </div>
          </div>
          
          {/* ナビゲーション */}
          <div className="space-y-2">
            <button
              onClick={() => setActiveScreen('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeScreen === 'dashboard'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5" />
              ダッシュボード
            </button>
            
            <button
              onClick={() => setActiveScreen('tasks')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeScreen === 'tasks'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Target className="w-5 h-5" />
              タスク・ToDo
              {stats && stats.pendingReview > 0 && (
                <span className="ml-auto px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                  {stats.pendingReview}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveScreen('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeScreen === 'settings'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-5 h-5" />
              設定
            </button>
          </div>
        </div>
        
        {/* ユーザー情報 */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <div className="text-sm">
                <div className="font-medium text-gray-900">{currentUser.name}</div>
                <div className="text-gray-500">
                  {currentUser.role === 'admin' ? '管理者' : '社員'}
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
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* ヘッダーバー */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeScreen === 'dashboard' && 'ダッシュボード'}
                {activeScreen === 'tasks' && 'タスク・ToDo管理'}
                {activeScreen === 'settings' && '設定'}
              </h1>
              {stats && stats.overdueTasks > 0 && (
                <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  期限切れ {stats.overdueTasks}件
                </div>
              )}
            </div>
            
            <NotificationPanel />
          </div>

          {/* 画面コンテンツ */}
          {activeScreen === 'dashboard' && <DashboardScreen />}
          {activeScreen === 'tasks' && <TaskScreen />}
          {activeScreen === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">システム設定</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">通知設定</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">デスクトップ通知</div>
                        <div className="text-sm text-gray-600">ブラウザの通知機能を使用</div>
                      </div>
                      <button
                        onClick={requestNotificationPermission}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        通知を有効化
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">期限アラート</div>
                        <div className="text-sm text-gray-600">タスク期限の1日前・1時間前に通知</div>
                      </div>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ToDo設定</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">自動テンプレート実行</div>
                        <div className="text-sm text-gray-600">毎日0:00にテンプレートからToDoを作成</div>
                      </div>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ToDoフォームモーダル */}
      {showTodoForm && (
        <TodoFormModal
          isOpen={showTodoForm}
          onClose={() => setShowTodoForm(false)}
          onSubmit={handleAddTodo}
        />
      )}

      {/* タスク詳細モーダル */}
      {showTaskDetail && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={showTaskDetail}
          onClose={() => {
            setShowTaskDetail(false);
            setSelectedTask(null);
          }}
          onReview={handleTaskReview}
          onComplete={handleTaskComplete}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

// ============================================
// サブコンポーネント
// ============================================

const TodoFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; memo?: string; dueDate?: string; type: 'daily' | 'spot' }) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    memo: '',
    dueDate: '',
    type: 'spot' as const
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">新規ToDo追加</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">タイトル *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="ToDoのタイトル"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">メモ</label>
            <textarea
              value={formData.memo}
              onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="詳細メモ（任意）"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">種別</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormData(prev => ({ ...prev, type: 'spot' }))}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                  formData.type === 'spot'
                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                スポット
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, type: 'daily' }))}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                  formData.type === 'daily'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                デイリー
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">期限</label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="p-6 border-t bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={() => {
              onSubmit(formData);
              setFormData({ title: '', memo: '', dueDate: '', type: 'spot' });
              onClose();
            }}
            disabled={!formData.title.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskDetailModal: React.FC<{
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onReview: (taskId: string, approved: boolean, comment?: string) => void;
  onComplete: (taskId: string) => void;
  currentUser: User;
}> = ({ task, isOpen, onClose, onReview, onComplete, currentUser }) => {
  if (!isOpen) return null;

  const canReview = task.status === 'pending-review' && task.completedBy !== currentUser.id;
  const canComplete = task.status === 'in-progress' && task.assigneeIds.includes(currentUser.id);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">タスク詳細</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-xl font-bold text-gray-900">{task.title}</h4>
            <div className="flex items-center gap-4 mt-2">
              <span className={`px-2 py-1 text-sm rounded-full ${
                task.status === 'done' ? 'bg-green-100 text-green-800' :
                task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                task.status === 'pending-review' ? 'bg-orange-100 text-orange-800' :
                task.status === 'blocked' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {TASK_STATUSES.find(s => s.id === task.status)?.name}
              </span>
              <span className={`px-2 py-1 text-sm rounded-full ${
                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                優先度: {PRIORITY_LEVELS.find(p => p.id === task.priority)?.name}
              </span>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-2">説明</h5>
            <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-700">担当者</div>
              <div className="text-gray-900">{task.assigneeNames.join(', ')}</div>
            </div>
            
            {task.dueDate && (
              <div>
                <div className="text-sm font-medium text-gray-700">期限</div>
                <div className={`${
                  new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {new Date(task.dueDate).toLocaleString('ja-JP')}
                </div>
              </div>
            )}
          </div>

          {task.tags.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">タグ</div>
              <div className="flex flex-wrap gap-2">
                {task.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 確認待ちの場合 */}
          {task.status === 'pending-review' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-900">確認待ち</span>
              </div>
              
              {task.reviewComment && (
                <p className="text-sm text-orange-700 mb-3">{task.reviewComment}</p>
              )}
              
              {canReview && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      onReview(task.id, true);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    承認して完了
                  </button>
                  <button
                    onClick={() => {
                      const comment = prompt('差し戻し理由を入力してください');
                      if (comment !== null) {
                        onReview(task.id, false, comment);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    差し戻し
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* 進行中タスクの完了ボタン */}
          {canComplete && (
            <button
              onClick={() => {
                onComplete(task.id);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              完了（確認待ちへ）
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;