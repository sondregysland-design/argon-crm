import { Card } from "@/components/ui/Card";
import type { Lead } from "@/lib/db/schema";

const stageLabels: Record<string, string> = {
  ny: "Nye",
  kontaktet: "Kontaktet",
  kvalifisert: "Kvalifisert",
  kunde: "Kunde",
};

const stageColors: Record<string, string> = {
  ny: "text-stage-ny",
  kontaktet: "text-stage-kontaktet",
  kvalifisert: "text-stage-kvalifisert",
  kunde: "text-stage-kunde",
};

export function PipelineStats({ leads }: { leads: Lead[] }) {
  const counts = { ny: 0, kontaktet: 0, kvalifisert: 0, kunde: 0 };
  for (const lead of leads) {
    counts[lead.stage as keyof typeof counts]++;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {Object.entries(counts).map(([stage, count]) => (
        <Card key={stage} className="p-4">
          <div className={`text-2xl font-bold ${stageColors[stage]}`}>{count}</div>
          <div className="text-sm text-text-light">{stageLabels[stage]}</div>
        </Card>
      ))}
    </div>
  );
}
