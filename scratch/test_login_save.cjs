const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const URI =
  'mongodb+srv://kathir_stb_recharge:V.Kathiravan.4344@cluster0.eusikww.mongodb.net/stb_recharge?retryWrites=true&w=majority&appName=Cluster0';

async function test() {
  try {
    await mongoose.connect(URI, { serverSelectionTimeoutMS: 8000 });
    console.log('Connected to MongoDB Atlas.');

    const StbMapping = mongoose.connection.db.collection('stbmappings');
    const User = mongoose.connection.db.collection('users');

    const testStbId = '8331000FEDA9';
    const testMobile = '9876543210';
    const testName = 'Kathiravan Test Customer';

    // Simulate verify-otp behavior:
    await StbMapping.updateOne(
      { stbId: testStbId },
      { $set: { customerName: testName, customerMobile: testMobile } }
    );

    const doc = await StbMapping.findOne({ stbId: testStbId });
    console.log('Updated StbMapping in MongoDB:', JSON.stringify(doc, null, 2));

    process.exit(0);
  } catch (e) {
    console.error('Test Error:', e.message);
    process.exit(1);
  }
}

test();
