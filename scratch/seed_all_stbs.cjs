const mongoose = require('mongoose');
const dns = require('dns');
const fs = require('fs');
const path = require('path');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const URI =
  'mongodb+srv://kathir_stb_recharge:V.Kathiravan.4344@cluster0.eusikww.mongodb.net/stb_recharge?retryWrites=true&w=majority&appName=Cluster0';

const jsonPath = path.join(__dirname, 'venkatesa_stbs.json');
const stbs = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

async function run() {
  try {
    await mongoose.connect(URI, { serverSelectionTimeoutMS: 8000 });
    console.log('Connected to MongoDB Atlas. Seeding', stbs.length, 'STBs...');
    const col = mongoose.connection.db.collection('stbmappings');

    let inserted = 0;
    let existing = 0;

    for (const item of stbs) {
      const cleanStbId = item.stbId.trim().toUpperCase();
      const res = await col.updateOne(
        { stbId: cleanStbId },
        {
          $setOnInsert: {
            stbId: cleanStbId,
            operatorMobile: item.operatorMobile || '9787312758',
            operatorName: item.operatorName || 'VENKATESA PERUMAL',
            customerName: item.customerName || 'Customer',
            customerMobile: item.customerMobile || '',
            currentPlan: item.currentPlan || 'Basic Tamil Pack Monthly Rs 220',
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isApproved: true,
            status: 'Approved',
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
      if (res.upsertedCount > 0) inserted++;
      else existing++;
    }

    const totalNow = await col.countDocuments();
    console.log(`Done! Newly Inserted: ${inserted} | Existing: ${existing} | Total STBs in MongoDB Atlas: ${totalNow}`);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

run();
