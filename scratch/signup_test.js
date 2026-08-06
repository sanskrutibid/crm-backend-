const data = {
  email: "test_new_employee_signup@example.com",
  password: "Password123!",
  confirmPassword: "Password123!",
  name: "Test Employee User",
  agreeTerms: true
};

async function run() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Response:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
