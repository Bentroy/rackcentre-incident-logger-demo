import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./component/Login";
import Register from "./component/Register";
import IncidentLogger from "./component/IncidentLogger";
import ProtectedRoute from "./component/ProtectedRoute";

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
      </Routes>
    </Router>
  );
}

export default App;
