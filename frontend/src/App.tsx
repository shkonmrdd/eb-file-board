import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router";
import { useEffect, useState } from "react";

import PDFViewerPage from "./pages/PDFViewerPage";
import MarkdownViewerPage from "./pages/MarkdownViewerPage";
import Board from "./pages/FileBoardPage";
import WithHeaderLayout from "./layouts/WithHeaderLayout";
import "@excalidraw/excalidraw/index.css";
import { 
  hasJwtToken, 
  promptForInitialToken, 
  verifyAuth, 
  login, 
  logout, 
  getInitialToken
} from "./services/auth";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasJwtToken());
  const [isLoading, setIsLoading] = useState(true);

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
          // No tokens at all, prompt for initial token
          console.log("No tokens found, prompting for initial token");
          const newInitialToken = promptForInitialToken();
          if (newInitialToken) {
            console.log("Initial token provided, attempting login");
            const loginSuccess = await login(newInitialToken);
            setIsAuthenticated(loginSuccess);
            if (!loginSuccess) {
              console.log("Login with provided token failed");
            }
          } else {
            setIsAuthenticated(false);
          }
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

  // Show loading state
  if (isLoading) {
    return <div className="auth-loading">Verifying authentication...</div>;
  }

  // If not authenticated, show authentication screen
  if (!isAuthenticated) {
    return (
      <div className="auth-required">
        <h1>Authentication Required</h1>
        <p>You need to provide the initial token to access this application.</p>
        <button onClick={() => {
          const token = promptForInitialToken();
          if (token) {
            login(token).then(success => {
              setIsAuthenticated(success);
            });
          }
        }}>
          Enter Initial Token
        </button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <div className="app-header">
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
        <Routes>
          <Route path="/:boardName?" element={<Board />} />
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
