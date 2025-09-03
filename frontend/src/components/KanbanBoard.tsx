// ディレクトリ: frontend/src/components/KanbanBoard.tsx

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
  Plus, Edit3, Trash2, Eye, Calendar, Clock, Users,
  Tag, MoreVertical, AlertCircle, CheckCircle, User,
  ArrowRight, MessageSquare, Paperclip, Star,
  RotateCcw, Check, UserCheck, XCircle, Play
} from 'lucide-react';

import {
  Task, User as UserType, TaskFilter, TASK_STATUSES, PRIORITY_LEVELS
} from '../types/index';

interface KanbanBoardProps {
  currentUser: UserType | null;
  tasks: Task[];
  filter: TaskFilter;
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onShowTaskDetail: (task: Task) => void;
  onNotification?: (title: string, message: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  currentUser,
  tasks,
  filter,
  onTaskUpdate,
  onTaskDelete,
  onShowTaskDetail,
  onNotification
}) => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ============================================
  // データ処理
  // ============================================
  
  // フィルター済みタスクの計算
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // スコープフィルター
      if (filter.scope === 'personal' && !task.assigneeIds.includes(currentUser?.id || '')) return false;
      if (filter.scope === 'team' && task.assigneeType !== 'team') return false;
      if (filter.scope === 'company' && task.assigneeType !== 'company') return false;
      
      // ステータスフィルター
      if (filter.status.length > 0 && !filter.status.includes(task.status)) return false;
      
      // 検索フィルター
      if (filter.searchTerm && !task.title.toLowerCase().includes(filter.searchTerm.toLowerCase())) return false;
      
      // タグフィルター
      if (filter.tags.length > 0 && !filter.tags.some(tag => task.tags.includes(tag))) return false;
      
      // 優先度フィルター
      if (filter.priority.length > 0 && !filter.priority.includes(task.priority)) return false;
      
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
          // 期限でソート（近い順）
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          // 作成日でソート（新しい順）
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    });
    return grouped;
  }, [filteredTasks]);

  // ============================================
  // ドラッグ＆ドロップ処理
  // ============================================
  
  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    setIsDragging(true);
    
    // ドラッグ開始位置を記録
    const rect = e.currentTarget.getBoundingClientRect();
    dragStartPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // ドラッグ時の透明度を設定
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    
    // カスタムドラッグイメージを設定
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, dragStartPos.current.x, dragStartPos.current.y);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // ドロップ領域から完全に出た場合のみクリア
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverColumn(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    setIsDragging(false);
    
    if (draggedTask && draggedTask.status !== targetStatus) {
      const updatedTask: Task = { 
        ...draggedTask, 
        status: targetStatus as Task['status'],
        updatedAt: new Date()
      };
      
      // ステータス変更時の特別な処理
      switch (targetStatus) {
        case 'in-progress':
          // 待機中→進行中: 開始時刻を記録
          if (draggedTask.status === 'todo') {
            // 特別な処理は不要（基本の更新のみ）
          }
          // 確認待ち→進行中: 差し戻し処理
          if (draggedTask.status === 'pending-review') {
            updatedTask.reviewComment = '修正のため差し戻されました';
            updatedTask.reviewedBy = currentUser?.id;
          }
          break;
          
        case 'pending-review':
          // 進行中→確認待ち: 完了者を記録
          if (draggedTask.status === 'in-progress') {
            updatedTask.completedBy = currentUser?.id;
            updatedTask.reviewComment = '確認をお願いします';
          }
          break;
          
        case 'done':
          // 確認待ち→完了: 承認者を記録
          if (draggedTask.status === 'pending-review') {
            updatedTask.reviewedBy = currentUser?.id;
            updatedTask.reviewComment = '承認完了';
          }
          break;
          
        case 'blocked':
          // ブロック状態への移行
          const reason = prompt('ブロックの理由を入力してください');
          if (reason) {
            updatedTask.reviewComment = `ブロック理由: ${reason}`;
          }
          break;
      }
      
      onTaskUpdate(updatedTask);
      
      // 通知表示
      const statusName = TASK_STATUSES.find(s => s.id === targetStatus)?.name;
      onNotification?.(
        'タスクステータス更新', 
        `「${draggedTask.title}」を「${statusName}」に移動しました`
      );
    }
    
    setDraggedTask(null);
  }, [draggedTask, currentUser, onTaskUpdate, onNotification]);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverColumn(null);
    setIsDragging(false);
  }, []);

  // ============================================
  // タスク操作関数
  // ============================================
  
  const handleTaskStatusChange = useCallback((task: Task, newStatus: string, comment?: string) => {
    const updatedTask: Task = {
      ...task,
      status: newStatus as Task['status'],
      updatedAt: new Date()
    };
    
    if (newStatus === 'pending-review' && task.status === 'in-progress') {
      updatedTask.completedBy = currentUser?.id;
      updatedTask.reviewComment = comment || '確認をお願いします';
    }
    
    if (newStatus === 'done' && task.status === 'pending-review') {
      updatedTask.reviewedBy = currentUser?.id;
    }
    
    onTaskUpdate(updatedTask);
    
    const statusName = TASK_STATUSES.find(s => s.id === newStatus)?.name;
    onNotification?.(
      'ステータス変更', 
      `「${task.title}」を「${statusName}」に変更しました`
    );
  }, [currentUser, onTaskUpdate, onNotification]);

  // ============================================
  // ユーティリティ関数
  // ============================================
  
  const getDueDateInfo = (dueDate?: Date) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const diff = new Date(dueDate).getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    const days = diff / (1000 * 60 * 60 * 24);
    
    if (hours < 0) {
      return { 
        text: '期限切れ', 
        color: 'text-red-600', 
        bgColor: 'bg-red-100',
        urgent: true 
      };
    } else if (hours < 2) {
      return { 
        text: '期限間近', 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-100',
        urgent: true 
      };
    } else if (days < 1) {
      return { 
        text: '今日', 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-100',
        urgent: false 
      };
    } else if (days < 2) {
      return { 
        text: '明日', 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-100',
        urgent: false 
      };
    } else {
      return { 
        text: new Date(dueDate).toLocaleDateString('ja-JP'), 
        color: 'text-gray-600', 
        bgColor: 'bg-gray-100',
        urgent: false 
      };
    }
  };

  // ============================================
  // タスクカードレンダリング
  // ============================================
  
  const renderTaskCard = (task: Task) => {
    const dueDateInfo = getDueDateInfo(task.dueDate);
    const isMyTask = task.assigneeIds.includes(currentUser?.id || '');
    const canReview = task.status === 'pending-review' && task.completedBy !== currentUser?.id;
    
    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
        onClick={() => onShowTaskDetail(task)}
        className={`group relative p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
          isDragging && draggedTask?.id === task.id 
            ? 'opacity-50 scale-95 rotate-2' 
            : 'hover:shadow-md'
        } ${
          task.priority === 'high' 
            ? 'border-l-4 border-l-red-400 bg-white hover:border-red-300' 
            : task.priority === 'medium'
            ? 'border-l-4 border-l-yellow-400 bg-white hover:border-yellow-300'
            : 'border-gray-200 bg-white hover:border-blue-300'
        } ${
          isMyTask ? 'ring-1 ring-blue-100' : ''
        }`}
      >
        {/* 緊急マーク */}
        {dueDateInfo?.urgent && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <AlertCircle className="w-3 h-3 text-white" />
          </div>
        )}
        
        <div className="space-y-3">
          {/* ヘッダー: タイトルと優先度 */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-gray-900 flex-1 group-hover:text-blue-700 transition-colors leading-tight">
              {task.title}
            </h4>
            <div className="flex items-center gap-1">
              {/* 自分のタスクマーク */}
              {isMyTask && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" title="自分のタスク" />
              )}
              
              {/* 優先度バッジ */}
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {PRIORITY_LEVELS.find(p => p.id === task.priority)?.name}
              </span>
            </div>
          </div>

          {/* 説明 */}
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {task.description}
          </p>

          {/* 担当者情報 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {task.assigneeType === 'team' ? (
                <Users className="w-4 h-4 text-gray-400" />
              ) : task.assigneeIds.length > 1 ? (
                <Users className="w-4 h-4 text-gray-400" />
              ) : (
                <User className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-700 truncate max-w-32">
                {task.assigneeNames.slice(0, 2).join(', ')}
                {task.assigneeNames.length > 2 && ` +${task.assigneeNames.length - 2}`}
              </span>
            </div>
            
            {task.teamName && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {task.teamName}
              </span>
            )}
          </div>

          {/* 期限情報 */}
          {dueDateInfo && (
            <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${dueDateInfo.bgColor}`}>
              <Calendar className={`w-4 h-4 ${dueDateInfo.color}`} />
              <span className={`text-sm font-medium ${dueDateInfo.color}`}>
                {dueDateInfo.text}
              </span>
            </div>
          )}

          {/* タグ */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200">
                  #{tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* ステータス固有の情報と操作 */}
          {task.status === 'pending-review' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">確認待ち</span>
              </div>
              
              {task.reviewComment && (
                <p className="text-sm text-orange-700 mb-3">{task.reviewComment}</p>
              )}
              
              {canReview && (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskStatusChange(task, 'done');
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    承認
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const comment = prompt('差し戻し理由を入力してください');
                      if (comment !== null) {
                        handleTaskStatusChange(task, 'in-progress', comment);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    差し戻し
                  </button>
                </div>
              )}
              
              {task.completedBy === currentUser?.id && !canReview && (
                <div className="text-xs text-orange-600">
                  あなたが完了したタスクです
                </div>
              )}
            </div>
          )}

          {/* 進行中タスクの完了ボタン */}
          {task.status === 'in-progress' && isMyTask && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTaskStatusChange(task, 'pending-review');
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              完了（確認待ちへ）
            </button>
          )}
          
          {/* ブロックタスクの再開ボタン */}
          {task.status === 'blocked' && isMyTask && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTaskStatusChange(task, 'in-progress');
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Play className="w-4 h-4" />
              作業を再開
            </button>
          )}

          {/* 関連リンク */}
          {task.relatedLinks.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">{task.relatedLinks.length}件のリンク</span>
            </div>
          )}

          {/* フッター: 作成者と更新日時 */}
          <div className="text-xs text-gray-400 border-t border-gray-100 pt-2 flex justify-between items-center">
            <span>作成: {task.createdByName}</span>
            <span>{new Date(task.updatedAt).toLocaleDateString('ja-JP')}</span>
          </div>
        </div>

        {/* ホバー時のクイックアクション */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // クイック編集などのアクション
            }}
            className="p-1 bg-white shadow-md rounded text-gray-400 hover:text-gray-600 border"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  // ============================================
  // カラムレンダリング
  // ============================================
  
  const renderColumn = (status: typeof TASK_STATUSES[0]) => {
    const columnTasks = tasksByStatus[status.id] || [];
    const isDropTarget = dragOverColumn === status.id;
    
    return (
      <div 
        key={status.id}
        className={`bg-gray-50 rounded-xl transition-all duration-200 ${
          isDropTarget ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50' : ''
        }`}
        onDragOver={(e) => handleDragOver(e, status.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, status.id)}
      >
        {/* カラムヘッダー */}
        <div className={`p-4 ${status.color} rounded-t-xl border-b`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${status.textColor} flex items-center gap-2`}>
                {/* ステータスアイコン */}
                {status.id === 'todo' && <Clock className="w-4 h-4" />}
                {status.id === 'in-progress' && <Play className="w-4 h-4" />}
                {status.id === 'pending-review' && <Eye className="w-4 h-4" />}
                {status.id === 'done' && <CheckCircle className="w-4 h-4" />}
                {status.id === 'blocked' && <XCircle className="w-4 h-4" />}
                
                <span>{status.name}</span>
              </h3>
              <p className="text-xs mt-1 opacity-75">{status.description}</p>
            </div>
            
            <div className="text-right">
              <div className="text-sm bg-white bg-opacity-70 px-3 py-1 rounded-full font-medium">
                {columnTasks.length}
              </div>
              
              {/* 優先度別の内訳 */}
              {columnTasks.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {['high', 'medium', 'low'].map(priority => {
                    const count = columnTasks.filter(t => t.priority === priority).length;
                    if (count === 0) return null;
                    return (
                      <span 
                        key={priority}
                        className={`text-xs px-1 py-0.5 rounded ${
                          priority === 'high' ? 'bg-red-200 text-red-800' :
                          priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-green-200 text-green-800'
                        }`}
                      >
                        {count}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* カラムコンテンツ */}
        <div className="p-3 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
          {columnTasks.length === 0 ? (
            <div className={`text-center py-8 text-gray-400 ${
              isDropTarget ? 'bg-blue-100 rounded-lg border-2 border-dashed border-blue-300' : ''
            }`}>
              {isDropTarget ? (
                <div className="flex flex-col items-center gap-2">
                  <ArrowRight className="w-6 h-6 text-blue-500" />
                  <span className="text-blue-700 font-medium">ここにドロップ</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {status.id === 'todo' && <Clock className="w-4 h-4" />}
                    {status.id === 'in-progress' && <Play className="w-4 h-4" />}
                    {status.id === 'pending-review' && <Eye className="w-4 h-4" />}
                    {status.id === 'done' && <CheckCircle className="w-4 h-4" />}
                    {status.id === 'blocked' && <XCircle className="w-4 h-4" />}
                  </div>
                  <span className="text-sm">タスクなし</span>
                </div>
              )}
            </div>
          ) : (
            columnTasks.map(renderTaskCard)
          )}
          
          {/* ドロップゾーン表示（タスクがある場合） */}
          {isDropTarget && columnTasks.length > 0 && (
            <div className="p-4 bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg text-center">
              <ArrowRight className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <span className="text-sm text-blue-700 font-medium">ここにドロップ</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // メインレンダリング
  // ============================================
  
  return (
    <div className="space-y-4">
      {/* カンバンボード統計 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {TASK_STATUSES.map(status => {
          const count = tasksByStatus[status.id]?.length || 0;
          const myTasksCount = tasksByStatus[status.id]?.filter(t => t.assigneeIds.includes(currentUser?.id || '')).length || 0;
          
          return (
            <div key={status.id} className="bg-white rounded-lg border p-4">
              <div className={`w-3 h-3 rounded-full ${status.color} mb-2`} />
              <div className="text-sm text-gray-600">{status.name}</div>
              <div className="text-xl font-bold text-gray-900">{count}</div>
              {myTasksCount > 0 && (
                <div className="text-xs text-blue-600">自分: {myTasksCount}件</div>
              )}
            </div>
          );
        })}
      </div>

      {/* カンバンボード */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {TASK_STATUSES.map(renderColumn)}
      </div>

      {/* ドラッグ中の視覚的フィードバック */}
      {isDragging && draggedTask && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 pointer-events-none">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm font-medium">
              「{draggedTask.title}」を移動中...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;