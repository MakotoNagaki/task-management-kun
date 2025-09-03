// ディレクトリ: frontend/src/components/NotificationSystem.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, Settings, X, Check, Clock, AlertCircle, 
  Volume2, VolumeX, Calendar, ListTodo, Target
} from 'lucide-react';

import {
  Task, TodoItem, User, NotificationSettings, NotificationItem
} from '../types/index';

interface NotificationSystemProps {
  currentUser: User | null;
  tasks: Task[];
  todos: TodoItem[];
  onUpdateSettings?: (settings: NotificationSettings) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  currentUser,
  tasks,
  todos,
  onUpdateSettings
}) => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    taskReminders: true,
    todoReminders: true,
    deadlineAlerts: true,
    statusChangeNotifications: true,
    browserNotifications: true,
    soundEnabled: true
  });

  // ============================================
  // 通知権限とブラウザ通知
  // ============================================
  
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationSettings(prev => ({
        ...prev,
        browserNotifications: permission === 'granted'
      }));
      return permission === 'granted';
    }
    return false;
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string, options?: NotificationOptions) => {
    if (notificationSettings.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, { 
        body, 
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options 
      });
      
      // 通知音再生
      if (notificationSettings.soundEnabled) {
        const audio = new Audio('data:audio/wav;base64,UklGRn4GAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAdyn6/vNdCEDMH/O8dyOpAoQZL7n7aRRHAk8j9n1unMEEGOq5e+OQwwEYKHh8bllNAcmeMjw3o1KDAgyZcnV6ZdcKQklSZ7TIBZGHQZYlOjvp1AWDUI+hcHZvW4RAUr+ZKrfw24UQD5Yj+TylUIZDkt4qOvvnVYfA7Dj3/O3ZSsGI3jH8N6PSRwFOpjWKBdJIgNOmujpjdIZCEJ/rM7vp1AhBDSO5N/tpAkWQ76qJw==');
        audio.play().catch(() => {}); // エラーを無視（ユーザーの操作なしでは再生できない場合がある）
      }
      
      // 5秒後に自動で閉じる
      setTimeout(() => notification.close(), 5000);
      
      return notification;
    }
  }, [notificationSettings]);

  // ============================================
  // リマインダーとアラート機能
  // ============================================
  
  const checkDeadlines = useCallback(() => {
    if (!notificationSettings.deadlineAlerts || !currentUser) return;
    
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // タスクの期限チェック
    tasks.forEach(task => {
      if (!task.dueDate || task.status === 'done' || !task.assigneeIds.includes(currentUser.id)) return;
      
      const dueDate = new Date(task.dueDate);
      
      // 1時間前アラート
      if (dueDate <= oneHourFromNow && dueDate > now) {
        const notification: NotificationItem = {
          id: `deadline_${task.id}_1h`,
          type: 'deadline-alert',
          title: 'タスク期限間近',
          message: `「${task.title}」の期限まで1時間を切りました`,
          targetId: task.id,
          userId: currentUser.id,
          isRead: false,
          createdAt: new Date()
        };
        
        setNotifications(prev => {
          if (!prev.some(n => n.id === notification.id)) {
            showBrowserNotification(notification.title, notification.message, { tag: task.id });
            return [...prev, notification];
          }
          return prev;
        });
      }
      
      // 1日前アラート
      if (dueDate <= oneDayFromNow && dueDate > oneHourFromNow) {
        const notification: NotificationItem = {
          id: `deadline_${task.id}_1d`,
          type: 'deadline-alert',
          title: 'タスク期限1日前',
          message: `「${task.title}」の期限まで1日を切りました`,
          targetId: task.id,
          userId: currentUser.id,
          isRead: false,
          createdAt: new Date()
        };
        
        setNotifications(prev => {
          if (!prev.some(n => n.id === notification.id)) {
            showBrowserNotification(notification.title, notification.message, { tag: task.id });
            return [...prev, notification];
          }
          return prev;
        });
      }
    });
    
    // ToDoの期限チェック
    todos.forEach(todo => {
      if (!todo.dueDate || todo.isCompleted || todo.createdBy !== currentUser.id) return;
      
      const dueDate = new Date(todo.dueDate);
      
      if (dueDate <= oneHourFromNow && dueDate > now) {
        const notification: NotificationItem = {
          id: `todo_deadline_${todo.id}`,
          type: 'todo-reminder',
          title: 'ToDo期限間近',
          message: `「${todo.title}」の期限まで1時間を切りました`,
          targetId: todo.id,
          userId: currentUser.id,
          isRead: false,
          createdAt: new Date()
        };
        
        setNotifications(prev => {
          if (!prev.some(n => n.id === notification.id)) {
            showBrowserNotification(notification.title, notification.message, { tag: todo.id });
            return [...prev, notification];
          }
          return prev;
        });
      }
    });
  }, [tasks, todos, currentUser, notificationSettings, showBrowserNotification]);

  // 定期的な期限チェック（5分間隔）
  useEffect(() => {
    const interval = setInterval(checkDeadlines, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkDeadlines]);

  // 初回期限チェック
  useEffect(() => {
    checkDeadlines();
  }, [checkDeadlines]);

  // ============================================
  // 通知管理関数
  // ============================================
  
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    ));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const updateNotificationSettings = useCallback((newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    onUpdateSettings?.(newSettings);
    
    // ブラウザ通知が有効化された場合、権限を要求
    if (newSettings.browserNotifications && !notificationSettings.browserNotifications) {
      requestNotificationPermission();
    }
  }, [notificationSettings, onUpdateSettings, requestNotificationPermission]);

  // 未読通知数
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ============================================
  // レンダリング
  // ============================================
  
  return (
    <div className="relative">
      {/* 通知ベルアイコン */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知パネル */}
      {showNotifications && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">通知</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                通知はありません
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {notifications.slice().reverse().map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => markNotificationAsRead(notification.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.isRead
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {notification.type === 'deadline-alert' && <AlertCircle className="w-4 h-4 text-red-500" />}
                        {notification.type === 'todo-reminder' && <ListTodo className="w-4 h-4 text-orange-500" />}
                        {notification.type === 'task-reminder' && <Target className="w-4 h-4 text-blue-500" />}
                        {notification.type === 'status-change' && <Check className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </div>
                        <div className={`text-sm ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                          {notification.message}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {notification.createdAt.toLocaleString('ja-JP')}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <button
                onClick={clearAllNotifications}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                すべてクリア
              </button>
            </div>
          )}
        </div>
      )}

      {/* 設定パネル */}
      {showSettings && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">通知設定</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            {/* ブラウザ通知 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">ブラウザ通知</div>
                  <div className="text-sm text-gray-500">デスクトップ通知を表示</div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!notificationSettings.browserNotifications) {
                    requestNotificationPermission();
                  } else {
                    updateNotificationSettings({
                      ...notificationSettings,
                      browserNotifications: false
                    });
                  }
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notificationSettings.browserNotifications ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  notificationSettings.browserNotifications ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* 通知音 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {notificationSettings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-gray-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-500" />
                )}
                <div>
                  <div className="font-medium text-gray-900">通知音</div>
                  <div className="text-sm text-gray-500">通知時に音を再生</div>
                </div>
              </div>
              <button
                onClick={() => updateNotificationSettings({
                  ...notificationSettings,
                  soundEnabled: !notificationSettings.soundEnabled
                })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notificationSettings.soundEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  notificationSettings.soundEnabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* タスクリマインダー */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">タスクリマインダー</div>
                  <div className="text-sm text-gray-500">期限が近いタスクを通知</div>
                </div>
              </div>
              <button
                onClick={() => updateNotificationSettings({
                  ...notificationSettings,
                  taskReminders: !notificationSettings.taskReminders
                })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notificationSettings.taskReminders ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  notificationSettings.taskReminders ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* ToDoリマインダー */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ListTodo className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">ToDoリマインダー</div>
                  <div className="text-sm text-gray-500">ToDoの期限を通知</div>
                </div>
              </div>
              <button
                onClick={() => updateNotificationSettings({
                  ...notificationSettings,
                  todoReminders: !notificationSettings.todoReminders
                })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notificationSettings.todoReminders ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  notificationSettings.todoReminders ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* ステータス変更通知 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">ステータス変更通知</div>
                  <div className="text-sm text-gray-500">タスク更新を通知</div>
                </div>
              </div>
              <button
                onClick={() => updateNotificationSettings({
                  ...notificationSettings,
                  statusChangeNotifications: !notificationSettings.statusChangeNotifications
                })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notificationSettings.statusChangeNotifications ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  notificationSettings.statusChangeNotifications ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* 権限状態表示 */}
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600">
                ブラウザ通知権限: {' '}
                <span className={`font-medium ${
                  'Notification' in window && Notification.permission === 'granted'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {!('Notification' in window) 
                    ? '非対応' 
                    : Notification.permission === 'granted' 
                      ? '許可済み' 
                      : '未許可'
                  }
                </span>
              </div>
              {('Notification' in window && Notification.permission !== 'granted') && (
                <button
                  onClick={requestNotificationPermission}
                  className="mt-2 w-full py-2 px-4 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  通知を許可する
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 緊急通知バナー（期限切れタスク用） */}
      {currentUser && (
        <>
          {tasks.filter(task => 
            task.dueDate && 
            new Date(task.dueDate) < new Date() && 
            task.status !== 'done' && 
            task.assigneeIds.includes(currentUser.id)
          ).length > 0 && (
            <div className="fixed top-4 right-4 max-w-sm bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-40">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-red-900">期限切れタスク</div>
                  <div className="text-sm text-red-700">
                    {tasks.filter(task => 
                      task.dueDate && 
                      new Date(task.dueDate) < new Date() && 
                      task.status !== 'done' && 
                      task.assigneeIds.includes(currentUser.id)
                    ).length}件のタスクが期限切れです
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationSystem;