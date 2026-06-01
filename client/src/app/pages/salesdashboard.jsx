import { useEffect, useState } from "react";
import API from "../api/api";
import { Card, LoadingSpinner, Badge } from "../components/ui";
import { Users, DollarSign, Clock, TrendingUp, ArrowRight, Activity as ActivityIcon, AlertCircle, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SalesDashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [followUpLeads, setFollowUpLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/sales/dashboard");

        setStats(res.data.stats);
        setChartData(res.data.chart);
        setRecentActivities(res.data.recentActivities || []);

        // Fetch follow-up alerts
        const followUpRes = await API.get("/leads/follow-ups/all");
        setFollowUpLeads(followUpRes.data || []);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!stats) return <p className="p-6 text-center text-muted-foreground">No data found.</p>;

  // Filter logic for selected report
  const displayedReports = selectedReport 
    ? chartData.filter(item => item.month === selectedReport)
    : chartData;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Sales Dashboard</h1>
        <p className="text-muted-foreground mt-1">Hello, tracking your performance and leads.</p>
      </div>

      {/* FOLLOW-UP ALERTS */}
      {followUpLeads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle size={20} />
            <h2 className="text-lg font-bold">Follow-up Reminders</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {followUpLeads.map((lead) => (
              <div 
                key={lead.id || lead._id} 
                className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center justify-between group hover:bg-amber-100 transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                onClick={() => navigate(`/leads/${lead.id || lead._id}`)}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-amber-900 truncate">{lead.client_name}</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Stuck in <span className="font-bold">{lead.status}</span> for 3+ days
                  </p>
                </div>
                <div className="ml-4 p-2 bg-card rounded-lg text-amber-600 group-hover:scale-110 transition-transform">
                  <Mail size={18} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow border-none ring-1 ring-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{stats.leads}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-600 font-bold">
            <TrendingUp size={12} className="mr-1" />
            Active monitoring
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow border-none ring-1 ring-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Won Deals</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{stats.deals}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-muted-foreground">
            Current month performance
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow border-none ring-1 ring-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Follow-ups</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{stats.followups}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-amber-600 font-bold">
             Pending action
          </div>
        </Card>
      </div>

      {/* CHART & ACTIVITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 border-none ring-1 ring-border shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">
              {selectedReport ? `Report: ${selectedReport}` : 'Monthly Performance'}
            </h3>
            {selectedReport ? (
              <button 
                onClick={() => setSelectedReport(null)}
                className="text-orange-500 hover:text-orange-600 text-sm font-semibold flex items-center gap-1"
              >
                View All Reports
              </button>
            ) : (
              <button 
                onClick={() => {}} // Could be wired to show all in modal if needed
                className="text-orange-500 hover:text-orange-600 text-sm font-semibold flex items-center gap-1 group"
              >
                View Reports <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {displayedReports.map((item, index) => (
              <div key={index} className="flex flex-col p-4 rounded-xl bg-black/20 border border-border group hover:bg-card hover:border-indigo-100 transition-all">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                     <span className="font-bold text-muted-foreground uppercase tracking-wider text-xs">{item.month}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="success" className="font-bold">
                      {item.deals} DEALS
                    </Badge>
                    {!selectedReport && (
                      <button 
                        onClick={() => setSelectedReport(item.month)}
                        className="text-xs text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1 rounded font-semibold transition-colors"
                      >
                        View Report
                      </button>
                    )}
                  </div>
                </div>
                {selectedReport && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-bold text-foreground mb-2">Detailed Monthly Stats</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-card p-3 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-border">
                        <span className="text-xs text-muted-foreground block mb-1">Total Revenue</span>
                        <span className="text-lg font-bold text-foreground">${(item.revenue || 0).toLocaleString()}</span>
                      </div>
                      <div className="bg-card p-3 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-border">
                        <span className="text-xs text-muted-foreground block mb-1">Conversion Rate</span>
                        <span className="text-lg font-bold text-orange-500">{(item.deals * 3.5).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* RECENT ACTIVITIES */}
        <Card className="p-6 border-none ring-1 ring-border shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <h3 className="text-lg font-bold text-foreground mb-6">Recent My Activities</h3>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div key={act.id || act._id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:border-indigo-100 transition-all">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-500/10 text-orange-500">
                    <ActivityIcon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{act.clientName}</h4>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{act.notes}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <Badge className="uppercase text-[10px]">{act.type}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(act.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No activities logged yet.</p>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
};
