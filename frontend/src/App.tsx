// ディレクトリ: frontend/src/App.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Target, Home, Settings, LogOut, Bell, BellOff, Calendar,
  Plus, Filter, Search, Users, User, Shield, 
  Check, X, Edit3, Trash2, Clock, Tag, AlertCircle,
  CheckCircle, RotateCcw, UserCheck, ListTodo, BarChart3,
  Eye, EyeOff, ChevronDown, ChevronUp, 
  // アイコン追加
  UserIcon, PencilIcon, CalendarIcon, BookmarkIcon
} from 'lucide-react';
import LoginSystem from './components/LoginSystem';

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

interface Task {
  id: string;
  title: string;
  description: string;
  assigneeType: 'individual' | 'team' | 'company';
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
  completedBy?: string;
  reviewComment?: string;
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

interface NotificationItem {
  id: string;
  type: 'task-update' | 'todo-reminder' | 'deadline-alert';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// スタイル定数（優しいフォント対応）
const FONT_STYLES = {
  body: 'font-sans',
  heading: 'font-medium',
  soft: 'tracking-wide leading-relaxed'
};

// 優先度設定
const PRIORITY_LEVELS = [
  { id: 'low', name: '低', color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 'medium', name: '中', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { id: 'high', name: '高', color: 'text-red-600', bgColor: 'bg-red-100' }
];

// ステータス設定
const TASK_STATUSES = [
  { id: 'todo', name: '待機中', color: 'bg-gray-200', textColor: 'text-gray-800' },
  { id: 'in-progress', name: '進行中', color: 'bg-blue-200', textColor: 'text-blue-800' },
  { id: 'pending-review', name: '確認待ち', color: 'bg-orange-200', textColor: 'text-orange-800' },
  { id: 'done', name: '完了', color: 'bg-green-200', textColor: 'text-green-800' },
  { id: 'blocked', name: 'ブロック', color: 'bg-red-200', textColor: 'text-red-800' }
];

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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  // UI状態
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // フィルター状態
  const [filter, setFilter] = useState({
    scope: 'all' as 'all' | 'my-created' | 'my-assigned' | 'my-teams',
    status: [] as string[],
    searchTerm: '',
    tags: [] as string[],
    priority: [] as string[]
  });

  // フォーム状態
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    assigneeIds: [] as string[],
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: [] as string[]
  });

  const [newTodoForm, setNewTodoForm] = useState({
    title: '',
    memo: '',
    dueDate: '',
    type: 'spot' as 'daily' | 'spot'
  });

  // ============================================
  // サンプルデータ初期化
  // ============================================
  
  useEffect(() => {
    if (currentUser) {
      // サンプルタスクの初期化
      const sampleTasks: Task[] = [
        {
          id: 'task001',
          title: '2025年度事業計画策定',
          description: '来年度の事業計画を策定し、各部門との調整を行う。市場調査、競合分析、売上目標設定などを含む包括的な計画作成が必要。',
          assigneeType: 'individual',
          assigneeIds: [currentUser.id],
          assigneeNames: [currentUser.name],
          createdBy: currentUser.id,
          createdByName: currentUser.name,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          priority: 'high',
          status: 'in-progress',
          tags: ['戦略', '企画', '重要'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'task002',
          title: 'システム改修作業',
          description: '既存システムの改修を行い、パフォーマンスを向上させる。',
          assigneeType: 'individual',
          assigneeIds: [currentUser.id],
          assigneeNames: [currentUser.name],
          createdBy: currentUser.id,
          createdByName: currentUser.name,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          priority: 'medium',
          status: 'pending-review',
          tags: ['開発', 'システム'],
          createdAt: new Date(),
          updatedAt: new Date(),
          completedBy: currentUser.id
        }
      ];

      // サンプルToDoの初期化
      const sampleTodos: TodoItem[] = [
        {
          id: 'todo001',
          title: 'メールチェック',
          memo: '重要なメールと未読メールを確認',
          type: 'daily',
          isCompleted: false,
          createdBy: currentUser.id,
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
          createdBy: currentUser.id,
          createdAt: new Date(),
          order: 2
        }
      ];

      setTasks(sampleTasks);
      setTodos(sampleTodos);
    }
  }, [currentUser]);

  // ============================================
  // 通知機能（頻度を調整）
  // ============================================
  
  const showNotification = useCallback((title: string, message: string, type: 'task-update' | 'todo-reminder' | 'deadline-alert' = 'task-update') => {
    // 通知の種類によって制御
    const shouldNotify = {
      'task-update': false,      // タスクステータス変更時は通知なし
      'todo-reminder': true,     // ToDo関連は通知
      'deadline-alert': true     // 期限アラートは通知
    };

    if (!shouldNotify[type]) return;

    const notification: NotificationItem = {
      id: `notification_${Date.now()}`,
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date()
    };

    setNotifications(prev => [notification, ...prev.slice(0, 9)]);

    // ブラウザ通知
    if (Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }, []);

  // ============================================
  // ログイン・ログアウト処理
  // ============================================
  
  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveScreen('dashboard');
    setTasks([]);
    setTodos([]);
    setNotifications([]);
  }, []);

  // ============================================
  // タスク管理機能
  // ============================================
  
  const handleCreateTask = useCallback(() => {
    if (!newTaskForm.title || !currentUser) return;

    const task: Task = {
      id: `task_${Date.now()}`,
      title: newTaskForm.title,
      description: newTaskForm.description,
      assigneeType: 'individual',
      assigneeIds: newTaskForm.assigneeIds.length ? newTaskForm.assigneeIds : [currentUser.id],
      assigneeNames: newTaskForm.assigneeIds.length ? ['指定ユーザー'] : [currentUser.name],
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      dueDate: newTaskForm.dueDate ? new Date(newTaskForm.dueDate) : undefined,
      priority: newTaskForm.priority,
      status: 'todo',
      tags: newTaskForm.tags,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setTasks(prev => [...prev, task]);
    setNewTaskForm({
      title: '',
      description: '',
      assigneeIds: [],
      dueDate: '',
      priority: 'medium',
      tags: []
    });
    setShowNewTaskForm(false);
    showNotification('タスク作成', `「${task.title}」を作成しました`);
  }, [newTaskForm, currentUser, showNotification]);

  const handleTaskStatusChange = useCallback((taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updated = { ...task, status: newStatus as any, updatedAt: new Date() };
        
        // 完了時の処理
        if (newStatus === 'pending-review' && currentUser) {
          updated.completedBy = currentUser.id;
        }
        
        return updated;
      }
      return task;
    }));
  }, [currentUser]);

  const handleTaskReview = useCallback((taskId: string, approved: boolean, comment?: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId && currentUser) {
        const updated = {
          ...task,
          status: approved ? 'done' : 'todo',
          reviewComment: comment,
          reviewedBy: currentUser.id,
          updatedAt: new Date()
        } as Task;
        
        showNotification(
          approved ? 'タスク承認' : 'タスク差し戻し', 
          `「${task.title}」が${approved ? '承認' : '差し戻し'}されました`,
          'task-update'
        );
        
        return updated;
      }
      return task;
    }));
  }, [currentUser, showNotification]);

  const handleTaskDelete = useCallback((taskId: string) => {
    if (confirm('タスクを削除しますか？')) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
      showNotification('タスク削除', 'タスクを削除しました');
    }
  }, [showNotification]);

  // ============================================
  // ToDo管理機能
  // ============================================
  
  const handleCreateTodo = useCallback(() => {
    if (!newTodoForm.title || !currentUser) return;

    const todo: TodoItem = {
      id: `todo_${Date.now()}`,
      title: newTodoForm.title,
      memo: newTodoForm.memo || undefined,
      dueDate: newTodoForm.dueDate ? new Date(newTodoForm.dueDate) : undefined,
      type: newTodoForm.type,
      isCompleted: false,
      createdBy: currentUser.id,
      createdAt: new Date(),
      order: todos.length + 1
    };

    setTodos(prev => [...prev, todo]);
    setNewTodoForm({
      title: '',
      memo: '',
      dueDate: '',
      type: 'spot'
    });
    setShowTodoForm(false);
    showNotification('ToDo作成', `「${todo.title}」を追加しました`, 'todo-reminder');
  }, [newTodoForm, currentUser, todos.length, showNotification]);

  const handleTodoToggle = useCallback((todoId: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === todoId) {
        const updated = {
          ...todo,
          isCompleted: !todo.isCompleted,
          completedAt: !todo.isCompleted ? new Date() : undefined
        };
        
        if (updated.isCompleted) {
          showNotification('ToDo完了', `「${todo.title}」が完了しました`, 'todo-reminder');
        }
        
        return updated;
      }
      return todo;
    }));
  }, [showNotification]);

  const handleTodoDelete = useCallback((todoId: string) => {
    if (confirm('ToDoを削除しますか？')) {
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
      showNotification('ToDo削除', 'ToDoを削除しました', 'todo-reminder');
    }
  }, [showNotification]);

  // ============================================
  // フィルター機能
  // ============================================
  
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // スコープフィルター
    if (filter.scope !== 'all' && currentUser) {
      switch (filter.scope) {
        case 'my-created':
          filtered = filtered.filter(task => task.createdBy === currentUser.id);
          break;
        case 'my-assigned':
          filtered = filtered.filter(task => task.assigneeIds.includes(currentUser.id));
          break;
        case 'my-teams':
          // チーム機能は今後実装
          break;
      }
    }

    // ステータスフィルター
    if (filter.status.length > 0) {
      filtered = filtered.filter(task => filter.status.includes(task.status));
    }

    // 検索フィルター
    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
      );
    }

    // タグフィルター
    if (filter.tags.length > 0) {
      filtered = filtered.filter(task => 
        filter.tags.some(tag => task.tags.includes(tag))
      );
    }

    // 優先度フィルター
    if (filter.priority.length > 0) {
      filtered = filtered.filter(task => filter.priority.includes(task.priority));
    }

    return filtered;
  }, [tasks, filter, currentUser]);

  const todayTodos = useMemo(() => {
    return todos.filter(todo => {
      if (todo.type === 'daily') return true;
      if (todo.dueDate) {
        const today = new Date();
        const dueDate = new Date(todo.dueDate);
        return dueDate.toDateString() === today.toDateString();
      }
      return true;
    }).sort((a, b) => a.order - b.order);
  }, [todos]);

  // 完了・未完了ToDoの分離
  const activeTodos = todayTodos.filter(todo => !todo.isCompleted);
  const completedTodos = todayTodos.filter(todo => todo.isCompleted);

  // ============================================
  // 統計情報
  // ============================================
  
  const stats = useMemo(() => {
    if (!currentUser) return null;
    
    const userTasks = tasks.filter(task => 
      task.assigneeIds.includes(currentUser.id) || task.createdBy === currentUser.id
    );
    
    return {
      totalTasks: userTasks.length,
      inProgress: userTasks.filter(t => t.status === 'in-progress').length,
      pendingReview: userTasks.filter(t => t.status === 'pending-review').length,
      completed: userTasks.filter(t => t.status === 'done').length,
      todayTodos: todayTodos.length,
      completedTodos: completedTodos.length
    };
  }, [tasks, todos, currentUser, todayTodos, completedTodos]);

  // ============================================
  // UI コンポーネント
  // ============================================
  
  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const priorityStyle = PRIORITY_LEVELS.find(p => p.id === task.priority);
    const statusStyle = TASK_STATUSES.find(s => s.id === task.status);
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

    return (
      <div 
        className={`p-4 bg-white rounded-lg shadow-sm border-l-4 hover:shadow-md transition-shadow cursor-pointer ${FONT_STYLES.soft} ${
          isOverdue ? 'border-l-red-500 bg-red-50' : 'border-l-blue-500'
        }`}
        onClick={() => {
          setSelectedTask(task);
          setShowTaskDetail(true);
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className={`font-medium text-gray-900 ${FONT_STYLES.heading}`}>{task.title}</h3>
          {priorityStyle && (
            <span className={`px-2 py-1 text-xs rounded-full ${priorityStyle.bgColor} ${priorityStyle.color}`}>
              {priorityStyle.name}
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
        
        <div className="space-y-2">
          {/* 期限 */}
          {task.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                {new Date(task.dueDate).toLocaleDateString('ja-JP')}
                {isOverdue && ' (期限切れ)'}
              </span>
            </div>
          )}
          
          {/* 担当者 */}
          <div className="flex items-center gap-2 text-sm">
            <UserIcon className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{task.assigneeNames.join(', ')}</span>
          </div>
          
          {/* タグ */}
          {task.tags.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <BookmarkIcon className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag, index) => (
                  <span key={index} className="px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* アクションボタン */}
        <div className="mt-4 flex items-center justify-between">
          {statusStyle && (
            <span className={`px-2 py-1 text-xs rounded-full ${statusStyle.color} ${statusStyle.textColor}`}>
              {statusStyle.name}
            </span>
          )}
          
          <div className="flex items-center gap-2">
            {/* 進行中タスクの完了ボタン */}
            {task.status === 'in-progress' && task.assigneeIds.includes(currentUser?.id || '') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTaskStatusChange(task.id, 'pending-review');
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
              >
                <UserCheck className="w-3 h-3" />
                完了
              </button>
            )}
            
            {/* 確認待ちタスクのレビューボタン */}
            {task.status === 'pending-review' && currentUser?.role === 'admin' && (
              <div className="flex gap-1">
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
          </div>
        </div>
      </div>
    );
  };

  const TodoCard: React.FC<{ todo: TodoItem }> = ({ todo }) => (
    <div className={`p-3 bg-white rounded-lg shadow-sm border flex items-center gap-3 ${FONT_STYLES.soft} ${
      todo.isCompleted ? 'opacity-60' : ''
    }`}>
      <button
        onClick={() => handleTodoToggle(todo.id)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          todo.isCompleted 
            ? 'bg-green-500 border-green-500 text-white' 
            : 'border-gray-300 hover:border-green-400'
        }`}
      >
        {todo.isCompleted && <Check className="w-3 h-3" />}
      </button>
      
      <div className="flex-1">
        <div className={`${FONT_STYLES.heading} ${todo.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
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
      
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs rounded-full ${
          todo.type === 'daily' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-purple-100 text-purple-800'
        }`}>
          {todo.type === 'daily' ? 'デイリー' : 'スポット'}
        </span>
        
        <button
          onClick={() => handleTodoDelete(todo.id)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ============================================
  // メインレンダリング
  // ============================================
  
  if (!isAuthenticated || !currentUser) {
    return <LoginSystem onLoginSuccess={handleLogin} />;
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${FONT_STYLES.body}`}>
      {/* サイドバー */}
      <nav className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r z-30">
        <div className="p-6">
          {/* ロゴ */}
          <div className="flex items-center gap-3 mb-8">
            <Target className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className={`font-bold text-xl text-gray-900 ${FONT_STYLES.heading}`}>タスク管理</h1>
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentUser.role === 'admin' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                {currentUser.role === 'admin' ? (
                  <Shield className="w-4 h-4 text-blue-600" />
                ) : (
                  <User className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div className="text-sm">
                <div className={`font-medium text-gray-900 ${FONT_STYLES.heading}`}>{currentUser.name}</div>
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
        {/* ダッシュボード */}
        {activeScreen === 'dashboard' && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${FONT_STYLES.heading}`}>
                ようこそ、{currentUser.name}さん！
              </h1>
              <p className="text-gray-600">今日のタスクとToDoを確認しましょう</p>
            </div>

            {/* 統計カード */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-medium text-gray-500 ${FONT_STYLES.heading}`}>進行中</h3>
                    <Target className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-medium text-gray-500 ${FONT_STYLES.heading}`}>確認待ち</h3>
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingReview}</p>
                </div>
                
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-medium text-gray-500 ${FONT_STYLES.heading}`}>完了</h3>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-medium text-gray-500 ${FONT_STYLES.heading}`}>今日のToDo</h3>
                    <ListTodo className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.completedTodos}/{stats.todayTodos}
                  </p>
                </div>
              </div>
            )}

            {/* クイックアクション */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                onClick={() => {
                  setActiveScreen('tasks');
                  setActiveTab('kanban');
                }}
                className="p-6 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <Target className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className={`font-semibold text-blue-900 mb-2 ${FONT_STYLES.heading}`}>タスク管理</h3>
                <p className="text-sm text-blue-700">カンバンボード形式でタスクを管理</p>
              </div>
              
              <div 
                onClick={() => {
                  setActiveScreen('tasks');
                  setActiveTab('todo');
                }}
                className="p-6 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
              >
                <ListTodo className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className={`font-semibold text-purple-900 mb-2 ${FONT_STYLES.heading}`}>ToDo管理</h3>
                <p className="text-sm text-purple-700">デイリールーティンとスポット作業</p>
              </div>
              
              <div className="p-6 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                <BarChart3 className="w-8 h-8 text-green-600 mb-4" />
                <h3 className={`font-semibold text-green-900 mb-2 ${FONT_STYLES.heading}`}>進捗レポート</h3>
                <p className="text-sm text-green-700">タスクとToDoの進捗状況</p>
              </div>
            </div>
          </div>
        )}

        {/* タスク・ToDo管理 */}
        {activeScreen === 'tasks' && (
          <div className="max-w-7xl mx-auto">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${FONT_STYLES.heading}`}>タスク・ToDo管理</h1>
                <p className="text-gray-600">個人・チームのタスクとToDoを統合管理</p>
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
                
                {/* 新規作成ボタン（シンプルな＋ボタン） */}
                <button
                  onClick={() => activeTab === 'kanban' ? setShowNewTaskForm(true) : setShowTodoForm(true)}
                  className="w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center shadow-md"
                  title={activeTab === 'kanban' ? '新規タスク作成' : '新規ToDo作成'}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* タスク管理（カンバンボード） */}
            {activeTab === 'kanban' && (
              <div>
                {/* フィルター */}
                <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold text-gray-900 ${FONT_STYLES.heading}`}>フィルター</h3>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <Filter className="w-4 h-4" />
                      {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* スコープ */}
                      <select
                        value={filter.scope}
                        onChange={(e) => setFilter(prev => ({ ...prev, scope: e.target.value as any }))}
                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">すべてのタスク</option>
                        <option value="my-created">自分が作成したタスク</option>
                        <option value="my-assigned">自分が担当者のタスク</option>
                        <option value="my-teams">自分のチーム</option>
                      </select>
                      
                      {/* ステータス */}
                      <select
                        multiple
                        value={filter.status}
                        onChange={(e) => setFilter(prev => ({ 
                          ...prev, 
                          status: Array.from(e.target.selectedOptions, option => option.value)
                        }))}
                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {TASK_STATUSES.map(status => (
                          <option key={status.id} value={status.id}>{status.name}</option>
                        ))}
                      </select>
                      
                      {/* 検索 */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="タスクを検索..."
                          value={filter.searchTerm}
                          onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* 優先度 */}
                      <select
                        multiple
                        value={filter.priority}
                        onChange={(e) => setFilter(prev => ({ 
                          ...prev, 
                          priority: Array.from(e.target.selectedOptions, option => option.value)
                        }))}
                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {PRIORITY_LEVELS.map(priority => (
                          <option key={priority.id} value={priority.id}>{priority.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* カンバンボード */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {TASK_STATUSES.map(status => {
                    const statusTasks = filteredTasks.filter(task => task.status === status.id);
                    
                    return (
                      <div key={status.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`font-semibold text-gray-900 ${FONT_STYLES.heading}`}>
                            {status.name}
                          </h3>
                          <span className="px-2 py-1 text-xs bg-white rounded-full">
                            {statusTasks.length}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          {statusTasks.map(task => (
                            <TaskCard key={task.id} task={task} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ToDo管理 */}
            {activeTab === 'todo' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 未完了ToDo */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 bg-blue-50 rounded-t-lg border-b">
                    <h3 className={`font-semibold text-blue-900 ${FONT_STYLES.heading}`}>
                      今日のToDo ({activeTodos.length}件)
                    </h3>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {activeTodos.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ListTodo className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>今日のToDoはありません</p>
                      </div>
                    ) : (
                      activeTodos.map(todo => <TodoCard key={todo.id} todo={todo} />)
                    )}
                  </div>
                </div>
                
                {/* 完了ToDo */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 bg-green-50 rounded-t-lg border-b">
                    <h3 className={`font-semibold text-green-900 ${FONT_STYLES.heading}`}>
                      完了済み ({completedTodos.length}件)
                    </h3>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {completedTodos.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>完了したToDoはありません</p>
                      </div>
                    ) : (
                      completedTodos.map(todo => <TodoCard key={todo.id} todo={todo} />)
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 設定画面 */}
        {activeScreen === 'settings' && (
          <div className="max-w-4xl mx-auto">
            <h1 className={`text-3xl font-bold text-gray-900 mb-8 ${FONT_STYLES.heading}`}>設定</h1>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className={`text-xl font-semibold text-gray-900 mb-4 ${FONT_STYLES.heading}`}>通知設定</h2>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 text-blue-600" />
                  <span>デスクトップ通知を有効にする</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                  <span>ToDoリマインダー</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                  <span>期限アラート</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 text-blue-600" />
                  <span>ステータス変更通知</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 新規タスク作成モーダル */}
      {showNewTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
             onClick={(e) => e.target === e.currentTarget && setShowNewTaskForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold text-gray-900 ${FONT_STYLES.heading}`}>新規タスク作成</h2>
                <button
                  onClick={() => setShowNewTaskForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タスク名 *
                  </label>
                  <input
                    type="text"
                    value={newTaskForm.title}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="タスク名を入力してください"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <PencilIcon className="w-4 h-4 inline mr-1" />
                    説明
                  </label>
                  <textarea
                    value={newTaskForm.description}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="タスクの詳細を入力してください"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CalendarIcon className="w-4 h-4 inline mr-1" />
                      期限
                    </label>
                    <input
                      type="datetime-local"
                      value={newTaskForm.dueDate}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      優先度
                    </label>
                    <select
                      value={newTaskForm.priority}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PRIORITY_LEVELS.map(priority => (
                        <option key={priority.id} value={priority.id}>{priority.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookmarkIcon className="w-4 h-4 inline mr-1" />
                    タグ（カンマ区切り）
                  </label>
                  <input
                    type="text"
                    value={newTaskForm.tags.join(', ')}
                    onChange={(e) => setNewTaskForm(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例：緊急, 企画, 重要"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowNewTaskForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTaskForm.title}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  作成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新規ToDo作成モーダル */}
      {showTodoForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
             onClick={(e) => e.target === e.currentTarget && setShowTodoForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold text-gray-900 ${FONT_STYLES.heading}`}>新規ToDo作成</h2>
                <button
                  onClick={() => setShowTodoForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ToDo名 *
                  </label>
                  <input
                    type="text"
                    value={newTodoForm.title}
                    onChange={(e) => setNewTodoForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ToDoを入力してください"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <PencilIcon className="w-4 h-4 inline mr-1" />
                    メモ
                  </label>
                  <textarea
                    value={newTodoForm.memo}
                    onChange={(e) => setNewTodoForm(prev => ({ ...prev, memo: e.target.value }))}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="メモを入力してください（任意）"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CalendarIcon className="w-4 h-4 inline mr-1" />
                      期限
                    </label>
                    <input
                      type="datetime-local"
                      value={newTodoForm.dueDate}
                      onChange={(e) => setNewTodoForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      種別
                    </label>
                    <select
                      value={newTodoForm.type}
                      onChange={(e) => setNewTodoForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="daily">デイリー</option>
                      <option value="spot">スポット</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowTodoForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCreateTodo}
                  disabled={!newTodoForm.title}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  作成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* タスク詳細モーダル */}
      {showTaskDetail && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
             onClick={(e) => e.target === e.currentTarget && setShowTaskDetail(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold text-gray-900 ${FONT_STYLES.heading}`}>タスク詳細</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTaskDelete(selectedTask.id)}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                    title="タスク削除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowTaskDetail(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-medium text-gray-900 mb-2 ${FONT_STYLES.heading}`}>
                    {selectedTask.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    {(() => {
                      const statusStyle = TASK_STATUSES.find(s => s.id === selectedTask.status);
                      const priorityStyle = PRIORITY_LEVELS.find(p => p.id === selectedTask.priority);
                      
                      return (
                        <>
                          {statusStyle && (
                            <span className={`px-2 py-1 text-xs rounded-full ${statusStyle.color} ${statusStyle.textColor}`}>
                              {statusStyle.name}
                            </span>
                          )}
                          {priorityStyle && (
                            <span className={`px-2 py-1 text-xs rounded-full ${priorityStyle.bgColor} ${priorityStyle.color}`}>
                              {priorityStyle.name}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                <div>
                  <h4 className={`font-medium text-gray-900 mb-2 flex items-center gap-2 ${FONT_STYLES.heading}`}>
                    <PencilIcon className="w-4 h-4 text-gray-400" />
                    説明
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className={`font-medium text-gray-900 mb-2 flex items-center gap-2 ${FONT_STYLES.heading}`}>
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      担当者
                    </h4>
                    <p className="text-gray-700">{selectedTask.assigneeNames.join(', ')}</p>
                  </div>
                  
                  <div>
                    <h4 className={`font-medium text-gray-900 mb-2 flex items-center gap-2 ${FONT_STYLES.heading}`}>
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      依頼者
                    </h4>
                    <p className="text-gray-700">{selectedTask.createdByName}</p>
                  </div>
                  
                  {selectedTask.dueDate && (
                    <div>
                      <h4 className={`font-medium text-gray-900 mb-2 flex items-center gap-2 ${FONT_STYLES.heading}`}>
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        期限
                      </h4>
                      <p className="text-gray-700">
                        {new Date(selectedTask.dueDate).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className={`font-medium text-gray-900 mb-2 flex items-center gap-2 ${FONT_STYLES.heading}`}>
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      作成日
                    </h4>
                    <p className="text-gray-700">
                      {selectedTask.createdAt.toLocaleString('ja-JP')}
                    </p>
                  </div>
                </div>
                
                {selectedTask.tags.length > 0 && (
                  <div>
                    <h4 className={`font-medium text-gray-900 mb-2 flex items-center gap-2 ${FONT_STYLES.heading}`}>
                      <BookmarkIcon className="w-4 h-4 text-gray-400" />
                      タグ
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedTask.reviewComment && (
                  <div>
                    <h4 className={`font-medium text-gray-900 mb-2 ${FONT_STYLES.heading}`}>レビューコメント</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedTask.reviewComment}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 通知パネル */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-40 space-y-2">
          {notifications.slice(0, 3).map(notification => (
            <div
              key={notification.id}
              className={`p-4 bg-white rounded-lg shadow-lg border-l-4 max-w-sm ${
                notification.type === 'deadline-alert' 
                  ? 'border-l-red-500' 
                  : notification.type === 'todo-reminder'
                  ? 'border-l-purple-500'
                  : 'border-l-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className={`font-medium text-gray-900 ${FONT_STYLES.heading}`}>{notification.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;