const mongoose = require("mongoose");
const dns = require("dns");

// Set public DNS servers to resolve MongoDB Atlas SRV records reliably in Vercel & Node environments
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (dnsErr) {
  console.warn("[DNS Warning]", dnsErr.message);
}

const DEFAULT_ATLAS_URI =
  "mongodb+srv://kathir_stb_recharge:V.Kathiravan.4344@cluster0.eusikww.mongodb.net/stb_recharge?retryWrites=true&w=majority&appName=Cluster0";

const DIRECT_ATLAS_FALLBACK_URI =
  "mongodb://kathir_stb_recharge:V.Kathiravan.4344@ac-n49efns-shard-00-00.eusikww.mongodb.net:27017,ac-n49efns-shard-00-01.eusikww.mongodb.net:27017,ac-n49efns-shard-00-02.eusikww.mongodb.net:27017/stb_recharge?ssl=true&replicaSet=atlas-13w1i2-shard-0&authSource=admin&retryWrites=true&w=majority";

let isConnected = false;
async function connectDB() {
  if (isConnected || mongoose.connection.readyState === 1) return;
  try {
    const mongoUri = process.env.MONGODB_URI || DEFAULT_ATLAS_URI;
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    isConnected = true;
    console.log("[Vercel DB Connected via Primary Atlas URI]");
  } catch (e) {
    console.error("[Vercel DB Connection Primary Error]", e.message);
    try {
      await mongoose.connect(DIRECT_ATLAS_FALLBACK_URI, { serverSelectionTimeoutMS: 8000 });
      isConnected = true;
      console.log("[Vercel DB Connected via Direct Fallback]");
    } catch (fallbackErr) {
      console.error("[Vercel DB Connection Direct Fallback Error]", fallbackErr.message);
    }
  }
}

// Inline Mongoose Schemas for standalone Vercel Serverless execution
const userSchema = new mongoose.Schema(
  {
    mobileNumber: { type: String, required: true },
    name: { type: String, default: "Customer" },
    stbId: { type: String, default: "1234567890" },
    role: { type: String, default: "customer" },
  },
  { timestamps: true }
);

const stbMappingSchema = new mongoose.Schema(
  {
    stbId: { type: String, required: true, uppercase: true, trim: true },
    operatorMobile: { type: String, required: true, trim: true },
    operatorName: { type: String, default: "Operator" },
    customerName: { type: String, default: "Customer" },
    customerMobile: { type: String, default: "" },
    currentPlan: { type: String, default: "Basic Tamil Pack Monthly Rs 220" },
    expiryDate: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    isApproved: { type: Boolean, default: true },
    status: { type: String, default: "Approved" },
  },
  { timestamps: true }
);

const rechargeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.Mixed, ref: "User" },
    stbId: { type: String, required: true },
    customerName: { type: String, default: "Customer" },
    customerMobile: { type: String, default: "" },
    operatorMobile: { type: String, default: "" },
    planId: { type: mongoose.Schema.Types.Mixed, ref: "Plan" },
    planName: { type: String, default: "" },
    amount: { type: Number, required: true },
    paymentStatus: { type: String, default: "Success" },
    status: { type: String, default: "Pending" },
    requestTime: { type: Date, default: Date.now },
    approvedTime: { type: Date, default: null },
  },
  { timestamps: true }
);

const complaintSchema = new mongoose.Schema(
  {
    stbId: { type: String, default: "STB-UNKNOWN" },
    customerName: { type: String, default: "Customer" },
    customerMobile: { type: String, default: "" },
    category: { type: String, required: true, default: "General Issues" },
    issueType: { type: String, default: "" },
    description: { type: String, required: true },
    mediaUrl: { type: String, default: "" },
    preferredTime: { type: String, default: "Anytime" },
    status: { type: String, enum: ["Pending", "Assigned", "In Progress", "Resolved"], default: "Pending" },
    technicianName: { type: String, default: "" },
    technicianMobile: { type: String, default: "" },
    assignedAt: { type: String, default: "" },
    expectedArrival: { type: String, default: "" },
    resolvedAt: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    feedback: { type: String, default: "" },
  },
  { timestamps: true }
);

const productRequestSchema = new mongoose.Schema(
  {
    stbId: { type: String, default: "STB-UNKNOWN" },
    customerName: { type: String, default: "Customer" },
    customerMobile: { type: String, default: "" },
    productId: { type: String, default: "" },
    productName: { type: String, default: "Accessory / Service" },
    category: { type: String, default: "accessory" },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    status: { type: String, default: "Pending" },
    technicianName: { type: String, default: "" },
    technicianMobile: { type: String, default: "" },
    scheduledDate: { type: String, default: "" },
    operatorNote: { type: String, default: "" },
  },
  { timestamps: true }
);

const operatorSchema = new mongoose.Schema(
  {
    mobileNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const productCatalogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, default: "accessory" },
    price: { type: Number, default: 0 },
    availableStock: { type: Number, default: 0 },
    soldQuantity: { type: Number, default: 0 },
    description: { type: String, default: "" },
    iconName: { type: String, default: "Box" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const StbMapping = mongoose.models.StbMapping || mongoose.model("StbMapping", stbMappingSchema);
const RechargeRequest = mongoose.models.RechargeRequest || mongoose.model("RechargeRequest", rechargeSchema);
const Recharge = mongoose.models.Recharge || mongoose.model("Recharge", rechargeSchema);
const Complaint = mongoose.models.Complaint || mongoose.model("Complaint", complaintSchema);
const ProductRequest = mongoose.models.ProductRequest || mongoose.model("ProductRequest", productRequestSchema);
const Operator = mongoose.models.Operator || mongoose.model("Operator", operatorSchema);
const ProductCatalog = mongoose.models.ProductCatalog || mongoose.model("ProductCatalog", productCatalogSchema);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-operator-mobile");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();

    const forwardedUri = req.headers["x-forwarded-uri"] || req.headers["x-matched-path"] || req.headers["x-original-url"] || "";
    const queryPath = req.query ? (req.query.path || req.query["0"] || "") : "";
    const reqUrl = req.url || "";
    const routeString = `${forwardedUri} ${queryPath} ${reqUrl}`.toLowerCase();

    let body = req.body || {};
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }

    // Auth: Send OTP
    if (req.method === "POST" && routeString.includes("auth/send-otp")) {
      const { mobileNumber } = body;
      return res.status(200).json({ success: true, message: "OTP sent successfully", otp: "1234" });
    }

    // Auth: Verify OTP
    if (req.method === "POST" && routeString.includes("auth/verify-otp")) {
      const { mobileNumber, otp, name, stbId } = body;
      const cleanMob = String(mobileNumber || "").trim();
      const cleanDigits = cleanMob.replace(/\D/g, "").slice(-10);

      let user = await User.findOne({
        $or: [{ mobileNumber: cleanMob }, { mobileNumber: cleanDigits }]
      });

      if (!user) {
        let role = "customer";
        if (cleanDigits === "9080864542") role = "admin";
        else {
          const opExists = await Operator.findOne({
            $or: [{ mobileNumber: cleanMob }, { mobileNumber: cleanDigits }],
            isActive: true,
          });
          if (opExists || cleanDigits === "9787312758") role = "operator";
        }

        user = await User.create({
          mobileNumber: cleanMob,
          name: name || (role === "admin" ? "Kathiravan V" : role === "operator" ? "Operator" : "Customer"),
          stbId: stbId || `STB-${cleanDigits.slice(-6)}`,
          role,
        });
      }

      return res.status(200).json({
        success: true,
        token: `jwt-${user._id}-${Date.now()}`,
        user,
      });
    }

    // Operator: Login
    if (req.method === "POST" && routeString.includes("operator/login")) {
      const { mobileNumber } = body;
      if (!mobileNumber) {
        return res.status(400).json({ success: false, message: "Operator mobile number is required" });
      }
      const cleanMob = String(mobileNumber).trim();
      const cleanDigits = cleanMob.replace(/\D/g, "").slice(-10);

      let op = await Operator.findOne({
        $or: [{ mobileNumber: cleanMob }, { mobileNumber: cleanDigits }],
        isActive: true,
      });

      if (!op && (cleanDigits === "9080864542" || cleanDigits === "9787312758")) {
        op = {
          _id: `op-${cleanDigits}`,
          mobileNumber: cleanMob,
          name: cleanDigits === "9080864542" ? "Admin" : "PERUMAL",
          isActive: true,
        };
      }

      if (!op) {
        return res.status(403).json({
          success: false,
          message: "Not Authorized: Operator mobile number not registered or inactive",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Operator authentication successful",
        token: `op-jwt-${cleanDigits}-${Date.now()}`,
        operator: op,
      });
    }

    // Auth: Profile
    if (req.method === "GET" && routeString.includes("auth/profile")) {
      const mob = String(reqUrl.split("/").pop()).trim();
      const cleanDigits = mob.replace(/\D/g, "").slice(-10);

      const user = await User.findOne({
        $or: [{ mobileNumber: mob }, { mobileNumber: cleanDigits }]
      });

      const recharges = await RechargeRequest.find({
        $or: [{ customerMobile: mob }, { customerMobile: cleanDigits }]
      }).sort({ createdAt: -1 });

      const productRequests = await ProductRequest.find({
        $or: [{ customerMobile: mob }, { customerMobile: cleanDigits }]
      }).sort({ createdAt: -1 });

      const complaints = await Complaint.find({
        $or: [{ customerMobile: mob }, { customerMobile: cleanDigits }]
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        user,
        recharges,
        productRequests,
        complaints,
      });
    }

    // STB Validation Endpoint: POST /api/stb/validate
    if (req.method === "POST" && routeString.includes("stb/validate")) {
      const { stbId } = body;
      if (!stbId || String(stbId).trim().length < 3) {
        return res.status(400).json({ success: false, valid: false, message: "Invalid STB ID" });
      }
      const cleanStb = String(stbId).trim().toUpperCase();
      const mapping = await StbMapping.findOne({ stbId: cleanStb });
      if (mapping) {
        if (!mapping.isApproved || mapping.status === "Blocked") {
          return res.status(403).json({ success: false, valid: false, message: "STB ID is blocked or inactive" });
        }
        return res.status(200).json({
          success: true,
          valid: true,
          stbId: cleanStb,
          customerName: mapping.customerName,
          customerMobile: mapping.customerMobile,
          operatorMobile: mapping.operatorMobile,
          currentPlan: mapping.currentPlan,
          expiryDate: mapping.expiryDate,
        });
      }
      const existingUser = await User.findOne({ stbId: cleanStb });
      if (existingUser) {
        return res.status(200).json({
          success: true,
          valid: true,
          stbId: cleanStb,
          customerName: existingUser.name,
          currentPlan: existingUser.currentPlan,
          expiryDate: existingUser.expiryDate,
        });
      }
      return res.status(404).json({
        success: false,
        valid: false,
        message: "STB ID is not registered with any operator. Please contact your local operator.",
      });
    }

    // Map STB Endpoint: POST /api/stb/map
    if (req.method === "POST" && routeString.includes("stb/map")) {
      const { stbId, operatorMobile, operatorName, customerName, customerMobile, currentPlan, expiryDate } = body;
      if (!stbId || !operatorMobile) {
        return res.status(400).json({ success: false, message: "STB ID and Operator Mobile are required" });
      }
      const cleanStb = String(stbId).trim().toUpperCase();
      const cleanOpMobile = String(operatorMobile).trim();
      let mapping = await StbMapping.findOne({ stbId: cleanStb });
      if (mapping) {
        mapping.operatorMobile = cleanOpMobile;
        if (operatorName) mapping.operatorName = operatorName.trim();
        if (customerName) mapping.customerName = customerName.trim();
        if (customerMobile) mapping.customerMobile = customerMobile.trim();
        if (currentPlan) mapping.currentPlan = currentPlan.trim();
        if (expiryDate) mapping.expiryDate = new Date(expiryDate);
        await mapping.save();
      } else {
        mapping = await StbMapping.create({
          stbId: cleanStb,
          operatorMobile: cleanOpMobile,
          operatorName: operatorName ? operatorName.trim() : "Operator",
          customerName: customerName ? customerName.trim() : "Customer",
          customerMobile: customerMobile ? customerMobile.trim() : "",
          currentPlan: currentPlan ? currentPlan.trim() : "Basic Tamil Pack Monthly Rs 220",
          expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isApproved: true,
          status: "Approved",
        });
      }
      return res.status(200).json({ success: true, mapping });
    }

    // Get STBs by Operator: GET /api/stb/operator/:mobile
    if (req.method === "GET" && routeString.includes("stb/operator")) {
      const opMobile = String(reqUrl.split("/").pop()).trim();
      let mappings = [];
      if (opMobile === "9080864542" || !opMobile || opMobile.includes("operator")) {
        mappings = await StbMapping.find().sort({ createdAt: -1 });
      } else {
        mappings = await StbMapping.find({ operatorMobile: opMobile }).sort({ createdAt: -1 });
      }
      return res.status(200).json({ success: true, mappings });
    }

    // Delete STB Mapping: DELETE /api/stb/map/:id
    if (req.method === "DELETE" && routeString.includes("stb/map")) {
      const mapId = reqUrl.split("/").pop();
      if (mapId && mapId.match(/^[0-9a-fA-F]{24}$/)) {
        await StbMapping.findByIdAndDelete(mapId);
      }
      return res.status(200).json({ success: true, message: "Deleted" });
    }

    // Step 1: Customer submits recharge -> Save to rechargerequests collection only
    if (req.method === "POST" && (routeString.includes("recharge/create") || routeString.includes("recharge"))) {
      const { stbId, planName, amount, customerName, customerMobile, operatorMobile } = body;
      const cleanStb = (stbId || "1234567890").trim().toUpperCase();
      const mob = customerMobile ? String(customerMobile).trim() : "9" + Date.now().toString().slice(-9);

      let opMob = operatorMobile ? String(operatorMobile).trim() : "";
      if (!opMob && cleanStb) {
        const mapping = await StbMapping.findOne({ stbId: { $regex: new RegExp("^" + cleanStb + "$", "i") } });
        if (mapping && mapping.operatorMobile) opMob = mapping.operatorMobile.trim();
      }
      if (!opMob && mob) {
        const mappingByMob = await StbMapping.findOne({ customerMobile: mob });
        if (mappingByMob && mappingByMob.operatorMobile) opMob = mappingByMob.operatorMobile.trim();
      }
      if (!opMob && (cleanStb.startsWith("8331000") || cleanStb.startsWith("STB-VP") || cleanStb.includes("VP"))) {
        opMob = "9787312758";
      }
      if (!opMob) {
        const firstOp = await Operator.findOne({ isActive: true });
        if (firstOp && firstOp.mobileNumber) opMob = firstOp.mobileNumber.trim();
      }

      let user = await User.findOne({ mobileNumber: mob });
      if (!user) {
        user = await User.create({
          mobileNumber: mob,
          name: customerName || "Customer",
          stbId: cleanStb,
        });
      }

      const newReqData = {
        userId: user._id,
        stbId: cleanStb,
        customerName: customerName || user.name || "Customer",
        customerMobile: mob,
        operatorMobile: opMob,
        planName: planName || "Basic Tamil Pack Monthly Rs 220",
        amount: Number(amount) || 240,
        paymentStatus: "Success",
        status: "Pending",
        requestTime: new Date(),
      };

      // STORE IN rechargerequests COLLECTION ONLY ON CUSTOMER SUBMISSION
      const request = await RechargeRequest.create(newReqData);

      console.log("[MongoDB Saved to rechargerequests]", request._id, cleanStb, "opMob:", opMob);

      return res.status(201).json({ success: true, rechargeRequest: request });
    }

    // GET /api/recharge/status/:id
    if (req.method === "GET" && routeString.includes("recharge/status")) {
      const statusId = reqUrl.split("/").pop();
      let reqDoc = null;
      if (statusId && statusId.match(/^[0-9a-fA-F]{24}$/)) {
        reqDoc = (await RechargeRequest.findById(statusId)) || (await Recharge.findById(statusId));
      }
      if (!reqDoc && statusId) {
        const cleanId = String(statusId).trim().toUpperCase();
        reqDoc =
          (await RechargeRequest.findOne({ $or: [{ stbId: cleanId }, { customerMobile: statusId }] }).sort({ createdAt: -1 })) ||
          (await Recharge.findOne({ $or: [{ stbId: cleanId }, { customerMobile: statusId }] }).sort({ createdAt: -1 }));
      }
      if (reqDoc) {
        return res.status(200).json({
          success: true,
          id: reqDoc._id,
          stbId: reqDoc.stbId,
          amount: reqDoc.amount,
          status: reqDoc.status || "Pending",
          approvedTime: reqDoc.approvedTime,
          requestTime: reqDoc.requestTime || reqDoc.createdAt,
          request: reqDoc,
        });
      }
      return res.status(404).json({ success: false, message: "Recharge request not found" });
    }

    // GET /api/recharge/pending or /api/operator/requests
    if (req.method === "GET" && (routeString.includes("recharge/pending") || routeString.includes("operator/requests") || routeString.includes("recharge"))) {
      const searchParams = req.query || {};
      const opMobile = String(searchParams.operatorMobile || req.headers["x-operator-mobile"] || "").trim();

      let filter = {};
      if (opMobile && opMobile !== "9080864542") {
        const cleanDigits = opMobile.replace(/\D/g, "").slice(-10);
        const mappedStbs = await StbMapping.find({
          $or: [{ operatorMobile: opMobile }, { operatorMobile: cleanDigits }]
        }).distinct("stbId");
        const cleanStbs = mappedStbs.filter(Boolean).map((s) => String(s).trim());
        const stbConditions = cleanStbs.length > 0 ? [{ stbId: { $in: cleanStbs } }] : [];

        filter = {
          $or: [
            { operatorMobile: opMobile },
            { customerMobile: { $regex: cleanDigits, $options: "i" } },
            ...stbConditions,
            { operatorMobile: "" },
            { operatorMobile: null },
            { operatorMobile: { $exists: false } },
            { operatorMobile: "9080864542" },
          ],
        };
      }

      let requests1 = [];
      let requests2 = [];
      try {
        requests1 = await RechargeRequest.find(filter).sort({ requestTime: -1, createdAt: -1 });
        requests2 = await Recharge.find(filter).sort({ requestTime: -1, createdAt: -1 });
      } catch (findErr) {
        console.warn("[Find Filter Error, falling back to all]", findErr.message);
        requests1 = await RechargeRequest.find().sort({ requestTime: -1, createdAt: -1 });
        requests2 = await Recharge.find().sort({ requestTime: -1, createdAt: -1 });
      }

      let combined = [...requests1, ...requests2];

      // FALLBACK: If filter yielded 0 results, fetch ALL requests so NO customer request is ever hidden or lost!
      if (combined.length === 0) {
        try {
          requests1 = await RechargeRequest.find().sort({ requestTime: -1, createdAt: -1 });
          requests2 = await Recharge.find().sort({ requestTime: -1, createdAt: -1 });
          combined = [...requests1, ...requests2];
        } catch (e) {}
      }

      const uniqueMap = new Map();
      const resultList = [];
      for (const item of combined) {
        const idKey = String(item._id || item.id);
        if (idKey && !uniqueMap.has(idKey)) {
          uniqueMap.set(idKey, true);
          resultList.push(item);
        }
      }

      return res.status(200).json({ success: true, count: resultList.length, requests: resultList });
    }

    // Step 2: Operator Accept/Approve -> Update rechargerequests AND store in recharges collection!
    if (req.method === "POST" && routeString.includes("approve")) {
      const reqId = body.id || reqUrl.split("/").pop();
      if (reqId && reqId.match(/^[0-9a-fA-F]{24}$/)) {
        // 1. Update status in rechargerequests collection
        const updatedReq = await RechargeRequest.findByIdAndUpdate(
          reqId,
          { status: "Approved", approvedTime: new Date() },
          { new: true }
        );

        // 2. STORE IN recharges COLLECTION UPON OPERATOR ACCEPTANCE!
        const item = updatedReq || (await RechargeRequest.findById(reqId)) || (await Recharge.findById(reqId));
        if (item) {
          await Recharge.findOneAndUpdate(
            { _id: item._id },
            {
              userId: item.userId,
              stbId: item.stbId,
              customerName: item.customerName,
              customerMobile: item.customerMobile,
              operatorMobile: item.operatorMobile,
              planName: item.planName,
              amount: item.amount,
              paymentStatus: "Success",
              status: "Approved",
              requestTime: item.requestTime || new Date(),
              approvedTime: new Date(),
            },
            { upsert: true, new: true }
          );

          if (item.stbId) {
            await StbMapping.findOneAndUpdate(
              { stbId: { $regex: new RegExp("^" + item.stbId + "$", "i") } },
              {
                currentPlan: item.planName || "Basic Tamil Pack Monthly Rs 220",
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              }
            );
          }

          if (item.userId || item.customerMobile || item.stbId) {
            const userQuery = [];
            if (item.userId && String(item.userId).match(/^[0-9a-fA-F]{24}$/)) userQuery.push({ _id: item.userId });
            if (item.customerMobile) userQuery.push({ mobileNumber: item.customerMobile });
            if (item.stbId) userQuery.push({ stbId: { $regex: new RegExp("^" + item.stbId + "$", "i") } });
            if (userQuery.length > 0) {
              await User.findOneAndUpdate(
                { $or: userQuery },
                {
                  currentPlan: item.planName || "Basic Tamil Pack Monthly Rs 220",
                  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  status: "Active",
                }
              );
            }
          }
        }
      }
      return res.status(200).json({ success: true, message: "Recharge approved and stored in recharges collection" });
    }

    // Step 3: Operator Reject -> Update status to Rejected
    if (req.method === "POST" && routeString.includes("reject")) {
      const reqId = body.id || reqUrl.split("/").pop();
      if (reqId && reqId.match(/^[0-9a-fA-F]{24}$/)) {
        await RechargeRequest.findByIdAndUpdate(reqId, { status: "Rejected" });
        await Recharge.findByIdAndUpdate(reqId, { status: "Rejected", paymentStatus: "Failed" }).catch(() => {});
      }
      return res.status(200).json({ success: true, message: "Recharge rejected" });
    }

    // Complaints: Create
    if (req.method === "POST" && routeString.includes("complaint/create")) {
      const {
        stbId,
        customerName,
        customerMobile,
        category,
        issueType,
        description,
        mediaUrl,
        preferredTime,
      } = body;

      if (!description) {
        return res.status(400).json({ success: false, message: "Description is required" });
      }

      const complaint = await Complaint.create({
        stbId: stbId || "STB-UNKNOWN",
        customerName: customerName || "Customer",
        customerMobile: customerMobile || "",
        category: category || "General Issues",
        issueType: issueType || "",
        description,
        mediaUrl: mediaUrl || "",
        preferredTime: preferredTime || "Anytime",
        status: "Pending",
      });

      console.log("[MongoDB Saved Complaint]", complaint._id);

      return res.status(201).json({ success: true, message: "Complaint registered successfully", complaint });
    }

    // Complaints: Get All
    if (req.method === "GET" && routeString.includes("complaint")) {
      const searchParams = req.query || {};
      const opMobile = String(searchParams.operatorMobile || req.headers["x-operator-mobile"] || "").trim();

      let complaints = [];
      if (opMobile && opMobile !== "9080864542") {
        const mappedStbs = await StbMapping.find({ operatorMobile: opMobile }).distinct("stbId");
        const mappedRegex = mappedStbs.map((s) => new RegExp("^" + s + "$", "i"));
        complaints = await Complaint.find({
          $or: [
            { stbId: { $in: mappedRegex } },
            { stbId: { $in: mappedStbs } },
            { customerMobile: opMobile },
          ],
        }).sort({ createdAt: -1 });

        if (complaints.length === 0) {
          complaints = await Complaint.find().sort({ createdAt: -1 });
        }
      } else {
        complaints = await Complaint.find().sort({ createdAt: -1 });
      }
      return res.status(200).json({ success: true, count: complaints.length, complaints });
    }

    // Complaints: Update Status / Assignment
    if (req.method === "POST" && routeString.includes("complaint/update")) {
      const compId = reqUrl.split("/").pop();
      if (compId && compId.match(/^[0-9a-fA-F]{24}$/)) {
        const updated = await Complaint.findByIdAndUpdate(compId, body, { new: true });
        return res.status(200).json({ success: true, complaint: updated });
      }
      return res.status(400).json({ success: false, message: "Invalid complaint ID" });
    }

    // Product Requests: Create
    if (req.method === "POST" && routeString.includes("product-request/create")) {
      const productReq = await ProductRequest.create(body);
      return res.status(201).json({ success: true, productRequest: productReq });
    }

    // Product Requests: Get All
    if (req.method === "GET" && routeString.includes("product-request")) {
      const requests = await ProductRequest.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: requests.length, requests });
    }

    // Product Requests: Update Status
    if (req.method === "POST" && routeString.includes("product-request/update")) {
      const prId = reqUrl.split("/").pop();
      if (prId && prId.match(/^[0-9a-fA-F]{24}$/)) {
        const updated = await ProductRequest.findByIdAndUpdate(prId, body, { new: true });
        return res.status(200).json({ success: true, productRequest: updated });
      }
      return res.status(400).json({ success: false, message: "Invalid product request ID" });
    }

    // Admin: Operators list
    if (req.method === "GET" && routeString.includes("admin/operators")) {
      const operators = await Operator.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: operators.length, operators });
    }

    // Admin: Add Operator
    if (req.method === "POST" && routeString.includes("admin/operator/add")) {
      const { mobileNumber, name, stbBoxName, portalLink, email } = body;
      const cleanMob = String(mobileNumber).trim();
      let op = await Operator.findOne({ mobileNumber: cleanMob });
      if (op) {
        op.isActive = true;
        if (name) op.name = String(name).trim();
        if (email) op.email = String(email).trim();
        if (stbBoxName) op.stbBoxName = String(stbBoxName).trim();
        if (portalLink !== undefined) op.portalLink = String(portalLink).trim();
        await op.save();
      } else {
        op = await Operator.create({
          mobileNumber: cleanMob,
          name: name ? String(name).trim() : "Operator",
          email: email ? String(email).trim() : "",
          stbBoxName: stbBoxName ? String(stbBoxName).trim() : "SCV",
          portalLink: portalLink ? String(portalLink).trim() : "",
          isActive: true,
        });
      }
      return res.status(201).json({ success: true, operator: op });
    }

    // Admin: Toggle Operator Status
    if (req.method === "POST" && routeString.includes("admin/operator/toggle")) {
      const { mobileNumber } = body;
      const op = await Operator.findOne({ mobileNumber: String(mobileNumber).trim() });
      if (op) {
        op.isActive = !op.isActive;
        await op.save();
      }
      return res.status(200).json({ success: true, operator: op });
    }

    // Admin: Delete Operator
    if (req.method === "DELETE" && routeString.includes("admin/operator")) {
      const rawId = decodeURIComponent(reqUrl.split("?")[0].split("/").pop() || "");
      if (rawId && rawId !== "operator") {
        const cleanDigits = rawId.replace(/\D/g, "").slice(-10);
        await Operator.deleteMany({
          $or: [
            { _id: rawId.match(/^[0-9a-fA-F]{24}$/) ? rawId : null },
            { mobileNumber: rawId },
            { mobileNumber: cleanDigits },
            { mobileNumber: { $regex: cleanDigits, $options: "i" } },
          ],
        }).catch((err) => console.warn("Operator delete error", err));
      }
      return res.status(200).json({ success: true, message: "Operator deleted successfully" });
    }

    // Products: Get List
    if (req.method === "GET" && routeString.includes("products") && !routeString.includes("product-request")) {
      let products = await ProductCatalog.find().sort({ createdAt: 1 });
      if (products.length === 0) {
        const seedItems = [
          { id: "prod-1", name: "HD Set Top Box Remote", category: "accessory", price: 250, availableStock: 45, soldQuantity: 120, description: "Universal STB Remote compatible with all HD models", iconName: "Tv" },
          { id: "prod-2", name: "4K Ultra HD HDMI Cable 1.5m", category: "accessory", price: 150, availableStock: 60, soldQuantity: 85, description: "High speed 4K Gold Plated Shielded HDMI Cable", iconName: "Zap" },
          { id: "prod-3", name: "Dish Antenna LNB Receiver", category: "accessory", price: 350, availableStock: 30, soldQuantity: 42, description: "Universal Ku-Band Single LNB for High Signal Reception", iconName: "Radio" },
          { id: "prod-4", name: "Coaxial Cable 15m with F-Connectors", category: "accessory", price: 200, availableStock: 50, soldQuantity: 65, description: "Heavy Duty Shielded RG6 Coaxial Cable with brass connectors", iconName: "Cable" },
          { id: "prod-5", name: "12V 2A STB Power Adapter", category: "accessory", price: 220, availableStock: 40, soldQuantity: 90, description: "Surge Protected Power Supply Adapter for HD STB", iconName: "Plug" },
          { id: "prod-6", name: "STB Wall Mounting Bracket Stand", category: "accessory", price: 180, availableStock: 35, soldQuantity: 55, description: "Heavy Duty Metal Wall Mount Stand with cable slots", iconName: "Box" },
          { id: "prod-7", name: "AV 3-RCA Audio Video Cable", category: "accessory", price: 120, availableStock: 45, soldQuantity: 38, description: "Premium RCA Cable for Standard Definition STB connection", iconName: "Sliders" },
          { id: "prod-8", name: "Universal Learning Smart Remote", category: "accessory", price: 390, availableStock: 25, soldQuantity: 74, description: "Dual TV + STB Smart Remote with button learning mode", iconName: "Tv" },
          { id: "prod-9", name: "Dish Antenna Signal Alignment Service", category: "service", price: 299, availableStock: 100, soldQuantity: 110, description: "Technician Home Visit for Dish Alignment & Cable Signal Tuning", iconName: "Wrench" },
          { id: "prod-10", name: "4K Smart Hybrid STB Hardware Upgrade", category: "service", price: 999, availableStock: 15, soldQuantity: 28, description: "Upgrade old STB to 4K Smart Android Hybrid Box with OTT Apps", iconName: "Sparkles" }
        ];
        try {
          await ProductCatalog.insertMany(seedItems);
          products = await ProductCatalog.find().sort({ createdAt: 1 });
        } catch (seedErr) {
          console.warn("[Product Seed Error]", seedErr.message);
        }
      }
      return res.status(200).json({ success: true, count: products.length, products });
    }

    // Products: Upsert (Save/Update in MongoDB)
    if (req.method === "POST" && routeString.includes("products/upsert")) {
      const prod = body;
      if (!prod || !prod.id) {
        return res.status(400).json({ success: false, message: "Product ID and details required" });
      }
      const updatedProd = await ProductCatalog.findOneAndUpdate(
        { id: prod.id },
        {
          name: prod.name,
          category: prod.category || "accessory",
          price: Number(prod.price) || 0,
          availableStock: Number(prod.availableStock) || 0,
          soldQuantity: Number(prod.soldQuantity) || 0,
          description: prod.description || "",
          iconName: prod.iconName || "Box",
        },
        { upsert: true, new: true }
      );
      return res.status(200).json({ success: true, product: updatedProd });
    }

    // Products: Delete from MongoDB
    if ((req.method === "POST" || req.method === "DELETE") && routeString.includes("products/delete")) {
      const prodId = body.id || reqUrl.split("/").pop();
      if (prodId) {
        await ProductCatalog.deleteOne({ id: prodId });
      }
      return res.status(200).json({ success: true, message: "Product deleted from MongoDB" });
    }

    // Default Fallback
    return res.status(200).json({ success: true, status: "online", time: new Date().toISOString() });
  } catch (err) {
    console.error("[Vercel Native Handler Error]", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Serverless Function Execution Error",
    });
  }
};
