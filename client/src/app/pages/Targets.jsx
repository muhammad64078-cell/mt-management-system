import { useEffect, useState } from "react";
import { Card } from '../components/ui';
import { Target, TrendingUp, Calendar, Loader2, Trash2 } from 'lucide-react';
import API from "../api/api";
import { useAuth } from "../context/AuthContext";

export const Targets = () => {
  const { user } = useAuth();
  const [targets, setTargets] = useState({ daily: {}, weekly: {}, monthly: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTargets = async () => {
      const token = localStorage.getItem("token");

      try {
        const res = await API.get("/targets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Group the flat array into the structure the UI expects
        const grouped = res.data.reduce((acc, curr) => {
          const userName = curr.userId?.name || "";
          const periodKey = userName ? `${userName} - ${curr.period}` : curr.period;
          
          if (!acc[periodKey]) acc[periodKey] = {};
          acc[periodKey][curr.type] = {
            current: curr.current_value ?? 0,
            target: curr.target_value ?? 0,
            id: curr.id || curr._id
          };
          return acc;
        }, { daily: {}, weekly: {}, monthly: {} });

        setTargets(grouped);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTargets();
  }, []);

  const handleDeleteTarget = async (targetId, periodKey, type) => {
    if (!window.confirm("Kya aap is target ko delete karna chahte hain?")) return;
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/targets/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state by removing the specific type from the periodKey
      setTargets(prev => {
        const updated = { ...prev };
        if (updated[periodKey]) {
          delete updated[periodKey][type];
          // If the periodKey has no more types, remove it too
          if (Object.keys(updated[periodKey]).length === 0) {
            delete updated[periodKey];
          }
        }
        return updated;
      });
      alert("Target deleted successfully! 🗑️✅");
    } catch (err) {
      console.log(err);
      alert("Delete failed ❌");
    }
  };

  const calculatePercentage = (current, target) => {
    if (!target) return 0;
    return Math.round((current / target) * 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground mb-2 font-bold tracking-tight">Targets & Goals</h1>
          <p className="text-sm text-muted-foreground">Track your performance against daily, weekly, and monthly targets</p>
        </div>
      </div>

      {/* Daily Targets */}
      <div>
        <div className="flex items-center mb-4">
          <Calendar className="w-5 h-5 text-orange-500 mr-2" />
          <h2 className="text-xl font-semibold text-foreground">Daily Targets</h2>
          <span className="ml-3 text-sm text-muted-foreground">Today - {new Date().toLocaleDateString()}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(targets.daily).length > 0 ? (
            Object.entries(targets.daily).map(([key, data]) => {
              const percentage = calculatePercentage(data.current, data.target);
              return (
                <Card key={key} className="p-6 shadow-[0_0_15px_rgba(0,0,0,0.5)] border-border hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">{key}</p>
                      <p className="text-3xl font-bold text-foreground">{data.current}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">of {data.target} target</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getProgressColor(percentage)}`}>
                        {percentage}%
                      </div>
                      {user?.role === 'admin' && (
                        <button 
                          onClick={() => handleDeleteTarget(data.id, 'daily', key)}
                          className="text-muted-foreground hover:text-red-500 transition-colors mt-1"
                          title="Delete Target"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        percentage >= 100 ? 'bg-green-500' :
                        percentage >= 75 ? 'bg-blue-500' :
                        percentage >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] mt-3 text-muted-foreground font-medium">
                    {data.target - data.current > 0 ? `${data.target - data.current} more to reach goal` : 'Goal reached! ✨'}
                  </p>
                </Card>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground col-span-full py-10 bg-black/20 rounded-xl text-center border-2 border-dashed border-border">No daily targets assigned by admin yet.</p>
          )}
        </div>
      </div>

      {/* Weekly Targets */}
      <div>
        <div className="flex items-center mb-4">
          <Target className="w-5 h-5 text-green-600 mr-2" />
          <h2 className="text-xl font-semibold text-foreground">Weekly Targets</h2>
        </div>
        <Card className="p-6 shadow-[0_0_15px_rgba(0,0,0,0.5)] border-border">
          <div className="space-y-6">
            {Object.entries(targets.weekly).length > 0 ? (
              Object.entries(targets.weekly).map(([key, data]) => {
                const percentage = calculatePercentage(data.current, data.target);
                const isRevenue = key === 'revenue' || key.toLowerCase().includes('rev');
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-sm text-muted-foreground font-bold capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="text-xs text-muted-foreground font-medium">Progress against weekly goal</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">
                          {isRevenue ? `$${data.current.toLocaleString()}` : data.current} / {isRevenue ? `$${data.target.toLocaleString()}` : data.target}
                        </div>
                        <div className={`text-xs font-bold ${getProgressColor(percentage)} flex items-center justify-end gap-1`}>
                          <span>{percentage}% Completed</span>
                          {user?.role === 'admin' && (
                            <button 
                              onClick={() => handleDeleteTarget(data.id, 'weekly', key)}
                              className="text-muted-foreground hover:text-red-500 transition-colors"
                              title="Delete Target"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ${
                          percentage >= 100 ? 'bg-green-500' :
                          percentage >= 75 ? 'bg-blue-500' :
                          percentage >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No weekly targets found.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Monthly Targets */}
      <div>
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
          <h2 className="text-xl font-semibold text-foreground">Monthly Targets</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(targets.monthly).length > 0 ? (
            Object.entries(targets.monthly).map(([key, data]) => {
              const percentage = calculatePercentage(data.current, data.target);
              const isRevenue = key === 'revenue' || key.toLowerCase().includes('rev');
              return (
                <Card key={key} className="p-6 shadow-[0_0_15px_rgba(0,0,0,0.5)] border-border bg-card">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-tight">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-4xl font-bold text-foreground mb-1">
                        {isRevenue ? `$${(data.current).toLocaleString()}` : data.current}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        Monthly Goal: {isRevenue ? `$${(data.target).toLocaleString()}` : data.target}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold ${percentage >= 100 ? 'bg-green-100 text-green-700' : 'bg-orange-500/20 text-orange-600'}`}>
                         {percentage}% Done
                       </span>
                       {user?.role === 'admin' && (
                         <button 
                           onClick={() => handleDeleteTarget(data.id, 'monthly', key)}
                           className="text-muted-foreground hover:text-red-500 transition-colors"
                           title="Delete Target"
                         >
                           <Trash2 size={14} />
                         </button>
                       )}
                    </div>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-1000 ${
                        percentage >= 100 ? 'bg-green-500' :
                        percentage >= 75 ? 'bg-blue-500' :
                        percentage >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-xs font-medium text-muted-foreground">
                    <span>PROGRESS</span>
                    <span className="text-foreground font-bold">
                      {isRevenue 
                        ? `$${Math.max(0, data.target - data.current).toLocaleString()} remaining`
                        : `${Math.max(0, data.target - data.current)} items to go`}
                    </span>
                  </div>
                </Card>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground col-span-full text-center py-6">No monthly goals set.</p>
          )}
        </div>
      </div>

      {/* Custom Targets (e.g., Week 1, Week 2) */}
      {Object.keys(targets).filter(k => k !== 'daily' && k !== 'weekly' && k !== 'monthly').map(customPeriod => (
        <div key={customPeriod} className="mt-8">
          <div className="flex items-center mb-4">
            <Target className="w-5 h-5 text-orange-500 mr-2" />
            <h2 className="text-xl font-semibold text-foreground">{customPeriod} Targets</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(targets[customPeriod]).map(([key, data]) => {
              const percentage = calculatePercentage(data.current, data.target);
              const isRevenue = key === 'revenue' || key.toLowerCase().includes('rev');
              return (
                <Card key={key} className="p-6 shadow-[0_0_15px_rgba(0,0,0,0.5)] border-border bg-card">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-tight">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-4xl font-bold text-foreground mb-1">
                        {isRevenue ? `$${(data.current).toLocaleString()}` : data.current}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        Target: {isRevenue ? `$${(data.target).toLocaleString()}` : data.target}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold ${percentage >= 100 ? 'bg-green-100 text-green-700' : 'bg-orange-500/20 text-orange-600'}`}>
                         {percentage}% Done
                       </span>
                       {user?.role === 'admin' && (
                         <button 
                           onClick={() => handleDeleteTarget(data.id, customPeriod, key)}
                           className="text-muted-foreground hover:text-red-500 transition-colors"
                           title="Delete Target"
                         >
                           <Trash2 size={14} />
                         </button>
                       )}
                    </div>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-1000 ${
                        percentage >= 100 ? 'bg-green-500' :
                        percentage >= 75 ? 'bg-blue-500' :
                        percentage >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
