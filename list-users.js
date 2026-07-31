const mongoose = require('mongoose');

async function main() {
  const uri = 'mongodb+srv://sunnygill1706_db_user:T5GrRgujqKKCvH6K@cluster0.l351phj.mongodb.net/crm_app_db?retryWrites=true&w=majority&appName=Cluster0';
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas');
    
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', UserSchema, 'users');

    const users = await User.find({}).lean();
    console.log('Users in DB count:', users.length);
    console.log('Users in DB:', JSON.stringify(users.map(u => ({ id: u._id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role })), null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
