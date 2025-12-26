/**
 * Helper script to find your local IP address
 * Run with: node scripts/get-local-ip.js
 */

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

const localIP = getLocalIP();
console.log('\n🌐 Your Local IP Address:');
console.log(`   ${localIP}`);
console.log('\n📝 Update this in: src/config/api.ts');
console.log(`   Change LOCAL_IP to: '${localIP}'\n`);


