const mongoose = require("mongoose");
const dns = require("dns");

// Set public DNS servers to resolve MongoDB Atlas SRV records on Windows/local networks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (dnsErr) {
  console.warn("[DNS Warning]", dnsErr.message);
}

const DEFAULT_ATLAS_URI =
  "mongodb+srv://kathir_stb_recharge:V.Kathiravan.4344@cluster0.eusikww.mongodb.net/stb_recharge?retryWrites=true&w=majority&appName=Cluster0";

const DIRECT_ATLAS_FALLBACK_URI =
  "mongodb://kathir_stb_recharge:V.Kathiravan.4344@ac-n49efns-shard-00-00.eusikww.mongodb.net:27017,ac-n49efns-shard-00-01.eusikww.mongodb.net:27017,ac-n49efns-shard-00-02.eusikww.mongodb.net:27017/stb_recharge?ssl=true&replicaSet=atlas-13w1i2-shard-0&authSource=admin&retryWrites=true&w=majority";

const LOCAL_MONGODB_URI = "mongodb://127.0.0.1:27017/stb_recharge";

let isConnected = false;

mongoose.connection.on("connected", () => {
  console.log("MongoDB Connected");
});

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || DEFAULT_ATLAS_URI;
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`[MongoDB] Successfully Connected to Host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB SRV Error] ${error.message}`);
    try {
      console.info("[MongoDB] Attempting connection via direct replicaSet connection string...");
      const conn2 = await mongoose.connect(DIRECT_ATLAS_FALLBACK_URI, {
        serverSelectionTimeoutMS: 8000,
      });
      isConnected = true;
      console.log(`[MongoDB Direct] Successfully Connected to Host: ${conn2.connection.host}`);
    } catch (fallbackErr) {
      console.error(`[MongoDB Direct Error] ${fallbackErr.message}`);
      try {
        console.info("[MongoDB] Attempting connection to local MongoDB database...");
        const conn3 = await mongoose.connect(LOCAL_MONGODB_URI, {
          serverSelectionTimeoutMS: 3000,
        });
        isConnected = true;
        console.log(`[MongoDB Local] Successfully Connected to Local Host: ${conn3.connection.host}`);
      } catch (localErr) {
        console.error(`[MongoDB Local Error] ${localErr.message}`);
        throw fallbackErr;
      }
    }
  }
};

module.exports = connectDB;
