import { useLocation } from "react-router";
import PDFViewer from "../components/LocalPDFViewer";

function PDFViewerPage() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);

  const url = urlParams.get("url") ?? "";
  console.log('PDF URL:', url);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
      <PDFViewer url={url} />
    </div>
  );
}

export default PDFViewerPage;
