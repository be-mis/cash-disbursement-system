// backend/src/scripts/debugDatabase.ts
import pool from '../config/database';

async function debugDatabase() {
  console.log('=== DATABASE CONNECTION DEBUG ===\n');

  try {
    // Test connection
    console.log('1. Testing database connection...');
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!\n');
    
    // Get database info
    const [dbInfo] = await connection.query('SELECT DATABASE() as db_name');
    console.log('2. Current database:', (dbInfo as any)[0].db_name);
    
    // Show all tables
    console.log('\n3. Tables in database:');
    const [tables] = await connection.query('SHOW TABLES');
    console.table(tables);
    
    // Check requests table
    console.log('\n4. Checking requests table:');
    const [requestCount] = await connection.query('SELECT COUNT(*) as count FROM requests');
    console.log('Total requests:', (requestCount as any)[0].count);
    
    // Show all requests
    const [allRequests] = await connection.query('SELECT * FROM requests');
    console.log('\n5. All requests in database:');
    if ((allRequests as any[]).length === 0) {
      console.log('⚠️  NO REQUESTS FOUND IN DATABASE');
    } else {
      console.table(allRequests);
    }
    
    // Check timeline_events
    console.log('\n6. Checking timeline_events table:');
    const [eventCount] = await connection.query('SELECT COUNT(*) as count FROM timeline_events');
    console.log('Total timeline events:', (eventCount as any)[0].count);
    
    // Check users
    console.log('\n7. Checking users table:');
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log('Total users:', (userCount as any)[0].count);
    
    const [allUsers] = await connection.query('SELECT id, name, email, role FROM users');
    console.table(allUsers);
    
    connection.release();
    console.log('\n=== DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Database error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

debugDatabase();