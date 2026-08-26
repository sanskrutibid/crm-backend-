const jwt = require('jsonwebtoken');

const secret = 'plofgyrhjskuergatenjvhdgyreianinfdkoqashdhdlmkkinjkmnsdnmm';
const payload = {
  sub: '6a2fbd0a5873fddb920c9242',
  email: 'admin@gmail.com',
  role: 'Super Admin'
};
const token = jwt.sign(payload, secret);

const BASE_URL = 'http://127.0.0.1:3000/api/v1';

async function test() {
  console.log('--- Starting Verification ---');
  
  // 1. Create a dummy employee
  const randomSuffix = Math.floor(Math.random() * 10000);
  const personalEmail = `test.personal.${randomSuffix}@gmail.com`;
  const officialEmail = `test.official.${randomSuffix}@company.com`;
  const employeeData = {
    firstName: 'Verification',
    lastName: 'Employee',
    gender: 'Male',
    dob: '1995-05-15',
    mobile: '1234567890',
    personalEmail: personalEmail,
    officialEmail: officialEmail,
    department: 'Sales',
    designation: 'Sales Agent',
    joiningDate: '2026-08-19',
    employmentType: 'Permanent',
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    status: 'Active'
  };

  let employeeId = null;
  let employeeMongoId = null;

  try {
    const resCreate = await fetch(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(employeeData)
    });
    
    console.log('Create employee status:', resCreate.status);
    const createData = await resCreate.json();
    console.log('Create employee result:', createData.success ? 'Success' : createData.message);
    if (resCreate.status !== 201) {
      throw new Error(`Failed to create employee: ${JSON.stringify(createData)}`);
    }
    employeeMongoId = createData.data.id;
    employeeId = createData.data.employeeId;
    console.log('Created Employee IDs:', { employeeMongoId, employeeId });
  } catch (err) {
    console.error('Error in step 1:', err);
    return;
  }

  // 2. Try registering with personalEmail (should fail because officialEmail is set)
  try {
    const resRegisterPersonal = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: personalEmail,
        name: 'Verification Employee',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        role: 'Agent/Broker',
        agreeTerms: true
      })
    });
    console.log('Register with personal email status (expected fail):', resRegisterPersonal.status);
    const registerData = await resRegisterPersonal.json();
    console.log('Register with personal email message:', registerData.message);
  } catch (err) {
    console.error('Error in step 2:', err);
  }

  // 3. Register with officialEmail (should succeed)
  try {
    const resRegisterOfficial = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: officialEmail,
        name: 'Verification Employee',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        role: 'Agent/Broker',
        agreeTerms: true
      })
    });
    console.log('Register with official email status (expected 201):', resRegisterOfficial.status);
    const registerData = await resRegisterOfficial.json();
    console.log('Register result:', registerData.success ? 'Success' : registerData.message);
  } catch (err) {
    console.error('Error in step 3:', err);
  }

  // 4. Try logging in with personal email (should fail)
  try {
    const resLoginPersonal = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: personalEmail,
        password: 'TestPassword123!'
      })
    });
    console.log('Login with personal email status (expected fail):', resLoginPersonal.status);
    const loginData = await resLoginPersonal.json();
    console.log('Login with personal email message:', loginData.message);
  } catch (err) {
    console.error('Error in step 4:', err);
  }

  // 5. Login with official email (should succeed)
  try {
    const resLoginOfficial = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: officialEmail,
        password: 'TestPassword123!'
      })
    });
    console.log('Login with official email status (expected 200):', resLoginOfficial.status);
    const loginData = await resLoginOfficial.json();
    console.log('Login result:', loginData.success ? 'Success' : loginData.message);
  } catch (err) {
    console.error('Error in step 5:', err);
  }

  // 6. Change employee status to Inactive via our new status endpoint
  try {
    const resStatus = await fetch(`${BASE_URL}/employees/${employeeMongoId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Inactive' })
    });
    console.log('Update status to Inactive response code (expected 200):', resStatus.status);
    const statusResult = await resStatus.json();
    console.log('New status in DB:', statusResult.data.status);
  } catch (err) {
    console.error('Error in step 6:', err);
  }

  // 7. Try logging in with official email now (should fail because inactive)
  try {
    const resLoginOfficialInactive = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: officialEmail,
        password: 'TestPassword123!'
      })
    });
    console.log('Login with official email while inactive status (expected 401):', resLoginOfficialInactive.status);
    const loginData = await resLoginOfficialInactive.json();
    console.log('Login message:', loginData.message);
  } catch (err) {
    console.error('Error in step 7:', err);
  }

  // 8. Re-activate employee status to Active
  try {
    const resStatusActive = await fetch(`${BASE_URL}/employees/${employeeMongoId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Active' })
    });
    console.log('Update status to Active response code (expected 200):', resStatusActive.status);
    const statusResult = await resStatusActive.json();
    console.log('New status in DB:', statusResult.data.status);
  } catch (err) {
    console.error('Error in step 8:', err);
  }

  // 9. Login with official email again (should succeed)
  try {
    const resLoginOfficialActive = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: officialEmail,
        password: 'TestPassword123!'
      })
    });
    console.log('Login with official email after reactivation status (expected 200):', resLoginOfficialActive.status);
    const loginData = await resLoginOfficialActive.json();
    console.log('Login result:', loginData.success ? 'Success' : loginData.message);
  } catch (err) {
    console.error('Error in step 9:', err);
  }

  // Cleanup: Delete the employee (which also deletes the user due to deletion syncing)
  try {
    const resDelete = await fetch(`${BASE_URL}/employees/${employeeMongoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Cleanup employee status (expected 200):', resDelete.status);
  } catch (err) {
    console.error('Failed to cleanup:', err);
  }

  console.log('--- Verification Finished ---');
}

test();
