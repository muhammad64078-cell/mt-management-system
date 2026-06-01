import { useEffect, useState } from "react";
import API from "../api/api";
import { Card, Badge, LoadingSpinner, Button, Input } from "../components/ui";
import { Trophy, TrendingUp, Users, DollarSign, Shield, Key, Power, PowerOff, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Modal } from "../components/Modal";

export const Team = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetModal, setResetModal] = useState({ isOpen: false, userId: "", userName: "" });
  const [newPassword, setNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);


  //admin sy data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/admin/team-report`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch team data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleStatus = async (memberId, currentStatus) => {
    try {
      setIsUpdating(true);
      const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
      const token = localStorage.getItem("token");
      await API.put(`/admin/toggle-status/${memberId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setData(prev => ({
        ...prev,
        teamMembers: prev.teamMembers.map(m => 
          (m.id || m._id) === memberId ? { ...m, status: newStatus } : m
        )
      }));
      alert(`User is now ${newStatus}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    try {
      setIsUpdating(true);
      const token = localStorage.getItem("token");
      await API.put(`/admin/reset-password/${resetModal.userId}`, 
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Password reset successfully!");
      setResetModal({ isOpen: false, userId: "", userName: "" });
      setNewPassword("");
    } catch (err) {
      console.error(err);
      alert("Failed to reset password");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm("Kya aap waqai is team member ko remove karna chahte hain? Ye wapas nahi aa sakta!")) return;
    try {
      setIsUpdating(true);
      const token = localStorage.getItem("token");
      await API.delete(`/admin/delete-user/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setData(prev => ({
        ...prev,
        teamMembers: prev.teamMembers.filter(m => (m.id || m._id) !== memberId)
      }));
      alert("Team member removed successfully! 🗑️✅");
    } catch (err) {
      console.error(err);
      alert("Failed to remove team member ❌");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!data) return <p className="p-6">Failed to load team data.</p>;

  // Filter members from API data
const salesMembers = (Array.isArray(data?.teamMembers) ? data.teamMembers : []).filter(
  m => (m.role === "sales" || m.role === "admin") && m.status !== 'deleted'
) || [];

const productionMembers = (Array.isArray(data?.teamMembers) ? data.teamMembers : []).filter(
  m => m.role === "production" && m.status !== 'deleted'
) || [];

  const statusColors = {
    online: 'bg-green-500',
    busy: 'bg-yellow-500',
    offline: 'bg-gray-400'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Team</h1>
        <p className="text-sm text-muted-foreground">View team performance and member statistics</p>
      </div>

      {/* Team Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Team Leads</p>
              <p className="text-3xl font-bold text-foreground">{data.totalLeads}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Deals Closed</p>
              <p className="text-3xl font-bold text-foreground">{data.totalDeals}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-foreground">${(data.totalRevenue / 1000).toFixed(0)}K</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Team Members</p>
              <p className="text-3xl font-bold text-foreground">{data.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Sales Team List */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Sales Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {salesMembers.map((member) => (
            <Card key={member.id || member._id} className="p-6 transition-all hover:shadow-md">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                  <div className="relative">
                    <img
                      src={`https://ui-avatars.com/api/?name=${member.name}&background=random`}
                      alt={member.name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-foreground font-bold mb-1">{member.name}</h3>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">{member.role}</p>
                  </div>
                </div>
                <Badge variant={member.status === 'inactive' ? 'danger' : 'success'}>
                  {member.status === 'inactive' ? 'Inactive' : 'Active'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-black/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-xs font-medium text-foreground truncate">{member.email}</p>
                </div>
                <div className="text-center p-3 bg-black/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="text-xs font-medium text-foreground">{new Date(member.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="mt-6 flex items-center gap-2 pt-4 border-t border-gray-50">
                  {member.role !== 'admin' && (
                    <Button 
                      size="sm" 
                      variant={member.status === 'inactive' ? 'success' : 'outline'}
                      className="flex-1 text-[10px] h-8"
                      onClick={() => handleToggleStatus(member.id || member._id, member.status)}
                      disabled={isUpdating}
                    >
                      {member.status === 'inactive' ? <Power className="w-3 h-3 mr-1" /> : <PowerOff className="w-3 h-3 mr-1" />}
                      {member.status === 'inactive' ? 'Activate' : 'Deactivate'}
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 text-[10px] h-8 border-indigo-100 text-orange-500 hover:bg-orange-500/10"
                    onClick={() => setResetModal({ isOpen: true, userId: member.id || member._id, userName: member.name })}
                    disabled={isUpdating}
                  >
                    <Key className="w-3 h-3 mr-1" />
                    Reset Pass
                  </Button>
                  {member.role !== 'admin' && (
                    <Button 
                      size="sm" 
                      variant="danger"
                      className="flex-1 text-[10px] h-8"
                      onClick={() => handleDeleteMember(member.id || member._id)}
                      disabled={isUpdating || member.id === user.id}
                      title={member.id === user.id ? "Aap apne aap ko delete nahi kar sakte" : "Delete User"}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Production Team */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Production Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {productionMembers.map((member) => (
            <Card key={member.id || member._id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <img
                    src={`https://ui-avatars.com/api/?name=${member.name}&background=random`}
                    alt={member.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="ml-3">
                    <h3 className="text-sm font-bold text-foreground mb-0.5">{member.name}</h3>
                    <p className="text-xs text-muted-foreground uppercase">{member.role}</p>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-black/20 p-2 rounded">
                 {member.email}
              </div>
              
              {user?.role === 'admin' && (
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-gray-50">
                   <button 
                    onClick={() => handleToggleStatus(member.id || member._id, member.status)}
                    className={`p-1.5 rounded-lg transition-colors ${member.status === 'inactive' ? 'bg-green-50 text-green-600' : 'bg-black/40 text-muted-foreground'}`}
                    title={member.status === 'inactive' ? 'Activate User' : 'Deactivate User'}
                    disabled={isUpdating}
                  >
                    <Power size={14} />
                  </button>
                  <button 
                    onClick={() => setResetModal({ isOpen: true, userId: member.id || member._id, userName: member.name })}
                    className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors"
                    title="Reset Password"
                    disabled={isUpdating}
                  >
                    <Key size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteMember(member.id || member._id)}
                    className={`p-1.5 rounded-lg transition-colors bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={member.id === user.id ? "Aap apne aap ko delete nahi kar sakte" : "Delete User"}
                    disabled={isUpdating || member.id === user.id}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Reset Password Modal */}
      <Modal 
        isOpen={resetModal.isOpen} 
        onClose={() => setResetModal({ ...resetModal, isOpen: false })}
        title={`Reset Password for ${resetModal.userName}`}
      >
        <form onSubmit={handleResetPassword} className="p-4 space-y-4">
          <Input 
            label="New Password" 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            placeholder="Enter new secure password"
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setResetModal({ ...resetModal, isOpen: false })}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};