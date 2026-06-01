import { useAuth } from "../lib/useAuth";
import GymDashboard from "./dashboard/GymDashboard";
import MemberDashboard from "./dashboard/MemberDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === "member") {
    return <MemberDashboard />;
  }

  return <GymDashboard />;
}
