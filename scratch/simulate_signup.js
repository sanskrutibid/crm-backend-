const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// Hash password pre-save hook using clean promise returns without next callbacks
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

const User = mongoose.model('User', UserSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);

const mongoUri = 'mongodb+srv://sunnygill1706_db_user:T5GrRgujqKKCvH6K@cluster0.l351phj.mongodb.net/crm_app?retryWrites=true&w=majority&appName=Cluster0';

async function register(registerDto) {
  if (registerDto.password !== registerDto.confirmPassword) {
    throw new Error('Passwords do not match');
  }
  if (registerDto.agreeTerms !== true) {
    throw new Error('You must accept the terms and conditions');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: registerDto.email.toLowerCase().trim() });
  if (existingUser) {
    throw new Error('User with this email is already registered');
  }

  const nameParts = registerDto.name.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Unknown';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Check if employee exists
  let employee = await Employee.findOne({ personalEmail: registerDto.email.toLowerCase().trim() });
  if (employee) {
    // If employee exists, update their password
    employee.password = registerDto.password;
    await employee.save();
    console.log('Updated existing employee password');
  } else {
    // If employee does not exist, create a new employee record so they show up in the employee table!
    const employeeId = 'EMP_TEMP_TEST_123';
    employee = new Employee({
      employeeId,
      firstName,
      lastName,
      personalEmail: registerDto.email.toLowerCase().trim(),
      gender: 'Male', // Default gender
      dob: new Date('1990-01-01'), // Default DOB
      mobile: '0000000000', // Default placeholder mobile
      department: 'Sales', // Default department
      designation: 'Sales Agent', // Default designation
      joiningDate: new Date(),
      employmentType: 'Permanent',
      password: registerDto.password,
    });

    console.log('Saving new Employee...');
    await employee.save();
    console.log('Saved new Employee.');
  }

  let user = await User.findOne({ email: registerDto.email.toLowerCase().trim() });
  if (!user) {
    console.log('Creating corresponding User...');
    user = new User({
      email: registerDto.email,
      firstName,
      lastName,
      role: registerDto.role || 'Agent/Broker',
      password: registerDto.password,
    });
    await user.save();
    console.log('Saved corresponding User.');
  }

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    }
  };
}

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    const email = 'test_signup_flow_unique123@example.com';
    // Clean up
    await User.deleteMany({ email });
    await Employee.deleteMany({ personalEmail: email });

    const result = await register({
      email,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      name: 'Signup Flow Test',
      agreeTerms: true
    });

    console.log('Registration Succeeded:', result);

    // Clean up
    await User.deleteMany({ email });
    await Employee.deleteMany({ personalEmail: email });
    console.log('Clean up done!');

  } catch (err) {
    console.error('Error during registration flow:', err.message, err.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  }
}

run();
