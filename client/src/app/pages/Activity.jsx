import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, Button, Badge } from "../components/ui";
import { Modal } from "../components/Modal";
import { Plus, Phone, Mail, Calendar, MessageSquare, CheckCircle, Clock } from "lucide-react";
import API from "../api/api";
import { Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const activityTypes = [
  { value: "call", label: "Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "whatsapp", label: "WhatsApp Message", icon: MessageSquare },
  { value: "meeting", label: "Meeting", icon: Calendar },
  { value: "internal_note", label: "Internal Note", icon: MessageSquare },
  { value: "status_change", label: "Status Change", icon: CheckCircle }
];

const Activity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [leads, setLeads] = useState([]);

  const [form, setForm] = useState({
    leadId: "",
    clientName: "",
    company: "",
    notes: "",
    type: "call",
    nextFollowUpDate: "",
    status: "pending",
    outcome: ""
  });

  const [searchParams] = useSearchParams();
  const userIdFilter = searchParams.get("userId");

  const fetchActivities = async () => {
    try {
      const url = userIdFilter ? `/activities?userId=${userIdFilter}` : "/activities";
      const res = await API.get(url);
      setActivities(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/leads", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchLeads();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/activities", form);

      setForm({
        leadId: "",
        clientName: "",
        company: "",
        notes: "",
        type: "call",
        nextFollowUpDate: "",
        status: "pending",
        outcome: ""
      });

      setShowModal(false);
      fetchActivities();

    } catch (err) {
      console.log(err);
      alert("Failed ❌");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    try {
      await API.delete(`/activities/${id}`);
      fetchActivities();
    } catch (err) {
      console.log(err);
      alert("Failed to delete ❌");
    }
  };

  function getTypeConfig(type) {
    return activityTypes.find((a) => a.value === type);
  }

  function renderActivityCard(a) {
    const type = getTypeConfig(a.type);
    const Icon = type?.icon || MessageSquare;

    return (
      <div key={a.id || a._id} className="relative flex gap-4">
        {/* DOT */}
        <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-2
          ${a.status === "done" ? "bg-green-500" : "bg-yellow-400"}
        `}>
          <div className="w-2 h-2 bg-card rounded-full"></div>
        </div>

        {/* CARD */}
        <div className="flex-1">
          <div className="backdrop-blur-md bg-card/70 border border-border rounded-xl p-5 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-xl transition-all duration-300">

            {/* TOP */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  {a.clientName || a.client_name || "Unknown Client"}
                </h3>
                <p className="text-xs text-muted-foreground">{a.company || "No Company"}</p>
              </div>

              <div className="flex gap-2">
                <Badge className="bg-orange-500/20 text-orange-600">
                  {type?.label}
                </Badge>

                <Badge className={
                  a.status === "done"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }>
                  {a.status}
                </Badge>
              </div>
            </div>

            {/* TYPE ICON + DATE */}
            <div className="flex items-center gap-3 mt-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <Icon className="w-5 h-5 text-orange-500" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(a.createdAt || a.created_at).toLocaleString()}
                </p>
                
                {a.next_follow_up_date && (
                  <p className="text-xs font-bold text-amber-600 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Next Follow-up: {new Date(a.next_follow_up_date).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* NOTES */}
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              {a.notes}
            </p>

            {/* OUTCOME */}
            {a.outcome && (
              <div className="mt-3 inline-block px-3 py-1 text-xs rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-orange-600">
                ✨ {a.outcome}
              </div>
            )}

            {/* FOOTER */}
            <div className="flex justify-between items-center mt-5 pt-4 border-t border-border">

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow">
                  {a.createdBy?.name?.charAt(0) || "U"}
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {a.createdBy?.name || "System"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Activity owner
                  </p>
                </div>
              </div>

              {user?.role === "admin" && (
                <button 
                  onClick={() => handleDelete(a.id || a._id)}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Activity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }



  return (
  <div className="space-y-6">

    {/* HEADER */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {userIdFilter ? "User Activities" : "Sales Activity"}
        </h1>
        <p className="text-muted-foreground text-sm">
          Track your CRM interactions
        </p>
      </div>

      <Button className="bg-orange-500 hover:bg-orange-600 shadow-lg w-full md:w-auto" onClick={() => setShowModal(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Add Activity
      </Button>
    </div>

    {/* TIMELINE STYLE LIST */}
    <div className="space-y-12">
      {user?.role === "admin" && !userIdFilter ? (
        // ADMIN VIEW: Grouped by User
        Object.entries(activities.reduce((acc, a) => {
          const name = a.createdBy?.name || "System";
          if (!acc[name]) acc[name] = [];
          acc[name].push(a);
          return acc;
        }, {})).map(([userName, userActs]) => (
          <div key={userName} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-gray-200"></div>
              <h2 className="text-sm font-bold text-orange-500 bg-orange-500/10 px-4 py-1 rounded-full uppercase tracking-widest">
                {userName}'s Activities ({userActs.length})
              </h2>
              <div className="h-[1px] flex-1 bg-gray-200"></div>
            </div>
            
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-black/40"></div>
              <div className="space-y-6">
                {userActs.map((a) => renderActivityCard(a))}
              </div>
            </div>
          </div>
        ))
      ) : (
        // SALES VIEW or FILTERED VIEW: Single list
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-gray-200"></div>
          <div className="space-y-6">
            {activities.map((a) => renderActivityCard(a))}
          </div>
        </div>
      )}
    </div>

    {/* MODAL SAME */}
    <Modal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      title="Add Activity"
    >
      <form onSubmit={handleSubmit} className="space-y-3">

        <select
          className="w-full border p-2 rounded"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          {activityTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          className="w-full border p-2 rounded"
          value={form.leadId}
          onChange={(e) => {
            const selectedLead = leads.find((l) => (l.id || l._id) === e.target.value);
            setForm({ 
              ...form, 
              leadId: e.target.value,
              clientName: selectedLead?.clientName || "",
              company: selectedLead?.company || ""
            });
          }}
        >
          <option value="">Select Lead / Client</option>
          {leads.map((l) => (
            <option key={l.id || l._id} value={l.id || l._id}>
              {l.clientName} {l.company ? `(${l.company})` : ""}
            </option>
          ))}
        </select>

        <textarea
          className="w-full border p-2 rounded min-h-[100px]"
          placeholder="Summary / Note (Baat-cheet ka nichor)"
          value={form.notes}
          onChange={(e) =>
            setForm({ ...form, notes: e.target.value })
          }
          required
        />

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Next Follow-up Date & Time</label>
          <input
            type="datetime-local"
            className="w-full border p-2 rounded"
            value={form.nextFollowUpDate}
            onChange={(e) =>
              setForm({ ...form, nextFollowUpDate: e.target.value })
            }
          />
        </div>

        <select
          className="w-full border p-2 rounded"
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value })
          }
        >
          <option value="pending">Pending</option>
          <option value="done">Done</option>
        </select>

        <input
          className="w-full border p-2 rounded"
          placeholder="Outcome"
          value={form.outcome}
          onChange={(e) =>
            setForm({ ...form, outcome: e.target.value })
          }
        />

        <div className="flex justify-end gap-2">
          <Button type="button" onClick={() => setShowModal(false)}>
            Cancel
          </Button>

          <Button className="bg-orange-500 hover:bg-orange-600" type="submit">
            Save
          </Button>
        </div>

      </form>
    </Modal>

  </div>
  );
};

export default Activity;