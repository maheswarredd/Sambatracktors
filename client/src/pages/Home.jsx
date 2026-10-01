import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import ServiceCard from '../components/ServiceCard';
import {
  Tractor,
  Compass,
  Clock,
  ShieldCheck,
  Search,
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  Users
} from 'lucide-react';

export const Home = () => {
  const { t, language } = useLanguage();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const res = await api.getServices();
        if (res.success) {
          setServices(res.data);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const categories = [
    {
      key: 'ALL',
      label: language === 'te' ? 'అన్ని సేవలు (29)' : language === 'hi' ? 'सभी सेवाएं (29)' : 'All Services (29)'
    },
    {
      key: 'SOIL_PLOUGHING',
      label: t('categories.ploughing'),
      desc: t('categories.ploughingDesc'),
      image: '/images/cat_ploughing.jpg',
      badge: '9 Services'
    },
    {
      key: 'SEED_SOWING',
      label: t('categories.sowing'),
      desc: t('categories.sowingDesc'),
      image: '/images/cat_seeding.jpg',
      badge: '7 Services'
    },
    {
      key: 'TROLLEY_LOAD',
      label: t('categories.trolley'),
      desc: t('categories.trolleyDesc'),
      image: '/images/cat_trolley.jpg',
      badge: '13 Services'
    }
  ];

  const filteredServices = services.filter((s) => {
    const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
    const nameMatch =
      s.name?.te?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name?.en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name?.hi?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && nameMatch;
  });

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-850 to-emerald-950 text-white pt-10 pb-20 lg:pt-16 lg:pb-28">
        {/* Background Overlay */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4ade80_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold tracking-wide backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('hero.tagline')}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
                {t('hero.heading')}
              </h1>

              <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed max-w-2xl font-normal">
                {t('hero.subheading')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/book"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-xl shadow-orange-950/40 flex items-center gap-2 hover:scale-105 transition-all"
                >
                  <Tractor className="w-5 h-5 fill-white" />
                  <span>{t('hero.ctaBook')}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <a
                  href="#services-section"
                  className="bg-emerald-800/60 hover:bg-emerald-800 text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl border border-emerald-600/50 backdrop-blur-md transition"
                >
                  {t('hero.ctaExplore')}
                </a>
              </div>

              {/* Trust badges */}
              <div className="pt-6 grid grid-cols-3 gap-3 border-t border-emerald-700/50 text-emerald-200 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{t('hero.statFarmers')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{t('hero.statVillages')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tractor className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{t('hero.statTractors')}</span>
                </div>
              </div>
            </div>

            {/* Right Column Banner Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-700/40 group">
                <img
                  src="/images/hero_banner.jpg"
                  alt="Samba Tractors Heavy Field Work"
                  className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl text-gray-900 border border-emerald-100 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-emerald-950">
                        {language === 'te' ? 'GPS ద్వారా వేగవంతమైన బుకింగ్' : language === 'hi' ? 'GPS आधारित त्वरित बुकिंग' : 'Fast GPS Tractor Dispatch'}
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        {language === 'te' ? 'మీ పొలం లొకేషన్‌కు నేరుగా ట్రాక్టర్ వస్తుంది' : language === 'hi' ? 'ट्रैक्टर सीधे आपके खेत पर पहुंचेगा' : 'Arrives directly at your farm entrance'}
                      </p>
                    </div>
                    <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      📍
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Categories Highlights Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.filter(c => c.key !== 'ALL').map((cat) => (
            <div
              key={cat.key}
              onClick={() => {
                setSelectedCategory(cat.key);
                document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-md hover:shadow-xl transition cursor-pointer group hover:-translate-y-1.5 flex flex-col justify-between"
            >
              <div className="relative h-40 rounded-2xl overflow-hidden mb-4">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="absolute bottom-2.5 left-3 text-xs font-black uppercase text-amber-300">
                  {cat.badge}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition">
                  {cat.label}
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {cat.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>{language === 'te' ? 'సేవలు చూడండి' : language === 'hi' ? 'सेवाएं देखें' : 'View Services'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Grid Section */}
      <section id="services-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
              {language === 'te' ? 'లభ్యమయ్యే సేవలు' : language === 'hi' ? 'उपलब्ध सेवाएं' : 'Catalog'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
              {language === 'te' ? 'అధికారిక ట్రాక్టర్ సేవల జాబితా' : language === 'hi' ? 'आधिकारिक ट्रैक्टर सेवाओं की सूची' : 'Official Tractor Services List'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'te'
                ? 'ఎకరాలు లేదా ట్రిప్పుల ప్రాతిపదికన పారదర్శక ధరలు'
                : language === 'hi'
                ? 'एकड़ अथवा ट्रिप के आधार पर पारदर्शी दरें'
                : 'Transparent Acre & Trip based fixed tariffs'}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'te' ? 'సేవను వెతకండి...' : language === 'hi' ? 'सेवा खोजें...' : 'Search services...'}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedCategory(c.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedCategory === c.key
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Services Cards */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">{t('common.loading')}</div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-sm">
            {language === 'te' ? 'సేవలు కనుగొనబడలేదు' : language === 'hi' ? 'कोई सेवा नहीं मिली' : 'No matching services found.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}
      </section>

      {/* Rapido style How It Works Feature */}
      <section className="bg-emerald-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              {language === 'te' ? 'సులువైన 4 దశలు' : language === 'hi' ? 'सरल 4 चरण' : 'How Samba Tractors Works'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              {language === 'te' ? 'రైతు పొలానికి ట్రాక్టర్ బుకింగ్ విధానం' : language === 'hi' ? 'खेत तक ट्रैक्टर बुकिंग की प्रक्रिया' : 'Booking Experience Like Never Before'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: language === 'te' ? 'సేవను ఎంచుకోండి' : language === 'hi' ? 'सेवा चुनें' : 'Select Service',
                desc: language === 'te' ? 'నేల దున్నడం, విత్తనాలు లేదా లోడ్ పనులను ఎంచుకుని ఎకరాలు/ట్రిప్పులు నమోదు చేయండి.' : language === 'hi' ? 'जुताई, बुवाई अथवा ढुलाई चुनकर एकड़ या ट्रिप दर्ज करें।' : 'Pick from our 29 verified tractor services with transparent acre/trip tariffs.'
              },
              {
                step: '02',
                title: language === 'te' ? 'GPS పొలం లొకేషన్' : language === 'hi' ? 'GPS खेत स्थान' : 'GPS Farm Location',
                desc: language === 'te' ? 'రాపిడో తరహాలో మీ ప్రస్తుత GPS లేదా మ్యాప్‌పై క్లిక్ చేసి ల్యాండ్‌మార్క్ పేర్కొనండి.' : language === 'hi' ? 'रैपिडो की तरह अपने वर्तमान GPS अथवा मानचित्र पर सटीक लैंडमार्क चुनें।' : 'Pinpoint your exact farm gate on the map with mandatory landmark instructions.'
              },
              {
                step: '03',
                title: language === 'te' ? 'చెల్లింపు & ఖరారు' : language === 'hi' ? 'भुगतान एवं पुष्टि' : 'Payment & Verification',
                desc: language === 'te' ? 'ఆన్‌లైన్ QR కోడ్ లేదా పని పూర్తయ్యాక నగదు చెల్లింపు (Cash) ఎంచుకోండి.' : language === 'hi' ? 'ऑनलाइन QR अथवा कार्य समाप्ति के बाद नकद भुगतान (Cash) चुनें।' : 'Pay via official Samba QR code or opt for Cash on Service completion.'
              },
              {
                step: '04',
                title: language === 'te' ? 'డ్రైవర్ నావిగేషన్' : language === 'hi' ? 'ड्राइवर नेविगेशन' : 'Tractor Navigation',
                desc: language === 'te' ? 'కేటాయించిన డ్రైవర్ గూగుల్ మ్యాప్స్ ద్వారా నేరుగా మీ పొలానికి చేరుకుని పని పూర్తి చేస్తాడు.' : language === 'hi' ? 'आवंटित ड्राइवर गूगल मैप्स से सीधे आपके खेत पहुंचेगा और कार्य पूर्ण करेगा।' : 'Rider navigates straight to your farm, starts the work, and issues a digital receipt.'
              }
            ].map((st) => (
              <div key={st.step} className="bg-emerald-900/60 p-6 rounded-3xl border border-emerald-800/80 space-y-3">
                <span className="text-3xl font-black text-amber-400 font-mono">{st.step}</span>
                <h4 className="text-base font-bold text-white">{st.title}</h4>
                <p className="text-xs text-emerald-200/80 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
