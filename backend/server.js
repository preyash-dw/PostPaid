require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const multer = require("multer");
const xlsx = require("xlsx");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(express.json());
app.use(cors());

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

// Multer Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB Limit

// 🟢 Upload & Process Excel File
// 🟢 Upload & Process Excel File
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const { type } = req.body;
  if (!type) return res.status(400).json({ message: "Type is required" });

  const filePath = req.file.path;

  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const excelData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Validate required fields
    if (!excelData.every((row) => row.Number)) {
      throw new Error("Excel file must have 'Number' column");
    }

    // Fetch existing records in bulk to check status
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
              submissionDate: new Date() 
            } 
          },
          upsert: true,
        },
      };
    });

    // Bulk Insert with Transaction
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
  } finally {
    fs.unlink(filePath, (err) => {
      if (err) console.error("❌ Failed to delete file:", err);
    });
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

    // If `startWith` is provided, find numbers that start with it
    if (startWith) {
      query.number = new RegExp(`^${startWith}`, "i"); // Matches numbers starting with input
    }

    // If `search` is provided, find numbers that contain it
    if (search) {
      query.number = new RegExp(search, "i"); // Matches numbers containing input
    }

    // If both `startWith` and `search` are provided, refine the query
    if (startWith && search) {
      query.number = { $regex: `^${startWith}.*${search}`, $options: "i" };
    }

    // ✅ Apply Date Filter (Ensure filtering by selected date)
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999); // Get the full day range
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




// 🟢 Update Status of a Record
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

// 🟢 Delete a Record
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

// 🟢 Handle Socket.IO Connections
io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
