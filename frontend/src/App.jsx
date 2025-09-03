import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./component/Login";
import Register from "./component/Register";
import IncidentLogger from "./component/IncidentLogger";
import ProtectedRoute from "./component/ProtectedRoute";
import NotFound from "./component/NotFound"; // 👈 Import



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/IncidentLogger"   // 👈 Keep exact casing here
          element={
            <ProtectedRoute>
              <IncidentLogger />
            </ProtectedRoute>
          }
        />
        {/* 👇 Catch all unmatched routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
