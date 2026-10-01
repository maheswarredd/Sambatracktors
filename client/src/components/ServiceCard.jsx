import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Tractor, ArrowRight, ShieldCheck, Check, Sparkles } from 'lucide-react';

export const ServiceCard = ({ service, onBook }) => {
  const { t, language } = useLanguage();

  const serviceName = service.name ? (service.name[language] || service.name.en) : 'Tractor Service';
  const categoryName = service.categoryNames ? (service.categoryNames[language] || service.categoryNames.en) : '';
  const description = service.description ? (service.description[language] || service.description.en) : '';

  const isAcre = service.unit === 'Acre';
  const unitLabel = isAcre
    ? (language === 'te' ? 'ఎకరం' : language === 'hi' ? 'एकड़' : 'Acre')
    : (language === 'te' ? 'ట్రిప్పు' : language === 'hi' ? 'ट्रिप' : 'Trip');

  // Choose appropriate fallback photo if service image is generic
  const imageSrc = service.image || (
    service.category === 'SOIL_PLOUGHING'
      ? '/images/cat_ploughing.jpg'
      : service.category === 'SEED_SOWING'
      ? '/images/cat_seeding.jpg'
      : '/images/cat_trolley.jpg'
  );

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group hover:-translate-y-1">
      {/* Service Image & Category Badge */}
      <div className="relative h-44 w-full overflow-hidden bg-emerald-950">
        <img
          src={imageSrc}
          alt={serviceName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Category Pill */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-900/90 text-emerald-200 border border-emerald-600/40 backdrop-blur-md">
            {categoryName}
          </span>
        </div>

        {/* Unit badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-amber-400 text-emerald-950 shadow">
            {service.unit} based
          </span>
        </div>

        {/* Price Tag in Image */}
        <div className="absolute bottom-2 left-3 right-3 flex items-baseline justify-between text-white">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-300">₹{service.price?.toLocaleString()}</span>
            <span className="text-xs text-emerald-200 font-semibold">/ {unitLabel}</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
            {serviceName}
          </h3>
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'te' ? 'ధృవీకరించబడిన డ్రైవర్' : language === 'hi' ? 'सत्यापित ड्राइवर' : 'Verified Rider'}</span>
          </div>

          <Link
            to={`/book?serviceId=${service._id}`}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition hover:shadow-emerald-600/30"
          >
            <span>{t('hero.ctaBook')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
