import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { PipelineStats } from "@/components/PipelineStats";
import { KanbanBoard } from "@/components/KanbanBoard";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const allLeads = db.select().from(leads).orderBy(leads.stageOrder).all();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="mt-1 text-text-light">Oversikt over salgspipeline.</p>
      </div>

      <PipelineStats leads={allLeads} />
      <KanbanBoard initialLeads={allLeads} />
    </div>
  );
}
