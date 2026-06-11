const mongoose = require('mongoose');

async function main() {
  const uri = 'mongodb://localhost:27017/crm_app';
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', UserSchema, 'users');

    const users = await User.find({}).lean();
    console.log('Users in DB:', JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
