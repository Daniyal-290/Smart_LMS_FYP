const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Submission = require('./models/Submission');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartlms').then(async () => {
  await Submission.updateMany({}, { aiGrade: null, aiFeedback: "", similarityScore: 0 });
  console.log("Mock grades cleared from existing submissions.");
  process.exit(0);
});
