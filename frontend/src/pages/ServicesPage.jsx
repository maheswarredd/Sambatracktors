import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { Tractor, Search, Filter, ArrowRight, CheckCircle2, Calculator } from 'lucide-react';

const CATEGORIES = ['All', 'Land Preparation', 'Sowing & Planting', 'Harvesting', 'Transport & Trolley', 'General Farming'];

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [customAcres, setCustomAcres] = useState(4);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await client.get('/services');
        if (res.data.success) {
          setServices(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const filteredServices = services.filter((s) => {
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-samba-700 bg-samba-100 px-3 py-1 rounded-full uppercase tracking-wider">
          Transparent Acre-Based Catalog
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
          All Tractor & Farming Services
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Choose from precision ploughing, rotavators, seeding, and harvesting. All rates are dynamically updated by Samba Tractors administration.
        </p>
      </div>

      {/* Global Interactive Acre Estimator Bar */}
      <div className="bg-samba-900 text-white p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-samba-800 rounded-xl text-harvest-400">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">Calculate for Your Farm Size</h3>
            <p className="text-xs text-samba-200">Adjust the acreage slider to preview exact costs across all services</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="flex-1 md:w-48">
            <input
              type="range"
              min="1"
              max="25"
              step="0.5"
              value={customAcres}
              onChange={(e) => setCustomAcres(Number(e.target.value))}
              className="w-full accent-harvest-400 cursor-pointer"
            />
          </div>
          <span className="bg-samba-800 border border-samba-700 px-3 py-1.5 rounded-xl font-mono font-bold text-sm text-harvest-300 min-w-[90px] text-center">
            {customAcres} {customAcres === 1 ? 'Acre' : 'Acres'}
          </span>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service (e.g. Plough, Rotavator)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-samba-500 outline-none"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-samba-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 bg-slate-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
          <Tractor className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-800 text-base">No services found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search query or category filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => {
            const calculatedPrice = Math.round(service.pricePerAcre * customAcres);

            return (
              <div
                key={service._id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-samba-500 shadow-sm hover:shadow-xl transition duration-300 overflow-hidden flex flex-col group"
              >
                {/* Image */}
                <div className="relative h-52 bg-slate-100 overflow-hidden">
                  <img
                    src={service.image || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80'}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/20">
                    {service.category}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-samba-600 text-white font-mono font-black text-sm px-3.5 py-1.5 rounded-xl shadow-md">
                    ₹{service.pricePerAcre.toLocaleString('en-IN')}{' '}
                    <span className="text-[10px] font-medium font-sans">/ acre</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-samba-700 transition">
                      {service.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {service.description}
                    </p>

                    {service.features && service.features.length > 0 && (
                      <div className="space-y-1.5 mt-4 pt-4 border-t border-slate-100">
                        {service.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-xs text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-samba-600 flex-shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Calculator snippet */}
                  <div className="pt-4 border-t border-slate-100 bg-samba-50/50 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        Total for {customAcres} {customAcres === 1 ? 'Acre' : 'Acres'}:
                      </span>
                      <span className="font-mono font-black text-slate-900 text-lg">
                        ₹{calculatedPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <Link
                      to={`/book?serviceId=${service._id}&acres=${customAcres}`}
                      className="px-4 py-2.5 bg-samba-600 hover:bg-samba-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition transform group-hover:scale-105"
                    >
                      <span>Book Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
