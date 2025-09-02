// frontend/src/components/SlackIntegration.tsx
import React, { useState, useCallback } from 'react';
import { 
  MessageSquare, Plus, Bell, Clock, User, Users, 
  Hash, Calendar, Send, ExternalLink, Settings,
  CheckCircle, AlertCircle, Info, Zap, Target,
  Link, Copy, Check, X
} from 'lucide-react';

// 型定義
interface SlackMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  channel: string;
  channelName: string;
  text: string;
  timestamp: Date;
  permalink: string;
  threadTs?: string;
  isThread: boolean;
}

interface SlackTask {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  assigneeSlackId: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  sourceMessage: SlackMessage;
  reminderSent: boolean;
  createdAt: Date;
}

interface SlackUser {
  id: string;
  slackId: string;
  name: string;
  displayName: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  timezone: string;
}

// デモデータ
const DEMO_SLACK_MESSAGES: SlackMessage[] = [
  {
    id: 'msg001',
    userId: 'user001',
    userName: '田中太郎',
    userAvatar: 'https://via.placeholder.com/32',
    channel: 'C1234567890',
    channelName: 'general',
    text: '来週のプロジェクト会議の資料準備をお願いします。資料のアウトラインを金曜日までに作成してください。',
    timestamp: new Date('2025-09-01T10:30:00'),
    permalink: 'https://company.slack.com/archives/C1234567890/p1725174600000100',
    isThread: false
  },
  {
    id: 'msg002',
    userId: 'user002',
    userName: '佐藤花子',
    userAvatar: 'https://via.placeholder.com/32',
    channel: 'C2345678901',
    channelName: 'dev-team',
    text: 'API仕様書のレビューをお願いします。変更点について議論したいです。',
    timestamp: new Date('2025-09-01T14:15:00'),
    permalink: 'https://company.slack.com/archives/C2345678901/p1725188100000200',
    isThread: false
  }
];

const DEMO_SLACK_USERS: SlackUser[] = [
  {
    id: 'user001',
    slackId: 'U01234567',
    name: '田中太郎',
    displayName: 'tanaka',
    email: 'tanaka@company.com',
    avatar: 'https://via.placeholder.com/40',
    isActive: true,
    timezone: 'Asia/Tokyo'
  },
  {
    id: 'user002',
    slackId: 'U02345678',
    name: '佐藤花子',
    displayName: 'sato.hanako',
    email: 'sato@company.com',
    avatar: 'https://via.placeholder.com/40',
    isActive: true,
    timezone: 'Asia/Tokyo'
  }
];

const SlackIntegration: React.FC = () => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [activeView, setActiveView] = useState<'messages' | 'tasks' | 'settings'>('messages');
  const [slackMessages] = useState<SlackMessage[]>(DEMO_SLACK_MESSAGES);
  const [slackUsers] = useState<SlackUser[]>(DEMO_SLACK_USERS);
  const [slackTasks, setSlackTasks] = useState<SlackTask[]>([]);
  
  // タスク作成フォーム
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<SlackMessage | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: [] as string[]
  });

  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // ============================================
  // タスク作成処理
  // ============================================
  
  const openTaskForm = useCallback((message: SlackMessage) => {
    setSelectedMessage(message);
    setTaskForm({
      title: message.text.length > 50 ? message.text.substring(0, 50) + '...' : message.text,
      description: message.text,
      assigneeId: '',
      dueDate: '',
      priority: 'medium',
      tags: []
    });
    setShowTaskForm(true);
  }, []);

  const createTaskFromMessage = useCallback(() => {
    if (!selectedMessage || !taskForm.title || !taskForm.assigneeId) {
      window.alert('必須項目を入力してください');
      return;
    }

    const assignee = slackUsers.find(u => u.id === taskForm.assigneeId);
    if (!assignee) {
      window.alert('担当者が見つかりません');
      return;
    }

    const newTask: SlackTask = {
      id: `task_${Date.now()}`,
      title: taskForm.title,
      description: taskForm.description,
      assigneeId: taskForm.assigneeId,
      assigneeName: assignee.name,
      assigneeSlackId: assignee.slackId,
      dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : undefined,
      priority: taskForm.priority,
      tags: taskForm.tags,
      sourceMessage: selectedMessage,
      reminderSent: false,
      createdAt: new Date()
    };

    setSlackTasks(prev => [...prev, newTask]);
    setShowTaskForm(false);
    setSelectedMessage(null);
    
    window.alert(`タスクを作成しました。${assignee.name}さんにSlackで通知されます。`);
  }, [selectedMessage, taskForm, slackUsers]);

  const sendTaskReminder = useCallback((taskId: string) => {
    const task = slackTasks.find(t => t.id === taskId);
    if (!task) return;

    setSlackTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, reminderSent: true } : t
    ));

    window.alert(`${task.assigneeName}さんにSlackでリマインダーを送信しました:\n「${task.title}」の期限が近づいています。`);
  }, [slackTasks]);

  const copyPermalink = useCallback((permalink: string) => {
    navigator.clipboard.writeText(permalink);
    setCopiedLink(permalink);
    setTimeout(() => setCopiedLink(null), 2000);
  }, []);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // ============================================
  // レンダリング
  // ============================================
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Slack連携</h1>
          </div>
          <p className="text-gray-600">Slackメッセージからタスクを作成し、リマインダーを送信</p>
        </div>

        {/* ナビゲーション */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveView('messages')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeView === 'messages'
                  ? 'border-purple-500 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Slackメッセージ
              </div>
            </button>
            
            <button
              onClick={() => setActiveView('tasks')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeView === 'tasks'
                  ? 'border-purple-500 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                作成済みタスク
                {slackTasks.length > 0 && (
                  <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                    {slackTasks.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Slackメッセージ一覧 */}
        {activeView === 'messages' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">最近のSlackメッセージ</h2>
              <p className="text-sm text-gray-600 mb-6">
                メッセージをクリックしてタスクに変換できます。実際のSlackではマウスオーバーでアクションメニューが表示されます。
              </p>
              
              <div className="space-y-4">
                {slackMessages.map(message => (
                  <div key={message.id} className="group border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">{message.userName}</span>
                          <span className="text-sm text-gray-500">#{message.channelName}</span>
                          <span className="text-sm text-gray-500">{formatDate(message.timestamp)}</span>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{message.text}</p>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openTaskForm(message)}
                            className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            タスク作成
                          </button>
                          
                          <button
                            onClick={() => copyPermalink(message.permalink)}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1"
                          >
                            {copiedLink === message.permalink ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {copiedLink === message.permalink ? 'コピー済み' : 'リンクコピー'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 作成済みタスク一覧 */}
        {activeView === 'tasks' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Slackから作成されたタスク</h2>
              
              {slackTasks.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">まだタスクが作成されていません</p>
                  <p className="text-sm text-gray-500 mt-1">Slackメッセージからタスクを作成してみましょう</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {slackTasks.map(task => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">{task.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              担当: {task.assigneeName}
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                期限: {formatDate(task.dueDate)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!task.reminderSent && task.dueDate && (
                            <button
                              onClick={() => sendTaskReminder(task.id)}
                              className="px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors flex items-center gap-1"
                            >
                              <Bell className="w-3 h-3" />
                              リマインダー送信
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {task.reminderSent && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <CheckCircle className="w-4 h-4" />
                            リマインダー送信済み
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* タスク作成フォーム（モーダル） */}
        {showTaskForm && selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Slackメッセージからタスク作成</h2>
                  <button
                    onClick={() => setShowTaskForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 元メッセージ表示 */}
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900">元のSlackメッセージ</span>
                    <span className="text-sm text-gray-500">#{selectedMessage.channelName}</span>
                  </div>
                  <p className="text-sm text-gray-700">{selectedMessage.text}</p>
                </div>

                {/* タスクフォーム */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">タスクタイトル</label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="タスクのタイトル"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">担当者</label>
                    <select
                      value={taskForm.assigneeId}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, assigneeId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">担当者を選択</option>
                      {slackUsers.filter(u => u.isActive).map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} (@{user.displayName})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">期限</label>
                    <input
                      type="datetime-local"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">優先度</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setShowTaskForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={createTaskFromMessage}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    タスク作成 & Slack通知
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 統計情報 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Slack連携統計</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">{slackMessages.length}</div>
              <div className="text-sm text-purple-700">メッセージ</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{slackTasks.length}</div>
              <div className="text-sm text-blue-700">作成タスク</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{slackUsers.length}</div>
              <div className="text-sm text-green-700">連携ユーザー</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">
                {slackTasks.filter(t => t.reminderSent).length}
              </div>
              <div className="text-sm text-orange-700">送信済みリマインダー</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlackIntegration;