import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import PlanDetail from './pages/PlanDetail';
import UploadPage from './pages/Upload';
import EnrichPage from './pages/Enrich';
import PrioritizePage from './pages/Prioritize';
import DashboardPage from './pages/Dashboard';
import AdminPage from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/plans/:planId" element={<PlanDetail />}>
            <Route index element={<Navigate to="upload" replace />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="enrich" element={<EnrichPage />} />
            <Route path="prioritize" element={<PrioritizePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
