import { db } from "@/lib/db";
import { leads, activities, quotes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ActivityLog } from "@/components/ActivityLog";
import { formatOrgNumber } from "@/lib/utils";
import { EditableField } from "@/components/EditableField";
import { EditableSelectField } from "@/components/EditableSelectField";
import { PROJECT_TYPES, PROJECT_TYPE_LABELS } from "@/lib/constants";
import Link from "next/link";
import { EmailComposer } from "@/components/EmailComposer";
import { FollowUpStatus } from "@/components/FollowUpStatus";
import { LeadQuotes } from "@/components/LeadQuotes";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await db.select().from(leads).where(eq(leads.id, parseInt(id))).get();
  if (!lead) notFound();

  const leadActivities = await db.select().from(activities)
    .where(eq(activities.leadId, lead.id))
    .orderBy(desc(activities.createdAt))
    .all();

  const leadQuotes = await db.select({
    id: quotes.id,
    quoteNumber: quotes.quoteNumber,
    status: quotes.status,
    createdAt: quotes.createdAt,
  }).from(quotes).where(eq(quotes.leadId, lead.id)).orderBy(desc(quotes.createdAt)).all();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-text-light hover:text-text">&larr;</Link>
        <div>
          <h1 className="text-2xl font-bold text-text">{lead.name}</h1>
          <p className="text-sm text-text-light">{formatOrgNumber(lead.orgNumber)}</p>
        </div>
        <Badge label={lead.stage} className="ml-auto" />
        <EmailComposer leadId={lead.id} leadName={lead.name} hasEmail={!!lead.email} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-text">Bedriftsinformasjon</h2>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {[
                ["Bransje", lead.industryName],
                ["NACE-kode", lead.industryCode],
                ["Adresse", [lead.address, lead.postalCode, lead.city].filter(Boolean).join(", ")],
                ["Kommune", lead.kommune],
              ].filter(([, value]) => value).map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-text-light">{label}</dt>
                  <dd className="font-medium text-text">{value}</dd>
                </div>
              ))}
              {(lead.website || lead.googleWebsite) && (
                <div>
                  <dt className="text-text-light">Nettside</dt>
                  <dd className="font-medium text-text">
                    <a href={lead.website || lead.googleWebsite || ""} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {(lead.website || lead.googleWebsite || "").replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                </div>
              )}
              {(lead.phone || lead.googlePhone) && (
                <div>
                  <dt className="text-text-light">Telefon</dt>
                  <dd className="font-medium text-text">{lead.phone || lead.googlePhone}</dd>
                </div>
              )}
              <div className="group">
                <EditableField leadId={lead.id} field="email" value={lead.email} label="E-post" />
              </div>
              <div className="group">
                <EditableField leadId={lead.id} field="contactPerson" value={lead.contactPerson} label="Kontaktperson" />
              </div>
              {[
                ["Ansatte", lead.employees?.toString()],
                ["Stiftet", lead.foundedDate],
              ].filter(([, value]) => value).map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-text-light">{label}</dt>
                  <dd className="font-medium text-text">{value}</dd>
                </div>
              ))}
              {lead.googleRating != null && (
                <div>
                  <dt className="text-text-light">Google-vurdering</dt>
                  <dd className="font-medium text-text">
                    <span className="text-amber-500">{"★".repeat(Math.round(lead.googleRating))}</span>
                    <span className="text-gray-300">{"★".repeat(5 - Math.round(lead.googleRating))}</span>
                    {" "}{lead.googleRating.toFixed(1)}
                    {lead.googleReviewsCount != null && (
                      <span className="ml-1 text-text-light">({lead.googleReviewsCount} anmeldelser)</span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {(lead.detailedSummary || lead.summary || lead.notes) && (
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-text">Om bedriften</h2>
              {lead.detailedSummary ? (
                <p className="text-sm leading-relaxed text-text">{lead.detailedSummary}</p>
              ) : lead.summary ? (
                <p className="text-sm font-medium text-text">{lead.summary}</p>
              ) : null}
              {lead.notes && (
                <p className={`text-sm leading-relaxed text-text-light ${lead.detailedSummary || lead.summary ? "mt-3 border-t border-gray-100 pt-3" : ""}`}>
                  <span className="text-xs font-medium text-text-light">Rådata fra nettside:</span><br />{lead.notes}
                </p>
              )}
            </Card>
          )}

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-text">Prosjekt & Salg</h2>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div className="group">
                <EditableSelectField
                  leadId={lead.id}
                  field="projectType"
                  value={lead.projectType}
                  label="Prosjekttype"
                  options={PROJECT_TYPES}
                  displayLabel={lead.projectType ? PROJECT_TYPE_LABELS[lead.projectType] : undefined}
                />
              </div>
              <div className="group">
                <EditableField leadId={lead.id} field="quote" value={lead.quote} label="Tilbud (NOK)" type="number" />
              </div>
              <div className="group">
                <EditableField leadId={lead.id} field="meetingUrl" value={lead.meetingUrl} label="Møte-URL" type="url" />
              </div>
              <div className="group">
                <EditableField leadId={lead.id} field="discoveryUrl" value={lead.discoveryUrl} label="Discovery-URL" type="url" />
              </div>
              <div className="group">
                <EditableField leadId={lead.id} field="proposalUrl" value={lead.proposalUrl} label="Tilbuds-URL" type="url" />
              </div>
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
          <Card className="p-4">
            <FollowUpStatus leadId={lead.id} />
          </Card>
          <Card className="p-4">
            <LeadQuotes leadId={lead.id} quotes={leadQuotes} />
          </Card>
        </div>
      </div>
    </div>
  );
}
