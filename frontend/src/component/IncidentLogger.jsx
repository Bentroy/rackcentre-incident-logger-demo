// src/component/IncidentLogger.jsx
import { useNavigate } from "react-router-dom";

function IncidentLogger() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove token
    localStorage.removeItem("token");

    // Redirect to login
    navigate("/login");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Incident Logger</h1>

      {/* Your incident logging UI goes here */}

      <button
        onClick={handleLogout}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}

export default IncidentLogger;
