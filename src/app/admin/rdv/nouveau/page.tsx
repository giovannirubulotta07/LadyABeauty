import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { AppointmentForm } from "@/components/admin/appointments/appointment-form";
import { Card, Loading, PageTitle } from "@/components/admin/ui";
import { isLocalDate, parisDate } from "@/domain/time/paris";
import { listStudioServices } from "@/server/admin/catalog";
import { getClientSummary } from "@/server/admin/clients";

export const metadata: Metadata = { title: "Nouveau rendez-vous" };

export default function NewAppointmentPage({
  searchParams,
}: PageProps<"/admin/rdv/nouveau">) {
  return (
    <Suspense fallback={<Loading />}>
      <AdminGate>
        <NewAppointment searchParams={searchParams} />
      </AdminGate>
    </Suspense>
  );
}

async function NewAppointment({
  searchParams,
}: Pick<PageProps<"/admin/rdv/nouveau">, "searchParams">) {
  await connection();
  const params = await searchParams;
  const day =
    typeof params.jour === "string" && isLocalDate(params.jour)
      ? params.jour
      : parisDate(new Date());
  const time =
    typeof params.heure === "string" && /^\d{2}:\d{2}$/.test(params.heure)
      ? params.heure
      : "";
  const clientId =
    typeof params.cliente === "string" &&
    /^[0-9a-f-]{36}$/i.test(params.cliente)
      ? params.cliente
      : null;
  const [services, client] = await Promise.all([
    listStudioServices(),
    clientId ? getClientSummary(clientId) : null,
  ]);

  return (
    <div className="max-w-2xl">
      <PageTitle
        title="Nouveau rendez-vous"
        back={{ href: `/admin?jour=${day}`, label: "Agenda" }}
      />
      <Card>
        <AppointmentForm
          services={services}
          initialDay={day}
          initialTime={time}
          initialClient={client}
        />
      </Card>
    </div>
  );
}
