import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Edit3, User, Calendar, Tag, Info, Save, XCircle } from 'lucide-react';
import './styles/globals.css';

// 型定義をインポート
import type { Task, TaskList, DraggedCard } from './types';

/**
 * タスク管理くん - メインアプリケーションコンポーネント
 */
const App: React.FC = () => {
  // ============================================
  // 状態管理
  // ============================================
  
  // タスクリストの初期データ
  const [lists, setLists] = useState<TaskList[]>([
    {
      id: '1',
      title: 'To Do',
      color: 'list-todo',
      cards: [
        {
          id: '1',
          title: 'プロジェクト企画書の作成',
          description: '新規プロジェクトの企画書を作成し、ステークホルダーに共有する',
          assignee: '田中さん',
          dueDate: '2024-09-15',
          tags: ['企画', '高優先度', 'ドキュメント']
        },
        {
          id: '2',
          title: 'データベース設計',
          description: 'タスク管理システムのデータベース構造を設計し、ER図を作成する',
          assignee: '佐藤さん',
          dueDate: '2024-09-20',
          tags: ['開発', 'DB', '設計']
        }
      ]
    },
    {
      id: '2',
      title: 'In Progress',
      color: 'list-progress',
      cards: [
        {
          id: '3',
          title: 'API仕様書の作成',
          description: 'RESTful APIの詳細仕様書を作成中。認証、CRUD操作、エラーハンドリングを含む',
          assignee: '鈴木さん',
          dueDate: '2024-09-18',
          tags: ['開発', 'API', 'ドキュメント']
        }
      ]
    },
    {
      id: '3',
      title: 'Done',
      color: 'list-done',
      cards: [
        {
          id: '4',
          title: 'アプリ名の決定',
          description: '「タスク管理くん」に正式決定！チーム全員の合意を得られました。',
          assignee: 'プロジェクトチーム',
          dueDate: '2024-09-01',
          tags: ['企画', '完了']
        }
      ]
    }
  ]);

  // ドラッグ&ドロップ関連の状態
  const [draggedCard, setDraggedCard] = useState<DraggedCard | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const dragCounter = useRef<number>(0);

  // フォーム関連の状態
  const [isAddingCard, setIsAddingCard] = useState<Record<string, boolean>>({});
  const [newCardTitle, setNewCardTitle] = useState<string>('');
  const [newCardDescription, setNewCardDescription] = useState<string>('');
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [editedDescription, setEditedDescription] = useState<string>('');

  // ============================================
  // ドラッグ&ドロップ機能
  // ============================================

  const handleDragStart = (e: React.DragEvent, card: Task, sourceListId: string) => {
    const dragData: DraggedCard = { ...card, sourceListId };
    setDraggedCard(dragData);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Firefox対応
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, listId: string) => {
    e.preventDefault();
    dragCounter.current++;
    setDraggedOver(listId);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDraggedOver(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetListId: string) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDraggedOver(null);

    if (!draggedCard || draggedCard.sourceListId === targetListId) {
      setDraggedCard(null);
      return;
    }

    // タスクを移動
    setLists(prevLists => {
      return prevLists.map(list => {
        // 元のリストからカードを削除
        if (list.id === draggedCard.sourceListId) {
          return {
            ...list,
            cards: list.cards.filter(card => card.id !== draggedCard.id)
          };
        }
        // 新しいリストにカードを追加
        if (list.id === targetListId) {
          const { sourceListId, ...cardWithoutSource } = draggedCard;
          return {
            ...list,
            cards: [...list.cards, cardWithoutSource]
          };
        }
        return list;
      });
    });

    setDraggedCard(null);
  };

  // ============================================
  // タスク管理機能
  // ============================================

  const addCard = (listId: string) => {
    if (!newCardTitle.trim()) return;

    const newCard: Task = {
      id: `task_${Date.now()}`,
      title: newCardTitle.trim(),
      description: newCardDescription.trim(),
      assignee: '',
      dueDate: '',
      tags: [],
      createdAt: new Date()
    };

    setLists(prevLists => 
      prevLists.map(list => 
        list.id === listId 
          ? { ...list, cards: [...list.cards, newCard] }
          : list
      )
    );

    // フォームをリセット
    setNewCardTitle('');
    setNewCardDescription('');
    setIsAddingCard(prev => ({ ...prev, [listId]: false }));
  };

  const deleteCard = (listId: string, cardId: string) => {
    if (!window.confirm('このタスクを削除しますか？')) return;

    setLists(prevLists => 
      prevLists.map(list => 
        list.id === listId 
          ? { ...list, cards: list.cards.filter(card => card.id !== cardId) }
          : list
      )
    );
  };

  const startEdit = (card: Task) => {
    setEditingCard(card.id);
    setEditedTitle(card.title);
    setEditedDescription(card.description || '');
  };

  const saveEdit = (listId: string, cardId: string) => {
    if (!editedTitle.trim()) return;

    setLists(prevLists => 
      prevLists.map(list => 
        list.id === listId 
          ? { 
              ...list, 
              cards: list.cards.map(card => 
                card.id === cardId 
                  ? { 
                      ...card, 
                      title: editedTitle.trim(),
                      description: editedDescription.trim(),
                      updatedAt: new Date()
                    } 
                  : card
              )
            }
          : list
      )
    );

    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setEditedTitle('');
    setEditedDescription('');
  };

  const cancelAddCard = (listId: string) => {
    setIsAddingCard(prev => ({ ...prev, [listId]: false }));
    setNewCardTitle('');
    setNewCardDescription('');
  };

  // ============================================
  // キーボードショートカット
  // ============================================
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESCキーで編集をキャンセル
      if (e.key === 'Escape') {
        if (editingCard) {
          cancelEdit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingCard]);

  // ============================================
  // ユーティリティ関数
  // ============================================

  const getTotalTasks = () => {
    return lists.reduce((total, list) => total + list.cards.length, 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  // ============================================
  // レンダリング
  // ============================================

  return (
    <div>
      {/* ヘッダー */}
      <header className="header">
        <div className="header-container">
          <div className="header-left">
            <div className="app-icon">
              <Tag size={28} />
            </div>
            <h1 className="app-title">タスク管理くん</h1>
            <span className="version-badge">v1.0</span>
            <div className="status-badge">
              <Info size={12} />
              <span>ネイティブD&D実装</span>
            </div>
          </div>
          <div className="header-subtitle">
            社内タスク管理システム | 総タスク数: {getTotalTasks()}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="main-container">
        <div className="kanban-board">
          {lists.map(list => (
            <div
              key={list.id}
              className={`list-container ${list.color} ${
                draggedOver === list.id ? 'drag-over' : ''
              }`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, list.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, list.id)}
            >
              {/* リストヘッダー */}
              <div className="list-header">
                <h2 className="list-title">{list.title}</h2>
                <div className="list-actions">
                  <span className="task-count">{list.cards.length}</span>
                  <button
                    onClick={() => setIsAddingCard(prev => ({ ...prev, [list.id]: true }))}
                    className="add-button"
                    title={`${list.title}に新しいタスクを追加`}
                    disabled={isAddingCard[list.id]}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* タスクリスト */}
              <div className="tasks-container">
                {list.cards.map((card, index) => (
                  <div
                    key={card.id}
                    draggable={editingCard !== card.id}
                    onDragStart={(e) => handleDragStart(e, card, list.id)}
                    className={`task-card ${
                      draggedCard && draggedCard.id === card.id ? 'dragging' : ''
                    } ${editingCard === card.id ? 'editing' : ''}`}
                  >
                    {editingCard === card.id ? (
                      // 編集モード
                      <div className="form-group">
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="form-input"
                          placeholder="タスク名"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              saveEdit(list.id, card.id);
                            } else if (e.key === 'Escape') {
                              cancelEdit();
                            }
                          }}
                        />
                        <textarea
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          className="form-textarea"
                          placeholder="詳細説明"
                        />
                        <div className="form-actions">
                          <button
                            onClick={cancelEdit}
                            className="btn btn-secondary"
                            type="button"
                          >
                            <XCircle size={16} />
                            キャンセル
                          </button>
                          <button
                            onClick={() => saveEdit(list.id, card.id)}
                            className="btn btn-primary"
                            type="button"
                            disabled={!editedTitle.trim()}
                          >
                            <Save size={16} />
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 表示モード
                      <>
                        <div className="task-header">
                          <h3 className="task-title">{card.title}</h3>
                          <div className="task-actions">
                            <button
                              onClick={() => startEdit(card)}
                              className="icon-button"
                              title="タスクを編集"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => deleteCard(list.id, card.id)}
                              className="icon-button danger"
                              title="タスクを削除"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {card.description && (
                          <p className="task-description">{card.description}</p>
                        )}

                        <div className="task-meta">
                          {card.assignee && (
                            <div className="task-assignee">
                              <User size={14} />
                              <span>{card.assignee}</span>
                            </div>
                          )}
                          
                          {card.dueDate && (
                            <div className="task-due-date">
                              <Calendar size={14} />
                              <span>{formatDate(card.dueDate)}</span>
                            </div>
                          )}
                          
                          {card.tags.length > 0 && (
                            <div className="task-tags">
                              {card.tags.map((tag, tagIndex) => (
                                <span key={tagIndex} className="tag">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* タスク追加フォーム */}
                {isAddingCard[list.id] && (
                  <div className="form-container">
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="タスク名を入力..."
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        className="form-input"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            addCard(list.id);
                          } else if (e.key === 'Escape') {
                            cancelAddCard(list.id);
                          }
                        }}
                      />
                      <textarea
                        placeholder="詳細説明（オプション）"
                        value={newCardDescription}
                        onChange={(e) => setNewCardDescription(e.target.value)}
                        className="form-textarea"
                      />
                      <div className="form-actions">
                        <button
                          onClick={() => cancelAddCard(list.id)}
                          className="btn btn-secondary"
                          type="button"
                        >
                          <XCircle size={16} />
                          キャンセル
                        </button>
                        <button
                          onClick={() => addCard(list.id)}
                          className="btn btn-primary"
                          type="button"
                          disabled={!newCardTitle.trim()}
                        >
                          <Plus size={16} />
                          追加
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 空の状態 */}
                {list.cards.length === 0 && !isAddingCard[list.id] && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem 1rem',
                    color: '#9ca3af',
                    fontSize: '0.875rem',
                    fontStyle: 'italic'
                  }}>
                    タスクがありません
                    <br />
                    ＋ボタンでタスクを追加しましょう
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* フッター */}
      <footer className="footer">
        <div className="footer-container">
          <strong>タスク管理くん</strong> - 社内タスク管理システム | 
          プロトタイプ版 v1.0 | 
          作成日: {new Date().toLocaleDateString('ja-JP')}
        </div>
      </footer>
    </div>
  );
};

export default App;