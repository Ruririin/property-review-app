import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import ActiveUsersPanel from "../components/ActiveUsersPanel";
import apiService from "../services/apiService";

export default function Home({ sessionUser, onLogout }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);

  // Helper function to get user display name
  const getUserDisplayName = (project) => {
    // Try to get user from stored session data in project
    const storedSessionUser = project.slideData?._appState?.sessionUser || 
                             project.formData?.sessionUser || 
                             project.sessionUser;
    
    if (storedSessionUser) {
      return storedSessionUser;
    }
    
    // If this is the current user's project (created recently)
    if (project.owner && sessionUser) {
      return sessionUser;
    }
    
    // Fallback to owner ID
    return `User ${project.owner || 'Unknown'}`;
  };

  const refreshProjects = async () => {
    if (sessionUser) {
      try {
        // Get all projects from database
        const allProjects = await apiService.listProjects();
        // Loaded projects from database
        
        // Filter by status
        const activeProjects = allProjects.filter(p => p.status !== 'completed');
        const completedProjects = allProjects.filter(p => p.status === 'completed');
        
        setProjects(activeProjects);
        setCompletedProjects(completedProjects);
      } catch (error) {
        console.error('❌ Failed to load projects:', error);
        setProjects([]);
        setCompletedProjects([]);
      }
    }
  };

  useEffect(() => {
    // Load ALL saved projects for shared drafts
    if (sessionUser) {
      refreshProjects();
      updateActiveUser(sessionUser, 'join');
    } else {
      setProjects([]);
      setCompletedProjects([]);
    }

    // Cleanup when component unmounts or user changes
    return () => {
      if (sessionUser) {
        updateActiveUser(sessionUser, 'leave');
      }
    };
  }, [sessionUser]);

  // Also refresh when the component becomes visible (user navigates back to home)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && sessionUser) {
        // Page visible, refreshing projects
        refreshProjects();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionUser]);

  const updateActiveUser = (userName, action) => {
    // Store active users in localStorage for demo purposes
    // In a real app, this would be a WebSocket or server-side session management
    const stored = localStorage.getItem('activeUsers') || '[]';
    let users = JSON.parse(stored);
    
    if (action === 'join' && !users.includes(userName)) {
      users.push(userName);
    } else if (action === 'leave') {
      users = users.filter(user => user !== userName);
    }
    
    localStorage.setItem('activeUsers', JSON.stringify(users));
    setActiveUsers(users);
  };

  const handleCreateNew = () => {
    navigate("/editor");
  };

  const handleLogout = () => {
    if (sessionUser) {
      updateActiveUser(sessionUser, 'leave');
    }
    onLogout();
  };

  const handleEditProject = (projectId) => {
    navigate(`/editor?projectId=${projectId}`);
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await apiService.deleteProject(projectId);
        await refreshProjects();
        console.log(`✅ Project deleted and lists refreshed`);
      } catch (error) {
        console.error('❌ Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-light bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <img
            src="/NeitClemLogo.png"
            alt="Logo"
            style={{ width: "40px", height: "40px", objectFit: "contain", marginRight: "10px" }}
          />
          <h5 className="mb-0 fw-bold">Property Review Maker</h5>
        </div>
        <div className="d-flex align-items-center gap-3">
          {/* Active User Indicator */}
          <div className="d-flex align-items-center">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
              style={{ 
                width: "35px", 
                height: "35px", 
                backgroundColor: "#198754",
                fontSize: "14px"
              }}
            >
              {sessionUser?.charAt(0).toUpperCase()}
            </div>
            <span className="ms-2 text-muted small">Logged in as <strong>{sessionUser}</strong></span>
          </div>
          
          <div className="d-flex gap-2">
            <button className="btn btn-primary fw-semibold" onClick={handleCreateNew}>
              Create New PPT
            </button>
            <button className="btn btn-outline-secondary fw-semibold" onClick={handleLogout}>
              End Session
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mt-4">
        <div className="row">
          {/* Projects Section */}
          <div className="col-md-8">
            <div className="mb-4">
              <h4 className="fw-bold">Property Review Drafts</h4>
            </div>
            
            {projects.length === 0 ? (
              <div className="card shadow-sm text-center py-5">
                <div className="card-body">
                  <i className="bi bi-file-earmark-plus fs-1 mb-3" style={{ color: "#198754" }}></i>
                  <h5 className="text-muted">No Projects Yet</h5>
                  <p className="text-muted mb-4">
                    Create your first property review to get started
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={handleCreateNew}
                  >
                    <i className="bi bi-plus-lg me-2" style={{ color: "white" }}></i>Create New Property Review
                  </button>
                </div>
              </div>
            ) : (
              <div className="row">
                {projects.map((project) => (
                  <div key={project.id} className="col-md-6 mb-4">
                    <div className="card shadow-sm h-100">
                      <div className="card-body">
                        <h5 className="card-title fw-bold mb-3">
                          {project.title || project.formData?.insuredName || project.slideData?.[1]?.formData?.insuredName || 'Untitled Project'}
                        </h5>
                        
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <div>
                            <small className="text-muted d-block">
                              <i className="bi bi-person me-1" style={{ color: "#198754" }}></i>
                              Created by: <strong>{getUserDisplayName(project)}</strong>
                            </small>
                            <small className="text-muted d-block">
                              <i className="bi bi-clock me-1" style={{ color: "#198754" }}></i>
                              Modified: {new Date(project.updated_at).toLocaleDateString()}
                            </small>
                            <small className="text-muted d-block">
                              <i className="bi bi-calendar me-1" style={{ color: "#198754" }}></i>
                              Created: {new Date(project.created_at).toLocaleDateString()}
                            </small>
                          </div>
                          <div className="text-end">
                            <span className="badge bg-light text-dark">
                              {project.slideData?._slides?.length || 1} slide{(project.slideData?._slides?.length || 1) !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-sm btn-primary flex-grow-1"
                            onClick={() => handleEditProject(project.id)}
                          >
                            Continue Editing
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteProject(project.id)}
                            title="Delete Project"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Projects Section */}
            {completedProjects.length > 0 && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
                  <h4 className="fw-bold text-success">Completed Projects</h4>
                  <span className="badge bg-success">{completedProjects.length}</span>
                </div>
                
                <div className="row">
                  {completedProjects.slice(0, 4).map((project) => (
                    <div key={project.id} className="col-md-6 mb-4">
                      <div className="card shadow-sm h-100 border-success">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="card-title fw-bold mb-0">
                              {project.title || project.formData?.insuredName || 'Untitled Project'}
                            </h6>
                            <span className="badge bg-success">Complete</span>
                          </div>
                          
                          <div className="mb-3">
                            <small className="text-muted d-block">
                              <i className="bi bi-person me-1" style={{ color: "#198754" }}></i>
                              Created by: <strong>{getUserDisplayName(project)}</strong>
                            </small>
                            <small className="text-muted d-block">
                              <i className="bi bi-check-circle me-1" style={{ color: "#198754" }}></i>
                              Completed: {new Date(project.updated_at).toLocaleDateString()}
                            </small>
                            <small className="text-muted d-block">
                              <i className="bi bi-file-earmark-pdf me-1" style={{ color: "#198754" }}></i>
                              Slides: {project.slideData?._slides?.length || 1}
                            </small>
                          </div>
                          
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-sm btn-outline-success flex-grow-1"
                              onClick={() => handleEditProject(project.id)}
                            >
                              View/Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteProject(project.id)}
                              title="Delete Project"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {completedProjects.length > 4 && (
                  <div className="text-center mb-4">
                    <small className="text-muted">
                      Showing 4 of {completedProjects.length} completed projects
                    </small>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Active Users Panel */}
          <div className="col-md-4">
            <ActiveUsersPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
