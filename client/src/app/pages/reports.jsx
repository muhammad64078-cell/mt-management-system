import { useEffect, useState } from "react";
import API from "../api/api";
import { Modal } from "../components/Modal";
import { DollarSign, Eye, PieChart, TrendingUp, Users, Activity, Clock } from "lucide-react";

export const Reports = () => {
  const [overview, setOverview] = useState({
    totalLeads: 0,
    closedDeals: 0,
    revenue: 0,
    pipelineRevenue: 0,
    pendingLeads: 0,
    followupLeads: 0,
    totalActivities: 0,
    recentPayments: [],
  });

  const statusLabels = {
    new: 'New',
    discussing: 'Discussing',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    'closed-won': 'Working/Revision',
    'closed-lost': 'Closed Lost',
    'complete': 'Completed'
  };

  const [selectedLeadPayments, setSelectedLeadPayments] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await API.get("/reports/overview");
      setOverview(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const parseBudget = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return Number(val.toString().replace(/[^0-9.]/g, '')) || 0;
  };

  // Group payments by lead
  const groupedPayments = overview.recentPayments?.reduce((acc, pay) => {
    const leadId = pay.lead_id;
    if (!acc[leadId]) {
      acc[leadId] = {
        leadName: pay.leads?.client_name || "Unknown",
        status: pay.leads?.status || "new",
        budget: parseBudget(pay.leads?.budget),
        totalReceived: 0,
        payments: []
      };
    }
    acc[leadId].totalReceived += Number(pay.amount || 0);
    acc[leadId].payments.push(pay);
    return acc;
  }, {});

  const groupedArray = groupedPayments ? Object.values(groupedPayments) : [];

  return (
    <div className="space-y-8 p-2">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
          <PieChart className="text-orange-500 w-8 h-8" />
          Business Intelligence
        </h1>
        <p className="text-muted-foreground mt-1">Real-time revenue tracking and performance analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Leads" value={overview.totalLeads} icon={Users} color="indigo" />
        <StatCard title="Closed Deals" value={overview.closedDeals} icon={TrendingUp} color="green" sub="Working/Revision" />
        <StatCard title="Total Revenue" value={`$${overview.revenue?.toLocaleString()}`} icon={DollarSign} color="emerald" sub="Cash in hand" />
        <StatCard title="Pipeline Value" value={`$${overview.pipelineRevenue?.toLocaleString()}`} icon={Activity} color="purple" sub="Working/Revision budget" />
        
        <StatCard title="Pending Leads" value={overview.pendingLeads} icon={Clock} color="amber" />
        <StatCard title="Need Follow-up" value={overview.followupLeads} icon={Activity} color="blue" />
        <StatCard title="Total Activities" value={overview.totalActivities} icon={Activity} color="rose" />
        <StatCard title="Conversion" value={`${overview.totalLeads > 0 ? ((overview.closedDeals / overview.totalLeads) * 100).toFixed(1) : 0}%`} icon={TrendingUp} color="cyan" />
      </div>

      {/* Main Table */}
      <div className="bg-card rounded-3xl shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-border overflow-hidden">
        <div className="px-6 sm:px-8 py-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/20/30">
          <h2 className="text-xl font-bold text-foreground">Revenue Overview (All Clients)</h2>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{groupedArray.length} Total Records</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/20/50 text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
              <tr>
                <th className="px-8 py-4">Client Name</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Project Budget</th>
                <th className="px-8 py-4">Paid Amount</th>
                <th className="px-8 py-4">Remaining</th>
                <th className="px-8 py-4 text-center">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groupedArray.map((item, idx) => (
                <tr key={idx} className="hover:bg-black/20/50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-foreground group-hover:text-orange-500 transition-colors">{item.leadName}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                      item.status === 'closed-won' ? 'bg-emerald-50 text-emerald-600' : 'bg-black/40 text-muted-foreground'
                    }`}>
                      {statusLabels[item.status] || item.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-muted-foreground font-medium">${Number(item.budget).toLocaleString()}</td>
                  <td className="px-8 py-5 font-bold text-emerald-600">${Number(item.totalReceived).toLocaleString()}</td>
                  <td className="px-8 py-5">
                    <span className={`font-medium ${item.budget - item.totalReceived <= 0 ? 'text-gray-300' : 'text-rose-500'}`}>
                      ${Math.max(0, item.budget - item.totalReceived).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button 
                      onClick={() => setSelectedLeadPayments(item)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl text-xs font-bold hover:bg-orange-500 hover:text-white transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {groupedArray.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-muted-foreground italic">No revenue records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW SECTION: Working & Revision Projects */}
      <div className="bg-card rounded-3xl shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 border-indigo-50 overflow-hidden">
        <div className="px-6 sm:px-8 py-6 border-b border-indigo-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-orange-500/10/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex flex-shrink-0 items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Working & Revision Projects</h2>
              <p className="text-xs text-orange-500 font-medium uppercase tracking-wider">Active Ongoing Work</p>
            </div>
          </div>
          <span className="text-xs font-black text-orange-500 bg-card px-3 py-1 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            {groupedArray.filter(i => i.status === 'closed-won').length} Active
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-orange-500/10/20 text-[10px] uppercase text-indigo-400 font-bold tracking-widest">
              <tr>
                <th className="px-8 py-4">Client Name</th>
                <th className="px-8 py-4">Total Budget</th>
                <th className="px-8 py-4">Paid So Far</th>
                <th className="px-8 py-4">Balance Due</th>
                <th className="px-8 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50/50">
              {groupedArray.filter(i => i.status === 'closed-won').map((item, idx) => (
                <tr key={idx} className="hover:bg-orange-500/10/10 transition-all">
                  <td className="px-8 py-5">
                    <div className="font-black text-foreground">{item.leadName}</div>
                  </td>
                  <td className="px-8 py-5 text-muted-foreground font-bold">${Number(item.budget).toLocaleString()}</td>
                  <td className="px-8 py-5 font-black text-orange-500">${Number(item.totalReceived).toLocaleString()}</td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-rose-600 font-black text-lg">
                        ${Math.max(0, item.budget - item.totalReceived).toLocaleString()}
                      </span>
                      <div className="w-24 bg-black/40 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full transition-all" 
                          style={{ width: `${Math.min(100, (item.totalReceived / (item.budget || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button 
                      onClick={() => setSelectedLeadPayments(item)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-orange-500 transition-all shadow-md shadow-gray-200"
                    >
                      Track Payments
                    </button>
                  </td>
                </tr>
              ))}
              {groupedArray.filter(i => i.status === 'closed-won').length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-muted-foreground italic">No active working/revision projects.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      {selectedLeadPayments && (
        <Modal 
          isOpen={!!selectedLeadPayments} 
          onClose={() => setSelectedLeadPayments(null)}
          title={`Payment History: ${selectedLeadPayments.leadName}`}
        >
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Project Budget</p>
                <p className="text-xl font-black text-foreground">${Number(selectedLeadPayments.budget).toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Total Paid</p>
                <p className="text-xl font-black text-emerald-700">${Number(selectedLeadPayments.totalReceived).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground px-1">Transaction List</h4>
              {selectedLeadPayments.payments.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-4 border border-border rounded-2xl hover:border-indigo-200 transition-all">
                  <div>
                    <div className="text-xs font-bold text-orange-500 uppercase tracking-wider">{p.payment_type}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{p.note || "Standard Payment"}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock size={10} /> {new Date(p.payment_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-lg font-black text-foreground">${Number(p.amount).toLocaleString()}</div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setSelectedLeadPayments(null)}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, sub }) => {
  const colors = {
    indigo: "text-orange-500 bg-orange-500/10",
    green: "text-green-600 bg-green-50",
    emerald: "text-emerald-600 bg-emerald-50",
    purple: "text-purple-600 bg-purple-50",
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
    rose: "text-rose-600 bg-rose-50",
    cyan: "text-cyan-600 bg-cyan-50",
  };

  return (
    <div className="bg-card p-6 rounded-3xl shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-border group hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{title}</h2>
          <p className="text-2xl font-black mt-2 text-foreground">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-1 font-medium">{sub}</p>}
        </div>
        <div className={`p-3 rounded-2xl ${colors[color] || colors.indigo} transition-transform group-hover:scale-110`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};