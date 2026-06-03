import { useState } from "react";
import API from "../api/api";
import { Card, Button, Input, Badge } from "../components/ui";
import { Settings as SettingsIcon, AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw, Trash2, Calendar, FileText } from "lucide-react";

export const Settings = () => {
  const [loadingAction, setLoadingAction] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "", // 'leads', 'projects', 'targets', 'activities', 'all'
    title: "",
    confirmWord: "",
    inputVal: "",
    captchaNum1: 0,
    captchaNum2: 0,
    captchaAnswer: ""
  });

  const resetConfigs = {
    leads: {
      title: "Reset Leads Module",
      description: "This will permanently delete all leads, client details, payment records, messages, and linked activities. Registered users will not be affected.",
      endpoint: "/admin/reset/leads",
      confirmWord: "RESET LEADS",
      badgeColor: "danger"
    },
    projects: {
      title: "Reset Projects Module",
      description: "This will permanently delete all projects, files, tasks, and project comments. Registered users will not be affected.",
      endpoint: "/admin/reset/projects",
      confirmWord: "RESET PROJECTS",
      badgeColor: "danger"
    },
    targets: {
      title: "Reset Targets Module",
      description: "This will permanently wipe all assigned weekly and custom sales targets for all team members.",
      endpoint: "/admin/reset/targets",
      confirmWord: "RESET TARGETS",
      badgeColor: "danger"
    },
    activities: {
      title: "Reset Activity Log",
      description: "This will permanently clear all dashboard notifications and activity audit logs.",
      endpoint: "/admin/reset/activities",
      confirmWord: "RESET LOGS",
      badgeColor: "warning"
    },
    all: {
      title: "Complete System Wipe",
      description: "CRITICAL: This is a nuclear option. It will wipe all transactional data across the entire CRM including leads, payments, projects, targets, activities, and tasks. Only user accounts will be kept.",
      endpoint: "/admin/reset/all",
      confirmWord: "WIPE ALL",
      badgeColor: "danger"
    }
  };

  const openConfirm = (type) => {
    const config = resetConfigs[type];
    setConfirmModal({
      isOpen: true,
      type,
      title: config.title,
      confirmWord: config.confirmWord,
      inputVal: "",
      captchaNum1: Math.floor(Math.random() * 10) + 1,
      captchaNum2: Math.floor(Math.random() * 10) + 1,
      captchaAnswer: ""
    });
  };

  const handleReset = async () => {
    const { type, confirmWord, inputVal, captchaNum1, captchaNum2, captchaAnswer } = confirmModal;
    if (inputVal.trim().toUpperCase() !== confirmWord.toUpperCase()) {
      alert("Please type the confirmation phrase exactly to proceed.");
      return;
    }
    if (parseInt(captchaAnswer) !== (captchaNum1 + captchaNum2)) {
      alert("Incorrect math captcha. Please try again.");
      return;
    }

    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setLoadingAction(type);

    try {
      const token = localStorage.getItem("token");
      const config = resetConfigs[type];
      const res = await API.delete(config.endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data?.message || "Reset operation completed successfully! ✅");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Reset operation failed. Please try again. ❌");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-orange-500 animate-spin-slow" />
            System Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            CRM Administrative Control panel and database maintenance tools
          </p>
        </div>
        <Badge variant="purple" className="px-3 py-1 text-xs font-bold uppercase tracking-widest">
          Admin Only
        </Badge>
      </div>

      {/* Intro warning banner */}
      <Card className="p-6 border border-orange-500/20 bg-orange-500/5 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">Administrative Maintenance Warning</h3>
            <p className="text-sm text-muted-foreground">
              These settings have direct, destructive effects on the Supabase database. Please exercise extreme caution when resetting modules. All deletion actions are permanent and cannot be undone.
            </p>
          </div>
        </div>
      </Card>

      {/* Main Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Modular Wipes */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-foreground">Granular Module Resets</h2>
          </div>

          <div className="space-y-4">
            
            {/* Leads reset */}
            <Card className="p-5 bg-card border border-border flex flex-col justify-between hover:border-red-500/20 transition-all duration-300">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-foreground">Leads &amp; Sales Data</h4>
                  <Badge variant="danger">Destructive</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Deletes all leads, payment logs, and lead timelines. Preserves user profiles.
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  size="sm" 
                  variant="danger" 
                  onClick={() => openConfirm("leads")}
                  disabled={loadingAction !== null}
                >
                  {loadingAction === "leads" ? "Resetting..." : "Reset Leads"}
                </Button>
              </div>
            </Card>

            {/* Projects reset */}
            <Card className="p-5 bg-card border border-border flex flex-col justify-between hover:border-red-500/20 transition-all duration-300">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-foreground">Projects &amp; Tasks</h4>
                  <Badge variant="danger">Destructive</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Deletes all production projects, comments, file links, and project tasks.
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  size="sm" 
                  variant="danger" 
                  onClick={() => openConfirm("projects")}
                  disabled={loadingAction !== null}
                >
                  {loadingAction === "projects" ? "Resetting..." : "Reset Projects"}
                </Button>
              </div>
            </Card>

            {/* Targets reset */}
            <Card className="p-5 bg-card border border-border flex flex-col justify-between hover:border-red-500/20 transition-all duration-300">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-foreground">Weekly Targets</h4>
                  <Badge variant="danger">Destructive</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Clears all weekly targets assigned to sales users. Does not affect existing leads or sales figures.
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  size="sm" 
                  variant="danger" 
                  onClick={() => openConfirm("targets")}
                  disabled={loadingAction !== null}
                >
                  {loadingAction === "targets" ? "Resetting..." : "Reset Targets"}
                </Button>
              </div>
            </Card>

          </div>
        </div>

        {/* Audit Logs + Danger Zone */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-foreground">Danger Zone &amp; Logs</h2>
          </div>

          <div className="space-y-6">
            
            {/* Logs Clear */}
            <Card className="p-5 bg-card border border-border flex flex-col justify-between hover:border-amber-500/20 transition-all duration-300">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-foreground">Notifications &amp; Activity Logs</h4>
                  <Badge variant="warning">Clean Logs</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Clears recent activities on the main dashboard and audit log events. Useful for clearing logs at the start of a period.
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  size="sm" 
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => openConfirm("activities")}
                  disabled={loadingAction !== null}
                >
                  {loadingAction === "activities" ? "Clearing..." : "Clear Activity Logs"}
                </Button>
              </div>
            </Card>

            {/* Nuclear Option */}
            <Card className="p-6 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full -z-10" />
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2.5 rounded-lg bg-red-500/20 text-red-500">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="font-black text-foreground">Complete System Wipe</h4>
                  <p className="text-xs text-red-200 mt-1 leading-relaxed">
                    This resets leads, projects, targets, tasks, comments, files, and activities. The database will return to an empty slate, retaining only user credentials.
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-red-500/20">
                <Button 
                  variant="danger" 
                  onClick={() => openConfirm("all")}
                  disabled={loadingAction !== null}
                  className="font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-[1.02]"
                >
                  {loadingAction === "all" ? "Wiping Database..." : "Wipe All Data"}
                </Button>
              </div>
            </Card>

          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 bg-card border border-border relative animate-in zoom-in-95 duration-200 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle size={28} className="animate-pulse" />
              <h3 className="text-xl font-bold text-foreground">Confirm Destructive Action</h3>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {resetConfigs[confirmModal.type]?.description}
            </p>

            <div className="bg-black/30 p-3 rounded-xl border border-border mb-6">
              <p className="text-xs text-muted-foreground mb-2">To confirm this action, please type the confirmation phrase exactly:</p>
              <div className="text-sm font-black text-red-500 tracking-wider text-center select-none uppercase py-2 bg-black/40 rounded-lg border border-red-500/10">
                {confirmModal.confirmWord}
              </div>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Type the confirmation phrase here"
                value={confirmModal.inputVal}
                onChange={(e) => setConfirmModal({ ...confirmModal, inputVal: e.target.value })}
                className="text-center font-bold tracking-wide uppercase placeholder:lowercase"
              />

              <div className="flex items-center gap-3 bg-card/50 p-3 rounded-lg border border-border">
                <span className="font-semibold text-foreground shrink-0">
                  What is {confirmModal.captchaNum1} + {confirmModal.captchaNum2}?
                </span>
                <Input
                  type="number"
                  placeholder="Answer"
                  value={confirmModal.captchaAnswer}
                  onChange={(e) => setConfirmModal({ ...confirmModal, captchaAnswer: e.target.value })}
                  className="text-center font-bold flex-1"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setConfirmModal({ isOpen: false, type: "", title: "", confirmWord: "", inputVal: "", captchaAnswer: "" })}
                  className="flex-1 bg-card border border-border text-foreground hover:bg-card/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={
                    confirmModal.inputVal.trim().toUpperCase() !== confirmModal.confirmWord ||
                    parseInt(confirmModal.captchaAnswer) !== (confirmModal.captchaNum1 + confirmModal.captchaNum2)
                  }
                  className={`flex-1 font-bold ${
                    confirmModal.inputVal.trim().toUpperCase() === confirmModal.confirmWord &&
                    parseInt(confirmModal.captchaAnswer) === (confirmModal.captchaNum1 + confirmModal.captchaNum2)
                      ? "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                      : "bg-red-600/30 text-white/50 cursor-not-allowed"
                  }`}
                >
                  Confirm Reset
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};
