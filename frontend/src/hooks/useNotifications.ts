// ディレクトリ: frontend/src/hooks/useNotifications.ts

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  NotificationItem, NotificationSettings, Task, TodoItem, User 
} from '../types/index';

interface UseNotificationsOptions {
  currentUser: User | null;
  tasks?: Task[];
  todos?: TodoItem[];
}

interface UseNotificationsReturn {
  // 通知データ
  notifications: NotificationItem[];
  unreadCount: number;
  
  // 設定
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  
  // 通知操作
  showNotification: (title: string, message: string, options?: NotificationOptions) => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  
  // ブラウザ通知
  requestPermission: () => Promise<boolean>;
  isPermissionGranted: boolean;
  
  // UI状態
  hasUrgentNotifications: boolean;
  recentNotifications: NotificationItem[];
}

export const useNotifications = ({ 
  currentUser, 
  tasks = [], 
  todos = [] 
}: UseNotificationsOptions = {}): UseNotificationsReturn => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    taskReminders: true,
    todoReminders: true,
    deadlineAlerts: true,
    statusChangeNotifications: true,
    browserNotifications: false,
    soundEnabled: true
  });

  // ============================================
  // ブラウザ通知権限管理
  // ============================================
  
  const isPermissionGranted = useMemo(() => {
    return 'Notification' in window && Notification.permission === 'granted';
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('このブラウザは通知をサポートしていません');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      // 設定を更新
      setSettings(prev => ({
        ...prev,
        browserNotifications: granted
      }));
      
      if (granted) {
        showBrowserNotification(
          'タスク管理システム', 
          '通知が有効になりました。重要な期限をお知らせします。'
        );
      }
      
      return granted;
    } catch (err) {
      console.error('通知権限の要求に失敗:', err);
      return false;
    }
  }, []);

  // ============================================
  // 通知表示関数
  // ============================================
  
  const showBrowserNotification = useCallback((
    title: string, 
    body: string, 
    options?: NotificationOptions
  ) => {
    if (!settings.browserNotifications || !isPermissionGranted) {
      return;
    }
    
    try {
      const notification = new Notification(title, { 
        body, 
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options?.tag || 'task-system',
        requireInteraction: options?.requireInteraction || false,
        silent: !settings.soundEnabled,
        ...options 
      });
      
      // 通知音の再生
      if (settings.soundEnabled) {
        playNotificationSound();
      }
      
      // 自動で閉じる（重要でない場合）
      if (!options?.requireInteraction) {
        setTimeout(() => {
          try {
            notification.close();
          } catch (err) {
            // 通知が既に閉じられている場合のエラーを無視
          }
        }, 5000);
      }
      
      return notification;
    } catch (err) {
      console.error('ブラウザ通知の表示に失敗:', err);
    }
  }, [settings.browserNotifications, settings.soundEnabled, isPermissionGranted]);

  const playNotificationSound = useCallback(() => {
    if (!settings.soundEnabled) return;
    
    try {
      // 通知音を再生（Web Audio APIまたはAudioElement）
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (err) {
      // フォールバック: HTMLAudioElement
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAdyn6/vNdCEDMH/O8dyOpAoQZL7n7aRRHAk8j9n1unMEEGOq5e+OQwwEYKHh8bllNAcmeMjw3o1KDAgyZcnV6ZdcKQklSZ7TJBZGHQZYlOjvp1AWDUI+hcHZvW4RAUr+ZKrfw24UQD5Yj+TylUIZDkAOAAAAASUVORK5CYII=');
        audio.play().catch(() => {
          // ユーザーの操作なしでは再生できない場合があるため、エラーを無視
        });
      } catch (audioErr) {
        console.warn('通知音の再生に失敗:', audioErr);
      }
    }
  }, [settings.soundEnabled]);

  const showNotification = useCallback((
    title: string, 
    message: string, 
    options?: NotificationOptions
  ) => {
    // アプリ内通知を追加
    addNotification({
      type: 'status-change',
      title,
      message,
      targetId: '',
      userId: currentUser?.id || '',
      isRead: false
    });
    
    // ブラウザ通知を表示
    showBrowserNotification(title, message, options);
  }, [currentUser, showBrowserNotification]);

  const addNotification = useCallback((
    notification: Omit<NotificationItem, 'id' | 'createdAt'>
  ) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: `notification${Date.now()}`,
      createdAt: new Date()
    };
    
    setNotifications(prev => {
      // 重複通知を防ぐ
      const isDuplicate = prev.some(n => 
        n.type === notification.type && 
        n.targetId === notification.targetId &&
        n.title === notification.title &&
        Date.now() - n.createdAt.getTime() < 60000 // 1分以内の重複をチェック
      );
      
      if (isDuplicate) {
        return prev;
      }
      
      // 最新50件まで保持
      const updated = [newNotification, ...prev].slice(0, 50);
      return updated;
    });
  }, []);

  // ============================================
  // 通知操作関数
  // ============================================
  
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      isRead: true
    })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // 設定をローカルストレージに保存
      try {
        localStorage.setItem(
          `notificationSettings_${currentUser?.id}`, 
          JSON.stringify(updated)
        );
      } catch (err) {
        console.warn('通知設定の保存に失敗:', err);
      }
      
      return updated;
    });
    
    // ブラウザ通知が有効化された場合、権限を要求
    if (newSettings.browserNotifications && !settings.browserNotifications) {
      requestPermission();
    }
  }, [currentUser, settings.browserNotifications, requestPermission]);

  // ============================================
  // 期限監視とアラート
  // ============================================
  
  const checkDeadlines = useCallback(() => {
    if (!currentUser || !settings.deadlineAlerts) return;
    
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // タスクの期限チェック
    if (settings.taskReminders) {
      tasks.forEach(task => {
        if (!task.dueDate || 
            task.status === 'done' || 
            !task.assigneeIds.includes(currentUser.id)) {
          return;
        }
        
        const dueDate = new Date(task.dueDate);
        const taskId = task.id;
        
        // 期限切れチェック
        if (dueDate < now) {
          const notificationId = `deadline_overdue_${taskId}`;
          const exists = notifications.some(n => n.id.includes(notificationId.substring(0, 20)));
          
          if (!exists) {
            addNotification({
              type: 'deadline-alert',
              title: 'タスク期限切れ',
              message: `「${task.title}」の期限が過ぎています`,
              targetId: taskId,
              userId: currentUser.id,
              isRead: false
            });
            
            showBrowserNotification(
              'タスク期限切れ ⚠️', 
              `「${task.title}」の期限が過ぎています`,
              { tag: taskId, requireInteraction: true }
            );
          }
        }
        // 1時間前アラート
        else if (dueDate <= oneHourFromNow && dueDate > now) {
          const notificationId = `deadline_1h_${taskId}`;
          const exists = notifications.some(n => n.id.includes(notificationId.substring(0, 15)));
          
          if (!exists) {
            addNotification({
              type: 'deadline-alert',
              title: 'タスク期限間近',
              message: `「${task.title}」の期限まで1時間を切りました`,
              targetId: taskId,
              userId: currentUser.id,
              isRead: false
            });
            
            showBrowserNotification(
              'タスク期限間近 ⏰', 
              `「${task.title}」の期限まで1時間を切りました`,
              { tag: taskId }
            );
          }
        }
        // 1日前アラート
        else if (dueDate <= oneDayFromNow && dueDate > oneHourFromNow) {
          const notificationId = `deadline_1d_${taskId}`;
          const exists = notifications.some(n => n.id.includes(notificationId.substring(0, 15)));
          
          if (!exists) {
            addNotification({
              type: 'deadline-alert',
              title: 'タスク期限1日前',
              message: `「${task.title}」の期限まで1日を切りました`,
              targetId: taskId,
              userId: currentUser.id,
              isRead: false
            });
            
            showBrowserNotification(
              'タスク期限1日前 📅', 
              `「${task.title}」の期限まで1日を切りました`,
              { tag: taskId }
            );
          }
        }
      });
    }
    
    // ToDoの期限チェック
    if (settings.todoReminders) {
      todos.forEach(todo => {
        if (!todo.dueDate || 
            todo.isCompleted || 
            todo.createdBy !== currentUser.id) {
          return;
        }
        
        const dueDate = new Date(todo.dueDate);
        const todoId = todo.id;
        
        // 期限切れチェック
        if (dueDate < now) {
          const notificationId = `todo_overdue_${todoId}`;
          const exists = notifications.some(n => n.id.includes(notificationId.substring(0, 15)));
          
          if (!exists) {
            addNotification({
              type: 'todo-reminder',
              title: 'ToDo期限切れ',
              message: `「${todo.title}」の期限が過ぎています`,
              targetId: todoId,
              userId: currentUser.id,
              isRead: false
            });
            
            showBrowserNotification(
              'ToDo期限切れ ⚠️', 
              `「${todo.title}」の期限が過ぎています`,
              { tag: todoId }
            );
          }
        }
        // 1時間前アラート
        else if (dueDate <= oneHourFromNow && dueDate > now) {
          const notificationId = `todo_1h_${todoId}`;
          const exists = notifications.some(n => n.id.includes(notificationId.substring(0, 10)));
          
          if (!exists) {
            addNotification({
              type: 'todo-reminder',
              title: 'ToDo期限間近',
              message: `「${todo.title}」の期限まで1時間を切りました`,
              targetId: todoId,
              userId: currentUser.id,
              isRead: false
            });
            
            showBrowserNotification(
              'ToDo期限間近 ⏰', 
              `「${todo.title}」の期限まで1時間を切りました`,
              { tag: todoId }
            );
          }
        }
      });
    }
  }, [
    currentUser, 
    tasks, 
    todos, 
    settings.deadlineAlerts, 
    settings.taskReminders, 
    settings.todoReminders,
    notifications,
    addNotification,
    showBrowserNotification
  ]);

  // ============================================
  // 定期的な期限チェック
  // ============================================
  
  useEffect(() => {
    // 初回チェック
    checkDeadlines();
    
    // 5分間隔で期限チェック
    const interval = setInterval(checkDeadlines, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkDeadlines]);

  // ============================================
  // 設定の永続化
  // ============================================
  
  useEffect(() => {
    if (currentUser) {
      // 設定を読み込み
      try {
        const savedSettings = localStorage.getItem(`notificationSettings_${currentUser.id}`);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        }
      } catch (err) {
        console.warn('通知設定の読み込みに失敗:', err);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    // 設定を保存
    if (currentUser) {
      try {
        localStorage.setItem(
          `notificationSettings_${currentUser.id}`, 
          JSON.stringify(settings)
        );
      } catch (err) {
        console.warn('通知設定の保存に失敗:', err);
      }
    }
  }, [settings, currentUser]);

  // ============================================
  // 通知データの永続化
  // ============================================
  
  useEffect(() => {
    // 通知データを保存（最新50件のみ）
    if (currentUser && notifications.length > 0) {
      try {
        const toSave = notifications.slice(0, 50);
        localStorage.setItem(
          `notifications_${currentUser.id}`, 
          JSON.stringify(toSave)
        );
      } catch (err) {
        console.warn('通知データの保存に失敗:', err);
      }
    }
  }, [notifications, currentUser]);

  useEffect(() => {
    // 通知データを読み込み
    if (currentUser) {
      try {
        const saved = localStorage.getItem(`notifications_${currentUser.id}`);
        if (saved) {
          const parsed = JSON.parse(saved).map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt),
            scheduledAt: n.scheduledAt ? new Date(n.scheduledAt) : undefined
          }));
          setNotifications(parsed);
        }
      } catch (err) {
        console.warn('通知データの読み込みに失敗:', err);
      }
    }
  }, [currentUser]);

  // ============================================
  // 計算済みデータ
  // ============================================
  
  // 未読通知数
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead && n.userId === currentUser?.id).length;
  }, [notifications, currentUser]);

  // 緊急通知の有無
  const hasUrgentNotifications = useMemo(() => {
    return notifications.some(n => 
      !n.isRead && 
      n.userId === currentUser?.id &&
      (n.type === 'deadline-alert' && n.title.includes('期限切れ'))
    );
  }, [notifications, currentUser]);

  // 最近の通知（24時間以内）
  const recentNotifications = useMemo(() => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return notifications
      .filter(n => 
        n.userId === currentUser?.id && 
        new Date(n.createdAt) > yesterday
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [notifications, currentUser]);

  // ============================================
  // 自動クリーンアップ
  // ============================================
  
  useEffect(() => {
    // 7日より古い通知を自動削除
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    setNotifications(prev => 
      prev.filter(n => new Date(n.createdAt) > oneWeekAgo)
    );
  }, []); // 1回だけ実行

  // ============================================
  // 毎日の通知リマインダー
  // ============================================
  
  useEffect(() => {
    if (!currentUser?.todoSettings.notificationEnabled) return;
    
    const checkDailyReminder = () => {
      const now = new Date();
      const notificationTime = currentUser.todoSettings.notificationTime || '09:00';
      const [hours, minutes] = notificationTime.split(':').map(Number);
      
      const targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);
      
      // 設定時刻の5分以内かチェック
      const diff = Math.abs(now.getTime() - targetTime.getTime());
      if (diff <= 5 * 60 * 1000) {
        const incompleteTodos = todayTodos.filter(t => !t.isCompleted);
        
        if (incompleteTodos.length > 0) {
          showBrowserNotification(
            '今日のToDoリマインダー 📋',
            `${incompleteTodos.length}件の未完了ToDoがあります`,
            { tag: 'daily-reminder' }
          );
        }
      }
    };
    
    // 初回チェック
    checkDailyReminder();
    
    // 1分ごとにチェック
    const interval = setInterval(checkDailyReminder, 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser, todayTodos, showBrowserNotification]);

  // ============================================
  // 戻り値
  // ============================================
  
  return {
    // 通知データ
    notifications,
    unreadCount,
    
    // 設定
    settings,
    updateSettings,
    
    // 通知操作
    showNotification,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    
    // ブラウザ通知
    requestPermission,
    isPermissionGranted,
    
    // UI状態
    hasUrgentNotifications,
    recentNotifications
  };
};