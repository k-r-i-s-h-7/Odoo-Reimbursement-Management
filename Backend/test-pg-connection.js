require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  statement_timeout: 10000,
});

console.log('🔗 Attempting PostgreSQL connection...\n');

client.connect((err) => {
  if (err) {
    console.log('❌ Connection Failed:');
    console.log('Error:', err.message);
    console.log('Code:', err.code);
    
    if (err.code === 'ECONNREFUSED') {
      console.log('\n🔧 Database is refusing connections - it may be down or restarting');
    } else if (err.code === 'ENOTFOUND') {
      console.log('\n🔧 Cannot resolve hostname - network issue');
    } else if (err.message.includes('authentication')) {
      console.log('\n🔧 Authentication failed - check credentials in .env');
    }
    process.exit(1);
  } else {
    console.log('✅ Connected to PostgreSQL!');
    
    client.query('SELECT version();', (err, res) => {
      if (err) {
        console.log('❌ Query failed:', err.message);
        process.exit(1);
      } else {
        console.log('✅ Query successful');
        console.log('PostgreSQL version:', res.rows[0].version);
        
        // Check tables
        client.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
          (err, res) => {
            if (err) {
              console.log('❌ Could not list tables');
            } else {
              console.log('\n📊 Database tables:');
              res.rows.forEach(r => console.log('  -', r.table_name));
            }
            client.end();
            process.exit(0);
          }
        );
      }
    });
  }
});
