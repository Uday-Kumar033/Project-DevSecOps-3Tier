
// src/pages/UserDashboard.js
import React, { useEffect, useState, useContext, useMemo, useRef } from 'react';
import axios from '../axios';
import UserForm from '../components/UserForm';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../userdashboard-extra.css';

const PAGE_SIZE = 5;

function UserDashboard() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const formRef = useRef(null);

  // New UI state
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'id', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', text }
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchUsers();
    }
  }, [user, navigate]);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchUsers = () => {
    setLoading(true);
    axios
      .get('/users') // ✅ Fixed
      .then(res => setUsers(res.data))
      .catch(err => {
        console.error('Fetch Error:', err);
        if (err.response?.status === 401) logout();
        else setToast({ type: 'error', text: 'Could not load users' });
      })
      .finally(() => setLoading(false));
  };

  const handleCreate = (userData) => {
    axios
      .post('/users', userData) // ✅ Fixed
      .then(() => {
        fetchUsers();
        setEditingUser(null);
        setToast({ type: 'success', text: 'User created successfully' });
      })
      .catch(err => {
        console.error('Create Error:', err);
        setToast({ type: 'error', text: 'Could not create user' });
      });
  };

  const handleUpdate = (id, userData) => {
    if (user?.role !== 'admin') return;
    axios
      .put(`/users/${id}`, userData) // ✅ Fixed
      .then(() => {
        fetchUsers();
        setEditingUser(null);
        setToast({ type: 'success', text: 'User updated successfully' });
      })
      .catch(err => {
        console.error('Update Error:', err);
        setToast({ type: 'error', text: 'Could not update user' });
      });
  };

  const handleDelete = (id) => {
    if (user?.role !== 'admin') return;
    axios
      .delete(`/users/${id}`) // ✅ Fixed
      .then(() => {
        fetchUsers();
        setToast({ type: 'success', text: 'User deleted' });
      })
      .catch(err => {
        console.error('Delete Error:', err);
        setToast({ type: 'error', text: 'Could not delete user' });
      });
  };

  const handleEditClick = (selectedUser) => {
    if (user?.role === 'admin') {
      setEditingUser(selectedUser);
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) handleDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  // Search + sort + paginate
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? users.filter(
          u =>
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
    setSort(prev =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const sortIcon = (key) => (sort.key === key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '');

  const initials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('') || '?';

  return (
    <div className="container ud-page fade-in">
      {/* ---------- Header / Brand ---------- */}
      <div className="header">
        <div className="ud-brand">
          <span className="ud-brand-badge">UD</span>
          <div>
            <h2 className="ud-title">Uday Devops</h2>
            <p className="ud-subtitle">User Manager · React + Node + MySQL</p>
          </div>
        </div>
        <div className="ud-user">
          <span className="ud-avatar">{initials(user?.name)}</span>
          <span>
            <b>{user?.name}</b> <span className="ud-role">{user?.role}</span>
          </span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {/* ---------- Stats ---------- */}
      <div className="ud-stats">
        <div className="ud-stat">
          <span className="ud-stat-label">Total users</span>
          <span className="ud-stat-value">{users.length}</span>
        </div>
        <div className="ud-stat">
          <span className="ud-stat-label">Matching search</span>
          <span className="ud-stat-value">{filtered.length}</span>
        </div>
        <div className="ud-stat">
          <span className="ud-stat-label">Your access</span>
          <span className="ud-stat-value ud-stat-sm">{user?.role || '—'}</span>
        </div>
      </div>

      {/* ---------- Form (admin + viewer) ---------- */}
      {(user?.role === 'admin' || user?.role === 'viewer') && (
        <div ref={formRef} className="ud-form-wrap">
          <h3 className="ud-section">
            {editingUser && user?.role === 'admin' ? `Editing ${editingUser.name}` : 'Add a new user'}
          </h3>
          <UserForm
            onSubmit={
              editingUser && user?.role === 'admin'
                ? (data) => handleUpdate(editingUser.id, data)
                : handleCreate
            }
            user={editingUser && user?.role === 'admin' ? editingUser : null}
            onCancel={() => setEditingUser(null)}
          />
        </div>
      )}

      {/* ---------- Toolbar ---------- */}
      <div className="ud-toolbar">
        <input
          className="form-field ud-search"
          type="search"
          placeholder="Search by ID, name or email…"
          value={search}
          onChange={e => {
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
            <th className="ud-sortable" onClick={() => toggleSort('id')}>ID{sortIcon('id')}</th>
            <th className="ud-sortable" onClick={() => toggleSort('name')}>Name{sortIcon('name')}</th>
            <th className="ud-sortable" onClick={() => toggleSort('email')}>Email{sortIcon('email')}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan="4" className="ud-empty">Loading users…</td>
            </tr>
          )}

          {!loading && pageRows.length === 0 && (
            <tr>
              <td colSpan="4" className="ud-empty">
                {search ? 'No users match your search.' : 'No users yet. Add the first one above.'}
              </td>
            </tr>
          )}

          {!loading &&
            pageRows.map(userData => (
              <tr
                key={userData.id}
                className={editingUser?.id === userData.id ? 'ud-row-editing' : undefined}
              >
                <td data-label="ID">{userData.id}</td>
                <td data-label="Name">
                  <span className="ud-name-cell">
                    <span className="ud-avatar ud-avatar-sm">{initials(userData.name)}</span>
                    {userData.name}
                  </span>
                </td>
                <td data-label="Email">{userData.email}</td>
                <td data-label="Actions">
                  {user?.role === 'admin' ? (
                    <>
                      <button onClick={() => handleEditClick(userData)}>Edit</button>{' '}
                      <button className="ud-btn-danger" onClick={() => setDeleteTarget(userData)}>
                        Delete
                      </button>
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
        <div className="ud-pagination">
          <button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
            ← Prev
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages}>
            Next →
          </button>
        </div>
      )}

      <button
        className="fab"
        aria-label="Go to form"
        onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
      >
        +
      </button>

      {/* ---------- Delete confirmation ---------- */}
      {deleteTarget && (
        <div className="info-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="info-box" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 className="ud-modal-title">Delete user?</h3>
            <p>
              This will permanently remove <b>{deleteTarget.name}</b> ({deleteTarget.email}).
            </p>
            <div className="ud-modal-actions">
              <button className="ud-btn-danger" onClick={confirmDelete}>Yes, delete</button>
              <button className="ud-btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Toast ---------- */}
      {toast && (
        <div className={`ud-toast ud-toast-${toast.type}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
