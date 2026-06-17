import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import AnalysePage from "./pages/AnalysePage";
import BatchPage from "./pages/BatchPage";
import ModelPage from "./pages/ModelPage";

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="analyse" element={<AnalysePage />} />
        <Route path="lot" element={<BatchPage />} />
        <Route path="modele" element={<ModelPage />} />
      </Route>
    </Routes>
  );
}
