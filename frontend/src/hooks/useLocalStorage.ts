// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';
import type { TaskList } from '../types';

const STORAGE_KEY = 'task-management-kun-data';

export const useLocalStorage = (initialData: TaskList[]) => {
  const [lists, setLists] = useState<TaskList[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialData;
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      return initialData;
    }
  });

  // データが変更されたら自動保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }, [lists]);

  return [lists, setLists] as const;
};