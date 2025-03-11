
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const multer = require("multer");
const xlsx = require("xlsx");
const cors = require("cors");
const compression = require("compression");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
  transports: ["websocket", "polling"],
});

app.use(compression()); // 🟢 Enable response compression
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "https://postpaid-phi.vercel.app",
  "http://localhost:3000",
  "https://genialemarketing.in",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, 
}));

// ✅ Optimized MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Optimized Schema with Indexes
const DataSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, index: true },
  status: { type: String, required: true, index: true },
  submissionDate: { type: Date, default: Date.now, index: true },
});

const DataModel = mongoose.model("Data", DataSchema);

// ✅ Use Memory Storage Instead of Disk Storage
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB Limit

// ✅ Optimized Upload & Process Excel File
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const stream = xlsx.stream.to_json(workbook.Sheets[sheetName], { raw: false });

    const bulkOps = [];
    const today = new Date();
    const formattedToday = today.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

    stream.on("data", (row) => {
      if (!row.Number) return;

      let extractedType = row.status?.trim() || row.Status?.trim() || "Standard";
      let extractedStatus = String(row.REMARKS ?? "").trim();

      if (extractedStatus.toLowerCase() === "booked") {
        extractedStatus = "Booked";
      } else if (!extractedStatus) {
        extractedStatus = formattedToday;
      } else {
        const parsedDate = new Date(extractedStatus);
        if (!isNaN(parsedDate)) {
          extractedStatus = parsedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        }
      }

      extractedType = extractedType.toLowerCase().split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      bulkOps.push({
        updateOne: {
          filter: { number: row.Number },
          update: { $set: { number: row.Number, type: extractedType, status: extractedStatus, submissionDate: today } },
          upsert: true,
        },
      });
    });

    stream.on("end", async () => {
      await DataModel.bulkWrite(bulkOps, { ordered: false }); // ✅ Faster Inserts
      io.emit("dataUpdated");
      res.status(200).json({ message: "✅ Data uploaded successfully!" });
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Fetch Initial Data
app.get("/api/data/initial", async (req, res) => {
  try {
    const data = await DataModel.find().sort({ submissionDate: -1 }).limit(50);
    res.status(200).json({ data, total: 50 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Optimized Paginated Data Fetch
app.get("/api/data", async (req, res) => {
  try {
    const { page = 1, limit = 50, type, search, startWith, date } = req.query;
    const query = {};

    if (type) {
      query.type = { $in: type.split(",").filter((t) => t.trim()) };
    }
    if (startWith) query.number = new RegExp(`^${startWith}`, "i");
    if (search) query.number = { $regex: `^${search}`, $options: "i" };

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.submissionDate = { $gte: startDate, $lte: endDate };
    }

    const total = await DataModel.countDocuments(query);
    const data = await DataModel.find(query, { number: 1, type: 1, status: 1, submissionDate: 1 }) // ✅ Optimized Projection
      .sort({ submissionDate: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update Status
app.put("/api/data/:id", async (req, res) => {
  try {
    const { type, status } = req.body;
    if (!type || !status) return res.status(400).json({ message: "Type and Status are required" });

    const updatedData = await DataModel.findByIdAndUpdate(req.params.id, { type, status }, { new: true });

    if (!updatedData) return res.status(404).json({ message: "Data not found" });

    io.emit("dataUpdated");
    res.status(200).json({ message: "✅ Data updated successfully", data: updatedData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Bulk Delete
app.post("/api/data/bulk-delete", async (req, res) => {
  try {
    await DataModel.deleteMany({ _id: { $in: req.body.ids } });
    io.emit("dataUpdated");
    res.json({ message: "✅ Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting records" });
  }
});
// ✅ Delete Single Record
app.delete("/api/data/:id", async (req, res) => {
  try {
    const deletedData = await DataModel.findByIdAndDelete(req.params.id);
    if (!deletedData) {
      return res.status(404).json({ message: "Data not found" });
    }

    io.emit("dataUpdated");
    res.status(200).json({ message: "✅ Data deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: "❌ Error deleting data.", error: err.message });
  }
});






const CollectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  image: { type: String, required: true }, // Accepts URL from frontend
  price: { type: Number, required: true, min: 0 },
  features: { type: [String], required: true },
});

const CollectionModel = mongoose.model("Collection", CollectionSchema);

// 🟢 **POST: Store Collection Data**
app.post("/api/collections", async (req, res) => {
  try {
    let { title, description, image, price, features } = req.body;

    // Validate input fields
    if (!title || !description || !image || !price || !Array.isArray(features) || features.length === 0) {
      return res.status(400).json({ message: "All fields are required & features must be an array" });
    }

    // Ensure price is a valid number
    price = parseFloat(price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ message: "Invalid price value" });
    }

    const newCollection = new CollectionModel({ title, description, image, price, features });
    await newCollection.save();
    io.emit("collectionUpdated");
    res.status(201).json({ message: "✅ Collection item stored!", data: newCollection });
    
  } catch (error) {
    res.status(500).json({ message: "❌ Error storing collection", error: error.message });
  }
});

// 🟢 **GET: Fetch Stored Collections**
app.get("/api/collections", async (req, res) => {
  try {
    const collections = await CollectionModel.find().sort({ _id: -1 });
    res.status(200).json({ data: collections });
  } catch (error) {
    res.status(500).json({ message: "❌ Error fetching collections", error: error.message });
  }
});

// 🟢 **PUT: Update Collection Data**
app.put("/api/collections/:id", async (req, res) => {
  try {

    const { id } = req.params;
    const { title, description, image, price, features } = req.body;

    // Validate input fields
    if (!title || !description || !image || !price || !Array.isArray(features) || features.length === 0) {
      return res.status(400).json({ message: "All fields are required & features must be an array" });
    }

    // Ensure price is a valid number
    const updatedPrice = parseFloat(price);
    if (isNaN(updatedPrice) || updatedPrice < 0) {
      return res.status(400).json({ message: "Invalid price value" });
    }

    // Find and update collection
    const updatedCollection = await CollectionModel.findByIdAndUpdate(
      id,
      { title, description, image, price: updatedPrice, features },
      { new: true, runValidators: true }
    );

    if (!updatedCollection) {
      return res.status(404).json({ message: "❌ Collection not found" });
    }

    io.emit("collectionUpdated");

    res.status(200).json({ message: "✅ Collection updated successfully!", data: updatedCollection });
  } catch (error) {
    res.status(500).json({ message: "❌ Error updating collection", error: error.message });
  }
});


// 🟢 **DELETE: Remove Collection**
app.delete("/api/collections/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCollection = await CollectionModel.findByIdAndDelete(id);

    if (!deletedCollection) {
      return res.status(404).json({ message: "❌ Collection not found" });
    }

    io.emit("collectionUpdated");

    res.status(200).json({ message: "✅ Collection deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "❌ Error deleting collection", error: error.message });
  }
});




// Start Server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
