import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const G = '#2a7a2a';
const GD = '#1e5a1e';
const GL = '#e8f5e8';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    approvedProjects: 0,
    mostCommonLineBusiness: 'N/A',
    lineBusinessPercentage: 0,
    avgCompletionTime: 'N/A',
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadStats();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await apiService.getUserProfile();

      // Add cache-busting timestamp to image URLs
      if (profile) {
        const timestamp = Date.now();
        if (profile.avatar_url) {
          profile.avatar_url = `${profile.avatar_url}?t=${timestamp}`;
        }
        if (profile.header_image_url) {
          profile.header_image_url = `${profile.header_image_url}?t=${timestamp}`;
        }
        if (profile.background_image_url) {
          profile.background_image_url = `${profile.background_image_url}?t=${timestamp}`;
        }
      }

      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Profile might not exist yet, that's okay
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      // Get all personal projects
      const personalDrafts = await apiService.getPersonalDrafts();
      const approved = await apiService.getApprovedList();

      // Calculate most common Line of Business
      const lineBusinessCounts = {};
      let totalWithLineBusiness = 0;

      personalDrafts.forEach(project => {
        const lineBusiness = project.slideData?.['1']?.formData?.lineBusiness;
        if (lineBusiness && lineBusiness !== 'Line of Business') {
          lineBusinessCounts[lineBusiness] = (lineBusinessCounts[lineBusiness] || 0) + 1;
          totalWithLineBusiness++;
        }
      });

      let mostCommon = 'N/A';
      let maxCount = 0;
      Object.entries(lineBusinessCounts).forEach(([business, count]) => {
        if (count > maxCount) {
          mostCommon = business;
          maxCount = count;
        }
      });

      const percentage = totalWithLineBusiness > 0
        ? Math.round((maxCount / totalWithLineBusiness) * 100)
        : 0;

      // Calculate average completion time
      const completedProjects = personalDrafts.filter(p => p.exported_at && p.created_at);
      let avgMinutes = 0;

      if (completedProjects.length > 0) {
        const totalMinutes = completedProjects.reduce((sum, project) => {
          const created = new Date(project.created_at);
          const exported = new Date(project.exported_at);
          const diffMs = exported - created;
          const diffMinutes = Math.max(1, Math.round(diffMs / 60000)); // At least 1 minute
          return sum + diffMinutes;
        }, 0);

        avgMinutes = Math.round(totalMinutes / completedProjects.length);
      }

      const formatTime = (minutes) => {
        if (minutes === 0) return 'N/A';
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      };

      setStats({
        totalProjects: personalDrafts.length || 0,
        approvedProjects: approved.length || 0,
        mostCommonLineBusiness: mostCommon,
        lineBusinessPercentage: percentage,
        avgCompletionTime: formatTime(avgMinutes),
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const username = user?.username || user?.email || 'User';
  const email = user?.email || 'No email';
  const isAdmin = user?.is_staff === true;
  const position = isAdmin ? 'Administrator' : 'Member';

  // Get background style based on user profile
  const getBackgroundStyle = () => {
    if (!userProfile) {
      return `linear-gradient(135deg, ${G} 0%, ${GD} 100%)`;
    }

    if (userProfile.background_type === 'color') {
      // Create gradient from the selected color
      const color = userProfile.background_color || G;
      const darkerColor = userProfile.background_color
        ? `${userProfile.background_color}dd`
        : GD;
      return `linear-gradient(135deg, ${color} 0%, ${darkerColor} 100%)`;
    } else if (userProfile.background_type === 'image' && userProfile.background_image_url) {
      const img = userProfile.background_image_url;
      const display = userProfile.background_display || 'fit';

      switch (display) {
        case 'pattern':
          return `url(${img})`;
        case 'fit':
          return `url(${img})`;
        case 'fade-down':
          return `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%), url(${img})`;
        case 'fade-up':
          return `linear-gradient(0deg, transparent 0%, rgba(0,0,0,0.7) 100%), url(${img})`;
        default:
          return `url(${img})`;
      }
    }

    return `linear-gradient(135deg, ${G} 0%, ${GD} 100%)`;
  };

  const getBackgroundSize = () => {
    if (userProfile?.background_type === 'image') {
      const display = userProfile.background_display || 'fit';
      if (display === 'pattern') return 'auto';
      return 'cover';
    }
    return 'cover';
  };

  const getBackgroundRepeat = () => {
    if (userProfile?.background_type === 'image') {
      const display = userProfile.background_display || 'fit';
      if (display === 'pattern') return 'repeat';
      return 'no-repeat';
    }
    return 'no-repeat';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: getBackgroundStyle(),
      backgroundSize: getBackgroundSize(),
      backgroundRepeat: getBackgroundRepeat(),
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/home')}
        style={{
          position: 'absolute',
          top: 32,
          left: 32,
          width: 48,
          height: 48,
          borderRadius: 12,
          background: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'all .2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <i className="bi bi-arrow-left" style={{ fontSize: 20, color: '#1a202c' }}></i>
      </button>

      {/* Settings button */}
      <button
        onClick={() => navigate('/settings')}
        style={{
          position: 'absolute',
          top: 32,
          right: 32,
          width: 48,
          height: 48,
          borderRadius: 12,
          background: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'all .2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(90deg)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0deg)'}
      >
        <i className="bi bi-gear" style={{ fontSize: 20, color: '#1a202c' }}></i>
      </button>

      {/* Profile Card */}
      <div style={{
        width: '90vw',
        maxWidth: '900px',
        background: '#fff',
        borderRadius: 32,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header with gradient or custom image */}
        <div style={{
          height: 200,
          backgroundImage: userProfile?.header_image_url
            ? `url(${userProfile.header_image_url})`
            : `linear-gradient(135deg, ${G}, ${GD})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}>
          {/* Profile picture (avatar or initials) */}
          <div style={{
            position: 'absolute',
            bottom: -50,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: '#fff',
            backgroundImage: userProfile?.avatar_url ? `url(${userProfile.avatar_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            border: '4px solid #fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 42,
            fontWeight: 700,
            color: G,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}>
            {!userProfile?.avatar_url && username.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '70px 32px 32px', textAlign: 'center' }}>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: '#1a202c',
            marginBottom: 8,
          }}>
            {username}
          </h1>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: '#a0aec0',
            marginBottom: 4,
          }}>
            {email}
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: GL,
            color: G,
            padding: '6px 16px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            marginTop: 12,
          }}>
            <i className="bi bi-briefcase" style={{ fontSize: 12 }}></i>
            {position}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          padding: '0 32px 32px',
        }}>
          {/* Total Projects */}
          <div style={{
            background: '#f7fafc',
            borderRadius: 20,
            padding: 24,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 16,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(255, 193, 7, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <i className="bi bi-folder" style={{ fontSize: 18, color: '#ffc107' }}></i>
            </div>
            <div style={{
              marginTop: 48,
              fontSize: 36,
              fontWeight: 700,
              color: '#1a202c',
              marginBottom: 4,
            }}>
              {loading ? '-' : stats.totalProjects}
            </div>
            <div style={{
              fontSize: 13,
              color: '#a0aec0',
              fontWeight: 500,
            }}>
              Total Projects
            </div>
          </div>

          {/* Approved Projects */}
          <div style={{
            background: '#f7fafc',
            borderRadius: 20,
            padding: 24,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 16,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(76, 175, 80, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <i className="bi bi-check-circle" style={{ fontSize: 18, color: '#4caf50' }}></i>
            </div>
            <div style={{
              marginTop: 48,
              fontSize: 36,
              fontWeight: 700,
              color: '#1a202c',
              marginBottom: 4,
            }}>
              {loading ? '-' : stats.approvedProjects}
            </div>
            <div style={{
              fontSize: 13,
              color: '#a0aec0',
              fontWeight: 500,
            }}>
              Approved
            </div>
          </div>

          {/* Most Common Line of Business */}
          <div style={{
            background: '#f7fafc',
            borderRadius: 20,
            padding: 24,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 16,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(33, 150, 243, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <i className="bi bi-bar-chart" style={{ fontSize: 18, color: '#2196f3' }}></i>
            </div>
            <div style={{
              marginTop: 48,
              fontSize: stats.mostCommonLineBusiness.length > 20 ? 14 : 18,
              fontWeight: 700,
              color: '#1a202c',
              marginBottom: 4,
              lineHeight: 1.2,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {loading ? '-' : stats.mostCommonLineBusiness}
            </div>
            <div style={{
              fontSize: 13,
              color: '#a0aec0',
              fontWeight: 500,
            }}>
              Most Used ({loading ? '0' : stats.lineBusinessPercentage}%)
            </div>
          </div>

          {/* Average Completion Time */}
          <div style={{
            background: '#f7fafc',
            borderRadius: 20,
            padding: 24,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 16,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(156, 39, 176, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <i className="bi bi-clock-history" style={{ fontSize: 18, color: '#9c27b0' }}></i>
            </div>
            <div style={{
              marginTop: 48,
              fontSize: 36,
              fontWeight: 700,
              color: '#1a202c',
              marginBottom: 4,
            }}>
              {loading ? '-' : stats.avgCompletionTime}
            </div>
            <div style={{
              fontSize: 13,
              color: '#a0aec0',
              fontWeight: 500,
            }}>
              Avg. Time
            </div>
          </div>
        </div>

        {/* Logout button */}
        <div style={{ padding: '0 32px 32px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: '#fff',
              border: '2px solid #fee2e2',
              borderRadius: 16,
              color: '#dc2626',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'all .2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.borderColor = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.borderColor = '#fee2e2';
            }}
          >
            <i className="bi bi-box-arrow-right" style={{ fontSize: 16 }}></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
