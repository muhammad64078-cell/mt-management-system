import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, Button, Input, Select, Textarea, LoadingSpinner } from '../components/ui';
import { Modal } from '../components/Modal';
import { 
  Search, 
  Eye, 
  Trash2, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  MessageSquare, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  List, 
  CheckCircle2, 
  User, 
  Sparkles,
  ClipboardList
} from 'lucide-react';

const statusColumns = [
  { id: 'not-started', label: 'Not Started', color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-orange-500/10 text-orange-600 border-indigo-100', dot: 'bg-indigo-500' },
  { id: 'review', label: 'Review', color: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
  { id: 'completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' }
];

const serviceOptions = [
  { value: 'all', label: 'All Services' },
  { value: 'Website Development', label: 'Website Development' },
  { value: 'Graphic Design', label: 'Graphic Design' },
  { value: 'Video Editing', label: 'Video Editing' }
];

const statusOptions = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' }
];

const getProjectMonth = (project) => {
  const dateStr = project.created_at || project.createdAt || new Date().toISOString();
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  } catch (e) {
    return 'Active Schedule';
  }
};

export const ProductionProjects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projectsData, setProjectsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'table'
  
  // Modals state
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [productionUsers, setProductionUsers] = useState([]);
  
  // Details Modal Live States
  const [modalDescription, setModalDescription] = useState('');
  const [modalRevenue, setModalRevenue] = useState('');
  const [modalChecklist, setModalChecklist] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [modalComments, setModalComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [modalStatus, setModalStatus] = useState('');
  const [modalProgress, setModalProgress] = useState(0);
  const [modalAssignedTo, setModalAssignedTo] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [breakdownTab, setBreakdownTab] = useState('developer'); // 'developer' or 'month'
  const [boardGrouping, setBoardGrouping] = useState('status'); // 'status', 'developer', or 'month'

  // Helper: Get dynamic columns based on selected boardGrouping
  const getDynamicColumns = () => {
    if (boardGrouping === 'status') {
      return statusColumns;
    }
    if (boardGrouping === 'developer') {
      return [
        ...productionUsers.map(u => ({
          id: u.id || u._id,
          label: u.name,
          dot: 'bg-indigo-500',
          color: 'bg-orange-500/10 text-orange-600 border-indigo-100'
        })),
        {
          id: 'unassigned',
          label: 'Unassigned Projects',
          dot: 'bg-slate-400',
          color: 'bg-slate-100 text-slate-700 border-slate-200'
        }
      ];
    }
    if (boardGrouping === 'month') {
      const monthsMap = {};
      filteredProjects.forEach(p => {
        const m = getProjectMonth(p);
        monthsMap[m] = true;
      });
      const uniqueMonths = Object.keys(monthsMap).sort((a, b) => new Date(b) - new Date(a));
      if (uniqueMonths.length === 0) {
        const currentMonth = getProjectMonth({});
        uniqueMonths.push(currentMonth);
      }
      return uniqueMonths.map(m => ({
        id: m,
        label: m,
        dot: 'bg-amber-500',
        color: 'bg-amber-50 text-amber-700 border-amber-100'
      }));
    }
    return statusColumns;
  };

  // Helper: Get projects for a specific column based on selected boardGrouping
  const getColumnProjects = (columnId) => {
    return filteredProjects.filter(project => {
      if (boardGrouping === 'status') {
        return project.status === columnId;
      }
      if (boardGrouping === 'developer') {
        if (columnId === 'unassigned') {
          return !project.assignedTo;
        }
        return project.assignedTo?.id === columnId || project.assignedTo?._id === columnId;
      }
      if (boardGrouping === 'month') {
        return getProjectMonth(project) === columnId;
      }
      return false;
    });
  };

  // New Project Form State
  const [formData, setFormData] = useState({
    clientName: '',
    service: 'Website Development',
    assignedTo: '',
    deadline: '',
    revenue: '',
    notes: ''
  });

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'admin') {
      fetchProductionUsers();
    }
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await API.get("/projects", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setProjectsData(data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchProductionUsers = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await API.get(`/auth/production-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProductionUsers(res.data || []);
      if (res.data && res.data.length > 0) {
        setFormData(prev => ({ ...prev, assignedTo: res.data[0].id || res.data[0]._id }));
      }
    } catch (err) {
      console.error("Error fetching production users:", err);
    }
  };

  const handleDeleteProject = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProjects();
      if (selectedProject && (selectedProject.id === id || selectedProject._id === id)) {
        setSelectedProject(null);
      }
      alert("Project deleted ✅");
    } catch (err) {
      console.error(err);
      alert("Failed to delete project ❌");
    }
  };

  // Quick Shift status on the board without opening details modal
  const handleQuickShiftStatus = async (project, direction, e) => {
    e.stopPropagation();
    const statuses = ['not-started', 'in-progress', 'review', 'completed'];
    const currentIndex = statuses.indexOf(project.status);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= statuses.length) return;
    const nextStatus = statuses[nextIndex];

    // Prevent non-admin users from moving to 'review' or 'completed' statuses
    if (user?.role !== 'admin' && (nextStatus === 'review' || nextStatus === 'completed')) {
      alert('Only admins can move projects to Review or Completed status.');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await API.patch(`/projects/${project.id || project._id}/status`, {
        status: nextStatus,
        progress: nextStatus === 'completed' ? 100 : (nextStatus === 'not-started' ? 0 : project.progress)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProjects();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

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

  // Open Trello Details Modal and set live states
  const handleOpenDetails = (project) => {
    setSelectedProject(project);
    const parsed = getProjectNotesData(project.notes);
    setModalDescription(parsed.description);
    setModalRevenue(parsed.revenue);
    setModalChecklist(parsed.checklist);
    setModalComments(parsed.comments);
    setModalStatus(project.status);
    setModalProgress(project.progress);
    setModalAssignedTo(project.assignedTo?.id || project.assignedTo?._id || '');
    setNewChecklistItem('');
    setNewComment('');
  };

  // Save updates inside Trello Details Modal
  const handleSaveModalDetails = async () => {
    setSavingDetails(true);
    const token = localStorage.getItem("token");
    const updatedNotes = JSON.stringify({
      description: modalDescription,
      revenue: modalRevenue,
      checklist: modalChecklist,
      comments: modalComments
    });

    try {
      await API.patch(`/projects/${selectedProject.id || selectedProject._id}/status`, {
        status: modalStatus,
        progress: modalProgress,
        notes: updatedNotes,
        assignedTo: modalAssignedTo || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local listing and reset
      const freshProjects = await fetchProjects();
      
      // Find fresh data for currently selected project
      const freshProj = freshProjects.find(p => (p.id || p._id) === (selectedProject.id || selectedProject._id));
      if (freshProj) {
        setSelectedProject(freshProj);
      } else {
        setSelectedProject(prev => ({
          ...prev,
          status: modalStatus,
          progress: modalProgress,
          notes: updatedNotes
        }));
      }

      alert("Changes saved successfully! 💾✅");
    } catch (err) {
      console.error(err);
      alert("Failed to save changes ❌");
    } finally {
      setSavingDetails(false);
    }
  };

  // Checklist Helpers
  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: Date.now(),
      text: newChecklistItem.trim(),
      done: false
    };
    setModalChecklist([...modalChecklist, newItem]);
    setNewChecklistItem('');
  };

  const handleToggleChecklist = (id) => {
    setModalChecklist(modalChecklist.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    ));
  };

  const handleDeleteChecklistItem = (id) => {
    setModalChecklist(modalChecklist.filter(item => item.id !== id));
  };

  // Comment Helpers
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const commentObj = {
      id: Date.now(),
      user: user?.name || 'Team Member',
      text: newComment.trim(),
      date: new Date().toISOString()
    };
    setModalComments([commentObj, ...modalComments]);
    setNewComment('');
  };

  // Direct Project Insertion (Admin Only)
  const handleAddProjectSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName) {
      alert("Please enter client name");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const projectNotes = JSON.stringify({
        description: formData.notes || "",
        revenue: formData.revenue || "",
        checklist: [],
        comments: []
      });

      await API.post("/projects", {
        clientName: formData.clientName,
        service: formData.service,
        assignedTo: formData.assignedTo,
        deadline: formData.deadline,
        notes: projectNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAddModal(false);
      setFormData({
        clientName: '',
        service: 'Website Development',
        assignedTo: productionUsers[0]?.id || productionUsers[0]?._id || '',
        deadline: '',
        revenue: '',
        notes: ''
      });
      fetchProjects();
      alert("New project created successfully! 🚀✅");
    } catch (err) {
      console.error(err);
      alert("Failed to create project ❌");
    }
  };

  // Filtering projects
  const filteredProjects = projectsData.filter((project) => {
    const matchesSearch = 
      (project.clientName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (project.assignedTo?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesService = filterService === 'all' || project.service === filterService;
    return matchesSearch && matchesService;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Sparkles className="text-orange-500 w-7 h-7" />
            Production Board
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage, assign, and track deliverables in a real-time Trello pipeline</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-black/40 p-1 rounded-xl shadow-inner border border-border/50">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'board' ? 'bg-card text-orange-600 shadow-[0_0_15px_rgba(0,0,0,0.5)]' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Board View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-card text-orange-600 shadow-[0_0_15px_rgba(0,0,0,0.5)]' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="w-3.5 h-3.5" />
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 border-none ring-1 ring-border shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by client or team member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-black/20/50"
            />
          </div>
          
          <Select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            options={serviceOptions}
            className="rounded-xl border border-border"
          />
        </div>
      </Card>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <Card className="overflow-hidden border-none ring-1 ring-border shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/20 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Client / Project</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Service</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Assigned To</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Progress</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Revenue</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Deadline</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredProjects.map((project) => {
                  const parsed = getProjectNotesData(project.notes);
                  return (
                    <tr key={project.id || project._id} className="hover:bg-black/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-bold text-foreground">{project.clientName}</p>
                          <span className="text-[10px] text-muted-foreground uppercase font-mono">PROJ-{(project.id || project._id)?.substring(0, 5)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{project.service}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                        <span className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-orange-500/10 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-orange-600 uppercase">
                            {(project.assignedTo?.name || 'U')[0]}
                          </div>
                          {project.assignedTo?.name || "Unassigned"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-black/40 rounded-full h-1.5">
                            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${project.progress}%` }} />
                          </div>
                          <span className="text-xs font-bold text-muted-foreground">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">{parsed.revenue || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground font-medium">
                        {project.deadline ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          project.status === 'completed' ? 'success' :
                          project.status === 'review' ? 'warning' :
                          project.status === 'in-progress' ? 'info' : 'default'
                        }>
                          {project.status.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(project)}
                            className="p-1.5 bg-card border border-border shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-lg text-muted-foreground hover:text-orange-500 hover:border-indigo-100 transition-colors"
                            title="Trello Details Workspace"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              onClick={(e) => handleDeleteProject(project.id || project._id, e)}
                              className="p-1.5 bg-card border border-border shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-lg text-muted-foreground hover:text-rose-600 hover:border-rose-100 transition-colors"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProjects.length === 0 && (
            <div className="py-16 text-center bg-black/20/50">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium text-sm">No production projects found</p>
            </div>
          )}
        </Card>
      ) : (
        /* BOARD VIEW (TRELLO BOARD STYLE WITH DYNAMIC GROUPING) */
        <div className="flex flex-col sm:flex-row gap-5 overflow-y-auto sm:overflow-x-auto pb-4 custom-scrollbar select-none animate-in fade-in duration-300" style={{ minHeight: '65vh' }}>
          {getDynamicColumns().map((column) => {
            const columnProjects = getColumnProjects(column.id);
            
            return (
              <div 
                key={column.id} 
                className="flex-shrink-0 w-80 bg-black/20/70 border border-border/50 rounded-2xl flex flex-col max-h-[70vh] shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/50 bg-card/50 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${column.dot}`} />
                    <span className="text-sm font-bold text-foreground truncate max-w-[180px]">{column.label}</span>
                    <span className="text-xs bg-gray-200/60 text-muted-foreground font-extrabold px-2 py-0.5 rounded-full">
                      {columnProjects.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards (Vertical List) */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {/* Plus card inside lanes for admins */}
                  {user?.role === 'admin' && (
                    boardGrouping === 'status' ? (
                      column.id === 'not-started' && (
                        <div 
                          onClick={() => {
                            setFormData(prev => ({ ...prev, status: 'not-started', assignedTo: productionUsers[0]?.id || productionUsers[0]?._id || '' }));
                            setShowAddModal(true);
                          }}
                          className="border-2 border-dashed border-border hover:border-indigo-400 bg-card/40 hover:bg-card p-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-muted-foreground hover:text-orange-500 transition-all font-bold text-xs"
                        >
                          <Plus size={14} /> Add Card
                        </div>
                      )
                    ) : boardGrouping === 'developer' ? (
                      <div 
                        onClick={() => {
                          setFormData(prev => ({ 
                            ...prev, 
                            assignedTo: column.id === 'unassigned' ? '' : column.id,
                            status: 'not-started'
                          }));
                          setShowAddModal(true);
                        }}
                        className="border-2 border-dashed border-border hover:border-indigo-400 bg-card/40 hover:bg-card p-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-muted-foreground hover:text-orange-500 transition-all font-bold text-xs animate-in fade-in"
                      >
                        <Plus size={14} /> Add Project to {column.label.split(' ')[0]}
                      </div>
                    ) : null
                  )}

                  {columnProjects.map((project) => {
                    const parsed = getProjectNotesData(project.notes);
                    const completedTasks = parsed.checklist?.filter(t => t.done).length || 0;
                    const totalTasks = parsed.checklist?.length || 0;
                    const commentsCount = parsed.comments?.length || 0;

                    return (
                      <div
                        key={project.id || project._id}
                        onClick={() => handleOpenDetails(project)}
                        className="bg-card p-4 rounded-xl border border-border shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-md hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer group flex flex-col gap-3 relative"
                      >
                        {/* Quick Shift buttons on hover (only when grouped by Status) */}
                        {boardGrouping === 'status' && (
                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity z-10 bg-card rounded-lg p-0.5 shadow border border-border">
                            <button
                              onClick={(e) => handleQuickShiftStatus(project, -1, e)}
                              className="p-1 rounded text-muted-foreground hover:text-orange-500 hover:bg-black/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move Left"
                              disabled={column.id === 'not-started' || (project.status === 'completed' && user?.role !== 'admin')}
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <button
                              onClick={(e) => handleQuickShiftStatus(project, 1, e)}
                              className="p-1 rounded text-muted-foreground hover:text-orange-500 hover:bg-black/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move Right"
                              disabled={column.id === 'completed' || (project.status === 'completed' && user?.role !== 'admin')}
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block mb-1">
                            {project.service}
                          </span>
                          <h4 className="text-sm font-bold text-foreground tracking-tight leading-tight group-hover:text-orange-500 transition-colors pr-8">
                            {project.clientName}
                          </h4>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                project.status === 'completed' ? 'bg-emerald-500' : 'bg-orange-500'
                              }`} 
                              style={{ width: `${project.progress}%` }} 
                            />
                          </div>
                        </div>

                        {/* Metadata Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-[10px] font-bold text-muted-foreground">
                          {project.deadline && (
                            <span className="flex items-center gap-1 text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">
                              <Calendar size={11} />
                              {new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}

                          {parsed.revenue && (
                            <span className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-extrabold text-[11px]">
                              💰 {parsed.revenue}
                            </span>
                          )}

                          <span className="flex items-center gap-1 text-muted-foreground font-bold bg-black/20 border border-border px-1.5 py-0.5 rounded uppercase">
                            <User size={11} className="text-muted-foreground" />
                            {project.assignedTo?.name ? project.assignedTo.name.split(' ')[0] : 'Unassigned'}
                          </span>
                        </div>

                        {/* Task Checklist & Comments Indicators */}
                        {(totalTasks > 0 || commentsCount > 0) && (
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold">
                            {totalTasks > 0 && (
                              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${completedTasks === totalTasks ? 'bg-emerald-50 text-emerald-600 font-extrabold border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                <CheckSquare size={11} />
                                {completedTasks}/{totalTasks}
                              </span>
                            )}
                            {commentsCount > 0 && (
                              <span className="flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-100 px-1.5 py-0.5 rounded">
                                <MessageSquare size={11} />
                                {commentsCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {columnProjects.length === 0 && (
                    <div className="py-10 text-center border-2 border-dashed border-border rounded-xl bg-card/30 text-muted-foreground text-xs italic">
                      No projects here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COMPACT PROJECT DETAILS MODAL */}
      {selectedProject && (
        <Modal 
          isOpen={!!selectedProject} 
          onClose={() => setSelectedProject(null)} 
          title={`Project Details: ${selectedProject.clientName}`}
          size="md"
        >
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Completed By Banner */}
            {selectedProject.status === 'completed' && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-between shadow-[0_0_15px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-300">
                <span className="flex items-center gap-1.5">🎉 Completed by: <span className="underline font-black text-emerald-950">{selectedProject.assignedTo?.name || 'Unassigned'}</span></span>
                <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)]">Verified</span>
              </div>
            )}

            {/* Locked Completed Project Warning Banner */}
            {selectedProject.status === 'completed' && user?.role !== 'admin' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-1 duration-300">
                <span>🔒 This project is completed and locked. Non-admin members cannot edit completed projects.</span>
              </div>
            )}

            {/* Grid for Quick Stats & Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Service Type */}
              <div className="p-3 bg-black/20 border border-border rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Service Type</span>
                <span className="text-xs font-bold text-foreground uppercase bg-card border border-border/50 px-2 py-0.5 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] inline-block">
                  {selectedProject.service}
                </span>
              </div>

              {/* Target Deadline */}
              <div className="p-3 bg-black/20 border border-border rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Target Deadline</span>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] inline-flex items-center gap-1">
                  <Calendar size={12} />
                  {selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
                </span>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1.5">Project Status</label>
                <select 
                  value={modalStatus}
                  onChange={(e) => {
                    setModalStatus(e.target.value);
                    if (e.target.value === 'completed') setModalProgress(100);
                  }}
                  disabled={selectedProject.status === 'completed' && user?.role !== 'admin'}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs font-bold text-muted-foreground bg-card focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:bg-black/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                  {statusOptions
                    .filter(opt => {
                      if (user?.role !== 'admin' && (opt.value === 'review' || opt.value === 'completed')) {
                        return false;
                      }
                      return true;
                    })
                    .map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
              </div>

              {/* Assigned Developer */}
              <div>
                <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1.5">Assigned Team Member</label>
                {user?.role === 'admin' ? (
                  <select
                    value={modalAssignedTo}
                    onChange={(e) => setModalAssignedTo(e.target.value)}
                    disabled={selectedProject.status === 'completed'}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs font-bold text-muted-foreground bg-card focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:bg-black/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
                  >
                    <option value="">Unassigned</option>
                    {productionUsers.map(u => (
                      <option key={u.id || u._id} value={u.id || u._id}>{u.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-foreground bg-black/20 border border-border p-2 rounded-xl">
                    <div className="w-4 h-4 rounded-full bg-orange-500/10 text-[9px] font-bold text-orange-600 flex items-center justify-center border border-indigo-100 uppercase">
                      {(selectedProject.assignedTo?.name || 'U')[0]}
                    </div>
                    {selectedProject.assignedTo?.name || "Unassigned"}
                  </span>
                )}
              </div>



              {/* Progress Slider */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground mb-1.5">
                  <span>Overall Progress</span>
                  <span className="font-extrabold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">{modalProgress}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={modalProgress}
                    onChange={(e) => setModalProgress(Number(e.target.value))}
                    disabled={selectedProject.status === 'completed' && user?.role !== 'admin'}
                    className="flex-1 accent-indigo-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

            </div>

            {/* Editable Description / Requirements Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Project Description & Requirements</label>
              <Textarea
                placeholder="Enter detailed project requirements, client brief, or specifications..."
                value={modalDescription}
                onChange={(e) => setModalDescription(e.target.value)}
                disabled={selectedProject.status === 'completed' && user?.role !== 'admin'}
                className="min-h-[120px] text-xs bg-black/20/50 border-border focus:bg-card rounded-xl resize-none p-3 outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed font-medium disabled:bg-black/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
              />
            </div>

            {/* Action Buttons Panel */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-border">
              <Button 
                onClick={handleSaveModalDetails} 
                disabled={savingDetails || (selectedProject.status === 'completed' && user?.role !== 'admin')}
                className="flex-1 bg-orange-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center gap-1 hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                {selectedProject.status === 'completed' && user?.role !== 'admin' ? 'Locked (Completed) 🔒' : (savingDetails ? 'Saving Changes...' : 'Save Updates 💾')}
              </Button>

              <Button
                onClick={() => navigate(`/production/projects/${selectedProject.id || selectedProject._id}`)}
                variant="outline"
                className="flex-1 border-border text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10/50 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
              >
                Go to Workspace 🚀
              </Button>

              {user?.role === 'admin' && (
                <Button
                  onClick={(e) => handleDeleteProject(selectedProject.id || selectedProject._id, e)}
                  variant="danger"
                  className="px-4 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1"
                >
                  <Trash2 size={13} /> Delete
                </Button>
              )}
            </div>

          </div>
        </Modal>
      )}

      {/* ADMIN DIRECT PROJECT CREATION MODAL */}
      {showAddModal && (
        <Modal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          title="Create New Production Project"
          size="md"
        >
          <form onSubmit={handleAddProjectSubmit} className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            <Input 
              label="Client / Project Name" 
              placeholder="e.g. Afzal Graphics Deal"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              required
              className="rounded-xl border-border"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select 
                label="Deliverable Service"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                options={serviceOptions.filter(o => o.value !== 'all')}
                className="rounded-xl border-border"
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Assign To Team Member</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-card"
                  required
                >
                  <option value="" disabled>Select Team Member</option>
                  {productionUsers.map(u => (
                    <option key={u.id || u._id} value={u.id || u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Target Deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="rounded-xl border-border"
              />

              <Input 
                label="Project Budget / Revenue"
                placeholder="e.g. $150"
                value={formData.revenue}
                onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                className="rounded-xl border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Initial Project Description / Notes</label>
              <textarea
                placeholder="Write initial project notes or specifications..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl border-border text-xs py-2">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-orange-500 text-white text-xs font-bold py-2 px-5">
                Launch Project 🚀
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
