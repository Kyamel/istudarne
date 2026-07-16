import { Navigate } from "react-router";
import { useAuth } from "~/auth/context";
import LoginPage from "~/pages/LoginPage";

export default function Login() {
	const { user, loading } = useAuth();
	if (!loading && user) return <Navigate to="/app" replace />;
	return <LoginPage />;
}
