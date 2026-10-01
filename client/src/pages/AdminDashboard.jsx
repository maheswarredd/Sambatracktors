import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import ChatModal from '../components/ChatModal';
import InvoiceModal from '../components/InvoiceModal';
import {
  Tractor,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  Settings,
  ShieldCheck,
  CreditCard,
  LifeBuoy,
  XCircle,
  Plus,
  Edit,
  Save,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Truck,
  RotateCcw
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState('overview'); // overview, bookings, payments, services, resources, support, settings
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [resources, setResources] = useState({ riders: [], tractors: [], payments: [] });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assignment Modal
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState(null);
  const [assignRiderId, setAssignRiderId] = useState('');
  const [assignTractorId, setAssignTractorId] = useState('');

  // Support Reply Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [ticketRefundStatus, setTicketRefundStatus] = useState('APPROVED');

  // New Rider / Tractor form state
  const [newRider, setNewRider] = useState({ name: '', email: '', phone: '', village: '' });
  const [newTractor, setNewTractor] = useState({ name: '', registrationNumber: '', hp: 60 });

  // Settings State
  const [upiSettings, setUpiSettings] = useState({
    upiId: 'sambatractors@okaxis',
    accountHolder: 'Samba Tractors Agricultural Services',
    qrCodeUrl: '',
    supportPhone: '+91 98480 12345'
  });

  const [bookingFilterStatus, setBookingFilterStatus] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes, servicesRes, resRes, ticketsRes, setRes] = await Promise.all([
        api.getAdminStats(),
        api.getAllBookings(),
        api.getServices('', false), // fetch all including inactive
        api.getAdminResources(),
        api.getAllTickets(),
        api.getPaymentSettings()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (bookingsRes.success) setBookings(bookingsRes.data);
      if (servicesRes.success) setServices(servicesRes.data);
      if (resRes.success) setResources(resRes.data);
      if (ticketsRes.success) setTickets(ticketsRes.data);
      if (setRes.success) setUpiSettings(setRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('booking_status_updated', loadAllAdminData);
    socket.on('new_booking', loadAllAdminData);
    socket.on('payment_submitted', loadAllAdminData);

    return () => {
      socket.off('booking_status_updated', loadAllAdminData);
      socket.off('new_booking', loadAllAdminData);
      socket.off('payment_submitted', loadAllAdminData);
    };
  }, [socket]);

  // Handle Assigning Rider & Tractor (checks double booking on backend)
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingForAssign || !assignRiderId || !assignTractorId) return;

    try {
      await api.assignRiderAndTractor(selectedBookingForAssign._id, assignRiderId, assignTractorId);
      alert('Rider and Tractor successfully assigned!');
      setSelectedBookingForAssign(null);
      loadAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Payment Accept / Reject
  const handleVerifyPayment = async (paymentId, action) => {
    const notes = window.prompt(
      action === 'ACCEPT' ? 'Optional verification note:' : 'Enter rejection reason:'
    );
    if (action === 'REJECT' && !notes) return;

    try {
      await api.verifyPayment(paymentId, action, notes);
      alert(`Payment ${action === 'ACCEPT' ? 'Approved' : 'Rejected'}!`);
      loadAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Service Price Update
  const handlePriceUpdate = async (serviceId, newPrice, isActive) => {
    try {
      await api.updateService(serviceId, { price: Number(newPrice), isActive });
      alert('Service updated successfully!');
      loadAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Create Rider
  const handleCreateRider = async (e) => {
    e.preventDefault();
    try {
      await api.createRider(newRider);
      alert('Rider registered successfully!');
      setNewRider({ name: '', email: '', phone: '', village: '' });
      loadAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Create Tractor
  const handleCreateTractor = async (e) => {
    e.preventDefault();
    try {
      await api.createTractor(newTractor);
      alert('Tractor registered successfully!');
      setNewTractor({ name: '', registrationNumber: '', hp: 60 });
      loadAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Reply to support ticket
  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await api.replyTicket(selectedTicket._id, {
        adminReply: replyText,
        status: 'RESOLVED',
        refundStatus: ticketRefundStatus
      });
      alert('Ticket replied and resolved!');
      setSelectedTicket(null);
      setReplyText('');
      loadAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Save UPI Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettings(upiSettings);
      alert('Payment settings saved!');
      loadAllAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchStatus = !bookingFilterStatus || b.status === bookingFilterStatus;
    const matchSearch =
      !bookingSearch ||
      b.bookingId?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.farmerName?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.farmerPhone?.includes(bookingSearch);
    return matchStatus && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Control Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            {t('admin.title')}
          </h1>
          <p className="text-xs text-emerald-200">
            {t('brand')} • {t('subtitle')}
          </p>
        </div>

        {/* Quick Nav Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-800/80 border border-emerald-600/30 text-xs font-bold text-amber-300">
            {stats?.counts?.totalFarmers || 0} Farmers
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-800/80 border border-emerald-600/30 text-xs font-bold text-emerald-200">
            {stats?.counts?.totalRiders || 0} Pilots
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-800/80 border border-emerald-600/30 text-xs font-bold text-white">
            {stats?.counts?.totalTractors || 0} Tractors
          </span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3 text-xs font-bold">
        {[
          { key: 'overview', label: t('admin.overview'), icon: TrendingUp },
          { key: 'bookings', label: t('admin.manageBookings'), icon: Tractor },
          { key: 'payments', label: 'Payment Verifications', icon: CreditCard },
          { key: 'services', label: t('admin.manageServices'), icon: Layers },
          { key: 'resources', label: t('admin.manageRiders'), icon: Users },
          { key: 'support', label: t('admin.supportTickets'), icon: LifeBuoy },
          { key: 'settings', label: t('admin.upiSettings'), icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW METRICS & CHARTS */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8 animate-fadeIn">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase text-gray-400">Total Revenue</span>
              <p className="text-xl font-black text-emerald-800">
                ₹{stats.counts.totalRevenue?.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase text-gray-400">Today's Bookings</span>
              <p className="text-xl font-black text-gray-900">{stats.counts.todayBookings}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-600">Pending Bookings</span>
              <p className="text-xl font-black text-amber-600">{stats.counts.pendingBookings}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-600">Acres Serviced</span>
              <p className="text-xl font-black text-emerald-700">{stats.counts.totalAcres} Acres</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase text-blue-600">Trips Hauled</span>
              <p className="text-xl font-black text-blue-700">{stats.counts.totalTrips} Trips</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase text-rose-600">Pending Payments</span>
              <p className="text-xl font-black text-rose-600">{stats.counts.pendingPaymentsCount}</p>
            </div>
          </div>

          {/* Category breakdown visual charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center justify-between">
                <span>{t('categories.ploughing')}</span>
                <span className="text-xs text-emerald-600 font-bold">Soil</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Total Serviced:</span>
                  <span className="font-bold text-gray-900">{stats.categoryStats?.SOIL_PLOUGHING?.acres || 0} Acres</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Revenue:</span>
                  <span className="font-black text-emerald-700">₹{stats.categoryStats?.SOIL_PLOUGHING?.revenue?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center justify-between">
                <span>{t('categories.sowing')}</span>
                <span className="text-xs text-amber-600 font-bold">Seeding</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Total Serviced:</span>
                  <span className="font-bold text-gray-900">{stats.categoryStats?.SEED_SOWING?.acres || 0} Acres</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Revenue:</span>
                  <span className="font-black text-emerald-700">₹{stats.categoryStats?.SEED_SOWING?.revenue?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center justify-between">
                <span>{t('categories.trolley')}</span>
                <span className="text-xs text-blue-600 font-bold">Logistics</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Total Completed:</span>
                  <span className="font-bold text-gray-900">{stats.categoryStats?.TROLLEY_LOAD?.trips || 0} Trips</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Revenue:</span>
                  <span className="font-black text-emerald-700">₹{stats.categoryStats?.TROLLEY_LOAD?.revenue?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOOKINGS MANAGEMENT */}
      {activeTab === 'bookings' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-5 animate-fadeIn">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ID, farmer name, phone..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-xl"
              />
            </div>

            <select
              value={bookingFilterStatus}
              onChange={(e) => setBookingFilterStatus(e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-gray-300 font-medium"
            >
              <option value="">All Statuses ({bookings.length})</option>
              <option value="PENDING">Pending</option>
              <option value="PAYMENT_PENDING">Payment Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="RIDER_ASSIGNED">Rider Assigned</option>
              <option value="SERVICE_COMPLETED">Service Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Bookings Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3">Booking ID</th>
                  <th className="p-3">Farmer</th>
                  <th className="p-3">Service & Unit</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Date & Slot</th>
                  <th className="p-3">Assigned Pilot / Tractor</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50/80">
                    <td className="p-3 font-mono font-bold text-gray-900">#{b.bookingId}</td>
                    <td className="p-3">
                      <p className="font-bold text-gray-900">{b.farmerName}</p>
                      <p className="text-[11px] text-gray-500">{b.farmerPhone}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-gray-900">{b.serviceSnapshot?.name?.[language] || b.serviceSnapshot?.name?.en}</p>
                      <p className="text-[11px] text-gray-500">{b.quantity} {b.unit}s</p>
                    </td>
                    <td className="p-3 font-black text-emerald-800">₹{b.totalAmount?.toLocaleString()}</td>
                    <td className="p-3">
                      <p className="font-medium text-gray-900">{new Date(b.bookingDate).toLocaleDateString()}</p>
                      <p className="text-[11px] text-emerald-700">{b.timeSlot}</p>
                    </td>
                    <td className="p-3">
                      {b.rider ? (
                        <div>
                          <p className="font-bold text-gray-900">{b.rider.name}</p>
                          <p className="text-[10px] text-gray-500">{b.tractor?.registrationNumber || 'AP04 AB 1234'}</p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-bold">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-gray-100 text-gray-800">
                        {t(`statuses.${b.status}`) || b.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => setSelectedBookingForAssign(b)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg shadow-sm transition"
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT VERIFICATIONS */}
      {activeTab === 'payments' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
          <h3 className="font-bold text-base text-gray-900">
            Submitted Online Payments ({resources.payments?.length || 0})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3">Booking ID</th>
                  <th className="p-3">Farmer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">UTR Reference</th>
                  <th className="p-3">Proof Screenshot</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resources.payments?.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold">#{p.bookingId}</td>
                    <td className="p-3">
                      <p className="font-bold text-gray-900">{p.farmer?.name}</p>
                      <p className="text-[10px] text-gray-500">{p.farmer?.phone}</p>
                    </td>
                    <td className="p-3 font-black text-emerald-800">₹{p.amount?.toLocaleString()}</td>
                    <td className="p-3 font-mono text-gray-900">{p.transactionId || 'N/A'}</td>
                    <td className="p-3">
                      {p.screenshotUrl ? (
                        <a
                          href={p.screenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 font-bold underline"
                        >
                          View Image
                        </a>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        p.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : p.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      {p.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleVerifyPayment(p._id, 'ACCEPT')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(p._id, 'REJECT')}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SERVICE PRICES & MANAGEMENT (Exact 29 Services) */}
      {activeTab === 'services' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">
                Official Tractor Services & Tariffs ({services.length} Total)
              </h3>
              <p className="text-xs text-gray-500">
                Admin can edit prices, toggle service availability, and adjust descriptions.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Service Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Price (₹)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Quick Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {services.map((s, idx) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono text-gray-400">{idx + 1}</td>
                    <td className="p-3">
                      <p className="font-bold text-gray-900">{s.name?.[language] || s.name?.en}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{s.code}</p>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-semibold text-gray-700">
                        {s.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{s.unit}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        defaultValue={s.price}
                        id={`price-${s._id}`}
                        className="w-24 px-2 py-1 border rounded-lg font-bold text-emerald-900"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        defaultValue={s.isActive ? 'true' : 'false'}
                        id={`active-${s._id}`}
                        className="px-2 py-1 border rounded-lg text-xs"
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          const p = document.getElementById(`price-${s._id}`).value;
                          const a = document.getElementById(`active-${s._id}`).value === 'true';
                          handlePriceUpdate(s._id, p, a);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg transition"
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: RESOURCES (RIDERS & TRACTORS) */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
          {/* Pilots & Riders List */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Active Riders ({resources.riders?.length || 0})</h3>
            </div>

            <div className="space-y-3">
              {resources.riders?.map((r) => (
                <div key={r._id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{r.name}</h4>
                    <p className="text-gray-500">📞 {r.phone} • 📍 {r.village || 'Hub'}</p>
                    <p className="text-emerald-700 font-semibold mt-0.5">
                      Assigned: {r.assignedTractor ? r.assignedTractor.registrationNumber : 'No Tractor Linked'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                    Active Pilot
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Add Rider Form */}
            <form onSubmit={handleCreateRider} className="pt-4 border-t border-gray-100 space-y-3 text-xs">
              <span className="font-bold text-gray-800 block">Add New Rider</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Pilot Name"
                  required
                  value={newRider.name}
                  onChange={(e) => setNewRider({ ...newRider, name: e.target.value })}
                  className="p-2 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Mobile (10 digits)"
                  required
                  value={newRider.phone}
                  onChange={(e) => setNewRider({ ...newRider, phone: e.target.value })}
                  className="p-2 border rounded-xl"
                />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={newRider.email}
                  onChange={(e) => setNewRider({ ...newRider, email: e.target.value })}
                  className="p-2 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Village"
                  value={newRider.village}
                  onChange={(e) => setNewRider({ ...newRider, village: e.target.value })}
                  className="p-2 border rounded-xl"
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl">
                Register Pilot
              </button>
            </form>
          </div>

          {/* Registered Tractors */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Registered Tractors ({resources.tractors?.length || 0})</h3>
            </div>

            <div className="space-y-3">
              {resources.tractors?.map((tr) => (
                <div key={tr._id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{tr.name}</h4>
                    <p className="font-mono text-gray-600 font-semibold">{tr.registrationNumber}</p>
                    <p className="text-gray-500">{tr.hp} HP • {tr.type}</p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 uppercase">
                    {tr.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Add Tractor */}
            <form onSubmit={handleCreateTractor} className="pt-4 border-t border-gray-100 space-y-3 text-xs">
              <span className="font-bold text-gray-800 block">Register New Tractor</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Brand / Model Name"
                  required
                  value={newTractor.name}
                  onChange={(e) => setNewTractor({ ...newTractor, name: e.target.value })}
                  className="p-2 border rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Registration (e.g. AP04 AB 5678)"
                  required
                  value={newTractor.registrationNumber}
                  onChange={(e) => setNewTractor({ ...newTractor, registrationNumber: e.target.value })}
                  className="p-2 border rounded-xl"
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl">
                Register Tractor
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 6: SUPPORT TICKETS & REFUNDS */}
      {activeTab === 'support' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
          <h3 className="font-bold text-base text-gray-900">Farmer Support Tickets & Disputes ({tickets.length})</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3">Ticket ID</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Issue Type</th>
                  <th className="p-3">Subject & Description</th>
                  <th className="p-3">Refund Status</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Reply / Resolve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((tic) => (
                  <tr key={tic._id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold">#{tic.ticketId}</td>
                    <td className="p-3">
                      <p className="font-bold">{tic.userName}</p>
                      <p className="text-[10px] text-gray-500">{tic.userPhone}</p>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                        {tic.issueType}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs">
                      <p className="font-bold text-gray-900">{tic.subject}</p>
                      <p className="text-[11px] text-gray-500 truncate">{tic.description}</p>
                    </td>
                    <td className="p-3">
                      {tic.refundStatus !== 'NONE' ? (
                        <span className="font-bold text-purple-700">
                          {tic.refundStatus} (₹{tic.refundAmount})
                        </span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tic.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {tic.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedTicket(tic);
                          setReplyText(tic.adminReply || '');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg transition"
                      >
                        Respond
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: UPI & QR SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-xl bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
          <h3 className="font-bold text-base text-gray-900">{t('admin.upiSettings')}</h3>
          <p className="text-xs text-gray-500">
            Configure official UPI receiving details shown to farmers during online bookings.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Admin UPI ID</label>
              <input
                type="text"
                required
                value={upiSettings.upiId}
                onChange={(e) => setUpiSettings({ ...upiSettings, upiId: e.target.value })}
                className="w-full p-2.5 border rounded-xl font-mono text-emerald-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                required
                value={upiSettings.accountHolder}
                onChange={(e) => setUpiSettings({ ...upiSettings, accountHolder: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Helpline Phone Number</label>
              <input
                type="text"
                required
                value={upiSettings.supportPhone}
                onChange={(e) => setUpiSettings({ ...upiSettings, supportPhone: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow">
              {t('admin.saveChanges')}
            </button>
          </form>
        </div>
      )}

      {/* Assign Rider & Tractor Modal (with double booking conflict alerts) */}
      {selectedBookingForAssign && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-emerald-100">
            <h3 className="font-black text-base text-gray-900">
              Assign Pilot & Tractor to #{selectedBookingForAssign.bookingId}
            </h3>
            <p className="text-xs text-gray-600">
              Date: {new Date(selectedBookingForAssign.bookingDate).toLocaleDateString()} • Slot: {selectedBookingForAssign.timeSlot}
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">{t('admin.assignRider')}</label>
                <select
                  required
                  value={assignRiderId}
                  onChange={(e) => setAssignRiderId(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-medium"
                >
                  <option value="">-- Select Rider --</option>
                  {resources.riders?.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">{t('admin.assignTractor')}</label>
                <select
                  required
                  value={assignTractorId}
                  onChange={(e) => setAssignTractorId(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-medium"
                >
                  <option value="">-- Select Tractor --</option>
                  {resources.tractors?.map((tr) => (
                    <option key={tr._id} value={tr._id}>
                      {tr.name} ({tr.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForAssign(null)}
                  className="w-1/2 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Support Ticket Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-emerald-100">
            <h3 className="font-bold text-base text-gray-900">Respond to Ticket #{selectedTicket.ticketId}</h3>
            <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl">
              <span className="font-bold text-gray-900">{selectedTicket.subject}</span>: {selectedTicket.description}
            </p>

            <form onSubmit={handleReplyTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Admin Reply / Resolution</label>
                <textarea
                  rows={3}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Enter resolution details for farmer..."
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              {selectedTicket.issueType === 'Refund Request' && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Refund Status Action</label>
                  <select
                    value={ticketRefundStatus}
                    onChange={(e) => setTicketRefundStatus(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  >
                    <option value="APPROVED">Approve Refund</option>
                    <option value="COMPLETED">Mark Refund Completed (Transferred)</option>
                    <option value="REJECTED">Reject Refund</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="w-1/2 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow"
                >
                  Send Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
