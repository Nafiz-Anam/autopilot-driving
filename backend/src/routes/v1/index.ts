import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import meRoute from './me.routes';
import docsRoute from './docs.route';
import twoFactorRoute from './twoFactor.route';
import deviceRoute from './device.route';
import profileRoute from './profile.route';
import ipSecurityRoute from './ipSecurity.route';
import pushNotificationRoute from './pushNotification.route';
import socialAuthRoute from './socialAuth.route';
import roleRoute from './role.route';
import passwordPolicyRoute from './passwordPolicy.route';
import auditLogRoute from './auditLog.route';
import sessionManagementRoute from './sessionManagement.route';
import pricingRoute from './pricing.route';
import promotionRoute from './promotion.route';
import bookingRoute from './booking.route';
import siteRoute from './site.route';
import paymentRoute from './payment.route';
import giftVoucherRoute from './giftVoucher.route';
import publicSiteRoute from './publicSite.route';
import studentAppRoute from './studentApp.route';
import instructorAppRoute from './instructorApp.route';
import adminAppRoute from './adminApp.route';
import calendarRoute from './calendar.route';
import googleCalendarRoute from './googleCalendar.route';
import appleCalendarRoute from './appleCalendar.route';
import config from '../../config/config';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/me',
    route: meRoute,
  },
  {
    path: '/2fa',
    route: twoFactorRoute,
  },
  {
    path: '/devices',
    route: deviceRoute,
  },
  {
    path: '/profile',
    route: profileRoute,
  },
  {
    path: '/ip-security',
    route: ipSecurityRoute,
  },
  {
    path: '/users',
    route: pushNotificationRoute,
  },
  {
    path: '/auth',
    route: socialAuthRoute,
  },
  {
    path: '/roles',
    route: roleRoute,
  },
  {
    path: '/password-policies',
    route: passwordPolicyRoute,
  },
  {
    path: '/audit-logs',
    route: auditLogRoute,
  },
  {
    path: '/sessions',
    route: sessionManagementRoute,
  },
  {
    path: '/pricing',
    route: pricingRoute,
  },
  {
    path: '/promotions',
    route: promotionRoute,
  },
  {
    path: '/bookings',
    route: bookingRoute,
  },
  {
    path: '/site',
    route: siteRoute,
  },
  {
    path: '/payments',
    route: paymentRoute,
  },
  {
    path: '/gift-vouchers',
    route: giftVoucherRoute,
  },
  {
    path: '/public',
    route: publicSiteRoute,
  },
  {
    path: '/student',
    route: studentAppRoute,
  },
  {
    path: '/instructor',
    route: instructorAppRoute,
  },
  {
    path: '/admin',
    route: adminAppRoute,
  },
  {
    path: '/calendar',
    route: calendarRoute,
  },
  {
    path: '/integrations/google-calendar',
    route: googleCalendarRoute,
  },
  {
    path: '/integrations/apple-calendar',
    route: appleCalendarRoute,
  },
];

// routes available only in development mode
const devRoutes = [
  {
    path: '/docs',
    route: docsRoute,
  },
];

// routes available in production with authentication
const prodRoutes = [
  {
    path: '/docs',
    route: docsRoute,
  },
];

// Debug log to check route registration
defaultRoutes.forEach(route => {
  router.use(route.path, route.route);
});

if (config.env === 'development') {
  devRoutes.forEach(route => {
    router.use(route.path, route.route);
  });
} else if (config.env === 'production') {
  // In production, docs are available but should be protected
  prodRoutes.forEach(route => {
    router.use(route.path, route.route);
  });
}

export default router;
