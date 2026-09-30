// src/pages/Register.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../logo.svg';
import '../register-extra.css';

// Simple password strength score: 0 (empty) to 4 (strong)
function getStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.max(score, 1);
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const strength = getStrength(form.password);
  const mismatch = confirm.length > 0 && confirm !== form.password;

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (form.password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container register-card fade-in">
        <div className="register-brand">
          <img src={logo} alt="logo" className="logo" />
          <h1 className="register-brand-name">Uday Devops</h1>
          <p className="register-brand-sub">Create your account in seconds</p>
        </div>

        <h2 className="register-heading">Register</h2>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="name">Name</label>
          <input
            id="name"
            className="form-field"
            name="name"
            placeholder="Your full name"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
            required
          />

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
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
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

          {form.password && (
            <div className="strength" aria-live="polite">
              <div className="strength-bar">
                <span className={`strength-fill strength-${strength}`} />
              </div>
              <span className="strength-label">{STRENGTH_LABELS[strength]}</span>
            </div>
          )}

          <label className="field-label" htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            className={`form-field${mismatch ? ' field-invalid' : ''}`}
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-enter your password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          {mismatch && <p className="field-hint">Passwords do not match yet.</p>}

          <button type="submit" className="register-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="register-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
