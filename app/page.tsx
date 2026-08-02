import { cookies } from "next/headers";
import { getAIConfig } from "@/lib/config";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";

export default async function Page() {
  const isAuth = (await cookies()).get("auth")?.value === "true";

  if (!isAuth) {
    return <Login />;
  }

  const initialConfig = await getAIConfig();
  return <Dashboard initialConfig={initialConfig} />;
}
