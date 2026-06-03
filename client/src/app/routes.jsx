import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { LeadDetails } from './pages/LeadDetails';
import { Pipeline } from './pages/Pipeline';
import Activity from "/src/app/pages/Activity.jsx";
import { Targets } from './pages/Targets';
import { Team } from './pages/Team';
import { ProductionDashboard } from './pages/ProductionDashboard';
import { ProductionProjects } from './pages/ProductionProjects';
import { ProjectDetails } from './pages/ProjectDetails';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotFound } from './pages/NotFound';
import { SalesDashboard } from './pages/salesdashboard';
import { Reports } from './pages/reports';
import { Settings } from './pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
         {
        path: 'salesdashboard',
        element: <SalesDashboard />
      },
      {
        path: 'leads',
        element: <Leads />
      },
      {
        path: 'leads/:id',
        element: <LeadDetails />
      },
      {
        path: 'pipeline',
        element: <Pipeline />
      },
      {
        path: 'activity',
        element: <Activity />
      },
      {
        path: 'targets',
        element: <Targets />
      },
      {
        path: 'team',
        element: <Team />
      },
      {
        path: 'production',
        element: <ProductionDashboard />
      },
      {
        path: 'production/projects',
        element: <ProductionProjects />
      },
      {
        path: 'production/projects/:id',
        element: <ProjectDetails />
      },
      {
        path: "reports",
        element: <Reports />
      },
      {
        path: "settings",
        element: <ProtectedRoute allowedRoles={["admin"]}><Settings /></ProtectedRoute>
      },
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
]);