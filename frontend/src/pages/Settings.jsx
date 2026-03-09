import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import ImageCropModal from '../components/ImageCropModal';

const G = '#2a7a2a';  // Green
const GD = '#1e5a1e'; // Green Dark

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Profile customization state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [headerPreview, setHeaderPreview] = useState(null);
  const [backgroundType, setBackgroundType] = useState('color');
  const [backgroundColor, setBackgroundColor] = useState('#2a7a2a');
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [backgroundDisplay, setBackgroundDisplay] = useState('fit');

  // Admin panel state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // File input refs
  const avatarInputRef = useRef(null);
  const headerInputRef = useRef(null);
  const backgroundInputRef = useRef(null);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [cropType, setCropType] = useState('avatar'); // 'avatar', 'header', or 'background'
  const [cropConfig, setCropConfig] = useState({ aspectRatio: 1, cropShape: 'round' });

  useEffect(() => {
    loadUserProfile();
    if (user?.is_staff) {
      loadUsers();
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUserProfile();

      // Add cache-busting timestamp to image URLs
      const timestamp = Date.now();
      if (data.avatar_url) {
        data.avatar_url = `${data.avatar_url}?t=${timestamp}`;
      }
      if (data.header_image_url) {
        data.header_image_url = `${data.header_image_url}?t=${timestamp}`;
      }
      if (data.background_image_url) {
        data.background_image_url = `${data.background_image_url}?t=${timestamp}`;
      }

      setProfile(data);

      // Set form values from profile
      if (data.avatar_url) setAvatarPreview(data.avatar_url);
      if (data.header_image_url) setHeaderPreview(data.header_image_url);
      setBackgroundType(data.background_type || 'color');
      setBackgroundColor(data.background_color || '#2a7a2a');
      if (data.background_image_url) setBackgroundPreview(data.background_image_url);
      setBackgroundDisplay(data.background_display || 'fit');
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await apiService.listAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Read file and open crop modal
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result);
      setCropType('avatar');
      setCropConfig({ aspectRatio: 1, cropShape: 'round' }); // Square crop, round display
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleHeaderChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Read file and open crop modal
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result);
      setCropType('header');
      setCropConfig({ aspectRatio: 2, cropShape: 'rect' }); // 2:1 aspect ratio
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleBackgroundImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Read file and open crop modal
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result);
      setCropType('background');
      setCropConfig({ aspectRatio: 16 / 9, cropShape: 'rect' }); // 16:9 aspect ratio
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob) => {
    setCropModalOpen(false);

    // Convert blob to file
    const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });

    try {
      setSaving(true);

      // Show local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        if (cropType === 'avatar') {
          setAvatarPreview(reader.result);
        } else if (cropType === 'header') {
          setHeaderPreview(reader.result);
        } else if (cropType === 'background') {
          setBackgroundPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);

      // Upload and get updated profile data
      let updatedProfile;
      if (cropType === 'avatar') {
        updatedProfile = await apiService.uploadAvatar(file);
        setMessage('Avatar updated successfully!');
      } else if (cropType === 'header') {
        updatedProfile = await apiService.uploadHeaderImage(file);
        setMessage('Header image updated successfully!');
      } else if (cropType === 'background') {
        updatedProfile = await apiService.uploadBackgroundImage(file);
        setBackgroundType('image');
        setMessage('Background image updated successfully!');
      }

      // Update profile state with server response containing new URLs
      if (updatedProfile) {
        setProfile(updatedProfile);
        // Update previews with server URLs
        if (cropType === 'avatar' && updatedProfile.avatar_url) {
          setAvatarPreview(updatedProfile.avatar_url);
        } else if (cropType === 'header' && updatedProfile.header_image_url) {
          setHeaderPreview(updatedProfile.header_image_url);
        } else if (cropType === 'background' && updatedProfile.background_image_url) {
          setBackgroundPreview(updatedProfile.background_image_url);
        }
      }

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage('Error uploading image');
    } finally {
      setSaving(false);
    }
  };

  const handleBackgroundColorChange = async (color) => {
    setBackgroundColor(color);

    try {
      setSaving(true);
      await apiService.updateUserProfile({
        background_type: 'color',
        background_color: color
      });
      setBackgroundType('color');
      setMessage('Background color updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating background:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBackgroundDisplayChange = async (display) => {
    setBackgroundDisplay(display);

    try {
      setSaving(true);
      await apiService.updateUserProfile({
        background_display: display
      });
      setMessage('Background display updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating background display:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRole = async (userId, currentIsStaff) => {
    if (!window.confirm(`${currentIsStaff ? 'Remove' : 'Grant'} admin privileges?`)) return;

    try {
      await apiService.updateUserRole(userId, !currentIsStaff);
      loadUsers(); // Reload users
      setMessage('User role updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage('Error updating user role');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) return;

    try {
      await apiService.deleteUser(userId);
      loadUsers(); // Reload users
      setMessage('User deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage('Error deleting user');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${G} 0%, ${GD} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <div style={{ color: '#fff', fontSize: 18 }}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${G} 0%, ${GD} 100%)`,
      padding: 40
    }}>
      {/* Header */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto 30px',
        display: 'flex',
        alignItems: 'center',
        gap: 20
      }}>
        <button
          onClick={() => navigate('/profile')}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14
          }}
        >
          <i className="bi bi-arrow-left"></i>
          Back to Profile
        </button>

        <h1 style={{ color: '#fff', margin: 0, flex: 1 }}>Account Settings</h1>

        {message && (
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            color: G,
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 14
          }}>
            {message}
          </div>
        )}
      </div>

      {/* Settings Content */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 30
      }}>
        {/* Profile Customization Section */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 30,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ margin: '0 0 20px', color: '#333' }}>Profile Customization</h2>

          {/* Avatar Upload */}
          <div style={{ marginBottom: 30 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, color: '#555' }}>
              Profile Avatar
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                backgroundColor: '#e0e0e0',
                backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: 40
              }}>
                {!avatarPreview && <i className="bi bi-person-fill"></i>}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={saving}
                style={{
                  background: G,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 8,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Uploading...' : 'Upload Avatar'}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Header Image Upload */}
          <div style={{ marginBottom: 30 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, color: '#555' }}>
              Header Image
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 200,
                height: 100,
                borderRadius: 8,
                backgroundColor: '#e0e0e0',
                backgroundImage: headerPreview ? `url(${headerPreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: 40
              }}>
                {!headerPreview && <i className="bi bi-image"></i>}
              </div>
              <button
                onClick={() => headerInputRef.current?.click()}
                disabled={saving}
                style={{
                  background: G,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 8,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Uploading...' : 'Upload Header'}
              </button>
              <input
                ref={headerInputRef}
                type="file"
                accept="image/*"
                onChange={handleHeaderChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Background Customization */}
          <div style={{ marginBottom: 30 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, color: '#555' }}>
              Background
            </label>

            {/* Background Type Toggle */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
              <button
                onClick={() => setBackgroundType('color')}
                style={{
                  background: backgroundType === 'color' ? G : '#e0e0e0',
                  color: backgroundType === 'color' ? '#fff' : '#666',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Solid Color
              </button>
              <button
                onClick={() => setBackgroundType('image')}
                style={{
                  background: backgroundType === 'image' ? G : '#e0e0e0',
                  color: backgroundType === 'image' ? '#fff' : '#666',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Image
              </button>
            </div>

            {/* Color Picker */}
            {backgroundType === 'color' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                  style={{
                    width: 60,
                    height: 60,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                />
                <span style={{ color: '#666' }}>{backgroundColor}</span>
              </div>
            )}

            {/* Image Upload */}
            {backgroundType === 'image' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 15 }}>
                  <div style={{
                    width: 200,
                    height: 100,
                    borderRadius: 8,
                    backgroundColor: '#e0e0e0',
                    backgroundImage: backgroundPreview ? `url(${backgroundPreview})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: 40
                  }}>
                    {!backgroundPreview && <i className="bi bi-image"></i>}
                  </div>
                  <button
                    onClick={() => backgroundInputRef.current?.click()}
                    disabled={saving}
                    style={{
                      background: G,
                      color: '#fff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: 8,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    {saving ? 'Uploading...' : 'Upload Background'}
                  </button>
                  <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Display Options */}
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, color: '#555', fontSize: 14 }}>
                  Display Style
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {['pattern', 'fit', 'fade-down', 'fade-up'].map(display => (
                    <button
                      key={display}
                      onClick={() => handleBackgroundDisplayChange(display)}
                      style={{
                        background: backgroundDisplay === display ? G : '#e0e0e0',
                        color: backgroundDisplay === display ? '#fff' : '#666',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13
                      }}
                    >
                      {display === 'pattern' && 'Pattern (Repeated)'}
                      {display === 'fit' && 'Fit to Screen'}
                      {display === 'fade-down' && 'Fade Down'}
                      {display === 'fade-up' && 'Fade Up'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Admin Panel Section */}
        {user?.is_staff && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 30,
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 20px', color: '#333', display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="bi bi-shield-lock-fill" style={{ color: G }}></i>
              Admin Panel - User Management
            </h2>

            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                Loading users...
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: 12, textAlign: 'left', color: '#666', fontWeight: 600 }}>Username</th>
                      <th style={{ padding: 12, textAlign: 'left', color: '#666', fontWeight: 600 }}>Email</th>
                      <th style={{ padding: 12, textAlign: 'left', color: '#666', fontWeight: 600 }}>Role</th>
                      <th style={{ padding: 12, textAlign: 'left', color: '#666', fontWeight: 600 }}>Joined</th>
                      <th style={{ padding: 12, textAlign: 'center', color: '#666', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: 12 }}>{u.username}</td>
                        <td style={{ padding: 12 }}>{u.email}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{
                            background: u.is_staff ? G : '#e0e0e0',
                            color: u.is_staff ? '#fff' : '#666',
                            padding: '4px 12px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600
                          }}>
                            {u.is_staff ? 'Administrator' : 'Member'}
                          </span>
                        </td>
                        <td style={{ padding: 12, color: '#666', fontSize: 14 }}>
                          {new Date(u.date_joined).toLocaleDateString()}
                        </td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            {u.id !== user.id && (
                              <>
                                <button
                                  onClick={() => handleToggleRole(u.id, u.is_staff)}
                                  style={{
                                    background: u.is_staff ? '#ff9800' : G,
                                    color: '#fff',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontSize: 12
                                  }}
                                  title={u.is_staff ? 'Remove Admin' : 'Make Admin'}
                                >
                                  <i className={`bi bi-${u.is_staff ? 'person' : 'shield-fill-check'}`}></i>
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  style={{
                                    background: '#f44336',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontSize: 12
                                  }}
                                  title="Delete User"
                                >
                                  <i className="bi bi-trash-fill"></i>
                                </button>
                              </>
                            )}
                            {u.id === user.id && (
                              <span style={{ color: '#999', fontSize: 12 }}>You</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Crop Modal */}
      {cropModalOpen && (
        <ImageCropModal
          imageSrc={imageToCrop}
          aspectRatio={cropConfig.aspectRatio}
          cropShape={cropConfig.cropShape}
          onClose={() => setCropModalOpen(false)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

export default Settings;
