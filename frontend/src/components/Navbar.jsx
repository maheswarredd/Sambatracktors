import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Tractor, 
  MapPin, 
  PhoneCall, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Calendar, 
  ShieldCheck, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout, isFarmer, isRider, isAdmin } = useAuth();
  const { unreadCount, notifications, markAllRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const getDashboardPath = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isRider) return '/rider/dashboard';
    return '/farmer/dashboard';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      {/* Top Banner with Helpline */}
      <div className="bg-samba-900 text-samba-100 text-xs py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-samba-400 animate-pulse"></span>
            <span>Reliable Tractor & Farming Services for Every Farm • 4:00 AM – 9:00 PM Dispatch</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="tel:+919842056789" className="flex items-center space-x-1 text-samba-300 hover:text-white transition">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Helpline: +91 98420 56789</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Logo & Subtitle */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 bg-samba-700 group-hover:bg-samba-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-samba-900/20 transition transform group-hover:scale-105">
              <Tractor className="w-7 h-7 text-harvest-400" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                  Samba <span className="text-samba-600">Tractors</span>
                </span>
                <span className="text-[10px] bg-harvest-100 text-harvest-800 font-bold px-1.5 py-0.5 rounded border border-harvest-300">
                  AGRI-PRO
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 tracking-normal hidden sm:block">
                Reliable Tractor Services for Every Farm
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                isActive('/') ? 'text-samba-700 bg-samba-50' : 'text-slate-600 hover:text-samba-700 hover:bg-slate-100'
              }`}
            >
              Home
            </Link>
            <Link
              to="/services"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                isActive('/services') ? 'text-samba-700 bg-samba-50' : 'text-slate-600 hover:text-samba-700 hover:bg-slate-100'
              }`}
            >
              Farming Services
            </Link>
            <Link
              to="/book"
              className="px-3.5 py-2 rounded-lg text-sm font-bold text-white bg-samba-600 hover:bg-samba-700 shadow-sm shadow-samba-600/30 flex items-center space-x-1.5 transition transform hover:-translate-y-0.5"
            >
              <Calendar className="w-4 h-4 text-harvest-300" />
              <span>Book Tractor</span>
            </Link>

            {isAuthenticated && (
              <Link
                to={getDashboardPath()}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center space-x-1.5 ${
                  location.pathname.includes('dashboard') ? 'text-samba-700 bg-samba-50' : 'text-slate-600 hover:text-samba-700 hover:bg-slate-100'
                }`}
              >
                <span>
                  {isAdmin ? 'Admin Panel' : isRider ? 'Rider Console' : 'Farmer Dashboard'}
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded uppercase font-bold">
                  {user?.role}
                </span>
              </Link>
            )}
          </nav>

          {/* User & Notification Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    if (!notificationsOpen && unreadCount > 0) {
                      markAllRead();
                    }
                  }}
                  className="p-2.5 rounded-full text-slate-600 hover:text-samba-700 hover:bg-slate-100 relative transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                      <button
                        onClick={markAllRead}
                        className="text-xs text-samba-600 hover:text-samba-700 font-semibold"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 mt-2">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div key={n._id} className={`py-2.5 px-2 hover:bg-slate-50 transition rounded-lg ${!n.isRead ? 'bg-samba-50/50' : ''}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-slate-800">{n.title}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</span>
                  <span className="text-[10px] font-semibold text-samba-600 uppercase">{user?.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition flex items-center space-x-1"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-samba-700 transition"
                >
                  Farmer Login
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-samba-600 hover:bg-samba-700 rounded-lg shadow-sm transition"
                >
                  Register Farm
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            Home
          </Link>
          <Link
            to="/services"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            All Farming Services
          </Link>
          <Link
            to="/book"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-bold text-samba-700 bg-samba-50"
          >
            🚜 Book Tractor Service Now
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-800 bg-slate-100"
              >
                Dashboard ({user?.role?.toUpperCase()})
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center font-bold text-slate-800 bg-slate-100 rounded-lg"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center font-bold text-white bg-samba-600 rounded-lg shadow-md"
              >
                Farmer Signup
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
