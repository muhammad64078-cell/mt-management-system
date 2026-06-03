import express from "express";
import { supabase } from "../config/supabaseClient.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { getTeamReport, getChartData } from "../controller/admincontroller.js";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";

const router = express.Router();

/**
 * 🟢 USERS LIST
 */
router.get("/users", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, status')
      .neq('status', 'deleted');

    if (error) throw error;
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * 🟡 DASHBOARD STATS
 */
router.get("/dashboard-stats", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    // 1. Users fetch karein roles ke liye (optional count)
    const { data: users, error: userError } = await supabase.from('users').select('role').neq('status', 'deleted');
    
    // 2. Leads fetch karein stats ke liye
    const { data: leads, error: leadError } = await supabase.from('leads').select('status, budget');

    // 3. Activities fetch karein (Sirf wo jo dismissed nahi hain)
    // Note: Humein explicit join !activities_created_by_fkey dena hoga
    const { data: activities, error: actError } = await supabase
      .from('activities')
      .select('*, createdBy:users!activities_created_by_fkey(name)')
      .neq('outcome', 'dismissed') 
      .order('created_at', { ascending: false })
      .limit(10);

    // 4. Payments fetch karein real revenue ke liye
    const { data: payments, error: payError } = await supabase.from('lead_payments').select('amount');

    if (userError || leadError || actError || payError) throw userError || leadError || actError || payError;

    const wonLeads = leads.filter(l => l.status === "closed-won");
    const followupLeads = leads.filter(l => l.status === "discussing" || l.status === "proposal");
    const pendingLeads = leads.filter(l => l.status !== "closed-won" && l.status !== "closed-lost" && l.status !== "complete");

    // Actual money received from payments
    const actualRevenue = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    res.json({
      leads: { value: leads.length, change: 10, trend: "up" },
      deals: { value: wonLeads.length, change: 5, trend: "up" },
      followups: { value: followupLeads.length, change: -2, trend: "down" },
      revenue: { value: actualRevenue, change: 12, trend: "up" },
      pendingLeads: { value: pendingLeads.length, change: 0, trend: "up" },
      recentActivities: activities
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * 📊 CHART DATA
 */
router.get("/chart-data", protect, authorizeRoles("admin", "sales", "production"), getChartData);

/**
 * 👥 TEAM REPORT
 */
router.get("/team-report", protect, authorizeRoles("admin", "sales", "production"), getTeamReport);



/**
 * 🔵 CREATE USER
 */
router.post("/create-user", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Password hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword, role }])
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/toggle-status/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabase.from('users').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    res.json({ message: `User status updated to ${status}`, user: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/reset-password/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const { error } = await supabase.from('users').update({ password: hashedPassword }).eq('id', id);
    if (error) throw error;
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete-user/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Apne aap ko delete karne se rokein
    if (id === req.user.id) {
      return res.status(400).json({ message: "Aap apne aap ko delete nahi kar sakte!" });
    }

    // Hard delete ki wajah se foreign key error aa sakta hai (500), isliye status 'deleted' kar dete hain
    const { error } = await supabase.from('users').update({ status: 'deleted' }).eq('id', id);
    if (error) throw error;
    res.json({ message: "User removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * 🟢 EXCEL EXPORT (Leads by User)
 */
router.get("/export-leads/:userId", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch leads created by or assigned to this user
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .or(`created_by.eq.${userId},assigned_to.eq.${userId}`);

    if (error) throw error;

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads Report');

    // Define columns
    worksheet.columns = [
      { header: 'Client Name', key: 'clientName', width: 25 },
      { header: 'Client Email', key: 'email', width: 30 },
      { header: 'Platform', key: 'source', width: 15 },
      { header: 'Deal Value ($)', key: 'budget', width: 15 },
      { header: 'Current Status', key: 'status', width: 20 },
      { header: 'Date Captured', key: 'createdAt', width: 20 }
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' } // Dark blue
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' }, // White
        bold: true
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Add data
    leads.forEach(lead => {
      worksheet.addRow({
        clientName: lead.client_name || lead.clientName || 'N/A',
        email: lead.email || 'N/A',
        source: lead.source || 'N/A',
        budget: lead.budget || 0,
        status: lead.status || 'N/A',
        createdAt: new Date(lead.created_at || lead.createdAt).toLocaleDateString()
      });
    });

    // Send file to client
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Leads_Report_${userId}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel Export Error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * 🔴 SYSTEM RESET ROUTES (Admin Only)
 */
// 1. Reset Leads
router.delete("/reset/leads", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const dummyUUID = "00000000-0000-0000-0000-000000000000";
    
    // Delete payments first
    await supabase.from("lead_payments").delete().neq("id", dummyUUID);
    // Delete messages
    await supabase.from("lead_messages").delete().neq("id", dummyUUID);
    // Delete lead activities
    await supabase.from("lead_activities").delete().neq("id", dummyUUID);
    // Delete general activities referencing leads or all activities
    await supabase.from("activities").delete().neq("id", dummyUUID);
    
    // Finally delete all leads
    const { error } = await supabase.from("leads").delete().neq("id", dummyUUID);
    if (error) throw error;

    res.json({ success: true, message: "All leads and associated activities, messages, and payments reset successfully." });
  } catch (error) {
    console.error("Reset Leads Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// 2. Reset Projects
router.delete("/reset/projects", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const dummyUUID = "00000000-0000-0000-0000-000000000000";
    
    await supabase.from("project_tasks").delete().neq("id", dummyUUID);
    await supabase.from("project_comments").delete().neq("id", dummyUUID);
    await supabase.from("files").delete().neq("id", dummyUUID);
    
    const { error } = await supabase.from("projects").delete().neq("id", dummyUUID);
    if (error) throw error;

    res.json({ success: true, message: "All projects, tasks, comments, and project files reset successfully." });
  } catch (error) {
    console.error("Reset Projects Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// 3. Reset Targets
router.delete("/reset/targets", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const dummyUUID = "00000000-0000-0000-0000-000000000000";
    const { error } = await supabase.from("targets").delete().neq("id", dummyUUID);
    if (error) throw error;

    res.json({ success: true, message: "All targets reset successfully." });
  } catch (error) {
    console.error("Reset Targets Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// 4. Reset Activities/Notifications
router.delete("/reset/activities", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const dummyUUID = "00000000-0000-0000-0000-000000000000";
    const { error } = await supabase.from("activities").delete().neq("id", dummyUUID);
    if (error) throw error;

    res.json({ success: true, message: "All activities log reset successfully." });
  } catch (error) {
    console.error("Reset Activities Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// 5. Full Wipe
router.delete("/reset/all", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const dummyUUID = "00000000-0000-0000-0000-000000000000";

    // 1. Projects
    await supabase.from("project_tasks").delete().neq("id", dummyUUID);
    await supabase.from("project_comments").delete().neq("id", dummyUUID);
    await supabase.from("files").delete().neq("id", dummyUUID);
    await supabase.from("projects").delete().neq("id", dummyUUID);

    // 2. Leads
    await supabase.from("lead_payments").delete().neq("id", dummyUUID);
    await supabase.from("lead_messages").delete().neq("id", dummyUUID);
    await supabase.from("lead_activities").delete().neq("id", dummyUUID);
    await supabase.from("activities").delete().neq("id", dummyUUID);
    await supabase.from("leads").delete().neq("id", dummyUUID);

    // 3. Targets
    await supabase.from("targets").delete().neq("id", dummyUUID);

    res.json({ success: true, message: "All transactional tables wiped successfully. System is completely fresh!" });
  } catch (error) {
    console.error("Full Wipe Error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;