import type { Metadata } from "next"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata: Metadata = {
  title: "Tableau de bord admin",
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-background">
      <AdminDashboard />
    </main>
  )
}
