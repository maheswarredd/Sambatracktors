import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Tractor from '../models/Tractor.js';
import Notification from '../models/Notification.js';
import { BOOKING_STATUSES } from '../config/constants.js';
import { emitToBooking, emitToUser } from '../config/socket.js';

// @desc    Get Rider Assigned Bookings (Today's, Upcoming, Completed)
// @route   GET /api/riders/my-bookings
// @access  Private (Rider)
export const getRiderBookings = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const bookings = await Booking.find({ assignedRider: req.user._id })
      .populate('farmer', 'name phone email farmerDetails')
      .populate('service', 'name code image pricePerAcre')
      .populate('assignedTractor', 'modelName registrationNumber horsePower')
      .sort({ bookingDate: 1, createdAt: -1 });

    const todayBookings = bookings.filter(b => b.bookingDate === todayStr && ![BOOKING_STATUSES.SERVICE_COMPLETED, BOOKING_STATUSES.PAYMENT_COMPLETED, BOOKING_STATUSES.CLOSED, BOOKING_STATUSES.CANCELLED].includes(b.status));
    const upcomingBookings = bookings.filter(b => b.bookingDate > todayStr && ![BOOKING_STATUSES.CLOSED, BOOKING_STATUSES.CANCELLED].includes(b.status));
    const completedBookings = bookings.filter(b => [BOOKING_STATUSES.SERVICE_COMPLETED, BOOKING_STATUSES.PAYMENT_COMPLETED, BOOKING_STATUSES.CLOSED].includes(b.status));
    const activeBooking = bookings.find(b => [
      BOOKING_STATUSES.RIDER_ASSIGNED,
      BOOKING_STATUSES.RIDER_ON_THE_WAY,
      BOOKING_STATUSES.ARRIVED,
      BOOKING_STATUSES.SERVICE_STARTED
    ].includes(b.status));

    res.status(200).json({
      success: true,
      data: {
        all: bookings,
        active: activeBooking || null,
        today: todayBookings,
        upcoming: upcomingBookings,
        completed: completedBookings
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Service Status by Rider
// @route   PUT /api/riders/booking/:id/status
// @access  Private (Rider)
export const updateBookingStatusByRider = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const booking = await Booking.findById(req.params.id).populate('farmer');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.assignedRider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not the assigned rider for this farm booking'
      });
    }

    const validStatuses = [
      BOOKING_STATUSES.RIDER_ON_THE_WAY,
      BOOKING_STATUSES.ARRIVED,
      BOOKING_STATUSES.SERVICE_STARTED,
      BOOKING_STATUSES.SERVICE_COMPLETED
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status update for rider. Allowed: ${validStatuses.join(', ')}`
      });
    }

    booking.status = status;

    let notificationTitle = '';
    let notificationMsg = '';
    let notifType = 'SYSTEM';

    if (status === BOOKING_STATUSES.RIDER_ON_THE_WAY) {
      notificationTitle = 'Tractor is on the Way!';
      notificationMsg = `Rider ${req.user.name} is heading to your farm for ${booking.serviceName}.`;
      notifType = 'RIDER_ON_THE_WAY';
    } else if (status === BOOKING_STATUSES.ARRIVED) {
      notificationTitle = 'Tractor Arrived at Farm!';
      notificationMsg = `Rider ${req.user.name} has arrived at your farm with the tractor.`;
      notifType = 'ARRIVED';
    } else if (status === BOOKING_STATUSES.SERVICE_STARTED) {
      booking.serviceStartedAt = new Date();
      notificationTitle = 'Service Started';
      notificationMsg = `Tractor field operations have begun for ${booking.acres} acres.`;
      notifType = 'SERVICE_STARTED';
    } else if (status === BOOKING_STATUSES.SERVICE_COMPLETED) {
      booking.serviceCompletedAt = new Date();
      notificationTitle = 'Service Completed!';
      notificationMsg = `All ${booking.acres} acres of ${booking.serviceName} have been completed successfully.`;
      notifType = 'SERVICE_COMPLETED';

      // Increment rider's total completed trips
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'riderDetails.totalTrips': 1 }
      });

      // Free up tractor if offline payment done or will be done
      if (booking.assignedTractor) {
        await Tractor.findByIdAndUpdate(booking.assignedTractor, { status: 'AVAILABLE' });
      }
    }

    booking.timeline.push({
      status,
      timestamp: new Date(),
      note: note || notificationMsg,
      updatedBy: req.user._id
    });

    await booking.save();

    // Create Notification
    await Notification.create({
      recipient: booking.farmer._id,
      title: notificationTitle,
      message: notificationMsg,
      type: notifType,
      relatedBooking: booking._id
    });

    // Real-time broadcast
    emitToBooking(booking._id, 'booking_status_updated', {
      bookingId: booking._id,
      status: booking.status,
      message: notificationMsg
    });

    emitToUser(booking.farmer._id.toString(), 'booking_status_updated', {
      bookingId: booking._id,
      status: booking.status,
      message: notificationMsg
    });

    res.status(200).json({
      success: true,
      message: `Booking updated to ${status}`,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Rider GPS Coordinates
// @route   PUT /api/riders/location
// @access  Private (Rider)
export const updateRiderLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude coordinates are required'
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      'riderDetails.currentLocation': { lat: Number(lat), lng: Number(lng) }
    });

    res.status(200).json({
      success: true,
      message: 'Location updated'
    });
  } catch (error) {
    next(error);
  }
};
