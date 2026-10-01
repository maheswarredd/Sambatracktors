import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import ServiceCard from '../components/ServiceCard';
import { Tractor, Search, Filter } from 'lucide-react';

export const Services = () => {
  const { t, language } = useLanguage();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const res = await api.getServices();
        if (res.success) {
          setServices(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const categories = [
    { key: 'ALL', label: language === 'te' ? 'అన్నీ (29 సేవలు)' : language === 'hi' ? 'सभी (29 सेवाएं)' : 'All (29 Services)' },
    { key: 'SOIL_PLOUGHING', label: t('categories.ploughing') },
    { key: 'SEED_SOWING', label: t('categories.sowing') },
    { key: 'TROLLEY_LOAD', label: t('categories.trolley') }
  ];

  const filtered = services.filter((s) => {
    const matchCat = activeTab === 'ALL' || s.category === activeTab;
    const matchSearch =
      s.name?.te?.toLowerCase().includes(search.toLowerCase()) ||
      s.name?.en?.toLowerCase().includes(search.toLowerCase()) ||
      s.name?.hi?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-green-950 text-white p-8 rounded-3xl shadow-xl space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          Mechanization Catalog
        </span>
        <h1 className="text-2xl sm:text-4xl font-black">{t('nav.services')}</h1>
        <p className="text-xs sm:text-sm text-emerald-200 max-w-xl">
          {language === 'te'
            ? 'ప్రతి వ్యవసాయ పనికి అనువైన ఖచ్చితమైన ట్రాక్టర్ ఇంప్లిమెంట్లు మరియు పారదర్శక ధరలు.'
            : language === 'hi'
            ? 'प्रत्येक कृषि कार्य के लिए उपयुक्त सटीक ट्रैक्टर यंत्र एवं पारदर्शी दरें।'
            : 'Explore specialized tractor attachments and transparent fixed acre/trip tariffs.'}
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveTab(c.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === c.key
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service name..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500 text-sm">No services found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s) => (
            <ServiceCard key={s._id} service={s} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Services;
