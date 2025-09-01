import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, Edit3, User, Calendar, Tag, Info, Save, XCircle, AlertCircle, Settings, Users, ChevronDown, UserCheck, UsersIcon, Database, Loader } from 'lucide-react';
import './styles/globals.css';
import './styles/login.css';

// コンポーネントとフックをインポート
import DataManagement from './components/DataManagement';
import LoginScreen from './components/LoginScreen';
import { useLocalStorage, useAutoSaveLocalStorage, STORAGE_KEYS } from './hooks/useLocalStorage';
import { useAuth } from './hooks/useAuth';
import { Auth } from './utils/auth';

// 型定義をインポート
import type { 
  Task, TaskList, DraggedCard, User as UserType, Team, UserSession, 
  NewTaskForm, EditTaskForm, AssigneeSelection, TeamWithMembers 
} from './types';
import type { AuthCredentials } from './types/auth';

/**
 * タスク管理くん - データ永続化対応版（修正版）
 * 
 * 修正内容:
 * - useEffect 無限ループを解消
 * - 初期データ設定ロジックを最適化
 * - 依存関係配列を修正
 */
const App: React.FC = () => {
  // ============================================
  // 認証管理
  // ============================================
  
  const {
    isAuthenticated,
    currentUser: authenticatedUser,
    isLoading: authLoading,
    login,
    logout,
    setUsers,
    requiresAuth,
    hasPermission,
    isAdmin,
    getRememberedEmail,
    authError
  } = useAuth();

  // ============================================
  // データ永続化フック
  // ============================================
  
  // ローカルストレージからのデータ読み込み
  const [persistedLists, setPersistedLists, , listsLoading] = useAutoSaveLocalStorage<TaskList[]>(STORAGE_KEYS.TASKS, []);
  const [persistedUsers, setPersistedUsers, , usersLoading] = useLocalStorage<UserType[]>(STORAGE_KEYS.USERS, []);
  const [persistedTeams, setPersistedTeams, , teamsLoading] = useLocalStorage<Team[]>(STORAGE_KEYS.TEAMS, []);
  
  const isDataLoading = listsLoading || usersLoading || teamsLoading;

  // ============================================
  // モックデータの定義（セキュア認証対応版）
  // ============================================
  
  // 初期ユーザーデータ（パスワードハッシュ付き）
  const [initialUsers, setInitialUsers] = useState<UserType[]>([]);
  
  // パスワードハッシュ付きの初期ユーザーデータを生成
  useEffect(() => {
    const generateSecureUsers = async () => {
      try {
        // デフォルト管理者アカウント
        const adminUser = await Auth.DefaultUserCreator.createDefaultAdmin();
        
        // テストユーザーアカウント
        const testUsers = await Auth.DefaultUserCreator.createTestUsers();
        
        // 既存ユーザーデータにパスワードハッシュを追加
        const legacyUsers = [
          {
            id: 'user_4',
            name: '高橋美穂',
            email: 'takahashi@company.com',
            role: 'member' as const,
            department: 'デザイン部',
            position: 'UIデザイナー',
            teamIds: ['team_2'],
            primaryTeamId: 'team_2',
            password: 'password123'
          },
          {
            id: 'user_5', 
            name: '山田健志',
            email: 'yamada@company.com',
            role: 'member' as const,
            department: 'デザイン部',
            position: 'グラフィックデザイナー',
            teamIds: ['team_2'],
            primaryTeamId: 'team_2',
            password: 'password123'
          },
          {
            id: 'user_6',
            name: '渡辺さくら',
            email: 'watanabe@company.com',
            role: 'admin' as const,
            department: '企画部',
            position: 'プロジェクトマネージャー',
            teamIds: ['team_3'],
            primaryTeamId: 'team_3',
            password: 'admin123'
          }
        ];

        const secureUsers: UserType[] = [];
        
        // レガシーユーザーのパスワードをハッシュ化
        for (const legacyUser of legacyUsers) {
          const hashedPassword = await Auth.PasswordHasher.hashPassword(legacyUser.password);
          
          secureUsers.push({
            id: legacyUser.id,
            name: legacyUser.name,
            email: legacyUser.email,
            hashedPassword,
            role: legacyUser.role,
            department: legacyUser.department,
            position: legacyUser.position,
            teamIds: legacyUser.teamIds,
            primaryTeamId: legacyUser.primaryTeamId,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            preferences: {
              theme: 'light',
              language: 'ja',
              notifications: {
                email: true,
                slack: true,
                browser: true,
                sound: true,
                dueDate: true,
                taskAssigned: true,
                taskCompleted: true,
                teamMention: true
              },
              defaultAssigneeType: legacyUser.role === 'admin' ? 'both' : 'user',
              workingHours: {
                start: '09:00',
                end: '18:00'
              }
            }
          });
        }

        // 全ユーザーを統合
        const allUsers = [adminUser, ...testUsers, ...secureUsers];
        setInitialUsers(allUsers);
        
        console.log('セキュアユーザーデータを生成しました');
      } catch (error) {
        console.error('ユーザーデータ生成エラー:', error);
        setInitialUsers([]);
      }
    };

    generateSecureUsers();
  }, []);

  const initialTeams = useMemo((): Team[] => [
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

  const initialLists = useMemo((): TaskList[] => [
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
          createdAt: new Date('2024-09-01'),
          updatedAt: new Date('2024-09-01')
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
          createdAt: new Date('2024-08-30'),
          updatedAt: new Date('2024-08-30')
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
          createdAt: new Date('2024-08-25'),
          updatedAt: new Date('2024-08-25')
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
          createdAt: new Date('2024-08-20'),
          updatedAt: new Date('2024-08-20')
        }
      ]
    }
  ], []);

  // よく使うタグ
  const commonTags = useMemo(() => [
    '企画', '開発', 'デザイン', 'テスト', 
    'ドキュメント', 'API', 'DB', '高優先度', 
    '緊急', 'レビュー', 'リリース', 'バグ修正',
    'UI/UX', 'インフラ', 'セキュリティ'
  ], []);

  // ============================================
  // 状態管理（永続化データまたは初期データ）
  // ============================================
  
  // 実際に使用するデータ（永続化されたデータまたは初期データ）
  const users = persistedUsers.length > 0 ? persistedUsers : initialUsers;
  const teams = persistedTeams.length > 0 ? persistedTeams : initialTeams;
  const lists = persistedLists.length > 0 ? persistedLists : initialLists;
  
  // 現在のユーザー（認証されたユーザー）
  const currentUser = authenticatedUser;

  // ============================================
  // 初期データ設定とセキュア認証統合
  // ============================================
  
  useEffect(() => {
    // ローディング中は何もしない
    if (isDataLoading || initialUsers.length === 0) return;
    
    let hasChanges = false;
    
    // 初期データが未設定の場合のみ設定
    if (persistedUsers.length === 0) {
      console.log('セキュアユーザーデータを初期化');
      setPersistedUsers(initialUsers);
      hasChanges = true;
    }
    
    if (persistedTeams.length === 0) {
      console.log('初期チームデータを設定');
      setPersistedTeams(initialTeams);
      hasChanges = true;
    }
    
    if (persistedLists.length === 0) {
      console.log('初期タスクデータを設定');
      setPersistedLists(initialLists);
      hasChanges = true;
    }
    
    // 認証フックにユーザーリストを設定
    if (users.length > 0) {
      setUsers(users);
    }
    
    if (hasChanges) {
      console.log('初期データセットアップ完了');
    }
  }, [
    isDataLoading,
    initialUsers.length,
    persistedUsers.length,
    persistedTeams.length,
    persistedLists.length,
    users,
    setUsers,
    setPersistedUsers,
    setPersistedTeams,
    setPersistedLists,
    initialTeams,
    initialLists
  ]);

  // ============================================
  // 認証処理
  // ============================================

  /**
   * ログイン処理
   */
  const handleLogin = useCallback(async (credentials: AuthCredentials): Promise<void> => {
    try {
      const result = await login(credentials);
      if (result.success) {
        console.log('ログイン成功');
      } else {
        console.error('ログイン失敗:', result.error?.message);
      }
    } catch (error) {
      console.error('ログイン処理エラー:', error);
    }
  }, [login]);

  /**
   * 管理者モードの切り替え
   */
  const [showUserManagement, setShowUserManagement] = useState(false);

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
  // データ更新時の永続化処理（useCallback で最適化）
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

  // ============================================
  // ヘルパー関数（useCallback で最適化）
  // ============================================

  const getTeamById = useCallback((teamId: string): Team | undefined => {
    return teams.find(team => team.id === teamId);
  }, [teams]);

  const getUserById = useCallback((userId: string): UserType | undefined => {
    return users.find(user => user.id === userId);
  }, [users]);

  const getTeamMembers = useCallback((teamId: string): UserType[] => {
    const team = getTeamById(teamId);
    if (!team) return [];
    return team.memberIds.map(userId => getUserById(userId)).filter(Boolean) as UserType[];
  }, [getTeamById, getUserById]);

  const generateAssigneeName = useCallback((selection: AssigneeSelection): string => {
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
  }, [getUserById, getTeamById]);

  // ============================================
  // ドラッグ&ドロップ機能
  // ============================================

  const handleDragStart = useCallback((e: React.DragEvent, card: Task, sourceListId: string) => {
    const dragData: DraggedCard = { ...card, sourceListId };
    setDraggedCard(dragData);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, listId: string) => {
    e.preventDefault();
    dragCounter.current++;
    setDraggedOver(listId);
  }, []);

  const handleDragLeave = useCallback(() => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDraggedOver(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetListId: string) => {
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
  }, [draggedCard, lists, updateLists]);

  // ============================================
  // タスク管理機能
  // ============================================

  const addEnhancedCard = useCallback((listId: string) => {
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newLists = lists.map(list => 
      list.id === listId 
        ? { ...list, cards: [...list.cards, newCard] }
        : list
    );

    updateLists(newLists);
    
    // フォームをリセット
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
    
    setIsAddingCard(prev => ({ ...prev, [listId]: false }));
  }, [newTaskForm, lists, updateLists, generateAssigneeName, currentUser]);

  const deleteCard = useCallback((listId: string, cardId: string) => {
    const newLists = lists.map(list =>
      list.id === listId
        ? { ...list, cards: list.cards.filter(card => card.id !== cardId) }
        : list
    );
    updateLists(newLists);
  }, [lists, updateLists]);

  const startEditCard = useCallback((card: Task) => {
    setEditForm({
      title: card.title,
      description: card.description || '',
      assigneeSelection: {
        type: card.assigneeType,
        userId: card.assigneeUserId,
        teamId: card.assigneeTeamId,
        userName: card.assigneeName,
        teamName: card.assigneeName
      },
      dueDate: card.dueDate || '',
      tags: card.tags || [],
      priority: card.priority,
      status: card.status,
      selectedTeamId: card.assigneeTeamId || '',
      selectedUserIds: card.assigneeUserId ? [card.assigneeUserId] : []
    });
    setEditingCard(card.id);
  }, []);

  const saveEditCard = useCallback((listId: string, cardId: string) => {
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
    setEditingCard(null);
  }, [editForm, lists, updateLists, generateAssigneeName]);

  const cancelEdit = useCallback(() => {
    setEditingCard(null);
  }, []);

  // タグ追加機能
  const addTag = useCallback((tag: string, isEditMode = false) => {
    if (isEditMode) {
      setEditForm(prev => ({
        ...prev,
        tags: prev.tags.includes(tag) ? prev.tags : [...prev.tags, tag]
      }));
    } else {
      setNewTaskForm(prev => ({
        ...prev,
        tags: prev.tags.includes(tag) ? prev.tags : [...prev.tags, tag]
      }));
    }
  }, []);

  const removeTag = useCallback((tagToRemove: string, isEditMode = false) => {
    if (isEditMode) {
      setEditForm(prev => ({
        ...prev,
        tags: prev.tags.filter(tag => tag !== tagToRemove)
      }));
    } else {
      setNewTaskForm(prev => ({
        ...prev,
        tags: prev.tags.filter(tag => tag !== tagToRemove)
      }));
    }
  }, []);

  // 優先度表示用のヘルパー
  const getPriorityText = useCallback((priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '';
    }
  }, []);

  // ============================================
  // ローディング画面と認証チェック
  // ============================================

  // データローディング中
  if (isDataLoading || initialUsers.length === 0) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="app-icon loading">
            <Tag size={32} />
          </div>
          <h1 className="app-title">タスク管理くん</h1>
          <div className="loading-indicator">
            <Loader size={24} className="spinning" />
            <span>セキュアシステムを初期化中...</span>
          </div>
        </div>
      </div>
    );
  }

  // 認証チェック中
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="app-icon loading">
            <Tag size={32} />
          </div>
          <h1 className="app-title">タスク管理くん</h1>
          <div className="loading-indicator">
            <Loader size={24} className="spinning" />
            <span>認証情報を確認中...</span>
          </div>
        </div>
      </div>
    );
  }

  // 未認証の場合はログイン画面を表示
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        isLoading={authLoading}
        error={authError?.message || null}
        rememberedEmail={getRememberedEmail()}
        onShowUserManagement={() => setShowUserManagement(true)}
        isAdminSetupMode={users.length === 0}
      />
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
            <span className="version-badge">v3.3</span>
            <div className="status-badge">
              <Info size={12} />
              <span>セキュア認証版</span>
            </div>
          </div>
          
          {/* ユーザー情報とメニュー */}
          <div className="header-right">
            <div className="user-info">
              <div className="current-user">
                <User size={16} />
                <span>{currentUser?.name}</span>
                <span className="user-role">({currentUser?.role})</span>
                {isAuthenticated && (
                  <span className="auth-indicator" title="ログイン中">🔒</span>
                )}
              </div>
              
              <div className="header-actions">
                {/* データ管理（管理者・マネージャー以上） */}
                {hasPermission('export_data') && (
                  <button
                    onClick={() => setIsDataManagementOpen(true)}
                    className="header-action-btn"
                    title="データ管理"
                  >
                    <Database size={18} />
                  </button>
                )}
                
                {/* ユーザー切り替え（認証済みユーザーのみ） */}
                <button
                  onClick={() => setIsUserSettingsOpen(true)}
                  className="header-action-btn"
                  title="アカウント設定"
                >
                  <UserCheck size={18} />
                </button>
                
                {/* チーム管理（マネージャー以上） */}
                {hasPermission('manage_teams') && (
                  <button
                    onClick={() => setIsTeamManagementOpen(true)}
                    className="header-action-btn"
                    title="チーム管理"
                  >
                    <UsersIcon size={18} />
                  </button>
                )}

                {/* ログアウト */}
                <button
                  onClick={logout}
                  className="header-action-btn logout-btn"
                  title="ログアウト"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="main-content">
        <div className="lists-container">
          {lists.map(list => (
            <div
              key={list.id}
              className={`list ${list.color} ${draggedOver === list.id ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, list.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, list.id)}
            >
              {/* リストヘッダー */}
              <div className="list-header">
                <h2 className="list-title">
                  {list.title}
                  <span className="card-count">({list.cards.length})</span>
                </h2>
                {/* タスク作成権限チェック */}
                {hasPermission('create_task') && (
                  <button
                    onClick={() => setIsAddingCard(prev => ({ ...prev, [list.id]: true }))}
                    className="add-button"
                    disabled={isAddingCard[list.id]}
                    title="新しいタスクを追加"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>

              {/* タスク一覧 */}
              <div className="tasks-container">
                {list.cards.map(card => (
                  <div
                    key={card.id}
                    className={`task-card ${editingCard === card.id ? 'editing' : ''} ${draggedCard?.id === card.id ? 'dragging' : ''}`}
                    draggable={editingCard !== card.id}
                    onDragStart={(e) => handleDragStart(e, card, list.id)}
                  >
                    {editingCard === card.id ? (
                      /* 編集モード */
                      <div className="enhanced-form-container">
                        <div className="form-grid">
                          {/* タイトル編集 */}
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

                          {/* 説明編集 */}
                          <div className="form-row">
                            <label className="form-label">
                              <span className="label-text">詳細説明</span>
                              <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                className="form-textarea enhanced"
                                rows={3}
                              />
                            </label>
                          </div>

                          {/* 担当者選択編集 */}
                          <div className="form-row">
                            <label className="form-label">
                              <span className="label-text">担当者タイプ</span>
                              <div className="assignee-type-buttons">
                                <button
                                  type="button"
                                  onClick={() => setEditForm(prev => ({
                                    ...prev,
                                    assigneeSelection: { type: 'user' }
                                  }))}
                                  className={`assignee-type-btn ${editForm.assigneeSelection.type === 'user' ? 'active' : ''}`}
                                >
                                  <User size={16} />
                                  個人
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditForm(prev => ({
                                    ...prev,
                                    assigneeSelection: { type: 'team' }
                                  }))}
                                  className={`assignee-type-btn ${editForm.assigneeSelection.type === 'team' ? 'active' : ''}`}
                                >
                                  <Users size={16} />
                                  チーム
                                </button>
                              </div>
                            </label>
                          </div>

                          {/* 優先度と期限 */}
                          <div className="form-row-split">
                            <label className="form-label">
                              <span className="label-text">優先度</span>
                              <div className="priority-buttons compact">
                                {(['high', 'medium', 'low'] as const).map(priority => (
                                  <button
                                    key={priority}
                                    type="button"
                                    onClick={() => setEditForm(prev => ({ ...prev, priority }))}
                                    className={`priority-btn priority-${priority} compact ${editForm.priority === priority ? 'active' : ''}`}
                                  >
                                    {getPriorityText(priority)}
                                  </button>
                                ))}
                              </div>
                            </label>
                            <label className="form-label">
                              <span className="label-text">期限</span>
                              <input
                                type="date"
                                value={editForm.dueDate}
                                onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                                className="form-input"
                              />
                            </label>
                          </div>

                          {/* アクションボタン */}
                          <div className="form-actions">
                            <button
                              onClick={() => saveEditCard(list.id, card.id)}
                              className="save-button"
                              disabled={!editForm.title.trim()}
                            >
                              <Save size={16} />
                              保存
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="cancel-button"
                            >
                              <XCircle size={16} />
                              キャンセル
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* 表示モード */
                      <>
                        <div className="task-header">
                          <h3 className="task-title">{card.title}</h3>
                          {/* タスク編集・削除権限チェック */}
                          {(hasPermission('edit_task') && 
                            (card.createdBy === currentUser?.id || hasPermission('manage_settings'))) && (
                            <div className="task-actions">
                              <button
                                onClick={() => startEditCard(card)}
                                className="icon-button"
                                title="編集"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => deleteCard(list.id, card.id)}
                                className="icon-button danger"
                                title="削除"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        {card.description && (
                          <p className="task-description">{card.description}</p>
                        )}

                        <div className="task-meta">
                          <div className="task-creator">
                            <span className="meta-label">作成者:</span>
                            {card.createdByName}
                          </div>
                          
                          <div className="task-assignee">
                            <span className="meta-label">担当:</span>
                            {card.assigneeName}
                            {card.assigneeType === 'team' && (
                              <span className="team-indicator">チーム</span>
                            )}
                          </div>

                          {card.dueDate && (
                            <div className="task-due-date">
                              <Calendar size={12} />
                              <span className="meta-label">期限:</span>
                              {new Date(card.dueDate).toLocaleDateString('ja-JP')}
                            </div>
                          )}
                        </div>

                        <div className="task-priority priority-${card.priority}">
                          <AlertCircle size={12} />
                          優先度: {getPriorityText(card.priority)}
                        </div>

                        {card.tags && card.tags.length > 0 && (
                          <div className="task-tags">
                            {card.tags.map(tag => (
                              <span key={tag} className="tag">
                                <Tag size={10} />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {list.cards.length === 0 && (
                  <div className="empty-state">
                    タスクがありません<br />
                    上の + ボタンで新しいタスクを追加できます
                  </div>
                )}
              </div>

              {/* 新規タスク追加フォーム */}
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
                          onChange={(e) => setNewTaskForm(prev => ({
                            ...prev,
                            selectedTeamId: e.target.value,
                            assigneeSelection: {
                              type: 'user',
                              teamId: e.target.value
                            }
                          }))}
                          className="form-select"
                        >
                          <option value="">チームを選択してください</option>
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
                          <label className="form-label">
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
                                <Users size={16} />
                                チーム全体
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewTaskForm(prev => ({
                                  ...prev,
                                  assigneeSelection: {
                                    type: 'user',
                                    teamId: prev.selectedTeamId
                                  }
                                }))}
                                className={`assignee-type-btn ${newTaskForm.assigneeSelection.type === 'user' ? 'active' : ''}`}
                              >
                                <User size={16} />
                                個人
                              </button>
                            </div>
                          </label>
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
                        />
                      </label>
                      <label className="form-label">
                        <span className="label-text">優先度</span>
                        <div className="priority-buttons compact">
                          {(['high', 'medium', 'low'] as const).map(priority => (
                            <button
                              key={priority}
                              type="button"
                              onClick={() => setNewTaskForm(prev => ({ ...prev, priority }))}
                              className={`priority-btn priority-${priority} compact ${newTaskForm.priority === priority ? 'active' : ''}`}
                            >
                              {getPriorityText(priority)}
                            </button>
                          ))}
                        </div>
                      </label>
                    </div>

                    {/* タグ追加 */}
                    <div className="form-row">
                      <label className="form-label">
                        <span className="label-text">タグ</span>
                        <div className="tags-input-container">
                          {/* 既存タグの表示 */}
                          {newTaskForm.tags.length > 0 && (
                            <div className="selected-tags">
                              {newTaskForm.tags.map(tag => (
                                <span key={tag} className="selected-tag">
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="remove-tag-btn"
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* よく使うタグ */}
                          <div className="common-tags">
                            <span className="common-tags-label">よく使うタグ:</span>
                            <div className="common-tags-list">
                              {commonTags.filter(tag => !newTaskForm.tags.includes(tag)).slice(0, 8).map(tag => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => addTag(tag)}
                                  className="common-tag-btn"
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* アクションボタン */}
                    <div className="form-actions">
                      <button
                        onClick={() => addEnhancedCard(list.id)}
                        className="save-button"
                        disabled={!newTaskForm.title.trim()}
                      >
                        <Save size={16} />
                        タスクを追加
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingCard(prev => ({ ...prev, [list.id]: false }));
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
                        }}
                        className="cancel-button"
                      >
                        <XCircle size={16} />
                        キャンセル
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* データ管理モーダル */}
      {isDataManagementOpen && (
        <DataManagement
          isOpen={isDataManagementOpen}
          onClose={() => setIsDataManagementOpen(false)}
          onDataImported={() => {
            // データインポート後の処理
            window.location.reload();
          }}
        />
      )}

      {/* アカウント設定モーダル */}
      {isUserSettingsOpen && (
        <div className="modal-overlay" onClick={() => setIsUserSettingsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>アカウント設定</h2>
              <button onClick={() => setIsUserSettingsOpen(false)} className="modal-close">
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {/* 現在のユーザー情報 */}
              <div className="current-user-info">
                <h3>現在のユーザー</h3>
                <div className="user-detail-card">
                  <User size={24} />
                  <div className="user-detail-info">
                    <div className="user-name">{currentUser.name}</div>
                    <div className="user-meta">{currentUser.position} • {currentUser.department}</div>
                    <div className="user-role-badge role-{currentUser.role}">{currentUser.role}</div>
                  </div>
                </div>
              </div>

              {/* 権限情報 */}
              <div className="permissions-info">
                <h4>利用可能な機能</h4>
                <div className="permissions-list">
                  <div className="permission-item">
                    <span>タスク管理:</span>
                    <span className="permission-status granted">許可</span>
                  </div>
                  {hasPermission('manage_teams') && (
                    <div className="permission-item">
                      <span>チーム管理:</span>
                      <span className="permission-status granted">許可</span>
                    </div>
                  )}
                  {hasPermission('create_user') && (
                    <div className="permission-item">
                      <span>ユーザー管理:</span>
                      <span className="permission-status granted">許可</span>
                    </div>
                  )}
                  {hasPermission('export_data') && (
                    <div className="permission-item">
                      <span>データ管理:</span>
                      <span className="permission-status granted">許可</span>
                    </div>
                  )}
                </div>
              </div>

              {/* アクション */}
              <div className="auth-actions">
                <button
                  onClick={() => {
                    logout();
                    setIsUserSettingsOpen(false);
                  }}
                  className="logout-button"
                >
                  <X size={16} />
                  ログアウト
                </button>
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
          セキュア認証版 v3.3 | 
          {currentUser && (
            <>ログイン中: {currentUser.name} ({currentUser.role}) | </>
          )}
          作成日: {new Date().toLocaleDateString('ja-JP')}
        </div>
      </footer>
    </div>
  );
};

export default App;