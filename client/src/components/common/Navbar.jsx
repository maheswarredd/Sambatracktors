import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const farmerLinks = [
    { to: '/farmer/dashboard', label: 'Dashboard' },
    { to: '/farmer/bookings', label: 'My Bookings' },
    { to: '/farmer/book-service', label: 'Book Service' },
    { to: '/farmer/profile', label: 'Profile' },
  ];

  const riderLinks = [
    { to: '/rider/dashboard', label: 'Dashboard' },
    { to: '/rider/bookings', label: 'My Bookings' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/farmers', label: 'Farmers' },
    { to: '/admin/riders', label: 'Riders' },
    { to: '/admin/services', label: 'Services' },
    { to: '/admin/bookings', label: 'Bookings' },
  ];

  const getNavLinks = () => {
    if (!isAuthenticated) return [];
    if (user?.role === 'farmer') return farmerLinks;
    if (user?.role === 'rider') return riderLinks;
    if (user?.role === 'admin') return adminLinks;
    return [];
  };

  const navLinks = getNavLinks();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex flex-col leading-tight">
              <span className="flex items-center gap-2">
                <span className="text-2xl">🚜</span>
                <span className="text-xl font-extrabold text-[#2D6A4F] tracking-tight">
                  Samba Tractors
                </span>
              </span>
              <span className="text-[10px] text-[#40916C] font-medium ml-9 hidden sm:block">
                Reliable Tractor Services for Every Farm
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-[#2D6A4F] text-white'
                      : 'text-gray-700 hover:bg-green-50 hover:text-[#2D6A4F]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {/* Notification Bell */}
                  <div className="hidden sm:block">
                    <NotificationBell />
                  </div>

                  {/* User Avatar */}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-sm font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-gray-700 font-medium hidden md:block">
                      {user?.name?.split(' ')[0]}
                    </span>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-[#2D6A4F] border border-[#2D6A4F] hover:bg-green-50 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[#F77F00] text-white hover:bg-orange-600 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <motion.div
                  animate={mobileOpen ? 'open' : 'closed'}
                  className="w-5 h-5 flex flex-col justify-center gap-1"
                >
                  <motion.span
                    variants={{ open: { rotate: 45, y: 6 }, closed: { rotate: 0, y: 0 } }}
                    className="block h-0.5 bg-gray-700 rounded"
                  />
                  <motion.span
                    variants={{ open: { opacity: 0 }, closed: { opacity: 1 } }}
                    className="block h-0.5 bg-gray-700 rounded"
                  />
                  <motion.span
                    variants={{ open: { rotate: -45, y: -6 }, closed: { rotate: 0, y: 0 } }}
                    className="block h-0.5 bg-gray-700 rounded"
                  />
                </motion.div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed top-0 right-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col lg:hidden"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b bg-[#2D6A4F]">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚜</span>
                    <span className="text-lg font-bold text-white">Samba Tractors</span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1 rounded text-white hover:bg-white/20 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* User Info */}
                {isAuthenticated && (
                  <div className="p-4 bg-green-50 border-b flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                  </div>
                )}

                {/* Nav Links */}
                <div className="flex-1 overflow-y-auto py-4">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={link.to}
                        className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                          isActive(link.to)
                            ? 'bg-[#2D6A4F] text-white border-r-4 border-[#F77F00]'
                            : 'text-gray-700 hover:bg-green-50 hover:text-[#2D6A4F]'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}

                  {!isAuthenticated && (
                    <div className="px-4 py-3 space-y-2 mt-2">
                      <Link
                        to="/login"
                        className="block w-full py-2 text-center rounded-lg border border-[#2D6A4F] text-[#2D6A4F] font-medium text-sm"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="block w-full py-2 text-center rounded-lg bg-[#F77F00] text-white font-medium text-sm"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>

                {/* Logout */}
                {isAuthenticated && (
                  <div className="p-4 border-t">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
      {/* Spacer */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;
