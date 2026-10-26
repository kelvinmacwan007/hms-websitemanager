import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isManagerHost, managerSession } from "@/lib/manager/session";
import { ManagerLogin } from "./ManagerLogin";
import "./login.css";
export default async function LoginPage() {
  if (!isManagerHost((await headers()).get("host"))) notFound();
  if (await managerSession()) redirect("/website-manager");
  return <ManagerLogin hmsMode={process.env.WEBSITE_MANAGER_AUTH === "hms"} />;
}
