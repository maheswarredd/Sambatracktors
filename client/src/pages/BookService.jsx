import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import RapidoMapPicker from '../components/RapidoMapPicker';
import {
  Tractor,
  Calendar,
  Clock,
  CreditCard,
  Banknote,
  Upload,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export const BookService = () => {
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState(null);

  // Form State (preserved across language changes)
  const [formData, setFormData] = useState({
    farmerName: user?.name || '',
    farmerPhone: user?.phone || '',
    serviceId: searchParams.get('serviceId') || '',
    quantity: 1,
    bookingDate: new Date().toISOString().slice(0, 10),
    timeSlot: 'MORNING', // MORNING, AFTERNOON, EVENING, NIGHT
    farmLocation: {
      latitude: 17.0044,
      longitude: 81.7300,
      address: '',
      village: '',
      landmark: '',
      locationInstructions: ''
    },
    paymentMethod: 'ONLINE', // ONLINE or OFFLINE
    transactionId: '',
    screenshotFile: null,
    screenshotPreview: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Update farmer details if user changes
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        farmerName: prev.farmerName || user.name,
        farmerPhone: prev.farmerPhone || user.phone,
        farmLocation: {
          ...prev.farmLocation,
          address: prev.farmLocation.address || user.address || '',
          village: prev.farmLocation.village || user.village || ''
        }
      }));
    }
  }, [user]);

  // Fetch Services & Settings
  useEffect(() => {
    const init = async () => {
      try {
        const [servicesRes, settingsRes] = await Promise.all([
          api.getServices('', true),
          api.getPaymentSettings()
        ]);
        if (servicesRes.success) {
          setServices(servicesRes.data);
          // If serviceId passed in URL, auto select
          const qId = searchParams.get('serviceId');
          if (qId && servicesRes.data.some((s) => s._id === qId)) {
            setFormData((prev) => ({ ...prev, serviceId: qId }));
          } else if (servicesRes.data.length > 0 && !formData.serviceId) {
            setFormData((prev) => ({ ...prev, serviceId: servicesRes.data[0]._id }));
          }
        }
        if (settingsRes.success) {
          setPaymentSettings(settingsRes.data);
        }
      } catch (err) {
        console.error('Failed to load initial booking data:', err);
      } finally {
        setLoadingServices(false);
      }
    };
    init();
  }, [searchParams]);

  // Current selected service details
  const selectedService = services.find((s) => s._id === formData.serviceId);
  const isAcre = selectedService?.unit === 'Acre';
  const unitPrice = selectedService?.price || 0;
  const quantityNum = Math.max(1, Number(formData.quantity) || 1);
  const totalAmount = quantityNum * unitPrice;

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        screenshotFile: file,
        screenshotPreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isAuthenticated) {
      navigate('/login?redirect=/book');
      return;
    }

    // 1. Mandatory validation
    if (!formData.farmerName || !formData.farmerPhone || !formData.serviceId || !formData.bookingDate || !formData.timeSlot) {
      setErrorMsg(t('booking.validationError'));
      return;
    }

    if (!formData.farmLocation.address) {
      setErrorMsg(language === 'te' ? 'పొలం చిరునామా తప్పనిసరి' : language === 'hi' ? 'खेत का पता अनिवार्य है' : 'Farm address is required.');
      return;
    }

    // Compulsory Landmark or detailed location instructions check
    const hasLandmark = formData.farmLocation.landmark && formData.farmLocation.landmark.trim().length > 0;
    const hasInstructions = formData.farmLocation.locationInstructions && formData.farmLocation.locationInstructions.trim().length > 0;
    if (!hasLandmark && !hasInstructions) {
      setErrorMsg(
        language === 'te'
          ? 'ల్యాండ్‌మార్క్ తప్పనిసరి. ల్యాండ్‌మార్క్ లేకపోతే దారి సూచనలు రాయండి.'
          : language === 'hi'
          ? 'लैंडमार्क अनिवार्य है। यदि लैंडमार्क नहीं है, तो विस्तृत रास्ता निर्देश लिखें।'
          : 'Landmark is compulsory. If no landmark is available, detailed location instructions must be provided.'
      );
      return;
    }

    // If online payment, ensure UTR transaction ID is entered
    if (formData.paymentMethod === 'ONLINE' && !formData.transactionId.trim()) {
      setErrorMsg(
        language === 'te'
          ? 'ఆన్‌లైన్ చెల్లింపు కోసం UPI UTR నంబర్ తప్పనిసరి.'
          : language === 'hi'
          ? 'ऑनलाइन भुगतान के लिए UPI UTR नंबर अनिवार्य है।'
          : 'Please enter the 12-digit UPI Transaction / UTR ID.'
      );
      return;
    }

    try {
      setSubmitting(true);

      // Create Booking first
      const bookingPayload = {
        farmerName: formData.farmerName,
        farmerPhone: formData.farmerPhone,
        serviceId: formData.serviceId,
        quantity: quantityNum,
        bookingDate: formData.bookingDate,
        timeSlot: formData.timeSlot,
        farmLocation: formData.farmLocation,
        paymentMethod: formData.paymentMethod
      };

      const bookingRes = await api.createBooking(bookingPayload);
      if (!bookingRes.success) {
        throw new Error(bookingRes.message || 'Failed to create booking');
      }

      const createdBooking = bookingRes.data;

      // If Online payment, submit payment proof
      if (formData.paymentMethod === 'ONLINE') {
        const paymentData = new FormData();
        paymentData.append('bookingId', createdBooking._id);
        paymentData.append('transactionId', formData.transactionId);
        if (formData.screenshotFile) {
          paymentData.append('screenshot', formData.screenshotFile);
        }

        await api.submitPaymentProof(paymentData);
      }

      // Navigate to booking success page with details
      navigate(`/booking-success?id=${createdBooking._id}`);
    } catch (err) {
      console.error('Booking submission failed:', err);
      setErrorMsg(err.message || 'An error occurred during booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
          <Tractor className="w-3.5 h-3.5 text-emerald-700" />
          <span>{t('brand')} Mechanized Booking</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
          {t('booking.title')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto">
          {t('booking.subtitle')}
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION A: Farmer & Service Selection */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">
              1
            </span>
            <span>{t('booking.farmerDetails')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Farmer Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('booking.name')} *
              </label>
              <input
                type="text"
                required
                value={formData.farmerName}
                onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                placeholder={t('booking.namePlaceholder')}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('booking.mobile')} *
              </label>
              <input
                type="tel"
                required
                value={formData.farmerPhone}
                onChange={(e) => setFormData({ ...formData, farmerPhone: e.target.value })}
                placeholder={t('booking.mobilePlaceholder')}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Service Dropdown */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('booking.serviceSelect')} *
            </label>
            <select
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="">{t('booking.chooseService')}</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name[language] || s.name.en} — ₹{s.price} / {s.unit === 'Acre' ? (language === 'te' ? 'ఎకరం' : language === 'hi' ? 'एकड़' : 'Acre') : (language === 'te' ? 'ట్రిప్పు' : language === 'hi' ? 'ट्रिप' : 'Trip')}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Quantity Field: Acre vs Trip */}
          {selectedService && (
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-black text-emerald-950 mb-1">
                  {isAcre ? t('booking.quantityLabelAcre') : t('booking.quantityLabelTrip')} *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-32 text-sm font-bold px-3 py-2 rounded-xl border border-emerald-300 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-emerald-800">
                    {isAcre
                      ? (language === 'te' ? 'ఎకరాలు' : language === 'hi' ? 'एकड़' : 'Acres')
                      : (language === 'te' ? 'ట్రిప్పులు' : language === 'hi' ? 'ट्रिप' : 'Trips')}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-700 mt-1">
                  Rate: ₹{selectedService.price} per {selectedService.unit}
                </p>
              </div>

              {/* Real-time Calculation Display */}
              <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-4">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  {t('booking.totalAmount')}
                </span>
                <span className="text-2xl font-black text-emerald-950">
                  ₹{totalAmount.toLocaleString()}
                </span>
                <p className="text-[10px] text-emerald-600 font-mono">
                  {quantityNum} × ₹{unitPrice}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SECTION B: Date & Compulsory Time Slot */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">
              2
            </span>
            <span>Date & Compulsory Time Slot</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Booking Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('booking.date')} *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={formData.bookingDate}
                onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('booking.timeSlot')} *
              </label>
              <div className="space-y-2">
                {[
                  { id: 'MORNING', label: t('booking.slotMorning') },
                  { id: 'AFTERNOON', label: t('booking.slotAfternoon') },
                  { id: 'EVENING', label: t('booking.slotEvening') },
                  { id: 'NIGHT', label: t('booking.slotNight') }
                ].map((slot) => (
                  <label
                    key={slot.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      formData.timeSlot === slot.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-sm'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="timeSlot"
                      value={slot.id}
                      checked={formData.timeSlot === slot.id}
                      onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{slot.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C: Rapido-style GPS Map Picker & Mandatory Landmark */}
        <RapidoMapPicker
          locationData={formData.farmLocation}
          onChange={(newLocation) => setFormData({ ...formData, farmLocation: newLocation })}
        />

        {/* SECTION D: Payment Mode (Online UPI/QR or Offline/Cash) */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">
              4
            </span>
            <span>{t('booking.paymentMethod')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Online Option */}
            <div
              onClick={() => setFormData({ ...formData, paymentMethod: 'ONLINE' })}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                formData.paymentMethod === 'ONLINE'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CreditCard className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-gray-900">{t('booking.onlinePayment')}</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Scan Samba Tractors QR code & enter 12-digit UTR reference
                </p>
              </div>
            </div>

            {/* Offline Option */}
            <div
              onClick={() => setFormData({ ...formData, paymentMethod: 'OFFLINE' })}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                formData.paymentMethod === 'OFFLINE'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Banknote className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-gray-900">{t('booking.offlinePayment')}</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {t('payment.cashNotice')}
                </p>
              </div>
            </div>
          </div>

          {/* Online Payment Details & Proof Upload */}
          {formData.paymentMethod === 'ONLINE' && (
            <div className="p-5 bg-gradient-to-br from-emerald-950 to-green-950 text-white rounded-2xl space-y-4 shadow-inner">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-3 border-b border-emerald-800">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-400">
                    Official Payment Channel
                  </span>
                  <p className="text-xs font-medium text-emerald-200 mt-0.5">
                    UPI ID: <span className="font-mono font-bold text-white text-sm">{paymentSettings?.upiId || 'sambatractors@okaxis'}</span>
                  </p>
                  <p className="text-[11px] text-emerald-300">
                    Payee: {paymentSettings?.accountHolder || 'Samba Tractors Agricultural Services'}
                  </p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-2 rounded-xl text-center shadow-lg">
                  <img
                    src={
                      paymentSettings?.qrCodeUrl ||
                      `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=sambatractors@okaxis%26pn=Samba%20Tractors%26am=${totalAmount}%26cu=INR`
                    }
                    alt="Samba Tractors UPI QR Code"
                    className="w-28 h-28 object-contain mx-auto"
                  />
                  <span className="text-[9px] font-bold text-gray-700 block mt-1">
                    Scan with PhonePe/GPay
                  </span>
                </div>
              </div>

              {/* UTR Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    {t('payment.transactionId')} <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required={formData.paymentMethod === 'ONLINE'}
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    placeholder={t('payment.transactionIdPlaceholder')}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white text-gray-900 border border-emerald-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                  />
                </div>

                {/* Upload Screenshot */}
                <div>
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    {t('payment.uploadScreenshot')}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="w-full text-xs text-emerald-200 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-400 file:text-emerald-950 hover:file:bg-amber-300"
                  />
                  {formData.screenshotPreview && (
                    <div className="mt-2">
                      <img
                        src={formData.screenshotPreview}
                        alt="Screenshot Preview"
                        className="h-16 w-28 object-cover rounded-lg border border-emerald-500 shadow"
                      />
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-emerald-300">
                ℹ️ {t('payment.statusPending')}
              </p>
            </div>
          )}
        </div>

        {/* Submit Booking Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-base py-4 rounded-2xl shadow-xl shadow-orange-950/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-60"
          >
            {submitting ? (
              <span>{t('booking.submitting')}</span>
            ) : (
              <>
                <Tractor className="w-5 h-5 fill-white" />
                <span>{t('booking.submitBooking')} (₹{totalAmount.toLocaleString()})</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookService;
