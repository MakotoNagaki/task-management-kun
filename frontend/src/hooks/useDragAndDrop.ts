// ディレクトリ: frontend/src/hooks/useDragAndDrop.ts

import { useState, useCallback, useRef, useMemo } from 'react';
import { Task } from '../types/index';

interface UseDragAndDropOptions {
  onTaskMove?: (taskId: string, newStatus: string, oldStatus: string) => Promise<void>;
  onDragStart?: (task: Task) => void;
  onDragEnd?: (task: Task | null, success: boolean) => void;
  enableVisualFeedback?: boolean;
}

interface UseDragAndDropReturn {
  // ドラッグ状態
  draggedTask: Task | null;
  isDragging: boolean;
  dragOverColumn: string | null;
  
  // ドラッグハンドラー
  handleDragStart: (e: React.DragEvent, task: Task) => void;
  handleDragEnd: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent, status: string) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetStatus: string) => void;
  
  // ドラッグ関連のスタイル・クラス
  getDragCardStyles: (task: Task) => string;
  getDragColumnStyles: (status: string) => string;
  
  // ユーティリティ
  resetDragState: () => void;
  canDropOnStatus: (status: string) => boolean;
}

export const useDragAndDrop = ({
  onTaskMove,
  onDragStart,
  onDragEnd,
  enableVisualFeedback = true
}: UseDragAndDropOptions = {}): UseDragAndDropReturn => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  
  // ドラッグ関連の参照値
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragImage = useRef<HTMLElement | null>(null);
  const dropSuccessful = useRef<boolean>(false);

  // ============================================
  // ドラッグ開始処理
  // ============================================
  
  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    setIsDragging(true);
    setDragStartTime(Date.now());
    dropSuccessful.current = false;
    
    // ドラッグ開始位置を記録
    const rect = e.currentTarget.getBoundingClientRect();
    dragStartPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // ドラッグデータを設定
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.setData('application/json', JSON.stringify({
      taskId: task.id,
      sourceStatus: task.status,
      taskTitle: task.title
    }));
    
    // カスタムドラッグイメージを作成
    if (enableVisualFeedback) {
      createCustomDragImage(e, task);
    }
    
    onDragStart?.(task);
  }, [enableVisualFeedback, onDragStart]);

  // カスタムドラッグイメージの作成
  const createCustomDragImage = useCallback((e: React.DragEvent, task: Task) => {
    const originalElement = e.currentTarget as HTMLElement;
    
    // ドラッグイメージ要素を作成
    const dragImageElement = originalElement.cloneNode(true) as HTMLElement;
    dragImageElement.style.position = 'absolute';
    dragImageElement.style.top = '-1000px';
    dragImageElement.style.left = '-1000px';
    dragImageElement.style.width = `${originalElement.offsetWidth}px`;
    dragImageElement.style.transform = 'rotate(5deg)';
    dragImageElement.style.opacity = '0.8';
    dragImageElement.style.border = '2px solid #3b82f6';
    dragImageElement.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
    dragImageElement.style.zIndex = '9999';
    
    // 優先度に応じてボーダーカラーを変更
    if (task.priority === 'high') {
      dragImageElement.style.borderColor = '#ef4444';
    } else if (task.priority === 'medium') {
      dragImageElement.style.borderColor = '#f59e0b';
    }
    
    document.body.appendChild(dragImageElement);
    dragImage.current = dragImageElement;
    
    // ドラッグイメージとして設定
    e.dataTransfer.setDragImage(
      dragImageElement, 
      dragStartPos.current.x, 
      dragStartPos.current.y
    );
    
    // 少し遅らせてDOMから削除
    setTimeout(() => {
      if (dragImageElement && dragImageElement.parentNode) {
        dragImageElement.parentNode.removeChild(dragImageElement);
      }
      dragImage.current = null;
    }, 100);
  }, []);

  // ============================================
  // ドラッグオーバー処理
  // ============================================
  
  const handleDragOver = useCallback((e: React.DragEvent, status: string) => {
    e.preventDefault();
    
    // ドロップ可能かチェック
    if (draggedTask && canDropOnStatus(status)) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverColumn(status);
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  }, [draggedTask]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // ドロップ領域から完全に出た場合のみクリア
    if (x < rect.left - 10 || x >= rect.right + 10 || 
        y < rect.top - 10 || y >= rect.bottom + 10) {
      setDragOverColumn(null);
    }
  }, []);

  // ============================================
  // ドロップ処理
  // ============================================
  
  const handleDrop = useCallback(async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    try {
      const dragData = e.dataTransfer.getData('application/json');
      const { taskId, sourceStatus } = JSON.parse(dragData);
      
      if (draggedTask && 
          draggedTask.id === taskId && 
          sourceStatus !== targetStatus &&
          canDropOnStatus(targetStatus)) {
        
        dropSuccessful.current = true;
        
        // タスクの移動処理
        if (onTaskMove) {
          await onTaskMove(taskId, targetStatus, sourceStatus);
        }
        
        // ドラッグ時間を記録（UX改善のため）
        const dragDuration = Date.now() - dragStartTime;
        if (dragDuration > 3000) {
          // 3秒以上のドラッグは意図的でない可能性があるため、確認
          console.log(`Long drag detected: ${dragDuration}ms`);
        }
      }
    } catch (err) {
      console.error('ドロップ処理中にエラーが発生:', err);
      dropSuccessful.current = false;
    }
  }, [draggedTask, dragStartTime, onTaskMove]);

  // ============================================
  // ドラッグ終了処理
  // ============================================
  
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const task = draggedTask;
    const success = dropSuccessful.current;
    
    // 状態をリセット
    setDraggedTask(null);
    setIsDragging(false);
    setDragOverColumn(null);
    setDragStartTime(0);
    dropSuccessful.current = false;
    
    // ドラッグイメージをクリーンアップ
    if (dragImage.current && dragImage.current.parentNode) {
      dragImage.current.parentNode.removeChild(dragImage.current);
      dragImage.current = null;
    }
    
    onDragEnd?.(task, success);
  }, [draggedTask, onDragEnd]);

  // ============================================
  // ドロップ可能性チェック
  // ============================================
  
  const canDropOnStatus = useCallback((targetStatus: string): boolean => {
    if (!draggedTask) return false;
    
    const currentStatus = draggedTask.status;
    
    // 同じステータスへの移動は不可
    if (currentStatus === targetStatus) return false;
    
    // ステータス遷移ルール
    const allowedTransitions: Record<string, string[]> = {
      'todo': ['in-progress', 'blocked'],
      'in-progress': ['todo', 'pending-review', 'blocked'],
      'pending-review': ['in-progress', 'done'],
      'done': ['in-progress'], // 完了からの再開は可能
      'blocked': ['todo', 'in-progress']
    };
    
    return allowedTransitions[currentStatus]?.includes(targetStatus) || false;
  }, [draggedTask]);

  // ============================================
  // スタイル計算関数
  // ============================================
  
  const getDragCardStyles = useCallback((task: Task): string => {
    const baseStyles = 'transition-all duration-200 cursor-move';
    
    if (!isDragging || draggedTask?.id !== task.id) {
      return `${baseStyles} hover:shadow-lg hover:scale-[1.02]`;
    }
    
    // ドラッグ中のスタイル
    return `${baseStyles} opacity-60 scale-95 rotate-2 shadow-xl ring-2 ring-blue-400`;
  }, [isDragging, draggedTask]);

  const getDragColumnStyles = useCallback((status: string): string => {
    const baseStyles = 'transition-all duration-200';
    
    if (!isDragging) {
      return baseStyles;
    }
    
    if (dragOverColumn === status) {
      if (canDropOnStatus(status)) {
        return `${baseStyles} ring-2 ring-blue-400 ring-opacity-50 bg-blue-50 scale-[1.02]`;
      } else {
        return `${baseStyles} ring-2 ring-red-400 ring-opacity-50 bg-red-50`;
      }
    }
    
    if (draggedTask && !canDropOnStatus(status)) {
      return `${baseStyles} opacity-60`;
    }
    
    return `${baseStyles} hover:bg-gray-100`;
  }, [isDragging, dragOverColumn, draggedTask, canDropOnStatus]);

  // ============================================
  // ユーティリティ関数
  // ============================================
  
  const resetDragState = useCallback(() => {
    setDraggedTask(null);
    setIsDragging(false);
    setDragOverColumn(null);
    setDragStartTime(0);
    dropSuccessful.current = false;
    
    // ドラッグイメージをクリーンアップ
    if (dragImage.current && dragImage.current.parentNode) {
      dragImage.current.parentNode.removeChild(dragImage.current);
      dragImage.current = null;
    }
  }, []);

  // ============================================
  // デバッグ情報（開発環境用）
  // ============================================
  
  const debugInfo = useMemo(() => ({
    draggedTaskId: draggedTask?.id,
    isDragging,
    dragOverColumn,
    dragDuration: dragStartTime > 0 ? Date.now() - dragStartTime : 0,
    canDrop: dragOverColumn ? canDropOnStatus(dragOverColumn) : false
  }), [draggedTask, isDragging, dragOverColumn, dragStartTime, canDropOnStatus]);

  // 開発環境でのデバッグログ
  if (process.env.NODE_ENV === 'development' && isDragging) {
    console.log('Drag Debug Info:', debugInfo);
  }

  // ============================================
  // 戻り値
  // ============================================
  
  return {
    // ドラッグ状態
    draggedTask,
    isDragging,
    dragOverColumn,
    
    // ドラッグハンドラー
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    
    // スタイル関数
    getDragCardStyles,
    getDragColumnStyles,
    
    // ユーティリティ
    resetDragState,
    canDropOnStatus
  };
};