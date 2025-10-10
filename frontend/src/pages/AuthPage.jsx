import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

const AuthPage = () => {
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  });

  const { login, register, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Initialize with sign-in state
    setTimeout(() => {
      // This ensures the initial animation triggers
    }, 200);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!isSignUpMode) {
        // Login - send identifier field to backend
        await login({
          identifier: formData.username,
          password: formData.password
        });
        navigate('/');
      } else {
        // Registration validation
        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match');
          return;
        }
        if (formData.password.length < 6) {
          alert('Password must be at least 6 characters long');
          return;
        }

        const { confirmPassword, ...registerData } = formData;
        registerData.password_confirm = confirmPassword;
        console.log('Registration data being sent:', registerData);
        const response = await register(registerData);

        // Show success message and switch to login mode
        setSuccessMessage(response.message);
        setIsSignUpMode(false);
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          first_name: '',
          last_name: ''
        });
      }
    } catch (error) {
      // Error is handled in AuthContext
    }
  };

  const toggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setError(null);
    setSuccessMessage('');
    // Clear form data when switching
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: ''
    });
  };

  return (
    <div className={`auth-page-container ${!isSignUpMode ? 'sign-in' : 'sign-up'}`}>
      <div className="auth-container">
        {/* SIGN UP */}
        <div className="auth-col align-items-center flex-col sign-up">
          <div className="form-wrapper align-items-center">
            <div className="auth-form sign-up">
              <div className="auth-brand">
                <h4>Property Review Maker</h4>
              </div>

              {error && isSignUpMode && (
                <div className="alert alert-error">
                  <i className="bi bi-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <i className="bi bi-person"></i>
                  <input
                    type="text"
                    placeholder="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <i className="bi bi-envelope"></i>
                  <input
                    type="email"
                    placeholder="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <i className="bi bi-person"></i>
                  <input
                    type="text"
                    placeholder="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="input-group">
                  <i className="bi bi-person"></i>
                  <input
                    type="text"
                    placeholder="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="input-group">
                  <i className="bi bi-lock"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                  />
                  <i
                    className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} password-toggle`}
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: 'pointer', marginLeft: 'auto' }}
                  ></i>
                </div>
                <div className="input-group">
                  <i className="bi bi-lock"></i>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <i
                    className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'} password-toggle`}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ cursor: 'pointer', marginLeft: 'auto' }}
                  ></i>
                </div>
                <button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border-sm"></span>
                      Creating Account...
                    </>
                  ) : (
                    'Sign up'
                  )}
                </button>
                <p>
                  <span>Already have an account?</span>
                  <b onClick={toggleMode} className="pointer">
                    Sign in here
                  </b>
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* SIGN IN */}
        <div className="auth-col align-items-center flex-col sign-in">
          <div className="form-wrapper align-items-center">
            <div className="auth-form sign-in">
              <div className="auth-brand">
                <h4>Property Review Maker</h4>
              </div>

              {error && !isSignUpMode && (
                <div className="alert alert-error">
                  <i className="bi bi-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              {successMessage && !isSignUpMode && (
                <div className="alert alert-success">
                  <i className="bi bi-check-circle"></i>
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <i className="bi bi-person"></i>
                  <input
                    type="text"
                    placeholder="Email or Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <i className="bi bi-lock"></i>
                  <input
                    type="password"
                    placeholder="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border-sm"></span>
                      Signing In...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
                <p>
                  <b>Forgot password?</b>
                </p>
                <p>
                  <span>Don't have an account?</span>
                  <b onClick={toggleMode} className="pointer">
                    Sign up here
                  </b>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="content-row">
        {/* SIGN IN CONTENT */}
        <div className="auth-col align-items-center flex-col">
          <div className="auth-text sign-in">
            <h2>Welcome back!</h2>
          </div>
        </div>

        {/* SIGN UP CONTENT */}
        <div className="auth-col align-items-center flex-col">
          <div className="auth-text sign-up">
            <h2>Join us!</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;