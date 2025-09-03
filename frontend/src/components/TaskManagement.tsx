// ディレクトリ: frontend/src/components/TaskManagement.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Plus, Edit3, Trash2, Save, X, Users, User, Calendar, 
  Tag, Hash, Filter, Search, MoreVertical, Clock,
  Building, Target, CheckCircle, AlertCircle, Star,
  ExternalLink, Link, Paperclip, FileText, Image,
  Globe, Eye, ChevronDown, ChevronRight, Settings,
  ListTodo, RotateCcw, Check, UserCheck
} from 'lucide-react';

import {
  Task, User as UserType, Team, TaskFilter, TodoItem, TodoTemplate,
  TASK_STATUSES, PRIORITY_LEVELS, DAYS_OF_WEEK, TodoForm, TodoTemplateForm,
  NotificationSettings
} from '../types/index';

// ============================================
// デモデータ
// ============================================

const DEMO_USERS: UserType[] = [
  { 
    id: 'user001', 
    name: '田中太郎', 
    email: 'tanaka@company.com', 
    role: 'admin', 
    department: '経営企画', 
    position: '部長',
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
  }
];

const DEMO_TASKS: Task[] = [
  {
    id: 'task001',
    title: '2025年度事業計画策定',
    description: '来年度の事業計画を策定し、各部門との調整を行う。',
    assigneeType: 'individual',
    assigneeIds: ['user001'],
    assigneeNames: ['田中太郎'],
    createdBy: 'user001',
    createdByName: '田中太郎',
    dueDate: new Date('2025-09-15T19:00:00'),
    priority: 'high',
    status: 'in-progress',
    tags: ['戦略', '企画', '重要'],
    relatedLinks: [],
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date('2025-09-01')
  },
  {
    id: 'task002',
    title: 'マーケティング施策検討',
    description: 'Q4マーケティング戦略を立案する。',
    assigneeType: 'individual',
    assigneeIds: ['user002'],
    assigneeNames: ['佐藤花子'],
    createdBy: 'user001',
    createdByName: '田中太郎',
    dueDate: new Date('2025-09-20T19:00:00'),
    priority: 'medium',
    status: 'pending-review',
    tags: ['マーケティング'],
    relatedLinks: [],
    createdAt: new Date('2025-09-02'),
    updatedAt: new Date('2025-09-02'),
    completedBy: 'user002',
    reviewComment: '内容を確認してください'
  }
];

const DEMO_TODOS: TodoItem[] = [
  {
    id: 'todo001',
    title: 'メールチェック',
    memo: '重要なメールがないか確認',
    type: 'daily',
    isCompleted: true,
    createdBy: 'user001',
    createdAt: new Date(),
    completedAt: new Date(),
    templateId: 'template001',
    order: 1
  },
  {
    id: 'todo002',
    title: 'プレゼン資料作成',
    memo: '来週の会議用',
    dueDate: new Date('2025-09-10T17:00:00'),
    type: 'spot',
    isCompleted: false,
    createdBy: 'user001',
    createdAt: new Date(),
    order: 2
  }
];

const DEMO_TODO_TEMPLATES: TodoTemplate[] = [
  {
    id: 'template001',
    title: 'メールチェック',
    memo: '重要なメールがないか確認',
    isActive: true,
    createdBy: 'user001',
    createdAt: new Date(),
    dayOfWeek: [1, 2, 3, 4, 5], // 平日のみ
    order: 1
  },
  {
    id: 'template002',
    title: '日次レポート作成',
    memo: '昨日の実績をまとめる',
    isActive: true,
    createdBy: 'user001',
    createdAt: new Date(),
    dayOfWeek: [], // 毎日
    order: 2
  }
];

// ============================================
// メインコンポーネント
// ============================================

interface TaskManagementProps {
  currentUser: UserType | null;
}

const TaskManagement: React.FC<TaskManagementProps> = ({ currentUser }) => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);
  const [todos, setTodos] = useState<TodoItem[]>(DEMO_TODOS);
  const [todoTemplates, setTodoTemplates] = useState<TodoTemplate[]>(DEMO_TODO_TEMPLATES);
  const [activeTab, setActiveTab] = useState<'kanban' | 'todo'>('kanban');
  
  // フィルター状態
  const [filter, setFilter] = useState<TaskFilter>({
    scope: 'all',
    status: [],
    assignee: 'all',
    selectedTeamIds: [],
    selectedUserIds: [],
    searchTerm: '',
    tags: [],
    priority: [],
    dueDateRange: 'all'
  });
  
  // UI状態
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // ドラッグ＆ドロップ状態
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // フォーム状態
  const [todoForm, setTodoForm] = useState<TodoForm>({
    title: '',
    memo: '',
    dueDate: '',
    type: 'spot'
  });
  
  const [templateForm, setTemplateForm] = useState<TodoTemplateForm>({
    title: '',
    memo: '',
    dayOfWeek: []
  });

  // ============================================
  // 通知機能
  // ============================================
  
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  const showNotification = useCallback((title: string, body: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico', ...options });
    }
  }, []);

  // ============================================
  // データ処理関数
  // ============================================
  
  // フィルター済みタスクの計算
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // スコープフィルター
      if (filter.scope === 'personal' && !task.assigneeIds.includes(currentUser?.id || '')) return false;
      if (filter.scope === 'team' && task.assigneeType !== 'team') return false;
      if (filter.scope === 'company' && task.assigneeType !== 'company') return false;
      
      // ステータスフィルター
      if (filter.status.length > 0 && !filter.status.includes(task.status)) return false;
      
      // 検索フィルター
      if (filter.searchTerm && !task.title.toLowerCase().includes(filter.searchTerm.toLowerCase())) return false;
      
      // タグフィルター
      if (filter.tags.length > 0 && !filter.tags.some(tag => task.tags.includes(tag))) return false;
      
      return true;
    });
  }, [tasks, filter, currentUser]);

  // ステータス別タスクのグループ化
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
    return todos.filter(todo => {
      if (todo.type === 'daily') return true;
      if (todo.dueDate) {
        const dueDate = new Date(todo.dueDate);
        return dueDate.toDateString() === today.toDateString();
      }
      return false;
    }).sort((a, b) => a.order - b.order);
  }, [todos]);

  // ============================================
  // ドラッグ＆ドロップ処理
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

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverColumn(null);
    }
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
      
      // 確認待ち→完了への移行時は承認者を記録
      if (targetStatus === 'done' && draggedTask.status === 'pending-review') {
        updatedTask.reviewedBy = currentUser?.id;
      }
      
      setTasks(prev => prev.map(task => 
        task.id === draggedTask.id ? updatedTask : task
      ));
      
      // 通知表示
      showNotification(
        'タスクステータス更新', 
        `「${draggedTask.title}」を「${TASK_STATUSES.find(s => s.id === targetStatus)?.name}」に移動しました`
      );
    }
    
    setDraggedTask(null);
  }, [draggedTask, currentUser, showNotification]);

  // ============================================
  // タスク操作関数
  // ============================================
  
  const handleTaskComplete = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: 'pending-review' as const,
          completedBy: currentUser?.id,
          updatedAt: new Date()
        };
      }
      return task;
    }));
    
    showNotification('タスク完了', 'タスクが確認待ちになりました');
  }, [currentUser, showNotification]);

  const handleTaskReview = useCallback((taskId: string, approved: boolean, comment?: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: approved ? 'done' as const : 'in-progress' as const,
          reviewedBy: approved ? currentUser?.id : undefined,
          reviewComment: comment,
          updatedAt: new Date()
        };
      }
      return task;
    }));
    
    showNotification(
      approved ? 'タスク承認完了' : 'タスク差し戻し', 
      approved ? 'タスクが正式に完了しました' : 'タスクを作業中に戻しました'
    );
  }, [currentUser, showNotification]);

  // ============================================
  // ToDo操作関数
  // ============================================
  
  const handleAddTodo = useCallback((formData: TodoForm) => {
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
    setTodoForm({ title: '', memo: '', dueDate: '', type: 'spot' });
    setShowTodoForm(false);
    
    showNotification('ToDo追加', `「${newTodo.title}」を追加しました`);
  }, [todos.length, currentUser, showNotification]);

  const handleToggleTodo = useCallback((todoId: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === todoId) {
        const updated = {
          ...todo,
          isCompleted: !todo.isCompleted,
          completedAt: !todo.isCompleted ? new Date() : undefined
        };
        
        if (updated.isCompleted) {
          showNotification('ToDo完了', `「${todo.title}」が完了しました`);
        }
        
        return updated;
      }
      return todo;
    }));
  }, [showNotification]);

  const handleAddTemplate = useCallback((formData: TodoTemplateForm) => {
    const newTemplate: TodoTemplate = {
      id: `template${Date.now()}`,
      title: formData.title,
      memo: formData.memo,
      isActive: true,
      createdBy: currentUser?.id || '',
      createdAt: new Date(),
      dayOfWeek: formData.dayOfWeek,
      order: todoTemplates.length + 1
    };
    
    setTodoTemplates(prev => [...prev, newTemplate]);
    setTemplateForm({ title: '', memo: '', dayOfWeek: [] });
    setShowTemplateForm(false);
    
    showNotification('テンプレート追加', `「${newTemplate.title}」のテンプレートを作成しました`);
  }, [todoTemplates.length, currentUser, showNotification]);

  // デイリーテンプレートからToDo作成
  const createTodosFromTemplates = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    const applicableTemplates = todoTemplates.filter(template => 
      template.isActive && (
        template.dayOfWeek.length === 0 || // 毎日
        template.dayOfWeek.includes(dayOfWeek) // 指定曜日
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
      showNotification('デイリーToDo作成', `${newTodos.length}件のToDoを作成しました`);
    }
  }, [todoTemplates, currentUser, showNotification]);

  // ============================================
  // 初期化処理
  // ============================================
  
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // ============================================
  // レンダリング関数
  // ============================================
  
  const renderTaskCard = (task: Task) => {
    const dueDateColor = task.dueDate && new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-gray-600';
    
    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onClick={() => {
          setSelectedTask(task);
          setShowTaskDetail(true);
        }}
        className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group"
      >
        <div className="space-y-3">
          {/* タイトルと優先度 */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-gray-900 flex-1 group-hover:text-blue-700 transition-colors">
              {task.title}
            </h4>
            <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
              task.priority === 'high' ? 'bg-red-100 text-red-800' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {PRIORITY_LEVELS.find(p => p.id === task.priority)?.name}
            </span>
          </div>

          {/* 説明 */}
          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>

          {/* 担当者 */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">
              {task.assigneeNames.join(', ')}
            </span>
          </div>

          {/* 期限 */}
          {task.dueDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className={`text-sm ${dueDateColor}`}>
                {new Date(task.dueDate).toLocaleDateString('ja-JP')}
              </span>
            </div>
          )}

          {/* タグ */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map(tag => (
                <span key={tag} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 確認待ちの場合の追加情報 */}
          {task.status === 'pending-review' && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-orange-50 rounded border border-orange-200">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-700">確認待ち</span>
              {task.reviewComment && (
                <span className="text-xs text-orange-600">({task.reviewComment})</span>
              )}
            </div>
          )}
          
          {/* アクションボタン（確認待ちの場合） */}
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
        </div>
      </div>
    );
  };

  const renderTodoItem = (todo: TodoItem) => {
    return (
      <div key={todo.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
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
    );
  };

  // ============================================
  // メインレンダリング
  // ============================================
  
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">タスク管理</h1>
          <p className="text-gray-600">個人・チーム・全社のタスクとToDoを統合管理</p>
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
          
          {/* 追加ボタン */}
          <button
            onClick={() => activeTab === 'kanban' ? setShowNewTaskForm(true) : setShowTodoForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'kanban' ? '新規タスク' : '新規ToDo'}
          </button>
        </div>
      </div>

      {/* カンバンボード */}
      {activeTab === 'kanban' && (
        <>
          {/* フィルター */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">フィルター</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'フィルターを隠す' : 'フィルターを表示'}
              </button>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* スコープ選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">表示範囲</label>
                  <select
                    value={filter.scope}
                    onChange={(e) => setFilter(prev => ({ ...prev, scope: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">すべて</option>
                    <option value="personal">個人</option>
                    <option value="team">チーム</option>
                    <option value="company">全社</option>
                  </select>
                </div>
                
                {/* ステータス選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
                  <div className="flex flex-wrap gap-1">
                    {TASK_STATUSES.map(status => (
                      <button
                        key={status.id}
                        onClick={() => setFilter(prev => ({
                          ...prev,
                          status: prev.status.includes(status.id)
                            ? prev.status.filter(s => s !== status.id)
                            : [...prev.status, status.id]
                        }))}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          filter.status.includes(status.id)
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {status.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 検索 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">検索</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={filter.searchTerm}
                      onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                      placeholder="タスクを検索..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* カンバンボード */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {TASK_STATUSES.map(status => (
              <div 
                key={status.id} 
                className="bg-gray-50 rounded-lg"
                onDragOver={(e) => handleDragOver(e, status.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status.id)}
              >
                <div className={`p-4 ${status.color} rounded-t-lg ${
                  dragOverColumn === status.id ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                }`}>
                  <h3 className={`font-semibold ${status.textColor} flex items-center justify-between`}>
                    <span>{status.name}</span>
                    <span className="text-sm bg-white bg-opacity-70 px-2 py-1 rounded-full">
                      {tasksByStatus[status.id]?.length || 0}
                    </span>
                  </h3>
                  <p className="text-xs mt-1 opacity-75">{status.description}</p>
                </div>
                
                <div className="p-3 space-y-3 min-h-[400px]">
                  {tasksByStatus[status.id]?.map(renderTaskCard)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ToDo管理 */}
      {activeTab === 'todo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 今日のToDo */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 bg-blue-50 rounded-t-lg border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-900">今日のToDo</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-700">
                      {todayTodos.filter(t => t.isCompleted).length} / {todayTodos.length} 完了
                    </span>
                    <button
                      onClick={createTodosFromTemplates}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      テンプレート実行
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {todayTodos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    今日のToDoはありません
                  </div>
                ) : (
                  todayTodos.map(renderTodoItem)
                )}
              </div>
            </div>
          </div>

          {/* ToDoテンプレート管理 */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 bg-green-50 rounded-t-lg border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-green-900">デイリーテンプレート</h3>
                  <button
                    onClick={() => setShowTemplateForm(true)}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
                {todoTemplates.map(template => (
                  <div key={template.id} className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium text-gray-900">{template.title}</div>
                    {template.memo && (
                      <div className="text-sm text-gray-600">{template.memo}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {template.dayOfWeek.length === 0 
                        ? '毎日' 
                        : template.dayOfWeek.map(day => DAYS_OF_WEEK[day].short).join(',')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ToDoフォームモーダル */}
      {showTodoForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">新規ToDo追加</h3>
                <button
                  onClick={() => setShowTodoForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">タイトル *</label>
                <input
                  type="text"
                  value={todoForm.title}
                  onChange={(e) => setTodoForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ToDoのタイトル"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">メモ</label>
                <textarea
                  value={todoForm.memo}
                  onChange={(e) => setTodoForm(prev => ({ ...prev, memo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="詳細メモ（任意）"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">種別</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTodoForm(prev => ({ ...prev, type: 'spot' }))}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                      todoForm.type === 'spot'
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    スポット
                  </button>
                  <button
                    onClick={() => setTodoForm(prev => ({ ...prev, type: 'daily' }))}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                      todoForm.type === 'daily'
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
                  value={todoForm.dueDate}
                  onChange={(e) => setTodoForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 rounded-b-lg flex justify-end gap-3">
              <button
                onClick={() => setShowTodoForm(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleAddTodo(todoForm)}
                disabled={!todoForm.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* テンプレートフォームモーダル */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">デイリーテンプレート追加</h3>
                <button
                  onClick={() => setShowTemplateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">タイトル *</label>
                <input
                  type="text"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="テンプレートのタイトル"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">メモ</label>
                <textarea
                  value={templateForm.memo}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, memo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="詳細メモ（任意）"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">実行曜日</label>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.id}
                      onClick={() => setTemplateForm(prev => ({
                        ...prev,
                        dayOfWeek: prev.dayOfWeek.includes(day.id)
                          ? prev.dayOfWeek.filter(d => d !== day.id)
                          : [...prev.dayOfWeek, day.id]
                      }))}
                      className={`px-2 py-2 text-sm rounded transition-colors ${
                        templateForm.dayOfWeek.includes(day.id)
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  何も選択しない場合は毎日実行されます
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 rounded-b-lg flex justify-end gap-3">
              <button
                onClick={() => setShowTemplateForm(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleAddTemplate(templateForm)}
                disabled={!templateForm.title.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* タスク詳細モーダル */}
      {showTaskDetail && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">タスク詳細</h3>
                <button
                  onClick={() => setShowTaskDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{selectedTask.title}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`px-2 py-1 text-sm rounded-full ${
                      selectedTask.status === 'done' ? 'bg-green-100 text-green-800' :
                      selectedTask.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      selectedTask.status === 'pending-review' ? 'bg-orange-100 text-orange-800' :
                      selectedTask.status === 'blocked' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {TASK_STATUSES.find(s => s.id === selectedTask.status)?.name}
                    </span>
                    <span className={`px-2 py-1 text-sm rounded-full ${
                      selectedTask.priority === 'high' ? 'bg-red-100 text-red-800' :
                      selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      優先度: {PRIORITY_LEVELS.find(p => p.id === selectedTask.priority)?.name}
                    </span>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-700">{selectedTask.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">担当者</div>
                    <div className="text-gray-900">{selectedTask.assigneeNames.join(', ')}</div>
                  </div>
                  
                  {selectedTask.dueDate && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">期限</div>
                      <div className="text-gray-900">{new Date(selectedTask.dueDate).toLocaleString('ja-JP')}</div>
                    </div>
                  )}
                </div>

                {/* 確認待ちの場合のアクション */}
                {selectedTask.status === 'pending-review' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-orange-900">確認待ち</span>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          handleTaskReview(selectedTask.id, true);
                          setShowTaskDetail(false);
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
                            handleTaskReview(selectedTask.id, false, comment);
                            setShowTaskDetail(false);
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        差し戻し
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 進行中タスクの完了ボタン */}
                {selectedTask.status === 'in-progress' && (
                  <button
                    onClick={() => {
                      handleTaskComplete(selectedTask.id);
                      setShowTaskDetail(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    完了（確認待ちへ）
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;