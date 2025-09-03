// ディレクトリ: frontend/src/components/TaskDetailModal.tsx

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  X, Edit3, Save, Calendar, Clock, Users, User, Tag, 
  Link, Paperclip, MessageSquare, History, CheckCircle,
  AlertCircle, RotateCcw, Play, Pause, Archive,
  ExternalLink, Copy, Star, Trash2, UserCheck,
  Eye, ChevronDown, ChevronRight, FileText
} from 'lucide-react';

import { 
  Task, User as UserType, Team, RelatedLink,
  TASK_STATUSES, PRIORITY_LEVELS 
} from '../types/index';
import { dateUtils, taskUtils, validationUtils } from '../utils/index';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onStatusChange: (taskId: string, newStatus: string, comment?: string) => Promise<void>;
  currentUser: UserType | null;
  teams: Team[];
  users: UserType[];
  relatedTasks?: Task[];
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onStatusChange,
  currentUser,
  teams,
  users,
  relatedTasks = []
}) => {
  // ============================================
  // 状態管理
  // ============================================
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'history' | 'related'>('details');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // 編集フォーム状態
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    dueDate: '',
    tags: [] as string[],
    assigneeIds: [] as string[],
  });
  
  // コメント機能（将来実装用）
  const [newComment, setNewComment] = useState('');
  const [comments] = useState<Array<{
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: Date;
  }>>([]);

  // 関連リンク管理
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '', type: 'external' as RelatedLink['type'] });

  // ============================================
  // 初期化とデータ設定
  // ============================================
  
  useEffect(() => {
    if (task && isOpen) {
      setEditForm({
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 16) : '',
        tags: [...task.tags],
        assigneeIds: [...task.assigneeIds],
      });
      setIsEditing(false);
      setActiveTab('details');
    }
  }, [task, isOpen]);

  // ============================================
  // 計算済みデータ
  // ============================================
  
  // 期限情報
  const dueDateInfo = useMemo(() => {
    if (!task?.dueDate) return null;
    return dateUtils.getDueDateUrgency(task.dueDate);
  }, [task?.dueDate]);

  // 担当者情報
  const assignees = useMemo(() => {
    if (!task) return [];
    return users.filter(user => task.assigneeIds.includes(user.id));
  }, [task, users]);

  // チーム情報
  const team = useMemo(() => {
    if (!task?.teamId) return null;
    return teams.find(t => t.id === task.teamId) || null;
  }, [task?.teamId, teams]);

  // ユーザーの権限チェック
  const canEdit = useMemo(() => {
    if (!task || !currentUser) return false;
    
    // 管理者は全て編集可能
    if (currentUser.role === 'admin') return true;
    
    // 作成者または担当者は編集可能