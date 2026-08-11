const Product = require("../models/Product");

// Seed default products helper
const DEFAULT_PRODUCTS = [
  {
    name: "HD Set Top Box Remote",
    price: 250,
    description: "Universal STB Remote compatible with all HD models",
    availableStock: 45,
  },
  {
    name: "4K Ultra HD HDMI Cable 1.5m",
    price: 150,
    description: "High speed 4K Gold Plated Shielded HDMI Cable",
    availableStock: 60,
  },
  {
    name: "Dish Antenna LNB Receiver",
    price: 350,
    description: "Universal Ku-Band Single LNB for High Signal Reception",
    availableStock: 30,
  },
  {
    name: "Coaxial Cable 15m with F-Connectors",
    price: 200,
    description: "Heavy Duty Shielded RG6 Coaxial Cable with brass connectors",
    availableStock: 50,
  },
  {
    name: "12V 2A STB Power Adapter",
    price: 220,
    description: "Surge Protected Power Supply Adapter for HD STB",
    availableStock: 40,
  },
  {
    name: "STB Wall Mounting Bracket Stand",
    price: 180,
    description: "Heavy Duty Metal Wall Mount Stand with cable slots",
    availableStock: 35,
  },
  {
    name: "AV 3-RCA Audio Video Cable",
    price: 120,
    description: "Premium RCA Cable for Standard Definition STB connection",
    availableStock: 45,
  },
  {
    name: "Universal Learning Smart Remote",
    price: 390,
    description: "Dual TV + STB Smart Remote with button learning mode",
    availableStock: 25,
  },
  {
    name: "Dish Antenna Signal Alignment Service",
    price: 299,
    description: "Technician Home Visit for Dish Alignment & Cable Signal Tuning",
    availableStock: 100,
  },
  {
    name: "4K Smart Hybrid STB Hardware Upgrade",
    price: 999,
    description: "Upgrade old STB to 4K Smart Android Hybrid Box with OTT Apps",
    availableStock: 15,
  },
];

// @desc Get All Products
// @route GET /api/products
const getProducts = async (req, res) => {
  try {
    let products = await Product.find();
    if (products.length === 0) {
      products = await Product.insertMany(DEFAULT_PRODUCTS);
    }
    return res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
};
