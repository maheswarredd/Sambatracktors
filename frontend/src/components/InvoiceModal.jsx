import React from 'react';
import { X, Printer, Download, Tractor, CheckCircle, ShieldCheck } from 'lucide-react';

const InvoiceModal = ({ booking, isOpen, onClose }) => {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Modal Controls (No print) */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center no-print">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Tax Invoice & Service Receipt
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-samba-600 hover:bg-samba-700 text-white text-xs font-bold rounded-lg shadow transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-8 bg-white text-slate-800">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-samba-600 pb-6 mb-6">
            <div>
              <div className="flex items-center space-x-2.5 mb-1">
                <div className="w-10 h-10 bg-samba-700 rounded-xl flex items-center justify-center text-white">
                  <Tractor className="w-6 h-6 text-harvest-400" />
                </div>
                <div>
                  <h1 className="font-extrabold text-2xl tracking-tight text-slate-900">
                    Samba <span className="text-samba-600">Tractors</span>
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Reliable Tractor Services for Every Farm
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Central Dispatch Office, Salem-Valapadi Agricultural Corridor<br />
                Tamil Nadu, India • Helpline: +91 98420 56789
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block bg-samba-100 text-samba-800 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                Official Receipt
              </span>
              <p className="text-xs font-mono font-bold text-slate-900">
                Booking ID: {booking.bookingNumber}
              </p>
              <p className="text-xs text-slate-500">
                Date: {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Farmer & Dispatch Details */}
          <div className="grid grid-cols-2 gap-6 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-samba-700 mb-1.5">
                Billed To (Farmer):
              </h3>
              <p className="font-bold text-slate-800 text-sm">{booking.farmerName}</p>
              <p className="text-slate-600 mt-0.5">Phone: {booking.farmerPhone}</p>
              <p className="text-slate-600 mt-0.5">Farm: {booking.farmLocation?.address}</p>
              <p className="text-slate-600 mt-0.5">Landmark: {booking.farmLocation?.landmark}</p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-samba-700 mb-1.5">
                Dispatched Fleet Details:
              </h3>
              <p className="text-slate-700">
                <span className="font-semibold">Assigned Rider:</span> {booking.assignedRider?.name || 'Assigned Driver'}
              </p>
              <p className="text-slate-700 mt-0.5">
                <span className="font-semibold">Tractor Model:</span> {booking.assignedTractor?.modelName || 'Mahindra Heavy Fleet'}
              </p>
              <p className="text-slate-700 mt-0.5">
                <span className="font-semibold">Registration:</span> {booking.assignedTractor?.registrationNumber || 'Fleet Verified'}
              </p>
              <p className="text-slate-700 mt-0.5">
                <span className="font-semibold">Slot:</span> {booking.timeSlot} ({booking.bookingDate})
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Service Description</th>
                  <th className="py-3 px-4 text-center">Acres Serviced</th>
                  <th className="py-3 px-4 text-right">Locked Rate / Acre</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {booking.serviceName}
                    <span className="block text-[10px] text-slate-500 font-normal">
                      Full farm tractor operation with verified driver & implements
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    {booking.acres} {booking.acres > 1 ? 'Acres' : 'Acre'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                    ₹{booking.pricePerAcre.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                    ₹{booking.totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment & Totals Breakdown */}
          <div className="grid grid-cols-2 gap-6 items-start border-t border-slate-200 pt-4 mb-8">
            <div className="text-xs space-y-1.5">
              <p>
                <span className="font-semibold text-slate-600">Payment Method:</span>{' '}
                <span className="font-bold text-slate-800">{booking.paymentMethod}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-600">Payment Status:</span>{' '}
                <span className={`font-bold ${booking.paymentStatus === 'VERIFIED' || booking.paymentStatus === 'COMPLETED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {booking.paymentStatus}
                </span>
              </p>
              {booking.paymentDetails?.transactionId && (
                <p className="font-mono text-[11px] text-slate-600">
                  <span className="font-semibold">Txn / UTR:</span> {booking.paymentDetails.transactionId}
                </p>
              )}
              <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-semibold pt-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified by Samba Tractors Operations System</span>
              </div>
            </div>

            <div className="bg-samba-50/60 p-4 rounded-xl border border-samba-200 text-right">
              <span className="text-xs text-samba-800 font-medium block">Total Payable:</span>
              <span className="text-2xl font-black text-samba-900 font-mono">
                ₹{booking.totalAmount.toLocaleString('en-IN')}
              </span>
              <span className="block text-[10px] text-slate-500 mt-1">
                (Inclusive of tractor diesel, driver allowance & implement wear)
              </span>
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-dashed border-slate-200 pt-4 text-center text-[10px] text-slate-400">
            Thank you for partnering with Samba Tractors! For any post-service queries or refunds, refer to Booking ID #{booking.bookingNumber}.
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
