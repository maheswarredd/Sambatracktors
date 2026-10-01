import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Tractor, Lock, Phone, AlertCircle, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const data = await login(emailOrPhone, password);
      if (data) {
        if (data.role === 'admin') navigate('/admin-dashboard');
        else if (data.role === 'rider') navigate('/rider-dashboard');
        else navigate(redirect === '/login' ? '/farmer-dashboard' : redirect);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Fill
  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmailOrPhone('admin@sambatractors.com');
      setPassword('password123');
    } else if (role === 'rider') {
      setEmailOrPhone('rider@sambatractors.com');
      setPassword('password123');
    } else {
      setEmailOrPhone('farmer@sambatractors.com');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-100 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto text-emerald-950 shadow-md">
            <Tractor className="w-8 h-8 fill-emerald-950" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {t('nav.login')}
          </h2>
          <p className="text-xs text-gray-500">
            {t('brand')} • {t('subtitle')}
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Fast Login Pills */}
        <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80 space-y-1.5">
          <span className="text-[10px] font-bold uppercase text-emerald-800 block text-center">
            Quick One-Click Demo Logins
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => fillDemo('farmer')}
              className="py-1 px-2 bg-white hover:bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-300 shadow-xs"
            >
              🧑‍🌾 Farmer
            </button>
            <button
              type="button"
              onClick={() => fillDemo('rider')}
              className="py-1 px-2 bg-white hover:bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-300 shadow-xs"
            >
              🚜 Pilot / Rider
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="py-1 px-2 bg-white hover:bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-300 shadow-xs"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Gmail / Mobile Number
            </label>
            <input
              type="text"
              required
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="e.g. farmer@sambatractors.com or 9876543210"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : t('nav.login')}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-700 font-bold hover:underline">
            {t('nav.signup')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
