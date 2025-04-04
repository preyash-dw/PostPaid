
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const multer = require("multer");
const xlsx = require("xlsx");
const cors = require("cors");
const compression = require("compression");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

  const DataSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    previousStatus: { type: String, default: null },
    submissionDate: { type: Date, default: Date.now, index: true },
    batchId: { type: Number, required: true, index: true }, 
    excelOrder: { type: Number, required: true, index: true },
  }, { timestamps: true });
  
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
    const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });

    if (jsonData.length === 0) {
      return res.status(400).json({ message: "Excel file is empty!" });
    }

    const bulkOps = [];
    const batchId = Date.now(); // Unique identifier for this upload
    const today = new Date();

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row.Number) continue;

      let extractedType = row.status?.trim() || row.Status?.trim() || "Standard";
      let extractedStatus = String(row.REMARKS ?? "").trim();

      if (extractedStatus.toLowerCase() === "booked") {
        extractedStatus = "Booked";
      } else if (!extractedStatus) {
        extractedStatus = today.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      } else {
        const parsedDate = new Date(extractedStatus);
        if (!isNaN(parsedDate)) {
          extractedStatus = parsedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        }
      }

      extractedType = extractedType.toLowerCase().split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const submissionDate = new Date(); // Capture time of upload

      bulkOps.push({
        updateOne: {
          filter: { number: row.Number },
          update: {
            $set: {
              number: row.Number,
              type: extractedType,
              status: extractedStatus,
              submissionDate,
              batchId,
              excelOrder: i + 1, // ✅ Maintain Excel row order
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      for (let i = 0; i < bulkOps.length; i += 500) {
        await DataModel.bulkWrite(bulkOps.slice(i, i + 500), { ordered: false });
      }
    } else {
      return res.status(400).json({ message: "No valid rows found in the file" });
    }

    io.emit("dataUpdated");
    res.status(200).json({ message: `✅ Successfully uploaded ${bulkOps.length} records!` });

  } catch (err) {
    console.error("Upload Error:", err);
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
    const { page = 1, limit = 50, type, search, startWith, status=" "} = req.query;
    const query = {};

    if (type) {
      query.type = { $in: type.split(",").filter((t) => t.trim()) };
    }

    if (startWith && search) {
      query.number = { 
        $regex: `^${startWith}.*${search}`, 
        $options: "i" 
      };
    } else if (startWith) {
      query.number = new RegExp(`^${startWith}`, "i");
    } else if (search) {
      query.number = new RegExp(search, "i");
    }

    if (status?.trim()) {
      query.status = status;
    }

    const total = await DataModel.countDocuments(query);
    const data = await DataModel.find(query, { number: 1, type: 1, status: 1, submissionDate: 1 })
    .sort({ batchId: -1, excelOrder: -1 }) // ✅ First by batchId (latest file), then by excelOrder (row order)
    .skip((page - 1) * Number(limit))
    .limit(Number(limit));
  

    res.status(200).json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.put("/api/data/:id", async (req, res) => {
  try {
    const { type, status } = req.body;

    if (!type) {
      return res.status(400).json({ message: "Type is required" });
    }

    const data = await DataModel.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Data not found" });
    }

    // ✅ Check if status is empty or cleared
    let newStatus = status?.trim();
    if (!newStatus) {
      newStatus = data.previousStatus || data.status; // Restore previous status if empty
    } else {
      data.previousStatus = data.status; // Store current status as previous
    }

    // ✅ Update the data
    data.type = type;
    data.status = newStatus;

    await data.save();

    io.emit("dataUpdated");
    res.status(200).json({ message: "✅ Data updated successfully", data });
  } catch (err) {
    console.error("Update Error:", err);
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

app.post("/api/delete-from-excel", upload.single("file"), async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });

    if (jsonData.length === 0) {
      return res.status(400).json({ message: "Excel file is empty!" });
    }

    // Extract numbers from the "Number" column
    const numbersToDelete = jsonData
      .map(row => String(row.Number).trim())
      .filter(num => num.length > 0);

    if (numbersToDelete.length === 0) {
      return res.status(400).json({ message: "No valid numbers found in the file" });
    }


    // Delete all matching records
    const deleteResult = await DataModel.deleteMany({ number: { $in: numbersToDelete } });

    if (deleteResult.deletedCount > 0) {
      io.emit("dataUpdated");
      return res.status(200).json({ message: `✅ Successfully deleted ${deleteResult.deletedCount} records!` });
    } else {
      return res.status(404).json({ message: "No matching records found for deletion." });
    }

  } catch (err) {
    console.error("Delete from Excel Error:", err);
    res.status(500).json({ message: "❌ Error processing file.", error: err.message });
  }
});





const collectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  image: { type: String, required: true } // Accepts URL from frontend
});
const CollectionModel = mongoose.model("Collection", collectionSchema);

// Function to capitalize the first letter of each word
const capitalizeWords = (text) => {
  return text
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};


app.get("/api/collections/titles", async (req, res) => {
  try {
    const titles = await CollectionModel.find({}, "title"); // Only fetch titles using projection
    res.status(200).json(titles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// 🟢 **POST: Store Collection Data**
app.post("/api/collections", async (req, res) => {
  try {
    let { title, description, image } = req.body;

    // Validate input fields
    if (!title || !description || !image) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Capitalize each word in title
    title = capitalizeWords(title);

    // Check if a collection with the same title already exists
    const existingCollection = await CollectionModel.findOne({ title });
    if (existingCollection) {
      return res.status(400).json({ message: "❌ A collection with this title already exists" });
    }

    // Store new collection
    const newCollection = new CollectionModel({ title, description, image });
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
    let { title, description, image } = req.body;

    // Validate input fields
    if (!title || !description || !image) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Capitalize each word in title
    title = capitalizeWords(title);

    // Find and update collection
    const updatedCollection = await CollectionModel.findByIdAndUpdate(
      id,
      { title, description, image },
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


const planSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  features: [
    {
      heading: { type: String, required: true },
      description: { type: String, required: true },
    },
  ],
  promotions: [
    {
      type: String, // Simple string array for promotions
    },
  ],
  type: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const Plan = mongoose.model("Plan", planSchema);

// 🟢 Create a new plan
app.post("/api/plans", async (req, res) => {
  try {
    const { title, features, promotions, type, price } = req.body;

    if (!title || !type || !price) {
      return res.status(400).json({ message: "Title, Type, and Price are required" });
    }

    const newPlan = new Plan({ title, features, promotions, type, price });
    await newPlan.save();
    io.emit("collectionUpdated");
    res.status(201).json({ message: "Plan created successfully", data: newPlan });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 🟢 Get all plans
app.get("/api/plans", async (req, res) => {
  try {
    const plans = await Plan.find();
    res.json({ data: plans });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 🟢 Get a single plan by ID
app.get("/api/plans/type/:type", async (req, res) => {
  try {
    const plans = await Plan.find({ type: req.params.type });

    if (plans.length === 0) {
      return res.status(404).json({ message: "No plans found for this type" });
    }

    res.json({ data: plans });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// 🟢 Update a plan
app.put("/api/plans/:id", async (req, res) => {
  try {
    const { title, features, promotions, type, price } = req.body;

    const updatedPlan = await Plan.findByIdAndUpdate(
      req.params.id,
      { title, features, promotions, type, price },
      { new: true }
    );

    if (!updatedPlan) return res.status(404).json({ message: "Plan not found" });
    io.emit("collectionUpdated");
    res.json({ message: "Plan updated successfully", data: updatedPlan });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 🟢 Delete a plan
app.delete("/api/plans/:id", async (req, res) => {
  try {
    const deletedPlan = await Plan.findByIdAndDelete(req.params.id);
    if (!deletedPlan) return res.status(404).json({ message: "Plan not found" });
    io.emit("collectionUpdated");
    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Generate JWT
userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, 'your_secret_key', { expiresIn: '1h' });
};

const User = mongoose.model('User', userSchema);


app.post('/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = user.generateToken();
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user
    const newUser = new User({ name, email, password });

    // Save the user to the database
    await newUser.save();

    // Generate a token
    const token = newUser.generateToken();

    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Start Server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
