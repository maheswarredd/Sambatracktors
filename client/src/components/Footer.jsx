import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Tractor, Phone, MapPin, Mail, ShieldCheck, Heart } from 'lucide-react';

export const Footer = () => {
  const { t, language } = useLanguage();

  return (
    <footer className="bg-emerald-950 text-emerald-100/80 border-t border-emerald-900 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-emerald-900/80">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-emerald-950">
                <Tractor className="w-6 h-6 fill-emerald-950" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-lg">{t('brand')}</h3>
                <p className="text-[11px] text-emerald-300">{t('subtitle')}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-emerald-200/70">
              {language === 'te'
                ? 'రైతుల కోసం నాణ్యమైన, అత్యంత వేగవంతమైన ట్రాక్టర్ సేవల వేదిక. నేల దున్నడం నుండి పంటల రవాణా వరకు ఒకే క్లిక్‌తో.'
                : language === 'hi'
                ? 'किसानों के लिए गुणवत्तापूर्ण, विश्वसनीय और त्वरित ट्रैक्टर सेवाओं का मंच। खेत जुताई से लेकर उपज ढुलाई तक।'
                : 'Pioneering agricultural mechanization with instant tractor booking for soil ploughing, seed drilling, and harvest trolley transportation.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              {language === 'te' ? 'ముఖ్యమైన లింకులు' : language === 'hi' ? 'त्वरित लिंक' : 'Quick Links'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-amber-400 transition">{t('nav.home')}</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-amber-400 transition">{t('nav.services')}</Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-amber-400 transition">{t('nav.bookNow')}</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-amber-400 transition">{t('nav.login')} / {t('nav.signup')}</Link>
              </li>
            </ul>
          </div>

          {/* Service Categories */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              {language === 'te' ? 'సేవా విభాగాలు' : language === 'hi' ? 'सेवा श्रेणियां' : 'Service Categories'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>{t('categories.ploughing')} (₹850 - ₹1,350/Acre)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{t('categories.sowing')} (₹1,000 - ₹1,400/Acre)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                <span>{t('categories.trolley')} (₹850 - ₹1,250/Trip)</span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              {language === 'te' ? 'సంప్రదించండి' : language === 'hi' ? 'संपर्क करें' : 'Contact & Helpline'}
            </h4>
            <div className="space-y-2.5 text-xs text-emerald-200/80">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400" />
                <a href="tel:+919848012345" className="hover:text-white font-medium">+91 98480 12345 (24/7 Kisan Helpline)</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>support@sambatractors.com</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Samba Agricultural Hub, Market Yard Road, Kovvur, Andhra Pradesh 534350</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-400/60">
          <p>© {new Date().getFullYear()} {t('brand')} — {t('subtitle')}. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            <span>Built with precision for Indian Farmers</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
