import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
      });

      setMessage(`✅ Registered! Welcome ${res.data.name}`);
      navigate("/login");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "❌ Something went wrong."
      );
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-gray-100">
      <Motion.div
        key={shake ? "shake" : "no-shake"}
        initial={{ opacity: 0, y: -50 }}
        animate={
          shake
            ? { x: [-10, 10, -10, 10, 0] }
            : { opacity: 1, y: 0 }
        }
        transition={{ duration: shake ? 0.4 : 0.8, ease: "easeOut" }}
        className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8"
      >
        <Motion.h2
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-3xl font-bold text-center text-[#0033A0] mb-6"
        >
          Register
        </Motion.h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Motion.input
            whileFocus={{ scale: 1.02 }}
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg 
              focus:ring-2 focus:ring-[#0033A0] focus:outline-none 
              hover:border-[#0033A0] transition duration-300"
          />
          <Motion.input
            whileFocus={{ scale: 1.02 }}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg 
              focus:ring-2 focus:ring-[#0033A0] focus:outline-none 
              hover:border-[#0033A0] transition duration-300"
          />

          {/* Password Input with Show/Hide */}
          <div className="relative">
            <Motion.input
              whileFocus={{ scale: 1.02 }}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-[#0033A0] focus:outline-none 
                hover:border-[#0033A0] transition duration-300 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <Motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-[#0033A0] hover:bg-blue-900 text-white font-semibold p-3 rounded-lg transition"
          >
            Register
          </Motion.button>
        </form>

        {message && (
          <Motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center text-sm text-gray-700"
          >
            {message}
          </Motion.p>
        )}

        <Motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-gray-600"
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#0033A0] font-medium hover:underline"
          >
            Login
          </Link>
        </Motion.p>
      </Motion.div>
    </div>
  );
}

export default Register;
