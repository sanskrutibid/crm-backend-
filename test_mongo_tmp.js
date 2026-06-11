const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  task: { type: String, required: true },
  description: String,
  scheduledDate: { type: String, required: true },
  scheduleTime: { type: String, required: true },
  branch: String,
  status: { type: String, required: true, default: 'Open' },
  priority: { type: String, required: true, default: 'Medium' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  history: {
    type: [
      {
        comment: { type: String, required: true },
        nextAction: { type: String, enum: ['Call', 'Meeting', 'None'], default: 'None' },
        nextDate: String,
        nextTime: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    default: []
  }
}, { timestamps: true });

const Task = mongoose.model('Task', TaskSchema);

async function run() {
  const mongoUri = 'mongodb://localhost:27017/crm_app';
  console.log('Connecting to MongoDB:', mongoUri);
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected successfully!');

    const taskId = '6a15718f683b243a6a491f4d';
    console.log('Fetching task with ID:', taskId);
    const task = await Task.findById(taskId);
    if (!task) {
      console.log('Task not found in DB!');
      return;
    }
    console.log('Found Task Document:', JSON.stringify(task, null, 2));

    console.log('Attempting to validate...');
    const validationError = task.validateSync();
    if (validationError) {
      console.log('Validation Error on existing document:', validationError);
    } else {
      console.log('Document is valid.');
    }

    console.log('Attempting to append history...');
    task.history.push({
      comment: "metting fixed on 13 june dicution for 3 bhk flatsa",
      nextAction: "Meeting",
      nextDate: "2026-06-13",
      nextTime: "04:20 pm"
    });

    task.scheduledDate = "2026-06-13";
    task.scheduleTime = "04:20 pm";

    console.log('Validating updated document...');
    const validationError2 = task.validateSync();
    if (validationError2) {
      console.log('Validation Error on updated document:', validationError2);
    } else {
      console.log('Updated document is valid.');
      console.log('Saving...');
      await task.save();
      console.log('Save successful!');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
