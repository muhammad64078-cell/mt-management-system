import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// ROUTES - Check path: ../ means go back one folder
import authRoutes from "../routes/auth.js";
import salesRoutes from "../routes/sales.js";
import leadRoutes from "../routes/leadsroutes.js";
import activityRoutes from "../routes/activityroutes.js";
import targetRoutes from "../routes/targetRoutes.js";
import adminRoutes from "../routes/admin.js";
import projectRoutes from "../routes/projectRoutes.js";
import fileroutes from "../routes/fileroutes.js";
import reportRoutes from "../routes/reports.js";
import leadPaymentRoutes from "../routes/leadpayment.js";
import taskRoutes from "../routes/task.js";
import commentRoutes from "../routes/comment.js";

dotenv.config();
const app = express();

// 1. MIDDLEWARES
app.use(express.json()); // Sabse pehle JSON parser
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = [
  "http://localhost:5173", // Local development
  "http://localhost:3000"  // Alternative local development port
];


app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow local development and any Vercel deployment
    const isAllowed = allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app');
    
    if (!isAllowed) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

// Pre-flight requests ko handle karne ke liye
app.options("*", cors());


// 3. ROUTES

app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/targets", targetRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/files", fileroutes);
app.use("/api/reports", reportRoutes);
app.use("/api/lead-payments", leadPaymentRoutes);

// 4. HEALTH CHECK
app.get("/", (req, res) => {
  res.status(200).json({ 
    success: true, 
    status: "Online",
    message: "CRM API is running smoothly 🚀" 
  });
});

// 5. ERROR HANDLING (Ye zaroor add karein taake crash na ho)
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({ success: false, message: "Something went wrong internaly!" });
});

export default app;