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
import { hasAuthToken, promptForAuthToken, verifyAuthToken, getAuthToken, clearAuthToken } from "./services/auth";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasAuthToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If we don't have a token, prompt for one
        if (!hasAuthToken()) {
          console.log("No token found, prompting user");
          const token = promptForAuthToken();
          if (token) {
            console.log("Verifying provided token");
            const isValid = await verifyAuthToken(token);
            if (!isValid) {
              console.log("Token validation failed, clearing token");
              clearAuthToken();
            }
            setIsAuthenticated(isValid);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          // Verify existing token
          const token = getAuthToken();
          console.log(`Found existing token: ${token?.substring(0, 4)}...`);
          if (token) {
            const isValid = await verifyAuthToken(token);
            if (!isValid) {
              console.log("Existing token is invalid, prompting for new one");
              // If token is invalid, prompt for a new one
              clearAuthToken();
              const newToken = promptForAuthToken();
              if (newToken) {
                console.log("Verifying new token");
                const newIsValid = await verifyAuthToken(newToken);
                if (!newIsValid) {
                  console.log("New token validation failed, clearing token");
                  clearAuthToken();
                }
                setIsAuthenticated(newIsValid);
              } else {
                setIsAuthenticated(false);
              }
            } else {
              console.log("Token validated successfully");
              setIsAuthenticated(true);
            }
          } else {
            setIsAuthenticated(false);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading state
  if (isLoading) {
    return <div className="auth-loading">Verifying authentication...</div>;
  }

  // If not authenticated, show authentication screen
  if (!isAuthenticated) {
    return (
      <div className="auth-required">
        <h1>Authentication Required</h1>
        <p>You need a valid API token to access this application.</p>
        <button onClick={() => {
          const token = promptForAuthToken();
          if (token) {
            verifyAuthToken(token).then(isValid => {
              setIsAuthenticated(isValid);
            });
          }
        }}>
          Enter API Token
        </button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:boardName?" element={<Board />} />
        <Route element={<WithHeaderLayout />}>
          <Route path="/pdf/*" element={<PDFViewerPage />} />
          <Route path="/md/*" element={<MarkdownViewerPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
