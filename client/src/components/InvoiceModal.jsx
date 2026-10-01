import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Tractor, Printer, X, CheckCircle2, ShieldCheck } from 'lucide-react';

export const InvoiceModal = ({ isOpen, onClose, booking }) => {
  const { t, language } = useLanguage();

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const serviceName = booking.serviceSnapshot?.name
    ? (booking.serviceSnapshot.name[language] || booking.serviceSnapshot.name.en)
    : 'Tractor Service';

  const timeSlotLabel = booking.timeSlotLabel
    ? (booking.timeSlotLabel[language] || booking.timeSlotLabel.en)
    : booking.timeSlot;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col my-6">
        {/* Modal Actions */}
        <div className="px-6 py-3 bg-emerald-950 text-white flex items-center justify-between print:hidden">
          <span className="text-xs font-semibold text-emerald-200">
            {t('invoice.title')}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('invoice.print')}</span>
            </button>
            <button
              onClick={onClose}
              className="text-emerald-200 hover:text-white p-1 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 space-y-6 text-gray-900 bg-white" id="invoice-sheet">
          {/* Header */}
          <div className="flex items-start justify-between pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center">
                <Tractor className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-emerald-950 tracking-tight">
                  {t('brand')}
                </h2>
                <p className="text-xs text-emerald-700 font-semibold">{t('subtitle')}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Agricultural Mechanization Hub • Kovvur, AP</p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 text-xs font-black uppercase rounded-lg bg-emerald-100 text-emerald-900 tracking-wider">
                {t('invoice.taxInvoice')}
              </span>
              <p className="text-xs font-mono font-bold text-gray-800 mt-2">#{booking.bookingId}</p>
              <p className="text-[11px] text-gray-500">
                Date: {new Date(booking.bookingDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Farmer & Service Meta */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                {t('invoice.billTo')} (Farmer)
              </h4>
              <p className="font-bold text-sm text-gray-900">{booking.farmerName}</p>
              <p className="text-gray-600">Phone: {booking.farmerPhone}</p>
              <p className="text-gray-600">Village: {booking.farmLocation?.village || 'N/A'}</p>
              <p className="text-gray-600 mt-1">Farm: {booking.farmLocation?.address}</p>
              {booking.farmLocation?.landmark && (
                <p className="text-emerald-700 font-medium mt-0.5">
                  Landmark: {booking.farmLocation?.landmark}
                </p>
              )}
            </div>

            <div className="text-right">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Tractor & Rider Details
              </h4>
              <p className="font-bold text-sm text-gray-900">
                {booking.rider?.name || 'Assigned Samba Pilot'}
              </p>
              <p className="text-gray-600">Rider Phone: {booking.rider?.phone || 'N/A'}</p>
              <p className="text-gray-600">
                Tractor: {booking.tractor?.name || 'Mahindra Novo 605 DI'}
              </p>
              <p className="text-gray-600">
                Reg: {booking.tractor?.registrationNumber || 'AP04 AB 1234'}
              </p>
              <p className="text-emerald-700 font-medium mt-1">Slot: {timeSlotLabel}</p>
            </div>
          </div>

          {/* Table of items */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3">Service Description</th>
                  <th className="p-3 text-center">Unit</th>
                  <th className="p-3 text-center">Quantity</th>
                  <th className="p-3 text-right">Unit Rate</th>
                  <th className="p-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-3">
                    <p className="font-bold text-gray-900">{serviceName}</p>
                    <p className="text-[11px] text-gray-500">Category: {booking.serviceSnapshot?.category}</p>
                  </td>
                  <td className="p-3 text-center">{booking.unit}</td>
                  <td className="p-3 text-center font-bold">{booking.quantity}</td>
                  <td className="p-3 text-right">₹{booking.unitPrice?.toLocaleString()}</td>
                  <td className="p-3 text-right font-black text-gray-900">
                    ₹{booking.totalAmount?.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Box */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs space-y-1">
              <p>
                <span className="font-semibold text-gray-600">Payment Mode: </span>
                <span className="font-bold uppercase text-gray-900">{booking.paymentMethod}</span>
              </p>
              <p>
                <span className="font-semibold text-gray-600">Payment Status: </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                  {booking.paymentStatus}
                </span>
              </p>
              {booking.paymentDetails?.transactionId && (
                <p className="font-mono text-[11px] text-gray-600">
                  UTR: {booking.paymentDetails.transactionId}
                </p>
              )}
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-right min-w-[200px]">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Total Amount Paid
              </span>
              <span className="text-2xl font-black text-emerald-950">
                ₹{booking.totalAmount?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Computer Generated Agro-Invoice. No signature required.</span>
            </div>
            <span>Help: +91 98480 12345</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
