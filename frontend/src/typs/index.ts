// ユーザー情報の型定義
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  slackUserId?: string;
  role: 'admin' | 'member' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

// タスクカードの型定義
export interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  assignee?: User;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  attachments?: Attachment[];
  comments?: Comment[];
  listId: string;
  boardId: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// リスト（列）の型定義
export interface List {
  id: string;
  title: string;
  color: string;
  boardId: string;
  position: number;
  tasks: Task[];
  taskLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ボード（プロジェクト）の型定義
export interface Board {
  id: string;
  title: string;
  description?: string;
  color: string;
  isPrivate: boolean;
  members: User[];
  lists: List[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// コメントの型定義
export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

// 添付ファイルの型定義
export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  taskId: string;
  uploadedBy: string;
  createdAt: Date;
}

// API レスポンスの共通型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// ページネーション用の型
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// フィルタリング用の型
export interface TaskFilter {
  assigneeId?: string;
  dueDate?: {
    from?: string;
    to?: string;
  };
  priority?: ('low' | 'medium' | 'high')[];
  tags?: string[];
  status?: string;
  search?: string;
}

// Slack連携用の型
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

// アプリの状態管理用の型
export interface AppState {
  user: User | null;
  currentBoard: Board | null;
  boards: Board[];
  isLoading: boolean;
  error: string | null;
}

// フォーム用の型
export interface CreateTaskForm {
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

export interface UpdateTaskForm extends Partial<CreateTaskForm> {
  id: string;
}

export interface CreateBoardForm {
  title: string;
  description: string;
  color: string;
  isPrivate: boolean;
}

// ドラッグ&ドロップ用の型
export interface DragResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination?: {
    droppableId: string;
    index: number;
  };
}

// 通知用の型
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  createdAt: Date;
}

// 設定用の型
export interface AppSettings {
  theme: 'light' | 'dark';
  language: 'ja' | 'en';
  notifications: {
    email: boolean;
    slack: boolean;
    browser: boolean;
  };
  defaultBoardId?: string;
}