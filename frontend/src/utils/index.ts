// ディレクトリ: frontend/src/utils/index.ts

import { Task, TodoItem, User, Team } from '../types/index';

// ============================================
// 日付ユーティリティ関数
// ============================================

export const dateUtils = {
  /**
   * 日付を日本語形式でフォーマット
   */
  formatJapaneseDate: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  /**
   * 日付時刻を日本語形式でフォーマット
   */
  formatJapaneseDateTime: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * 相対時間表示（〜前、〜後）
   */
  getRelativeTime: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const absDiff = Math.abs(diff);
    
    const minutes = Math.floor(absDiff / (1000 * 60));
    const hours = Math.floor(absDiff / (1000 * 60 * 60));
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    
    const suffix = diff < 0 ? '前' : '後';
    
    if (minutes < 1) return '今';
    if (minutes < 60) return `${minutes}分${suffix}`;
    if (hours < 24) return `${hours}時間${suffix}`;
    if (days < 7) return `${days}日${suffix}`;
    if (weeks < 4) return `${weeks}週間${suffix}`;
    if (months < 12) return `${months}ヶ月${suffix}`;
    
    const years = Math.floor(months / 12);
    return `${years}年${suffix}`;
  },

  /**
   * 期限の緊急度を判定
   */
  getDueDateUrgency: (dueDate: Date | string | undefined): {
    level: 'overdue' | 'urgent' | 'warning' | 'normal' | 'none';
    color: string;
    bgColor: string;
    message: string;
  } => {
    if (!dueDate) {
      return {
        level: 'none',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        message: '期限未設定'
      };
    }
    
    const d = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 0) {
      return {
        level: 'overdue',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        message: '期限切れ'
      };
    } else if (hours < 2) {
      return {
        level: 'urgent',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        message: '期限間近'
      };
    } else if (hours < 24) {
      return {
        level: 'warning',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        message: '今日中'
      };
    } else if (hours < 72) {
      return {
        level: 'normal',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        message: '近日中'
      };
    } else {
      return {
        level: 'normal',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        message: dateUtils.formatJapaneseDate(d)
      };
    }
  },

  /**
   * 今日の範囲を取得
   */
  getTodayRange: (): { start: Date; end: Date } => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
  },

  /**
   * 曜日を取得
   */
  getDayOfWeekName: (dayIndex: number): string => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[dayIndex] || '';
  },

  /**
   * 業務日のチェック
   */
  isWorkingDay: (date: Date | string): boolean => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const dayOfWeek = d.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // 月-金
  }
};

// ============================================
// タスク関連ユーティリティ
// ============================================

export const taskUtils = {
  /**
   * タスクの完了率を計算
   */
  calculateCompletionRate: (tasks: Task[]): number => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    return Math.round((completedTasks / tasks.length) * 100);
  },

  /**
   * 優先度による並び替え
   */
  sortByPriority: (tasks: Task[]): Task[] => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return [...tasks].sort((a, b) => {
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  },

  /**
   * 期限による並び替え
   */
  sortByDueDate: (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return 0;
    });
  },

  /**
   * ユーザーのタスクをフィルター
   */
  filterUserTasks: (tasks: Task[], userId: string): Task[] => {
    return tasks.filter(task => task.assigneeIds.includes(userId));
  },

  /**
   * チームのタスクをフィルター
   */
  filterTeamTasks: (tasks: Task[], teamId: string): Task[] => {
    return tasks.filter(task => task.teamId === teamId);
  },

  /**
   * 期限切れタスクをフィルター
   */
  filterOverdueTasks: (tasks: Task[]): Task[] => {
    const now = new Date();
    return tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'done'
    );
  },

  /**
   * タスクの進捗率を計算（ステータス別）
   */
  getProgressByStatus: (tasks: Task[]): Record<string, number> => {
    const total = tasks.length;
    if (total === 0) return {};
    
    const progress: Record<string, number> = {};
    ['todo', 'in-progress', 'pending-review', 'done', 'blocked'].forEach(status => {
      const count = tasks.filter(task => task.status === status).length;
      progress[status] = Math.round((count / total) * 100);
    });
    
    return progress;
  },

  /**
   * タスクの担当者表示名を取得
   */
  getAssigneeDisplayName: (task: Task): string => {
    if (task.assigneeNames.length === 0) return '未割り当て';
    if (task.assigneeNames.length === 1) return task.assigneeNames[0];
    if (task.assigneeNames.length <= 3) return task.assigneeNames.join(', ');
    return `${task.assigneeNames.slice(0, 2).join(', ')} +${task.assigneeNames.length - 2}名`;
  },

  /**
   * タスクの推定工数を計算（将来実装用）
   */
  estimateTaskComplexity: (task: Task): 'simple' | 'medium' | 'complex' => {
    let score = 0;
    
    // 説明文の長さ
    score += Math.min(task.description.length / 100, 3);
    
    // 担当者数
    score += task.assigneeIds.length > 1 ? 2 : 0;
    
    // タグ数
    score += task.tags.length;
    
    // 関連リンク数
    score += task.relatedLinks.length;
    
    if (score <= 3) return 'simple';
    if (score <= 7) return 'medium';
    return 'complex';
  }
};

// ============================================
// ToDo関連ユーティリティ
// ============================================

export const todoUtils = {
  /**
   * 今日のToDoフィルター
   */
  filterTodayTodos: (todos: TodoItem[], userId: string): TodoItem[] => {
    const { start, end } = dateUtils.getTodayRange();
    
    return todos.filter(todo => {
      if (todo.createdBy !== userId) return false;
      
      // デイリータスクは今日作成されたものを表示
      if (todo.type === 'daily') {
        return new Date(todo.createdAt) >= start;
      }
      
      // スポットタスクは期限が今日のもの
      if (todo.dueDate) {
        const dueDate = new Date(todo.dueDate);
        return dueDate >= start && dueDate < end;
      }
      
      // 期限未設定のスポットタスクは今日作成されたもの
      return new Date(todo.createdAt) >= start;
    });
  },

  /**
   * ToDoの完了率計算
   */
  calculateTodoCompletionRate: (todos: TodoItem[]): number => {
    if (todos.length === 0) return 0;
    const completedCount = todos.filter(todo => todo.isCompleted).length;
    return Math.round((completedCount / todos.length) * 100);
  },

  /**
   * 期限切れToDoのフィルター
   */
  filterOverdueTodos: (todos: TodoItem[]): TodoItem[] => {
    const now = new Date();
    return todos.filter(todo => 
      todo.dueDate && 
      new Date(todo.dueDate) < now && 
      !todo.isCompleted
    );
  },

  /**
   * テンプレートの適用可能性チェック
   */
  isTemplateApplicableToday: (template: TodoTemplate): boolean => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // 毎日実行または今日が指定曜日
    return template.isActive && (
      template.dayOfWeek.length === 0 || 
      template.dayOfWeek.includes(dayOfWeek)
    );
  },

  /**
   * ToDoの並び替え（優先度付き）
   */
  sortTodos: (todos: TodoItem[]): TodoItem[] => {
    return [...todos].sort((a, b) => {
      // 完了状態でまず分ける
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      
      // 期限でソート（近い順）
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      // オーダーでソート
      return a.order - b.order;
    });
  }
};

// ============================================
// バリデーションユーティリティ
// ============================================

export const validationUtils = {
  /**
   * タスクタイトルのバリデーション
   */
  validateTaskTitle: (title: string): { isValid: boolean; message?: string } => {
    const trimmedTitle = title.trim();
    
    if (!trimmedTitle) {
      return { isValid: false, message: 'タイトルは必須です' };
    }
    
    if (trimmedTitle.length < 2) {
      return { isValid: false, message: 'タイトルは2文字以上で入力してください' };
    }
    
    if (trimmedTitle.length > 100) {
      return { isValid: false, message: 'タイトルは100文字以内で入力してください' };
    }
    
    return { isValid: true };
  },

  /**
   * タスク説明のバリデーション
   */
  validateTaskDescription: (description: string): { isValid: boolean; message?: string } => {
    if (description.length > 1000) {
      return { isValid: false, message: '説明は1000文字以内で入力してください' };
    }
    
    return { isValid: true };
  },

  /**
   * 期限日のバリデーション
   */
  validateDueDate: (dueDate: string | Date): { isValid: boolean; message?: string } => {
    if (!dueDate) return { isValid: true }; // 期限は任意
    
    const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    
    if (isNaN(date.getTime())) {
      return { isValid: false, message: '有効な日付を入力してください' };
    }
    
    const now = new Date();
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    if (date < new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
      return { isValid: false, message: '期限は明日以降の日付を設定してください' };
    }
    
    if (date > oneYearFromNow) {
      return { isValid: false, message: '期限は1年以内の日付を設定してください' };
    }
    
    return { isValid: true };
  },

  /**
   * メールアドレスのバリデーション
   */
  validateEmail: (email: string): { isValid: boolean; message?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
      return { isValid: false, message: 'メールアドレスは必須です' };
    }
    
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, message: '有効なメールアドレスを入力してください' };
    }
    
    return { isValid: true };
  },

  /**
   * タグ名のバリデーション
   */
  validateTag: (tag: string): { isValid: boolean; message?: string } => {
    const trimmedTag = tag.trim();
    
    if (!trimmedTag) {
      return { isValid: false, message: 'タグ名は必須です' };
    }
    
    if (trimmedTag.length > 20) {
      return { isValid: false, message: 'タグ名は20文字以内で入力してください' };
    }
    
    if (!/^[a-zA-Z0-9ひらがなカタカナ漢字\-_]+$/.test(trimmedTag)) {
      return { isValid: false, message: 'タグ名に使用できない文字が含まれています' };
    }
    
    return { isValid: true };
  }
};

// ============================================
// ユーザー・チーム関連ユーティリティ
// ============================================

export const userUtils = {
  /**
   * ユーザーの表示名取得
   */
  getUserDisplayName: (user: User): string => {
    return `${user.name} (${user.department}・${user.position})`;
  },

  /**
   * ユーザーの権限チェック
   */
  hasPermission: (user: User, action: 'create' | 'edit' | 'delete' | 'admin'): boolean => {
    switch (action) {
      case 'admin':
        return user.role === 'admin';
      case 'create':
      case 'edit':
        return ['admin', 'manager', 'member'].includes(user.role);
      case 'delete':
        return ['admin', 'manager'].includes(user.role);
      default:
        return false;
    }
  },

  /**
   * チームのメンバーかチェック
   */
  isTeamMember: (user: User, teamId: string): boolean => {
    return user.teamIds.includes(teamId);
  },

  /**
   * チームリーダーかチェック
   */
  isTeamLeader: (user: User, team: Team): boolean => {
    return team.leaderId === user.id;
  },

  /**
   * ユーザーアバターのURL取得
   */
  getAvatarUrl: (user: User): string => {
    if (user.avatar) return user.avatar;
    
    // Gravatar風のフォールバック
    const firstChar = user.name.charAt(0).toUpperCase();
    const colorIndex = user.name.charCodeAt(0) % 6;
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="${colors[colorIndex].replace('bg-', '').replace('-500', '')}" rx="20"/>
        <text x="20" y="26" text-anchor="middle" fill="white" font-family="sans-serif" font-size="16" font-weight="bold">${firstChar}</text>
      </svg>
    `)}`;
  }
};

// ============================================
// UI関連ユーティリティ
// ============================================

export const uiUtils = {
  /**
   * クラス名を結合
   */
  classNames: (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
  },

  /**
   * カラーパレット取得
   */
  getStatusColor: (status: string): { bg: string; text: string; border: string } => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      'todo': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
      'in-progress': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
      'pending-review': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
      'done': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
      'blocked': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
    };
    
    return colors[status] || colors.todo;
  },

  /**
   * 優先度カラー取得
   */
  getPriorityColor: (priority: string): { bg: string; text: string } => {
    const colors: Record<string, { bg: string; text: string }> = {
      'high': { bg: 'bg-red-100', text: 'text-red-800' },
      'medium': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'low': { bg: 'bg-green-100', text: 'text-green-800' }
    };
    
    return colors[priority] || colors.medium;
  },

  /**
   * 文字列の省略
   */
  truncateText: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },

  /**
   * 検索ハイライト
   */
  highlightSearchTerm: (text: string, searchTerm: string): string => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.trim()})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  }
};

// ============================================
// ストレージユーティリティ
// ============================================

export const storageUtils = {
  /**
   * 安全なローカルストレージ操作
   */
  safeSetItem: (key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('ローカルストレージの書き込みに失敗:', err);
      return false;
    }
  },

  /**
   * 安全なローカルストレージ読み込み
   */
  safeGetItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (err) {
      console.warn('ローカルストレージの読み込みに失敗:', err);
      return defaultValue;
    }
  },

  /**
   * ローカルストレージのクリア
   */
  clearUserData: (userId: string): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes(userId)) {
        localStorage.removeItem(key);
      }
    });
  },

  /**
   * データのエクスポート
   */
  exportUserData: (userId: string): string => {
    const userData: Record<string, any> = {};
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.includes(userId)) {
        try {
          userData[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch (err) {
          userData[key] = localStorage.getItem(key);
        }
      }
    });
    
    return JSON.stringify(userData, null, 2);
  },

  /**
   * データのインポート
   */
  importUserData: (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
      return true;
    } catch (err) {
      console.error('データのインポートに失敗:', err);
      return false;
    }
  }
};

// ============================================
// パフォーマンス最適化ユーティリティ
// ============================================

export const performanceUtils = {
  /**
   * デバウンス関数
   */
  debounce: <T extends (...args: any[]) => void>(
    func: T, 
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  /**
   * スロットル関数
   */
  throttle: <T extends (...args: any[]) => void>(
    func: T, 
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  },

  /**
   * 配列のチャンク分割
   */
  chunkArray: <T>(array: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  },

  /**
   * 重複除去
   */
  uniqueBy: <T>(array: T[], keySelector: (item: T) => string | number): T[] => {
    const seen = new Set();
    return array.filter(item => {
      const key = keySelector(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};

// ============================================
// 統計・分析ユーティリティ
// ============================================

export const analyticsUtils = {
  /**
   * タスク完了トレンドの計算
   */
  calculateCompletionTrend: (tasks: Task[], days: number = 7): number[] => {
    const trend: number[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const completedTasks = tasks.filter(task => 
        task.status === 'done' && 
        task.updatedAt >= dayStart && 
        task.updatedAt < dayEnd
      ).length;
      
      trend.push(completedTasks);
    }
    
    return trend;
  },

  /**
   * 平均完了時間の計算
   */
  calculateAverageCompletionTime: (tasks: Task[]): number => {
    const completedTasks = tasks.filter(task => task.status === 'done');
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => {
      const createdAt = new Date(task.createdAt).getTime();
      const updatedAt = new Date(task.updatedAt).getTime();
      return sum + (updatedAt - createdAt);
    }, 0);
    
    return totalTime / completedTasks.length;
  },

  /**
   * 生産性指標の計算
   */
  calculateProductivityMetrics: (tasks: Task[], userId: string) => {
    const userTasks = tasks.filter(task => task.assigneeIds.includes(userId));
    const completedTasks = userTasks.filter(task => task.status === 'done');
    
    const today = new Date();
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const thisWeekCompleted = completedTasks.filter(task => new Date(task.updatedAt) >= weekStart).length;
    const thisMonthCompleted = completedTasks.filter(task => new Date(task.updatedAt) >= monthStart).length;
    
    return {
      totalTasks: userTasks.length,
      completedTasks: completedTasks.length,
      completionRate: userTasks.length > 0 ? (completedTasks.length / userTasks.length) * 100 : 0,
      thisWeekCompleted,
      thisMonthCompleted,
      averageCompletionTime: analyticsUtils.calculateAverageCompletionTime(userTasks)
    };
  }
};

// ============================================
// エクスポート用の統合オブジェクト
// ============================================

export const utils = {
  date: dateUtils,
  task: taskUtils,
  todo: todoUtils,
  validation: validationUtils,
  user: userUtils,
  ui: uiUtils,
  storage: storageUtils,
  analytics: analyticsUtils,
  performance: performanceUtils
};

export default utils;