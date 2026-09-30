// src/pages/Login.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../logo.svg';

function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Pre-fill email if the user chose "Remember my email" last time
  const savedEmail = (() => {
    try {
      return localStorage.getItem('rememberedEmail') || '';
    } catch {
      return '';
    }
  })();

  const [form, setForm] = useState({ email: savedEmail, password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(Boolean(savedEmail));

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      try {
        if (remember) localStorage.setItem('rememberedEmail', form.email);
        else localStorage.removeItem('rememberedEmail');
      } catch {
        /* storage unavailable – ignore */
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container login-card fade-in">
        <div className="login-brand">
          <img src={logo} alt="logo" className="logo" />
          <h1 className="login-brand-name">Uday Devops</h1>
          <p className="login-brand-sub">Sign in to manage your users</p>
        </div>

        <h2 className="login-heading">Login</h2>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="form-field"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <label className="field-label" htmlFor="password">Password</label>
          <div className="password-wrap">
            <input
              id="password"
              className="form-field"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="toggle-pass"
              onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <label className="remember-row">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            Remember my email
          </label>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <div className="login-tip">
          Tip: use a strong password and never share your credentials. For access
          requests contact <a href="mailto:8294179632uk@gmail.com">support</a>.
        </div>
        <p className="login-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
