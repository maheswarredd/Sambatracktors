const BASE_URL = import.meta.env.VITE_API_URL || '';

const getAuthHeaders = () => {
  const token = localStorage.getItem('samba_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

export const api = {
  // Auth
  signup: (userData) =>
    fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }).then(handleResponse),

  login: (credentials) =>
    fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }).then(handleResponse),

  getMe: () =>
    fetch(`${BASE_URL}/api/auth/me`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  updateLanguage: (language) =>
    fetch(`${BASE_URL}/api/auth/language`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ language })
    }).then(handleResponse),

  // Services
  getServices: (category = '', activeOnly = true) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly);
    return fetch(`${BASE_URL}/api/services?${params.toString()}`).then(handleResponse);
  },

  getServiceById: (id) =>
    fetch(`${BASE_URL}/api/services/${id}`).then(handleResponse),

  updateService: (id, serviceData) =>
    fetch(`${BASE_URL}/api/services/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(serviceData)
    }).then(handleResponse),

  // Bookings
  createBooking: (bookingData) =>
    fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData)
    }).then(handleResponse),

  getMyBookings: () =>
    fetch(`${BASE_URL}/api/bookings/my`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  getBookingById: (id) =>
    fetch(`${BASE_URL}/api/bookings/${id}`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  cancelBooking: (id, reason) =>
    fetch(`${BASE_URL}/api/bookings/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    }).then(handleResponse),

  // Payments
  getPaymentSettings: () =>
    fetch(`${BASE_URL}/api/payments/settings`).then(handleResponse),

  submitPaymentProof: (formData) => {
    const token = localStorage.getItem('samba_token');
    return fetch(`${BASE_URL}/api/payments/submit`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData // multipart FormData
    }).then(handleResponse);
  },

  verifyPayment: (paymentId, action, notes) =>
    fetch(`${BASE_URL}/api/payments/${paymentId}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, notes })
    }).then(handleResponse),

  collectCash: (bookingId) =>
    fetch(`${BASE_URL}/api/payments/${bookingId}/collect-cash`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Rider
  getRiderBookings: () =>
    fetch(`${BASE_URL}/api/rider/bookings`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  updateRiderStatus: (bookingId, status, note) =>
    fetch(`${BASE_URL}/api/rider/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, note })
    }).then(handleResponse),

  // Admin
  getAdminStats: () =>
    fetch(`${BASE_URL}/api/admin/stats`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  getAllBookings: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return fetch(`${BASE_URL}/api/admin/bookings?${params.toString()}`, {
      headers: getAuthHeaders()
    }).then(handleResponse);
  },

  assignRiderAndTractor: (bookingId, riderId, tractorId) =>
    fetch(`${BASE_URL}/api/admin/bookings/${bookingId}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ riderId, tractorId })
    }).then(handleResponse),

  getAdminResources: () =>
    fetch(`${BASE_URL}/api/admin/resources`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  createRider: (riderData) =>
    fetch(`${BASE_URL}/api/admin/riders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(riderData)
    }).then(handleResponse),

  createTractor: (tractorData) =>
    fetch(`${BASE_URL}/api/admin/tractors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tractorData)
    }).then(handleResponse),

  updateSettings: (settingsData) =>
    fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settingsData)
    }).then(handleResponse),

  // Chat
  getChatMessages: (bookingId) =>
    fetch(`${BASE_URL}/api/chat/${bookingId}`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  sendChatMessage: (bookingId, message) =>
    fetch(`${BASE_URL}/api/chat/${bookingId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message })
    }).then(handleResponse),

  // Support
  createTicket: (ticketData) =>
    fetch(`${BASE_URL}/api/support`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(ticketData)
    }).then(handleResponse),

  getMyTickets: () =>
    fetch(`${BASE_URL}/api/support/my`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  getAllTickets: () =>
    fetch(`${BASE_URL}/api/support/all`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  replyTicket: (ticketId, replyData) =>
    fetch(`${BASE_URL}/api/support/${ticketId}/reply`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(replyData)
    }).then(handleResponse),

  // Reviews
  createReview: (reviewData) =>
    fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData)
    }).then(handleResponse),

  // Notifications
  getNotifications: () =>
    fetch(`${BASE_URL}/api/notifications`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  markNotificationRead: (id) =>
    fetch(`${BASE_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    }).then(handleResponse),

  markAllNotificationsRead: () =>
    fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    }).then(handleResponse)
};
