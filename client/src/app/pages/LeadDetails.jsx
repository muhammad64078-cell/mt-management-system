import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Input, Select } from '../components/ui';
import { useEffect, useState } from 'react';
import API from "../api/api";
import { ArrowLeft, Mail, Phone, Calendar, DollarSign, User, FileText, Upload, MessageSquare, Clock, Send, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { InvoiceModal } from '../components/InvoiceModal';




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

const activityTimeline = [
  {
    id: 1,
    type: 'note',
    text: 'Initial contact made. Client interested in e-commerce features.',
    user: 'Sarah Sales',
    date: '2026-04-08 10:30 AM'
  },
  {
    id: 2,
    type: 'call',
    text: 'Phone call - 25 minutes. Discussed project scope and timeline.',
    user: 'Sarah Sales',
    date: '2026-04-07 2:15 PM'
  },
  {
    id: 3,
    type: 'email',
    text: 'Sent introductory email with company portfolio.',
    user: 'Sarah Sales',
    date: '2026-04-06 11:00 AM'
  },
  {
    id: 4,
    type: 'note',
    text: 'Lead created from website contact form.',
    user: 'System',
    date: '2026-04-01 9:45 AM'
  }
];

const files = [
  { id: 1, name: 'Project_Proposal.pdf', size: '2.4 MB', uploadedBy: 'Sarah Sales', date: '2026-04-07' },
  { id: 2, name: 'Requirements_Doc.docx', size: '1.1 MB', uploadedBy: 'Sarah Sales', date: '2026-04-05' }
];


export const LeadDetails = () => {
  const user = JSON.parse(localStorage.getItem("user"));
const [file, setFile] = useState(null);
const [files, setFiles] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteUpdating, setNoteUpdating] = useState(false);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [productionUsers, setProductionUsers] = useState([]);
  const [assignData, setAssignData] = useState({
    assignedTo: "",
    service: "",
    deadline: ""
  });

  const [payments, setPayments] = useState([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentType: "Advance",
    paymentDate: "",
    note: "",
  });

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");


  useEffect(() => {
    if (lead) {
      setAssignData({
        assignedTo: "",
        service: lead.service || "",
        deadline: lead.deadline || ""
      });
    }
  }, [lead]);

  const fetchProductionUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/auth/production-users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProductionUsers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (isAssignModalOpen) {
      fetchProductionUsers();
    }
  }, [isAssignModalOpen]);

  const convertLeadToProject = async () => {
    if (!assignData.assignedTo) return alert("Please select a production member");
    try {
      const token = localStorage.getItem("token");
      await API.post(
        "/projects/from-lead",
        {
          leadId: lead.id || lead._id,
          assignedTo: assignData.assignedTo,
          service: assignData.service,
          deadline: assignData.deadline
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Lead converted to Project successfully! 🚀");
      setIsAssignModalOpen(false);
      navigate("/production/projects");
    } catch (err) {
      console.error(err);
      alert("Error converting lead: " + (err.response?.data?.message || err.message));
    }
  };





  const fetchPayments = async () => {
    try {
      const res = await API.get(`/lead-payments/${id}`);
      setPayments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (lead) {
      fetchPayments();
    }
  }, [lead]);

  const addPayment = async () => {
    if (!paymentData.amount || !paymentData.paymentDate) {
      return alert("Please enter amount and date");
    }
    try {
      const res = await API.post("/lead-payments", {
        leadId: id,
        ...paymentData,
      });
      setPayments([res.data, ...payments]);
      setPaymentData({
        amount: "",
        paymentType: "Advance",
        paymentDate: "",
        note: "",
      });
      alert("Payment added successfully!");
      setIsInvoiceModalOpen(true); // Automatically show invoice after payment
    } catch (err) {
      console.log(err);
      alert("Error adding payment");
    }
  };

  const emailTemplates = [
    {
      title: "Proposal Follow-up",
      subject: `Follow-up: Proposal for ${lead?.service || 'Project'}`,
      body: `Hi ${lead?.clientName || 'there'},\n\nI hope you're having a great week! I'm just checking in to see if you've had a chance to review the proposal I sent over. I'd love to hear your thoughts and answer any questions you might have.\n\nBest regards,\n${lead?.assignedTo?.name || 'Your Sales Team'}`
    },
    {
      title: "General Check-in",
      subject: `Checking in - ${lead?.company || 'Your Project'}`,
      body: `Hi ${lead?.clientName || 'there'},\n\nI wanted to follow up and see if there's anything else you need from my side regarding the ${lead?.service || 'services'} we discussed. I'm here to help if you're ready to take the next step!\n\nBest regards,\n${lead?.assignedTo?.name || 'Your Sales Team'}`
    },
    {
      title: "Urgent Reminder",
      subject: `Final Reminder: Special Offer for ${lead?.clientName}`,
      body: `Hi ${lead?.clientName || 'there'},\n\nJust a quick heads-up that our special pricing for the ${lead?.service || 'project'} is expiring soon. If you're still interested, let's connect today to lock in the deal!\n\nBest,\n${lead?.assignedTo?.name || 'Your Sales Team'}`
    }
  ];

  const handleSendEmail = (template) => {
    const mailtoLink = `mailto:${lead?.email}?subject=${encodeURIComponent(template.subject)}&body=${encodeURIComponent(template.body)}`;
    window.open(mailtoLink, '_blank');
    setIsEmailModalOpen(false);
  };



const addActivity = async (type, title, description) => {
  console.log("addActivity called with:", { type, title, description });
  try {
    const token = localStorage.getItem("token");
    console.log("Token found:", !!token);

    const res = await API.post(
      `/leads/${lead?.id || lead?._id}/activities`,
      {
        type,
        title,
        description,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Activity response:", res.data);
    alert("Activity saved!");
  } catch (err) {
    console.error("Activity Error:", err.response?.data || err.message);
    alert("Error saving activity");
  }
};











useEffect(() => {
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await API.get(
        `/leads/${lead?.id || lead?._id}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessages(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  if (lead) {
    fetchMessages();
  }
}, [lead]);

const sendMessage = async () => {
  if (!newMessage.trim()) return;

  try {
    const token = localStorage.getItem("token");

    const res = await API.post(
      `/leads/${lead.id || lead._id}/messages`,
      { message: newMessage },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setMessages([...messages, res.data]);
    setNewMessage("");
  } catch (err) {
    console.log(err);
  }
};






























  useEffect(() => {
  const fetchFiles = async () => {
    const res = await API.get(
      `/files/${id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    setFiles(res.data);
  };

  fetchFiles();
}, [id]);


const handleUpload = async () => {
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  const res = await API.post(
    `/files/upload/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }
  );

  setFiles([...files, res.data]);
};


const handleDelete = async (fileId) => {
  await API.delete(
    `/files/${fileId}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }
  );

  setFiles(prev => prev.filter(f => (f.id || f._id) !== fileId));
};








  useEffect(() => {
    const fetchLead = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await API.get(
          `/leads/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setLead(res.data);
        console.log("FETCHED LEAD RAW DATA:", res.data);
        setSelectedStatus(res.data.status);
      } catch (err) {
        console.error("Error fetching lead:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  // ✅ Update Status Handler
  const updateStatus = async () => {
    if (!selectedStatus) return;
    try {
      setStatusUpdating(true);
      const token = localStorage.getItem("token");
      const res = await API.put(
        `/leads/${id}`,
        { status: selectedStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setLead(res.data); // ✅ update UI with fresh data from backend
      alert("Status updated successfully ✅");
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status ❌");
    } finally {
      setStatusUpdating(false);
    }
  };
  
  const handleSaveNote = async () => {
    try {
      setNoteUpdating(true);
      const token = localStorage.getItem("token");
      const res = await API.put(
        `/leads/${id}`,
        { notes: noteText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setLead(res.data);
      setIsNoteModalOpen(false);
      alert("Note updated successfully ✅");
    } catch (err) {
      console.error("Error updating note:", err);
      alert("Failed to update note ❌");
    } finally {
      setNoteUpdating(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!lead) return <p>Lead not found</p>;



























  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/leads')}
              className="mr-4 text-muted-foreground hover:text-muted-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl text-foreground mb-1">{lead.clientName}</h1>
              <p className="text-sm text-muted-foreground">Lead Details</p>
            </div>
          </div>
          <Badge variant={statusColors[lead.status]} className="w-fit">
            {statusLabels[lead.status] || lead.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card className="p-6">
              <h3 className="text-lg text-foreground mb-4">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center text-muted-foreground mb-3">
                    <User className="w-4 h-4 mr-2" />
                    <span className="text-sm">Contact Person</span>
                  </div>
                  <p className="text-foreground ml-6">{lead.contactPerson || lead.contact_person || "Not Provided"}</p>
                </div>
                <div>
                  <div className="flex items-center text-muted-foreground mb-3">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-sm">Company</span>
                  </div>
                  <p className="text-foreground ml-6">{lead.company || lead.Company || "Not Provided"}</p>
                </div>
                <div>
                  <div className="flex items-center text-muted-foreground mb-3">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-sm">Country</span>
                  </div>
                  <p className="text-foreground ml-6">{lead.country || lead.Country || "Global"}</p>
                </div>
                <div>
                  <div className="flex items-center text-muted-foreground mb-3">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="text-sm">Email</span>
                  </div>
                  <p className="text-foreground ml-6">{lead.email}</p>
                </div>
                <div>
                  <div className="flex items-center text-muted-foreground mb-3">
                    <Phone className="w-4 h-4 mr-2" />
                    <span className="text-sm">Phone / WhatsApp</span>
                  </div>
                  <p className="text-foreground ml-6">{lead.phone}</p>
                </div>
                <div>
                  <div className="flex items-center text-muted-foreground mb-3">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-sm">Service</span>
                  </div>
                  <p className="text-foreground ml-6">{lead.service}</p>
                </div>
                <div>
                  <div className="flex items-center text-muted-foreground mb-3">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    <span className="text-sm">Lead Source</span>
                  </div>
                  <p className="text-foreground ml-6 font-semibold text-orange-500 uppercase text-xs">{lead.source || lead.lead_source || "N/A"}</p>
                </div>
                <div>
                  <div className="flex items-center text-muted-foreground mb-3">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span className="text-sm">Budget</span>
                  </div>
                  <p className="text-foreground ml-6">{lead.budget}</p>
                </div>
                <div>
                  <div className="flex items-center text-muted-foreground mb-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Deadline</span>
                  </div>
                  <p className="text-foreground ml-6">{lead.deadline || lead.project_deadline || "No Deadline Set"}</p>
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center text-muted-foreground mb-3">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-sm">Notes</span>
                  </div>
                  <p className="text-foreground ml-6 bg-black/20 p-3 rounded-lg border border-border italic text-sm">
                    {lead.notes || "No notes added for this lead."}
                  </p>
                </div>
              </div>
            </Card>

            {/* Notes */}
            <div className="border rounded-lg p-4 h-[350px] overflow-y-auto bg-black/20">
              {messages.map((msg) => (
                <div key={msg.id} className="mb-2">
                  <div className="text-xs text-muted-foreground">
                    {msg.sender_name}
                  </div>
                  <div className="bg-card p-2 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] w-fit">
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 border p-2 rounded"
                placeholder="Type message..."
              />
              <button
                onClick={sendMessage}
                className="bg-orange-500 text-white px-4 rounded"
              >
                Send
              </button>
            </div>

            {/* Files */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg text-foreground">Files</h3>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <Button size="sm" variant="outline" as="span">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </label>
                <Button size="sm" onClick={handleUpload}>
                  Upload
                </Button>
              </div>

              {/* FILE LIST */}
              <div className="space-y-3">
                {files.map((f) => (
                  <div
                    key={f.id || f._id}
                    className="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/40 transition"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
                        <FileText className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground">{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.size} • {f.uploadedBy}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                      <a
                        href={f.url}
                        target="_blank"
                        className="text-orange-500 text-xs font-bold hover:bg-orange-500/10 px-2 py-1 rounded transition-colors"
                      >
                        View
                      </a>
                      <a
                        href={f.url}
                        download
                        className="text-green-600 text-xs font-bold hover:bg-green-50 px-2 py-1 rounded transition-colors"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => handleDelete(f.id || f._id)}
                        className="text-red-600 text-xs font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Activity Timeline */}
            <Card className="p-6">
              <h3 className="text-lg text-foreground mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                {activityTimeline.map((activity, index) => (
                  <div key={activity.id} className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'call' ? 'bg-green-100' :
                        activity.type === 'email' ? 'bg-blue-100' :
                        'bg-black/40'
                      }`}>
                        {activity.type === 'call' ? (
                          <Phone className="w-4 h-4 text-green-600" />
                        ) : activity.type === 'email' ? (
                          <Mail className="w-4 h-4 text-blue-600" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      {index < activityTimeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <p className="text-sm text-foreground mb-1">{activity.text}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>{activity.user}</span>
                        <span className="mx-2">•</span>
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{activity.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payments */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg text-foreground">Payments History</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                    onClick={() => setIsInvoiceModalOpen(true)}
                  >
                    View Invoice
                  </Button>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    Total Received: ${payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString()}
                  </Badge>
                </div>
              </div>

              {/* ADMIN ONLY: ADD PAYMENT */}
              {user?.role === "admin" && (
                <div className="bg-black/20 p-4 rounded-xl border border-border mb-6 space-y-4">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Add New Payment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Amount ($)"
                      type="number"
                      placeholder="0.00"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    />
                    <Input
                      label="Payment Date"
                      type="date"
                      value={paymentData.paymentDate}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Payment Type</label>
                      <select
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={paymentData.paymentType}
                        onChange={(e) => setPaymentData({ ...paymentData, paymentType: e.target.value })}
                      >
                        <option>Advance</option>
                        <option>Milestone</option>
                        <option>Revision</option>
                        <option>Final</option>
                      </select>
                    </div>
                    <Input
                      label="Note"
                      placeholder="e.g. PayPal, Bank Transfer"
                      value={paymentData.note}
                      onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                    />
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={addPayment}>
                    Record Payment
                  </Button>
                </div>
              )}

              {/* PAYMENT HISTORY LIST */}
              <div className="space-y-3">
                {payments.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm italic">No payment records found.</p>
                ) : (
                  payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{payment.payment_type}</div>
                          <div className="text-sm text-muted-foreground">{payment.note || "No notes"}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600 text-lg">${payment.amount}</div>
                        <div className="flex items-center justify-end text-xs text-muted-foreground mt-1">
                          <Clock size={12} className="mr-1" />
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button className="w-full" variant="outline" onClick={() => setIsEmailModalOpen(true)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Follow-up
                </Button>
                {user?.role === "admin" && (
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => setIsAssignModalOpen(true)}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Convert to Project
                  </Button>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg text-foreground mb-4">Lead Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Source</p>
                  <p className="text-sm text-foreground">{lead.source}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                  <p className="text-sm text-foreground">{lead.assignedTo?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created Date</p>
                  <p className="text-sm text-foreground">{lead.createdAt}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-2 py-6 h-auto hover:bg-orange-500/10 hover:border-indigo-200 transition-all"
                  onClick={() => addActivity("call", "Call Logged", "Client ko call kiya")}
                >
                  <Phone className="w-5 h-5 text-orange-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">Log Call</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-2 py-6 h-auto hover:bg-blue-50 hover:border-blue-200 transition-all"
                  onClick={() => addActivity("email", "Email Sent", "Proposal email send ki")}
                >
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Send Email</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-2 py-6 h-auto hover:bg-purple-50 hover:border-purple-200 transition-all"
                  onClick={() => addActivity("meeting", "Meeting Scheduled", "Meeting fix ki")}
                >
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Meeting</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-2 py-6 h-auto hover:bg-orange-50 hover:border-orange-200 transition-all"
                  onClick={() => addActivity("proposal", "Proposal Created", "Proposal banaya")}
                >
                  <FileText className="w-5 h-5 text-orange-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Proposal</span>
                </Button>
              </div>
            </Card>

            {/* Status Section */}
            {user?.role === "admin" && (
              <Card className="p-6">
                <h3 className="text-lg text-foreground mb-4">Change Status</h3>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3 bg-black/20 text-foreground"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="new">New</option>
                  <option value="discussing">Discussing</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed-won">Working/Revision</option>
                  <option value="closed-lost">Closed Lost</option>
                  <option value="complete">Completed</option>
                </select>
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={updateStatus}
                  disabled={statusUpdating}
                >
                  {statusUpdating ? "Updating..." : "Update Status"}
                </Button>
                <Button
                  className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => setIsEmailModalOpen(true)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Follow-up Email
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Email Template Modal */}
        <Modal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          title="Select Follow-up Template"
        >
          <div className="p-4 space-y-3">
            {emailTemplates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => handleSendEmail(template)}
                className="w-full text-left p-4 rounded-xl border border-border hover:border-indigo-500 hover:bg-orange-500/10 transition-all group"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-foreground group-hover:text-orange-600">{template.title}</h4>
                  <Send className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{template.subject}</p>
              </button>
            ))}
          </div>
        </Modal>




























        {/* Project Assignment Modal */}
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title="Convert to Production Project"
        >
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1">Select Production Member</label>
              <select 
                className="w-full p-2 border rounded-lg"
                value={assignData.assignedTo}
                onChange={(e) => setAssignData({...assignData, assignedTo: e.target.value})}
              >
                <option value="">Choose member...</option>
                {productionUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1">Service / Scope</label>
              <Input 
                value={assignData.service}
                onChange={(e) => setAssignData({...assignData, service: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1">Production Deadline</label>
              <Input 
                type="date"
                value={assignData.deadline}
                onChange={(e) => setAssignData({...assignData, deadline: e.target.value})}
              />
            </div>

            <div className="pt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={convertLeadToProject}>
                Confirm Conversion
              </Button>
            </div>
          </div>
        </Modal>

        {/* Note Modal */}
        <Modal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          title={lead.notes ? "Edit Note" : "Add Note"}
        >
          <div className="space-y-4 p-4">
            <textarea
              className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[200px]"
              placeholder="Type your note here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNote} disabled={noteUpdating}>
                {noteUpdating ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>
        </Modal>

        <InvoiceModal 
          isOpen={isInvoiceModalOpen} 
          onClose={() => setIsInvoiceModalOpen(false)} 
          lead={lead} 
          payments={payments} 
        />
      </div>
    </>
  );
};