import React from 'react';
import { Link } from 'react-router-dom';
import { Tractor, PhoneCall, Mail, MapPin, ShieldCheck, Clock, Award } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-samba-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Tractor className="w-6 h-6 text-harvest-300" />
              </div>
              <span className="font-extrabold text-2xl text-white tracking-tight">
                Samba <span className="text-samba-400">Tractors</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Reliable Tractor Services for Every Farm. Rapid on-demand tractor booking for ploughing, rotavating, seeding, harvesting, and hauling with acre-based transparent rates.
            </p>
            <div className="flex items-center space-x-2 text-xs font-semibold text-samba-400 bg-samba-950/60 p-2.5 rounded-lg border border-samba-800/40">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>100% Verified Drivers & Heavy Machinery</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wide uppercase text-xs">
              Tractor Services
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/book" className="hover:text-samba-400 transition flex items-center space-x-2">
                  <span className="text-samba-500">▸</span>
                  <span>Deep Disc Ploughing (₹1,800/ac)</span>
                </Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-samba-400 transition flex items-center space-x-2">
                  <span className="text-samba-500">▸</span>
                  <span>Rotavator Soil Tilth (₹1,600/ac)</span>
                </Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-samba-400 transition flex items-center space-x-2">
                  <span className="text-samba-500">▸</span>
                  <span>9-Tyne Cultivator (₹1,400/ac)</span>
                </Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-samba-400 transition flex items-center space-x-2">
                  <span className="text-samba-500">▸</span>
                  <span>Precision Seed Sowing (₹1,500/ac)</span>
                </Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-samba-400 transition flex items-center space-x-2">
                  <span className="text-samba-500">▸</span>
                  <span>Laser Land Levelling (₹2,200/ac)</span>
                </Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-samba-400 transition flex items-center space-x-2">
                  <span className="text-samba-500">▸</span>
                  <span>Combine Harvesting (₹2,800/ac)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Operational Hours & Districts */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wide uppercase text-xs">
              Dispatch & Coverage
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-harvest-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Daily Dispatch Hours</p>
                  <p className="text-xs text-slate-400">4:00 AM – 9:00 PM (All 7 Days)</p>
                  <p className="text-[11px] text-samba-400 mt-0.5">Morning, Afternoon, Evening & Night Slots</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-samba-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Operational Agricultural Zones</p>
                  <p className="text-xs text-slate-400">Salem, Valapadi, Attur, Dharmapuri, Namakkal, Erode & surrounding rural belts.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Helpline */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wide uppercase text-xs">
              Farmer Support Desk
            </h3>
            <div className="space-y-3 text-sm">
              <a 
                href="tel:+919842056789" 
                className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-samba-600 transition group"
              >
                <div className="w-9 h-9 rounded-lg bg-samba-700/30 text-samba-400 flex items-center justify-center group-hover:scale-110 transition">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Emergency Call Line</p>
                  <p className="font-bold text-white group-hover:text-samba-400">+91 98420 56789</p>
                </div>
              </a>

              <a 
                href="mailto:support@sambatractors.com" 
                className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-samba-600 transition group"
              >
                <div className="w-9 h-9 rounded-lg bg-harvest-500/20 text-harvest-400 flex items-center justify-center group-hover:scale-110 transition">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Official Email</p>
                  <p className="font-medium text-white group-hover:text-harvest-400 text-xs">support@sambatractors.com</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} Samba Tractors. All rights reserved. Made for Indian Agriculture.</p>
          <div className="flex items-center space-x-6">
            <span>Acre-Based Fair Pricing</span>
            <span>•</span>
            <span>Rapido-Style Farm Tracking</span>
            <span>•</span>
            <span>Digital Invoices & Receipts</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
