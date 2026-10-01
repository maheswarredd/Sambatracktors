const moment = require('moment');

// ---------------------------------------------------------------------------
// ID generators
// ---------------------------------------------------------------------------

/** Pad a number to a fixed width with leading zeros. */
const pad = (num, size = 4) => String(num).padStart(size, '0');

/** Generate a random integer between min (inclusive) and max (inclusive). */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * generateBookingId — produces IDs in the format SB-YYYY-XXXX
 * e.g. SB-2024-0473
 */
const generateBookingId = () => {
  const year = new Date().getFullYear();
  const seq = pad(randInt(1, 9999));
  return `SB-${year}-${seq}`;
};

/**
 * generateTicketId — produces IDs in the format ST-XXXX
 * e.g. ST-8821
 */
const generateTicketId = () => {
  const seq = pad(randInt(1, 9999));
  return `ST-${seq}`;
};

// ---------------------------------------------------------------------------
// Financial helpers
// ---------------------------------------------------------------------------

/**
 * calculateTotalAmount — returns total booking amount.
 * Applies a simple GST rate (18%) on top of the base amount.
 * @param {number} pricePerAcre - Price in INR per acre
 * @param {number} acres        - Number of acres
 * @returns {{ base: number, gst: number, total: number }}
 */
const calculateTotalAmount = (pricePerAcre, acres) => {
  if (typeof pricePerAcre !== 'number' || typeof acres !== 'number') {
    throw new TypeError('calculateTotalAmount: pricePerAcre and acres must be numbers.');
  }
  const base = parseFloat((pricePerAcre * acres).toFixed(2));
  const gst = parseFloat((base * 0.18).toFixed(2));
  const total = parseFloat((base + gst).toFixed(2));
  return { base, gst, total };
};

/**
 * formatCurrency — formats a number as Indian Rupee currency string.
 * e.g. 12500 → "₹12,500.00"
 * @param {number} amount
 * @returns {string}
 */
const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// ---------------------------------------------------------------------------
// Time slot helpers
// ---------------------------------------------------------------------------

/**
 * TIME_SLOT_MAP — canonical mapping of slot keys to human-readable labels.
 */
const TIME_SLOT_MAP = {
  morning: 'Morning (6:00 AM – 12:00 PM)',
  afternoon: 'Afternoon (12:00 PM – 4:00 PM)',
  evening: 'Evening (4:00 PM – 7:00 PM)',
  'full-day': 'Full Day (6:00 AM – 7:00 PM)',
};

/**
 * getTimeSlotLabel — returns a readable time-slot string.
 * @param {string} slot - One of: 'morning', 'afternoon', 'evening', 'full-day'
 * @returns {string}
 */
const getTimeSlotLabel = (slot) => {
  return TIME_SLOT_MAP[slot] || 'Unknown Time Slot';
};

// ---------------------------------------------------------------------------
// Invoice generator
// ---------------------------------------------------------------------------

/**
 * generateInvoiceData — assembles a structured invoice object from a booking
 * document and payment document.
 *
 * @param {object} booking - Mongoose booking document (populated)
 * @param {object} payment - Mongoose payment document (populated)
 * @returns {object} Structured invoice data
 */
const generateInvoiceData = (booking, payment) => {
  if (!booking || !payment) {
    throw new Error('generateInvoiceData: booking and payment are required.');
  }

  const issuedAt = moment();
  const { base, gst, total } = calculateTotalAmount(
    booking.pricePerAcre || 0,
    booking.acres || 0
  );

  return {
    invoiceNumber: `INV-${booking.bookingId || generateBookingId()}`,
    issuedAt: issuedAt.toISOString(),
    issuedAtFormatted: issuedAt.format('DD MMM YYYY, hh:mm A'),

    // Parties
    farmer: {
      name: booking.farmer?.name || 'N/A',
      phone: booking.farmer?.phone || 'N/A',
      email: booking.farmer?.email || 'N/A',
      address: booking.farmLocation?.address || 'N/A',
    },
    operator: {
      name: booking.operator?.name || 'N/A',
      phone: booking.operator?.phone || 'N/A',
    },

    // Service details
    service: {
      name: booking.service?.name || 'N/A',
      category: booking.service?.category || 'N/A',
    },
    tractor: {
      make: booking.tractor?.make || 'N/A',
      model: booking.tractor?.model || 'N/A',
      registrationNumber: booking.tractor?.registrationNumber || 'N/A',
    },

    // Booking details
    bookingId: booking.bookingId || booking._id?.toString(),
    scheduledDate: moment(booking.scheduledDate).format('DD MMM YYYY'),
    timeSlot: getTimeSlotLabel(booking.timeSlot),
    acres: booking.acres,
    status: booking.status,

    // Financials
    financials: {
      pricePerAcre: booking.pricePerAcre || 0,
      pricePerAcreFormatted: formatCurrency(booking.pricePerAcre || 0),
      baseAmount: base,
      baseAmountFormatted: formatCurrency(base),
      gstRate: '18%',
      gstAmount: gst,
      gstAmountFormatted: formatCurrency(gst),
      totalAmount: total,
      totalAmountFormatted: formatCurrency(total),
    },

    // Payment
    payment: {
      paymentId: payment._id?.toString(),
      method: payment.method || 'N/A',
      status: payment.status || 'N/A',
      transactionId: payment.transactionId || 'N/A',
      paidAt: payment.paidAt
        ? moment(payment.paidAt).format('DD MMM YYYY, hh:mm A')
        : null,
    },
  };
};

module.exports = {
  generateBookingId,
  generateTicketId,
  calculateTotalAmount,
  formatCurrency,
  getTimeSlotLabel,
  generateInvoiceData,
  TIME_SLOT_MAP,
};
