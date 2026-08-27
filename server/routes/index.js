/**
 * Central API router that mounts all module route groups.
 */
const express = require('express');
const authRoutes = require('./auth');
const chatRoutes = require('./chat');
const detectionRoutes = require('./detection');
const cropRoutes = require('./crop');
const soilRoutes = require('./soil');
const weatherRoutes = require('./weather');
const marketRoutes = require('./market');
const schemeRoutes = require('./scheme');
const marketplaceRoutes = require('./marketplace');
const equipmentRoutes = require('./equipment');
const communityRoutes = require('./community');
const farmRoutes = require('./farm');
const analyticsRoutes = require('./analytics');
const profileRoutes = require('./profile');
const adminRoutes = require('./admin');
const publicLandingRoutes = require('./publicLanding');

const router = express.Router();

const routesV1 = [
  { path: '/auth', route: authRoutes },
  { path: '/chat', route: chatRoutes },
  { path: '/detection', route: detectionRoutes },
  { path: '/crops', route: cropRoutes },
  { path: '/soil', route: soilRoutes },
  { path: '/weather', route: weatherRoutes },
  { path: '/market', route: marketRoutes },
  { path: '/schemes', route: schemeRoutes },
  { path: '/marketplace', route: marketplaceRoutes },
  { path: '/equipment', route: equipmentRoutes },
  { path: '/community', route: communityRoutes },
  { path: '/farms', route: farmRoutes },
  { path: '/analytics', route: analyticsRoutes },
  { path: '/profile', route: profileRoutes },
  { path: '/admin', route: adminRoutes },
  { path: '/health', route: require('./health') },
  { path: '/public', route: publicLandingRoutes },
];

routesV1.forEach((r) => router.use(r.path, r.route));

// Health / info shortcut at /api root
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'KrishiMitra AI API is running.',
    modules: routesV1.filter((r) => r.path !== '/health').map((r) => r.path),
  });
});

module.exports = router;

