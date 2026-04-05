const http = require('http');

function testCreatePatient() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const parsed = JSON.parse(data);
      if (parsed.success) {
        const token = parsed.data.tokens.accessToken;

        const payload = JSON.stringify({
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: "1990-01-01",
          gender: "MALE",
          phone: "1234567890"
        });

        const postOpts = {
          hostname: 'localhost',
          port: 5000,
          path: '/api/patients',
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Content-Length': payload.length
          }
        };

        const postReq = http.request(postOpts, postRes => {
          let postData = '';
          postRes.on('data', chunk => postData += chunk);
          postRes.on('end', () => {
            console.log('Status:', postRes.statusCode);
            console.log('Response:', postData);
          });
        });

        postReq.write(payload);
        postReq.end();
      }
    });
  });

  req.write(JSON.stringify({ email: 'admin@hospital.com', password: 'admin123' }));
  req.end();
}

testCreatePatient();
