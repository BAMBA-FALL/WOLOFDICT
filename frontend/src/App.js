// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PublicRoutes from "./routes/PublicRoutes";
import AdminRoutes from "./routes/AdminRoutes";
import ProtectedRoute from "./routes/ProtectedRoute";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import ForgotPasswordForm from "./pages/auth/ForgotPasswordPage";
import ResetPasswordForm from "./pages/auth/ResetPasswordPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes d'authentification */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password/:token" element={<ResetPasswordForm />} />

        {/* Routes publiques */}
        <Route path="/*" element={<PublicRoutes />} />

        {/* Routes Admin protégées */}
        <Route element={<ProtectedRoute requiredRoles={['admin', 'expert']} />}>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;