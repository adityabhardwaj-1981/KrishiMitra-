/**
 * KrishiMitra AI - Standalone Server Entry Point
 */
const app = require('./app');
const env = require('./config/env');

app.listen(env.PORT, () => {
  console.log('====================================================');
  console.log('  🌾 KrishiMitra AI - Unified Server Online');
  console.log(`  🌐 Full Platform: http://localhost:${env.PORT}`);
  console.log(`  📄 Landing Page:  http://localhost:${env.PORT}/`);
  console.log(`  📱 App Dashboard: http://localhost:${env.PORT}/login`);
  console.log(`  🔌 API Base:      http://localhost:${env.PORT}/api`);
  console.log(`  🤖 AI Provider:   ${env.AI_PROVIDER || 'mock-engine (offline)'}`);
  console.log('====================================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down KrishiMitra server...');
  process.exit(0);
});
