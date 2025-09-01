/**
 * タスク管理くん - TypeScript型定義 ユーザー・チーム管理対応版
 */

// ============================================
// ユーザー・チーム管理の型定義
// ============================================

// ユーザー情報
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  department?: string;
  position?: string;
  teamIds: string[]; // 所属チームのID配列
  primaryTeamId?: string; // メインチーム
  slackUserId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  preferences: UserPreferences;
}

// ユーザー設定
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'ja' | 'en';
  notifications: NotificationSettings;
  defaultAssigneeType: 'user' | 'team';
  workingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
}

// チーム情報
export interface Team {
  id: string;
  name: string;
  description?: string;
  color: string; // チームカラー
  icon?: string; // チームアイコン
  memberIds: string[]; // メンバーのID配列
  leaderId?: string; // チームリーダー
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 現在のユーザーセッション
export interface UserSession {
  currentUser: User;
  availableTeams: Team[];
  availableUsers: User[];
  isAuthenticated: boolean;
  token?: string;
}

// ============================================
// タスク関連の型定義（拡張版）
// ============================================

// タスクカードの型定義
export interface Task {
  id: string;
  title: string;
  description?: string;
  
  // 担当者情報（個人またはチーム）
  assigneeType: 'user' | 'team' | 'both';
  assigneeUserId?: string; // 個人担当者
  assigneeTeamId?: string; // チーム担当
  assigneeName?: string;   // 表示用名前
  
  // 作成者情報
  createdBy: string; // ユーザーID
  createdByName: string; // 作成者名
  
  dueDate?: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  
  // メタデータ
  createdAt: Date;
  updatedAt: Date;
  estimatedHours?: number;
  actualHours?: number;
  attachments?: Attachment[];
  comments?: Comment[];
}

// リスト（列）の型定義
export interface TaskList {
  id: string;
  title: string;
  color: string;
  cards: Task[];
  position?: number;
  limit?: number;
  teamId?: string; // チーム専用リストの場合
  createdAt?: Date;
  updatedAt?: Date;
}

// ドラッグ中のカード情報
export interface DraggedCard extends Task {
  sourceListId: string;
}

// ============================================
// フォーム関連の型定義（拡張版）
// ============================================

// 担当者選択の情報
export interface AssigneeSelection {
  type: 'user' | 'team' | 'both';
  userId?: string;
  teamId?: string;
  userName?: string;
  teamName?: string;
}

// 新規タスクフォームの型定義
export interface NewTaskForm {
  title: string;
  description: string;
  assigneeSelection: AssigneeSelection;
  dueDate: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  estimatedHours?: number;
  selectedTeamId: string; // まずチームを選ぶ
  selectedUserIds: string[]; // そのチームの中から個人を選ぶ
}

// 編集フォームの型定義
export interface EditTaskForm extends NewTaskForm {
  actualHours?: number;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
}

// チーム作成フォーム
export interface CreateTeamForm {
  name: string;
  description: string;
  color: string;
  icon?: string;
  memberIds: string[];
  leaderId?: string;
}

// ユーザー登録フォーム
export interface CreateUserForm {
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  department?: string;
  position?: string;
  teamIds: string[];
  primaryTeamId?: string;
  password: string;
}

// ============================================
// アプリケーション状態の型定義（拡張版）
// ============================================

// アプリケーションの状態
export interface AppState {
  // ユーザー・チーム管理
  userSession: UserSession;
  teams: Team[];
  users: User[];
  
  // タスク管理
  lists: TaskList[];
  draggedCard: DraggedCard | null;
  draggedOver: string | null;
  
  // UI状態
  isAddingCard: Record<string, boolean>;
  editingCard: string | null;
  newTaskForm: NewTaskForm;
  editForm: EditTaskForm;
  
  // モーダル状態
  isUserSettingsOpen: boolean;
  isTeamManagementOpen: boolean;
  isLoginModalOpen: boolean;
  
  // システム状態
  loading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

// 設定の型定義
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'ja' | 'en';
  notifications: NotificationSettings;
  autoSave: boolean;
  teamManagement: TeamManagementSettings;
}

export interface TeamManagementSettings {
  allowUserCreateTeam: boolean;
  maxTeamSize: number;
  requireApproval: boolean;
  defaultTeamColor: string;
}

export interface NotificationSettings {
  email: boolean;
  slack: boolean;
  browser: boolean;
  sound: boolean;
  dueDate: boolean;
  taskAssigned: boolean;
  taskCompleted: boolean;
  teamMention: boolean;
}

// ============================================
// コメント・添付ファイル関連の型定義
// ============================================

// コメントの型定義
export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited?: boolean;
  parentCommentId?: string; // 返信コメント用
  mentions?: string[]; // メンションされたユーザーID
}

// 添付ファイルの型定義
export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  taskId: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Date;
}

// ============================================
// API関連の型定義
// ============================================

// API レスポンスの共通型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
  meta?: ApiMeta;
}

// APIエラー
export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

// APIメタ情報
export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  timestamp: Date;
  requestId?: string;
}

// 認証API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: Date;
}

// ============================================
// フィルター・検索関連の型定義
// ============================================

// タスクフィルター
export interface TaskFilter {
  search?: string;
  assigneeUserId?: string;
  assigneeTeamId?: string;
  createdBy?: string;
  dueDate?: {
    from?: string;
    to?: string;
  };
  priority?: ('low' | 'medium' | 'high')[];
  tags?: string[];
  status?: ('todo' | 'in-progress' | 'done' | 'blocked')[];
  teamId?: string;
  dateRange?: 'today' | 'week' | 'month' | 'custom';
}

// ソート設定
export interface SortConfig {
  field: keyof Task;
  direction: 'asc' | 'desc';
}

// ============================================
// 統計・分析関連の型定義
// ============================================

// チーム統計
export interface TeamStats {
  teamId: string;
  teamName: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  memberStats: Array<{
    userId: string;
    userName: string;
    taskCount: number;
    completedCount: number;
    completionRate: number;
  }>;
}

// ダッシュボード統計
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksInProgress: number;
  completionRate: number;
  averageCompletionTime: number;
  
  tasksByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  
  tasksByTeam: TeamStats[];
  
  tasksByAssignee: Array<{
    userId: string;
    userName: string;
    teamName?: string;
    taskCount: number;
    completedCount: number;
  }>;
  
  recentActivity: SystemEvent[];
}

// システムイベント
export interface SystemEvent {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_moved' | 'task_assigned' | 'team_created' | 'user_joined_team' | 'user_login' | 'system_error';
  userId?: string;
  userName?: string;
  taskId?: string;
  teamId?: string;
  data?: Record<string, any>;
  timestamp: Date;
}

// ============================================
// 通知関連の型定義
// ============================================

// 通知の型定義
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
  userId?: string;
  teamId?: string;
  taskId?: string;
  read: boolean;
  createdAt: Date;
}

export interface NotificationAction {
  label: string;
  action: string;
  style?: 'primary' | 'secondary' | 'danger';
}

// ============================================
// Slack連携関連の型定義
// ============================================

// Slack連携用の型定義
export interface SlackMessage {
  channel: string;
  text: string;
  attachments?: SlackAttachment[];
  blocks?: SlackBlock[];
  thread_ts?: string;
}

export interface SlackAttachment {
  color?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: SlackField[];
  footer?: string;
  ts?: number;
}

export interface SlackField {
  title: string;
  value: string;
  short?: boolean;
}

export interface SlackBlock {
  type: 'section' | 'divider' | 'actions' | 'header';
  text?: SlackText;
  accessory?: SlackElement;
  elements?: SlackElement[];
}

export interface SlackText {
  type: 'plain_text' | 'mrkdwn';
  text: string;
  emoji?: boolean;
}

export interface SlackElement {
  type: 'button' | 'select' | 'datepicker';
  text?: SlackText;
  value?: string;
  action_id?: string;
  url?: string;
}

// ============================================
// ユーティリティ型
// ============================================

// 部分更新用の型
export type PartialUpdate<T> = {
  [P in keyof T]?: T[P];
};

// 必須フィールドを指定する型
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// 特定フィールドを除外する型
export type OmitFields<T, K extends keyof T> = Omit<T, K>;

// 日付文字列型（ISO 8601形式）
export type DateString = string;

// ID型（通常はuuidまたは数値）
export type ID = string | number;

// ============================================
// 列挙型
// ============================================

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked';
export type UserRole = 'admin' | 'manager' | 'member' | 'viewer';
export type AssigneeType = 'user' | 'team' | 'both';
export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'ja' | 'en';

// ============================================
// チーム管理用のヘルパー型
// ============================================

// チームメンバー情報（統合版）
export interface TeamMember extends User {
  teamRole?: 'leader' | 'member';
  joinedAt: Date;
  isActive: boolean;
}

// チーム詳細情報（メンバー込み）
export interface TeamWithMembers extends Team {
  members: TeamMember[];
  leader?: TeamMember;
  taskCount: number;
  completedTaskCount: number;
}

// ユーザー詳細情報（チーム込み）
export interface UserWithTeams extends User {
  teams: Team[];
  primaryTeam?: Team;
  taskCount: number;
  completedTaskCount: number;
}

// ============================================
// モックデータ用の型定義
// ============================================

// モックユーザーデータ
export interface MockUserData {
  users: User[];
  teams: Team[];
  currentUserId: string;
}

// モックタスクデータ  
export interface MockTaskData {
  lists: TaskList[];
  commonTags: string[];
}