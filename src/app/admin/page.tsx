import { Suspense } from "react";
import AdminLayout from "./layout";
import AdminDashboard from "./dashboard/page";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    </Suspense>
  );
}