// src/pages/NotFound.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../logo.svg';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="container fade-in not-found notfound-card">
      <img src={logo} alt="Uday Devops logo" className="logo" />
      <p className="notfound-brand">Uday Devops</p>

      <h1 className="notfound-code">404</h1>
      <h2 className="notfound-title">Page Not Found</h2>
      <p className="notfound-text">
        The page you are looking for does not exist, or may have been moved.
      </p>

      <div className="notfound-actions">
        <Link to="/login">
          <button>Go to Login</button>
        </Link>
        <button
          type="button"
          className="btn-outline"
          onClick={() => navigate(-1)}
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}

export default NotFound;
