import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./component/Login";
import Register from "./component/Register";
import IncidentLogger from "./component/IncidentLogger";
import AdminDashboard from "./component/AdminDashboard";
import ProtectedRoute from "./component/ProtectedRoute";
import NotFound from "./component/NotFound";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/IncidentLogger"
          element={
            <ProtectedRoute>
              <IncidentLogger />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;