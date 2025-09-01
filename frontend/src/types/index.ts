/**
 * タスク管理くん - TypeScript型定義
 */

// タスクカードの型定義
export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  tags: string[];
  priority?: 'low' | 'medium' | 'high';
  createdAt?: Date;
  updatedAt?: Date;
}

// リスト（列）の型定義
export interface TaskList {
  id: string;
  title: string;
  color: string;
  cards: Task[];
  position?: number;
}

// ドラッグ中のカード情報
export interface DraggedCard extends Task {
  sourceListId: string;
}

// フォームデータの型定義
export interface TaskFormData {
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

// アプリケーションの状態
export interface AppState {
  lists: TaskList[];
  draggedCard: DraggedCard | null;
  draggedOver: string | null;
  isAddingCard: Record<string, boolean>;
  editingCard: string | null;
  newCardTitle: string;
  newCardDescription: string;
  loading: boolean;
  error: string | null;
}

// API関連の型定義（将来のバックエンド連携用）
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// ユーザー情報（将来の拡張用）
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
}

// 通知の型定義（将来の拡張用）
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Slack連携用の型定義（将来の拡張用）
export interface SlackMessage {
  channel: string;
  text: string;
  attachments?: SlackAttachment[];
}

export interface SlackAttachment {
  color?: string;
  title?: string;
  text?: string;
  fields?: SlackField[];
}

export interface SlackField {
  title: string;
  value: string;
  short?: boolean;
}