const jwt = require('jsonwebtoken');

const secret = 'plofgyrhjskuergatenjvhdgyreianinfdkoqashdhdlmkkinjkmnsdnmm';
const payload = {
  sub: '6a2fbd0a5873fddb920c9242',
  email: 'admin@gmail.com',
  role: 'Admin'
};

const token = jwt.sign(payload, secret);
console.log('Generated JWT token:', token);

async function test() {
  try {
    const resUsers = await fetch('http://127.0.0.1:3000/api/v1/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Users response status:', resUsers.status);
    const usersData = await resUsers.json();
    console.log('Users response data:', JSON.stringify(usersData).substring(0, 500));
  } catch (err) {
    console.error('Users request failed:', err.message);
  }

  try {
    const resEmps = await fetch('http://127.0.0.1:3000/api/v1/employees', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Employees response status:', resEmps.status);
    const empsData = await resEmps.json();
    console.log('Employees response data:', JSON.stringify(empsData).substring(0, 500));
  } catch (err) {
    console.error('Employees request failed:', err.message);
  }
}

test();
