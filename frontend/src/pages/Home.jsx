import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { 
  Tractor, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  Calculator, 
  PhoneCall, 
  Truck, 
  Sparkles,
  Award
} from 'lucide-react';

const Home = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick interactive calculator state on home page
  const [calcServiceId, setCalcServiceId] = useState('');
  const [calcAcres, setCalcAcres] = useState(3);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await client.get('/services');
        if (res.data.success) {
          setServices(res.data.data);
          if (res.data.data.length > 0) {
            setCalcServiceId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const selectedCalcService = services.find((s) => s._id === calcServiceId) || services[0];
  const calculatedTotal = selectedCalcService
    ? Math.round(calcAcres * selectedCalcService.pricePerAcre)
    : 0;

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-samba-950 via-slate-900 to-slate-950 text-white pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-samba-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-samba-900/80 border border-samba-600/50 text-samba-300 text-xs font-bold tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-harvest-400 animate-pulse"></span>
                <span>Fast On-Demand Tractor Booking</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Samba <span className="text-samba-400">Tractors</span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl font-extrabold text-harvest-300 mt-2">
                  Reliable Tractor Services for Every Farm
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Experience rapido-fast tractor dispatch directly to your field. Deep ploughing, rotavators, seeding, and combine harvesting with transparent acre-based rates, GPS pin drop, and verified local drivers.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/book"
                  className="px-8 py-4 bg-samba-500 hover:bg-samba-600 text-slate-950 font-extrabold text-base rounded-xl shadow-xl shadow-samba-500/25 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
                >
                  <Tractor className="w-5 h-5 text-slate-950" />
                  <span>Book a Tractor Now</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <Link
                  to="/services"
                  className="px-6 py-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-bold text-base rounded-xl flex items-center justify-center space-x-2 transition"
                >
                  <span>Explore All Services</span>
                </Link>
              </div>

              {/* Key Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-xl sm:text-2xl font-black text-white block">₹1,400+</span>
                  <span className="text-slate-400">Fair Acre Rates</span>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-harvest-400 block">4 Dispatch</span>
                  <span className="text-slate-400">Daily Time Slots</span>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-samba-400 block">GPS Pin</span>
                  <span className="text-slate-400">Direct Field Route</span>
                </div>
              </div>
            </div>

            {/* Right Column: Instant Live Acre Calculator Widget */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-samba-500 rounded-xl text-slate-950">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base">Instant Rate Calculator</h3>
                      <p className="text-[11px] text-slate-300">Acre-Based Fair Pricing Estimator</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-harvest-400 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                    Live
                  </span>
                </div>

                {/* Service Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    Select Farming Service
                  </label>
                  <select
                    value={calcServiceId}
                    onChange={(e) => setCalcServiceId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/20 rounded-xl p-3 text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-samba-400 outline-none"
                  >
                    {services.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} — ₹{s.pricePerAcre.toLocaleString('en-IN')}/acre
                      </option>
                    ))}
                  </select>
                </div>

                {/* Acres Slider & Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                    <label className="uppercase tracking-wider">Number of Acres</label>
                    <span className="text-harvest-300 font-mono text-base font-black">
                      {calcAcres} {calcAcres === 1 ? 'Acre' : 'Acres'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={calcAcres}
                    onChange={(e) => setCalcAcres(Number(e.target.value))}
                    className="w-full accent-samba-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 Acre</span>
                    <span>10 Acres</span>
                    <span>20+ Acres</span>
                  </div>
                </div>

                {/* Calculation Output Box */}
                <div className="bg-slate-900/90 rounded-2xl p-4 border border-samba-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Estimated Farm Cost:</span>
                    <span className="text-xs text-samba-300 font-mono">
                      ₹{selectedCalcService?.pricePerAcre || 0}/acre × {calcAcres} ac
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-harvest-300 font-mono">
                      ₹{calculatedTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/book?serviceId=${calcServiceId}&acres=${calcAcres}`}
                  className="w-full py-3.5 bg-samba-500 hover:bg-samba-600 text-slate-950 font-black text-center rounded-xl shadow-lg transition flex items-center justify-center space-x-2 text-sm"
                >
                  <span>Book for ₹{calculatedTotal.toLocaleString('en-IN')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Services Grid (Admin Configured) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-samba-700 bg-samba-100 px-3 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-samba-600" />
            <span>Dynamic Tractor Fleet Implements</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Available Farming & Field Services
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Every service is managed directly with acre-based transparent rates. Prices locked at booking time so you never pay extra.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service._id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-samba-500 shadow-sm hover:shadow-xl transition duration-300 overflow-hidden flex flex-col group"
              >
                {/* Service Image with category badge */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={service.image || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80'}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/20">
                    {service.category}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-samba-600 text-white font-mono font-black text-sm px-3 py-1 rounded-xl shadow-md">
                    ₹{service.pricePerAcre.toLocaleString('en-IN')}{' '}
                    <span className="text-[10px] font-medium font-sans">/ acre</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-samba-700 transition">
                      {service.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Features pill tags */}
                    {service.features && service.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {service.features.slice(0, 3).map((feat, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                          >
                            ✓ {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Est. 5 Acres:</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        ₹{(service.pricePerAcre * 5).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <Link
                      to={`/book?serviceId=${service._id}`}
                      className="px-4 py-2 bg-samba-600 hover:bg-samba-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition transform group-hover:translate-x-1"
                    >
                      <span>Book Service</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How Samba Tractors Works (Rapido-Style Booking) */}
      <section className="bg-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold text-samba-700 uppercase tracking-wider">
              Seamless 5-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              How Samba Tractors Works
            </h2>
            <p className="text-sm text-slate-600">
              Booking a heavy tractor is as intuitive and quick as booking a Rapido ride.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              {
                step: '01',
                title: 'Select Service',
                desc: 'Choose ploughing, rotavator, seeding, or combine harvesting.',
                icon: Tractor
              },
              {
                step: '02',
                title: 'Enter Acres',
                desc: 'Transparent calculation: ₹1,800/acre × 5 acres = ₹9,000.',
                icon: Calculator
              },
              {
                step: '03',
                title: 'Pin Farm Location',
                desc: 'Auto-detect GPS or drop pin on Google Maps with compulsory landmark.',
                icon: MapPin
              },
              {
                step: '04',
                title: 'Pick Time Slot',
                desc: 'Morning (4-10 AM), Afternoon, Evening, or Night dispatch.',
                icon: Clock
              },
              {
                step: '05',
                title: 'Tractor Dispatched',
                desc: 'Live tracking, direct phone call, and pay via UPI or Cash.',
                icon: Truck
              }
            ].map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.step}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative space-y-3 text-center"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-samba-100 text-samba-700 flex items-center justify-center font-black">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-black font-mono text-samba-600 block">
                    STEP {st.step}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900">{st.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Farmers Trust Samba Tractors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold text-samba-700 uppercase tracking-wider">
              Farmer Satisfaction Guaranteed
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Designed Specifically for Rural Indian Agriculture
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              No more searching through village brokers or paying inflated hourly rates. Samba Tractors gives you guaranteed machinery availability, certified riders, and digital invoices.
            </p>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-samba-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Locked Price Per Acre Guarantee</span>
                  <p className="text-slate-500 text-xs">
                    Price at booking time is permanently saved. Never increases due to diesel spikes.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-samba-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Compulsory Landmark & Step-by-Step Directions</span>
                  <p className="text-slate-500 text-xs">
                    Riders never get lost in rural canal roads because clear farm instructions are enforced.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-samba-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Direct Device Phone Call & Live Socket.IO Chat</span>
                  <p className="text-slate-500 text-xs">
                    Instant phone dialer connectivity between farmer and rider, backed by central support.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80"
                alt="Tractor in field"
                className="w-full h-[400px] object-cover"
              />
            </div>
            {/* Overlay badge */}
            <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl border border-slate-200 max-w-xs space-y-1">
              <div className="flex items-center space-x-1 text-harvest-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-harvest-400" />
                ))}
              </div>
              <p className="font-extrabold text-xs text-slate-900">4.9 / 5 Average Farmer Rating</p>
              <p className="text-[10px] text-slate-500">Over 1,200+ acres successfully ploughed this season</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Hotline Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-samba-800 via-samba-700 to-samba-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-black">Need Tractor Service Urgently?</h3>
            <p className="text-xs sm:text-sm text-samba-100 max-w-xl">
              Morning 4:00 AM slots are available now. Call our dispatch desk or book online in 2 minutes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href="tel:+919842056789"
              className="px-6 py-3.5 bg-white text-samba-900 font-extrabold text-xs sm:text-sm rounded-xl shadow-md hover:bg-slate-100 transition flex items-center space-x-2"
            >
              <PhoneCall className="w-4 h-4 text-samba-700" />
              <span>Call Helpline (+91 98420 56789)</span>
            </a>

            <Link
              to="/book"
              className="px-6 py-3.5 bg-harvest-400 hover:bg-harvest-500 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition"
            >
              Book Online Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
