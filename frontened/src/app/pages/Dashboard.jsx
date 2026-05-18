import { useState, useEffect } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DarkToggle from "../components/DarkToggle";
import {
  Card,
  Badge,
  Button,
  Input,
  Select,
  LoadingSpinner,
} from "../components/ui";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  CheckCircle2,
  Clock,
  Calendar,
  Trophy,
  Plus,
  ArrowRight,
  UserPlus,
  Target,
  X as CloseIcon,
  Activity as ActivityIcon,
  AlertCircle,
  Mail,
  PieChart as ChartPieIcon,
  Eye,
  Trash2,
  Briefcase,
  AlertTriangle
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6"];

const statusLabels = {
  new: 'New',
  discussing: 'Discussing',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  'closed-won': 'Working/Revision',
  'closed-lost': 'Closed Lost',
  'complete': 'Completed'
};

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ─── STATE ────────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("sales");

  const [dashboardStats, setDashboardStats] = useState(null);
  const [chartData, setChartData] = useState({
    leadsByService: [],
    monthlyDeals: [],
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [allTargets, setAllTargets] = useState([]);
  const [productionUsers, setProductionUsers] = useState([]);
  const [followUpLeads, setFollowUpLeads] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);

  // Separate modal states — one for Target assignment, one for Project creation
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const [targetForm, setTargetForm] = useState({
    userId: "",
    weekNumber: "Week 1",
    revenueTarget: "",
    leadsTarget: "",
  });

  const [projectForm, setProjectForm] = useState({
    clientName: "",
    service: "",
    assignedTo: "",
    deadline: "",
  });

  // ─── CREATE USER (ADMIN) ──────────────────────────────────────────────────
  const createUser = async () => {
    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await API.post(
        `/admin/create-user`,
        { name, email, password, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("User created successfully ✅");
      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error(error);
      alert("Error creating user ❌");
    }
  };

  // ─── ASSIGN TARGET ────────────────────────────────────────────────────────
  const assignTarget = async () => {
    if (!targetForm.userId || !targetForm.weekNumber || !targetForm.revenueTarget || !targetForm.leadsTarget) {
      alert("Please fill all target fields");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await API.post(
        `/targets/assign-custom-weekly`,
        targetForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Target assigned successfully! 🎯");
      setIsTargetModalOpen(false);
      const res = await API.get(`/targets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllTargets(res.data);
    } catch (error) {
      console.error(error);
      alert("Error assigning target ❌");
    }
  };

  // ─── CREATE PROJECT ───────────────────────────────────────────────────────
  const createProject = async () => {
    try {
      const token = localStorage.getItem("token");
      await API.post(`/projects`, projectForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Project created ✅");
      setIsProjectModalOpen(false);
      setProjectForm({ clientName: "", service: "", assignedTo: "", deadline: "" });
    } catch (err) {
      console.error(err);
      alert("Error creating project ❌");
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/activities/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove from local state immediately
      setDashboardStats(prev => ({
        ...prev,
        recentActivities: prev.recentActivities.filter(a => (a.id || a._id) !== id)
      }));
    } catch (error) {
      console.error(error);
      alert("Error deleting notification ❌");
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to clear ALL notifications? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/activities/delete-all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardStats(prev => ({
        ...prev,
        recentActivities: []
      }));
    } catch (error) {
      console.error(error);
      alert("Error clearing notifications ❌");
    }
  };

  // ─── FETCH DASHBOARD DATA ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token || !user) return;

      setLoading(true);
      try {
        const isAdmin = user?.role === "admin";
        const isSales = user?.role === "sales";
        
        if (!isAdmin && !isSales) return; // Production users will be redirected, don't fetch stats

        const endpoint = isAdmin
          ? `/admin/dashboard-stats`
          : `/sales/dashboard`;

        const statsRes = await API.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let normalizedStats = statsRes.data;

        if (!isAdmin && normalizedStats.stats) {
          normalizedStats = {
            leads:     { value: normalizedStats.stats.leads     || 0, change: 0, trend: "up" },
            deals:     { value: normalizedStats.stats.deals     || 0, change: 0, trend: "up" },
            followups: { value: normalizedStats.stats.followups || 0, change: 0, trend: "up" },
            revenue:   { value: normalizedStats.stats.revenue   || 0, change: 0, trend: "up" },
            recentActivities: normalizedStats.recentActivities || [],
          };
        }

        setDashboardStats(normalizedStats);

        let chartPromise = Promise.resolve({ data: { leadsByService: [], monthlyDeals: [] } });
        let usersPromise = Promise.resolve({ data: [] });

        if (isAdmin) {
          chartPromise = API
            .get(`/admin/chart-data`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: { leadsByService: [], monthlyDeals: [] } }));

          usersPromise = API
            .get(`/admin/users`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: [] }));

          API
            .get(`/auth/sales-users`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setSalesUsers(res.data))
            .catch(() => {});

          API
            .get(`/targets`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setAllTargets(res.data))
            .catch(() => {});

          API
            .get(`/projects`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setProjects(Array.isArray(res.data) ? res.data : []))
            .catch((err) => console.error("Error fetching projects for dashboard:", err));
        }

        // Fetch follow-up alerts for everyone
        API.get(`/leads/follow-ups/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => setFollowUpLeads(res.data || []));

        const [chartRes, usersRes] = await Promise.all([chartPromise, usersPromise]);
        setChartData(chartRes.data);
        setTeamMembers(usersRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setDashboardStats({
          leads:     { value: 0, change: 0, trend: "up" },
          deals:     { value: 0, change: 0, trend: "up" },
          followups: { value: 0, change: 0, trend: "up" },
          revenue:   { value: 0, change: 0, trend: "up" },
          recentActivities: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ─── REDIRECT ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user?.role === "production") {
      navigate("/production", { replace: true });
    } else if (user?.role === "sales") {
      navigate("/salesdashboard", { replace: true });
    }
  }, [user, navigate]);

  // ─── FETCH PRODUCTION USERS ───────────────────────────────────────────────
  useEffect(() => {
    const fetchProductionUsers = async () => {
      if (user?.role !== "admin") return;
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(
          `/auth/production-users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProductionUsers(res.data);
      } catch (error) {
        console.error("Error fetching production users:", error);
      }
    };
    fetchProductionUsers();
  }, [user]);

  // ─── GUARDS ───────────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner size="lg" />;
  if (!dashboardStats)
    return <p className="p-6 text-center text-gray-500">No data available.</p>;

  // ─── DERIVED VALUES ───────────────────────────────────────────────────────
  // Helper: Parse notes column JSON
  const getProjectNotesData = (notesText) => {
    try {
      if (!notesText) return { description: '', revenue: '', checklist: [], comments: [] };
      const parsed = JSON.parse(notesText);
      return {
        description: parsed.description || '',
        revenue: parsed.revenue || '',
        checklist: parsed.checklist || [],
        comments: parsed.comments || []
      };
    } catch (e) {
      return {
        description: notesText || '',
        revenue: '',
        checklist: [],
        comments: []
      };
    }
  };

  // Group completed projects by month dynamically
  const getMonthlyCompletedData = () => {
    const monthlyData = {};
    
    (Array.isArray(projects) ? projects : []).forEach(p => {
      if (p.status !== 'completed') return;
      
      const dateStr = p.createdAt || p.created_at || new Date().toISOString();
      let monthKey = 'Active Schedule';
      try {
        const date = new Date(dateStr);
        monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      } catch (e) {
        // Fallback
      }
      
      // Parse revenue
      const parsedNotes = getProjectNotesData(p.notes);
      let revenueVal = 0;
      if (parsedNotes.revenue) {
        const cleaned = parsedNotes.revenue.replace(/[^0-9.]/g, '');
        revenueVal = parseFloat(cleaned) || 0;
      }
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          completedCount: 0,
          revenue: 0,
          developers: {}
        };
      }
      
      monthlyData[monthKey].completedCount += 1;
      monthlyData[monthKey].revenue += revenueVal;
      
      const devName = p.assignedTo?.name || 'Unassigned';
      if (!monthlyData[monthKey].developers[devName]) {
        monthlyData[monthKey].developers[devName] = [];
      }
      monthlyData[monthKey].developers[devName].push(p);
    });
    
    // Sort months descending chronologically
    return Object.values(monthlyData)
      .map(m => ({
        ...m,
        devGroups: Object.entries(m.developers).map(([name, devProjects]) => ({
          name,
          projects: devProjects
        }))
      }))
      .sort((a, b) => new Date(b.month) - new Date(a.month));
  };
  
  const monthlyCompleted = getMonthlyCompletedData();

  // topPerformer comes from the backend stats or falls back to an empty object
  const topPerformer = dashboardStats?.topPerformer || {};

  const statusCounts = {
    'not-started': (Array.isArray(projects) ? projects : []).filter(p => p.status === 'not-started').length,
    'in-progress': (Array.isArray(projects) ? projects : []).filter(p => p.status === 'in-progress').length,
    'review': (Array.isArray(projects) ? projects : []).filter(p => p.status === 'review').length,
    'completed': (Array.isArray(projects) ? projects : []).filter(p => p.status === 'completed').length
  };

  const approachingDeadlineCount = (Array.isArray(projects) ? projects : []).filter(p => {
    if (!p.deadline || p.status === 'completed') return false;
    const deadlineDate = new Date(p.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 5;
  }).length;

  const avgProgress =
    (Array.isArray(projects) ? projects : []).length > 0
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0;

  const productionStats = [
    {
      name: 'Total Projects',
      value: (Array.isArray(projects) ? projects : []).length,
      icon: Briefcase,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/30',
      description: 'Total active and completed pipeline'
    },
    {
      name: 'In Progress',
      value: statusCounts['in-progress'],
      icon: ActivityIcon,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50 border border-sky-100 dark:bg-sky-950/40 dark:border-sky-900/30',
      description: 'Active coding and design work'
    },
    {
      name: 'Approaching Deadline',
      value: approachingDeadlineCount,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bgColor: `bg-rose-50 border border-rose-100 dark:bg-rose-950/40 dark:border-rose-900/30 ${approachingDeadlineCount > 0 ? 'animate-pulse' : ''}`,
      description: 'Deadlines in next 3-5 days'
    },
    {
      name: 'Completed',
      value: statusCounts['completed'],
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/30',
      description: 'Delivered and closed deliverables'
    }
  ];

  // All 4 stat cards — now with bgColor, color, change & trend included
  const stats = [
    {
      name: "Total Leads",
      value: dashboardStats.leads?.value ?? 0,
      change: dashboardStats.leads?.change ?? 0,
      trend: dashboardStats.leads?.trend ?? "up",
      icon: Users,
      bgColor: "bg-indigo-50",
      color: "text-indigo-600",
    },
    {
      name: "Active Deals",
      value: dashboardStats.deals?.value ?? 0,
      change: dashboardStats.deals?.change ?? 0,
      trend: dashboardStats.deals?.trend ?? "up",
      icon: DollarSign,
      bgColor: "bg-green-50",
      color: "text-green-600",
    },
    {
      name: "Follow-ups",
      value: dashboardStats.followups?.value ?? 0,
      change: dashboardStats.followups?.change ?? 0,
      trend: dashboardStats.followups?.trend ?? "up",
      icon: Clock,
      bgColor: "bg-amber-50",
      color: "text-amber-600",
    },
    {
      name: "Revenue",
      value: `$${(dashboardStats.revenue?.value ?? 0).toLocaleString()}`,
      change: dashboardStats.revenue?.change ?? 0,
      trend: dashboardStats.revenue?.trend ?? "up",
      icon: TrendingUp,
      bgColor: "bg-purple-50",
      color: "text-purple-600",
    },
    {
      name: "Pending Leads",
      value: dashboardStats.pendingLeads?.value ?? 0,
      change: dashboardStats.pendingLeads?.change ?? 0,
      trend: dashboardStats.pendingLeads?.trend ?? "up",
      icon: ActivityIcon,
      bgColor: "bg-red-50",
      color: "text-red-600",
    },
  ];

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Top action bar ─────────────────────────────────────────────────── */}
      {user?.role === "admin" && (
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/reports")}
            className="bg-indigo-600 text-white"
          >
            <ChartPieIcon className="w-4 h-4 mr-1" />
            View Reports
          </Button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Overview
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back,{" "}
            <span className="text-indigo-600 font-semibold">{user?.name}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DarkToggle />
          <div className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* ── Stats Cards (5 cards) ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl backdrop-blur-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex justify-between items-center mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color}`}>
                <stat.icon size={22} />
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  stat.trend === "up"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {stat.change}%
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* ── Production Pipeline Overview (Admin Only) ─────────────────────── */}
      {user?.role === "admin" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Production Pipeline Overview</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-wider">Live Metrics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productionStats.map((stat) => (
              <Card key={stat.name} className="p-6 border-none ring-1 ring-gray-100 dark:ring-gray-700/50 bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-gray-50/30 dark:to-gray-700/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.name}</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-1.5 leading-none">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor} flex items-center justify-center transition-all group-hover:scale-110 duration-300`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Team Performance Banner */}
          <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/25 border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mr-4">
                <TrendingUp className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Team Performance</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Great work! The team is maintaining an average progress of {avgProgress}% across all projects.{" "}
                  {statusCounts['in-progress']} projects are actively in progress and {statusCounts['review']} are awaiting review.
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    <span className="font-bold">{statusCounts['completed']} completed this month</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 dark:text-gray-400 font-bold">{projects.length} total projects</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Follow-up Alerts ──────────────────────────────────────────────── */}
      {followUpLeads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle size={20} />
            <h2 className="text-lg font-bold">Follow-up Reminders</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {followUpLeads.map((lead) => (
              <div 
                key={lead.id || lead._id} 
                className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-4 flex items-center justify-between group hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all cursor-pointer shadow-sm"
                onClick={() => navigate(`/leads/${lead.id || lead._id}`)}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-amber-900 dark:text-amber-100 truncate">{lead.client_name}</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Stuck in <span className="font-bold">{statusLabels[lead.status] || lead.status}</span> for 3+ days
                  </p>
                </div>
                <div className="ml-4 p-2 bg-white dark:bg-gray-800 rounded-lg text-amber-600 group-hover:scale-110 transition-transform">
                  <Mail size={18} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Charts Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Monthly Growth — spans 2 cols */}
        <Card className="lg:col-span-2 p-6 border-none ring-1 ring-gray-100 bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Growth</h3>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.monthlyDeals}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="deals"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Leads Distribution Pie — 1 col */}
        <Card className="p-6 border-none ring-1 ring-gray-100 bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Leads Distribution</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.leadsByService}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {chartData.leadsByService.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {chartData.leadsByService.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-sm text-gray-600 font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* Monthly Completion Analytics Section (Admin Only) */}
      {user?.role === 'admin' && (
        <Card className="p-6 border-none ring-1 ring-gray-100 shadow-sm bg-white dark:bg-gray-800 dark:ring-gray-700">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-indigo-600 animate-bounce" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Monthly Completion Analytics</h3>
          </div>
          
          {monthlyCompleted.length === 0 ? (
            <div className="py-8 text-center text-gray-400 italic text-sm bg-gray-50 dark:bg-gray-700/30 rounded-2xl">
              No completed projects recorded for any month yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {monthlyCompleted.map((m) => (
                <div 
                  key={m.month} 
                  className="p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md hover:ring-2 hover:ring-indigo-500/10 transition-all duration-300 relative group overflow-hidden"
                >
                  {/* Visual Accent */}
                  <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50/30 rounded-bl-full -z-10 group-hover:bg-indigo-50/50 transition-colors duration-300" />
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-wide">{m.month}</h4>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Completed Pipeline</p>
                    </div>
                    <Badge variant="success" className="font-extrabold text-[11px] px-2.5 py-0.5 shadow-sm">
                      {m.completedCount} {m.completedCount === 1 ? 'Project' : 'Projects'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-bold">Total Revenue:</span>
                      <span className="font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded shadow-sm">
                        💰 {m.revenue > 0 ? `$${m.revenue.toLocaleString()}` : '—'}
                      </span>
                    </div>
                    
                    {/* List of Developers and their Completed Projects */}
                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                      <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Completed Deliverables by Member:</span>
                      <div className="space-y-2.5">
                        {m.devGroups.map((group, gIdx) => (
                          <div key={gIdx} className="space-y-1 bg-gray-50/50 dark:bg-gray-700/20 p-2 rounded-xl border border-gray-100/50 dark:border-gray-700/30">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                👤 {group.name}
                              </span>
                              <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                {group.projects.length} {group.projects.length === 1 ? 'Project' : 'Projects'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {group.projects.map((p, idx) => (
                                <span 
                                  key={p.id || p._id || idx} 
                                  onClick={() => navigate(`/production/projects/${p.id || p._id}`)}
                                  className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-all border border-indigo-100/30 dark:border-indigo-900/30 px-2 py-0.5 rounded cursor-pointer shadow-sm animate-in fade-in duration-200"
                                  title="Click to view workspace"
                                >
                                  {p.clientName || 'Unnamed'}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Recent Lead Notifications (Admin Only) ──────────────────────────── */}
      {user?.role === "admin" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Lead Notifications</h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">Latest {(dashboardStats?.recentActivities || []).length} entries</span>
              {(dashboardStats?.recentActivities || []).length > 0 && (
                <button 
                  onClick={clearAllNotifications}
                  className="text-xs font-bold text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-all"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {(dashboardStats?.recentActivities || []).length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">No lead activity yet.</div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-700">
              {(dashboardStats?.recentActivities || []).map((act, i) => {
                const adderName = act.createdBy?.name || "Unknown";
                const initials = adderName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                
                // Fix: Use act.created_at (Supabase) instead of act.createdAt
                const timeAgo = (() => {
                  const timestamp = new Date(act.created_at || act.createdAt).getTime();
                  if (isNaN(timestamp)) return "—";
                  const diff = (Date.now() - timestamp) / 1000;
                  if (diff < 60) return `${Math.round(diff)}s ago`;
                  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
                  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
                  return `${Math.round(diff / 86400)}d ago`;
                })();

                return (
                  <li 
                    key={i} 
                    className="group flex items-start gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        <span className="font-bold text-indigo-600">{adderName}</span>
                        {" "}added a new lead:
                        {" "}<span className="font-semibold text-gray-900 dark:text-white">{act.client_name || act.clientName || "—"}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {act.notes || ""}
                      </p>
                    </div>

                    {/* Actions & Time */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] text-gray-400 font-medium">{timeAgo}</span>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => act.lead_id && navigate(`/leads/${act.lead_id}`)}
                          className={`p-1.5 rounded-lg transition-colors ${act.lead_id ? 'text-indigo-600 hover:bg-indigo-50' : 'text-gray-300 cursor-not-allowed'}`}
                          title="View Lead"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => deleteNotification(act.id || act._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Dismiss"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ── Team Performance + Top Performer ───────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Team Targets */}
        <Card className="p-6 border-none ring-1 ring-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900">
              Team Performance &amp; Targets
            </h3>
            {user?.role === "admin" && (
              <Button
                size="sm"
                onClick={() => setIsTargetModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                <Plus className="w-4 h-4 mr-1" />
                Set Target
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {allTargets.slice(0, 6).map((t, i) => {
              const percentage = t.target > 0
                ? Math.round((t.current / t.target) * 100)
                : 0;
              return (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {t.userId?.name || "User"}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                        {t.period} {t.type}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-800">
                        {t.current} / {t.target}
                      </div>
                      <div
                        className={`text-[10px] font-bold ${
                          percentage >= 100 ? "text-green-600" : "text-indigo-600"
                        }`}
                      >
                        {percentage}% REACHED
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        percentage >= 100 ? "bg-green-500" : "bg-indigo-600"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {allTargets.length === 0 && (
              <p className="text-center text-gray-400 py-10">No active targets found.</p>
            )}
          </div>
        </Card>

        {/* Sales Team Management Card */}
        {user?.role === "admin" && (
          <Card className="p-6 border-none ring-1 ring-gray-100 bg-white shadow-sm mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Sales Team Management
              </h3>
            </div>
            <div className="space-y-4">
              {salesUsers.map((u) => (
                <div key={u.id || u._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                      {u.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      onClick={() => navigate(`/activity?userId=${u.id || u._id}`)}
                    >
                      View Activity
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs bg-white text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => {
                        const token = localStorage.getItem("token");
                        // Download file directly
                        fetch(`${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/admin/export-leads/${u.id || u._id}`, {
                          headers: { Authorization: `Bearer ${token}` }
                        })
                        .then(response => response.blob())
                        .then(blob => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Leads_Report_${u.name.replace(/\s+/g, '_')}.xlsx`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                        })
                        .catch(err => console.error("Export error:", err));
                      }}
                    >
                      Excel
                    </Button>
                  </div>
                </div>
              ))}
              {salesUsers.length === 0 && (
                <p className="text-center text-gray-400 py-4 text-sm">No sales users found.</p>
              )}
            </div>
          </Card>
        )}

        {/* Right column: Top Performer + Provision User */}
        <div className="space-y-8">

          {/* Top Performer Card */}
          <Card className="p-6 border-none ring-1 ring-gray-100 shadow-sm bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Top Performer
                </span>
                <Trophy className="text-amber-300" size={24} />
              </div>

              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full border-4 border-white/20 p-1">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      topPerformer.name || "User"
                    )}&background=random`}
                    className="w-full h-full rounded-full object-cover"
                    alt="Avatar"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {topPerformer.name || "No Data Yet"}
                  </h3>
                  <p className="text-indigo-100 text-sm">Senior Executive</p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-center">
                <div>
                  <p className="text-indigo-200 text-[10px] uppercase font-bold">Leads</p>
                  <p className="text-lg font-bold">{topPerformer.leads || 0}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-[10px] uppercase font-bold">Deals</p>
                  <p className="text-lg font-bold">{topPerformer.deals || 0}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-[10px] uppercase font-bold">Revenue</p>
                  <p className="text-lg font-bold">
                    ${(topPerformer.revenue || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          </Card>

          {/* Provision New User (admin only) */}
          {user?.role === "admin" && (
            <Card className="p-6 border-none ring-1 ring-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <UserPlus size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Provision New User</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Full Name"  value={name}     onChange={(e) => setName(e.target.value)}     />
                  <Input label="Email"      value={email}    onChange={(e) => setEmail(e.target.value)}    />
                </div>
                <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Select
                  label="Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  options={[
                    { value: "sales",      label: "Sales Team"      },
                    { value: "production", label: "Production Team" },
                  ]}
                />
                <Button
                  onClick={createUser}
                  className="w-full bg-gray-900 py-3 rounded-xl font-bold text-sm text-white"
                >
                  Create Account
                </Button>
              </div>
            </Card>
          )}

        </div>
      </div>

      {/* ── Target Assignment Modal ─────────────────────────────────────────── */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-white animate-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Assign Sales Target</h3>
              <button
                onClick={() => setIsTargetModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <Select
                label="Sales User"
                value={targetForm.userId}
                onChange={(e) => setTargetForm({ ...targetForm, userId: e.target.value })}
                options={[
                  { value: "", label: "Choose User" },
                  ...salesUsers.map((u) => ({ value: u.id || u._id, label: u.name })),
                ]}
              />

              <div className="grid grid-cols-1 gap-4">
                <Select
                  label="Week Number"
                  value={targetForm.weekNumber}
                  onChange={(e) => setTargetForm({ ...targetForm, weekNumber: e.target.value })}
                  options={[
                    { value: "Week 1", label: "Week 1" },
                    { value: "Week 2", label: "Week 2" },
                    { value: "Week 3", label: "Week 3" },
                    { value: "Week 4", label: "Week 4" },
                  ]}
                />
                <Input
                  label="Revenue Target ($)"
                  type="number"
                  value={targetForm.revenueTarget}
                  onChange={(e) => setTargetForm({ ...targetForm, revenueTarget: e.target.value })}
                />
                <Input
                  label="Leads Count Target"
                  type="number"
                  value={targetForm.leadsTarget}
                  onChange={(e) => setTargetForm({ ...targetForm, leadsTarget: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setIsTargetModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={assignTarget}
                  className="flex-1 bg-indigo-600 text-white font-bold"
                >
                  Save Target
                </Button>
              </div>
            </div>

          </Card>
        </div>
      )}

    </div>
  );
};