import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, Users, Calendar, FileText, PhoneCall,
  MapPin, Globe, CheckCircle,
  ArrowLeft, Save, Lock, Eye, EyeOff, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { companyAPI } from '../../lib/api';

export default function CompanyProfilePage() {
  const navigate = useNavigate();
  const { user, company, token, isAuthenticated, isLoading, isCompany } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    companySize: '',
    companyPhone: '',
    companyLocation: '',
    serviceArea: '',
  });


  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isCompany)) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, isCompany, navigate]);

  useEffect(() => {
    if (company) {
      setFormData({
        companyName: company.companyName || '',
        companySize: company.companySize || '',
        companyPhone: company.companyPhone || '',
        companyLocation: company.companyLocation || '',
        serviceArea: company.serviceArea || '',
      });
    }
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };


  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);
    try {
      await companyAPI.updateProfile(token!, { ...formData });
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (passwords.newPassword !== passwords.confirmPassword) { setError('Passwords do not match'); return; }
    if (passwords.newPassword.length < 6) { setError('New password must be at least 6 characters'); return; }
    setIsSaving(true);
    try {
      await companyAPI.changePassword(token!, passwords);
      setSuccess('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/company/dashboard" className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-gray-900">Company Profile</h1>
              <p className="text-xs text-gray-500">{company?.companyName || user?.name}</p>
            </div>
          </div>
          <Link to="/" className="h-9">
            <img src="/images/logo.png" alt="MAA TARINI" className="h-full object-contain" />
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0"
            style={{ background: 'linear-gradient(135deg, #c41e3a, #a01830)' }}>
            {(user?.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-gray-900 truncate">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email} · {user?.phone}</p>
            <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
              Supplier / Company
            </span>
          </div>
          <div className="hidden sm:block text-right text-sm text-gray-500">
            <p className="font-semibold text-gray-800">{company?.companyName}</p>
            <p>{company?.gstNumber}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {[
            { id: 'profile', label: 'Company Details', icon: Building2 },
            { id: 'password', label: 'Change Password', icon: Lock },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setError(''); setSuccess(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-green-700 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile}>
            <div className="space-y-6">
              {/* Basic Info Card */}
              <SectionCard title="Business Information" icon={<Building2 className="w-5 h-5 text-[#c41e3a]" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Company Name" icon={<Building2 className="w-4 h-4" />}>
                    <input name="companyName" value={formData.companyName} onChange={handleChange}
                      className={inp} placeholder="ABC Enterprises" />
                  </Field>
                  <Field label="Company Size" icon={<Users className="w-4 h-4" />}>
                    <select name="companySize" value={formData.companySize} onChange={handleChange} className={inp}>
                      <option value="">Select size</option>
                      <option value="1-10">1–10 employees</option>
                      <option value="11-50">11–50 employees</option>
                      <option value="51-200">51–200 employees</option>
                      <option value="201-500">201–500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </Field>
                  <Field label="Company Phone" icon={<PhoneCall className="w-4 h-4" />}>
                    <input name="companyPhone" value={formData.companyPhone} onChange={handleChange}
                      className={inp} placeholder="9876543210" maxLength={10} />
                  </Field>
                  <Field label="Company Location" icon={<MapPin className="w-4 h-4" />}>
                    <input name="companyLocation" value={formData.companyLocation} onChange={handleChange}
                      className={inp} placeholder="Mumbai, Maharashtra" />
                  </Field>
                  <Field label="Service Area" icon={<Globe className="w-4 h-4" />}>
                    <input name="serviceArea" value={formData.serviceArea} onChange={handleChange}
                      className={inp} placeholder="Pan India" />
                  </Field>
                </div>
              </SectionCard>

              {/* Legal Info (read-only) */}
              <SectionCard title="Legal Details (Read-only)" icon={<FileText className="w-5 h-5 text-[#c41e3a]" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'GST Number', value: company?.gstNumber },
                    { label: 'Year Established', value: company?.yearOfEstablishment },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
                      <p className="text-sm font-bold text-gray-800 font-mono">{item.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

<button type="submit" disabled={isSaving}
                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #c41e3a, #a01830)' }}>
                {isSaving ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <><Save className="w-5 h-5" />Save Profile</>}
              </button>
            </div>
          </form>
        )}

        {/* ── Password Tab ── */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword}>
            <SectionCard title="Change Password" icon={<Lock className="w-5 h-5 text-[#c41e3a]" />}>
              <div className="space-y-4 max-w-md">
                {([
                  { label: 'Current Password', key: 'currentPassword', show: showPw.current, toggle: () => setShowPw(p => ({ ...p, current: !p.current })) },
                  { label: 'New Password', key: 'newPassword', show: showPw.new, toggle: () => setShowPw(p => ({ ...p, new: !p.new })) },
                  { label: 'Confirm New Password', key: 'confirmPassword', show: showPw.confirm, toggle: () => setShowPw(p => ({ ...p, confirm: !p.confirm })) },
                ] as const).map(({ label, key, show, toggle }) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input type={show ? 'text' : 'password'} value={passwords[key]}
                        onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-[#c41e3a] outline-none bg-gray-50"
                        placeholder="••••••••" required />
                      <button type="button" onClick={toggle}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <button type="submit" disabled={isSaving}
                  className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #c41e3a, #a01830)' }}>
                  {isSaving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</> : <><Lock className="w-4 h-4" />Update Password</>}
                </button>
              </div>
            </SectionCard>
          </form>
        )}
      </div>
    </div>
  );
}

const inp = "w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-[#c41e3a] outline-none bg-gray-50 transition-all";

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">{icon}</div>}
        {children}
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">{icon}</div>
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}
