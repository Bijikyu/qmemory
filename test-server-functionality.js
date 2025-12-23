import http from 'http';

// Test if demo app is working
function testDemoApp() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const req = http.request(options, res => {
    let data = '';

    res.on('data', chunk => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ Demo App Health Check Success:');
        console.log('Status:', res.statusCode);
        console.log('Response:', result);

        // Test user endpoint
        testUserEndpoint();
      } catch (error) {
        console.error('❌ Health check failed:', error.message);
      }
    });
  });

  req.on('error', error => {
    console.error('❌ Request failed:', error.message);
  });

  req.setTimeout(5000, () => {
    req.destroy();
    console.error('❌ Request timeout');
  });

  req.end();
}

function testUserEndpoint() {
  const userOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/users',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const userReq = http.request(userOptions, res => {
    let data = '';

    res.on('data', chunk => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ Demo App Users Endpoint Success:');
        console.log('Status:', res.statusCode);
        console.log('Response type:', typeof result);
        console.log('Has data property:', !!result.data);
      } catch (error) {
        console.error('❌ Users endpoint failed:', error.message);
      }
    });
  });

  userReq.on('error', error => {
    console.error('❌ Users request failed:', error.message);
  });

  userReq.setTimeout(5000, () => {
    userReq.destroy();
    console.error('❌ Users request timeout');
  });

  userReq.end();
}

// Check if server is running
console.log('Testing Demo App...');
testDemoApp();
