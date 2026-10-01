import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import LocationPicker from '../components/LocationPicker';
import { 
  Tractor, 
  Calendar, 
  Clock, 
  MapPin, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  QrCode,
  ShieldCheck,
  User,
  Phone,
  Sparkles
} from 'lucide-react';

const TIME_SLOTS = [
  'Morning 4:00 AM–10:00 AM',
  'Afternoon 10:00 AM–2:00 PM',
  'Evening 2:00 PM–6:00 PM',
  'Night 6:00 PM–9:00 PM'
];

const BookService = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Booking Wizard Steps: 1: Service & Acres, 2: Location & Landmark, 3: Slot & Date, 4: Payment & Review, 5: Success
  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [systemSettings, setSystemSettings] = useState(null);

  // Form State
  const [farmerName, setFarmerName] = useState(user?.name || '');
  const [farmerPhone, setFarmerPhone] = useState(user?.phone || '');
  const [farmerEmail, setFarmerEmail] = useState(user?.email || '');
  const [selectedServiceId, setSelectedServiceId] = useState(searchParams.get('serviceId') || '');
  const [acres, setAcres] = useState(Number(searchParams.get('acres')) || 2);
  const [bookingDate, setBookingDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // Default tomorrow
  );
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);

  // Location State
  const [farmLocation, setFarmLocation] = useState({
    latitude: 11.6643,
    longitude: 78.1460,
    address: user?.farmerDetails?.defaultAddress || '',
    village: user?.farmerDetails?.village || '',
    landmark: user?.farmerDetails?.defaultLandmark || '',
    locationInstructions: ''
  });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // 'ONLINE' or 'CASH'
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');

  // UI & Validation State
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [bookedRecord, setBookedRecord] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingServices(true);
        const [servicesRes, settingsRes] = await Promise.all([
          client.get('/services'),
          client.get('/admin/settings').catch(() => ({ data: { data: null } }))
        ]);

        if (servicesRes.data.success) {
          setServices(servicesRes.data.data);
          if (!selectedServiceId && servicesRes.data.data.length > 0) {
            setSelectedServiceId(servicesRes.data.data[0]._id);
          }
        }

        if (settingsRes.data?.data) {
          setSystemSettings(settingsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load booking dependencies:', err);
      } finally {
        setLoadingServices(false);
      }
    };

    loadInitialData();
  }, []);

  // Update farmer details if user changes
  useEffect(() => {
    if (user) {
      if (!farmerName) setFarmerName(user.name);
      if (!farmerPhone) setFarmerPhone(user.phone);
      if (!farmerEmail) setFarmerEmail(user.email);
      if (user.farmerDetails?.defaultAddress && !farmLocation.address) {
        setFarmLocation(prev => ({
          ...prev,
          address: user.farmerDetails.defaultAddress,
          village: user.farmerDetails.village || prev.village,
          landmark: user.farmerDetails.defaultLandmark || prev.landmark
        }));
      }
    }
  }, [user]);

  const selectedService = services.find(s => s._id === selectedServiceId) || services[0];
  const pricePerAcre = selectedService ? selectedService.pricePerAcre : 0;
  const totalAmount = Math.round(acres * pricePerAcre);

  // File change handler
  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  // Step Validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!farmerName.trim()) newErrors.farmerName = 'Farmer name is compulsory';
      if (!farmerPhone.trim()) newErrors.farmerPhone = 'Mobile number is compulsory';
      if (!selectedServiceId) newErrors.service = 'Please select a tractor service';
      if (!acres || acres <= 0) newErrors.acres = 'Acres must be greater than 0';
    }

    if (step === 2) {
      if (!farmLocation.address.trim()) newErrors.address = 'Farm address or survey road is compulsory';
      const landmarkText = (farmLocation.landmark || '').trim();
      const instructionText = (farmLocation.locationInstructions || '').trim();
      if (!landmarkText && !instructionText) {
        newErrors.landmark = 'Landmark is strictly compulsory! If no landmark, enter detailed directions.';
      }
    }

    if (step === 3) {
      if (!bookingDate) newErrors.bookingDate = 'Please select booking date';
      if (!timeSlot) newErrors.timeSlot = 'Please select dispatch time slot';
    }

    if (step === 4) {
      if (paymentMethod === 'ONLINE') {
        if (!transactionId.trim()) {
          newErrors.transactionId = 'Transaction ID / UTR is compulsory for online payment';
        }
        if (!screenshotFile) {
          newErrors.screenshot = 'Payment screenshot is required for Admin verification';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalBookingSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    if (!isAuthenticated) {
      alert('Please login or register to confirm your tractor booking.');
      navigate(`/login?redirect=/book?serviceId=${selectedServiceId}`);
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      const formData = new FormData();
      formData.append('farmerName', farmerName.trim());
      formData.append('farmerPhone', farmerPhone.trim());
      formData.append('farmerEmail', farmerEmail.trim());
      formData.append('serviceId', selectedServiceId);
      formData.append('acres', acres);
      formData.append('bookingDate', bookingDate);
      formData.append('timeSlot', timeSlot);
      formData.append('farmLocation[latitude]', farmLocation.latitude);
      formData.append('farmLocation[longitude]', farmLocation.longitude);
      formData.append('farmLocation[address]', farmLocation.address.trim());
      formData.append('farmLocation[village]', farmLocation.village?.trim() || '');
      formData.append('farmLocation[landmark]', (farmLocation.landmark || farmLocation.locationInstructions).trim());
      formData.append('farmLocation[locationInstructions]', (farmLocation.locationInstructions || '').trim());
      formData.append('paymentMethod', paymentMethod);

      if (paymentMethod === 'ONLINE') {
        formData.append('transactionId', transactionId.trim());
        if (screenshotFile) {
          formData.append('paymentScreenshot', screenshotFile);
        }
      }

      const res = await client.post('/bookings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setBookedRecord(res.data.data);
        setCurrentStep(5);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setErrors({
        submit: err.response?.data?.message || 'Failed to place booking. Please check details.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Wizard Header Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-2">
          <span>Step {currentStep} of 5</span>
          <span className="text-samba-700 font-extrabold uppercase tracking-wider">
            {currentStep === 1 && '1. Service & Farm Acres'}
            {currentStep === 2 && '2. Google Maps Farm Location & Landmark'}
            {currentStep === 3 && '3. Date & Time Slot'}
            {currentStep === 4 && '4. Review & Payment'}
            {currentStep === 5 && '5. Booking Confirmed!'}
          </span>
        </div>
        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-samba-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errors.submit}</span>
        </div>
      )}

      {/* STEP 1: SERVICE & ACRES */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
              <Tractor className="w-6 h-6 text-samba-600" />
              <span>Select Service & Enter Acres</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Prices are calculated strictly per acre and locked permanently for this booking.
            </p>
          </div>

          {/* Farmer Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Farmer Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                placeholder="e.g. Chinnasamy Gounder"
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-samba-500 outline-none"
              />
              {errors.farmerName && <p className="text-red-500 text-xs mt-1">{errors.farmerName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number (For Rider Call) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={farmerPhone}
                onChange={(e) => setFarmerPhone(e.target.value)}
                placeholder="e.g. +91 98940 77889"
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-samba-500 outline-none"
              />
              {errors.farmerPhone && <p className="text-red-500 text-xs mt-1">{errors.farmerPhone}</p>}
            </div>
          </div>

          {/* Service Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Available Farming Machinery Service <span className="text-red-500">*</span>
            </label>
            {loadingServices ? (
              <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((service) => {
                  const isSelected = service._id === selectedServiceId;
                  return (
                    <div
                      key={service._id}
                      onClick={() => setSelectedServiceId(service._id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center space-x-3.5 ${
                        isSelected
                          ? 'border-samba-600 bg-samba-50/70 shadow-md ring-2 ring-samba-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-samba-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Tractor className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900">{service.name}</h4>
                          <span className="text-xs font-extrabold font-mono text-samba-700">
                            ₹{service.pricePerAcre}/ac
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{service.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acre Input with dynamic calculation */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Number of Acres to Service <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">Supports fractional acres (e.g. 2.5 or 5.0 acres)</p>
              </div>
              <input
                type="number"
                min="0.5"
                max="50"
                step="0.5"
                value={acres}
                onChange={(e) => setAcres(Math.max(0.5, Number(e.target.value)))}
                className="w-24 p-2.5 text-center text-base font-black font-mono rounded-xl border border-slate-300 bg-white"
              />
            </div>

            {/* Instant Calculation Output */}
            <div className="pt-4 border-t border-slate-200 flex justify-between items-center bg-white p-4 rounded-xl border">
              <div>
                <span className="text-[11px] text-slate-500 block">Calculation Breakdown:</span>
                <span className="font-mono text-xs text-samba-700 font-bold">
                  ₹{pricePerAcre.toLocaleString('en-IN')} per acre × {acres} acres
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3.5 bg-samba-600 hover:bg-samba-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center space-x-2 transition"
            >
              <span>Next: Pin Farm Location</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: FARM LOCATION & STRICTLY COMPULSORY LANDMARK */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-samba-600" />
              <span>Rapido-Style Farm GPS & Compulsory Landmark</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your assigned rider will receive this exact Google Maps coordinate and compulsory landmark instructions.
            </p>
          </div>

          <LocationPicker
            locationData={farmLocation}
            onChange={setFarmLocation}
            errors={errors}
          />

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={prevStep}
              className="px-5 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm rounded-xl transition flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3.5 bg-samba-600 hover:bg-samba-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center space-x-2 transition"
            >
              <span>Next: Select Date & Slot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DATE & TIME SLOT */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
              <Clock className="w-6 h-6 text-samba-600" />
              <span>Choose Booking Date & Dispatch Time Slot</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select one of the 4 standard farmer operational shifts. Fleet schedules are protected against double bookings.
            </p>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Service Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full sm:w-72 p-3 text-sm font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-samba-500 outline-none"
            />
          </div>

          {/* 4 Compulsory Farmer Time Slots */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Available Dispatch Time Slot <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {TIME_SLOTS.map((slot) => {
                const isSelected = timeSlot === slot;
                return (
                  <div
                    key={slot}
                    onClick={() => setTimeSlot(slot)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center space-x-3.5 ${
                      isSelected
                        ? 'border-samba-600 bg-samba-50/70 shadow-md ring-2 ring-samba-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-samba-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">{slot}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {slot.includes('Morning') && 'Optimal for soil moisture & cool engine running'}
                        {slot.includes('Afternoon') && 'High sun, dry soil pulverization'}
                        {slot.includes('Evening') && 'Pleasant conditions for finishing plough lines'}
                        {slot.includes('Night') && 'Equipped with heavy tractor LED work lamps'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={prevStep}
              className="px-5 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm rounded-xl transition flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3.5 bg-samba-600 hover:bg-samba-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center space-x-2 transition"
            >
              <span>Next: Review & Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW SUMMARY & PAYMENT METHOD */}
      {currentStep === 4 && (
        <form onSubmit={handleFinalBookingSubmit} className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-samba-600" />
                <span>Review Farm Booking Summary</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Please verify all farm and dispatch details before final confirmation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 uppercase text-[10px] text-samba-700">
                  Farmer & Location Details:
                </h3>
                <p><span className="text-slate-500">Name:</span> <strong className="text-slate-800">{farmerName}</strong></p>
                <p><span className="text-slate-500">Mobile:</span> <strong className="text-slate-800">{farmerPhone}</strong></p>
                <p><span className="text-slate-500">Farm Address:</span> <span className="text-slate-800">{farmLocation.address}</span></p>
                <p>
                  <span className="text-slate-500">Landmark / Instructions:</span>{' '}
                  <strong className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                    {farmLocation.landmark}
                  </strong>
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 uppercase text-[10px] text-samba-700">
                  Machinery & Slot Details:
                </h3>
                <p><span className="text-slate-500">Service:</span> <strong className="text-slate-800">{selectedService?.name}</strong></p>
                <p><span className="text-slate-500">Acreage:</span> <strong className="text-slate-800">{acres} Acres</strong></p>
                <p><span className="text-slate-500">Locked Rate:</span> <strong className="text-slate-800">₹{pricePerAcre.toLocaleString('en-IN')} / acre</strong></p>
                <p><span className="text-slate-500">Date & Slot:</span> <strong className="text-samba-800 font-semibold">{bookingDate} • {timeSlot}</strong></p>
              </div>
            </div>

            {/* Total Cost Banner */}
            <div className="bg-samba-900 text-white p-5 rounded-2xl flex justify-between items-center shadow-lg">
              <div>
                <span className="text-xs text-samba-200 block">Total Booking Amount:</span>
                <span className="text-xs text-samba-300 font-mono">
                  {acres} acres × ₹{pricePerAcre}/acre (All inclusive)
                </span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-harvest-300 font-mono">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Payment Method <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Online UPI Payment */}
                <div
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition space-y-2 ${
                    paymentMethod === 'ONLINE'
                      ? 'border-samba-600 bg-samba-50/70 shadow-md ring-2 ring-samba-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${paymentMethod === 'ONLINE' ? 'bg-samba-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Online UPI Payment</h4>
                      <p className="text-[11px] text-slate-500">Scan QR / Pay to Admin UPI ID</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal pt-1">
                    Pay online now, enter Transaction ID and upload screenshot for manual Admin verification.
                  </p>
                </div>

                {/* Offline Cash on Completion */}
                <div
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition space-y-2 ${
                    paymentMethod === 'CASH'
                      ? 'border-samba-600 bg-samba-50/70 shadow-md ring-2 ring-samba-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${paymentMethod === 'CASH' ? 'bg-samba-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Offline / Cash on Completion</h4>
                      <p className="text-[11px] text-slate-500">Pay directly at field</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal pt-1">
                    Pay cash directly to the tractor driver upon completion of ploughing/tilling work.
                  </p>
                </div>
              </div>

              {/* Online Payment Section Details */}
              {paymentMethod === 'ONLINE' && (
                <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-6 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row items-center gap-6 bg-white p-5 rounded-xl border border-slate-200">
                    {/* Admin Configured QR Code */}
                    <div className="flex flex-col items-center">
                      <div className="w-40 h-40 bg-white p-2 border-2 border-slate-300 rounded-xl shadow-inner flex items-center justify-center">
                        <img
                          src={
                            systemSettings?.qrCodeUrl ||
                            `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3Dsambatractors%40upi%26pn%3DSamba%20Tractors%26am%3D${totalAmount}%26cu%3DINR`
                          }
                          alt="Samba Tractors Official Payment QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 font-semibold">Scan with GPay / PhonePe / Paytm</span>
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="inline-flex items-center space-x-1 text-[11px] bg-samba-100 text-samba-800 font-bold px-2 py-0.5 rounded">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Official Samba Tractors UPI Channel</span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900">
                        Payable Amount: <span className="text-samba-700 font-mono">₹{totalAmount.toLocaleString('en-IN')}</span>
                      </h4>
                      <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800">
                        <span className="text-slate-500 font-sans block text-[10px]">Official UPI ID:</span>
                        <strong>{systemSettings?.upiId || 'sambatractors@upi'}</strong>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        After transferring ₹{totalAmount}, enter the 12-digit UTR/Transaction ID below and upload the screenshot.
                      </p>
                    </div>
                  </div>

                  {/* Transaction ID & Screenshot */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Bank Transaction ID / UTR <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={paymentMethod === 'ONLINE'}
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. 428938192011"
                        className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-samba-500 outline-none"
                      />
                      {errors.transactionId && (
                        <p className="text-red-500 text-xs mt-1">{errors.transactionId}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Payment Screenshot / Receipt <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        required={paymentMethod === 'ONLINE'}
                        onChange={handleScreenshotChange}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                      {errors.screenshot && (
                        <p className="text-red-500 text-xs mt-1">{errors.screenshot}</p>
                      )}
                      {screenshotPreview && (
                        <div className="mt-2 h-16 w-16 rounded-lg overflow-hidden border border-slate-300">
                          <img src={screenshotPreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm rounded-xl transition flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-4 bg-samba-600 hover:bg-samba-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-samba-600/30 flex items-center space-x-2 transition transform hover:-translate-y-0.5"
              >
                <Tractor className="w-5 h-5 text-harvest-300" />
                <span>{submitting ? 'Placing Farm Booking...' : `Confirm & Place Booking (₹${totalAmount.toLocaleString('en-IN')})`}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 5: SUCCESS CELEBRATION */}
      {currentStep === 5 && bookedRecord && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-samba-100 text-samba-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-samba-700 bg-samba-50 px-3 py-1 rounded-full">
              Booking Placed Successfully!
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Your Tractor Service is Booked
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Booking Number:{' '}
              <strong className="text-slate-900 font-mono text-base bg-slate-100 px-2 py-0.5 rounded">
                #{bookedRecord.bookingNumber}
              </strong>
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-lg mx-auto text-xs text-left space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Service:</span>
              <span className="font-bold text-slate-800">{bookedRecord.serviceName} ({bookedRecord.acres} Acres)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Total Locked Amount:</span>
              <span className="font-bold font-mono text-slate-900">₹{bookedRecord.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Dispatch Slot:</span>
              <span className="font-bold text-slate-800">{bookedRecord.bookingDate} • {bookedRecord.timeSlot}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Farm Landmark:</span>
              <span className="font-bold text-amber-800">{bookedRecord.farmLocation?.landmark}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Payment Status:</span>
              <span className="font-bold text-samba-700">{bookedRecord.paymentStatus} ({bookedRecord.paymentMethod})</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/farmer/dashboard')}
              className="px-6 py-3.5 bg-samba-600 hover:bg-samba-700 text-white font-bold text-sm rounded-xl shadow-md transition"
            >
              Go to Farmer Dashboard
            </button>
            <button
              onClick={() => navigate(`/track/${bookedRecord._id}`)}
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl transition"
            >
              Track Live Dispatch
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookService;
