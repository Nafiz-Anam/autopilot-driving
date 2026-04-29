import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "./_components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/student/dashboard");
  return (
    <AdminShell user={{ name: session.user.name ?? "Admin", email: session.user.email ?? "" }}>
      {children}
    </AdminShell>
  );
}
