import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router";

import PDFViewerPage from "./pages/PDFViewerPage";
import Board from "./pages/FileBoardPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Board />} />
        <Route path="/pdf/*" element={<PDFViewerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
