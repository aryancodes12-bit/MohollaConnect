import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Save, X, Store, ShieldCheck, Sparkles, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const roleBadge = (role) => {
  switch (role) {
    case 'SELLER':
      return { cls: 'badge-seller', label: 'Verified Mohalla Seller', icon: Store };
    case 'PENDING_SELLER':
      return { cls: 'badge-pending', label: 'Pending Seller Approval', icon: Sparkles };
    case 'ADMIN':
      return { cls: 'badge-admin', label: 'System Admin', icon: ShieldCheck };
    default:
      return { cls: 'badge-buyer', label: 'Buyer', icon: Store };
  }
};

export default function UserProfile() {
  const toast = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/profile');
      setProfile(res.data);
      setFormData({ name: res.data.name, email: res.data.email });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/profile', formData);
      setProfile(res.data);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return <p className="text-center text-indigo/50 py-12">Loading your profile...</p>;
  }

  if (!profile) {
    return <p className="text-center text-saffron py-12">Profile not found.</p>;
  }

  const badge = roleBadge(profile.role);
  const BadgeIcon = badge.icon;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="border-b border-clay/15 pb-4">
        <h1 className="font-display text-3xl text-indigo">My Profile</h1>
        <p className="text-sm text-indigo/70">Your LocalConnect identity across the Mohalla.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-warmwhite foil-border shadow-warm rounded-2xl p-6 md:p-8 jali-bg space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-clay/15 text-clay flex items-center justify-center font-display text-2xl">
              {profile.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="font-display text-xl text-indigo leading-tight">{profile.name}</h2>
              <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge.cls}`}>
                <BadgeIcon className="w-3 h-3" /> {badge.label}
              </span>
            </div>
          </div>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-2 rounded-lg text-clay hover:bg-clay/10 transition-colors"
              aria-label="Edit profile"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>

        {!editing ? (
          <div className="space-y-4 divide-y divide-clay/10">
            <div className="pt-2 first:pt-0">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-clay/70">Full Name</p>
              <p className="text-base text-indigo mt-0.5">{profile.name}</p>
            </div>
            <div className="pt-4">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-clay/70">Email Address</p>
              <p className="text-base text-indigo mt-0.5">{profile.email}</p>
            </div>

            {profile.store && (
              <div className="pt-4">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-clay/70 mb-2">
                  Associated Store
                </p>
                <div className="bg-ivory rounded-xl p-4 border border-clay/10 space-y-1">
                  <p className="text-sm text-indigo"><span className="font-semibold">{profile.store.storeName}</span></p>
                  <p className="text-xs text-indigo/60">{profile.store.location} &bull; {profile.store.category}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-indigo/80 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-clay/20 bg-ivory/60 text-sm text-indigo focus:outline-none focus:ring-2 focus:ring-clay/40 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo/80 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-clay/20 bg-ivory/60 text-sm text-indigo focus:outline-none focus:ring-2 focus:ring-clay/40 transition-all"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-clay hover:bg-saffron text-warmwhite text-sm font-semibold transition-all shadow-warm"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormData({ name: profile.name, email: profile.email });
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-clay/20 text-indigo/70 text-sm font-medium hover:bg-clay/5 transition-all"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </form>
        )}
        {/* Account Actions / Logout */}
        <div className="pt-6 border-t border-clay/10 flex items-center justify-between">
          <span className="text-xs text-indigo/60">Logged in as {profile.email}</span>
          <button
            type="button"
            onClick={async () => {
              await logout();
              toast.info('You have been logged out.');
              navigate('/login');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-saffron/10 hover:bg-saffron text-saffron hover:text-warmwhite text-xs font-bold transition-all border border-saffron/20 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out / Logout
          </button>
        </div>
      </motion.div>
    </div>
  );
}
