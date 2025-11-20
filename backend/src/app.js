const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const leadsRoutes = require("./routes/leadsRoutes");
const exportRoutes = require("./routes/exportRoutes");
const bulkUploadRoutes = require("./routes/bulkUploadRoutes");
const courseRoutes = require("./routes/courseRoutes");
const subCourseRoutes = require("./routes/subCourseRoutes");
const filterRoutes = require("./routes/filterRoutes");
const commentRoutes = require("./routes/commentRoutes");
const trainerRoutes = require("./routes/trainerRoutes");
const assigneeRoutes = require("./routes/assigneeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const userRoutes = require("./routes/usersRoutes");
const metaRoutes = require("./routes/metaRoutes");

require("dotenv").config();

const app = express();

// Middleware
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
];
const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Routes
app.use("/auth", authRoutes);
app.use("/leads", leadsRoutes);
app.use("/api", paymentRoutes);
app.use("/exportLeads", exportRoutes);
app.use("/leads/bulk-upload", bulkUploadRoutes);
app.use("/courses", courseRoutes);
app.use("/api/sub-courses", subCourseRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/", filterRoutes);
app.use("/", commentRoutes);
app.use("/api/assignees", assigneeRoutes);
app.use("/api", userRoutes);
app.use("/api/meta-campaigns", metaRoutes);

module.exports = app;
