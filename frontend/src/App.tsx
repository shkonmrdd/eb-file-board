// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
import { Excalidraw } from "@excalidraw/excalidraw";

function App() {
  return (
    <>
      <div style={{ 
          width: "100vw",
          height: "100vh",
          display: "flex",
          }}>
        <Excalidraw />
      </div>
    </>
  );
}

export default App;