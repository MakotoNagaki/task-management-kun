import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Edit3, User, Calendar, Tag, Info, Save, XCircle, AlertCircle, Settings, Users, ChevronDown, UserCheck, UsersIcon, Database, Loader } from 'lucide-react';
import './styles/globals.css';

// コンポーネントとフックをインポート
import DataManagement from './components/DataManagement';
import { useLocalStorage, useAutoSaveLocalStorage, STORAGE_KEYS } from './hooks/useLocalStorage';
import { useAuth } from './hooks/useAuth';

// 型定義をインポート
import type { 
  Task, TaskList, DraggedCard, User as UserType, Team, UserSession, 
  NewTaskForm, EditTaskForm, AssigneeSelection, TeamWithMembers 
} from './types';

/**
 * タスク管理くん - データ永続化対応版
 */
const App: React.FC = () => {
  // ============================================
  // 認証フック
  // ============================================
  
  const { 
    authState,
    getRememberedEmail, 
    getRememberedUser, 
    setRememberedEmail, 
    clearRememberedUser,
    loginAsUser,
    createSimpleLoginForm 
  } = useAuth();

  // ============================================
  // データ永続化フック
  // ============================================
  
  // ローカルストレージからのデータ読み込み
  const [persistedLists, setPersistedLists] = useAutoSaveLocalStorage<TaskList[]>(STORAGE_KEYS.TASKS, []);
  const [persistedUsers, setPersistedUsers] = useLocalStorage<UserType[]>(STORAGE_KEYS.USERS, []);
  const [persistedTeams, setPersistedTeams] = useLocalStorage<Team[]>(STORAGE_KEYS.TEAMS, []);
  const [persistedCurrentUser, setPersistedCurrentUser] = useLocalStorage<UserType | null>(STORAGE_KEYS.CURRENT_USER, null);

  // ============================================
  // モックデータの定義（初期データ用）
  // ============================================
  
  const getInitialUsers = useCallback((): UserType[] => [
    {
      id: 'user_1',
      name: '田中太郎',
      email: 'tanaka@company.com',
      role: 'manager',
      department: '開発部',
      position: 'シニアエンジニア',
      teamIds: ['team_1', 'team_3'],
      primaryTeamId: 'team_1',
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-09-01'),
      preferences: {
        theme: 'light',
        language: 'ja',
        notifications: { email: true, slack: true, browser: true, sound: false, dueDate: true, taskAssigned: true, taskCompleted: true, teamMention: true },
        defaultAssigneeType: 'user',
        workingHours: { start: '09:00', end: '18:00' }
      }
    },
    {
      id: 'user_2',
      name: '佐藤花子',
      email: 'sato@company.com',
      role: 'member',
      department: '開発部',
      position: 'エンジニア',
      teamIds: ['team_1'],
      primaryTeamId: 'team_1',
      isActive: true,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-08-25'),
      preferences: {
        theme: 'dark',
        language: 'ja',
        notifications: { email: true, slack: true, browser: true, sound: true, dueDate: true, taskAssigned: true, taskCompleted: false, teamMention: true },
        defaultAssigneeType: 'user',
        workingHours: { start: '10:00', end: '19:00' }
      }
    },
    {
      id: 'user_3',
      name: '鈴木一郎',
      email: 'suzuki@company.com',
      role: 'member',
      department: '開発部',
      position: 'エンジニア',
      teamIds: ['team_1'],
      primaryTeamId: 'team_1',
      isActive: true,
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-08-30'),
      preferences: {
        theme: 'auto',
        language: 'ja',
        notifications: { email: false, slack: true, browser: true, sound: false, dueDate: true, taskAssigned: true, taskCompleted: true, teamMention: false },
        defaultAssigneeType: 'team',
        workingHours: { start: '09:30', end: '18:30' }
      }
    }
  ], []);

  const getInitialTeams = useCallback((): Team[] => [
    {
      id: 'team_1',
      name: '開発チーム',
      description: 'Webアプリケーション開発を担当',
      color: '#3b82f6',
      icon: '💻',
      memberIds: ['user_1', 'user_2', 'user_3'],
      leaderId: 'user_1',
      isActive: true,
      createdBy: 'user_1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-08-15')
    },
    {
      id: 'team_2',
      name: 'デザインチーム',
      description: 'UI/UXデザインとブランディング',
      color: '#8b5cf6',
      icon: '🎨',
      memberIds: ['user_2'],
      leaderId: 'user_2',
      isActive: true,
      createdBy: 'user_1',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-08-10')
    }
  ], []);

  const getInitialLists = useCallback((): TaskList[] => [
    {
      id: 'todo',
      title: 'To Do',
      color: '#6b7280',
      cards: [
        {
          id: '1',
          title: '新機能の設計',
          description: 'ユーザー管理機能の詳細設計を作成する',
          assigneeType: 'user',
          assigneeUserId: 'user_1',
          assigneeName: '田中太郎',
          createdBy: 'user_1',
          createdByName: '田中太郎',
          dueDate: '2024-09-15',
          tags: ['設計', '重要'],
          priority: 'high',
          status: 'todo',
          createdAt: new Date('2024-09-01'),
          updatedAt: new Date('2024-09-01')
        }
      ]
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: '#3b82f6',
      cards: [
        {
          id: '2',
          title: 'API開発',
          description: 'ユーザー認証APIの実装',
          assigneeType: 'user',
          assigneeUserId: 'user_2',
          assigneeName: '佐藤花子',
          createdBy: 'user_1',
          createdByName: '田中太郎',
          dueDate: '2024-09-10',
          tags: ['API', '開発'],
          priority: 'high',
          status: 'in-progress',
          createdAt: new Date('2024-08-25'),
          updatedAt: new Date('2024-09-01')
        }
      ]
    },
    {
      id: 'done',
      title: 'Done',
      color: '#10b981',
      cards: [
        {
          id: '3',
          title: 'ロゴデザイン',
          description: '新しいプロジェクトのロゴを作成',
          assigneeType: 'team',
          assigneeTeamId: 'team_2',
          assigneeName: 'デザインチーム',
          createdBy: 'user_2',
          createdByName: '佐藤花子',
          dueDate: '2024-08-31',
          tags: ['デザイン'],
          priority: 'medium',
          status: 'done',
          createdAt: new Date('2024-08-20'),
          updatedAt: new Date('2024-08-30')
        }
      ]
    }
  ], []);

  // セキュアなデータ生成ログ
  useEffect(() => {
    console.log('セキュアユーザーデータを生成しました');
  }, []);

  // 永続化されたデータまたは初期データを使用
  const users = persistedUsers.length > 0 ? persistedUsers : getInitialUsers();
  const teams = persistedTeams.length > 0 ? persistedTeams : getInitialTeams();
  const lists = persistedLists.length > 0 ? persistedLists : getInitialLists();
  
  // 現在のユーザー（永続化データまたは初期ユーザー）
  const currentUser = persistedCurrentUser || users[0];

  // 初期データを永続化（初回のみ）
  useEffect(() => {
    if (persistedUsers.length === 0) {
      setPersistedUsers(getInitialUsers());
    }
    if (persistedTeams.length === 0) {
      setPersistedTeams(getInitialTeams());
    }
    if (persistedLists.length === 0) {
      setPersistedLists(getInitialLists());
    }
    if (!persistedCurrentUser) {
      setPersistedCurrentUser(getInitialUsers()[0]);
    }
  }, [
    persistedUsers.length,
    persistedTeams.length, 
    persistedLists.length,
    persistedCurrentUser,
    setPersistedUsers,
    setPersistedTeams,
    setPersistedLists,
    setPersistedCurrentUser,
    getInitialUsers,
    getInitialTeams,
    getInitialLists
  ]);

  // 現在のユーザーセッション
  const [userSession, setUserSession] = useState<UserSession>({
    currentUser: currentUser,
    availableTeams: teams,
    availableUsers: users,
    isAuthenticated: true
  });

  // userSessionを更新（データが変更された時）
  useEffect(() => {
    setUserSession({
      currentUser: currentUser,
      availableTeams: teams,
      availableUsers: users,
      isAuthenticated: true
    });
  }, [currentUser, teams, users]);

  // 認証情報を初期化時にチェック
  useEffect(() => {
    const rememberedEmail = getRememberedEmail();
    if (rememberedEmail) {
      console.log('Remembered email found:', rememberedEmail);
    }
  }, [getRememberedEmail]);

  // ドラッグ&ドロップ関連の状態
  const [draggedCard, setDraggedCard] = useState<DraggedCard | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const dragCounter = useRef<number>(0);

  // フォーム関連の状態
  const [isAddingCard, setIsAddingCard] = useState<Record<string, boolean>>({});
  const [editingCard, setEditingCard] = useState<string | null>(null);
  
  // 新規タスクフォームの状態
  const [newTaskForm, setNewTaskForm] = useState<NewTaskForm>({
    title: '',
    description: '',
    assigneeSelection: {
      type: 'user'
    },
    dueDate: '',
    tags: [],
    priority: 'medium',
    selectedTeamId: currentUser?.primaryTeamId || '',
    selectedUserIds: []
  });

  // 編集用フォームの状態
  const [editForm, setEditForm] = useState<EditTaskForm>({
    title: '',
    description: '',
    assigneeSelection: {
      type: 'user'
    },
    dueDate: '',
    tags: [],
    priority: 'medium',
    status: 'todo',
    selectedTeamId: '',
    selectedUserIds: []
  });

  // UI状態
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isTeamManagementOpen, setIsTeamManagementOpen] = useState(false);
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);

  // ============================================
  // データ更新時の永続化処理
  // ============================================

  // リストデータが変更された時に自動保存
  const updateLists = useCallback((newLists: TaskList[]) => {
    setPersistedLists(newLists);
  }, [setPersistedLists]);

  // ユーザーデータを更新
  const updateUsers = useCallback((newUsers: UserType[]) => {
    setPersistedUsers(newUsers);
  }, [setPersistedUsers]);

  // チームデータを更新
  const updateTeams = useCallback((newTeams: Team[]) => {
    setPersistedTeams(newTeams);
  }, [setPersistedTeams]);

  // 現在のユーザーを更新
  const updateCurrentUser = useCallback((newCurrentUser: UserType) => {
    setPersistedCurrentUser(newCurrentUser);
  }, [setPersistedCurrentUser]);

  // ============================================
  // ヘルパー関数
  // ============================================

  const getTeamById = (teamId: string): Team | undefined => {
    return teams.find(team => team.id === teamId);
  };

  const getUserById = (userId: string): UserType | undefined => {
    return users.find(user => user.id === userId);
  };

  const getTeamMembers = (teamId: string): UserType[] => {
    const team = getTeamById(teamId);
    if (!team) return [];
    return team.memberIds.map(userId => getUserById(userId)).filter(Boolean) as UserType[];
  };

  const generateAssigneeName = (selection: AssigneeSelection): string => {
    const { type, userId, teamId } = selection;
    
    if (type === 'user' && userId) {
      const user = getUserById(userId);
      return user ? user.name : '';
    }
    
    if (type === 'team' && teamId) {
      const team = getTeamById(teamId);
      return team ? team.name : '';
    }
    
    if (type === 'both' && userId && teamId) {
      const user = getUserById(userId);
      const team = getTeamById(teamId);
      return user && team ? `${user.name} (${team.name})` : '';
    }
    
    return '';
  };

  // ============================================
  // ドラッグ&ドロップ関連のイベントハンドラー
  // ============================================

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, card: Task, sourceListId: string) => {
    const draggedCardData: DraggedCard = { ...card, sourceListId };
    setDraggedCard(draggedCardData);
    
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.id);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, listId: string) => {
    e.preventDefault();
    dragCounter.current++;
    setDraggedOver(listId);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDraggedOver(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetListId: string) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDraggedOver(null);

    if (!draggedCard) return;

    const { sourceListId, ...cardToMove } = draggedCard;

    if (sourceListId === targetListId) {
      setDraggedCard(null);
      return;
    }

    // 状態を更新
    const updatedCard = { 
      ...cardToMove, 
      status: getListStatus(targetListId),
      updatedAt: new Date()
    };

    const newLists = lists.map(list => {
      if (list.id === sourceListId) {
        return { 
          ...list, 
          cards: list.cards.filter(card => card.id !== cardToMove.id) 
        };
      } else if (list.id === targetListId) {
        return { 
          ...list, 
          cards: [...list.cards, updatedCard] 
        };
      }
      return list;
    });

    updateLists(newLists);
    setDraggedCard(null);
  };

  // リストIDから対応するステータスを取得
  const getListStatus = (listId: string): 'todo' | 'in-progress' | 'done' | 'blocked' => {
    switch (listId) {
      case 'todo': return 'todo';
      case 'in-progress': return 'in-progress';
      case 'done': return 'done';
      default: return 'todo';
    }
  };

  // ============================================
  // フォーム操作関数
  // ============================================

  const startAddCard = (listId: string) => {
    setIsAddingCard(prev => ({ ...prev, [listId]: true }));
  };

  const addEnhancedCard = (listId: string) => {
    if (!newTaskForm.title.trim()) return;

    const assigneeName = generateAssigneeName(newTaskForm.assigneeSelection);

    const newCard: Task = {
      id: Date.now().toString(),
      title: newTaskForm.title.trim(),
      description: newTaskForm.description.trim(),
      assigneeType: newTaskForm.assigneeSelection.type,
      assigneeUserId: newTaskForm.assigneeSelection.userId,
      assigneeTeamId: newTaskForm.assigneeSelection.teamId,
      assigneeName: assigneeName,
      createdBy: currentUser?.id || 'unknown',
      createdByName: currentUser?.name || '不明',
      dueDate: newTaskForm.dueDate,
      tags: newTaskForm.tags,
      priority: newTaskForm.priority,
      status: getListStatus(listId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newLists = lists.map(list => 
      list.id === listId 
        ? { ...list, cards: [...list.cards, newCard] }
        : list
    );

    updateLists(newLists);
    cancelAddCard(listId);
  };

  const startEdit = (card: Task) => {
    setEditingCard(card.id);
    setEditForm({
      title: card.title,
      description: card.description || '',
      assigneeSelection: {
        type: card.assigneeType,
        userId: card.assigneeUserId,
        teamId: card.assigneeTeamId
      },
      dueDate: card.dueDate || '',
      tags: card.tags,
      priority: card.priority,
      status: card.status,
      selectedTeamId: card.assigneeTeamId || '',
      selectedUserIds: card.assigneeUserId ? [card.assigneeUserId] : []
    });
  };

  const saveEdit = (listId: string, cardId: string) => {
    if (!editForm.title.trim()) return;

    const assigneeName = generateAssigneeName(editForm.assigneeSelection);

    const newLists = lists.map(list => 
      list.id === listId 
        ? { 
            ...list, 
            cards: list.cards.map(card => 
              card.id === cardId 
                ? { 
                    ...card, 
                    title: editForm.title.trim(),
                    description: editForm.description.trim(),
                    assigneeType: editForm.assigneeSelection.type,
                    assigneeUserId: editForm.assigneeSelection.userId,
                    assigneeTeamId: editForm.assigneeSelection.teamId,
                    assigneeName: assigneeName,
                    dueDate: editForm.dueDate,
                    tags: editForm.tags,
                    priority: editForm.priority,
                    status: editForm.status,
                    updatedAt: new Date()
                  } 
                : card
            )
          }
        : list
    );

    updateLists(newLists);
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setEditForm({
      title: '',
      description: '',
      assigneeSelection: { type: 'user' },
      dueDate: '',
      tags: [],
      priority: 'medium',
      status: 'todo',
      selectedTeamId: '',
      selectedUserIds: []
    });
  };

  const cancelAddCard = (listId: string) => {
    setIsAddingCard(prev => ({ ...prev, [listId]: false }));
    resetNewTaskForm();
  };

  const resetNewTaskForm = () => {
    setNewTaskForm({
      title: '',
      description: '',
      assigneeSelection: { type: 'user' },
      dueDate: '',
      tags: [],
      priority: 'medium',
      selectedTeamId: currentUser?.primaryTeamId || '',
      selectedUserIds: []
    });
  };

  // ============================================
  // ユーザー切り替え機能
  // ============================================

  const switchUser = (userId: string) => {
    const user = getUserById(userId);
    if (user) {
      updateCurrentUser(user);
      setNewTaskForm(prev => ({
        ...prev,
        selectedTeamId: user.primaryTeamId || ''
      }));
    }
  };

  // ============================================
  // データ復元後のコールバック
  // ============================================

  const handleDataImported = useCallback(() => {
    // ページをリロードしてデータを再読み込み
    window.location.reload();
  }, []);

  // ============================================
  // ユーティリティ関数
  // ============================================

  const getTotalTasks = () => {
    return lists.reduce((total, list) => total + list.cards.length, 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  const getPriorityLabel = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '中';
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  // よく使われるタグのリスト
  const commonTags = ['緊急', '重要', 'バグ修正', '新機能', '改善', '設計', 'テスト', 'レビュー', 'ドキュメント'];

  return (
    <>
      {/* ヘッダー */}
      <header className="header">
        <div className="header-container">
          <div className="app-icon">
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>
              📋
            </div>
          </div>
          
          <h1 className="app-title">タスク管理くん</h1>
          
          <div className="header-stats">
            <div className="stats-item">
              <span className="stats-label">総タスク数</span>
              <span className="stats-value">{getTotalTasks()}</span>
            </div>
          </div>

          <div className="header-controls">
            <button
              onClick={() => setIsUserSettingsOpen(true)}
              className="control-btn"
              title="ユーザー設定"
            >
              <User size={20} />
              <span>{currentUser?.name}</span>
              <ChevronDown size={16} />
            </button>

            <button
              onClick={() => setIsDataManagementOpen(true)}
              className="control-btn"
              title="データ管理"
            >
              <Database size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="main-content">
        <div className="kanban-board">
          {lists.map(list => (
            <div key={list.id} className="kanban-list">
              <div className="list-header">
                <h2 className="list-title" style={{ borderColor: list.color }}>
                  {list.title}
                  <span className="task-count">({list.cards.length})</span>
                </h2>
                <button
                  onClick={() => startAddCard(list.id)}
                  className="add-task-btn"
                  title="タスクを追加"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div 
                className={`list-content ${draggedOver === list.id ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, list.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, list.id)}
              >
                {/* 既存のタスクカード */}
                {list.cards.map(card => (
                  <div key={card.id} className="task-card">
                    {editingCard === card.id ? (
                      /* 編集モード */
                      <div className="enhanced-form">
                        {/* タイトル */}
                        <div className="form-row">
                          <label className="form-label">
                            <span className="label-text">タスクタイトル *</span>
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                              className="form-input"
                              placeholder="タスクのタイトルを入力"
                              required
                            />
                          </label>
                        </div>

                        {/* 説明 */}
                        <div className="form-row">
                          <label className="form-label">
                            <span className="label-text">説明</span>
                            <textarea
                              value={editForm.description}
                              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                              className="form-textarea"
                              placeholder="タスクの詳細説明"
                              rows={3}
                            />
                          </label>
                        </div>

                        {/* 担当者設定 */}
                        <div className="form-row">
                          <span className="label-text">担当者設定</span>
                          <div className="assignee-type-selector">
                            <button
                              onClick={() => setEditForm(prev => ({
                                ...prev,
                                assigneeSelection: { type: 'team' }
                              }))}
                              className={`assignee-type-btn ${editForm.assigneeSelection.type === 'team' ? 'active' : ''}`}
                            >
                              <Users size={16} />
                              チーム
                            </button>
                            <button
                              onClick={() => setEditForm(prev => ({
                                ...prev,
                                assigneeSelection: { type: 'user' }
                              }))}
                              className={`assignee-type-btn ${editForm.assigneeSelection.type === 'user' ? 'active' : ''}`}
                            >
                              <User size={16} />
                              個人
                            </button>
                          </div>
                        </div>

                        {/* 個人担当者選択 */}
                        {editForm.assigneeSelection.type === 'user' && (
                          <div className="form-row">
                            <label className="form-label">
                              <span className="label-text">担当者</span>
                              <select
                                value={editForm.assigneeSelection.userId || ''}
                                onChange={(e) => setEditForm(prev => ({
                                  ...prev,
                                  assigneeSelection: {
                                    type: 'user',
                                    userId: e.target.value
                                  }
                                }))}
                                className="form-select"
                              >
                                <option value="">担当者を選択</option>
                                {users.map(user => (
                                  <option key={user.id} value={user.id}>
                                    {user.name} ({user.position})
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        )}

                        {/* チーム担当者選択 */}
                        {editForm.assigneeSelection.type === 'team' && (
                          <div className="form-row">
                            <label className="form-label">
                              <span className="label-text">担当チーム</span>
                              <select
                                value={editForm.assigneeSelection.teamId || ''}
                                onChange={(e) => setEditForm(prev => ({
                                  ...prev,
                                  assigneeSelection: {
                                    type: 'team',
                                    teamId: e.target.value
                                  }
                                }))}
                                className="form-select"
                              >
                                <option value="">チームを選択</option>
                                {teams.map(team => (
                                  <option key={team.id} value={team.id}>
                                    {team.icon} {team.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        )}

                        {/* 期限と優先度 */}
                        <div className="form-row-split">
                          <label className="form-label">
                            <span className="label-text">期限</span>
                            <input
                              type="date"
                              value={editForm.dueDate}
                              onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                              className="form-input"
                            />
                          </label>

                          <label className="form-label">
                            <span className="label-text">優先度</span>
                            <select
                              value={editForm.priority}
                              onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                              className="form-select"
                            >
                              <option value="low">低</option>
                              <option value="medium">中</option>
                              <option value="high">高</option>
                            </select>
                          </label>
                        </div>

                        {/* ステータス */}
                        <div className="form-row">
                          <label className="form-label">
                            <span className="label-text">ステータス</span>
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as 'todo' | 'in-progress' | 'done' | 'blocked' }))}
                              className="form-select"
                            >
                              <option value="todo">To Do</option>
                              <option value="in-progress">In Progress</option>
                              <option value="done">Done</option>
                              <option value="blocked">Blocked</option>
                            </select>
                          </label>
                        </div>

                        {/* タグ */}
                        <div className="form-row">
                          <span className="label-text">タグ</span>
                          <div className="tag-selector">
                            {commonTags.map(tag => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  setEditForm(prev => ({
                                    ...prev,
                                    tags: prev.tags.includes(tag)
                                      ? prev.tags.filter(t => t !== tag)
                                      : [...prev.tags, tag]
                                  }));
                                }}
                                className={`tag-btn ${editForm.tags.includes(tag) ? 'selected' : ''}`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* アクションボタン */}
                        <div className="form-actions enhanced">
                          <button
                            onClick={cancelEdit}
                            className="btn btn-secondary"
                            type="button"
                          >
                            <XCircle size={16} />
                            キャンセル
                          </button>
                          <button
                            onClick={() => saveEdit(list.id, card.id)}
                            className="btn btn-primary"
                            type="button"
                            disabled={!editForm.title.trim()}
                          >
                            <Save size={16} />
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 表示モード */
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, card, list.id)}
                        className="card-display"
                      >
                        <div className="card-header">
                          <h3 className="card-title">{card.title}</h3>
                          <button
                            onClick={() => startEdit(card)}
                            className="edit-btn"
                            title="編集"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>

                        {card.description && (
                          <p className="card-description">{card.description}</p>
                        )}

                        <div className="card-meta">
                          {card.assigneeName && (
                            <div className="meta-item assignee">
                              {card.assigneeType === 'team' ? (
                                <UsersIcon size={14} />
                              ) : (
                                <UserCheck size={14} />
                              )}
                              <span>{card.assigneeName}</span>
                            </div>
                          )}

                          {card.dueDate && (
                            <div className="meta-item due-date">
                              <Calendar size={14} />
                              <span>{formatDate(card.dueDate)}</span>
                            </div>
                          )}

                          <div className="meta-item priority">
                            <AlertCircle 
                              size={14} 
                              style={{ color: getPriorityColor(card.priority) }}
                            />
                            <span>優先度: {getPriorityLabel(card.priority)}</span>
                          </div>
                        </div>

                        {card.tags && card.tags.length > 0 && (
                          <div className="card-tags">
                            {card.tags.map(tag => (
                              <span key={tag} className="tag">
                                <Tag size={12} />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="card-footer">
                          <small>作成者: {card.createdByName}</small>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* 新規タスク追加フォーム */}
                {isAddingCard[list.id] && (
                  <div className="task-card">
                    <div className="enhanced-form">
                      {/* タイトル */}
                      <div className="form-row">
                        <label className="form-label">
                          <span className="label-text">タスクタイトル *</span>
                          <input
                            type="text"
                            value={newTaskForm.title}
                            onChange={(e) => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
                            className="form-input"
                            placeholder="タスクのタイトルを入力"
                            required
                          />
                        </label>
                      </div>

                      {/* 説明 */}
                      <div className="form-row">
                        <label className="form-label">
                          <span className="label-text">説明</span>
                          <textarea
                            value={newTaskForm.description}
                            onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                            className="form-textarea"
                            placeholder="タスクの詳細説明"
                            rows={3}
                          />
                        </label>
                      </div>

                      {/* 担当者設定 */}
                      <div className="form-row">
                        <span className="label-text">担当者設定</span>
                        <div className="assignee-type-selector">
                          <button
                            onClick={() => setNewTaskForm(prev => ({
                              ...prev,
                              assigneeSelection: { type: 'team' }
                            }))}
                            className={`assignee-type-btn ${newTaskForm.assigneeSelection.type === 'team' ? 'active' : ''}`}
                          >
                            <Users size={16} />
                            チーム
                          </button>
                          <button
                            onClick={() => setNewTaskForm(prev => ({
                              ...prev,
                              assigneeSelection: { type: 'user' }
                            }))}
                            className={`assignee-type-btn ${newTaskForm.assigneeSelection.type === 'user' ? 'active' : ''}`}
                          >
                            <User size={16} />
                            個人
                          </button>
                        </div>
                      </div>

                      {/* 個人担当者選択 */}
                      {newTaskForm.assigneeSelection.type === 'user' && (
                        <div className="form-row">
                          <label className="form-label">
                            <span className="label-text">担当者</span>
                            <select
                              value={newTaskForm.assigneeSelection.userId || ''}
                              onChange={(e) => setNewTaskForm(prev => ({
                                ...prev,
                                assigneeSelection: {
                                  type: 'user',
                                  userId: e.target.value
                                }
                              }))}
                              className="form-select"
                            >
                              <option value="">担当者を選択</option>
                              {users.map(user => (
                                <option key={user.id} value={user.id}>
                                  {user.name} ({user.position})
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      )}

                      {/* チーム担当者選択 */}
                      {newTaskForm.assigneeSelection.type === 'team' && (
                        <div className="form-row">
                          <label className="form-label">
                            <span className="label-text">担当チーム</span>
                            <select
                              value={newTaskForm.assigneeSelection.teamId || ''}
                              onChange={(e) => setNewTaskForm(prev => ({
                                ...prev,
                                assigneeSelection: {
                                  type: 'team',
                                  teamId: e.target.value
                                }
                              }))}
                              className="form-select"
                            >
                              <option value="">チームを選択</option>
                              {teams.map(team => (
                                <option key={team.id} value={team.id}>
                                  {team.icon} {team.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      )}

                      {/* 期限と優先度 */}
                      <div className="form-row-split">
                        <label className="form-label">
                          <span className="label-text">期限</span>
                          <input
                            type="date"
                            value={newTaskForm.dueDate}
                            onChange={(e) => setNewTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="form-input"
                          />
                        </label>

                        <label className="form-label">
                          <span className="label-text">優先度</span>
                          <select
                            value={newTaskForm.priority}
                            onChange={(e) => setNewTaskForm(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                            className="form-select"
                          >
                            <option value="low">低</option>
                            <option value="medium">中</option>
                            <option value="high">高</option>
                          </select>
                        </label>
                      </div>

                      {/* タグ */}
                      <div className="form-row">
                        <span className="label-text">タグ</span>
                        <div className="tag-selector">
                          {commonTags.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setNewTaskForm(prev => ({
                                  ...prev,
                                  tags: prev.tags.includes(tag)
                                    ? prev.tags.filter(t => t !== tag)
                                    : [...prev.tags, tag]
                                }));
                              }}
                              className={`tag-btn ${newTaskForm.tags.includes(tag) ? 'selected' : ''}`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* アクションボタン */}
                      <div className="form-actions enhanced">
                        <button
                          onClick={() => cancelAddCard(list.id)}
                          className="btn btn-secondary"
                          type="button"
                        >
                          <XCircle size={16} />
                          キャンセル
                        </button>
                        <button
                          onClick={() => addEnhancedCard(list.id)}
                          className="btn btn-primary"
                          type="button"
                          disabled={!newTaskForm.title.trim()}
                        >
                          <Plus size={16} />
                          タスクを作成
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 空の状態 */}
                {list.cards.length === 0 && !isAddingCard[list.id] && (
                  <div className="empty-state">
                    タスクがありません
                    <br />
                    ＋ボタンでタスクを追加しましょう
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* データ管理モーダル */}
      <DataManagement
        isOpen={isDataManagementOpen}
        onClose={() => setIsDataManagementOpen(false)}
        onDataImported={handleDataImported}
      />

      {/* ユーザー設定モーダル */}
      {isUserSettingsOpen && (
        <div className="modal-overlay" onClick={() => setIsUserSettingsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>ユーザー切り替え</h2>
              <button onClick={() => setIsUserSettingsOpen(false)} className="modal-close">
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">現在のユーザー: <strong>{currentUser?.name}</strong></p>
              <div className="user-list">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      switchUser(user.id);
                      setIsUserSettingsOpen(false);
                    }}
                    className={`user-item ${user.id === currentUser?.id ? 'active' : ''}`}
                  >
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-details">
                        {user.department} - {user.position}
                      </div>
                    </div>
                    <div className="user-role-badge">{user.role}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;