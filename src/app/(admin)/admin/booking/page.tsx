import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { RowForm, type AdminField } from "@/components/admin/RowForm";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";

type Row = Record<string, unknown> & { id: string };

const SPEC: {
  name: string;
  label: string;
  type: AdminField["type"];
}[] = [
  { name: "slot_date", label: "Date (YYYY-MM-DD)", type: "text" },
  { name: "slot_time", label: "Time (e.g. 16:00–16:45)", type: "text" },
  { name: "capacity", label: "Capacity (sessions)", type: "number" },
  { name: "booked", label: "Already booked", type: "number" },
  { name: "note", label: "Note (optional)", type: "text" },
  { name: "published", label: "Published (visible to visitors)", type: "check" },
];

export default async function AdminBookingPage() {
  await requireAdmin();

  let rows: Row[] = [];
  if (adminConfigured()) {
    try {
      const { data } = await createServiceClient()
        .from("booking_slots")
        .select("id,slot_date,slot_time,capacity,booked,note,published")
        .order("slot_date")
        .order("slot_time");
      rows = (data ?? []) as Row[];
    } catch {
      rows = [];
    }
  }

  const blank: Record<string, unknown> = {
    slot_date: "",
    slot_time: "",
    capacity: 1,
    booked: 0,
    note: "",
    published: true,
  };

  return (
    <AdminShell current="/admin/booking" heading="Booking slots">
      <p className="admin-note">
        Consultation availability (Stage 6 #9). Visitors pick an open slot on
        the contact page; the booking lands in the Inbox as
        “Booking: date time”. Needs the 20261113 migration.
      </p>
      {rows.map((row) => (
        <RowForm
          key={row.id}
          table="booking_slots"
          id={row.id}
          fields={SPEC.map((field) => ({
            ...field,
            value: (row[field.name] ?? (field.type === "check" ? false : "")) as string | boolean,
          }))}
        />
      ))}
      <h2 style={{ fontSize: 20, marginTop: 28 }}>Add slot</h2>
      <RowForm
        table="booking_slots"
        id="__new"
        fields={SPEC.map((f) => ({ ...f, value: blank[f.name] as string | boolean }))}
      />
    </AdminShell>
  );
}
