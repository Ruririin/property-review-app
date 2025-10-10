import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Editor from "./pages/Editor.jsx";
import PWAInstallPrompt from "./components/PWAInstallPrompt.jsx";

function App() {
  // Completely remove all authentication - test if Editor works like 2 days ago
  const mockUser = "test-user";

  return (
    <>
      <PWAInstallPrompt />
      <Routes>
        <Route path="/" element={<Home sessionUser={mockUser} onLogout={() => {}} />} />
        <Route path="/home" element={<Home sessionUser={mockUser} onLogout={() => {}} />} />
        <Route path="/editor/:projectId" element={<Editor sessionUser={mockUser} />} />
        <Route path="/editor" element={<Editor sessionUser={mockUser} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;