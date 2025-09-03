// ディレクトリ: frontend/src/hooks/useTasks.ts

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Task, User, TaskFilter, TASK_STATUSES } from '../types/index';
import { useNotifications } from './useNotifications';
import { taskService } from '../services/taskService';

interface UseTasksOptions {
  currentUser: User | null;
  initialTasks?: Task[];
}

interface UseTasksReturn {
  // データ
  tasks: Task[];
  filteredTasks: Task[];
  tasksByStatus: Record<string, Task[]>;
  
  // 統計
  stats: {
    totalTasks: number;
    myTasks: number;
    completedTasks: number;
    pendingReview: number;
    overdueTasks: number;
    todayDueTasks: number;
  };
  
  // フィルター
  filter: TaskFilter;
  setFilter: React.Dispatch<React.SetStateAction<TaskFilter>>;
  
  // 操作関数
  addTask: (taskData: Partial<Task>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  reviewTask: (taskId: string, approved: boolean, comment?: string) => Promise<void>;
  
  // ドラッグ&ドロップ
  draggedTask: Task | null;
  setDraggedTask: React.Dispatch<React.SetStateAction<Task | null>>;
  moveTask: (taskId: string, newStatus: string) => Promise<void>;
  
  // UI状態
  loading: boolean;
  error: string | null;
}

export const useTasks = ({ currentUser, initialTasks = [] }: UseTasksOptions): UseTasksReturn => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  
  // フィルター状態
  const [filter, setFilter] = useState<TaskFilter>({
    scope: 'all',
    status: [],
    assignee: 'all',
    selectedTeamIds: [],
    selectedUserIds: [],
    searchTerm: '',
    tags: [],
    priority: [],
    dueDateRange: 'all'
  });

  const { showNotification } = useNotifications();

  // ============================================
  // データ初期化
  // ============================================
  
  useEffect(() => {
    if (currentUser && tasks.length === 0) {
      loadInitialTasks();
    }
  }, [currentUser]);

  const loadInitialTasks = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // 実際のAPIコールの代わりにサンプルデータを使用
      const sampleTasks: Task[] = [
        {
          id: 'task001',
          title: '2025年度事業計画策定',
          description: '来年度の事業計画を策定し、各部門との調整を行う。市場調査、競合分析、売上目標設定などを含む包括的な計画作成が必要。',
          assigneeType: 'individual',
          assigneeIds: [currentUser.id],
          assigneeNames: [currentUser.name],
          createdBy: currentUser.id,
          createdByName: currentUser.name,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          priority: 'high',
          status: 'in-progress',
          tags: ['戦略', '企画', '重要'],
          relatedLinks: [],
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        },
        {
          id: 'task002',
          title: 'システム改修作業',
          description: '既存システムの改修を行い、パフォーマンスを向上させる。データベース最適化、API改善、フロントエンド更新が含まれます。',
          assigneeType: 'individual',
          assigneeIds: [currentUser.id],
          assigneeNames: [currentUser.name],
          createdBy: currentUser.id,
          createdByName: currentUser.name,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          priority: 'medium',
          status: 'pending-review',
          tags: ['開発', 'システム'],
          relatedLinks: [],
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          completedBy: currentUser.id,
          reviewComment: '動作確認をお願いします'
        },
        {
          id: 'task003',
          title: '月次売上レポート作成',
          description: '8月の売上実績をまとめ、前年同月比較と来月の予測を含むレポートを作成する。',
          assigneeType: 'individual',
          assigneeIds: [currentUser.id],
          assigneeNames: [currentUser.name],
          createdBy: currentUser.id,
          createdByName: currentUser.name,
          priority: 'medium',
          status: 'todo',
          tags: ['レポート', '売上'],
          relatedLinks: [],
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          updatedAt: new Date()
        },
        {
          id: 'task004',
          title: 'クライアント提案書作成',
          description: '新規クライアント向けの提案書を作成し、営業チームとの調整を行う。',
          assigneeType: 'individual',
          assigneeIds: [currentUser.id],
          assigneeNames: [currentUser.name],
          createdBy: currentUser.id,
          createdByName: currentUser.name,
          dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2時間前（期限切れ）
          priority: 'high',
          status: 'in-progress',
          tags: ['営業', '提案'],
          relatedLinks: [],
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        },
        {
          id: 'task005',
          title: 'チーム研修準備',
          description: '新入社員向けの研修資料を準備し、スケジュールを調整する。',
          assigneeType: 'individual',
          assigneeIds: [currentUser.id],
          assigneeNames: [currentUser.name],
          createdBy: currentUser.id,
          createdByName: currentUser.name,
          priority: 'low',
          status: 'done',
          tags: ['研修', 'HR'],
          relatedLinks: [],
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          reviewedBy: currentUser.id
        }
      ];
      
      setTasks(sampleTasks);
      setError(null);
    } catch (err) {
      setError('タスクの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ============================================
  // データ計算（メモ化）
  // ============================================
  
  // フィルター済みタスク
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // スコープフィルター
      if (filter.scope === 'personal' && !task.assigneeIds.includes(currentUser?.id || '')) return false;
      if (filter.scope === 'team' && task.assigneeType !== 'team') return false;
      if (filter.scope === 'company' && task.assigneeType !== 'company') return false;
      
      // ステータスフィルター
      if (filter.status.length > 0 && !filter.status.includes(task.status)) return false;
      
      // 担当者フィルター
      if (filter.assignee === 'me' && !task.assigneeIds.includes(currentUser?.id || '')) return false;
      if (filter.selectedUserIds.length > 0) {
        const hasSelectedUser = filter.selectedUserIds.some(userId => task.assigneeIds.includes(userId));
        if (!hasSelectedUser) return false;
      }
      
      // 検索フィルター
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchLower);
        const matchesDescription = task.description.toLowerCase().includes(searchLower);
        const matchesTags = task.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesTitle && !matchesDescription && !matchesTags) return false;
      }
      
      // タグフィルター
      if (filter.tags.length > 0 && !filter.tags.some(tag => task.tags.includes(tag))) return false;
      
      // 優先度フィルター
      if (filter.priority.length > 0 && !filter.priority.includes(task.priority)) return false;
      
      // 期限フィルター
      if (filter.dueDateRange !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (filter.dueDateRange) {
          case 'overdue':
            if (!task.dueDate || new Date(task.dueDate) >= now) return false;
            break;
          case 'today':
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
            if (taskDay.getTime() !== today.getTime()) return false;
            break;
          case 'this-week':
            if (!task.dueDate) return false;
            const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            if (new Date(task.dueDate) > weekEnd) return false;
            break;
          case 'this-month':
            if (!task.dueDate) return false;
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            if (new Date(task.dueDate) > monthEnd) return false;
            break;
        }
      }
      
      return true;
    });
  }, [tasks, filter, currentUser]);

  // ステータス別タスクのグループ化
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    TASK_STATUSES.forEach(status => {
      grouped[status.id] = filteredTasks
        .filter(task => task.status === status.id)
        .sort((a, b) => {
          // 優先度でソート（高→低）
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          if (a.priority !== b.priority) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          // 期限でソート（近い順、期限なしは最後）
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          // 更新日でソート（新しい順）
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
    });
    return grouped;
  }, [filteredTasks]);

  // 統計データ
  const stats = useMemo(() => {
    if (!currentUser) {
      return {
        totalTasks: 0,
        myTasks: 0,
        completedTasks: 0,
        pendingReview: 0,
        overdueTasks: 0,
        todayDueTasks: 0
      };
    }
    
    const myTasks = tasks.filter(task => task.assigneeIds.includes(currentUser.id));
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    return {
      totalTasks: tasks.length,
      myTasks: myTasks.length,
      completedTasks: myTasks.filter(t => t.status === 'done').length,
      pendingReview: myTasks.filter(t => t.status === 'pending-review').length,
      overdueTasks: myTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < today && t.status !== 'done'
      ).length,
      todayDueTasks: myTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) >= todayStart && new Date(t.dueDate) < todayEnd
      ).length
    };
  }, [tasks, currentUser]);

  // ============================================
  // タスク操作関数
  // ============================================
  
  const addTask = useCallback(async (taskData: Partial<Task>) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const newTask: Task = {
        id: `task${Date.now()}`,
        title: taskData.title || '',
        description: taskData.description || '',
        assigneeType: taskData.assigneeType || 'individual',
        assigneeIds: taskData.assigneeIds || [currentUser.id],
        assigneeNames: taskData.assigneeNames || [currentUser.name],
        teamId: taskData.teamId,
        teamName: taskData.teamName,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        dueDate: taskData.dueDate,
        priority: taskData.priority || 'medium',
        status: 'todo',
        tags: taskData.tags || [],
        relatedLinks: taskData.relatedLinks || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // APIコール（実際の実装では）
      // const savedTask = await taskService.createTask(newTask);
      
      setTasks(prev => [...prev, newTask]);
      setError(null);
      
      showNotification('タスク作成', `「${newTask.title}」を作成しました`);
    } catch (err) {
      setError('タスクの作成に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, showNotification]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    setLoading(true);
    try {
      const updatedTask = {
        ...updates,
        updatedAt: new Date()
      };
      
      // APIコール（実際の実装では）
      // await taskService.updateTask(taskId, updatedTask);
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updatedTask } : task
      ));
      setError(null);
      
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        showNotification('タスク更新', `「${task.title}」を更新しました`);
      }
    } catch (err) {
      setError('タスクの更新に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tasks, showNotification]);

  const deleteTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (!confirm(`「${task.title}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }
    
    setLoading(true);
    try {
      // APIコール（実際の実装では）
      // await taskService.deleteTask(taskId);
      
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setError(null);
      
      showNotification('タスク削除', `「${task.title}」を削除しました`);
    } catch (err) {
      setError('タスクの削除に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tasks, showNotification]);

  const completeTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !currentUser) return;
    
    await updateTask(taskId, {
      status: 'pending-review',
      completedBy: currentUser.id,
      reviewComment: '確認をお願いします'
    });
    
    showNotification('タスク完了', `「${task.title}」が確認待ちになりました`);
  }, [tasks, currentUser, updateTask, showNotification]);

  const reviewTask = useCallback(async (taskId: string, approved: boolean, comment?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !currentUser) return;
    
    const updates: Partial<Task> = {
      status: approved ? 'done' : 'in-progress',
      reviewedBy: currentUser.id,
      reviewComment: comment || (approved ? '承認完了' : '修正が必要です')
    };
    
    await updateTask(taskId, updates);
    
    showNotification(
      approved ? 'タスク承認' : 'タスク差し戻し',
      approved 
        ? `「${task.title}」を承認しました`
        : `「${task.title}」を差し戻しました`
    );
  }, [tasks, currentUser, updateTask, showNotification]);

  const moveTask = useCallback(async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    
    const updates: Partial<Task> = { status: newStatus as Task['status'] };
    
    // ステータス変更時の特別な処理
    if (newStatus === 'pending-review' && task.status === 'in-progress') {
      updates.completedBy = currentUser?.id;
      updates.reviewComment = '確認をお願いします';
    }
    
    if (newStatus === 'done' && task.status === 'pending-review') {
      updates.reviewedBy = currentUser?.id;
    }
    
    if (newStatus === 'in-progress' && task.status === 'pending-review') {
      updates.reviewComment = '修正のため差し戻されました';
      updates.reviewedBy = currentUser?.id;
    }
    
    await updateTask(taskId, updates);
  }, [tasks, currentUser, updateTask]);

  // ============================================
  // フィルター操作関数
  // ============================================
  
  const resetFilter = useCallback(() => {
    setFilter({
      scope: 'all',
      status: [],
      assignee: 'all',
      selectedTeamIds: [],
      selectedUserIds: [],
      searchTerm: '',
      tags: [],
      priority: [],
      dueDateRange: 'all'
    });
  }, []);

  const setQuickFilter = useCallback((type: 'my-tasks' | 'overdue' | 'pending-review' | 'today') => {
    switch (type) {
      case 'my-tasks':
        setFilter(prev => ({ ...prev, scope: 'personal', assignee: 'me' }));
        break;
      case 'overdue':
        setFilter(prev => ({ ...prev, dueDateRange: 'overdue', status: ['todo', 'in-progress'] }));
        break;
      case 'pending-review':
        setFilter(prev => ({ ...prev, status: ['pending-review'] }));
        break;
      case 'today':
        setFilter(prev => ({ ...prev, dueDateRange: 'today' }));
        break;
    }
  }, []);

  // ============================================
  // データ永続化
  // ============================================
  
  useEffect(() => {
    // ローカルストレージに保存（実際のアプリでは定期的にサーバーと同期）
    if (tasks.length > 0) {
      try {
        localStorage.setItem(`tasks_${currentUser?.id}`, JSON.stringify(tasks));
      } catch (err) {
        console.warn('タスクデータの保存に失敗しました:', err);
      }
    }
  }, [tasks, currentUser?.id]);

  // フィルター状態の保存
  useEffect(() => {
    try {
      localStorage.setItem(`taskFilter_${currentUser?.id}`, JSON.stringify(filter));
    } catch (err) {
      console.warn('フィルター設定の保存に失敗しました:', err);
    }
  }, [filter, currentUser?.id]);

  // ============================================
  // 戻り値
  // ============================================
  
  return {
    // データ
    tasks,
    filteredTasks,
    tasksByStatus,
    
    // 統計
    stats,
    
    // フィルター
    filter,
    setFilter,
    
    // 操作関数
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    reviewTask,
    
    // ドラッグ&ドロップ
    draggedTask,
    setDraggedTask,
    moveTask,
    
    // ユーティリティ
    resetFilter,
    setQuickFilter,
    
    // UI状態
    loading,
    error
  };
};