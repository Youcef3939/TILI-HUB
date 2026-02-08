import { Navigate } from "react-router-dom";

const AuthGuard = ({ children }) => {
    const isAuthenticated = localStorage.getItem("Token"); // Check if token exists

    return isAuthenticated ? children : <Navigate to="/" replace />;
};

export default AuthGuard;
