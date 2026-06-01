import { Card, Badge, Button } from '../components/ui';
import { Briefcase, CheckCircle2, Clock, AlertCircle, TrendingUp, Eye, Activity, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import API from "../api/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

export const ProductionDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Projects fetch error:", err.response?.data || err);
      }
    };
    fetchProjects();
  }, []);

  const statusCounts = {
    'not-started': projects.filter(p => p.status === 'not-started').length,
    'in-progress': projects.filter(p => p.status === 'in-progress').length,
    'review': projects.filter(p => p.status === 'review').length,
    'completed': (Array.isArray(projects) ? projects : []).filter(p => p.status === 'completed').length
  };

  const statusColors = {
    'not-started': 'default',
    'in-progress': 'info',
    'review': 'warning',
    'completed': 'success'
  };

  // Calculate projects whose deadline is approaching in the next 3 to 5 days
  const approachingDeadlineCount = projects.filter(p => {
    if (!p.deadline || p.status === 'completed') return false;
    const deadlineDate = new Date(p.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 5;
  }).length;



  const projectsByService = [
    { name: 'Website Dev', value: projects.filter(p => p.service === 'Website Development').length },
    { name: 'Graphic Design', value: projects.filter(p => p.service === 'Graphic Design').length },
    { name: 'Video Editing', value: (Array.isArray(projects) ? projects : []).filter(p => p.service === 'Video Editing').length }
  ];

  const completionData = projects.map(p => ({
    name: p.clientName?.split(' ')[0] || "Unknown",
    progress: p.progress || 0
  }));

  const avgProgress =
    projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0;



  const [showAllProjects, setShowAllProjects] = useState(false);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Production Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of all ongoing projects and deliverables</p>
        </div>
      </div>



      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Projects by Service */}
        <Card className="p-6 border-none ring-1 ring-border shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <h3 className="text-lg font-bold text-foreground mb-6">Projects by Service</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={projectsByService}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={90}
                dataKey="value"
              >
                {projectsByService.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#6366f1" />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Project Progress */}
        <Card className="p-6 border-none ring-1 ring-border shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <h3 className="text-lg font-bold text-foreground mb-6">Project Progress Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="progress" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card className="p-6 border-none ring-1 ring-border shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground">
            {showAllProjects ? 'All Projects' : 'Recent Projects'}
          </h3>
          <button 
            onClick={() => setShowAllProjects(!showAllProjects)}
            className="text-sm font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
          >
            {showAllProjects ? 'Show Less' : 'View All'}
          </button>
        </div>

        <div className={`space-y-4 ${showAllProjects ? 'max-h-[600px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
          {(showAllProjects ? projects : projects.slice(0, 5)).map((project) => (
            <div 
              key={project.id || project._id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/20 rounded-xl hover:bg-card hover:ring-1 hover:ring-border transition-all group gap-4"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center mb-2 gap-2">
                  <h4 className="text-sm font-bold text-foreground">{project.clientName}</h4>
                  <Badge variant={statusColors[project.status]}>
                    {project.status.replace('-', ' ')}
                  </Badge>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-card text-muted-foreground border border-border">
                    {project.service}
                  </span>
                  {getProjectNotesData(project.notes).revenue && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-0.5 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                      💰 {getProjectNotesData(project.notes).revenue}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                  <span className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2" />
                    Assigned: {project.assignedTo?.name || "Unassigned"}
                  </span>
                  <span className="hidden sm:inline text-gray-300">•</span>
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1.5" />
                    Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}
                  </span>
                  <span className="hidden sm:inline text-gray-300">•</span>
                  <span className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2" />
                    By: {project.createdBy?.name || "System"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="flex-1 sm:flex-none text-right" style={{ minWidth: '100px' }}>
                  <p className="text-xs font-bold text-foreground mb-1.5">{project.progress || 0}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate(`/production/projects/${project.id || project._id}`)}
                  className="p-2 bg-card rounded-lg text-muted-foreground hover:text-orange-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-border sm:opacity-0 group-hover:opacity-100 transition-all"
                  title="View Project Details"
                >
                  <Eye size={16} />
                </button>
              </div>

            </div>
          ))}
          {projects.length === 0 && (
            <div className="py-10 text-center text-muted-foreground italic">No projects found.</div>
          )}
        </div>
      </Card>

    </div>
  );
};