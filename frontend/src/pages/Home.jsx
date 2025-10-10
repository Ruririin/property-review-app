import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import ExportedItemsPanel from "../components/ExportedItemsPanel";
import apiService from "../services/apiService";
import cleanProjectService from "../services/cleanProjectService.js";
import { useAuth } from "../contexts/AuthContext";

// cleanProjectService is now working correctly

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Debug: Check what we imported
  console.log('cleanProjectService:', cleanProjectService);
  console.log('cleanProjectService.listProjects:', cleanProjectService.listProjects);
  const [projects, setProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Update project status

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
    if (project.owner && user) {
      return user.username || user.email;
    }
    
    // Fallback to owner ID
    return `User ${project.owner || 'Unknown'}`;
  };

  // Smart slide count function for PowerPoint-like functionality (performance optimized)
  const getProjectSlideCount = (project) => {
    // Performance guard: ensure project exists
    if (!project) return 1;

    // Method 1: Check slide_count from new clean database structure
    if (project.slide_count && project.slide_count > 0) {
      return project.slide_count;
    }

    // Method 2: Check slides array from new clean database structure  
    if (project.slides && Array.isArray(project.slides) && project.slides.length > 0) {
      return project.slides.length;
    }

    // Default to 1 slide (every project has at least a cover page)
    return 1;
  };

  const refreshProjects = async (showLoading = true) => {
    if (!user) return;
    
    if (showLoading) setIsLoading(true);
    
    try {
      // Get all projects from database using clean service
      let allProjects;
      try {
        allProjects = await cleanProjectService.listProjects({
          page_size: 50,  // Reduced from 100 for faster loading
          ordering: '-updated_at'  // Most recently updated first
        });
      } catch (serviceError) {
        console.log('cleanProjectService failed, using apiService fallback:', serviceError);
        // Fallback to apiService
        allProjects = await apiService.listProjects({
          page_size: 50,
          ordering: '-updated_at'
        });
      }
      
      // Handle paginated response
      const projectList = allProjects.results || allProjects;
      
      // More efficient filtering using a single pass
      const activeProjects = [];
      const completedProjects = [];
      
      for (const project of projectList) {
        const status = project.status || 'draft';
        if (status === 'completed') {
          completedProjects.push(project);
        } else {
          activeProjects.push(project);
        }
      }
      
      setProjects(activeProjects);
      setCompletedProjects(completedProjects);
    } catch (error) {
      console.error('❌ Failed to load projects:', error);
      setProjects([]);
      setCompletedProjects([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load projects when user is available
    if (user) {
      refreshProjects(true); // Show loading on user change
      updateActiveUser(user.username || user.email, 'join');
    } else {
      setProjects([]);
      setCompletedProjects([]);
      setIsLoading(false);
    }

    // Cleanup when component unmounts or user changes
    return () => {
      if (user) {
        updateActiveUser(user.username || user.email, 'leave');
      }
    };
  }, [user]);

  // Refresh when tab becomes visible (but not on initial page load)
  useEffect(() => {
    let isInitialLoad = true;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !isInitialLoad) {
        // Silent refresh when returning to tab (no loading spinner)
        refreshProjects(false);
      }
      isInitialLoad = false;
    };

    // Handle navigation back from Editor (when component remounts)
    if (user && !isLoading && projects.length > 0) {
      // Silent refresh when navigating back
      refreshProjects(false);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);


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

  const handleCreateNew = async () => {
    try {
      // Create a new project first using clean service
      const defaultTitle = `Property Review ${new Date().toLocaleDateString()}`;
      const newProject = await cleanProjectService.createProject(defaultTitle, '');
      
      console.log('✅ Created new project:', newProject);
      
      // Navigate to editor with the new project ID
      navigate(`/editor/${newProject.id}`);
    } catch (error) {
      console.error('Failed to create new project:', error);
      alert('Failed to create new project. Please try again.');
    }
  };

  const handleLogout = () => {
    if (user) {
      updateActiveUser(user.username || user.email, 'leave');
    }
    logout();
  };

  const handleEditProject = (projectId) => {
    navigate(`/editor/${projectId}`);
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await cleanProjectService.deleteProject(projectId);
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
              {(user?.username || user?.email)?.charAt(0).toUpperCase()}
            </div>
            <span className="ms-2 text-muted small">Logged in as <strong>{user?.username || user?.email}</strong></span>
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
            
            {isLoading ? (
              <div className="card shadow-sm text-center py-5">
                <div className="card-body">
                  <div className="spinner-border text-success mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h5 className="text-muted">Loading Projects...</h5>
                  <p className="text-muted">Please wait while we fetch your property reviews</p>
                </div>
              </div>
            ) : projects.length === 0 ? (
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
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h5 className="card-title fw-bold mb-0">
                            {project.title || 
                             project.name || 
                             project.formData?.insuredName || 
                             project.slideData?.[1]?.formData?.insuredName || 
                             project.slideData?.formData?.insuredName ||
                             `Project ${project.id?.substring(0, 8) || 'Unknown'}`}
                          </h5>
                          <span className={`badge ms-2 ${
                            project.status === 'approved' ? 'bg-success' :
                            project.status === 'denied' ? 'bg-danger' :
                            project.status === 'conditional' ? 'bg-warning text-dark' :
                            'bg-secondary'
                          }`}>
                            {project.status === 'approved' ? '✓ Approved' :
                             project.status === 'denied' ? '✗ Denied' :
                             project.status === 'conditional' ? '⚠ Conditional' :
                             'Draft'}
                          </span>
                        </div>
                        
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
                              <i className="bi bi-file-earmark-slides me-1" style={{ color: "#198754" }}></i>
                              {(() => {
                                const slideCount = getProjectSlideCount(project);
                                return `${slideCount} slide${slideCount !== 1 ? 's' : ''}`;
                              })()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="d-flex gap-2 mb-3">
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

                        {/* Status Management Section */}
                        <div className="border-top pt-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted fw-semibold">Project Status:</small>
                            <span className={`badge ${
                              project.status === 'approved' ? 'bg-success' :
                              project.status === 'denied' ? 'bg-danger' :
                              project.status === 'conditional' ? 'bg-warning text-dark' :
                              'bg-secondary'
                            }`}>
                              {project.status === 'approved' ? 'Approved' :
                               project.status === 'denied' ? 'Denied' :
                               project.status === 'conditional' ? 'Conditional' :
                               'Draft'}
                            </span>
                          </div>
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
                              <i className="bi bi-file-earmark-slides me-1" style={{ color: "#198754" }}></i>
                              Slides: {getProjectSlideCount(project)}
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
          
          {/* Exported Items Panel */}
          <div className="col-md-4">
            <ExportedItemsPanel user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
