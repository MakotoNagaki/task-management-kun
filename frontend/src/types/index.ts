// ディレクトリ: frontend/src/types/index.ts

import { ReactNode } from 'react';

// ============================================
// 基本的なエンティティ型定義
// ============================================

// ユーザー情報
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  department?: string;
  position?: string;
  avatar?: string;
  teamIds: string[];
  primaryTeamId?: string;
  isActive: boolean;
  createdAt: Date;
  todoSettings: TodoSettings;
}

// チーム情報
export interface Team {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  icon?: string;
  memberIds: string[];
  leaderId?: string;
  isActive: boolean;
  createdAt: Date;
}

// タスク情報（確認待ちステータス追加）
export interface Task {
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
  status: 'todo' | 'in-progress' | 'pending-review' | 'done' | 'blocked'; // 確認待ち追加
  tags: string[];
  relatedLinks: RelatedLink[];
  createdAt: Date;
  updatedAt: Date;
  completedBy?: string; // 完了者記録
  reviewedBy?: string; // レビュー者記録
  reviewComment?: string; // レビューコメント
}

// 関連リンク
export interface RelatedLink {
  id: string;
  title: string;
  url: string;
  type: 'spreadsheet' | 'document' | 'presentation' | 'external' | 'slack';
  description?: string;
  addedBy: string;
  addedAt: Date;
}

// ============================================
// ToDo機能の型定義（新規追加）
// ============================================

// ToDo項目
export interface TodoItem {
  id: string;
  title: string;
  memo?: string;
  dueDate?: Date;
  isCompleted: boolean;
  type: 'daily' | 'spot'; // デイリー or スポット
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  templateId?: string; // テンプレートから作成された場合
  order: number; // 並び順
}

// ToDoテンプレート（デイリールーティン用）
export interface TodoTemplate {
  id: string;
  title: string;
  memo?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  dayOfWeek?: number[]; // 0-6 (日-土) 曜日指定、空の場合は毎日
  order: number;
}

// ToDo設定
export interface TodoSettings {
  notificationEnabled: boolean;
  notificationTime?: string; // HH:mm形式
  autoCreateFromTemplate: boolean;
  dailyTemplateCreationTime?: string; // テンプレートからデイリー作成時刻
}

// ============================================
// ステータス定義の更新
// ============================================

// タスクステータス（確認待ち追加）
export interface TaskStatus {
  id: string;
  name: string;
  color: string;
  textColor: string;
  description: string;
}

// ============================================
// フィルター機能の型定義
// ============================================

export interface TaskFilter {
  scope: 'personal' | 'team' | 'company' | 'all';
  status: string[];
  assignee: 'all' | 'me' | 'my-teams' | string;
  selectedTeamIds: string[];
  selectedUserIds: string[];
  searchTerm: string;
  tags: string[];
  priority: string[];
  dueDateRange: 'all' | 'overdue' | 'today' | 'this-week' | 'this-month' | 'custom';
  customDateRange?: {
    start: Date;
    end: Date;
  };
}

// ============================================
// 通知機能の型定義
// ============================================

export interface NotificationSettings {
  taskReminders: boolean;
  todoReminders: boolean;
  deadlineAlerts: boolean;
  statusChangeNotifications: boolean;
  browserNotifications: boolean;
  soundEnabled: boolean;
}

// 通知アイテム
export interface NotificationItem {
  id: string;
  type: 'task-reminder' | 'todo-reminder' | 'deadline-alert' | 'status-change';
  title: string;
  message: string;
  targetId: string; // タスクIDまたはToDoID
  userId: string;
  isRead: boolean;
  createdAt: Date;
  scheduledAt?: Date;
}

// ============================================
// フォーム関連の型定義
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
  selectedTeamId: string;
  selectedUserIds: string[];
}

// 編集フォームの型定義
export interface EditTaskForm extends NewTaskForm {
  status: 'todo' | 'in-progress' | 'pending-review' | 'done' | 'blocked';
  reviewComment?: string;
}

// ToDoフォーム
export interface TodoForm {
  title: string;
  memo?: string;
  dueDate?: string;
  type: 'daily' | 'spot';
}

// ToDoテンプレートフォーム
export interface TodoTemplateForm {
  title: string;
  memo?: string;
  dayOfWeek: number[]; // 0-6 (日-土)
}

// ============================================
// アプリケーション状態の型定義
// ============================================

// ユーザーセッション
export interface UserSession {
  user: User | null;
  isAuthenticated: boolean;
  loginError?: string;
}

// アプリケーションの状態
export interface AppState {
  // ユーザー・チーム管理
  userSession: UserSession;
  teams: Team[];
  users: User[];
  
  // タスク管理
  tasks: Task[];
  draggedCard: DraggedCard | null;
  draggedOver: string | null;
  
  // ToDo管理
  todos: TodoItem[];
  todoTemplates: TodoTemplate[];
  
  // UI状態
  filter: TaskFilter;
  selectedTask: Task | null;
  showTaskDetail: boolean;
  showNewTaskForm: boolean;
  showTodoForm: boolean;
  showTemplateForm: boolean;
  
  // 通知
  notifications: NotificationItem[];
  notificationSettings: NotificationSettings;
  
  // システム状態
  loading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

// ドラッグ中のカード情報
export interface DraggedCard extends Task {
  sourceListId: string;
}

// ============================================
// 定数定義
// ============================================

// タスクステータス（確認待ち追加）
export const TASK_STATUSES: TaskStatus[] = [
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

// 優先度定義
export const PRIORITY_LEVELS = [
  { id: 'low', name: '低', color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 'medium', name: '中', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { id: 'high', name: '高', color: 'text-red-600', bgColor: 'bg-red-100' }
];

// 曜日定義（ToDoテンプレート用）
export const DAYS_OF_WEEK = [
  { id: 0, name: '日', short: '日' },
  { id: 1, name: '月', short: '月' },
  { id: 2, name: '火', short: '火' },
  { id: 3, name: '水', short: '水' },
  { id: 4, name: '木', short: '木' },
  { id: 5, name: '金', short: '金' },
  { id: 6, name: '土', short: '土' }
];