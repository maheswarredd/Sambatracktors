import React, { useState, useEffect } from 'react';
import client from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ChatModal from '../components/ChatModal';
import InvoiceModal from '../components/InvoiceModal';
import { 
  Tractor, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  CheckCheck, 
  XCircle, 
  Eye, 
  RefreshCw,
  QrCode,
  ShieldAlert,
  Send,
  LifeBuoy
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, bookings, payments, services, fleet, riders, support, settings
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [tractors, setTractors] = useState([]);
  const [riders, setRiders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fleet Assignment Modal
  const [assigningBooking, setAssigningBooking] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [selectedTractorId, setSelectedTractorId] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Payment Verification Modal
  const [inspectingPaymentBooking, setInspectingPaymentBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifyingLoading, setVerifyingLoading] = useState(false);

  // Service Edit / Create Modal
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    code: '',
    description: '',
    pricePerAcre: 1800,
    category: 'Land Preparation',
    minAcres: 1,
    maxAcres: 50,
    features: ''
  });
  const [serviceImageFile, setServiceImageFile] = useState(null);

  // Tractor Add Modal
  const [tractorModalOpen, setTractorModalOpen] = useState(false);
  const [tractorForm, setTractorForm] = useState({
    registrationNumber: '',
    modelName: '',
    horsePower: 45,
    fuelType: 'Diesel',
    implementsSupported: 'Plough, Rotavator, Cultivator'
  });

  // Rider Add Modal
  const [riderModalOpen, setRiderModalOpen] = useState(false);
  const [riderForm, setRiderForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'riderPassword123',
    licenseNumber: '',
    experienceYears: 5
  });

  // Support Reply Modal
  const [replyingTicket, setReplyingTicket] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Interactive helper modals
  const [selectedBookingForChat, setSelectedBookingForChat] = useState(null);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [
        statsRes,
        bookingsRes,
        servicesRes,
        tractorsRes,
        ridersRes,
        ticketsRes,
        settingsRes
      ] = await Promise.all([
        client.get('/admin/dashboard-stats'),
        client.get('/admin/bookings'),
        client.get('/services/admin/all'),
        client.get('/tractors'),
        client.get('/admin/users?role=rider'),
        client.get('/support/admin/all'),
        client.get('/admin/settings')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (bookingsRes.data.success) setBookings(bookingsRes.data.data);
      if (servicesRes.data.success) setServices(servicesRes.data.data);
      if (tractorsRes.data.success) setTractors(tractorsRes.data.data);
      if (ridersRes.data.success) setRiders(ridersRes.data.data);
      if (ticketsRes.data.success) setTickets(ticketsRes.data.data);
      if (settingsRes.data.success) setSettings(settingsRes.data.data);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Handle Fleet Assignment with Conflict Prevention
  const handleAssignFleet = async (e) => {
    e.preventDefault();
    if (!selectedRiderId || !selectedTractorId) {
      setAssignError('Please select both a Rider and Tractor');
      return;
    }

    try {
      setAssignLoading(true);
      setAssignError('');
      const res = await client.put(`/admin/bookings/${assigningBooking._id}/assign`, {
        riderId: selectedRiderId,
        tractorId: selectedTractorId
      });

      if (res.data.success) {
        setAssigningBooking(null);
        setSelectedRiderId('');
        setSelectedTractorId('');
        fetchAdminData();
      }
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Assignment failed due to conflict');
    } finally {
      setAssignLoading(false);
    }
  };

  // Handle Payment Verification
  const handleVerifyPayment = async (action) => {
    if (action === 'REJECT' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejecting the payment screenshot.');
      return;
    }

    try {
      setVerifyingLoading(true);
      const res = await client.post('/payments/verify', {
        bookingId: inspectingPaymentBooking._id,
        action,
        rejectionReason: rejectionReason.trim()
      });

      if (res.data.success) {
        setInspectingPaymentBooking(null);
        setRejectionReason('');
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Verification update failed');
    } finally {
      setVerifyingLoading(false);
    }
  };

  // Handle Save Service
  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', serviceForm.name);
      formData.append('code', serviceForm.code);
      formData.append('description', serviceForm.description);
      formData.append('pricePerAcre', serviceForm.pricePerAcre);
      formData.append('category', serviceForm.category);
      formData.append('minAcres', serviceForm.minAcres);
      formData.append('maxAcres', serviceForm.maxAcres);
      formData.append('features', serviceForm.features);
      if (serviceImageFile) {
        formData.append('image', serviceImageFile);
      }

      if (editingService) {
        await client.put(`/services/${editingService._id}`, formData);
      } else {
        await client.post('/services', formData);
      }

      setServiceModalOpen(false);
      setEditingService(null);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save service');
    }
  };

  // Handle Toggle Service Active
  const handleToggleService = async (service) => {
    try {
      await client.put(`/services/${service._id}`, { isActive: !service.isActive });
      fetchAdminData();
    } catch (err) {
      alert('Failed to update service status');
    }
  };

  // Handle Create Tractor
  const handleCreateTractor = async (e) => {
    e.preventDefault();
    try {
      await client.post('/tractors', tractorForm);
      setTractorModalOpen(false);
      setTractorForm({
        registrationNumber: '',
        modelName: '',
        horsePower: 45,
        fuelType: 'Diesel',
        implementsSupported: 'Plough, Rotavator, Cultivator'
      });
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add tractor');
    }
  };

  // Handle Create Rider
  const handleCreateRider = async (e) => {
    e.preventDefault();
    try {
      await client.post('/admin/riders', riderForm);
      setRiderModalOpen(false);
      setRiderForm({
        name: '',
        email: '',
        phone: '',
        password: 'riderPassword123',
        licenseNumber: '',
        experienceYears: 5
      });
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add rider');
    }
  };

  // Handle Support Ticket Reply
  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      await client.post(`/support/${replyingTicket._id}/reply`, {
        message: replyText.trim(),
        status: 'RESOLVED'
      });
      setReplyingTicket(null);
      setReplyText('');
      fetchAdminData();
    } catch (err) {
      alert('Failed to send reply');
    }
  };

  // Handle Refund Action
  const handleRefundAction = async (ticketId, action) => {
    const adminNotes = window.prompt(`Enter notes for refund ${action}:`);
    if (adminNotes === null) return;

    try {
      await client.put(`/support/${ticketId}/refund-action`, {
        action,
        adminNotes
      });
      fetchAdminData();
    } catch (err) {
      alert('Failed to process refund action');
    }
  };

  // Filtered Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = !bookingStatusFilter || b.status === bookingStatusFilter;
    const matchesSearch =
      !searchQuery ||
      b.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.farmerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.farmerPhone?.includes(searchQuery) ||
      b.serviceName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingPayments = bookings.filter(
    (b) => b.paymentMethod === 'ONLINE' && b.paymentStatus === 'PENDING'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black bg-harvest-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Central Fleet Operations
            </span>
            <span className="text-xs text-samba-400 font-bold">Admin Authority</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Samba Tractors Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Control dynamic services, live dispatch assignments, verify UPI payments, and manage fleet machinery.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition flex items-center space-x-2 self-start md:self-auto font-bold text-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync All Live Feeds</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview Analytics', count: null },
          { id: 'bookings', label: 'All Bookings', count: bookings.length },
          { id: 'payments', label: 'Verify Payments', count: pendingPayments.length, alert: pendingPayments.length > 0 },
          { id: 'services', label: 'Dynamic Services', count: services.length },
          { id: 'fleet', label: 'Tractor Fleet', count: tractors.length },
          { id: 'riders', label: 'Riders & Drivers', count: riders.length },
          { id: 'support', label: 'Support & Refunds', count: tickets.length },
          { id: 'settings', label: 'UPI / QR Settings', count: null }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition flex items-center space-x-1.5 ${
              activeTab === tab.id
                ? 'bg-samba-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  tab.alert
                    ? 'bg-red-500 text-white animate-pulse'
                    : activeTab === tab.id
                    ? 'bg-samba-700 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Metrics KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Revenue Collected
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  ₹{stats?.summary?.totalRevenue?.toLocaleString('en-IN') || 0}
                </span>
              </div>
              <span className="text-[11px] text-samba-600 font-bold block">
                Across verified online & cash trips
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Acres Serviced
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-samba-700 font-mono">
                  {stats?.summary?.totalAcresServiced || 0}
                </span>
                <span className="text-xs font-bold text-slate-500">Acres</span>
              </div>
              <span className="text-[11px] text-slate-500 block">Completed farm tillage</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Active & Pending Jobs
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
                  {(stats?.summary?.pendingBookings || 0) + (stats?.summary?.confirmedBookings || 0)}
                </span>
                <span className="text-xs font-bold text-slate-500">Bookings</span>
              </div>
              <span className="text-[11px] text-amber-700 block">Requires fleet scheduling</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Pending UPI Verifications
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-purple-700 font-mono">
                  {stats?.summary?.pendingPayments || 0}
                </span>
                <span className="text-xs font-bold text-slate-500">Receipts</span>
              </div>
              <span className="text-[11px] text-purple-600 block">Awaiting admin inspection</span>
            </div>
          </div>

          {/* Quick Distribution Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Fleet & Personnel Assets
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Registered Farmers:</span>
                  <strong className="text-slate-800 font-mono">{stats?.summary?.totalFarmers || 0}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Certified Tractor Riders:</span>
                  <strong className="text-slate-800 font-mono">{stats?.summary?.totalRiders || 0}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Heavy Tractor Fleet:</span>
                  <strong className="text-slate-800 font-mono">{stats?.summary?.totalTractors || 0} Units</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Total Bookings Recorded:</span>
                  <strong className="text-slate-800 font-mono">{stats?.summary?.totalBookings || 0}</strong>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Payment Channel Split
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Online UPI Payments:</span>
                  <strong className="text-purple-700 font-mono font-bold">
                    {stats?.summary?.onlinePaymentsCount || 0} Bookings
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Offline Cash On Completion:</span>
                  <strong className="text-amber-700 font-mono font-bold">
                    {stats?.summary?.offlinePaymentsCount || 0} Bookings
                  </strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Verified & Reconciled:</span>
                  <strong className="text-emerald-700 font-mono font-bold">
                    {stats?.summary?.verifiedPayments || 0} Verified
                  </strong>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Dispatch Lifecycle Status
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Confirmed / Dispatched:</span>
                  <strong className="text-emerald-700 font-mono">{stats?.summary?.confirmedBookings || 0}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Completed Successfully:</span>
                  <strong className="text-slate-800 font-mono">{stats?.summary?.completedBookings || 0}</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Cancelled / Refunded:</span>
                  <strong className="text-red-600 font-mono">{stats?.summary?.cancelledBookings || 0}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL BOOKINGS & FLEET ASSIGNMENT */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pb-4 border-b border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, farmer, or phone..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-samba-500 outline-none"
              />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="w-full sm:w-auto text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PAYMENT_PENDING">Payment Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="RIDER_ASSIGNED">Rider Assigned</option>
                <option value="SERVICE_STARTED">Service Started</option>
                <option value="SERVICE_COMPLETED">Service Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Farmer Details</th>
                  <th className="py-3 px-4">Service & Acres</th>
                  <th className="py-3 px-4">Slot & Date</th>
                  <th className="py-3 px-4">Farm Landmark</th>
                  <th className="py-3 px-4">Assigned Fleet</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Dispatch Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{b.bookingNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{b.farmerName}</span>
                      <a href={`tel:${b.farmerPhone}`} className="text-blue-600 hover:underline text-[11px]">
                        {b.farmerPhone}
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{b.serviceName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {b.acres} ac @ ₹{b.pricePerAcre} = ₹{b.totalAmount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-semibold block">{b.bookingDate}</span>
                      <span className="text-[10px] text-slate-500">{b.timeSlot}</span>
                    </td>
                    <td className="py-3 px-4 text-amber-900 font-medium max-w-xs truncate">
                      {b.farmLocation?.landmark}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {b.assignedRider ? (
                        <div>
                          <strong className="text-slate-900 block">{b.assignedRider.name}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">{b.assignedTractor?.modelName}</span>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Assign Fleet Button */}
                      <button
                        onClick={() => {
                          setAssigningBooking(b);
                          setSelectedRiderId(b.assignedRider?._id || '');
                          setSelectedTractorId(b.assignedTractor?._id || '');
                        }}
                        className="px-2.5 py-1.5 bg-samba-600 hover:bg-samba-700 text-white font-bold rounded-lg text-[11px] shadow-sm"
                      >
                        {b.assignedRider ? 'Reassign' : 'Assign Fleet'}
                      </button>
                      <button
                        onClick={() => setSelectedBookingForChat(b)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg inline-block"
                        title="Chat"
                      >
                        💬
                      </button>
                      <button
                        onClick={() => setSelectedBookingForInvoice(b)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg inline-block"
                        title="Invoice"
                      >
                        📄
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VERIFY ONLINE PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Online UPI Payment Verification Queue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect submitted UTR transaction numbers and payment screenshot proofs. Accept or reject with instant notification to the farmer.
            </p>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <CheckCircle className="w-12 h-12 text-samba-500 mx-auto" />
              <h4 className="font-bold text-slate-700">All payments verified!</h4>
              <p className="text-xs">No pending online payment proofs awaiting manual inspection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingPayments.map((b) => (
                <div
                  key={b._id}
                  className="bg-slate-50 rounded-2xl border-2 border-purple-200 p-5 space-y-4 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-700 block">
                        Booking #{b.bookingNumber}
                      </span>
                      <h4 className="font-extrabold text-base text-slate-900 mt-0.5">{b.farmerName}</h4>
                      <p className="text-xs text-slate-500">{b.farmerPhone} • {b.serviceName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-purple-800 font-mono block">
                        ₹{b.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 text-xs font-mono">
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">
                      Submitted Transaction ID / UTR:
                    </span>
                    <strong className="text-slate-900 text-sm">{b.paymentDetails?.transactionId || 'None'}</strong>
                  </div>

                  {b.paymentDetails?.screenshotUrl && (
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                        Attached Payment Screenshot:
                      </span>
                      <div className="h-48 w-full bg-slate-200 rounded-xl overflow-hidden border border-slate-300">
                        <img
                          src={b.paymentDetails.screenshotUrl}
                          alt="Proof"
                          className="w-full h-full object-contain cursor-pointer hover:scale-105 transition"
                          onClick={() => window.open(b.paymentDetails.screenshotUrl, '_blank')}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      onClick={() => setInspectingPaymentBooking(b)}
                      className="flex-1 py-2.5 bg-samba-600 hover:bg-samba-700 text-white font-bold text-xs rounded-xl shadow transition"
                    >
                      Inspect & Verify / Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DYNAMIC SERVICES MANAGEMENT */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Dynamic Farming Services & Rates</h3>
              <p className="text-xs text-slate-500">Edit price-per-acre, enable/disable services, and manage farm catalog.</p>
            </div>
            <button
              onClick={() => {
                setEditingService(null);
                setServiceForm({
                  name: '',
                  code: '',
                  description: '',
                  pricePerAcre: 1800,
                  category: 'Land Preparation',
                  minAcres: 1,
                  maxAcres: 50,
                  features: ''
                });
                setServiceModalOpen(true);
              }}
              className="px-4 py-2.5 bg-samba-600 hover:bg-samba-700 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div
                key={s._id}
                className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 shadow-sm transition ${
                  s.isActive ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-100 opacity-60'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-700 uppercase">
                      {s.category}
                    </span>
                    <span className="font-mono font-extrabold text-samba-700 text-base">
                      ₹{s.pricePerAcre}/acre
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 mt-2">{s.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleService(s)}
                    className={`text-xs font-bold px-3 py-1 rounded-lg ${
                      s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {s.isActive ? 'Enabled' : 'Disabled'}
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingService(s);
                        setServiceForm({
                          name: s.name,
                          code: s.code,
                          description: s.description,
                          pricePerAcre: s.pricePerAcre,
                          category: s.category,
                          minAcres: s.minAcres,
                          maxAcres: s.maxAcres,
                          features: s.features ? s.features.join(', ') : ''
                        });
                        setServiceModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TRACTOR FLEET */}
      {activeTab === 'fleet' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Tractor Machinery Fleet</h3>
              <p className="text-xs text-slate-500">Manage registered tractors, HP capacity, and rider assignments.</p>
            </div>
            <button
              onClick={() => setTractorModalOpen(true)}
              className="px-4 py-2.5 bg-samba-600 hover:bg-samba-700 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Tractor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tractors.map((t) => (
              <div key={t._id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                    {t.registrationNumber}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                    {t.status}
                  </span>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900">{t.modelName}</h4>
                <p className="text-xs text-slate-500">{t.horsePower} Horsepower (HP) • {t.fuelType}</p>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <span className="font-semibold">Assigned Rider:</span>{' '}
                  <strong className="text-slate-800">{t.assignedRider?.name || 'Unassigned'}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: RIDERS */}
      {activeTab === 'riders' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Certified Tractor Riders</h3>
              <p className="text-xs text-slate-500">Manage field drivers, ratings, and contact numbers.</p>
            </div>
            <button
              onClick={() => setRiderModalOpen(true)}
              className="px-4 py-2.5 bg-samba-600 hover:bg-samba-700 text-white font-bold text-xs rounded-xl shadow flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Rider</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {riders.map((r) => (
              <div key={r._id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                    {r.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{r.name}</h4>
                    <p className="text-xs text-slate-500">{r.phone}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p><span className="text-slate-500">Rating:</span> <strong className="text-harvest-500 font-bold">⭐ {r.riderDetails?.rating || 4.9}</strong></p>
                  <p><span className="text-slate-500">Completed Trips:</span> <strong>{r.riderDetails?.totalTrips || 0}</strong></p>
                  <p><span className="text-slate-500">License:</span> <strong className="font-mono text-[11px]">{r.riderDetails?.licenseNumber || 'Verified'}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: SUPPORT TICKETS & REFUNDS */}
      {activeTab === 'support' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Farmer Support Desk & Refund Actions</h3>
            <p className="text-xs text-slate-500">Handle urgent Rider Not Reached alerts and approve/complete refund claims.</p>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No support tickets found.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 space-y-4">
              {tickets.map((t) => (
                <div key={t._id} className="pt-4 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-slate-900 mr-2">#{t.ticketNumber}</span>
                      <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        {t.category}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm mt-1">{t.subject}</h4>
                      <p className="text-[11px] text-slate-500">
                        Farmer: {t.farmer?.name} ({t.farmer?.phone})
                      </p>
                    </div>

                    <div className="space-x-2">
                      <button
                        onClick={() => {
                          setReplyingTicket(t);
                          setReplyText('');
                        }}
                        className="px-3 py-1.5 bg-samba-600 hover:bg-samba-700 text-white font-bold rounded-lg text-xs"
                      >
                        Reply to Farmer
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">{t.description}</p>

                  {/* Rider Not Reached waiting details */}
                  {t.riderNotReachedDetails?.waitingTimeMinutes > 0 && (
                    <div className="bg-red-50 p-2.5 rounded-lg border border-red-200 text-red-800 font-semibold">
                      🚨 Waiting Time: {t.riderNotReachedDetails.waitingTimeMinutes} minutes | Farmer Contact Attempted: {t.riderNotReachedDetails.farmerContactAttempted ? 'Yes' : 'No'}
                    </div>
                  )}

                  {/* Refund Workflow */}
                  {t.refundDetails?.requestedAmount > 0 && (
                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-orange-900 block">
                          Refund Request: ₹{t.refundDetails.requestedAmount} (UPI: {t.refundDetails.upiId || 'On Record'})
                        </span>
                        <span className="text-[10px] text-orange-700">Status: {t.refundDetails.status}</span>
                      </div>

                      <div className="space-x-2">
                        {t.refundDetails.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleRefundAction(t._id, 'APPROVE')}
                              className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded text-[11px]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRefundAction(t._id, 'REJECT')}
                              className="px-2.5 py-1 bg-red-600 text-white font-bold rounded text-[11px]"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {t.refundDetails.status === 'APPROVED' && (
                          <button
                            onClick={() => handleRefundAction(t._id, 'COMPLETE')}
                            className="px-3 py-1 bg-green-600 text-white font-bold rounded text-[11px]"
                          >
                            Mark Refund Disbursed
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: UPI & QR SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 max-w-2xl animate-in fade-in">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Official UPI & QR Code Settings</h3>
            <p className="text-xs text-slate-500">Configure the central payment details displayed to farmers on the booking screen.</p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await client.put('/admin/settings', settings);
                alert('UPI settings updated successfully!');
                fetchAdminData();
              } catch (err) {
                alert('Failed to update settings');
              }
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Official UPI ID</label>
              <input
                type="text"
                required
                value={settings?.upiId || ''}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-300 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Payee Name</label>
              <input
                type="text"
                required
                value={settings?.upiPayeeName || ''}
                onChange={(e) => setSettings({ ...settings, upiPayeeName: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Helpline Phone</label>
              <input
                type="text"
                value={settings?.supportPhone || ''}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-samba-600 hover:bg-samba-700 text-white font-bold text-xs rounded-xl shadow"
            >
              Save Payment Settings
            </button>
          </form>
        </div>
      )}

      {/* FLEET ASSIGNMENT MODAL (WITH DOUBLE-BOOKING CONFLICT PREVENTION) */}
      {assigningBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Assign Fleet to Booking #{assigningBooking.bookingNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Date: <strong>{assigningBooking.bookingDate}</strong> • Slot: <strong>{assigningBooking.timeSlot}</strong>
            </p>

            {assignError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 font-semibold flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            <form onSubmit={handleAssignFleet} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Select Rider</label>
                <select
                  required
                  value={selectedRiderId}
                  onChange={(e) => setSelectedRiderId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- Choose Rider --</option>
                  {riders.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.phone}) — ⭐ {r.riderDetails?.rating || 4.9}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Select Tractor</label>
                <select
                  required
                  value={selectedTractorId}
                  onChange={(e) => setSelectedTractorId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- Choose Tractor --</option>
                  {tractors.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.modelName} ({t.registrationNumber}) — {t.horsePower} HP
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningBooking(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="px-5 py-2 bg-samba-600 hover:bg-samba-700 text-white font-bold rounded-xl shadow"
                >
                  {assignLoading ? 'Validating Conflicts...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT PAYMENT MODAL */}
      {inspectingPaymentBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Inspect Payment for #{inspectingPaymentBooking.bookingNumber}
            </h3>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
              <p><span className="text-slate-500 font-sans">Farmer:</span> <strong>{inspectingPaymentBooking.farmerName}</strong></p>
              <p><span className="text-slate-500 font-sans">Amount:</span> <strong className="text-samba-700 font-bold">₹{inspectingPaymentBooking.totalAmount}</strong></p>
              <p><span className="text-slate-500 font-sans">Transaction UTR:</span> <strong>{inspectingPaymentBooking.paymentDetails?.transactionId}</strong></p>
            </div>

            {inspectingPaymentBooking.paymentDetails?.screenshotUrl && (
              <div className="h-64 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-300 flex items-center justify-center">
                <img
                  src={inspectingPaymentBooking.paymentDetails.screenshotUrl}
                  alt="Receipt"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rejection Reason (Required only if Rejecting):
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Transaction ID did not match bank account..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setInspectingPaymentBooking(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>

              <div className="space-x-2">
                <button
                  type="button"
                  disabled={verifyingLoading}
                  onClick={() => handleVerifyPayment('REJECT')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  Reject Proof
                </button>
                <button
                  type="button"
                  disabled={verifyingLoading}
                  onClick={() => handleVerifyPayment('ACCEPT')}
                  className="px-5 py-2 bg-samba-600 hover:bg-samba-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  Accept & Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE MODAL */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              {editingService ? 'Edit Farming Service' : 'Add New Farming Service'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="e.g. Deep Disc Ploughing"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price Per Acre (₹)</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.pricePerAcre}
                    onChange={(e) => setServiceForm({ ...serviceForm, pricePerAcre: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Land Preparation">Land Preparation</option>
                    <option value="Sowing & Planting">Sowing & Planting</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Transport & Trolley">Transport & Trolley</option>
                    <option value="General Farming">General Farming</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setServiceImageFile(e.target.files[0])}
                  className="w-full p-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-samba-600 text-white rounded-xl font-bold shadow"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRACTOR REGISTER MODAL */}
      {tractorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Register Tractor to Fleet</h3>
            <form onSubmit={handleCreateTractor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TN-54-AA-1008"
                  value={tractorForm.registrationNumber}
                  onChange={(e) => setTractorForm({ ...tractorForm, registrationNumber: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Model Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahindra 575 DI"
                  value={tractorForm.modelName}
                  onChange={(e) => setTractorForm({ ...tractorForm, modelName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Horsepower (HP)</label>
                  <input
                    type="number"
                    required
                    value={tractorForm.horsePower}
                    onChange={(e) => setTractorForm({ ...tractorForm, horsePower: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fuel Type</label>
                  <input
                    type="text"
                    value={tractorForm.fuelType}
                    onChange={(e) => setTractorForm({ ...tractorForm, fuelType: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTractorModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-samba-600 text-white rounded-xl font-bold shadow"
                >
                  Register Tractor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RIDER CREATE MODAL */}
      {riderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Add Certified Tractor Rider</h3>
            <form onSubmit={handleCreateRider} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramu Driver"
                  value={riderForm.name}
                  onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email / Username</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramu@sambatractors.com"
                  value={riderForm.email}
                  onChange={(e) => setRiderForm({ ...riderForm, email: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 94431 11222"
                  value={riderForm.phone}
                  onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Driving License Number</label>
                <input
                  type="text"
                  placeholder="e.g. TN-54-2016-00452"
                  value={riderForm.licenseNumber}
                  onChange={(e) => setRiderForm({ ...riderForm, licenseNumber: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 uppercase"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRiderModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-samba-600 text-white rounded-xl font-bold shadow"
                >
                  Create Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPORT TICKET REPLY MODAL */}
      {replyingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Reply to Ticket #{replyingTicket.ticketNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Farmer: <strong>{replyingTicket.farmer?.name}</strong> • Category: <strong>{replyingTicket.category}</strong>
            </p>

            <form onSubmit={handleReplyTicket} className="space-y-3 text-xs">
              <textarea
                rows={4}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Enter official resolution or instructions for the farmer..."
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-samba-500 outline-none"
              />

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyingTicket(null)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-samba-600 text-white rounded-xl font-bold shadow"
                >
                  Send Reply & Resolve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHAT & INVOICE MODALS */}
      {selectedBookingForChat && (
        <ChatModal
          booking={selectedBookingForChat}
          isOpen={!!selectedBookingForChat}
          onClose={() => setSelectedBookingForChat(null)}
        />
      )}

      {selectedBookingForInvoice && (
        <InvoiceModal
          booking={selectedBookingForInvoice}
          isOpen={!!selectedBookingForInvoice}
          onClose={() => setSelectedBookingForInvoice(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
