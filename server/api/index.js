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

// 1. MIDDLEWARES (CORS ka mukammal hal)
app.use(cors({
  origin: "*", // 👈 FIX: Kisi bhi frontend URL se request block nahi hogi!
  credentials: true
}));

app.options('*', cors()); // Enable pre-flight across-the-board

app.use(express.json()); // Sabse pehle JSON parser
app.use(express.urlencoded({ extended: true }));

// 3. ROUTES
app.use("/api/tasks", taskRoutes);
app.use("/tasks", taskRoutes);

app.use("/api/comments", commentRoutes);
app.use("/comments", commentRoutes);

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);

app.use("/api/sales", salesRoutes);
app.use("/sales", salesRoutes);

app.use("/api/activities", activityRoutes);
app.use("/activities", activityRoutes);

app.use("/api/targets", targetRoutes);
app.use("/targets", targetRoutes);

app.use("/api/leads", leadRoutes);
app.use("/leads", leadRoutes);

app.use("/api/projects", projectRoutes);
app.use("/projects", projectRoutes);

app.use("/api/files", fileroutes);
app.use("/files", fileroutes);

app.use("/api/reports", reportRoutes);
app.use("/reports", reportRoutes);

app.use("/api/lead-payments", leadPaymentRoutes);
app.use("/lead-payments", leadPaymentRoutes);

// 4. HEALTH CHECK
app.get("/", (req, res) => {
  res.status(200).json({ 
    success: true, 
    status: "Online",
    message: "CRM API is running smoothly 🚀" 
  });
});

// 5. ERROR HANDLING
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({ success: false, message: "Something went wrong internally!" });
});

export default app;