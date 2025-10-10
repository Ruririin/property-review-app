import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Editor from "./pages/Editor.jsx";
import PWAInstallPrompt from "./components/PWAInstallPrompt.jsx";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <PWAInstallPrompt />
      <Routes>
        <Route
          path="/auth"
          element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />}
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/editor/:projectId"
          element={
            <PrivateRoute>
              <Editor />
            </PrivateRoute>
          }
        />
        <Route
          path="/editor"
          element={
            <PrivateRoute>
              <Editor />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;