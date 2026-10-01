import mongoose from 'mongoose';
import User from '../models/User.js';
import Tractor from '../models/Tractor.js';
import Service from '../models/Service.js';
import Setting from '../models/Setting.js';
import Booking from '../models/Booking.js';
import { BOOKING_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, ROLES } from '../config/constants.js';

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Checking database seeding...');

    // 1. Settings
    let settings = await Setting.findOne({ key: 'main_settings' });
    if (!settings) {
      settings = await Setting.create({
        key: 'main_settings',
        upiId: 'sambatractors@upi',
        upiPayeeName: 'Samba Tractors Fleet & Farm Services',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dsambatractors%40upi%26pn%3DSamba%20Tractors%26cu%3DINR',
        supportPhone: '+91 98420 56789',
        supportEmail: 'support@sambatractors.com',
        workingHours: '4:00 AM - 9:00 PM (All 7 Days)'
      });
      console.log('[Seed] Default settings created.');
    }

    // 2. Services
    const serviceCount = await Service.countDocuments();
    let services = [];
    if (serviceCount === 0) {
      const defaultServices = [
        {
          name: 'Deep Disc Ploughing',
          code: 'PLOUGHING',
          description: 'Heavy duty 3-bottom reversible disc ploughing to break deep hardpans, eradicate stubborn roots, and improve soil aeration.',
          pricePerAcre: 1800,
          category: 'Land Preparation',
          minAcres: 1,
          maxAcres: 50,
          estimatedHoursPerAcre: 1.5,
          image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
          features: ['Up to 14-inch deep cut', 'Ideal for virgin and sugarcane soils', 'Prevents weed regrowth', 'Uniform furrow slice']
        },
        {
          name: 'Rotavator Tillage',
          code: 'ROTAVATOR',
          description: 'High-speed rotary tiller producing instant seedbed tilth, mixing crop residues, and crushing clods in a single pass.',
          pricePerAcre: 1600,
          category: 'Land Preparation',
          minAcres: 1,
          maxAcres: 50,
          estimatedHoursPerAcre: 1.2,
          image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80',
          features: ['Fine crumb soil structure', 'Retains moisture', 'Perfect for paddy and cotton', 'Fast turnaround']
        },
        {
          name: '9-Tyne Cultivation',
          code: 'CULTIVATION',
          description: 'Durable spring-loaded heavy tynes for inter-culture aeration, loosening hardened topsoil, and preparing weed-free seedbeds.',
          pricePerAcre: 1400,
          category: 'Land Preparation',
          minAcres: 1,
          maxAcres: 50,
          estimatedHoursPerAcre: 1.0,
          image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
          features: ['Spring shock absorption', 'Zero stone damage', 'Loosens soil up to 9 inches', 'Saves fuel']
        },
        {
          name: 'Seed Sowing & Precision Planting',
          code: 'SEED_SOWING',
          description: 'Multi-crop seed cum fertilizer mechanical drill ensuring accurate seed placement, uniform depth, and faster germination.',
          pricePerAcre: 1500,
          category: 'Sowing & Planting',
          minAcres: 1,
          maxAcres: 40,
          estimatedHoursPerAcre: 1.0,
          image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=800&q=80',
          features: ['Calibrated seed spacing', 'Simultaneous basal fertilizer application', 'Prevents seed wastage by birds', 'High germination yield']
        },
        {
          name: 'Harvesting & Threshing',
          code: 'HARVESTING',
          description: 'High-capacity combine tractor attachment for efficient crop cutting, cleaning, and threshing with minimal grain loss.',
          pricePerAcre: 2800,
          category: 'Harvesting',
          minAcres: 1,
          maxAcres: 60,
          estimatedHoursPerAcre: 2.0,
          image: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=800&q=80',
          features: ['Grain loss below 1%', 'Straw collection friendly', 'All weather operation', 'Clean threshed yield']
        },
        {
          name: 'Laser Land Levelling',
          code: 'LAND_LEVELLING',
          description: 'Laser transmitter guided grading scraper that levels farm fields to millimeter perfection, saving 30% irrigation water.',
          pricePerAcre: 2200,
          category: 'Land Preparation',
          minAcres: 1,
          maxAcres: 40,
          estimatedHoursPerAcre: 2.0,
          image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
          features: ['Saves 25-30% water', 'Uniform crop growth', 'Zero waterlogging', 'Precision laser sensor']
        },
        {
          name: 'Hydraulic Trolley & Farm Hauling',
          code: 'TROLLEY_SERVICE',
          description: 'Heavy 5-ton hydraulic tipping trolley for farm produce, manure, gravel, sugarcane, and paddy bag transportation.',
          pricePerAcre: 1900,
          category: 'Transport & Trolley',
          minAcres: 1,
          maxAcres: 30,
          estimatedHoursPerAcre: 1.5,
          image: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=800&q=80',
          features: ['5-Ton heavy payload', 'Smooth hydraulic unloading', 'Tarp protected hauling', 'Experienced careful driver']
        },
        {
          name: 'Ridge & Bund Former',
          code: 'RIDGER',
          description: 'Forms perfect irrigation ridges and furrows for vegetable crops, maize, cotton, and drip irrigation layouts.',
          pricePerAcre: 1300,
          category: 'General Farming',
          minAcres: 1,
          maxAcres: 30,
          estimatedHoursPerAcre: 1.0,
          image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
          features: ['Adjustable furrow width', 'Firm soil bunds', 'Prevents soil erosion', 'Saves manual labor']
        }
      ];

      services = await Service.insertMany(defaultServices);
      console.log(`[Seed] ${services.length} farming services seeded.`);
    } else {
      services = await Service.find();
    }

    // 3. Admin Account
    let admin = await User.findOne({ role: ROLES.ADMIN });
    if (!admin) {
      admin = await User.create({
        name: 'Samba Admin',
        email: 'admin@sambatractors.com',
        phone: '+91 98420 56789',
        password: 'adminPassword123',
        role: ROLES.ADMIN
      });
      console.log('[Seed] Admin account created: admin@sambatractors.com / adminPassword123');
    }

    // 4. Riders
    let rider1 = await User.findOne({ email: 'ramu@sambatractors.com' });
    if (!rider1) {
      rider1 = await User.create({
        name: 'Ramu Driver',
        email: 'ramu@sambatractors.com',
        phone: '+91 94431 11222',
        password: 'riderPassword123',
        role: ROLES.RIDER,
        riderDetails: {
          licenseNumber: 'TN-54-2016-00452',
          experienceYears: 8,
          rating: 4.9,
          totalTrips: 142,
          isAvailable: true,
          currentLocation: { lat: 11.6643, lng: 78.1460 }
        }
      });
      console.log('[Seed] Rider 1 created: ramu@sambatractors.com / riderPassword123');
    }

    let rider2 = await User.findOne({ email: 'murugan@sambatractors.com' });
    if (!rider2) {
      rider2 = await User.create({
        name: 'Murugan Swamy',
        email: 'murugan@sambatractors.com',
        phone: '+91 94432 33444',
        password: 'riderPassword123',
        role: ROLES.RIDER,
        riderDetails: {
          licenseNumber: 'TN-54-2018-00912',
          experienceYears: 6,
          rating: 4.8,
          totalTrips: 98,
          isAvailable: true,
          currentLocation: { lat: 11.6500, lng: 78.1500 }
        }
      });
      console.log('[Seed] Rider 2 created: murugan@sambatractors.com / riderPassword123');
    }

    // 5. Tractors
    const tractorCount = await Tractor.countDocuments();
    let tractor1 = null;
    let tractor2 = null;

    if (tractorCount === 0) {
      tractor1 = await Tractor.create({
        registrationNumber: 'TN-54-AA-1008',
        modelName: 'Mahindra 575 DI (45 HP)',
        horsePower: 45,
        fuelType: 'Diesel',
        assignedRider: rider1._id,
        status: 'IN_SERVICE',
        implementsSupported: ['Plough', 'Rotavator', 'Cultivator', 'Trolley'],
        image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80'
      });

      tractor2 = await Tractor.create({
        registrationNumber: 'TN-54-AB-2045',
        modelName: 'John Deere 5050 D (50 HP)',
        horsePower: 50,
        fuelType: 'Diesel',
        assignedRider: rider2._id,
        status: 'IN_SERVICE',
        implementsSupported: ['Plough', 'Rotavator', 'Laser Leveler', 'Harvester'],
        image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80'
      });

      await Tractor.create({
        registrationNumber: 'TN-54-AC-3199',
        modelName: 'Sonalika DI 745 III (50 HP)',
        horsePower: 50,
        fuelType: 'Diesel',
        assignedRider: null,
        status: 'AVAILABLE',
        implementsSupported: ['Plough', 'Rotavator', 'Cultivator', 'Seed Drill'],
        image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'
      });

      await User.findByIdAndUpdate(rider1._id, { 'riderDetails.currentTractor': tractor1._id });
      await User.findByIdAndUpdate(rider2._id, { 'riderDetails.currentTractor': tractor2._id });
      console.log('[Seed] Fleet tractors created and assigned to riders.');
    } else {
      tractor1 = await Tractor.findOne({ registrationNumber: 'TN-54-AA-1008' });
      tractor2 = await Tractor.findOne({ registrationNumber: 'TN-54-AB-2045' });
    }

    // 6. Farmer Account
    let farmer = await User.findOne({ email: 'farmer@gmail.com' });
    if (!farmer) {
      farmer = await User.create({
        name: 'Chinnasamy Gounder',
        email: 'farmer@gmail.com',
        phone: '+91 98940 77889',
        password: 'farmerPassword123',
        role: ROLES.FARMER,
        farmerDetails: {
          village: 'Valapadi, Salem District',
          defaultAddress: 'Survey No. 44/2B, South Canal Farm Road, Valapadi',
          defaultLandmark: 'Behind Primary Agricultural Cooperative Bank Arch'
        }
      });
      console.log('[Seed] Demo farmer created: farmer@gmail.com / farmerPassword123');
    }

    // 7. Sample Initial Booking so dashboards have rich visual data out-of-the-box
    const bookingCount = await Booking.countDocuments();
    if (bookingCount === 0 && services.length > 0 && tractor1 && rider1) {
      const todayStr = new Date().toISOString().split('T')[0];
      const ploughService = services.find(s => s.code === 'PLOUGHING') || services[0];
      const acres = 4;
      const totalAmount = acres * ploughService.pricePerAcre;

      await Booking.create({
        bookingNumber: 'STB-100452-91',
        farmer: farmer._id,
        farmerName: farmer.name,
        farmerPhone: farmer.phone,
        farmerEmail: farmer.email,
        service: ploughService._id,
        serviceName: ploughService.name,
        acres,
        pricePerAcre: ploughService.pricePerAcre,
        totalAmount,
        bookingDate: todayStr,
        timeSlot: 'Morning 4:00 AM–10:00 AM',
        farmLocation: {
          latitude: 11.6643,
          longitude: 78.1460,
          address: 'Survey No. 44/2B, South Canal Road, Valapadi',
          village: 'Valapadi',
          landmark: 'Opposite Mariamman Temple Arch, Near Canal Bridge',
          locationInstructions: 'Take the mud road by the side of the irrigation channel for 400m until you see the green water tank.'
        },
        assignedRider: rider1._id,
        assignedTractor: tractor1._id,
        status: BOOKING_STATUSES.RIDER_ASSIGNED,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUSES.PENDING,
        timeline: [
          {
            status: BOOKING_STATUSES.CONFIRMED,
            timestamp: new Date(Date.now() - 3600000),
            note: 'Booking confirmed via Cash on Delivery.'
          },
          {
            status: BOOKING_STATUSES.RIDER_ASSIGNED,
            timestamp: new Date(),
            note: `Assigned Rider Ramu Driver and Tractor Mahindra 575 DI (${tractor1.registrationNumber}).`
          }
        ]
      });

      console.log('[Seed] Initial sample booking created for demo farmer.');
    }

    console.log('[Seed] Database initialization complete!');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
  }
};
