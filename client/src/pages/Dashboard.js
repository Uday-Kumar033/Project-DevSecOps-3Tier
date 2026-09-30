// src/pages/Dashboard.js
import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from '../axios';
import { AuthContext } from '../context/AuthContext';

const PAGE_SIZE = 5;

function Dashboard() {
  const { user, logout, token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // New UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'id', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', text }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/users', {
        headers: { Authorization: token },
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Fetch users failed:', err);
      setToast({ type: 'error', text: 'Could not load users' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(
        '/users',
        { ...formData, role: 'viewer' },
        { headers: { Authorization: token } }
      );
      setFormData({ name: '', email: '', password: '' });
      setToast({ type: 'success', text: 'Viewer user added successfully' });
      fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err);
      setToast({ type: 'error', text: 'User creation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  // Search + sort + paginate
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? users.filter(
          (u) =>
            String(u.id).includes(q) ||
            (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q)
        )
      : users;

    return [...list].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av ?? '').localeCompare(String(bv ?? ''), undefined, { sensitivity: 'base' });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [users, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const sortIcon = (key) => (sort.key === key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '');

  const initials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('') || '?';

  return (
    <div className="container dashboard fade-in">
      {/* ---------- Header / Brand ---------- */}
      <div className="header">
        <div className="dash-brand">
          <span className="dash-brand-badge">UD</span>
          <div>
            <h2 className="dash-title">Uday Devops</h2>
            <p className="dash-subtitle">User Manager · React + Node + MySQL</p>
          </div>
        </div>
        <div className="dash-user">
          <span className="avatar">{initials(user?.name)}</span>
          <span>
            {user?.name} <span className="role-badge">{user?.role}</span>
          </span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {/* ---------- Stats ---------- */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total users</span>
          <span className="stat-value">{users.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Matching search</span>
          <span className="stat-value">{filtered.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Your access</span>
          <span className="stat-value stat-value-sm">{user?.role || '—'}</span>
        </div>
      </div>

      {/* ---------- Add user form (visible to all users) ---------- */}
      <h3 className="section-title">Add a new user</h3>
      <form className="user-form" onSubmit={handleAddUser}>
        <input
          className="form-field"
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          className="form-field"
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <div className="password-wrap">
          <input
            className="form-field"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            className="toggle-pass"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add Viewer User'}
        </button>
      </form>

      {/* ---------- Toolbar ---------- */}
      <div className="toolbar">
        <input
          className="form-field search-field"
          type="search"
          placeholder="Search by ID, name or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          aria-label="Search users"
        />
        <button type="button" onClick={fetchUsers} disabled={loading}>
          {loading ? 'Refreshing…' : '⟳ Refresh'}
        </button>
      </div>

      {/* ---------- Table ---------- */}
      <table className="table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => toggleSort('id')}>
              ID{sortIcon('id')}
            </th>
            <th className="sortable" onClick={() => toggleSort('name')}>
              Name{sortIcon('name')}
            </th>
            <th className="sortable" onClick={() => toggleSort('email')}>
              Email{sortIcon('email')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan="4" className="table-empty">Loading users…</td>
            </tr>
          )}

          {!loading && pageRows.length === 0 && (
            <tr>
              <td colSpan="4" className="table-empty">
                {search ? 'No users match your search.' : 'No users yet. Add the first one above.'}
              </td>
            </tr>
          )}

          {!loading &&
            pageRows.map((u) => (
              <tr key={u.id}>
                <td data-label="ID">{u.id}</td>
                <td data-label="Name">
                  <span className="name-cell">
                    <span className="avatar avatar-sm">{initials(u.name)}</span>
                    {u.name}
                  </span>
                </td>
                <td data-label="Email">{u.email}</td>
                <td data-label="Actions">
                  {/* ✅ Only admin sees edit/delete */}
                  {user?.role === 'admin' ? (
                    <>
                      <button>Edit</button> <button>Delete</button>
                    </>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* ---------- Pagination ---------- */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="pagination">
          <button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
            ← Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages}>
            Next →
          </button>
        </div>
      )}

      {/* ---------- Toast ---------- */}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
