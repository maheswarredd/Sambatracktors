/**
 * StatusBadge
 * @param {string} status - booking or payment status string
 * @param {string} type - 'booking' | 'payment' | 'user'
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
const StatusBadge = ({ status = '', type = 'booking', size = 'md' }) => {
  const normalize = (s) => (s || '').toLowerCase().replace(/_/g, ' ').trim();

  const bookingColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    assigned: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'in progress': 'bg-orange-100 text-orange-800 border-orange-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    disputed: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const paymentColors = {
    unpaid: 'bg-red-100 text-red-800 border-red-200',
    'payment submitted': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'payment pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    verified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    refunded: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const userColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-600 border-gray-200',
    suspended: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  const colorMap =
    type === 'payment' ? paymentColors : type === 'user' ? userColors : bookingColors;

  const normalized = normalize(status);
  const colorClass = colorMap[normalized] || 'bg-gray-100 text-gray-600 border-gray-200';

  const dotColors = {
    'bg-yellow': 'bg-yellow-500',
    'bg-blue': 'bg-blue-500',
    'bg-indigo': 'bg-indigo-500',
    'bg-orange': 'bg-orange-500',
    'bg-green': 'bg-green-500',
    'bg-emerald': 'bg-emerald-500',
    'bg-red': 'bg-red-500',
    'bg-purple': 'bg-purple-500',
    'bg-gray': 'bg-gray-400',
  };

  const getDotColor = () => {
    const match = colorClass.match(/bg-(\w+)-100/);
    return match ? dotColors[`bg-${match[1]}`] || 'bg-gray-400' : 'bg-gray-400';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const displayStatus = status
    ? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Unknown';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide ${colorClass} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()} shrink-0`} />
      {displayStatus}
    </span>
  );
};

export default StatusBadge;
