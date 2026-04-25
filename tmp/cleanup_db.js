const mongoose = require('mongoose');
require('dotenv').config();

const knowledgeSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

const Knowledge = mongoose.model('Knowledge', knowledgeSchema);

async function cleanDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB for cleaning...');

    // Delete the problematic record
    const result = await Knowledge.deleteMany({ 
      question: /hà nội/i,
      answer: /hà giang/i 
    });

    console.log(`Deleted ${result.deletedCount} incorrect knowledge records.`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Cleaning error:', err);
  }
}

cleanDB();
