const mongoose = require('mongoose');

async function main() {
  const uri = 'mongodb+srv://sunnygill1706_db_user:T5GrRgujqKKCvH6K@cluster0.l351phj.mongodb.net/crm_app_db?retryWrites=true&w=majority&appName=Cluster0';
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas');
    
    const EmployeeSchema = new mongoose.Schema({}, { strict: false });
    const Employee = mongoose.model('Employee', EmployeeSchema, 'employees');

    const employees = await Employee.find({}).lean();
    console.log('Employees in DB count:', employees.length);
    console.log('Employees in DB full data:', JSON.stringify(employees, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
