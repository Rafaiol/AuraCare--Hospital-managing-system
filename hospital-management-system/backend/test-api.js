const http = require('http');

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
    console.log('Login response:', data);

    // If successful, test profile
    const parsed = JSON.parse(data);
    if (parsed.success) {
      const token = parsed.data.tokens.accessToken;

      const profileOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/profile',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      };

      const reqProfile = http.request(profileOptions, resP => {
        let pData = '';
        resP.on('data', chunk => pData += chunk);
        resP.on('end', () => console.log('Profile response STATUS ' + resP.statusCode + ':', pData));
      });
      reqProfile.end();

      const patientOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/patients',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      };

      const reqPatient = http.request(patientOptions, resPa => {
        let paData = '';
        resPa.on('data', chunk => paData += chunk);
        resPa.on('end', () => console.log('Patient response STATUS ' + resPa.statusCode + ':', paData));
      });
      reqPatient.end();
    }
  });
});

req.write(JSON.stringify({ email: 'admin@hospital.com', password: 'admin123' }));
req.end();
