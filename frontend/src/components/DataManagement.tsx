/**
 * DataManagement - データ管理コンポーネント
 * バックアップ、復元、エクスポート、インポート機能
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  HardDrive,
  Calendar,
  FileText,
  X
} from 'lucide-react';
import { useDataBackup, getStorageStats, checkStorageHealth, STORAGE_KEYS } from '../hooks/useLocalStorage';

interface DataManagementProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: () => void;
}

interface StorageStats {
  keys: number;
  totalSize: number;
  items: Record<string, number>;
}

interface HealthCheck {
  isHealthy: boolean;
  issues: string[];
}

const DataManagement: React.FC<DataManagementProps> = ({
  isOpen,
  onClose,
  onDataImported
}) => {
  // フック
  const { exportData, importData, clearAllData, getLastBackupTime, getStorageSize } = useDataBackup();
  
  // 状態管理
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStats>({ keys: 0, totalSize: 0, items: {} });
  const [healthCheck, setHealthCheck] = useState<HealthCheck>({ isHealthy: true, issues: [] });
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);
  const [storageSize, setStorageSize] = useState({ used: 0, total: 0, percentage: 0 });
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 統計情報を更新
  const updateStats = useCallback(() => {
    const stats = getStorageStats();
    setStorageStats(stats);
    
    const health = checkStorageHealth();
    setHealthCheck(health);
    
    const lastBackup = getLastBackupTime();
    setLastBackupTime(lastBackup);
    
    const size = getStorageSize();
    setStorageSize(size);
  }, [getLastBackupTime, getStorageSize]);

  // コンポーネントマウント時とオープン時に統計情報を更新
  useEffect(() => {
    if (isOpen) {
      updateStats();
    }
  }, [isOpen, updateStats]);

  // メッセージを一定時間後にクリア
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // データエクスポート
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = exportData();
      if (result.success) {
        setMessage({ type: 'success', text: 'データのエクスポートが完了しました' });
        updateStats();
      } else {
        setMessage({ type: 'error', text: result.error || 'エクスポートに失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'エクスポート中にエラーが発生しました' });
    } finally {
      setIsExporting(false);
    }
  };

  // データインポート
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await importData(file);
      if (result.success) {
        setMessage({ type: 'success', text: 'データのインポートが完了しました' });
        updateStats();
        onDataImported();
      } else {
        setMessage({ type: 'error', text: result.error || 'インポートに失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'インポート中にエラーが発生しました' });
    } finally {
      setIsImporting(false);
      // input要素をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 全データクリア
  const handleClearData = async () => {
    setIsClearing(true);
    try {
      const result = clearAllData();
      if (result.success) {
        setMessage({ type: 'success', text: '全データをクリアしました' });
        updateStats();
        setShowConfirmClear(false);
        onDataImported(); // データが変更されたことを通知
      } else {
        setMessage({ type: 'error', text: result.error || 'データクリアに失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'データクリア中にエラーが発生しました' });
    } finally {
      setIsClearing(false);
    }
  };

  // ファイルサイズを人間が読める形式に変換
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 日時フォーマット
  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('ja-JP');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large data-management-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <HardDrive size={24} />
            データ管理
          </h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* メッセージ表示 */}
          {message && (
            <div className={`message-banner ${message.type}`}>
              {message.type === 'success' && <CheckCircle size={20} />}
              {message.type === 'error' && <XCircle size={20} />}
              {message.type === 'info' && <RefreshCw size={20} />}
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="message-close">
                <X size={16} />
              </button>
            </div>
          )}

          {/* ストレージ健全性チェック */}
          {!healthCheck.isHealthy && (
            <div className="health-warning">
              <AlertTriangle size={20} />
              <div>
                <strong>ストレージに問題があります:</strong>
                <ul>
                  {healthCheck.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ストレージ使用量 */}
          <div className="storage-info">
            <h3>ストレージ使用状況</h3>
            <div className="storage-usage">
              <div className="usage-bar">
                <div 
                  className="usage-fill" 
                  style={{ 
                    width: `${storageSize.percentage}%`,
                    backgroundColor: storageSize.percentage > 80 ? '#ef4444' : 
                                   storageSize.percentage > 60 ? '#f59e0b' : '#10b981'
                  }}
                ></div>
              </div>
              <div className="usage-text">
                {formatFileSize(storageSize.used)} / {formatFileSize(storageSize.total)} 
                ({storageSize.percentage.toFixed(1)}%)
              </div>
            </div>
            
            <div className="storage-details">
              <div className="storage-detail-item">
                <strong>保存済みキー数:</strong> {storageStats.keys}
              </div>
              {lastBackupTime && (
                <div className="storage-detail-item">
                  <Calendar size={16} />
                  <strong>最後のバックアップ:</strong> {formatDateTime(lastBackupTime)}
                </div>
              )}
            </div>
          </div>

          {/* データ操作ボタン */}
          <div className="data-actions">
            <div className="action-section">
              <h3>バックアップ・復元</h3>
              <div className="action-buttons">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="btn btn-primary action-btn"
                >
                  {isExporting ? <RefreshCw size={18} className="spinning" /> : <Download size={18} />}
                  {isExporting ? 'エクスポート中...' : 'データをエクスポート'}
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="btn btn-secondary action-btn"
                >
                  {isImporting ? <RefreshCw size={18} className="spinning" /> : <Upload size={18} />}
                  {isImporting ? 'インポート中...' : 'データをインポート'}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </div>
              <p className="action-description">
                全データをJSONファイルとして保存・復元できます。
                他の端末との同期や、データ移行の際にご利用ください。
              </p>
            </div>

            <div className="action-section danger-section">
              <h3>危険な操作</h3>
              {!showConfirmClear ? (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="btn btn-danger action-btn"
                >
                  <Trash2 size={18} />
                  全データを削除
                </button>
              ) : (
                <div className="confirm-delete">
                  <p className="confirm-text">
                    <AlertTriangle size={16} />
                    本当に全データを削除しますか？この操作は取り消せません。
                  </p>
                  <div className="confirm-actions">
                    <button
                      onClick={() => setShowConfirmClear(false)}
                      className="btn btn-secondary"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleClearData}
                      disabled={isClearing}
                      className="btn btn-danger"
                    >
                      {isClearing ? <RefreshCw size={16} className="spinning" /> : <Trash2 size={16} />}
                      {isClearing ? '削除中...' : '完全に削除する'}
                    </button>
                  </div>
                </div>
              )}
              <p className="action-description">
                保存されている全てのタスク、ユーザー、チーム情報を完全に削除します。
              </p>
            </div>
          </div>

          {/* データ詳細情報 */}
          <div className="data-details">
            <h3>保存データ詳細</h3>
            <div className="data-items">
              {Object.entries(STORAGE_KEYS).map(([name, key]) => {
                const size = storageStats.items[key] || 0;
                const hasData = size > 0;
                
                return (
                  <div key={key} className={`data-item ${hasData ? 'has-data' : 'no-data'}`}>
                    <div className="data-item-icon">
                      <FileText size={16} />
                    </div>
                    <div className="data-item-info">
                      <div className="data-item-name">{name.replace(/_/g, ' ')}</div>
                      <div className="data-item-size">
                        {hasData ? formatFileSize(size) : 'データなし'}
                      </div>
                    </div>
                    <div className={`data-item-status ${hasData ? 'active' : 'inactive'}`}>
                      {hasData ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 使用上の注意 */}
          <div className="usage-notes">
            <h3>使用上の注意</h3>
            <ul>
              <li>データはブラウザのローカルストレージに保存されます</li>
              <li>ブラウザのデータを削除すると保存した内容も失われます</li>
              <li>定期的にエクスポートしてバックアップを作成することをお勧めします</li>
              <li>インポートする際は、既存データが上書きされますのでご注意ください</li>
              <li>ストレージ容量が上限に近づいた場合は、不要なデータの削除をお勧めします</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;