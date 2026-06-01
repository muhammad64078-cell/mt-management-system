import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, LoadingSpinner, Input } from '../components/ui';
import { ArrowLeft, Upload, FileText, CheckCircle2, MessageSquare, Trash2, Paperclip, X, Download, Send, Link, Eye } from 'lucide-react';

// URL ko automatically detect karke clickable link banata hai
const renderMessageWithLinks = (text, isMine) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer"
        className={`underline underline-offset-2 font-bold break-all hover:opacity-80 transition-opacity ${isMine ? 'text-indigo-200' : 'text-orange-500'}`}>
        {part}
      </a>
    ) : (<span key={i}>{part}</span>)
  );
};


const statusColors = {
  'not-started': 'default',
  'in-progress': 'info',
  'review': 'warning',
  'completed': 'success'
};

const projectTasks = [
  { id: 1, name: 'Initial Design Mockups', progress: 100, status: 'completed' },
  { id: 2, name: 'Client Feedback Round 1', progress: 100, status: 'completed' },
  { id: 3, name: 'Design Revisions', progress: 75, status: 'in-progress' },
  { id: 4, name: 'Final Deliverables', progress: 30, status: 'in-progress' },
  { id: 5, name: 'Client Approval', progress: 0, status: 'pending' }
];

const projectFiles = [
  { id: 1, name: 'Brand_Guidelines.pdf', size: '3.2 MB', uploadedBy: 'Alex Designer', date: '2026-04-07' },
  { id: 2, name: 'Logo_Variations.ai', size: '5.8 MB', uploadedBy: 'Alex Designer', date: '2026-04-06' },
  { id: 3, name: 'Marketing_Assets.zip', size: '12.4 MB', uploadedBy: 'Alex Designer', date: '2026-04-05' },
  { id: 4, name: 'Client_Brief.docx', size: '892 KB', uploadedBy: 'Sarah Sales', date: '2026-04-02' }
];

const projectRevisions = [
  {
    id: 1,
    round: 'Revision 2',
    date: '2026-04-07',
    feedback: 'Please adjust the color scheme to match brand guidelines. Logo needs to be more minimalist.',
    status: 'in-progress',
    submittedBy: 'Client'
  },
  {
    id: 2,
    round: 'Revision 1',
    date: '2026-04-05',
    feedback: 'Initial mockups look great! Minor adjustments needed on typography.',
    status: 'completed',
    submittedBy: 'Client'
  }
];

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [localStatus, setLocalStatus] = useState('');
  const [localProgress, setLocalProgress] = useState(0);
  const [updating, setUpdating] = useState(false);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [chatFile, setChatFile] = useState(null);
  const [chatFilePreview, setChatFilePreview] = useState(null);
  const [sendingComment, setSendingComment] = useState(false);
  const messagesEndRef = useRef(null);
  const chatFileInputRef = useRef(null);

  const handleChatFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setChatFile(file);
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      setChatFilePreview(URL.createObjectURL(file));
    } else {
      setChatFilePreview(null);
    }
  };

  const clearChatFile = () => {
    setChatFile(null);
    setChatFilePreview(null);
    if (chatFileInputRef.current) chatFileInputRef.current.value = '';
  };

  const [tasks, setTasks] = useState([]);
  const [taskData, setTaskData] = useState({ name: "", assignedTo: "" });
  const [usersList, setUsersList] = useState([]);
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTasks();
      const fetchComments = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await API.get(`/comments/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setComments(res.data);
        } catch (err) {
          console.log(err);
        }
      };
      fetchComments();
      const interval = setInterval(fetchComments, 5000);
      return () => clearInterval(interval);
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSendComment = async () => {
    if (!newComment.trim() && !chatFile) return;
    try {
      setSendingComment(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('projectId', id);
      formData.append('message', newComment);
      if (chatFile) formData.append('file', chatFile);

      const res = await API.post("/comments", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setComments([...comments, res.data]);
      setNewComment("");
      clearChatFile();
    } catch (err) {
      console.log(err);
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Is message ko permanently delete karna chahte hain?")) return;
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.log("Delete failed:", err);
      alert("Delete nahi ho saka ❌");
    }
  };

  const handleDeleteFile = async (fileUrl) => {
    if (!window.confirm("Is file ko delete karna chahte hain?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await API.delete(`/projects/${id}/files`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { fileUrl }
      });
      // Update project state with updated files
      setProject(res.data);
    } catch (err) {
      console.log("Delete file failed:", err);
      alert("File delete nahi ho saki ❌");
    }
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert("Link copy ho gaya! 📋");
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.log("Download failed:", err);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const addTask = async () => {
    if (!taskData.name.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/tasks", {
        projectId: id,
        name: taskData.name,
        assignedTo: taskData.assignedTo || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks([res.data, ...tasks]);
      setTaskData({ name: "", assignedTo: "" });
    } catch (err) {
      console.log(err);
    }
  };

  const updateTask = async (taskId, status, progress, clientStatus) => {
    try {
      const token = localStorage.getItem("token");
      const payload = {};
      if (status !== undefined) payload.status = status;
      if (progress !== undefined) payload.progress = progress;
      if (clientStatus !== undefined) payload.clientStatus = clientStatus;

      const res = await API.put(`/tasks/${taskId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasks.map((task) => task.id === taskId ? res.data : task));
    } catch (err) {
      console.log(err);
    }
  };

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(res.data);
      setLocalStatus(res.data.status);
      setLocalProgress(res.data.progress);
    } catch (err) {
      console.error("Failed to fetch project details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    const fetchAllProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllProjects(res.data);
      } catch (err) {
        console.error("Failed to fetch all projects", err);
      }
    };
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get('/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsersList(res.data.filter(u => u.role === 'production'));
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchAllProjects();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [id, user?.role]);

  const handleSaveUpdate = async () => {
    try {
      setUpdating(true);
      const token = localStorage.getItem("token");
      await API.patch(
        `/projects/${id}/status`,
        { status: localStatus, progress: localProgress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProject(); // Refresh data
      alert("Project updated successfully! ✅");
    } catch (err) {
      console.error("Failed to update project", err);
      alert("Error updating project ❌");
    } finally {
      setUpdating(false);
    }
  };

  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUpdating(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      await API.post(
        `/projects/${id}/upload`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data" 
          } 
        }
      );
      fetchProject(); // Refresh data to get the new files array
      alert("File uploaded successfully! ✅");
    } catch (err) {
      console.error("Failed to upload file", err);
      alert("Error uploading file ❌");
    } finally {
      setUpdating(false);
      // Reset input
      if (event.target) event.target.value = '';
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };






















  if (loading) return <LoadingSpinner size="lg" />;

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button onClick={() => navigate('/production/projects')} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'chat', label: 'Internal Chat', icon: MessageSquare }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/production/projects')}
            className="mr-4 text-muted-foreground hover:text-muted-foreground transition-colors bg-card p-2 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{project.clientName}</h1>
            <p className="text-sm font-medium text-muted-foreground flex flex-wrap items-center gap-2">
              <span>{project.service} Project</span>
              {project.status === 'completed' && (
                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shadow-[0_0_15px_rgba(0,0,0,0.5)] inline-flex items-center gap-1 text-[11px] uppercase tracking-wide">
                  🎉 Completed by {project.assignedTo?.name || 'Unassigned'}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusColors[project.status]} className="w-fit">
            {project.status.replace('-', ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview */}
          <Card className="p-6 border-none ring-1 ring-border bg-card">
            <h3 className="text-lg font-bold text-foreground mb-6">Project Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Service Type</p>
                <p className="text-sm font-bold text-foreground">{project.service}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Assigned To</p>
                <p className="text-sm font-bold text-foreground">{project.assignedTo?.name || "Unassigned"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Assignment Date</p>
                <p className="text-sm font-bold text-foreground">
                  {project.createdAt 
                    ? new Date(project.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) 
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Deadline</p>
                <p className="text-sm font-bold text-red-600">{project.deadline ? new Date(project.deadline).toLocaleDateString() : "No deadline"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Priority</p>
                <Badge variant={project.priority === 'high' ? 'danger' : project.priority === 'medium' ? 'warning' : 'default'}>
                  {project.priority || "Medium"}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Overall Progress</p>
                <div className="flex items-center">
                  <div className="w-full bg-black/40 rounded-full h-2 mr-3">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-foreground">{project.progress}%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Card className="overflow-hidden border-none ring-1 ring-border bg-card shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            {/* Tab Headers */}
            <div className="border-b border-border bg-black/20/50 overflow-x-auto custom-scrollbar">
              <div className="flex min-w-max">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center px-6 py-4 text-sm font-bold transition-all
                      ${activeTab === tab.id
                        ? 'border-b-2 border-indigo-600 text-orange-500 bg-card shadow-inner'
                        : 'text-muted-foreground hover:text-muted-foreground'
                      }
                    `}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>






            {/* Tab Content */}
            <div className="p-6">
              {/* Tasks Tab */}
              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  {/* Task Addition Form (Admins Only) */}
                  {user?.role === 'admin' && (
                    <Card className="p-5 border border-border bg-black/20/30 shadow-none">
                      <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-orange-500" />
                        Create New Task
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          placeholder="Task name (e.g., Wireframe design)"
                          value={taskData.name}
                          onChange={(e) =>
                            setTaskData({
                              ...taskData,
                              name: e.target.value,
                            })
                          }
                          className="bg-card border-border"
                        />
                        <select
                          className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
                          value={taskData.assignedTo}
                          onChange={(e) => setTaskData({ ...taskData, assignedTo: e.target.value })}
                        >
                          <option value="">Assign to (Optional)</option>
                          {usersList.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button
                          onClick={addTask}
                          disabled={!taskData.name.trim()}
                          size="sm"
                          className="bg-orange-500 text-white hover:bg-orange-600 font-bold px-5 py-2 rounded-xl transition-all"
                        >
                          Add Task
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Tasks List */}
                  <div className="space-y-4">
                    {tasks.map((task, index) => (
                      <div
                        key={task.id || task._id}
                        className="p-5 bg-card border border-border rounded-2xl group hover:shadow-md hover:ring-1 hover:ring-indigo-100 transition-all duration-300"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div className="flex items-start">
                            <button
                              onClick={() => {
                                if (user?.role !== 'admin') return;
                                const newStatus = task.status === 'completed' ? 'in-progress' : 'completed';
                                const newProgress = newStatus === 'completed' ? 100 : 50;
                                updateTask(task.id || task._id, newStatus, newProgress);
                              }}
                              className={`mr-3.5 mt-0.5 focus:outline-none ${user?.role !== 'admin' ? 'cursor-not-allowed opacity-50' : ''}`}
                              disabled={user?.role !== 'admin'}
                            >
                              <CheckCircle2
                                className={`w-5 h-5 transition-all ${
                                  task.status === 'completed'
                                    ? 'text-emerald-500 fill-emerald-50 shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                                    : 'text-gray-300 hover:text-indigo-500'
                                }`}
                              />
                            </button>
                            <div>
                              <h4 className={`text-sm font-bold text-foreground flex items-center gap-2 ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                <span className="text-xs text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md mr-1">Task {tasks.length - index}</span>
                                {task.name}
                                {task.assignedTo && (
                                  <Badge variant="outline" className="text-[10px] bg-black/20 text-muted-foreground border-border px-1 py-0">
                                    {task.assignedTo.name}
                                  </Badge>
                                )}
                              </h4>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 ml-8 sm:ml-0">
                            {user?.role === 'admin' && (
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {task.status !== 'in-progress' && task.status !== 'completed' && (
                                  <button
                                    onClick={() => updateTask(task.id || task._id, 'in-progress', 50)}
                                    className="text-[11px] font-bold text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-lg transition-colors"
                                  >
                                    Start Task
                                  </button>
                                )}
                                {task.status !== 'completed' && (
                                  <button
                                    onClick={() => updateTask(task.id || task._id, 'completed', 100)}
                                    className="text-[11px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                                  >
                                    Complete Task
                                  </button>
                                )}
                                {task.status !== 'not-started' && (
                                  <button
                                    onClick={() => updateTask(task.id || task._id, 'not-started', 0)}
                                    className="text-[11px] font-bold text-muted-foreground bg-black/20 hover:bg-black/40 px-2.5 py-1 rounded-lg transition-colors"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Client Approval Toggles (Admins only) */}
                            {user?.role === 'admin' && (
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-2 border-r border-border pr-2">
                                <button
                                  onClick={() => updateTask(task.id || task._id, undefined, undefined, 'approved')}
                                  className="text-[11px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors"
                                  title="Approve for Client"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateTask(task.id || task._id, undefined, undefined, 'rejected')}
                                  className="text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors"
                                  title="Reject for Client"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => updateTask(task.id || task._id, undefined, undefined, 'pending')}
                                  className="text-[11px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors"
                                >
                                  Pending
                                </button>
                              </div>
                            )}

                            <div className="flex flex-col items-end gap-1">
                              <Badge
                                variant={
                                  task.status === 'completed'
                                    ? 'success'
                                    : task.status === 'in-progress' || task.status === 'in progress'
                                    ? 'info'
                                    : 'default'
                                }
                                className="capitalize font-bold text-[10px]"
                              >
                                {task.status ? task.status.replace('-', ' ') : 'not started'}
                              </Badge>

                              {/* Client Status Badge */}
                              <Badge
                                variant={
                                  task.client_status === 'approved'
                                    ? 'success'
                                    : task.client_status === 'rejected'
                                    ? 'destructive'
                                    : 'warning'
                                }
                                className="capitalize font-bold text-[9px] px-1.5 py-0"
                              >
                                Client: {task.client_status || 'pending'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="ml-8">
                          <div className="flex items-center">
                            <div className="w-full bg-black/40 rounded-full h-1.5 mr-3 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  task.status === 'completed'
                                    ? 'bg-emerald-500'
                                    : 'bg-orange-500'
                                }`}
                                style={{ width: `${task.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground min-w-[24px] text-right">
                              {task.progress || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {tasks.length === 0 && (
                      <div className="text-center py-12 bg-black/20/50 rounded-2xl border border-dashed border-border">
                        <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-foreground">No Tasks Created Yet</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[280px] mx-auto">
                          Create some tasks to track the implementation and delivery milestones.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Files Tab */}
              {activeTab === 'files' && (
                <div className="space-y-3">
                  <div className="mb-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button 
                      onClick={triggerUpload} 
                      disabled={project.status === 'completed' && user?.role !== 'admin'}
                      size="sm" 
                      className={`font-bold px-4 py-2 rounded-xl flex items-center ${project.status === 'completed' && user?.role !== 'admin' ? 'bg-gray-300 text-muted-foreground cursor-not-allowed border-none' : 'bg-orange-500 text-white'}`}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {project.status === 'completed' && user?.role !== 'admin' ? 'Upload Locked' : 'Upload Delivering'}
                    </Button>
                  </div>
                  {project.files?.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-black/20 rounded-2xl hover:bg-card hover:ring-1 hover:ring-border transition-all group"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mr-4 text-orange-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-foreground truncate" title={file.name || file.url}>{file.name || file.url.split('/').pop()}</p>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">
                             Uploaded by {file.uploaded_by || file.uploadedBy || 'Unknown'} • {new Date(file.created_at || file.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={file.url} target="_blank" rel="noopener noreferrer" title="View File">
                          <Button size="sm" variant="ghost" className="text-orange-500 font-bold hover:bg-orange-500/10 p-2 rounded-lg flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </Button>
                        </a>
                        <Button
                          onClick={() => handleDownload(file.url, file.name)}
                          size="sm"
                          variant="ghost"
                          className="text-green-600 font-bold hover:bg-green-50 p-2 rounded-lg flex items-center gap-1"
                          title="Download File"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </Button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteFile(file.url)}
                            className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete File (Admin Only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!project.files || project.files.length === 0) && (
                    <p className="text-center py-10 text-muted-foreground">No source files uploaded yet.</p>
                  )}
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-[500px] bg-black/20 rounded-2xl border border-border overflow-hidden shadow-inner">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {comments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className={`flex flex-col group ${comment.sender_name === user?.name ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 mb-1.5 px-1">
                            <span className="text-xs font-bold text-muted-foreground">{comment.sender_name}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${comment.sender_role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-orange-500/20 text-orange-600'}`}>
                              {comment.sender_role}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {/* Admin delete button */}
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="opacity-0 group-hover:opacity-100 ml-1 p-1 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                title="Delete message (Admin only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className={`rounded-2xl max-w-[85%] sm:max-w-[75%] shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden ${
                            comment.sender_name === user?.name
                              ? 'bg-orange-500 text-white rounded-tr-sm'
                              : 'bg-card border border-border text-foreground rounded-tl-sm'
                          }`}>
                            {comment.file_type === 'image' && comment.file_url && (
                              <div>
                                <a href={comment.file_url} target="_blank" rel="noopener noreferrer">
                                  <img src={comment.file_url} alt={comment.file_name || 'image'} className="max-w-full max-h-[280px] object-cover w-full" />
                                </a>
                                <a href={comment.file_url} download={comment.file_name}
                                  className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold border-t hover:opacity-80 transition-opacity ${comment.sender_name === user?.name ? 'text-indigo-200 border-indigo-500' : 'text-indigo-500 border-border'}`}>
                                  <Download className="w-3 h-3" />
                                  Download
                                </a>
                              </div>
                            )}
                            {comment.file_type === 'video' && comment.file_url && (
                              <div>
                                <video controls className="max-w-full max-h-[240px] w-full bg-black">
                                  <source src={comment.file_url} />
                                </video>
                                <a href={comment.file_url} download={comment.file_name}
                                  className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold border-t hover:opacity-80 transition-opacity ${comment.sender_name === user?.name ? 'text-indigo-200 border-indigo-500' : 'text-indigo-500 border-border'}`}>
                                  <Download className="w-3 h-3" />
                                  Download Video
                                </a>
                              </div>
                            )}
                            {comment.file_type === 'file' && comment.file_url && (
                              <a href={comment.file_url} download={comment.file_name} target="_blank" rel="noopener noreferrer"
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold hover:opacity-80 transition-opacity ${comment.sender_name === user?.name ? 'text-indigo-100' : 'text-orange-500'}`}>
                                <Download className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate max-w-[180px]">{comment.file_name || 'Download File'}</span>
                              </a>
                            )}
                            {comment.message && (
                              <p className="text-sm font-medium leading-relaxed px-3.5 py-3 break-words">
                                {renderMessageWithLinks(comment.message, comment.sender_name === user?.name)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  {chatFile && (
                    <div className="px-4 py-2 bg-orange-500/10 border-t border-indigo-100 flex items-center gap-3">
                      {chatFilePreview && chatFile.type.startsWith('image/') && (
                        <img src={chatFilePreview} alt="preview" className="w-12 h-12 object-cover rounded-lg border border-indigo-200" />
                      )}
                      {chatFilePreview && chatFile.type.startsWith('video/') && (
                        <video src={chatFilePreview} className="w-16 h-12 object-cover rounded-lg border border-indigo-200" />
                      )}
                      {!chatFilePreview && (
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-orange-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-indigo-800 truncate">{chatFile.name}</p>
                        <p className="text-[10px] text-indigo-500">{(chatFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={clearChatFile} className="text-indigo-400 hover:text-orange-600 p-1 rounded transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="p-4 bg-card border-t border-border">
                    <div className="flex items-center gap-2">
                      <input type="file" ref={chatFileInputRef} className="hidden"
                        accept="image/*,video/*,.pdf,.doc,.docx,.zip,.rar,.ai,.psd,.xls,.xlsx"
                        onChange={handleChatFileSelect} />
                      <button onClick={() => chatFileInputRef.current?.click()}
                        className="p-2.5 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all flex-shrink-0"
                        title="Attach file, image or video">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          const link = prompt("Link paste karein (e.g. https://example.com):");
                          if (link && link.startsWith('http')) {
                            setNewComment(prev => (prev ? prev + ' ' : '') + link);
                          } else if (link) {
                            setNewComment(prev => (prev ? prev + ' ' : '') + 'https://' + link);
                          }
                        }}
                        className="p-2.5 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all flex-shrink-0"
                        title="Link add karein">
                        <Link className="w-5 h-5" />
                      </button>
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-black/20 border-border focus:bg-card focus:ring-2 focus:ring-indigo-500/20 text-sm py-2.5 rounded-xl transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
                      />
                      <Button
                        onClick={handleSendComment}
                        disabled={(!newComment.trim() && !chatFile) || sendingComment}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center gap-2 flex-shrink-0 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                        {sendingComment ? '...' : 'Send'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>













        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="p-6 border-none ring-1 ring-border bg-card shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-bold text-foreground mb-6">Execution Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Asset Files</span>
                <span className="text-sm font-bold text-foreground">{project.files?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Revisions</span>
                <span className="text-sm font-bold text-foreground">{project.revisions || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Task Completion</span>
                <span className="text-sm font-bold text-foreground">
                  {tasks.filter(t => t.status === 'completed').length} / {tasks.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Time Left</span>
                <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    {project.deadline ? Math.max(0, Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24))) : 0} Days
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}


          {user?.role === 'admin' && (
          <Card className="p-6 border-none ring-1 ring-border bg-card shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-bold text-foreground mb-4">Phase Control</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Status</label>
                <select 
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-border bg-black/20 rounded-xl text-sm font-bold text-muted-foreground outline-none ring-2 ring-transparent focus:ring-indigo-500 transition-all"
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Update Progress (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={localProgress}
                  onChange={(e) => setLocalProgress(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-black/20 border border-border rounded-lg text-sm font-bold"
                />
              </div>

              <Button 
                onClick={handleSaveUpdate} 
                disabled={updating}
                className="w-full bg-orange-500 text-white font-bold py-2.5 rounded-xl text-sm mt-2 disabled:bg-gray-300 disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                {updating ? 'Saving...' : 'Save Updates'}
              </Button>
            </div>
          </Card>
          )}
          {/* Quick Switch / Recent Projects */}
          <Card className="p-6 border-none ring-1 ring-border bg-card shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-bold text-foreground mb-4">Quick Switch</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {allProjects.map((p) => (
                <button
                  key={p.id || p._id}
                  onClick={() => navigate(`/production/projects/${p.id || p._id}`)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between group
                    ${(p.id || p._id) === id 
                      ? 'bg-orange-500/10 text-orange-600 font-bold border border-indigo-100 shadow-[0_0_15px_rgba(0,0,0,0.5)]' 
                      : 'text-muted-foreground hover:bg-black/20 hover:text-orange-500'
                    }
                  `}
                >
                  <span className="truncate">{p.clientName}</span>
                  {(p.id || p._id) === id && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(79,70,229,0.6)]" />}
                </button>
              ))}
              {allProjects.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">No other projects found.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
