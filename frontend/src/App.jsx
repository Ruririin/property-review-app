import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import SessionUserPicker from "./pages/SessionUserPicker";
import { useLocation } from "react-router-dom";
import Editor from "./pages/Editor.jsx";
import DemoBanner from "./components/DemoBanner.jsx";
import { DEMO_CONFIG } from "./config/demoConfig.js";

function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Use sessionStorage instead of localStorage to make sessions tab-specific
    const storedUser = sessionStorage.getItem("sessionUser");
    setSessionUser(storedUser);
    setIsLoading(false);
  }, [location]);

  const handleUserSelected = (userName) => {
    setSessionUser(userName);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("sessionUser");
    setSessionUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DemoBanner />
      <div style={{ paddingTop: DEMO_CONFIG?.DEMO_MODE ? '40px' : '0' }}>
        <Routes>
          <Route 
            path="/" 
            element={sessionUser ? <Home sessionUser={sessionUser} onLogout={handleLogout} /> : <Navigate to="/session" replace />} 
          />
          <Route 
            path="/home" 
            element={sessionUser ? <Home sessionUser={sessionUser} onLogout={handleLogout} /> : <Navigate to="/session" replace />} 
          />
          <Route
            path="/session"
            element={
              sessionUser
                ? <Navigate to="/" replace />
                : <SessionUserPicker onUserSelected={handleUserSelected} />
            }
          />
          <Route 
            path="/editor" 
            element={sessionUser ? <Editor sessionUser={sessionUser} /> : <Navigate to="/session" replace />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
