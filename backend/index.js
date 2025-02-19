require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const multer = require("multer");
const xlsx = require("xlsx");
const cors = require("cors");

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

app.use(express.json({ limit: "20mb" })); // Increase JSON payload limit
app.use(express.urlencoded({ extended: true }));

// Middleware for CORS
const allowedOrigins = [
  "https://postpaid-theta.vercel.app", // Your frontend on Vercel
  "http://localhost:3000", // For local development
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
  credentials: true, // Allow cookies and auth headers
}));


// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Define Mongoose Schema
const DataSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true },
  status: { type: String, required: true }, // "Booked" or date
  submissionDate: { type: Date, default: Date.now, index: true },
});

const DataModel = mongoose.model("Data", DataSchema);

// ✅ Use Memory Storage Instead of Disk Storage
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB Limit

// 🟢 Upload & Process Excel File
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store"); // Avoid caching issues
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { type } = req.body;
    if (!type) return res.status(400).json({ message: "Type is required" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const excelData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!excelData.every((row) => row.Number)) {
      throw new Error("Excel file must have a 'Number' column");
    }

    const numbers = excelData.map((row) => row.Number);
    const existingRecords = await DataModel.find({ number: { $in: numbers } }).lean();
    const existingMap = new Map(existingRecords.map((doc) => [doc.number, doc.status]));

    const bulkOps = excelData.map((row) => {
      const existingStatus = existingMap.get(row.Number);
      const newStatus = row.Status?.trim() || existingStatus || new Date();

      return {
        updateOne: {
          filter: { number: row.Number },
          update: {
            $set: {
              number: row.Number,
              type,
              status: newStatus,
              submissionDate: new Date(),
            },
          },
          upsert: true,
        },
      };
    });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await DataModel.bulkWrite(bulkOps, { session });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    io.emit("dataUpdated");
    res.status(200).json({ message: "✅ Data uploaded successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 🟢 Fetch Paginated Data
app.get("/api/data", async (req, res) => {
  try {
    const { page = 1, limit = 50, type, search, startWith, date } = req.query;
    const query = {};

    // Handle multiple selected types
    if (type) {
      const typeArray = type.split(",").filter((t) => t.trim());
      if (typeArray.length) query.type = { $in: typeArray };
    }

    // Filter by startWith or search
    if (startWith) {
      query.number = new RegExp(`^${startWith}`, "i");
    }
    if (search) {
      query.number = new RegExp(search, "i");
    }

    if (startWith && search) {
      query.number = { $regex: `^${startWith}.*${search}`, $options: "i" };
    }

    // ✅ Apply Date Filter
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.submissionDate = { $gte: startDate, $lte: endDate };
    }

    const total = await DataModel.countDocuments(query);
    const data = await DataModel.find(query)
      .sort({ submissionDate: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟢 Update Status
app.put("/api/data/:id", async (req, res) => {
  try {
    const { type, status } = req.body;
    if (!type || !status) return res.status(400).json({ message: "Type and Status are required" });

    const updatedData = await DataModel.findByIdAndUpdate(
      req.params.id,
      { type, status },
      { new: true }
    );

    if (!updatedData) return res.status(404).json({ message: "Data not found" });

    io.emit("dataUpdated");
    res.status(200).json({ message: "✅ Data updated successfully", data: updatedData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟢 Delete Record
app.delete("/api/data/:id", async (req, res) => {
  try {
    const deletedData = await DataModel.findByIdAndDelete(req.params.id);
    if (!deletedData) return res.status(404).json({ message: "Data not found" });

    io.emit("dataUpdated");
    res.status(200).json({ message: "✅ Data deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
