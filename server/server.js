import dotenv from "dotenv";
import app from "./api/index.js"; // 👈 FIX: index.js se app ko import karna lazmi tha!
import { initReportJob } from "./jobs/reportJob.js";

dotenv.config();

// Start Cron Jobs
initReportJob();

// Dynamic Port for Render
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running successfully on port ${PORT} 🚀`);
});