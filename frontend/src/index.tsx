import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// スタイルシートをインポート
import './styles/globals.css';

// ルート要素を取得
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// React 18の新しいrootAPIを使用
const root = ReactDOM.createRoot(rootElement);

// アプリケーションをレンダリング
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// パフォーマンス測定（オプション）
// もし Web Vitals を測定したい場合は、以下のコメントを外してください
/*
import { reportWebVitals } from './reportWebVitals';
reportWebVitals(console.log);
*/