import React, { useState, useRef } from 'react';
import { Plus, X, Edit3, User, Calendar, Tag } from 'lucide-react';
import './styles/globals.css';

// 型定義（後でsrc/typesから import する）
interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  tags: string[];
}

interface List {
  id: string;
  title: string;
  color: string;
  cards: Task[];
}

const App: React.FC = () => {
  const [lists, setLists] = useState<List[]>([
    {
      id: '1',
      title: 'To Do',
      color: 'bg-red-100 border-red-300',
      cards: [
        {
          id: '1',
          title: 'プロジェクト企画書の作成',
          description: '新規プロジェクトの企画書を作成する',
          assignee: '田中さん',
          dueDate: '2024-09-15',
          tags: ['企画', '高優先度']
        },
        {
          id: '2',
          title: 'データベース設計',
          description: 'タスク管理システムのDB設計',
          assignee: '佐藤さん',
          dueDate: '2024-09-20',
          tags: ['開発', 'DB']
        }
      ]
    },
    {
      id: '2',
      title: 'In Progress',
      color: 'bg-yellow-100 border-yellow-300',
      cards: [
        {
          id: '3',
          title: 'API仕様書の作成',
          description: 'RESTful APIの仕様書を作成中',
          assignee: '鈴木さん',
          dueDate: '2024-09-18',
          tags: ['開発', 'API']
        }
      ]
    },
    {
      id: '3',
      title: 'Done',
      color: 'bg-green-100 border-green-300',
      cards: [
        {
          id: '4',
          title: 'アプリ名の決定',
          description: 'タスク管理くんに決定！',
          assignee: 'プロジェクトチーム',
          dueDate: '2024-09-01',
          tags: ['企画']
        }
      ]
    }
  ]);

  const [draggedCard, setDraggedCard] = useState<(Task & { sourceListId: string }) | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [isAddingCard, setIsAddingCard] = useState<Record<string, boolean>>({});
  const [newCardTitle, setNewCardTitle] = useState<string>('');
  const [newCardDescription, setNewCardDescription] = useState<string>('');
  const [editingCard, setEditingCard] = useState<string | null>(null);

  const dragCounter = useRef<number>(0);

  // ドラッグ開始
  const handleDragStart = (e: React.DragEvent, card: Task, sourceListId: string) => {
    setDraggedCard({ ...card, sourceListId });
    e.dataTransfer.effectAllowed = 'move';
  };

  // ドラッグオーバー
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // ドラッグ進入
  const handleDragEnter = (e: React.DragEvent, listId: string) => {
    e.preventDefault();
    dragCounter.current++;
    setDraggedOver(listId);
  };

  // ドラッグ離脱
  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDraggedOver(null);
    }
  };

  // ドロップ
  const handleDrop = (e: React.DragEvent, targetListId: string) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDraggedOver(null);

    if (!draggedCard) return;
    if (draggedCard.sourceListId === targetListId) return;

    setLists(prevLists => {
      const newLists = prevLists.map(list => {
        // 元のリストからカードを削除
        if (list.id === draggedCard.sourceListId) {
          return {
            ...list,
            cards: list.cards.filter(card => card.id !== draggedCard.id)
          };
        }
        // 新しいリストにカードを追加
        if (list.id === targetListId) {
          const cardToMove: Task = {
            id: draggedCard.id,
            title: draggedCard.title,
            description: draggedCard.description,
            assignee: draggedCard.assignee,
            dueDate: draggedCard.dueDate,
            tags: draggedCard.tags
          };
          return {
            ...list,
            cards: [...list.cards, cardToMove]
          };
        }
        return list;
      });
      return newLists;
    });

    setDraggedCard(null);
  };

  // カード追加
  const addCard = (listId: string) => {
    if (!newCardTitle.trim()) return;

    const newCard: Task = {
      id: Date.now().toString(),
      title: newCardTitle,
      description: newCardDescription,
      assignee: '',
      dueDate: '',
      tags: []
    };

    setLists(prevLists => 
      prevLists.map(list => 
        list.id === listId 
          ? { ...list, cards: [...list.cards, newCard] }
          : list
      )
    );

    setNewCardTitle('');
    setNewCardDescription('');
    setIsAddingCard(prev => ({ ...prev, [listId]: false }));
  };

  // カード削除
  const deleteCard = (listId: string, cardId: string) => {
    setLists(prevLists => 
      prevLists.map(list => 
        list.id === listId 
          ? { ...list, cards: list.cards.filter(card => card.id !== cardId) }
          : list
      )
    );
  };

  // カード更新
  const updateCard = (listId: string, cardId: string, updatedCard: Partial<Task>) => {
    setLists(prevLists => 
      prevLists.map(list => 
        list.id === listId 
          ? { 
              ...list, 
              cards: list.cards.map(card => 
                card.id === cardId ? { ...card, ...updatedCard } : card
              )
            }
          : list
      )
    );
    setEditingCard(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Tag className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">タスク管理くん</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">v1.0</span>
            </div>
            <div className="text-sm text-gray-600">
              社内タスク管理システム
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-thin">
          {lists.map(list => (
            <div
              key={list.id}
              className={`flex-shrink-0 w-80 ${list.color} rounded-lg border-2 transition-all duration-200 ${
                draggedOver === list.id ? 'border-blue-500 shadow-lg scale-105' : ''
              }`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, list.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, list.id)}
            >
              {/* リストヘッダー */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">{list.title}</h2>
                  <div className="flex items-center space-x-2">
                    <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                      {list.cards.length}
                    </span>
                    <button
                      onClick={() => setIsAddingCard(prev => ({ ...prev, [list.id]: true }))}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="新しいタスクを追加"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* カード一覧 */}
              <div className="p-4 space-y-3 min-h-32">
                {list.cards.map(card => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card, list.id)}
                    className={`card card-hover cursor-move ${
                      draggedCard && draggedCard.id === card.id ? 'dragging' : ''
                    }`}
                  >
                    {editingCard === card.id ? (
                      // 編集モード
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => updateCard(list.id, card.id, { title: e.target.value })}
                          className="form-input text-sm"
                          placeholder="タスク名"
                        />
                        <textarea
                          value={card.description || ''}
                          onChange={(e) => updateCard(list.id, card.id, { description: e.target.value })}
                          className="form-textarea text-sm h-20"
                          placeholder="詳細説明"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingCard(null)}
                            className="btn-secondary py-1 px-3 text-sm"
                          >
                            完了
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 表示モード
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900 text-sm leading-tight flex-1 pr-2">{card.title}</h3>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => setEditingCard(card.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="編集"
                            >
                              <Edit3 className="w-3 h-3 text-gray-500" />
                            </button>
                            <button
                              onClick={() => deleteCard(list.id, card.id)}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                              title="削除"
                            >
                              <X className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        </div>
                        
                        {card.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{card.description}</p>
                        )}

                        <div className="space-y-2">
                          {card.assignee && (
                            <div className="flex items-center space-x-1 text-xs text-gray-600">
                              <User className="w-3 h-3" />
                              <span>{card.assignee}</span>
                            </div>
                          )}
                          
                          {card.dueDate && (
                            <div className="flex items-center space-x-1 text-xs text-gray-600">
                              <Calendar className="w-3 h-3" />
                              <span>{card.dueDate}</span>
                            </div>
                          )}
                          
                          {card.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {card.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="tag tag-blue"
                                >
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

                {/* カード追加フォーム */}
                {isAddingCard[list.id] && (
                  <div className="card fade-in">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="タスク名を入力..."
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        className="form-input text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            addCard(list.id);
                          }
                        }}
                      />
                      <textarea
                        placeholder="詳細説明（オプション）"
                        value={newCardDescription}
                        onChange={(e) => setNewCardDescription(e.target.value)}
                        className="form-textarea text-sm h-20"
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setIsAddingCard(prev => ({ ...prev, [list.id]: false }));
                            setNewCardTitle('');
                            setNewCardDescription('');
                          }}
                          className="btn-secondary py-1 px-3 text-sm"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => addCard(list.id)}
                          className="btn-primary py-1 px-3 text-sm"
                          disabled={!newCardTitle.trim()}
                        >
                          追加
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            タスク管理くん - 社内タスク管理システム | プロトタイプ版
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;