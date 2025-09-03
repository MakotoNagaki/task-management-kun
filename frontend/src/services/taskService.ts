// ディレクトリ: frontend/src/services/taskService.ts

import { Task, User, Team, TaskFilter } from '../types/index';
import { storageUtils } from '../utils/index';

// ============================================
// API設定
// ============================================

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const API_TIMEOUT = 10000; // 10秒

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// HTTP クライアント
// ============================================

class HttpClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }
      
      return { success: false, error: error.message };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const httpClient = new HttpClient();

// ============================================
// タスクサービス
// ============================================

export class TaskService {
  private readonly STORAGE_KEY = 'tasks';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  /**
   * キャッシュから読み取り
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * キャッシュに保存
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * ローカルストレージから読み取り（オフライン対応）
   */
  private getFromStorage(userId: string): Task[] {
    const key = `${this.STORAGE_KEY}_${userId}`;
    return storageUtils.safeGetItem(key, []).map((task: any) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    }));
  }

  /**
   * ローカルストレージに保存
   */
  private saveToStorage(userId: string, tasks: Task[]): void {
    const key = `${this.STORAGE_KEY}_${userId}`;
    storageUtils.safeSetItem(key, tasks);
  }

  /**
   * 全タスクを取得
   */
  async getTasks(userId: string, filter?: TaskFilter): Promise<Task[]> {
    const cacheKey = `tasks_${userId}_${JSON.stringify(filter || {})}`;
    
    // キャッシュから確認
    const cached = this.getFromCache<Task[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // API呼び出し（実際のアプリケーションでは）
      const response = await httpClient.get<Task[]>(`/tasks?userId=${userId}`);
      
      if (response.success && response.data) {
        // データを正規化
        const tasks = response.data.map(task => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        }));

        this.setCache(cacheKey, tasks);
        this.saveToStorage(userId, tasks);
        return tasks;
      }
    } catch (error) {
      console.warn('API call failed, using local storage:', error);
    }

    // フォールバック: ローカルストレージから読み取り
    return this.getFromStorage(userId);
  }

  /**
   * タスクを作成
   */
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // API呼び出し
      const response = await httpClient.post<Task>('/tasks', newTask);
      
      if (response.success && response.data) {
        // キャッシュをクリア
        this.clearCacheForUser(task.createdBy);
        return response.data;
      }
    } catch (error) {
      console.warn('API call failed, saving locally:', error);
    }

    // ローカルでの処理
    const existingTasks = this.getFromStorage(task.createdBy);
    const updatedTasks = [...existingTasks, newTask];
    this.saveToStorage(task.createdBy, updatedTasks);
    
    // キャッシュをクリア
    this.clearCacheForUser(task.createdBy);

    return newTask;
  }

  /**
   * タスクを更新
   */
  async updateTask(taskId: string, updates: Partial<Task>, userId: string): Promise<Task> {
    const updatedTask = {
      ...updates,
      id: taskId,
      updatedAt: new Date(),
    };

    try {
      // API呼び出し
      const response = await httpClient.put<Task>(`/tasks/${taskId}`, updatedTask);
      
      if (response.success && response.data) {
        this.clearCacheForUser(userId);
        return response.data;
      }
    } catch (error) {
      console.warn('API call failed, updating locally:', error);
    }

    // ローカルでの処理
    const existingTasks = this.getFromStorage(userId);
    const taskIndex = existingTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    existingTasks[taskIndex] = { ...existingTasks[taskIndex], ...updatedTask };
    this.saveToStorage(userId, existingTasks);
    this.clearCacheForUser(userId);

    return existingTasks[taskIndex];
  }

  /**
   * タスクを削除
   */
  async deleteTask(taskId: string, userId: string): Promise<boolean> {
    try {
      // API呼び出し
      const response = await httpClient.delete<boolean>(`/tasks/${taskId}`);
      
      if (response.success) {
        this.clearCacheForUser(userId);
        return true;
      }
    } catch (error) {
      console.warn('API call failed, deleting locally:', error);
    }

    // ローカルでの処理
    const existingTasks = this.getFromStorage(userId);
    const filteredTasks = existingTasks.filter(t => t.id !== taskId);
    this.saveToStorage(userId, filteredTasks);
    this.clearCacheForUser(userId);

    return true;
  }

  /**
   * タスクの一括更新
   */
  async bulkUpdateTasks(updates: Array<{ id: string; updates: Partial<Task> }>, userId: string): Promise<Task[]> {
    try {
      const response = await httpClient.post<Task[]>('/tasks/bulk-update', { updates });
      
      if (response.success && response.data) {
        this.clearCacheForUser(userId);
        return response.data;
      }
    } catch (error) {
      console.warn('API call failed, updating locally:', error);
    }

    // ローカルでの処理
    const existingTasks = this.getFromStorage(userId);
    const updatedTasks = existingTasks.map(task => {
      const update = updates.find(u => u.id === task.id);
      if (update) {
        return { ...task, ...update.updates, updatedAt: new Date() };
      }
      return task;
    });

    this.saveToStorage(userId, updatedTasks);
    this.clearCacheForUser(userId);

    return updatedTasks;
  }

  /**
   * タスクの統計を取得
   */
  async getTaskStatistics(userId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    pendingReview: number;
    overdue: number;
    completionRate: number;
  }> {
    const tasks = await this.getTasks(userId);
    const userTasks = tasks.filter(task => task.assigneeIds.includes(userId));
    
    const total = userTasks.length;
    const completed = userTasks.filter(t => t.status === 'done').length;
    const inProgress = userTasks.filter(t => t.status === 'in-progress').length;
    const pendingReview = userTasks.filter(t => t.status === 'pending-review').length;
    
    const now = new Date();
    const overdue = userTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
    ).length;

    return {
      total,
      completed,
      inProgress,
      pendingReview,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  /**
   * タスクの検索
   */
  async searchTasks(query: string, userId: string): Promise<Task[]> {
    const tasks = await this.getTasks(userId);
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return tasks;

    return tasks.filter(task => {
      return (
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        task.assigneeNames.some(name => name.toLowerCase().includes(searchTerm))
      );
    });
  }

  /**
   * 関連タスクの取得
   */
  async getRelatedTasks(taskId: string, userId: string): Promise<Task[]> {
    const tasks = await this.getTasks(userId);
    const targetTask = tasks.find(t => t.id === taskId);
    
    if (!targetTask) return [];

    return tasks.filter(task => {
      if (task.id === taskId) return false;
      
      // 同じ担当者
      const sameAssignee = task.assigneeIds.some(id => targetTask.assigneeIds.includes(id));
      
      // 同じタグ
      const commonTags = task.tags.filter(tag => targetTask.tags.includes(tag));
      
      // 同じチーム
      const sameTeam = task.teamId && task.teamId === targetTask.teamId;
      
      return sameAssignee || commonTags.length > 0 || sameTeam;
    }).slice(0, 5); // 最大5件
  }

  /**
   * タスクのアーカイブ
   */
  async archiveTasks(taskIds: string[], userId: string): Promise<boolean> {
    try {
      const response = await httpClient.post<boolean>('/tasks/archive', { taskIds });
      
      if (response.success) {
        this.clearCacheForUser(userId);
        return true;
      }
    } catch (error) {
      console.warn('API call failed, archiving locally:', error);
    }

    // ローカルでの処理（完了済みタスクをアーカイブ）
    const existingTasks = this.getFromStorage(userId);
    const archivedTasks = existingTasks.filter(t => taskIds.includes(t.id));
    const remainingTasks = existingTasks.filter(t => !taskIds.includes(t.id));
    
    // アーカイブデータを保存
    const archiveKey = `archived_tasks_${userId}_${Date.now()}`;
    storageUtils.safeSetItem(archiveKey, {
      archivedAt: new Date(),
      tasks: archivedTasks
    });
    
    this.saveToStorage(userId, remainingTasks);
    this.clearCacheForUser(userId);

    return true;
  }

  /**
   * データの同期
   */
  async syncTasks(userId: string): Promise<{ success: boolean; synced: number; conflicts: number }> {
    try {
      const localTasks = this.getFromStorage(userId);
      const response = await httpClient.post<{
        synced: Task[];
        conflicts: Array<{ local: Task; remote: Task }>;
      }>('/tasks/sync', { tasks: localTasks });

      if (response.success && response.data) {
        this.saveToStorage(userId, response.data.synced);
        this.clearCacheForUser(userId);
        
        return {
          success: true,
          synced: response.data.synced.length,
          conflicts: response.data.conflicts.length,
        };
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }

    return { success: false, synced: 0, conflicts: 0 };
  }

  /**
   * データのエクスポート
   */
  async exportTasks(userId: string, format: 'json' | 'csv'): Promise<string> {
    const tasks = await this.getTasks(userId);
    
    if (format === 'json') {
      return JSON.stringify(tasks, null, 2);
    }
    
    if (format === 'csv') {
      const headers = ['ID', 'タイトル', '説明', '担当者', 'ステータス', '優先度', '期限', '作成日'];
      const csvRows = [
        headers.join(','),
        ...tasks.map(task => [
          task.id,
          `"${task.title}"`,
          `"${task.description}"`,
          `"${task.assigneeNames.join(';')}"`,
          task.status,
          task.priority,
          task.dueDate ? task.dueDate.toISOString() : '',
          task.createdAt.toISOString()
        ].join(','))
      ];
      
      return csvRows.join('\n');
    }
    
    throw new Error('Unsupported export format');
  }

  /**
   * ユーザーキャッシュのクリア
   */
  private clearCacheForUser(userId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(`tasks_${userId}`)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 全キャッシュのクリア
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * オフラインモードの確認
   */
  isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * 接続状態の監視
   */
  onNetworkStatusChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // クリーンアップ関数を返す
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// ============================================
// チームサービス
// ============================================

export class TeamService {
  private readonly STORAGE_KEY = 'teams';

  async getTeams(): Promise<Team[]> {
    try {
      const response = await httpClient.get<Team[]>('/teams');
      
      if (response.success && response.data) {
        return response.data.map(team => ({
          ...team,
          createdAt: new Date(team.createdAt)
        }));
      }
    } catch (error) {
      console.warn('API call failed, using demo data:', error);
    }

    // デモデータ
    return [
      {
        id: 'team001',
        name: '経営企画',
        code: 'EXEC',
        description: '経営戦略立案・事業企画',
        color: 'bg-blue-100',
        memberIds: ['user001'],
        leaderId: 'user001',
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'team002',
        name: 'マーケティング/PR',
        code: 'MKT',
        description: 'マーケティング戦略・広報活動',
        color: 'bg-purple-100',
        memberIds: ['user002'],
        leaderId: 'user002',
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'team003',
        name: '開発',
        code: 'DEV',
        description: 'システム開発・技術革新',
        color: 'bg-green-100',
        memberIds: ['user003'],
        leaderId: 'user003',
        isActive: true,
        createdAt: new Date()
      }
    ];
  }

  async createTeam(team: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    const newTeam: Team = {
      ...team,
      id: `team_${Date.now()}`,
      createdAt: new Date()
    };

    try {
      const response = await httpClient.post<Team>('/teams', newTeam);
      
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.warn('API call failed, creating locally:', error);
    }

    return newTeam;
  }
}

// ============================================
// ユーザーサービス
// ============================================

export class UserService {
  async getUsers(): Promise<User[]> {
    try {
      const response = await httpClient.get<User[]>('/users');
      
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.warn('API call failed, using demo data:', error);
    }

    // デモデータ
    return [
      {
        id: 'user001',
        name: '田中太郎',
        email: 'tanaka@company.com',
        role: 'admin',
        department: '経営企画',
        position: '部長',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
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
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
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
  }

  async getCurrentUser(): Promise<User | null> {
    // 実際の実装では認証トークンから取得
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const response = await httpClient.put<User>(`/users/${userId}`, updates);
      
      if (response.success && response.data) {
        // 現在のユーザーの場合、ローカルストレージも更新
        const currentUser = await this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          localStorage.setItem('currentUser', JSON.stringify(response.data));
        }
        
        return response.data;
      }
    } catch (error) {
      console.warn('API call failed:', error);
    }

    throw new Error('Failed to update user');
  }
}

// ============================================
// サービスインスタンス
// ============================================

export const taskService = new TaskService();
export const teamService = new TeamService();
export const userService = new UserService();

// ============================================
// サービス統合クラス
// ============================================

export class DataService {
  constructor(
    private taskService: TaskService,
    private teamService: TeamService,
    private userService: UserService
  ) {}

  /**
   * アプリケーション初期化データの読み込み
   */
  async initializeApp(userId: string): Promise<{
    user: User | null;
    tasks: Task[];
    teams: Team[];
    users: User[];
  }> {
    try {
      const [user, tasks, teams, users] = await Promise.all([
        this.userService.getCurrentUser(),
        this.taskService.getTasks(userId),
        this.teamService.getTeams(),
        this.userService.getUsers()
      ]);

      return { user, tasks, teams, users };
    } catch (error) {
      console.error('App initialization failed:', error);
      throw error;
    }
  }

  /**
   * データの一括同期
   */
  async syncAllData(userId: string): Promise<boolean> {
    try {
      const syncResult = await this.taskService.syncTasks(userId);
      return syncResult.success;
    } catch (error) {
      console.error('Data sync failed:', error);
      return false;
    }
  }

  /**
   * オフラインサポートの設定
   */
  setupOfflineSupport(): void {
    // Service Worker の登録（実際の実装では）
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }
}

export const dataService = new DataService(taskService, teamService, userService);