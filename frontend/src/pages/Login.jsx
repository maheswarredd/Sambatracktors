import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Tractor, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your registered Gmail/email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await login(email, password);

      if (res.success) {
        if (res.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (res.user.role === 'rider') {
          navigate('/rider/dashboard');
        } else {
          navigate(redirect === '/' ? '/farmer/dashboard' : redirect);
        }
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('An unexpected error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-Click Demo Login Helpers
  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-samba-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md">
            <Tractor className="w-7 h-7 text-harvest-300" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Sign In to Samba Tractors
          </h2>
          <p className="text-xs text-slate-500">
            Access your farmer bookings, fleet dispatch, or admin console
          </p>
        </div>

        {/* Demo Quick-Fill Buttons */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-samba-600" />
            <span>Instant Demo Quick-Fill:</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => fillCredentials('farmer@gmail.com', 'farmerPassword123')}
              className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg transition"
            >
              🌾 Farmer
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('ramu@sambatractors.com', 'riderPassword123')}
              className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg transition"
            >
              🚜 Rider
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin@sambatractors.com', 'adminPassword123')}
              className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-lg transition"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Registered Email / Gmail <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. farmer@gmail.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-samba-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-samba-500 outline-none text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-samba-600 hover:bg-samba-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          New farmer to Samba Tractors?{' '}
          <Link to="/register" className="font-bold text-samba-600 hover:underline">
            Register your Farm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
