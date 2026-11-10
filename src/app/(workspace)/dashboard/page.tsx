import DashboardView from "@/components/dashboard/dashboardView";
import Loader from "@/components/Loader";
import { Suspense } from "react";

export default async function DashboardPage() {
  return (
    <Suspense fallback={<Loader />}>
      <DashboardView />
    </Suspense>
  );
}
