/**
 * useLocalStorage - ローカルストレージ管理カスタムフック（修正版）
 * タスク管理くん用データ永続化機能
 * 
 * 修正内容:
 * - useEffect無限ループを修正
 * - 依存関係配列を最適化
 * - 初期化ロジックを改善
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ローカルストレージキーの定数
 */
export const STORAGE_KEYS = {
  TASKS: 'task-management-kun-tasks',
  USERS: 'task-management-kun-users',
  TEAMS: 'task-management-kun-teams',
  CURRENT_USER: 'task-management-kun-current-user',
  SETTINGS: 'task-management-kun-settings',
  LAST_BACKUP: 'task-management-kun-last-backup'
} as const;

/**
 * ローカルストレージ操作の結果
 */
interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * バックアップデータの構造
 */
interface BackupData {
  timestamp: string;
  version: string;
  data: {
    tasks: any;
    users: any;
    teams: any;
    currentUser: any;
    settings: any;
  };
}

/**
 * useLocalStorage カスタムフック（修正版）
 * @param key ストレージキー
 * @param initialValue 初期値
 * @returns [value, setValue, removeValue, isLoading, error]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void, boolean, string | null] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 初期化が完了したかのフラグ
  const isInitialized = useRef(false);

  // 初期化時にローカルストレージからデータを読み込み（key のみに依存）
  useEffect(() => {
    if (isInitialized.current) return;
    
    const loadFromStorage = () => {
      try {
        setIsLoading(true);
        setError(null);

        const item = window.localStorage.getItem(key);
        if (item) {
          const parsedItem = JSON.parse(item);
          setStoredValue(parsedItem);
          console.log(`📖 Loaded ${key} from localStorage`, parsedItem);
        } else {
          setStoredValue(initialValue);
          console.log(`🆕 Using initial value for ${key}`, initialValue);
        }
      } catch (err) {
        console.error(`Error loading ${key} from localStorage:`, err);
        setError(`Failed to load ${key}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setStoredValue(initialValue);
      } finally {
        setIsLoading(false);
        isInitialized.current = true;
      }
    };

    loadFromStorage();
  }, [key]); // initialValue を依存関係から除外

  // 値を設定する関数（useCallback で安定した参照を保持）
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      setError(null);
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      console.log(`💾 Saved ${key} to localStorage`);
      
    } catch (err) {
      console.error(`Error saving ${key} to localStorage:`, err);
      setError(`Failed to save ${key}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [key, storedValue]);

  // 値を削除する関数
  const removeValue = useCallback(() => {
    try {
      setError(null);
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      console.log(`🗑️ Removed ${key} from localStorage`);
    } catch (err) {
      console.error(`Error removing ${key} from localStorage:`, err);
      setError(`Failed to remove ${key}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue, isLoading, error];
}

/**
 * 複数のローカルストレージキーを一括管理するフック
 */
export function useMultipleStorage() {
  const [tasks, setTasks, removeTasks, tasksLoading, tasksError] = useLocalStorage(STORAGE_KEYS.TASKS, []);
  const [users, setUsers, removeUsers, usersLoading, usersError] = useLocalStorage(STORAGE_KEYS.USERS, []);
  const [teams, setTeams, removeTeams, teamsLoading, teamsError] = useLocalStorage(STORAGE_KEYS.TEAMS, []);
  const [currentUser, setCurrentUser, removeCurrentUser, currentUserLoading, currentUserError] = useLocalStorage(STORAGE_KEYS.CURRENT_USER, null);
  const [settings, setSettings, removeSettings, settingsLoading, settingsError] = useLocalStorage(STORAGE_KEYS.SETTINGS, {});

  const isLoading = tasksLoading || usersLoading || teamsLoading || currentUserLoading || settingsLoading;
  const hasError = tasksError || usersError || teamsError || currentUserError || settingsError;

  return {
    tasks: { data: tasks, set: setTasks, remove: removeTasks, error: tasksError },
    users: { data: users, set: setUsers, remove: removeUsers, error: usersError },
    teams: { data: teams, set: setTeams, remove: removeTeams, error: teamsError },
    currentUser: { data: currentUser, set: setCurrentUser, remove: removeCurrentUser, error: currentUserError },
    settings: { data: settings, set: setSettings, remove: removeSettings, error: settingsError },
    isLoading,
    hasError
  };
}

/**
 * データのバックアップ機能
 */
export function useDataBackup() {
  /**
   * 全データをバックアップファイルとしてダウンロード
   */
  const exportData = useCallback((): StorageResult<string> => {
    try {
      const backupData: BackupData = {
        timestamp: new Date().toISOString(),
        version: '3.1',
        data: {
          tasks: JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]'),
          users: JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
          teams: JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]'),
          currentUser: JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null'),
          settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
        }
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `task-management-kun-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      // 最後のバックアップ時刻を保存
      localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, new Date().toISOString());

      return { success: true, data: dataStr };
    } catch (error) {
      console.error('Error exporting data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to export data' 
      };
    }
  }, []);

  /**
   * バックアップファイルからデータを復元
   */
  const importData = useCallback((file: File): Promise<StorageResult<BackupData>> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const backupData: BackupData = JSON.parse(event.target?.result as string);
          
          // データの妥当性チェック
          if (!backupData.data || !backupData.timestamp) {
            resolve({ 
              success: false, 
              error: 'Invalid backup file format' 
            });
            return;
          }

          // データを復元
          if (backupData.data.tasks) {
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(backupData.data.tasks));
          }
          if (backupData.data.users) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(backupData.data.users));
          }
          if (backupData.data.teams) {
            localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(backupData.data.teams));
          }
          if (backupData.data.currentUser) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(backupData.data.currentUser));
          }
          if (backupData.data.settings) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(backupData.data.settings));
          }

          resolve({ success: true, data: backupData });
        } catch (error) {
          console.error('Error importing data:', error);
          resolve({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to parse backup file' 
          });
        }
      };

      reader.onerror = () => {
        resolve({ 
          success: false, 
          error: 'Failed to read file' 
        });
      };

      reader.readAsText(file);
    });
  }, []);

  /**
   * 全データをクリア
   */
  const clearAllData = useCallback((): StorageResult<boolean> => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      return { success: true, data: true };
    } catch (error) {
      console.error('Error clearing data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clear data' 
      };
    }
  }, []);

  /**
   * 最後のバックアップ日時を取得
   */
  const getLastBackupTime = useCallback((): Date | null => {
    try {
      const lastBackup = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
      return lastBackup ? new Date(lastBackup) : null;
    } catch {
      return null;
    }
  }, []);

  /**
   * ストレージ使用量を取得（概算）
   */
  const getStorageSize = useCallback((): { used: number; total: number; percentage: number } => {
    try {
      let totalSize = 0;
      
      Object.values(STORAGE_KEYS).forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      });

      // 5MB を上限として仮定（ブラウザによって異なる）
      const maxSize = 5 * 1024 * 1024;
      const percentage = (totalSize / maxSize) * 100;

      return {
        used: totalSize,
        total: maxSize,
        percentage: Math.min(percentage, 100)
      };
    } catch {
      return {
        used: 0,
        total: 5 * 1024 * 1024,
        percentage: 0
      };
    }
  }, []);

  return {
    exportData,
    importData,
    clearAllData,
    getLastBackupTime,
    getStorageSize
  };
}

/**
 * 自動保存機能付きのローカルストレージフック（修正版）
 */
export function useAutoSaveLocalStorage<T>(
  key: string,
  initialValue: T,
  autoSaveDelay: number = 1000
) {
  const [value, setValue, removeValue, isLoading, error] = useLocalStorage(key, initialValue);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 自動保存のためのタイマー（最適化版）
  const setValueWithAutoSave = useCallback((newValue: T | ((prev: T) => T)) => {
    setIsSaving(true);
    setValue(newValue);
    
    // 既存のタイマーをクリア
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // 新しいタイマーを設定
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(false);
    }, autoSaveDelay);
  }, [setValue, autoSaveDelay]);

  // コンポーネントのアンマウント時にタイマーをクリア
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return [value, setValueWithAutoSave, removeValue, isLoading, error, isSaving] as const;
}

/**
 * ローカルストレージの使用統計を取得
 */
export function getStorageStats() {
  const stats = {
    keys: 0,
    totalSize: 0,
    items: {} as Record<string, number>
  };

  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        stats.keys++;
        stats.items[key] = value.length;
        stats.totalSize += value.length;
      }
    });
  } catch (error) {
    console.error('Error getting storage stats:', error);
  }

  return stats;
}

/**
 * ローカルストレージの健全性チェック
 */
export function checkStorageHealth(): { isHealthy: boolean; issues: string[] } {
  const issues: string[] = [];
  
  try {
    // 書き込みテスト
    const testKey = 'health-check-test';
    const testValue = 'test';
    localStorage.setItem(testKey, testValue);
    
    if (localStorage.getItem(testKey) !== testValue) {
      issues.push('Write/Read test failed');
    }
    
    localStorage.removeItem(testKey);

    // 容量チェック
    const stats = getStorageStats();
    if (stats.totalSize > 4 * 1024 * 1024) { // 4MB以上で警告
      issues.push('Storage usage is high (over 4MB)');
    }

    // 各キーの存在チェック
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          JSON.parse(value);
        } catch {
          issues.push(`Invalid JSON in ${name} (${key})`);
        }
      }
    });

  } catch (error) {
    issues.push(`Storage access error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isHealthy: issues.length === 0,
    issues
  };
}

export default useLocalStorage;