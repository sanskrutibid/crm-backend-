const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, default: '' },
  role: { type: String, required: true, default: 'Agent/Broker' },
  customPermissions: { type: Map, of: Boolean, default: {} },
  isActive: { type: Boolean, default: true }
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

const User = mongoose.model('User', UserSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);

const mongoUri = 'mongodb+srv://sunnygill1706_db_user:T5GrRgujqKKCvH6K@cluster0.l351phj.mongodb.net/crm_app?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    const email = 'test_signup_temp_unique123@example.com';
    // Clean up if exist
    await User.deleteMany({ email });
    await Employee.deleteMany({ personalEmail: email });

    console.log('Cleaned up existing records');

    // Create Employee
    const baseId = 'XY1001';
    const employee = new Employee({
      employeeId: baseId,
      firstName: 'Test',
      lastName: 'User',
      gender: 'Male',
      dob: new Date('1990-01-01'),
      mobile: '0000000000',
      personalEmail: email,
      officialEmail: 'test_signup_temp_official@example.com',
      department: 'Sales',
      designation: 'Sales Agent',
      joiningDate: new Date(),
      employmentType: 'Permanent',
      password: 'Password123!'
    });

    console.log('Validating Employee...');
    await employee.validate();
    console.log('Employee is valid. Saving...');
    await employee.save();
    console.log('Employee saved.');

    // Create User
    const user = new User({
      email: email,
      firstName: 'Test',
      lastName: 'User',
      password: 'Password123!',
      role: 'Agent/Broker'
    });

    console.log('Validating User...');
    await user.validate();
    console.log('User is valid. Saving...');
    await user.save();
    console.log('User saved.');

    // Clean up
    await User.deleteMany({ email });
    await Employee.deleteMany({ personalEmail: email });
    console.log('Clean up done!');

  } catch (err) {
    console.error('Error during DB validation:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  }
}

run();
