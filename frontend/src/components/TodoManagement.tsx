// ディレクトリ: frontend/src/components/TodoManagement.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Plus, Edit3, Trash2, Save, X, Calendar, Clock, 
  ListTodo, RotateCcw, Check, Star, Archive,
  ChevronDown, ChevronRight, Filter, Search,
  PlayCircle, PauseCircle, Settings, Bell,
  Copy, Shuffle, Timer, Zap
} from 'lucide-react';

import {
  TodoItem, TodoTemplate, User, TodoForm, TodoTemplateForm,
  DAYS_OF_WEEK
} from '../types/index';

interface TodoManagementProps {
  currentUser: User | null;
  onNotification?: (title: string, message: string) => void;
}

const TodoManagement: React.FC<TodoManagementProps> = ({ 
  currentUser, 
  onNotification 
}) => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todoTemplates, setTodoTemplates] = useState<TodoTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'templates'>('today');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TodoTemplate | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompletedToday, setShowCompletedToday] = useState(true);

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
  // 初期データ設定
  // ============================================
  
  useEffect(() => {
    if (currentUser) {
      // サンプルテンプレートデータ
      const sampleTemplates: TodoTemplate[] = [
        {
          id: 'template001',
          title: 'メールチェック',
          memo: '重要なメールと未読メールを確認',
          isActive: true,
          createdBy: currentUser.id,
          createdAt: new Date(),
          dayOfWeek: [1, 2, 3, 4, 5], // 平日のみ
          order: 1
        },
        {
          id: 'template002',
          title: '日次報告書作成',
          memo: '昨日の実績と今日の予定をまとめる',
          isActive: true,
          createdBy: currentUser.id,
          createdAt: new Date(),
          dayOfWeek: [], // 毎日
          order: 2
        },
        {
          id: 'template003',
          title: '週次ミーティング準備',
          memo: 'アジェンダの確認と資料準備',
          isActive: true,
          createdBy: currentUser.id,
          createdAt: new Date(),
          dayOfWeek: [1], // 月曜のみ
          order: 3
        }
      ];

      // サンプルToDoデータ
      const sampleTodos: TodoItem[] = [
        {
          id: 'todo001',
          title: 'メールチェック',
          memo: '重要なメールと未読メールを確認',
          type: 'daily',
          isCompleted: true,
          createdBy: currentUser.id,
          createdAt: new Date(),
          completedAt: new Date(),
          templateId: 'template001',
          order: 1
        },
        {
          id: 'todo002',
          title: 'プレゼン資料作成',
          memo: '来週の重要会議用プレゼンテーション作成',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          type: 'spot',
          isCompleted: false,
          createdBy: currentUser.id,
          createdAt: new Date(),
          order: 2
        },
        {
          id: 'todo003',
          title: '日次報告書作成',
          memo: '昨日の実績と今日の予定をまとめる',
          type: 'daily',
          isCompleted: false,
          createdBy: currentUser.id,
          createdAt: new Date(),
          templateId: 'template002',
          order: 3
        },
        {
          id: 'todo004',
          title: 'システム障害対応',
          memo: '緊急対応が必要な障害の調査',
          dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2時間後
          type: 'spot',
          isCompleted: false,
          createdBy: currentUser.id,
          createdAt: new Date(),
          order: 4
        }
      ];

      setTodoTemplates(sampleTemplates);
      setTodos(sampleTodos);
    }
  }, [currentUser]);

  // ============================================
  // データ処理関数
  // ============================================
  
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
    }).sort((a, b) => {
      // 未完了を上に
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return a.order - b.order;
    });
  }, [todos]);

  // フィルター済みToDo（全体表示用）
  const filteredTodos = useMemo(() => {
    let filtered = todos;
    
    // 完了状態フィルター
    if (filter === 'completed') {
      filtered = filtered.filter(todo => todo.isCompleted);
    } else if (filter === 'pending') {
      filtered = filtered.filter(todo => !todo.isCompleted);
    }
    
    // 検索フィルター
    if (searchTerm) {
      filtered = filtered.filter(todo => 
        todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (todo.memo && todo.memo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [todos, filter, searchTerm]);

  // 今日の完了率計算
  const todayCompletionRate = useMemo(() => {
    if (todayTodos.length === 0) return 0;
    const completed = todayTodos.filter(todo => todo.isCompleted).length;
    return Math.round((completed / todayTodos.length) * 100);
  }, [todayTodos]);

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
    setShowAddForm(false);
    
    onNotification?.('ToDo追加', `「${newTodo.title}」を追加しました`);
  }, [todos.length, currentUser, onNotification]);

  const handleToggleTodo = useCallback((todoId: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === todoId) {
        const updated = {
          ...todo,
          isCompleted: !todo.isCompleted,
          completedAt: !todo.isCompleted ? new Date() : undefined
        };
        
        if (updated.isCompleted) {
          onNotification?.('ToDo完了', `「${todo.title}」が完了しました`);
        }
        
        return updated;
      }
      return todo;
    }));
  }, [onNotification]);

  const handleEditTodo = useCallback((todo: TodoItem, formData: TodoForm) => {
    setTodos(prev => prev.map(t => {
      if (t.id === todo.id) {
        return {
          ...t,
          title: formData.title,
          memo: formData.memo,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          type: formData.type
        };
      }
      return t;
    }));
    
    setEditingTodo(null);
    onNotification?.('ToDo更新', `「${formData.title}」を更新しました`);
  }, [onNotification]);

  const handleDeleteTodo = useCallback((todoId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (todo && confirm(`「${todo.title}」を削除しますか？`)) {
      setTodos(prev => prev.filter(t => t.id !== todoId));
      onNotification?.('ToDo削除', `「${todo.title}」を削除しました`);
    }
  }, [todos, onNotification]);

  // ============================================
  // テンプレート操作関数
  // ============================================
  
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
    
    onNotification?.('テンプレート追加', `「${newTemplate.title}」のテンプレートを作成しました`);
  }, [todoTemplates.length, currentUser, onNotification]);

  const handleToggleTemplate = useCallback((templateId: string) => {
    setTodoTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, isActive: !template.isActive }
        : template
    ));
  }, []);

  const handleDeleteTemplate = useCallback((templateId: string) => {
    const template = todoTemplates.find(t => t.id === templateId);
    if (template && confirm(`「${template.title}」のテンプレートを削除しますか？`)) {
      setTodoTemplates(prev => prev.filter(t => t.id !== templateId));
      onNotification?.('テンプレート削除', `「${template.title}」のテンプレートを削除しました`);
    }
  }, [todoTemplates, onNotification]);

  // テンプレートからToDo作成
  const createTodosFromTemplates = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    const applicableTemplates = todoTemplates.filter(template => 
      template.isActive && (
        template.dayOfWeek.length === 0 || // 毎日
        template.dayOfWeek.includes(dayOfWeek) // 指定曜日
      )
    );
    
    const newTodos = applicableTemplates.map((template, index) => ({
      id: `todo${Date.now()}_${template.id}_${index}`,
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
      onNotification?.('デイリーToDo作成', `${newTodos.length}件のToDoを作成しました`);
    } else {
      onNotification?.('テンプレート実行', '今日適用可能なテンプレートはありません');
    }
  }, [todoTemplates, currentUser, onNotification]);

  // 単一テンプレートからToDo作成
  const createTodoFromTemplate = useCallback((template: TodoTemplate) => {
    const newTodo: TodoItem = {
      id: `todo${Date.now()}_${template.id}`,
      title: template.title,
      memo: template.memo,
      type: 'daily',
      isCompleted: false,
      createdBy: currentUser?.id || '',
      createdAt: new Date(),
      templateId: template.id,
      order: template.order
    };
    
    setTodos(prev => [...prev, newTodo]);
    onNotification?.('ToDo作成', `「${template.title}」を追加しました`);
  }, [currentUser, onNotification]);

  // ============================================
  // ユーティリティ関数
  // ============================================
  
  const getDueDateColor = (dueDate?: Date) => {
    if (!dueDate) return 'text-gray-500';
    
    const now = new Date();
    const diff = new Date(dueDate).getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 0) return 'text-red-600'; // 期限切れ
    if (hours < 2) return 'text-orange-600'; // 2時間以内
    if (hours < 24) return 'text-yellow-600'; // 24時間以内
    return 'text-gray-600';
  };

  const formatDueDate = (dueDate?: Date) => {
    if (!dueDate) return '';
    
    const now = new Date();
    const diff = new Date(dueDate).getTime() - now.getTime();
    const hours = Math.abs(diff / (1000 * 60 * 60));
    
    if (diff < 0) {
      if (hours < 1) return '期限切れ（数分前）';
      if (hours < 24) return `期限切れ（${Math.floor(hours)}時間前）`;
      return `期限切れ（${Math.floor(hours / 24)}日前）`;
    } else {
      if (hours < 1) return '期限間近（1時間以内）';
      if (hours < 24) return `${Math.floor(hours)}時間後`;
      if (hours < 48) return '明日';
      return new Date(dueDate).toLocaleDateString('ja-JP');
    }
  };

  // ============================================
  // レンダリング関数
  // ============================================
  
  const renderTodoItem = (todo: TodoItem, showActions: boolean = true) => {
    const dueDateColor = getDueDateColor(todo.dueDate);
    
    return (
      <div 
        key={todo.id} 
        className={`p-4 rounded-lg border transition-all ${
          todo.isCompleted 
            ? 'bg-green-50 border-green-200' 
            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* 完了チェックボックス */}
          <button
            onClick={() => handleToggleTodo(todo.id)}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors mt-1 ${
              todo.isCompleted 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {todo.isCompleted && <Check className="w-3 h-3" />}
          </button>
          
          <div className="flex-1 min-w-0">
            {/* タイトル */}
            <div className={`font-medium transition-colors ${
              todo.isCompleted 
                ? 'text-gray-500 line-through' 
                : 'text-gray-900'
            }`}>
              {todo.title}
            </div>
            
            {/* メモ */}
            {todo.memo && (
              <div className={`text-sm mt-1 ${
                todo.isCompleted ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {todo.memo}
              </div>
            )}
            
            {/* メタ情報 */}
            <div className="flex items-center gap-4 mt-2">
              {/* 種別 */}
              <span className={`px-2 py-1 text-xs rounded-full ${
                todo.type === 'daily' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {todo.type === 'daily' ? 'デイリー' : 'スポット'}
              </span>
              
              {/* 期限 */}
              {todo.dueDate && (
                <div className={`text-xs flex items-center gap-1 ${dueDateColor}`}>
                  <Calendar className="w-3 h-3" />
                  {formatDueDate(todo.dueDate)}
                </div>
              )}
              
              {/* テンプレート由来 */}
              {todo.templateId && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Copy className="w-3 h-3" />
                  テンプレート
                </div>
              )}
            </div>
          </div>
          
          {/* アクションボタン */}
          {showActions && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setEditingTodo(todo);
                  setTodoForm({
                    title: todo.title,
                    memo: todo.memo || '',
                    dueDate: todo.dueDate ? todo.dueDate.toISOString().slice(0, 16) : '',
                    type: todo.type
                  });
                }}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                title="編集"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                title="削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTemplateItem = (template: TodoTemplate) => {
    const dayNames = template.dayOfWeek.length === 0 
      ? '毎日' 
      : template.dayOfWeek.map(day => DAYS_OF_WEEK[day].short).join(',');

    return (
      <div 
        key={template.id} 
        className={`p-4 rounded-lg border transition-colors ${
          template.isActive 
            ? 'bg-white border-gray-200 hover:border-blue-300' 
            : 'bg-gray-50 border-gray-300'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* アクティブ状態アイコン */}
          <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-1 ${
            template.isActive 
              ? 'bg-green-100 text-green-600' 
              : 'bg-gray-100 text-gray-400'
          }`}>
            {template.isActive ? <PlayCircle className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={`font-medium ${
              template.isActive ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {template.title}
            </div>
            
            {template.memo && (
              <div className="text-sm text-gray-600 mt-1">{template.memo}</div>
            )}
            
            <div className="flex items-center gap-4 mt-2">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {dayNames}
              </div>
              
              <button
                onClick={() => createTodoFromTemplate(template)}
                disabled={!template.isActive}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                今すぐ作成
              </button>
            </div>
          </div>
          
          {/* アクションボタン */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleToggleTemplate(template.id)}
              className={`p-1 rounded transition-colors ${
                template.isActive 
                  ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-100' 
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-100'
              }`}
              title={template.isActive ? '無効化' : '有効化'}
            >
              {template.isActive ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setEditingTemplate(template);
                setTemplateForm({
                  title: template.title,
                  memo: template.memo || '',
                  dayOfWeek: template.dayOfWeek
                });
              }}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
              title="編集"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteTemplate(template.id)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ToDo管理</h1>
          <p className="text-gray-600">デイリールーティンとスポット作業を効率的に管理</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 今日の完了率 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg">
            <div className={`w-3 h-3 rounded-full ${
              todayCompletionRate >= 80 ? 'bg-green-500' :
              todayCompletionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-700">今日: {todayCompletionRate}%</span>
          </div>
          
          {/* テンプレート実行ボタン */}
          <button
            onClick={createTodosFromTemplates}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            テンプレート実行
          </button>
          
          {/* 追加ボタン */}
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新規ToDo
          </button>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-6 py-3 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'today' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          今日のToDo ({todayTodos.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'all' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ListTodo className="w-4 h-4 inline mr-2" />
          すべてのToDo ({todos.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-6 py-3 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'templates' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          テンプレート ({todoTemplates.length})
        </button>
      </div>

      {/* 今日のToDo */}
      {activeTab === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 bg-blue-50 rounded-t-lg border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-900">今日のToDo</h3>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-blue-700">
                      {todayTodos.filter(t => t.isCompleted).length} / {todayTodos.length} 完了
                    </div>
                    <div className={`w-16 h-2 bg-blue-200 rounded-full overflow-hidden`}>
                      <div 
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${todayCompletionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                {todayTodos.length === 0 ? (
                  <div className="text-center py-12">
                    <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">今日のToDoはありません</p>
                    <p className="text-sm text-gray-400 mt-1">テンプレートを実行するか、新規ToDoを作成してください</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* 未完了ToDo */}
                    {todayTodos.filter(todo => !todo.isCompleted).map(todo => renderTodoItem(todo))}
                    
                    {/* 完了ToDo（折りたたみ可能） */}
                    {todayTodos.filter(todo => todo.isCompleted).length > 0 && (
                      <div className="border-t pt-4 mt-4">
                        <button
                          onClick={() => setShowCompletedToday(!showCompletedToday)}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-3 transition-colors"
                        >
                          {showCompletedToday ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          完了済み ({todayTodos.filter(todo => todo.isCompleted).length}件)
                        </button>
                        
                        {showCompletedToday && (
                          <div className="space-y-2">
                            {todayTodos.filter(todo => todo.isCompleted).map(todo => renderTodoItem(todo, false))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* サイドパネル */}
          <div className="space-y-6">
            {/* 今日の統計 */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h4 className="font-semibold text-gray-900 mb-3">今日の進捗</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">完了率</span>
                  <span className="font-bold text-blue-600">{todayCompletionRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">残りタスク</span>
                  <span className="font-bold text-orange-600">{todayTodos.filter(t => !t.isCompleted).length}件</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">期限間近</span>
                  <span className="font-bold text-red-600">
                    {todayTodos.filter(t => t.dueDate && new Date(t.dueDate).getTime() - new Date().getTime() < 2 * 60 * 60 * 1000).length}件
                  </span>
                </div>
              </div>
            </div>

            {/* クイックアクション */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h4 className="font-semibold text-gray-900 mb-3">クイックアクション</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('templates')}
                  className="w-full p-3 text-left bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">テンプレート管理</span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    const completed = todos.filter(t => t.isCompleted && t.createdBy === currentUser?.id);
                    if (completed.length > 0 && confirm(`完了済みToDo ${completed.length}件をアーカイブしますか？`)) {
                      setTodos(prev => prev.filter(t => !t.isCompleted));
                      onNotification?.('アーカイブ完了', `${completed.length}件のToDoをアーカイブしました`);
                    }
                  }}
                  className="w-full p-3 text-left bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">完了済みをアーカイブ</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* すべてのToDo */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          {/* フィルターとサーチ */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ToDoを検索..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">すべて</option>
                <option value="pending">未完了</option>
                <option value="completed">完了済み</option>
              </select>
            </div>
          </div>

          {/* ToDoリスト */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 bg-gray-50 rounded-t-lg border-b">
              <h3 className="font-semibold text-gray-900">
                すべてのToDo ({filteredTodos.length}件)
              </h3>
            </div>
            
            <div className="p-4">
              {filteredTodos.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || filter !== 'all' ? 'マッチするToDoが見つかりません' : 'ToDoがありません'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTodos.map(todo => renderTodoItem(todo))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* テンプレート管理 */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">テンプレート管理</h2>
              <p className="text-gray-600">デイリールーティンのテンプレートを管理</p>
            </div>
            
            <button
              onClick={() => setShowTemplateForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新規テンプレート
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 bg-green-50 rounded-t-lg border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-green-900">
                  登録済みテンプレート ({todoTemplates.length}件)
                </h3>
                <div className="text-sm text-green-700">
                  有効: {todoTemplates.filter(t => t.isActive).length}件
                </div>
              </div>
            </div>
            
            <div className="p-4">
              {todoTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">テンプレートがありません</p>
                  <p className="text-sm text-gray-400 mt-1">デイリールーティン用のテンプレートを作成してください</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todoTemplates.map(template => renderTemplateItem(template))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ToDoフォームモーダル */}
      {(showAddForm || editingTodo) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTodo ? 'ToDo編集' : '新規ToDo追加'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingTodo(null);
                    setTodoForm({ title: '', memo: '', dueDate: '', type: 'spot' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* タイトル */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={todoForm.title}
                  onChange={(e) => setTodoForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ToDoのタイトルを入力"
                  autoFocus
                />
              </div>
              
              {/* メモ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">メモ</label>
                <textarea
                  value={todoForm.memo}
                  onChange={(e) => setTodoForm(prev => ({ ...prev, memo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="詳細メモ（任意）"
                />
              </div>
              
              {/* 種別選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">種別</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTodoForm(prev => ({ ...prev, type: 'spot' }))}
                    className={`px-4 py-3 text-sm font-medium rounded-lg border transition-colors ${
                      todoForm.type === 'spot'
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Star className="w-4 h-4" />
                      スポット
                    </div>
                  </button>
                  <button
                    onClick={() => setTodoForm(prev => ({ ...prev, type: 'daily' }))}
                    className={`px-4 py-3 text-sm font-medium rounded-lg border transition-colors ${
                      todoForm.type === 'daily'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <RotateCcw className="w-4 h-4" />
                      デイリー
                    </div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  スポット: 一度限りの作業 / デイリー: 日常的な作業
                </p>
              </div>
              
              {/* 期限 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">期限</label>
                <input
                  type="datetime-local"
                  value={todoForm.dueDate}
                  onChange={(e) => setTodoForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  期限を設定すると通知でリマインドされます
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 rounded-b-lg flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingTodo(null);
                  setTodoForm({ title: '', memo: '', dueDate: '', type: 'spot' });
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  if (editingTodo) {
                    handleEditTodo(editingTodo, todoForm);
                  } else {
                    handleAddTodo(todoForm);
                  }
                }}
                disabled={!todoForm.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingTodo ? '更新' : '追加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* テンプレートフォームモーダル */}
      {(showTemplateForm || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTemplate ? 'テンプレート編集' : 'デイリーテンプレート追加'}
                </h3>
                <button
                  onClick={() => {
                    setShowTemplateForm(false);
                    setEditingTemplate(null);
                    setTemplateForm({ title: '', memo: '', dayOfWeek: [] });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* タイトル */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="テンプレートのタイトル"
                  autoFocus
                />
              </div>
              
              {/* メモ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">メモ</label>
                <textarea
                  value={templateForm.memo}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, memo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="詳細メモ（任意）"
                />
              </div>
              
              {/* 実行曜日 */}
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
                          : [...prev.dayOfWeek, day.id].sort()
                      }))}
                      className={`px-2 py-3 text-sm font-medium rounded-lg border transition-colors ${
                        templateForm.dayOfWeek.includes(day.id)
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-center">
                        <div>{day.short}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  何も選択しない場合は毎日実行されます
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 rounded-b-lg flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTemplateForm(false);
                  setEditingTemplate(null);
                  setTemplateForm({ title: '', memo: '', dayOfWeek: [] });
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  if (editingTemplate) {
                    setTodoTemplates(prev => prev.map(template =>
                      template.id === editingTemplate.id
                        ? {
                            ...template,
                            title: templateForm.title,
                            memo: templateForm.memo,
                            dayOfWeek: templateForm.dayOfWeek
                          }
                        : template
                    ));
                    setEditingTemplate(null);
                    onNotification?.('テンプレート更新', `「${templateForm.title}」を更新しました`);
                  } else {
                    handleAddTemplate(templateForm);
                  }
                }}
                disabled={!templateForm.title.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingTemplate ? '更新' : '追加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {todoTemplates.length > 0 && (
        <div className="space-y-3">
          {todoTemplates.map(template => renderTemplateItem(template))}
        </div>
      )}
    </div>
  );
};

export default TodoManagement;