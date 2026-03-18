import { db } from "@/lib/db";
import { leads, activities } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ActivityLog } from "@/components/ActivityLog";
import { formatOrgNumber } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await db.select().from(leads).where(eq(leads.id, parseInt(id))).get();
  if (!lead) notFound();

  const leadActivities = await db.select().from(activities)
    .where(eq(activities.leadId, lead.id))
    .orderBy(desc(activities.createdAt))
    .all();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-text-light hover:text-text">&larr;</Link>
        <div>
          <h1 className="text-2xl font-bold text-text">{lead.name}</h1>
          <p className="text-sm text-text-light">{formatOrgNumber(lead.orgNumber)}</p>
        </div>
        <Badge label={lead.stage} className="ml-auto" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-text">Bedriftsinformasjon</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Bransje", lead.industryName],
                ["NACE-kode", lead.industryCode],
                ["Adresse", [lead.address, lead.postalCode, lead.city].filter(Boolean).join(", ")],
                ["Kommune", lead.kommune],
                ["Nettside", lead.website],
                ["Telefon", lead.phone],
                ["E-post", lead.email],
                ["Kontaktperson", lead.contactPerson],
                ["Ansatte", lead.employees?.toString()],
                ["Stiftet", lead.foundedDate],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-text-light">{label}</dt>
                  <dd className="font-medium text-text">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-text">Aktivitetslogg</h2>
            <ActivityLog leadId={lead.id} initialActivities={leadActivities} />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-2 text-sm font-semibold text-text">Data-synk</h3>
            <div className="space-y-2 text-xs text-text-light">
              <div>Brønnøysund: {lead.brregSyncedAt ? new Date(lead.brregSyncedAt).toLocaleDateString("nb-NO") : "Ikke synkronisert"}</div>
              <div>Proff.no: {lead.proffSyncedAt ? new Date(lead.proffSyncedAt).toLocaleDateString("nb-NO") : "Ikke synkronisert"}</div>
              <div>Google: {lead.googleSyncedAt ? new Date(lead.googleSyncedAt).toLocaleDateString("nb-NO") : "Ikke synkronisert"}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
