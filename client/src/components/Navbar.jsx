import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';
import NotificationDrawer from './NotificationModal';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import {
  Tractor,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Bell,
  Calendar,
  Layers,
  PhoneCall,
  ShieldCheck
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();

  const fetchUnread = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (e) {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchUnread();
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    if (!socket) return;
    socket.on('booking_status_updated', fetchUnread);
    socket.on('payment_submitted', fetchUnread);
    socket.on('new_booking', fetchUnread);

    return () => {
      socket.off('booking_status_updated', fetchUnread);
      socket.off('payment_submitted', fetchUnread);
      socket.off('new_booking', fetchUnread);
    };
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const brandName = t('brand');
  const subtitle = t('subtitle');

  return (
    <>
      <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 text-white shadow-lg border-b border-emerald-700/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand Title */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-950/40 group-hover:scale-105 transition-transform duration-300">
                <Tractor className="w-7 h-7 text-emerald-950 fill-emerald-950" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                    {brandName}
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-amber-400 text-emerald-950">
                    Agri Mechanized
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-emerald-200/90 tracking-wide">
                  {subtitle}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link
                to="/"
                className={`text-sm font-semibold transition-colors hover:text-amber-300 ${
                  location.pathname === '/' ? 'text-amber-300 border-b-2 border-amber-300 pb-1' : 'text-emerald-100'
                }`}
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/services"
                className={`text-sm font-semibold transition-colors hover:text-amber-300 ${
                  location.pathname === '/services' ? 'text-amber-300 border-b-2 border-amber-300 pb-1' : 'text-emerald-100'
                }`}
              >
                {t('nav.services')}
              </Link>

              {/* Book Now Button */}
              <Link
                to="/book"
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md shadow-orange-950/30 flex items-center gap-2 hover:scale-105 transition-all"
              >
                <Calendar className="w-4 h-4" />
                {t('nav.bookNow')}
              </Link>

              {/* Role-specific Dashboard Link */}
              {user && (
                <>
                  {user.role === 'farmer' && (
                    <Link
                      to="/farmer-dashboard"
                      className={`text-sm font-semibold transition-colors hover:text-amber-300 ${
                        location.pathname.startsWith('/farmer-dashboard') ? 'text-amber-300 border-b-2 border-amber-300 pb-1' : 'text-emerald-100'
                      }`}
                    >
                      {t('nav.dashboard')}
                    </Link>
                  )}
                  {user.role === 'rider' && (
                    <Link
                      to="/rider-dashboard"
                      className={`text-sm font-semibold transition-colors hover:text-amber-300 ${
                        location.pathname.startsWith('/rider-dashboard') ? 'text-amber-300 border-b-2 border-amber-300 pb-1' : 'text-emerald-100'
                      }`}
                    >
                      {t('nav.riderPortal')}
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin-dashboard"
                      className={`text-sm font-semibold transition-colors hover:text-amber-300 ${
                        location.pathname.startsWith('/admin-dashboard') ? 'text-amber-300 border-b-2 border-amber-300 pb-1' : 'text-emerald-100'
                      }`}
                    >
                      {t('nav.adminPanel')}
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* Right actions: Language Selector, Notification, Auth */}
            <div className="flex items-center gap-3">
              <LanguageSelector />

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setNotificationOpen(true)}
                  className="relative p-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* User / Login state */}
              {isAuthenticated ? (
                <div className="hidden sm:flex items-center gap-2 bg-emerald-950/30 pl-3 pr-1 py-1 rounded-xl border border-emerald-600/30">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-white max-w-[120px] truncate">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-amber-300 uppercase font-semibold">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-emerald-300 hover:text-rose-400 hover:bg-emerald-900/50 transition"
                    title={t('nav.logout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-xs font-bold text-emerald-100 hover:text-white px-3 py-2 rounded-xl hover:bg-emerald-800/60 transition"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="text-xs font-bold bg-white text-emerald-950 hover:bg-emerald-50 px-3.5 py-2 rounded-xl shadow transition"
                  >
                    {t('nav.signup')}
                  </Link>
                </div>
              )}

              {/* Mobile menu hamburger button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-emerald-900 border-t border-emerald-700/60 px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-emerald-100 hover:text-amber-300 border-b border-emerald-800"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-emerald-100 hover:text-amber-300 border-b border-emerald-800"
            >
              {t('nav.services')}
            </Link>
            <Link
              to="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-bold text-amber-300 border-b border-emerald-800"
            >
              🚜 {t('nav.bookNow')}
            </Link>

            {user?.role === 'farmer' && (
              <Link
                to="/farmer-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-semibold text-emerald-100 hover:text-amber-300 border-b border-emerald-800"
              >
                {t('nav.dashboard')}
              </Link>
            )}
            {user?.role === 'rider' && (
              <Link
                to="/rider-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-semibold text-emerald-100 hover:text-amber-300 border-b border-emerald-800"
              >
                {t('nav.riderPortal')}
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-semibold text-emerald-100 hover:text-amber-300 border-b border-emerald-800"
              >
                {t('nav.adminPanel')}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">{user?.name}</div>
                  <div className="text-xs text-amber-300 uppercase">{user?.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-rose-600/80 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="pt-2 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center bg-emerald-800 text-white font-bold py-2 rounded-xl text-sm"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center bg-amber-400 text-emerald-950 font-bold py-2 rounded-xl text-sm"
                >
                  {t('nav.signup')}
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Slide-over Notifications */}
      <NotificationDrawer isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />
    </>
  );
};

export default Navbar;
