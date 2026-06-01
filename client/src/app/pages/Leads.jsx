import { useState, useEffect } from 'react';
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Badge, LoadingSpinner } from '../components/ui';
import { Modal } from '../components/Modal';
import { Search, Plus, Eye, Edit2, Trash2, Calendar, User, LayoutGrid, List, MessageCircle, Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { format, getDate } from 'date-fns';

const statusColors = {
  new: 'default',
  discussing: 'info',
  proposal: 'warning',
  negotiation: 'purple',
  'closed-won': 'success',
  'closed-lost': 'danger',
  'complete': 'success'
};

const statusLabels = {
  new: 'New',
  discussing: 'Discussing',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  'closed-won': 'Working/Revision',
  'closed-lost': 'Closed Lost',
  'complete': 'Completed'
};

const serviceOptions = [
  { value: 'all', label: 'All Services' },
  { value: 'Website Development', label: 'Website Development' },
  { value: 'Graphic Design', label: 'Graphic Design' },
  { value: 'Video Editing', label: 'Video Editing' }
];

const sourceOptions = [
  { value: 'Upwork', label: 'Upwork' },
  { value: 'Fiverr', label: 'Fiverr' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Cold Outreach', label: 'Cold Outreach' },
  { value: 'Local', label: 'Local' },
  { value: 'Website', label: 'Website' },
  { value: 'Referral', label: 'Referral' }
];

const countryOptions = [
  { value: 'USA', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Pakistan', label: 'Pakistan' },
  { value: 'UAE', label: 'United Arab Emirates' },
  { value: 'India', label: 'India' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
  { value: 'Turkey', label: 'Turkey' },
  { value: 'China', label: 'China' },
  { value: 'Global', label: 'Global / Other' }
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'discussing', label: 'Discussing' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed-won', label: 'Working/Revision' },
  { value: 'closed-lost', label: 'Closed Lost' },
  { value: 'complete', label: 'Completed' }
];

export const Leads = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 🔥 State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewType, setViewType] = useState('table'); // 'table' or 'grouped'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [assignModal, setAssignModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [assignData, setAssignData] = useState({
    assignedTo: "",
    service: "",
    deadline: ""
  });

  const [productionUsers, setProductionUsers] = useState([]);
  const [formData, setFormData] = useState({
    clientName: '',
    company: '',
    country: '',
    contactPerson: '',
    email: '',
    phone: '',
    service: 'Website Development',
    budget: '',
    deadline: '',
    status: 'new',
    source: 'Upwork',
    notes: ''
  });

  // 🔥 Fetch Leads
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/leads`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLeads(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  useEffect(() => {
    const fetchProductionUsers = async () => {
      if (user?.role !== 'admin') return;
      const token = localStorage.getItem("token");
      try {
        const res = await API.get(`/auth/production-users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProductionUsers(res.data);
      } catch (err) {
        console.error("Error fetching production users:", err);
      }
    };
    fetchProductionUsers();
  }, [user]);

  // Filter Logic
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesService =
      filterService === 'all' || lead.service === filterService;

    const matchesStatus =
      filterStatus === 'all' || lead.status === filterStatus;

    return matchesSearch && matchesService && matchesStatus;
  });

  if (loading) return <LoadingSpinner size="lg" />;

  const handleAddLead = () => {
    setEditingLead(null);
    setFormData({
      clientName: '', company: '', country: '', contactPerson: '', email: '', phone: '',
      service: 'Website Development', budget: '', deadline: '',
      status: 'new', source: 'Upwork', notes: ''
    });
    setShowAddModal(true);
  };

  const handleEditLead = (lead) => {
    setEditingLead(lead);
    setFormData({
      clientName: lead.clientName || lead.client_name || '',
      company: lead.company || '',
      country: lead.country || '',
      contactPerson: lead.contactPerson || lead.contact_person || '',
      email: lead.email || '',
      phone: lead.phone || '',
      service: lead.service || 'Website Development',
      budget: lead.budget || '',
      deadline: lead.deadline || '',
      status: lead.status || 'new',
      source: lead.source || 'Upwork',
      notes: lead.notes || ''
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("FORM DATA BEING SENT TO BACKEND:", formData);
    try {
      const token = localStorage.getItem("token");
      let res;

      if (editingLead) {
        res = await API.put(
          `/leads/${editingLead.id || editingLead._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLeads(leads.map(l => (l.id || l._id) === (editingLead.id || editingLead._id) ? res.data : l));
      } else {
        res = await API.post(
          `/leads`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLeads([res.data, ...leads]);
      }

      setShowAddModal(false);
    } catch (error) {
      console.error("Error saving lead:", error);
      alert("Failed to save lead. Please check your data.");
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/leads/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(leads.filter(l => (l.id || l._id) !== id));
    } catch (error) {
      console.error("Error deleting lead:", error);
      alert("Failed to delete lead.");
    }
  };

  const handleAssignToProduction = (lead) => {
    setSelectedLead(lead);
    setAssignData({
      assignedTo: "",
      service: lead.service,
      deadline: lead.deadline || ""
    });
    setAssignModal(true);
  };

  const convertLeadToProject = async () => {
    try {
      const token = localStorage.getItem("token");
      await API.post(
        `/projects/from-lead`,
        {
          leadId: selectedLead.id || selectedLead._id,
          assignedTo: assignData.assignedTo,
          service: assignData.service,
          deadline: assignData.deadline,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Project created & assigned!");
      setAssignModal(false);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to assign project");
    }
  };

  const groupLeadsByDay = (leadsList) => {
    const groups = {};
    leadsList.forEach(lead => {
      const date = new Date(lead.created_at || lead.createdAt);
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayLabel = `Day ${getDate(date)}`;
      const monthLabel = format(date, 'MMMM yyyy');
      const salesperson = lead.createdBy?.name || 'Unassigned';

      if (!groups[dateKey]) {
        groups[dateKey] = {
          dayLabel,
          monthLabel,
          salespeople: {}
        };
      }

      if (!groups[dateKey].salespeople[salesperson]) {
        groups[dateKey].salespeople[salesperson] = [];
      }
      groups[dateKey].salespeople[salesperson].push(lead);
    });
    return groups;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track your primary sales opportunities.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-black/40 p-1 rounded-lg">
            <button
              onClick={() => setViewType('table')}
              className={`p-2 rounded-md transition-all ${viewType === 'table' ? 'bg-card shadow-[0_0_15px_rgba(0,0,0,0.5)] text-orange-500' : 'text-muted-foreground hover:text-muted-foreground'}`}
              title="Table View"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewType('grouped')}
              className={`p-2 rounded-md transition-all ${viewType === 'grouped' ? 'bg-card shadow-[0_0_15px_rgba(0,0,0,0.5)] text-orange-500' : 'text-muted-foreground hover:text-muted-foreground'}`}
              title="Day-wise View"
            >
              <LayoutGrid size={20} />
            </button>
          </div>
          <Button onClick={handleAddLead} className="shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <Card className="p-6 border-none ring-1 ring-border shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Quick search by name, company, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/20 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
  <Select
    value={filterService}
    onValueChange={(value) => setFilterService(value)}
  >
    <SelectTrigger>
      <SelectValue placeholder="Filter Service" />
    </SelectTrigger>

    <SelectContent>
      {serviceOptions.map((option) => (
        <SelectItem
          key={option.value}
          value={option.value}
        >
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

<div>
  <Select
    value={filterStatus}
    onValueChange={(value) => setFilterStatus(value)}
  >
    <SelectTrigger>
      <SelectValue placeholder="Filter Status" />
    </SelectTrigger>

    <SelectContent>
      {statusOptions.map((option) => (
        <SelectItem
          key={option.value}
          value={option.value}
        >
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
        </div>
      </Card>

      {viewType === 'table' ? (
        <Card className="overflow-hidden border-none ring-1 ring-border shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/20 border-b border-border">
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Client / Company</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Contact</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Source</th>
                  {user?.role === 'admin' && <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Added By</th>}
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Status</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id || lead._id} className="hover:bg-black/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-foreground">{lead.clientName}</div>
                      <div className="text-xs text-muted-foreground">{lead.company || 'No Company'} • {lead.country || 'Global'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">{lead.contactPerson}</div>
                      <div className="text-xs text-muted-foreground">{lead.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">{lead.service}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">{lead.source}</div>
                    </td>
                    {user?.role === 'admin' && (
                      <td className="p-4">
                        {lead.createdBy ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-600 flex items-center justify-center text-xs font-bold uppercase">
                              {(lead.createdBy.name || 'U')[0]}
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">{lead.createdBy.name || '—'}</span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                    )}
                    <td className="p-4 text-center">
                      <Badge variant={statusColors[lead.status] || 'default'}>{statusLabels[lead.status] || lead.status}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/leads/${lead.id || lead._id}`)} className="p-2 hover:bg-card rounded-lg text-muted-foreground hover:text-orange-500 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-transparent hover:border-border">
                          <Eye size={16} />
                        </button>
                        {user?.role === 'admin' && (
                          <>
                            <button onClick={() => handleEditLead(lead)} className="p-2 hover:bg-card rounded-lg text-muted-foreground hover:text-orange-500 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-transparent hover:border-border">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteLead(lead.id || lead._id)} className="p-2 hover:bg-card rounded-lg text-muted-foreground hover:text-rose-600 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-transparent hover:border-border">
                              <Trash2 size={16} />
                            </button>
                            <button onClick={() => handleAssignToProduction(lead)} className="p-2 hover:bg-card rounded-lg text-muted-foreground hover:text-green-600 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-transparent hover:border-border" title="Assign to Production">
                              🚀
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredLeads.length === 0 && <div className="p-12 text-center text-muted-foreground">No matching leads found.</div>}
        </Card>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupLeadsByDay(filteredLeads))
            .sort(([a], [b]) => b.localeCompare(a)) // Latest dates first
            .map(([dateKey, group]) => (
              <div key={dateKey} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-100 flex flex-col items-center min-w-[80px]">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">{group.monthLabel.split(' ')[0].substring(0, 3)}</span>
                    <span className="text-2xl font-black">{group.dayLabel.split(' ')[1]}</span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {Object.entries(group.salespeople).map(([salesperson, leads]) => (
                    <div key={salesperson} className="space-y-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2 ml-4">
                        <User size={16} className="text-indigo-500" />
                        <span className="text-sm font-bold uppercase tracking-widest">{salesperson}</span>
                        <Badge variant="outline" className="ml-2 bg-card">{leads.length} Leads</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {leads.map((lead) => (
                          <Card key={lead.id || lead._id} className="p-5 hover:shadow-xl transition-all duration-300 border-none ring-1 ring-border group">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-bold text-foreground group-hover:text-orange-500 transition-colors">{lead.clientName}</h4>
                                <p className="text-xs text-muted-foreground">{lead.company || 'No Company'}</p>
                              </div>
                              <Badge variant={statusColors[lead.status] || 'default'} className="text-[10px] uppercase">
                                {statusLabels[lead.status] || lead.status}
                              </Badge>
                            </div>

                            <div className="space-y-3 mb-5">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <MessageCircle size={14} className="mr-2 text-muted-foreground" />
                                {lead.service}
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock size={14} className="mr-2 text-muted-foreground" />
                                {lead.source}
                              </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                              <button
                                onClick={() => navigate(`/leads/${lead.id || lead._id}`)}
                                className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                              >
                                View Details <Eye size={14} />
                              </button>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {user?.role === 'admin' && (
                                  <>
                                    <button onClick={() => handleEditLead(lead)} className="p-1.5 hover:bg-black/40 rounded text-muted-foreground hover:text-orange-500" title="Edit Lead"><Edit2 size={14} /></button>
                                    <button onClick={() => handleDeleteLead(lead.id || lead._id)} className="p-1.5 hover:bg-black/40 rounded text-muted-foreground hover:text-rose-600" title="Delete Lead"><Trash2 size={14} /></button>
                                    <button onClick={() => handleAssignToProduction(lead)} className="p-1.5 hover:bg-black/40 rounded text-muted-foreground hover:text-green-600" title="Assign to Production">🚀</button>
                                  </>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          {filteredLeads.length === 0 && (
            <div className="p-20 text-center bg-black/20 rounded-2xl border-2 border-dashed border-border">
              <div className="bg-card w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <Search className="text-gray-300" size={32} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">No leads found</h3>
              <p className="text-muted-foreground text-sm">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editingLead ? "Edit Lead Details" : "Create New Lead"}>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Client Name" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} />
            <Input label="Company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
         <div>
  <label className="text-sm font-medium text-muted-foreground">
    Country
  </label>

  <Select
    value={formData.country}
    onValueChange={(value) =>
      setFormData({ ...formData, country: value })
    }
  >
    <SelectTrigger className="mt-1">
      <SelectValue placeholder="Select Country" />
    </SelectTrigger>

    <SelectContent>
      {countryOptions.map((option) => (
        <SelectItem
          key={option.value}
          value={option.value}
        >
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

<div>
  <label className="text-sm font-medium text-muted-foreground">
    Status
  </label>

  <Select
    value={formData.status}
    onValueChange={(value) =>
      setFormData({ ...formData, status: value })
    }
  >
    <SelectTrigger className="mt-1">
      <SelectValue placeholder="Select Status" />
    </SelectTrigger>

    <SelectContent>
      {statusOptions
        .filter((o) => o.value !== "all")
        .map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
    </SelectContent>
  </Select>
</div>


<div>
  <label className="text-sm font-medium text-muted-foreground">
    Lead Source
  </label>

  <Select
    value={formData.source}
    onValueChange={(value) =>
      setFormData({ ...formData, source: value })
    }
  >
    <SelectTrigger className="mt-1">
      <SelectValue placeholder="Select Source" />
    </SelectTrigger>

    <SelectContent>
      {sourceOptions.map((option) => (
        <SelectItem
          key={option.value}
          value={option.value}
        >
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>


















            <Input label="Contact Person" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
            <Input label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <Input label="Phone / WhatsApp" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Service" value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} options={serviceOptions} />
            <Input label="Budget" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
            <Input label="Deadline" type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
            <Select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} options={statusOptions.filter(o => o.value !== 'all')} />
          </div>
          <Select label="Lead Source" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} options={sourceOptions} />
          <div>
            <label className="text-sm font-medium text-muted-foreground">Notes</label>
            <textarea className="w-full mt-1 border rounded-lg p-2 min-h-[100px]" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit">{editingLead ? "Save Changes" : "Add Lead"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign to Production">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Convert lead <b>{selectedLead?.clientName}</b> into a project</p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Assign To</label>
            <Select 
              value={assignData.assignedTo} 
              onValueChange={(value) => setAssignData({ ...assignData, assignedTo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Team Member" />
              </SelectTrigger>
              <SelectContent>
                {productionUsers.map(u => (
                  <SelectItem key={u.id || u._id} value={u.id || u._id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input label="Deadline" type="date" value={assignData.deadline} onChange={(e) => setAssignData({ ...assignData, deadline: e.target.value })} />
          <div className="flex justify-end gap-3">
            <Button onClick={() => setAssignModal(false)}>Cancel</Button>
            <Button className="bg-green-600 text-white" onClick={convertLeadToProject}>Assign Project</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
