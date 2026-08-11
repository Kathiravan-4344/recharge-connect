const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Models for initial seeding
const Admin = require("./models/Admin");
const Operator = require("./models/Operator");
const Plan = require("./models/Plan");
const Product = require("./models/Product");

// Route modules
const authRoutes = require("./routes/authRoutes");
const stbRoutes = require("./routes/stbRoutes");
const rechargeRoutes = require("./routes/rechargeRoutes");
const operatorRoutes = require("./routes/operatorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const productRoutes = require("./routes/productRoutes");
const productRequestRoutes = require("./routes/productRequestRoutes");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware & Bulletproof CORS Setup
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);
app.options("*", cors());
app.use((req, res, next) => {
  if (req.body && typeof req.body === "string") {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {}
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Seed initial database defaults
const seedInitialData = async () => {
  try {
    // Seed Admin (9080864542)
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.create({
        mobileNumber: "9080864542",
        name: "Super Admin (Kathiravan V)",
      });
      console.log("[DB Seed] Default Admin (9080864542) created.");
    }

    // Delete any existing 9080864542 operator so Super Admin is not listed as operator
    await Operator.deleteMany({ mobileNumber: "9080864542" });

    let op2 = await Operator.findOne({ mobileNumber: "9787312758" });
    if (!op2) {
      await Operator.create({
        mobileNumber: "9787312758",
        name: "PERUMAL A",
        isActive: true,
      });
      console.log("[DB Seed] Operator 9787312758 created.");
    }
  } catch (err) {
    console.error("[DB Seed Error]", err.message);
  }
};

// Connect Database & Seed for standalone server execution
if (require.main === module) {
  connectDB()
    .then(() => {
      seedInitialData();
    })
    .catch((err) => {
      console.error("[Standalone DB Connection Error]", err);
    });
}

// Root Health Check Route
app.get(["/", "/api", "/api/health"], (req, res) => {
  res.json({
    status: "online",
    server: "STB RECHARGE API Server",
    time: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth",
      stb: "/api/stb",
      plans: "/api/recharge/plans",
      recharge: "/api/recharge",
      operator: "/api/operator/requests",
      admin: "/api/admin",
      complaint: "/api/complaint",
    },
  });
});

// Mount Routes cleanly (No duplicate mounts)
app.use("/api/auth", authRoutes);
app.use("/api/stb", stbRoutes);
app.use("/api/recharge", rechargeRoutes);
app.use("/api/operator", operatorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/complaint", complaintRoutes);
app.use("/api", productRoutes);
app.use("/api", productRequestRoutes);

// Global 404 Route Catch-all
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Start Express Server
if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`====================================================`);
    console.log(` 🚀 STB RECHARGE Backend running on port ${PORT}`);
    console.log(` 🔗 Local: http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
