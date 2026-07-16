import { redirect } from "react-router";

// Landing/marketing SSR is migrated here in a follow-up; for now the root
// forwards into the app, which gates unauthenticated visitors to /login.
export function loader() {
	return redirect("/app");
}

export default function Home() {
	return null;
}
