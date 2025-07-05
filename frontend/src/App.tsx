import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';

import PDFViewerPage from './pages/PDFViewerPage';
import MarkdownViewerPage from './pages/MarkdownViewerPage';
import Board from './pages/FileBoardPage';
import WithHeaderLayout from './layouts/WithHeaderLayout';
import '@excalidraw/excalidraw/index.css';
import { useAuthStore } from './store';
import LoginForm from './components/LoginForm';

function App() {
  const { isAuthenticated, isLoading, isLoginAttempting, initialize, login, logout } =
    useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full bg-gray-900">
        <div className="flex flex-col items-center p-8">
          <div className="w-16 h-16 border-t-4 border-gray-500 border-solid rounded-full animate-spin mb-4"></div>
          <p className="text-xl text-gray-300">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full bg-gray-900">
        <LoginForm onLogin={login} isLoading={isLoginAttempting} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen min-w-screen bg-gray-100 dark:bg-gray-900">
        <Routes>
          <Route path="/:boardName?" element={<Board onLogout={logout} />} />
          <Route element={<WithHeaderLayout />}>
            <Route path="/pdf/*" element={<PDFViewerPage />} />
            <Route path="/md/*" element={<MarkdownViewerPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
