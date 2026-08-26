import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ChangePasswordCard from '../components/common/ChangePasswordCard';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Users,
  Building,
  Clock,
  Eye,
  Search,
  LogOut,
  MapPin,
  TrendingUp,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  BarChart2,
  Menu,
  X,
  UserPlus,
  Trash2,
  Shield,
  Key,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, apiRequest } from '../services/api';
import { formatPrice, formatArea } from '../utils/formatters';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'properties' | 'users' | 'analytics'
  const [pendingProps, setPendingProps] = useState([]);
  const [allProps, setAllProps] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0,
    total_owners: 0,
    total_properties: 0,
    pending_approval: 0,
    approved_properties: 0,
    total_enquiries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'USER',
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [pending, all, users, st] = await Promise.all([
        adminAPI.getPending().catch(() => []),
        apiRequest('/admin/properties').catch(() => []),
        adminAPI.getUsers().catch(() => []),
        adminAPI.getStats().catch(() => ({})),
      ]);
      setPendingProps(pending);
      setAllProps(all);
      setUsersList(users);
      setStats(st);
    } catch (err) {
      console.error('Error loading admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApprove = async (propertyId) => {
    setActionLoading(`approve-${propertyId}`);
    try {
      await adminAPI.approve(propertyId);
      loadAdminData();
      alert('✓ Property approved! It is now live on the public marketplace.');
    } catch (err) {
      alert(err.message || 'Failed to approve property.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (propertyId) => {
    if (!window.confirm('Are you sure you want to reject this property listing?')) return;
    setActionLoading(`reject-${propertyId}`);
    try {
      await adminAPI.reject(propertyId);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to reject property.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setCreateUserLoading(true);
    setCreateUserError('');
    try {
      await adminAPI.createUser(newUserForm);
      setShowAddUserModal(false);
      setNewUserForm({ name: '', email: '', phone: '', password: '', role: 'USER' });
      loadAdminData();
      alert('✓ Account created successfully!');
    } catch (err) {
      setCreateUserError(err.message || 'Failed to create user account.');
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === user?.id) {
      alert('You cannot delete your own administrator account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user ${userEmail}? This action is irreversible.`)) return;

    try {
      await adminAPI.deleteUser(userId);
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
      loadAdminData();
      alert(`User ${userEmail} was deleted successfully.`);
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update role.');
    }
  };

  const handleToggleVerification = async (userId, userName, currentStatus) => {
    try {
      const updated = await adminAPI.toggleVerification(userId);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_verified: updated.is_verified } : u))
      );
      loadAdminData();
      alert(`✓ ${userName} verification status updated to: ${updated.is_verified ? 'VERIFIED PARTNER' : 'UNVERIFIED'}`);
    } catch (err) {
      alert(err.message || 'Failed to update verification status.');
    }
  };

  const handleRunCleanup = async () => {
    if (!window.confirm('Run 10-day automated cleanup? Any owner account older than 10 days that remains unverified will be deleted and their properties safely archived.')) return;
    try {
      const res = await adminAPI.cleanupUnverified();
      loadAdminData();
      alert(`✓ Cleanup completed: ${res.total_unverified_owners_removed} expired unverified owner account(s) removed.`);
    } catch (err) {
      alert(err.message || 'Failed to run cleanup.');
    }
  };

  const filteredProperties = allProps.filter((p) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      p.title.toLowerCase().includes(term) ||
      p.address.toLowerCase().includes(term) ||
      p.city.toLowerCase().includes(term) ||
      p.property_type.toLowerCase().includes(term)
    );
  });

  const filteredUsers = usersList.filter((u) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term) ||
      (u.phone && u.phone.includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row">
      {/* ─── Mobile Header ─── */}
      <div className="md:hidden bg-navy-900 text-white p-4 flex items-center justify-between border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center">
            <img src="/favicon.png" alt="Bhilwara Housing" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-xs tracking-wider uppercase">Bhilwara Housing</span>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-white/80">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-navy-900 text-white flex flex-col justify-between p-6 z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-3 mb-8 group">
            <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center shadow group-hover:scale-105 transition-transform">
              <img src="/favicon.png" alt="Bhilwara Housing" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-bold text-xs tracking-wider uppercase">Bhilwara Housing</p>
              <p className="text-[10px] text-indigo-300 font-semibold">Admin Control Panel</p>
            </div>
          </Link>

          {/* Admin Identity */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-sm">
              🛡️
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-xs truncate text-white">{user?.name || 'Administrator'}</p>
              <p className="text-[11px] text-indigo-300 font-semibold uppercase">Super Admin</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {[
              { id: 'pending', label: 'Pending Approvals', icon: Clock, count: pendingProps.length, badgeColor: 'bg-amber-500 text-white' },
              { id: 'properties', label: 'All Listings', icon: Building, count: allProps.length },
              { id: 'users', label: 'Users & Owners', icon: Users, count: usersList.length },
              { id: 'analytics', label: 'Platform Stats', icon: BarChart2 },
              { id: 'settings', label: 'Security & Password', icon: Key },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSearchFilter('');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-md'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        item.badgeColor || (isActive ? 'bg-white text-indigo-900' : 'bg-white/15 text-white')
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-white/10 space-y-2">
          <Link
            to="/properties"
            className="flex items-center gap-2.5 text-xs text-white/60 hover:text-gold-400 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Eye size={14} /> Public Website
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full flex items-center gap-2.5 text-xs text-red-300 hover:text-red-200 py-2 px-3 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl w-full mx-auto">
        {/* Top Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                Platform Admin
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-navy-900">
              System Administration
            </h1>
            <p className="text-gray-500 text-xs mt-1">Review owner listings, moderate users, and manage platform growth</p>
          </div>
        </div>

        {/* Metric Cards Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registered Buyers</p>
            <p className="font-serif text-3xl font-bold text-navy-900 mt-1">{stats.total_users || 0}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gold-600 uppercase tracking-wider">Property Owners</p>
            <p className="font-serif text-3xl font-bold text-gold-600 mt-1">{stats.total_owners || 0}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-navy-900 uppercase tracking-wider">Total Listings</p>
            <p className="font-serif text-3xl font-bold text-navy-900 mt-1">{stats.total_properties || 0}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm bg-amber-50/40">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Review</p>
            <p className="font-serif text-3xl font-bold text-amber-700 mt-1">{stats.pending_approval || pendingProps.length}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Live Approved</p>
            <p className="font-serif text-3xl font-bold text-green-600 mt-1">{stats.approved_properties || 0}</p>
          </div>
        </div>

        {/* ─── TAB 1: PENDING APPROVALS QUEUE ─── */}
        {activeTab === 'pending' && (
          <div className="space-y-6 animate-slideUp">
            <div>
              <h2 className="font-serif text-xl font-bold text-navy-900 flex items-center gap-2">
                Pending Approval Queue
                {pendingProps.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {pendingProps.length} Action Needed
                  </span>
                )}
              </h2>
              <p className="text-gray-500 text-xs">Verify listing details before publishing to the live marketplace</p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div key={n} className="bg-white p-8 rounded-2xl border border-gray-200 animate-pulse h-48" />
                ))}
              </div>
            ) : pendingProps.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
                <CheckCircle2 size={36} className="text-green-500 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-navy-900 mb-1">Queue is Clear!</h3>
                <p className="text-gray-500 text-xs max-w-sm mx-auto">
                  All submitted properties have been reviewed. New listings from property owners will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingProps.map((prop) => {
                  const coverImg =
                    prop.images?.[0]?.image_url ||
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';
                  return (
                    <div
                      key={prop.id}
                      className="bg-white rounded-3xl p-6 border border-amber-200 shadow-md flex flex-col lg:flex-row gap-6 items-start justify-between"
                    >
                      {/* Image Preview */}
                      <div className="w-full lg:w-72 aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200 relative">
                        <img src={coverImg} alt={prop.title} className="w-full h-full object-cover" />
                        <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                          Pending Review
                        </span>
                      </div>

                      {/* Listing Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-navy-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                            {prop.property_type}
                          </span>
                          <span className="bg-gold-400 text-navy-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                            For {prop.listing_type}
                          </span>
                        </div>

                        <h3 className="font-serif text-xl font-bold text-navy-900">{prop.title}</h3>

                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          <MapPin size={13} className="text-gold-500 shrink-0" />
                          {prop.address}, {prop.city}
                        </p>

                        <div className="flex items-center gap-4 text-xs font-semibold text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <span className="font-serif text-navy-900 font-bold text-sm">
                            {formatPrice(prop.price, prop.listing_type)}
                          </span>
                          <span>•</span>
                          <span>{prop.bedrooms} BHK</span>
                          <span>•</span>
                          <span>{formatArea(prop.area)}</span>
                          <span>•</span>
                          <span>{prop.furnished}</span>
                        </div>

                        <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
                          {prop.description}
                        </p>
                      </div>

                      {/* Approve / Reject Actions */}
                      <div className="w-full lg:w-48 flex flex-row lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                        <button
                          onClick={() => handleApprove(prop.id)}
                          disabled={actionLoading === `approve-${prop.id}`}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow"
                        >
                          <CheckCircle2 size={15} /> Approve & Publish
                        </button>

                        <button
                          onClick={() => handleReject(prop.id)}
                          disabled={actionLoading === `reject-${prop.id}`}
                          className="flex-1 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold text-xs py-2.5 rounded-xl border border-red-200 hover:border-red-600 flex items-center justify-center gap-2 transition-colors"
                        >
                          <XCircle size={15} /> Reject Listing
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: ALL PROPERTIES ─── */}
        {activeTab === 'properties' && (
          <div className="space-y-6 animate-slideUp">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-navy-900">All Properties Directory</h2>
                <p className="text-gray-500 text-xs">Full platform inventory across all statuses</p>
              </div>

              {/* Search box */}
              <div className="relative max-w-xs w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search listings…"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="input-field text-xs pl-9 py-2"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200 font-bold">
                    <tr>
                      <th className="p-4">Property</th>
                      <th className="p-4">Owner</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProperties.map((prop) => (
                      <tr key={prop.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-4 font-bold text-navy-900">
                          <p className="line-clamp-1">{prop.title}</p>
                          <p className="text-gray-400 text-[11px] font-normal">{prop.address}, {prop.city}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-navy-900 text-[11px]">
                            {prop.owner_name || 'Owner #' + prop.owner_id}
                          </p>
                          {prop.is_owner_verified ? (
                            <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 size={10} /> Verified
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">
                              Registered Owner
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-gray-600 font-semibold">{prop.property_type}</td>
                        <td className="p-4 font-serif font-bold text-navy-900">{formatPrice(prop.price, prop.listing_type)}</td>
                        <td className="p-4">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                              prop.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700'
                                : prop.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {prop.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            to={`/properties/${prop.id}`}
                            className="inline-block p-2 bg-gray-100 hover:bg-navy-900 hover:text-white rounded-lg text-gray-600 transition-colors"
                          >
                            <Eye size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: USERS & OWNERS DIRECTORY (WITH ADD & DELETE USER ACTIONS) ─── */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-slideUp">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-navy-900">Platform Accounts Directory</h2>
                <p className="text-gray-500 text-xs">Manage, verify, and monitor registered buyers, property owners, and administrators</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search box */}
                <div className="relative max-w-xs w-full">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search accounts…"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="input-field text-xs pl-9 py-2"
                  />
                </div>

                {/* 10-Day Cleanup Button */}
                <button
                  onClick={handleRunCleanup}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition-colors shrink-0"
                  title="Run 10-day automated cleanup for unverified owner accounts"
                >
                  <Clock size={13} /> 10-Day Cleanup
                </button>

                {/* + Add User Button */}
                <button
                  onClick={() => {
                    setCreateUserError('');
                    setShowAddUserModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition-colors shrink-0"
                >
                  <UserPlus size={14} /> Add User
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200 font-bold">
                    <tr>
                      <th className="p-4">Account Holder</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Verification Status</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Joined Date</th>
                      <th className="p-4 text-right">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((u) => {
                      const daysAgo = Math.floor((new Date() - new Date(u.created_at)) / (1000 * 60 * 60 * 24));
                      const daysRemaining = Math.max(0, 10 - daysAgo);

                      return (
                        <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-4 font-bold text-navy-900 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {u.name ? u.name[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <p className="flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {u.role === 'OWNER' && u.is_verified && (
                                  <span className="text-green-600" title="Verified Owner Tick">✓</span>
                                )}
                              </p>
                              {u.id === user?.id && (
                                <span className="text-[10px] text-indigo-600 font-semibold">(You)</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-gray-600 font-mono text-[11px]">{u.email}</td>
                          <td className="p-4">
                            {/* Role Selector Dropdown */}
                            <select
                              value={u.role}
                              disabled={u.id === user?.id}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase cursor-pointer border focus:outline-none ${
                                u.role === 'ADMIN'
                                  ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                  : u.role === 'OWNER'
                                  ? 'bg-gold-100 text-gold-800 border-gold-200'
                                  : 'bg-blue-100 text-blue-800 border-blue-200'
                              }`}
                            >
                              <option value="USER">Buyer (USER)</option>
                              <option value="OWNER">Owner (OWNER)</option>
                              <option value="ADMIN">Admin (ADMIN)</option>
                            </select>
                          </td>

                          {/* Verification Status Column with 1-click Verifier */}
                          <td className="p-4">
                            {u.role === 'OWNER' ? (
                              <div className="flex items-center gap-2">
                                {u.is_verified ? (
                                  <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                    <CheckCircle2 size={12} className="text-green-600" /> Verified Partner
                                  </span>
                                ) : (
                                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1" title={`${daysRemaining} days remaining before 10-day auto cleanup`}>
                                    <AlertCircle size={12} className="text-amber-600" />
                                    Unverified ({daysRemaining}d left)
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleToggleVerification(u.id, u.name, u.is_verified)}
                                  className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors border ${
                                    u.is_verified
                                      ? 'bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-700 border-gray-200 hover:border-red-200'
                                      : 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                  }`}
                                  title={u.is_verified ? "Revoke Verification" : "Verify Owner Account"}
                                >
                                  {u.is_verified ? 'Revoke' : '✓ Verify Owner'}
                                </button>
                              </div>
                            ) : u.role === 'ADMIN' ? (
                              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                Administrator
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[11px]">
                                Active Buyer
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-gray-500">{u.phone || '—'}</td>
                          <td className="p-4 text-gray-400">
                            {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="p-4 text-right">
                            {u.id !== user?.id && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="p-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg transition-colors"
                                title="Delete Account"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: ANALYTICS ─── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-slideUp">
            <div>
              <h2 className="font-serif text-xl font-bold text-navy-900">Platform Health & Insights</h2>
              <p className="text-gray-500 text-xs">Real-time breakdown of marketplace metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-navy-900 text-sm">Marketplace Ratio</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Properties For Buy:</span>
                    <span className="font-bold text-navy-900">80%</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Properties For Rent:</span>
                    <span className="font-bold text-navy-900">20%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-navy-900 text-sm">Top Locations</h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <p>1. Shastri Nagar, Bhilwara</p>
                  <p>2. RC Vyas Colony, Bhilwara</p>
                  <p>3. Subhash Nagar, Bhilwara</p>
                  <p>4. Tilak Nagar, Bhilwara</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-navy-900 text-sm">System Health</h3>
                <div className="space-y-2 text-xs text-green-700">
                  <p className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 size={14} /> FastAPI API Online (Port 8000)
                  </p>
                  <p className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 size={14} /> PostgreSQL Engine Ready
                  </p>
                  <p className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 size={14} /> JWT Auth Active
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 5: SECURITY & SETTINGS ─── */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-xl animate-slideUp">
            <div>
              <h2 className="font-serif text-2xl font-bold text-navy-900 dark:text-white">Admin Security & Settings</h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Manage system administrator authentication and update password</p>
            </div>

            <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Administrator Account</p>
                <p className="text-sm font-bold text-navy-900 dark:text-white font-mono">{user?.email || 'bhilwarahousing@gmail.com'}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Role & Authority</p>
                <span className="inline-block bg-indigo-500/20 text-indigo-300 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-500/30">
                  🛡️ System Administrator (SUPER_ADMIN)
                </span>
              </div>
            </div>

            {/* Reusable Change Password Card */}
            <ChangePasswordCard />
          </div>
        )}
      </main>

      {/* ─── ADD USER MODAL (ADMIN ONLY) ─── */}
      {showAddUserModal && (
        <div className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-900/70 backdrop-blur-sm" onClick={() => setShowAddUserModal(false)} />
          <div className="modal-panel relative w-full max-w-md bg-white rounded-3xl p-7 shadow-2xl border border-gray-200 z-10 animate-slideUp">
            <button
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UserPlus size={18} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-navy-900">Add Platform Account</h3>
                <p className="text-gray-500 text-xs">Create a new Buyer, Property Owner, or Admin</p>
              </div>
            </div>

            {createUserError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{createUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="user@domain.com"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  placeholder="+91 94600 00000"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Temporary password (min 6 characters)"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Account Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'USER', label: 'Buyer' },
                    { role: 'OWNER', label: 'Owner' },
                    { role: 'ADMIN', label: 'Admin' },
                  ].map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setNewUserForm({ ...newUserForm, role: r.role })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        newUserForm.role === r.role
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow transition-colors disabled:opacity-60"
                >
                  {createUserLoading ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
