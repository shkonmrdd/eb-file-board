import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { useEffect, useState } from "react";

import PDFViewerPage from "./pages/PDFViewerPage";
import MarkdownViewerPage from "./pages/MarkdownViewerPage";
import Board from "./pages/FileBoardPage";
import WithHeaderLayout from "./layouts/WithHeaderLayout";
import "@excalidraw/excalidraw/index.css";
import { 
  hasJwtToken, 
  verifyAuth, 
  login, 
  logout, 
  getInitialToken,
  setInitialToken
} from "./services/auth";
import LoginForm from "./components/LoginForm";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasJwtToken());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginAttempting, setIsLoginAttempting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check if we have a JWT and it's valid
        if (hasJwtToken()) {
          console.log("Found JWT token, verifying...");
          const isValid = await verifyAuth();
          if (isValid) {
            console.log("JWT is valid");
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          } else {
            console.log("JWT is invalid or expired");
          }
        }

        // No valid JWT, check if we have an initial token
        const initialToken = getInitialToken();
        if (initialToken) {
          console.log("Found initial token, attempting login");
          const loginSuccess = await login(initialToken);
          setIsAuthenticated(loginSuccess);
          if (!loginSuccess) {
            console.log("Login with initial token failed");
          }
        } else {
          // No tokens at all, will show login form
          console.log("No tokens found, showing login form");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
  };

  // Handle login with token
  const handleLogin = async (token: string) => {
    setIsLoginAttempting(true);
    try {
      setInitialToken(token);
      const loginSuccess = await login(token);
      setIsAuthenticated(loginSuccess);
      if (!loginSuccess) {
        console.log("Login with provided token failed");
      }
    } finally {
      setIsLoginAttempting(false);
    }
  };

  // Show loading state
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

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full bg-gray-900">
        <LoginForm onLogin={handleLogin} isLoading={isLoginAttempting} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Remove the header with logout button */}
        <Routes>
          <Route path="/:boardName?" element={<Board onLogout={handleLogout} />} />
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
