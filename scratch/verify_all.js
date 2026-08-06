const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Minimal schemas
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, default: '' },
  role: { type: String, required: true, default: 'Agent/Broker' }
}, { timestamps: true });

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, required: true },
  dob: { type: Date, required: true },
  mobile: { type: String, required: true },
  personalEmail: { type: String, required: true, unique: true },
  officialEmail: { type: String, default: '' },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  employmentType: { type: String, required: true },
  password: { type: String, default: '' }
}, { timestamps: true });

// Pre-save password hashing hook on user
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

const User = mongoose.model('User', UserSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);

const mongoUri = 'mongodb+srv://sunnygill1706_db_user:T5GrRgujqKKCvH6K@cluster0.l351phj.mongodb.net/crm_app?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to DB successfully.');

    const personalEmail = 'test_verify_personal@example.com';
    const officialEmail = 'test_verify_official@example.com';

    // Clean up
    await User.deleteMany({ email: { $in: [personalEmail, officialEmail] } });
    await Employee.deleteMany({ personalEmail });

    console.log('\n--- SCENARIO 1: Creating Employee with Official Email ---');
    // Save employee
    const employee = new Employee({
      employeeId: 'EMP_VERIFY_999',
      firstName: 'Verify',
      lastName: 'Employee',
      gender: 'Male',
      dob: new Date('1990-01-01'),
      mobile: '9876543210',
      personalEmail,
      officialEmail,
      department: 'Sales',
      designation: 'Sales Agent',
      joiningDate: new Date(),
      employmentType: 'Permanent',
      password: 'Password123!'
    });
    await employee.save();
    console.log('Employee saved in DB.');

    // Auto-create user logic (mimicking employees.service.ts)
    const emailToUse = officialEmail || personalEmail;
    let user = new User({
      email: emailToUse,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: 'Agent/Broker',
      password: employee.password
    });
    await user.save();
    console.log(`User created in DB with email: ${emailToUse}`);

    console.log('\n--- SCENARIO 2: Login Check ---');
    // Test login logic via employeesService.findOneByEmail and password verification
    // 1. Log in with official email
    const empByOfficial = await Employee.findOne({
      $or: [
        { personalEmail: officialEmail },
        { officialEmail: officialEmail }
      ]
    });
    console.log(`Find Employee by Official Email: ${empByOfficial ? 'FOUND' : 'NOT FOUND'}`);
    if (empByOfficial) {
      const isPasswordValid = empByOfficial.password === 'Password123!';
      console.log(`Verify Password: ${isPasswordValid ? 'SUCCESS' : 'FAILED'}`);
      
      const userRecord = await User.findOne({
        email: { $in: [empByOfficial.officialEmail, empByOfficial.personalEmail] }
      });
      console.log(`Found corresponding User Record: ${userRecord ? 'YES' : 'NO'} (${userRecord?.email})`);
    }

    // 2. Log in with personal email
    const empByPersonal = await Employee.findOne({
      $or: [
        { personalEmail: personalEmail },
        { officialEmail: personalEmail }
      ]
    });
    console.log(`Find Employee by Personal Email: ${empByPersonal ? 'FOUND' : 'NOT FOUND'}`);
    if (empByPersonal) {
      const isPasswordValid = empByPersonal.password === 'Password123!';
      console.log(`Verify Password: ${isPasswordValid ? 'SUCCESS' : 'FAILED'}`);
      
      const userRecord = await User.findOne({
        email: { $in: [empByPersonal.officialEmail, empByPersonal.personalEmail] }
      });
      console.log(`Found corresponding User Record: ${userRecord ? 'YES' : 'NO'} (${userRecord?.email})`);
    }

    console.log('\n--- SCENARIO 3: Existing Employee Signup Flow ---');
    // Mimic signup with existing employee email (casing mix)
    const signupEmail = 'TEST_VERIFY_PERSONAL@EXAMPLE.COM';
    const cleanSignupEmail = signupEmail.toLowerCase().trim();

    // Check if user exists but is not employee (graceful signup check)
    const existingUser = await User.findOne({ email: cleanSignupEmail });
    let existingEmployee = await Employee.findOne({
      $or: [
        { personalEmail: cleanSignupEmail },
        { officialEmail: cleanSignupEmail }
      ]
    });

    if (existingUser && !existingEmployee) {
      console.log('Rejected: User exists but not an employee');
    } else {
      console.log('Accepted: Proceeding with register/password update');
      if (existingEmployee) {
        existingEmployee.password = 'NewPassword123!';
        await existingEmployee.save();
        console.log('Updated Employee password.');
      }
      
      let userRec = await User.findOne({ email: cleanSignupEmail });
      if (!userRec && existingEmployee) {
        userRec = await User.findOne({ email: existingEmployee.officialEmail.toLowerCase() }) || 
                  await User.findOne({ email: existingEmployee.personalEmail.toLowerCase() });
      }

      if (userRec) {
        // Update user
        userRec.password = 'NewPassword123!';
        await userRec.save();
        console.log(`Updated User password for: ${userRec.email}`);
      }
    }

    // Clean up
    await User.deleteMany({ email: { $in: [personalEmail, officialEmail] } });
    await Employee.deleteMany({ personalEmail });
    console.log('\nClean up completed successfully.');

  } catch (err) {
    console.error('Verification failed with error:', err.message, err.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit(0);
  }
}

run();
