import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Edit3, User, Calendar, Tag, Info, Save, XCircle, AlertCircle, Settings, Users, ChevronDown, UserCheck, UsersIcon, Database, Loader } from 'lucide-react';
import './styles/globals.css';

// コンポーネントとフックをインポート
import DataManagement from './components/DataManagement';
import { useLocalStorage, useAutoSaveLocalStorage, STORAGE_KEYS } from './hooks/useLocalStorage';

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
  // データ永続化フック
  // ============================================
  
  // ローカルストレージからのデータ読み込み
  const [persistedLists, setPersistedLists, , listsLoading] = useAutoSaveLocalStorage<TaskList[]>(STORAGE_KEYS.TASKS, []);
  const [persistedUsers, setPersistedUsers, , usersLoading] = useLocalStorage<UserType[]>(STORAGE_KEYS.USERS, []);
  const [persistedTeams, setPersistedTeams, , teamsLoading] = useLocalStorage<Team[]>(STORAGE_KEYS.TEAMS, []);
  const [persistedCurrentUser, setPersistedCurrentUser, , currentUserLoading] = useLocalStorage<UserType | null>(STORAGE_KEYS.CURRENT_USER, null);
  
  const isDataLoading = listsLoading || usersLoading || teamsLoading || currentUserLoading;

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
    },
    {
      id: 'user_4',
      name: '高橋美穂',
      email: 'takahashi@company.com',
      role: 'member',
      department: 'デザイン部',
      position: 'UIデザイナー',
      teamIds: ['team_2'],
      primaryTeamId: 'team_2',
      isActive: true,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-08-28'),
      preferences: {
        theme: 'light',
        language: 'ja',
        notifications: { email: true, slack: false, browser: true, sound: true, dueDate: true, taskAssigned: true, taskCompleted: true, teamMention: true },
        defaultAssigneeType: 'user',
        workingHours: { start: '10:00', end: '18:00' }
      }
    },
    {
      id: 'user_5',
      name: '山田健志',
      email: 'yamada@company.com',
      role: 'member',
      department: 'デザイン部',
      position: 'グラフィックデザイナー',
      teamIds: ['team_2'],
      primaryTeamId: 'team_2',
      isActive: true,
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-09-01'),
      preferences: {
        theme: 'dark',
        language: 'ja',
        notifications: { email: true, slack: true, browser: false, sound: false, dueDate: true, taskAssigned: true, taskCompleted: false, teamMention: true },
        defaultAssigneeType: 'team',
        workingHours: { start: '09:00', end: '17:00' }
      }
    },
    {
      id: 'user_6',
      name: '渡辺さくら',
      email: 'watanabe@company.com',
      role: 'admin',
      department: '企画部',
      position: 'プロジェクトマネージャー',
      teamIds: ['team_3'],
      primaryTeamId: 'team_3',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-08-31'),
      preferences: {
        theme: 'light',
        language: 'ja',
        notifications: { email: true, slack: true, browser: true, sound: true, dueDate: true, taskAssigned: true, taskCompleted: true, teamMention: true },
        defaultAssigneeType: 'both',
        workingHours: { start: '08:30', end: '17:30' }
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
      createdBy: 'user_6',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-08-15')
    },
    {
      id: 'team_2',
      name: 'デザインチーム',
      description: 'UI/UXデザインとブランディング',
      color: '#8b5cf6',
      icon: '🎨',
      memberIds: ['user_4', 'user_5'],
      leaderId: 'user_4',
      isActive: true,
      createdBy: 'user_6',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-07-20')
    },
    {
      id: 'team_3',
      name: '企画チーム',
      description: 'プロジェクト企画・管理',
      color: '#10b981',
      icon: '📋',
      memberIds: ['user_6', 'user_1'],
      leaderId: 'user_6',
      isActive: true,
      createdBy: 'user_6',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-08-01')
    }
  ], []);

  const getInitialLists = useCallback((): TaskList[] => [
    {
      id: '1',
      title: 'To Do',
      color: 'list-todo',
      cards: [
        {
          id: '1',
          title: 'プロジェクト企画書の作成',
          description: '新規プロジェクトの企画書を作成し、ステークホルダーに共有する',
          assigneeType: 'user',
          assigneeUserId: 'user_6',
          assigneeName: '渡辺さくら',
          createdBy: 'user_1',
          createdByName: '田中太郎',
          dueDate: '2024-09-15',
          tags: ['企画', '高優先度', 'ドキュメント'],
          priority: 'high',
          status: 'todo',
          createdAt: new Date('2024-09-01')
        },
        {
          id: '2',
          title: 'データベース設計',
          description: 'タスク管理システムのデータベース構造を設計し、ER図を作成する',
          assigneeType: 'team',
          assigneeTeamId: 'team_1',
          assigneeName: '開発チーム',
          createdBy: 'user_6',
          createdByName: '渡辺さくら',
          dueDate: '2024-09-20',
          tags: ['開発', 'DB', '設計'],
          priority: 'medium',
          status: 'todo',
          createdAt: new Date('2024-08-30')
        }
      ]
    },
    {
      id: '2',
      title: 'In Progress',
      color: 'list-progress',
      cards: [
        {
          id: '3',
          title: 'API仕様書の作成',
          description: 'RESTful APIの詳細仕様書を作成中。認証、CRUD操作、エラーハンドリングを含む',
          assigneeType: 'both',
          assigneeUserId: 'user_3',
          assigneeTeamId: 'team_1',
          assigneeName: '鈴木一郎 (開発チーム)',
          createdBy: 'user_1',
          createdByName: '田中太郎',
          dueDate: '2024-09-18',
          tags: ['開発', 'API', 'ドキュメント'],
          priority: 'high',
          status: 'in-progress',
          createdAt: new Date('2024-08-25')
        }
      ]
    },
    {
      id: '3',
      title: 'Done',
      color: 'list-done',
      cards: [
        {
          id: '4',
          title: 'アプリ名の決定',
          description: '「タスク管理くん」に正式決定！チーム全員の合意を得られました。',
          assigneeType: 'team',
          assigneeTeamId: 'team_3',
          assigneeName: '企画チーム',
          createdBy: 'user_6',
          createdByName: '渡辺さくら',
          dueDate: '2024-09-01',
          tags: ['企画', '完了'],
          priority: 'medium',
          status: 'done',
          createdAt: new Date('2024-08-20')
        }
      ]
    }
  ], []);

  // よく使うタグ
  const commonTags = [
    '企画', '開発', 'デザイン', 'テスト', 
    'ドキュメント', 'API', 'DB', '高優先度', 
    '緊急', 'レビュー', 'リリース', 'バグ修正',
    'UI/UX', 'インフラ', 'セキュリティ'
  ];

  // ============================================
  // 状態管理（永続化データまたは初期データ）
  // ============================================
  
  // 実際に使用するデータ（永続化されたデータまたは初期データ）
  const users = persistedUsers.length > 0 ? persistedUsers : getInitialUsers();
  const teams = persistedTeams.length > 0 ? persistedTeams : getInitialTeams();
  const lists = persistedLists.length > 0 ? persistedLists : getInitialLists();
  
  // 現在のユーザー（永続化データまたは初期ユーザー）
  const currentUser = persistedCurrentUser || users[0];

  // 初期データを永続化（初回のみ）
  useEffect(() => {
    if (!isDataLoading) {
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
    }
  }, [
    isDataLoading,
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
  // ドラッグ&ドロップ機能
  // ============================================

  const handleDragStart = (e: React.DragEvent, card: Task, sourceListId: string) => {
    const dragData: DraggedCard = { ...card, sourceListId };
    setDraggedCard(dragData);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, listId: string) => {
    e.preventDefault();
    dragCounter.current++;
    setDraggedOver(listId);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDraggedOver(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetListId: string) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDraggedOver(null);

    if (!draggedCard || draggedCard.sourceListId === targetListId) {
      setDraggedCard(null);
      return;
    }

    const newLists = lists.map(list => {
      if (list.id === draggedCard.sourceListId) {
        return {
          ...list,
          cards: list.cards.filter(card => card.id !== draggedCard.id)
        };
      }
      if (list.id === targetListId) {
        const { sourceListId, ...cardWithoutSource } = draggedCard;
        return {
          ...list,
          cards: [...list.cards, cardWithoutSource]
        };
      }
      return list;
    });

    updateLists(newLists);
    setDraggedCard(null);
  };

  // ============================================
  // タスク管理機能
  // ============================================

  const addEnhancedCard = (listId: string) => {
    if (!newTaskForm.title.trim()) return;

    const assigneeName = generateAssigneeName(newTaskForm.assigneeSelection);

    const newCard: Task = {
      id: `task_${Date.now()}`,
      title: newTaskForm.title.trim(),
      description: newTaskForm.description.trim(),
      assigneeType: newTaskForm.assigneeSelection.type,
      assigneeUserId: newTaskForm.assigneeSelection.userId,
      assigneeTeamId: newTaskForm.assigneeSelection.teamId,
      assigneeName: assigneeName,
      createdBy: currentUser?.id || 'unknown',
      createdByName: currentUser?.name || 'Unknown User',
      dueDate: newTaskForm.dueDate,
      tags: newTaskForm.tags,
      priority: newTaskForm.priority,
      status: 'todo',
      createdAt: new Date()
    };

    const newLists = lists.map(list => 
      list.id === listId 
        ? { ...list, cards: [...list.cards, newCard] }
        : list
    );

    updateLists(newLists);
    resetNewTaskForm();
    setIsAddingCard(prev => ({ ...prev, [listId]: false }));
  };

  const deleteCard = (listId: string, cardId: string) => {
    if (!window.confirm('このタスクを削除しますか？')) return;

    const newLists = lists.map(list => 
      list.id === listId 
        ? { ...list, cards: list.cards.filter(card => card.id !== cardId) }
        : list
    );

    updateLists(newLists);
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
      tags: card.tags || [],
      priority: card.priority || 'medium',
      status: card.status || 'todo',
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

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '';
    }
  };

  // ============================================
  // ローディング画面
  // ============================================

  if (isDataLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="app-icon loading">
            <Tag size={32} />
          </div>
          <h1 className="app-title">タスク管理くん</h1>
          <div className="loading-indicator">
            <Loader size={24} className="spinning" />
            <span>データを読み込んでいます...</span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // レンダリング
  // ============================================

  return (
    <div>
      {/* ヘッダー */}
      <header className="header">
        <div className="header-container">
          <div className="header-left">
            <div className="app-icon">
              <Tag size={28} />
            </div>
            <h1 className="app-title">タスク管理くん</h1>
            <span className="version-badge">v3.1</span>
            <div className="status-badge">
              <Info size={12} />
              <span>データ永続化対応</span>
            </div>
          </div>
          
          {/* ユーザー情報とメニュー */}
          <div className="header-right">
            <div className="user-info">
              <div className="current-user">
                <User size={16} />
                <span>{currentUser?.name}</span>
                <span className="user-role">({currentUser?.role})</span>
              </div>
              
              <div className="header-actions">
                <button
                  onClick={() => setIsDataManagementOpen(true)}
                  className="header-action-btn"
                  title="データ管理"
                >
                  <Database size={18} />
                </button>
                <button
                  onClick={() => setIsUserSettingsOpen(true)}
                  className="header-action-btn"
                  title="ユーザー設定"
                >
                  <Settings size={18} />
                </button>
                <button
                  onClick={() => setIsTeamManagementOpen(true)}
                  className="header-action-btn"
                  title="チーム管理"
                >
                  <Users size={18} />
                </button>
              </div>
            </div>
            
            <div className="header-subtitle">
              社内タスク管理システム | 総タスク数: {getTotalTasks()}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="main-container">
        <div className="kanban-board">
          {lists.map(list => (
            <div
              key={list.id}
              className={`list-container ${list.color} ${
                draggedOver === list.id ? 'drag-over' : ''
              }`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, list.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, list.id)}
            >
              {/* リストヘッダー */}
              <div className="list-header">
                <h2 className="list-title">{list.title}</h2>
                <div className="list-actions">
                  <span className="task-count">{list.cards.length}</span>
                  <button
                    onClick={() => setIsAddingCard(prev => ({ ...prev, [list.id]: true }))}
                    className="add-button"
                    title={`${list.title}に新しいタスクを追加`}
                    disabled={isAddingCard[list.id]}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* タスクリスト */}
              <div className="tasks-container">
                {list.cards.map((card, index) => (
                  <div
                    key={card.id}
                    draggable={editingCard !== card.id}
                    onDragStart={(e) => handleDragStart(e, card, list.id)}
                    className={`task-card ${
                      draggedCard && draggedCard.id === card.id ? 'dragging' : ''
                    } ${editingCard === card.id ? 'editing' : ''}`}
                  >
                    {editingCard === card.id ? (
                      // 編集モード（簡略版）
                      <div className="enhanced-form-container">
                        <div className="form-grid">
                          <div className="form-row">
                            <label className="form-label">
                              <span className="label-text">タスク名 <span className="required">*</span></span>
                              <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                className="form-input"
                                autoFocus
                              />
                            </label>
                          </div>

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
                      </div>
                    ) : (
                      // 表示モード
                      <>
                        <div className="task-header">
                          <h3 className="task-title">{card.title}</h3>
                          <div className="task-actions">
                            <button
                              onClick={() => startEdit(card)}
                              className="icon-button"
                              title="タスクを編集"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => deleteCard(list.id, card.id)}
                              className="icon-button danger"
                              title="タスクを削除"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {card.description && (
                          <p className="task-description">{card.description}</p>
                        )}

                        <div className="task-meta">
                          {/* 作成者情報 */}
                          <div className="task-creator">
                            <UserCheck size={12} />
                            <span className="meta-label">作成者:</span>
                            <span>{card.createdByName}</span>
                          </div>

                          {/* 担当者情報 */}
                          {card.assigneeName && (
                            <div className="task-assignee">
                              {card.assigneeType === 'team' ? <UsersIcon size={12} /> : <User size={12} />}
                              <span className="meta-label">担当:</span>
                              <span>{card.assigneeName}</span>
                              {card.assigneeType === 'team' && <span className="team-indicator">(チーム)</span>}
                            </div>
                          )}
                          
                          {card.dueDate && (
                            <div className="task-due-date">
                              <Calendar size={12} />
                              <span className="meta-label">期限:</span>
                              <span>{formatDate(card.dueDate)}</span>
                            </div>
                          )}

                          {card.priority && (
                            <div className={`task-priority ${card.priority}`}>
                              <AlertCircle size={12} />
                              <span>優先度: {getPriorityLabel(card.priority)}</span>
                            </div>
                          )}
                          
                          {card.tags && card.tags.length > 0 && (
                            <div className="task-tags">
                              {card.tags.map((tag, tagIndex) => (
                                <span key={tagIndex} className="tag">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* 高機能タスク追加フォーム */}
                {isAddingCard[list.id] && (
                  <div className="enhanced-form-container">
                    <div className="form-grid">
                      {/* タイトル */}
                      <div className="form-row">
                        <label className="form-label">
                          <span className="label-text">タスク名 <span className="required">*</span></span>
                          <input
                            type="text"
                            placeholder="具体的なタスク名を入力..."
                            value={newTaskForm.title}
                            onChange={(e) => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
                            className="form-input"
                            autoFocus
                          />
                        </label>
                      </div>

                      {/* 説明 */}
                      <div className="form-row">
                        <label className="form-label">
                          <span className="label-text">詳細説明</span>
                          <textarea
                            placeholder="タスクの詳細、目的、成果物などを記載..."
                            value={newTaskForm.description}
                            onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                            className="form-textarea enhanced"
                            rows={3}
                          />
                        </label>
                      </div>

                      {/* チーム選択 */}
                      <div className="form-row">
                        <label className="form-label">
                          <span className="label-text">チーム選択</span>
                          <select
                            value={newTaskForm.selectedTeamId}
                            onChange={(e) => {
                              setNewTaskForm(prev => ({ 
                                ...prev, 
                                selectedTeamId: e.target.value,
                                selectedUserIds: [],
                                assigneeSelection: { type: 'user' }
                              }));
                            }}
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

                      {/* 担当者タイプ選択 */}
                      {newTaskForm.selectedTeamId && (
                        <>
                          <div className="form-row">
                            <span className="label-text">担当者タイプ</span>
                            <div className="assignee-type-buttons">
                              <button
                                type="button"
                                onClick={() => setNewTaskForm(prev => ({
                                  ...prev,
                                  assigneeSelection: {
                                    type: 'team',
                                    teamId: prev.selectedTeamId
                                  }
                                }))}
                                className={`assignee-type-btn ${newTaskForm.assigneeSelection.type === 'team' ? 'active' : ''}`}
                              >
                                <UsersIcon size={16} />
                                チーム全体
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewTaskForm(prev => ({
                                  ...prev,
                                  assigneeSelection: {
                                    type: 'user'
                                  },
                                  selectedUserIds: []
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
                                      userId: e.target.value,
                                      teamId: prev.selectedTeamId
                                    }
                                  }))}
                                  className="form-select"
                                >
                                  <option value="">担当者を選択</option>
                                  {getTeamMembers(newTaskForm.selectedTeamId).map(member => (
                                    <option key={member.id} value={member.id}>
                                      {member.name} ({member.position})
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          )}
                        </>
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
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </label>

                        <div className="form-label">
                          <span className="label-text">優先度</span>
                          <div className="priority-buttons">
                            {[
                              { value: 'low', label: '低', color: '#10b981' },
                              { value: 'medium', label: '中', color: '#f59e0b' },
                              { value: 'high', label: '高', color: '#ef4444' }
                            ].map(priority => (
                              <button
                                key={priority.value}
                                type="button"
                                onClick={() => setNewTaskForm(prev => ({ ...prev, priority: priority.value as any }))}
                                className={`priority-btn compact ${newTaskForm.priority === priority.value ? 'active' : ''}`}
                                style={{ 
                                  backgroundColor: newTaskForm.priority === priority.value ? priority.color : 'transparent',
                                  borderColor: priority.color,
                                  color: newTaskForm.priority === priority.value ? 'white' : priority.color
                                }}
                              >
                                {priority.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* タグ選択 */}
                      <div className="form-row">
                        <span className="label-text">タグ</span>
                        <div className="tags-container compact">
                          {commonTags.slice(0, 8).map(tag => (
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
                    <User size={20} />
                    <div className="user-info-detail">
                      <div className="user-name">{user.name}</div>
                      <div className="user-meta">{user.position} • {user.department}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* チーム管理モーダル */}
      {isTeamManagementOpen && (
        <div className="modal-overlay" onClick={() => setIsTeamManagementOpen(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>チーム管理</h2>
              <button onClick={() => setIsTeamManagementOpen(false)} className="modal-close">
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="teams-grid">
                {teams.map(team => (
                  <div key={team.id} className="team-card">
                    <div className="team-header">
                      <span className="team-icon">{team.icon}</span>
                      <h3 className="team-name">{team.name}</h3>
                    </div>
                    <p className="team-description">{team.description}</p>
                    <div className="team-members">
                      <strong>メンバー ({team.memberIds.length}人):</strong>
                      <div className="members-list">
                        {getTeamMembers(team.id).map(member => (
                          <span key={member.id} className="member-tag">
                            {member.name}
                            {team.leaderId === member.id && <span className="leader-badge">👑</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* フッター */}
      <footer className="footer">
        <div className="footer-container">
          <strong>タスク管理くん</strong> - 社内タスク管理システム | 
          データ永続化対応版 v3.1 | 
          作成日: {new Date().toLocaleDateString('ja-JP')}
        </div>
      </footer>
    </div>
  );
};

export default App;