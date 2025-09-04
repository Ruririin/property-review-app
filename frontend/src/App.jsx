import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import SessionUserPicker from "./pages/SessionUserPicker";
import { useLocation } from "react-router-dom";
import Editor from "./pages/Editor.jsx";
import DemoBanner from "./components/DemoBanner.jsx";
import { DEMO_CONFIG } from "./config/demoConfig.js";
import authService from "./services/authService.js";

function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check session status with backend
    const checkSession = async () => {
      try {
        const sessionStatus = await authService.getSessionStatus();
        if (sessionStatus.authenticated) {
          setSessionUser(sessionStatus.user.display_name || sessionStatus.user.username);
        } else {
          setSessionUser(null);
        }
      } catch (error) {
        console.error('Failed to check session:', error);
        setSessionUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [location]);

  const handleUserSelected = async (userName) => {
    try {
      await authService.startSession(userName);
      setSessionUser(userName);
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.endSession();
      setSessionUser(null);
    } catch (error) {
      console.error('Failed to end session:', error);
      // Still clear local state even if backend call fails
      setSessionUser(null);
    }
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
