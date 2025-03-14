import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router";

import PDFViewerPage from "./pages/PDFViewerPage";
import MarkdownViewerPage from "./pages/MarkdownViewerPage";
import Board from "./pages/FileBoardPage";
import WithHeaderLayout from "./layouts/WithHeaderLayout";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Board />} />
          <Route element={<WithHeaderLayout />}>
            <Route path="/pdf/*" element={<PDFViewerPage />} />
            <Route path="/md/*" element={<MarkdownViewerPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;