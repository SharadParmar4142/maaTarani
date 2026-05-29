import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, Lock, Eye, EyeOff, Building2, Users, Calendar,
  FileText, PhoneCall, ArrowRight, ArrowLeft, CheckCircle,
  MapPin, Truck, Globe, Info, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function CompanySignupPage() {
  const navigate = useNavigate();
  const { registerCompany } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    companyName: '',
    companySize: '',
    yearOfEstablishment: '',
    gstNumber: '',
    companyPhone: '',
    companyLocation: '',
    serviceArea: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    const normalizedValue = name === 'gstNumber' ? value.toUpperCase().replace(/\s+/g, '') : value;
    setFormData({ ...formData, [name]: normalizedValue });
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.phone || !formData.email || !formData.password) {
      setError('All user details are required'); return false;
    }
    if (formData.phone.length !== 10 || !/^\d+$/.test(formData.phone)) {
      setError('Phone number must be exactly 10 digits'); return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address'); return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters'); return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.companyName || !formData.companySize || !formData.yearOfEstablishment || !formData.gstNumber) {
      setError('Company name, size, year, and GST are required'); return false;
    }
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
      setError('Invalid GST format (e.g., 22AAAAA0000A1Z5)'); return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
  };

  const handleBack = () => { setError(''); setCurrentStep(c => c - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateStep2()) return;
    setIsLoading(true);
    try {
      await registerCompany({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        companySize: formData.companySize,
        yearOfEstablishment: parseInt(formData.yearOfEstablishment),
        gstNumber: formData.gstNumber,
        companyPhone: formData.companyPhone || undefined,
        companyLocation: formData.companyLocation || undefined,
        serviceArea: formData.serviceArea || undefined,
      });
      navigate('/company/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Account', icon: User },
    { num: 2, label: 'Company', icon: Building2 },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #c41e3a 0%, transparent 60%), radial-gradient(circle at 70% 20%, #ff6b35 0%, transparent 50%)' }} />
        <div className="relative z-10">
          <Link to="/">
            <img src="/images/logo.png" alt="MAA TARINI" className="h-14 object-contain brightness-0 invert" />
          </Link>
        </div>
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
              Partner with<br />
              <span style={{ background: 'linear-gradient(90deg, #ff6b35, #c41e3a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MAA TARINI
              </span>
            </h1>
            <p className="mt-4 text-white/70 text-lg leading-relaxed">
              Join our supplier network. Get access to purchase orders from verified buyers and grow your business.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: ShieldCheck, text: 'Verified buyer network' },
              { icon: Truck, text: 'Real-time PO tracking' },
              { icon: Globe, text: 'Pan-India operations' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(196,30,58,0.25)' }}>
                  <Icon className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-white/80 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/40 text-sm">
          © 2025 MAA TARINI ENTERPRISES
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 overflow-y-auto bg-white">
        <div className="w-full max-w-xl">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/"><img src="/images/logo.png" alt="MAA TARINI" className="h-12 mx-auto object-contain" /></Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Company Onboarding</h2>
            <p className="text-gray-500 mt-1">Register your company as a supplier</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center mb-8">
            {steps.map((step, idx) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    currentStep > step.num ? 'bg-green-500 text-white' :
                    currentStep === step.num ? 'bg-[#c41e3a] text-white shadow-lg shadow-red-200' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {currentStep > step.num ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-1 font-semibold ${currentStep >= step.num ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 mb-4 rounded-full bg-gray-200 overflow-hidden">
                    <div className={`h-full rounded-full bg-[#c41e3a] transition-all duration-500 ${currentStep > step.num ? 'w-full' : 'w-0'}`} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ── STEP 1: Account Details ── */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 mb-1">Account Details</h3>
                <p className="text-sm text-gray-500 mb-4">Your personal login credentials</p>

                <FormField label="Full Name" required icon={<User className="w-4 h-4" />}>
                  <input id="name" name="name" type="text" value={formData.name} onChange={handleChange}
                    className={inputCls} placeholder="John Doe" required />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Phone" required icon={<Phone className="w-4 h-4" />}>
                    <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange}
                      className={inputCls} placeholder="9876543210" maxLength={10} required />
                  </FormField>
                  <FormField label="Email" required icon={<Mail className="w-4 h-4" />}>
                    <input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                      className={inputCls} placeholder="you@company.com" required />
                  </FormField>
                </div>

                <FormField label="Password" required icon={<Lock className="w-4 h-4" />}>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock className="w-4 h-4" /></div>
                    <input id="password" name="password" type={showPassword ? 'text' : 'password'}
                      value={formData.password} onChange={handleChange}
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-[#c41e3a] outline-none transition-all bg-gray-50"
                      placeholder="Min. 6 characters" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormField>

                <button type="button" onClick={handleNext}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #c41e3a, #a01830)' }}>
                  Continue to Company Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── STEP 2: Company Details ── */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 mb-1">Company Details</h3>
                <p className="text-sm text-gray-500 mb-4">Legal and business information</p>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Company Name" required icon={<Building2 className="w-4 h-4" />}>
                    <input id="companyName" name="companyName" type="text" value={formData.companyName} onChange={handleChange}
                      className={inputCls} placeholder="ABC Enterprises" required />
                  </FormField>
                  <FormField label="Company Size" required icon={<Users className="w-4 h-4" />}>
                    <select id="companySize" name="companySize" value={formData.companySize} onChange={handleChange}
                      className={inputCls} required>
                      <option value="">Select size</option>
                      <option value="1-10">1–10 employees</option>
                      <option value="11-50">11–50 employees</option>
                      <option value="51-200">51–200 employees</option>
                      <option value="201-500">201–500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Year of Establishment" required icon={<Calendar className="w-4 h-4" />}>
                    <input id="yearOfEstablishment" name="yearOfEstablishment" type="number"
                      value={formData.yearOfEstablishment} onChange={handleChange}
                      className={inputCls} placeholder="2010" min={1900} max={new Date().getFullYear()} required />
                  </FormField>
                  <FormField label="GST Number" required icon={<FileText className="w-4 h-4" />}>
                    <input id="gstNumber" name="gstNumber" type="text" value={formData.gstNumber} onChange={handleChange}
                      className={`${inputCls} uppercase`} placeholder="22AAAAA0000A1Z5" maxLength={15} required />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Company Phone" icon={<PhoneCall className="w-4 h-4" />}>
                    <input id="companyPhone" name="companyPhone" type="tel" value={formData.companyPhone} onChange={handleChange}
                      className={inputCls} placeholder="9876543210" maxLength={10} />
                  </FormField>
                  <FormField label="Service Area" icon={<Globe className="w-4 h-4" />}>
                    <input id="serviceArea" name="serviceArea" type="text" value={formData.serviceArea} onChange={handleChange}
                      className={inputCls} placeholder="Maharashtra, Gujarat" />
                  </FormField>
                </div>

                <FormField label="Company Location" icon={<MapPin className="w-4 h-4" />}>
                  <input id="companyLocation" name="companyLocation" type="text" value={formData.companyLocation} onChange={handleChange}
                    className={inputCls} placeholder="Mumbai, Maharashtra" />
                </FormField>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleBack}
                    className="flex-1 py-3.5 rounded-xl font-bold text-gray-700 text-sm border-2 border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="submit" disabled={isLoading}
                    className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #c41e3a, #a01830)' }}>
                    {isLoading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Registering...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" />Complete Registration</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Already have a company account?{' '}
              <Link to="/login" className="text-[#c41e3a] font-semibold hover:underline">Sign In</Link>
            </p>
            <p className="text-sm text-gray-500">
              Signing up as a buyer?{' '}
              <Link to="/signup" className="text-[#c41e3a] font-semibold hover:underline">User Signup</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-[#c41e3a] outline-none transition-all bg-gray-50";

function FormField({ label, required, icon, children }: {
  label: string; required?: boolean; icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</div>}
        {children}
      </div>
    </div>
  );
}
