require('dotenv').config();
const net = require('net');

console.log('📋 Database Configuration:');
console.log('URL:', process.env.DATABASE_URL);

const socket = new net.Socket();
socket.setTimeout(5000);

socket.on('connect', () => {
  console.log('\n✅ Railway database host IS reachable on port 50307');
  console.log('❌ BUT: Authentication or database selection may be failing');
  socket.destroy();
  process.exit(0);
});

socket.on('timeout', () => {
  console.log('\n⏱️ CONNECTION TIMEOUT - Railway Database is DOWN');
  console.log('The host caboose.proxy.rlwy.net:50307 is not responding');
  console.log('\n🔧 SOLUTIONS:');
  console.log('1. Go to https://dashboard.railway.app');
  console.log('2. Check if your PostgreSQL plugin is running');
  console.log('3. Restart the database if needed');
  console.log('4. Check your account has not run out of credits');
  socket.destroy();
  process.exit(1);
});

socket.on('error', (err) => {
  console.log('\n❌ Connection Error:', err.code);
  console.log('Message:', err.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Check internet connection');
  console.log('2. Railway service may be down');
  console.log('3. Firewall blocking port 50307');
  process.exit(1);
});

console.log('\n🔍 Testing connectivity to Railway...\n');
socket.connect(50307, 'caboose.proxy.rlwy.net');
