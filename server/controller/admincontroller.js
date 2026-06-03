import { supabase } from "../config/supabaseClient.js";

export const getTeamReport = async (req, res) => {
  try {
    // 1. Users fetch karein (password ke baghair) — active users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, status, created_at')
      .neq('status', 'deleted');

    if (userError) throw userError;

    // 2. Leads fetch karein
    const { data: leads, error: leadError } = await supabase
      .from('leads')
      .select('status, budget');

    if (leadError) throw leadError;

    // 3. Calculation (MongoDB wala logic lekin Supabase data par)
    const closedWonLeads = leads.filter(l => l.status === "closed-won");

    // Revenue calculation: budget string ho sakta hai isliye Number() use kiya
    const totalRevenue = closedWonLeads.reduce((sum, l) => {
      // SQL mein column name budget hi rakha hai humne
      const budgetValue = parseFloat(l.budget) || 0;
      return sum + budgetValue;
    }, 0);

    // 4. Response
    res.json({
      totalUsers: users.length,
      totalLeads: leads.length,
      totalDeals: closedWonLeads.length,
      totalRevenue,
      teamMembers: users
    });

  } catch (err) {
    console.error("🔥 Team report error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getChartData = async (req, res) => {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('service, status, budget, created_at');

    if (error) throw error;

    // 1. Leads by Service (Pie Chart)
    const serviceCounts = {};
    leads.forEach(l => {
      const s = l.service || "Other";
      serviceCounts[s] = (serviceCounts[s] || 0) + 1;
    });
    const leadsByService = Object.entries(serviceCounts).map(([name, value]) => ({ name, value }));

    // 2. Monthly Deals & Revenue (Area Chart)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    
    // Initialize last 6 months with 0s
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const monthIdx = (currentMonth - i + 12) % 12;
      monthlyStats.push({
        month: months[monthIdx],
        deals: 0,
        revenue: 0,
        monthIdx
      });
    }

    leads.filter(l => l.status === "closed-won").forEach(l => {
      const date = new Date(l.created_at);
      const mIdx = date.getMonth();
      const stats = monthlyStats.find(s => s.monthIdx === mIdx);
      if (stats) {
        stats.deals += 1;
        stats.revenue += parseFloat(l.budget) || 0;
      }
    });

    res.json({
      leadsByService,
      monthlyDeals: monthlyStats.map(({ month, deals, revenue }) => ({ month, deals, revenue }))
    });

  } catch (err) {
    console.error("🔥 Chart data error:", err);
    res.status(500).json({ message: err.message });
  }
};