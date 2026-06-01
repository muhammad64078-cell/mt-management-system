import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from '../components/ui';
import { DollarSign, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';

import { useNotifications } from '../context/NotificationContext';

const ItemType = 'LEAD_CARD';

const columns = [
  { id: 'new', title: 'New Leads', color: 'from-indigo-500/20 to-indigo-600/5', border: 'border-indigo-200', text: 'text-orange-600', badge: 'bg-orange-500/20 text-orange-600' },
  { id: 'discussing', title: 'In Discussion', color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  { id: 'proposal', title: 'Proposal Sent', color: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  { id: 'negotiation', title: 'Negotiation', color: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  { id: 'closed-won', title: 'Working/Revision', color: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  { id: 'complete', title: 'Completed', color: 'from-green-500/20 to-green-600/5', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  { id: 'closed-lost', title: 'Closed Lost', color: 'from-rose-500/20 to-rose-600/5', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' }
];

export const Pipeline = () => {
  const [leads, setLeads] = useState([]);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  // ✅ FETCH LEADS FROM BACKEND
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await API.get(`/leads`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setLeads(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.log(error);
      }
    };

    fetchLeads();
  }, []);

  // ✅ UPDATE STATUS (DRAG & DROP)
  const moveCard = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const leadToUpdate = leads.find(l => (l.id || l._id) === id);

      await API.put(
        `/leads/${id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // UI update
      setLeads((prev) =>
        prev.map((lead) =>
          (lead.id || lead._id) === id ? { ...lead, status: newStatus } : lead
        )
      );

      // Trigger Notification
      const stageName = columns.find(c => c.id === newStatus)?.title || newStatus;
      console.log("Triggering notification for:", leadToUpdate?.clientName, "to stage:", stageName);
      
      addNotification({
        text: `Lead "${leadToUpdate?.clientName}" moved to ${stageName}`,
        path: `/leads/${id}`
      });

    } catch (error) {
      console.log(error);
    }
  };

  // ================= LEAD CARD =================
  const LeadCard = ({ lead }) => {
    const [{ isDragging }, drag] = useDrag({
      type: ItemType,
      item: { id: lead.id || lead._id, status: lead.status },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    });

    const statusColors = {
      'new': 'bg-indigo-500',
      'discussing': 'bg-blue-500',
      'proposal': 'bg-amber-500',
      'negotiation': 'bg-purple-500',
      'closed-won': 'bg-emerald-500',
      'complete': 'bg-green-500',
      'closed-lost': 'bg-rose-500'
    };

    return (
      <div
        ref={drag}
        onClick={() => navigate(`/leads/${lead.id || lead._id}`)}
        className={`group bg-card p-5 rounded-xl border border-border shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${
          isDragging ? 'opacity-40 scale-95' : 'opacity-100'
        }`}
      >
        {/* Status Indicator Stripe */}
        <div className={`absolute top-0 left-0 w-1.5 h-full ${statusColors[lead.status] || 'bg-gray-300'}`} />
        
        <div className="flex justify-between items-start mb-3">
          <h4 className="text-[15px] font-semibold text-foreground line-clamp-1 group-hover:text-orange-500 transition-colors">
            {lead.clientName}
          </h4>
        </div>
        
        <p className="text-xs font-medium text-muted-foreground mb-4 bg-black/20 px-2 py-1 rounded inline-block">
          {lead.service}
        </p>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-50">
          <div className="flex items-center text-[11px] font-medium text-muted-foreground">
            <div className="p-1.5 bg-green-50 rounded-md mr-2">
              <DollarSign className="w-3 h-3 text-green-600" />
            </div>
            {lead.budget}
          </div>
          <div className="flex items-center text-[11px] font-medium text-muted-foreground">
            <div className="p-1.5 bg-blue-50 rounded-md mr-2">
              <Calendar className="w-3 h-3 text-blue-600" />
            </div>
            {lead.deadline}
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
           <div className="flex items-center text-[11px] font-medium text-muted-foreground">
             <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center mr-2">
                <User className="w-3 h-3 text-orange-500" />
             </div>
             <span className="truncate max-w-[100px]">{lead.assignedTo?.name || 'Unassigned'}</span>
           </div>
        </div>
      </div>
    );
  };

  // ================= COLUMN =================
  const Column = ({ column }) => {
    const [{ isOver }, drop] = useDrop({
      accept: ItemType,
      drop: (item) => {
        if (item.status !== column.id) {
          moveCard(item.id, column.id);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver()
      })
    });

    const columnLeads = (Array.isArray(leads) ? leads : []).filter(
      (lead) => lead.status === column.id
    );

    return (
      <div
        ref={drop}
        className={`w-full lg:w-[320px] xl:w-[350px] flex-shrink-0 flex flex-col transition-all duration-300 ${
          isOver ? 'scale-[1.01] shadow-xl' : ''
        }`}
      >
        <div className={`bg-gradient-to-br ${column.color} border-b ${column.border} rounded-t-2xl px-5 py-4 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-extrabold text-sm tracking-widest uppercase ${column.text}`}>{column.title}</h3>
            <span className={`text-xs font-black px-3 py-1 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] ${column.badge}`}>
              {columnLeads.length} Leads
            </span>
          </div>
        </div>

        <div className={`bg-black/20/50 p-4 rounded-b-2xl border-x border-b border-border flex-1 min-h-[150px] transition-colors ${isOver ? 'bg-orange-500/10/50 ring-2 ring-indigo-200 ring-inset' : ''}`}>
          {columnLeads.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {columnLeads.map((lead) => (
                <LeadCard key={lead.id || lead._id} lead={lead} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-xl bg-card/50 h-full">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center px-4">No active leads<br/>in this stage</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ================= UI =================
  const totalValue = leads.reduce((sum, lead) => {
    const valueStr = (lead.budget || "0").replace(/[$,]/g, '');
    const value = parseInt(valueStr);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="lg:h-[calc(100vh-6rem)] flex flex-col space-y-6">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 flex-shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pipeline Overview</h1>
            <p className="text-sm font-medium text-muted-foreground flex items-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
              Live sales management & lead tracking
            </p>
          </div>

          <div className="bg-card border border-border shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-2xl p-4 flex items-center gap-5 min-w-[280px]">
             <div className="p-2.5 bg-orange-500/10 rounded-xl">
                <DollarSign className="w-5 h-5 text-orange-500" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Total Pipeline Value</p>
                <p className="text-xl font-black text-foreground">
                  ${totalValue.toLocaleString()}
                </p>
             </div>
          </div>
        </div>

        {/* Columns Container (Vertical on Mobile, Horizontal on Desktop) */}
        <div className="flex-1 lg:overflow-x-auto lg:overflow-y-hidden pb-4">
          <div className="flex flex-col lg:flex-row gap-6 h-full lg:min-w-max items-stretch lg:items-start px-1">
            {columns.map((column) => (
              <Column key={column.id} column={column} />
            ))}
          </div>
        </div>

        {/* Floating Help Hint */}
        <div className="fixed bottom-6 right-6 z-10 hidden sm:block">
           <div className="bg-gray-900/90 backdrop-blur-sm text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform cursor-help">
              <span className="text-xl">💡</span>
              <p className="text-xs font-bold tracking-wide">Drag cards to update stage</p>
           </div>
        </div>

      </div>
    </DndProvider>
  );
};