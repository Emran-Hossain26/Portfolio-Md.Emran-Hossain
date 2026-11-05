import { AdminShell } from "@/components/admin/AdminShell";
import { saveContactInfoAction } from "@/app/(admin)/actions";
import { getContactInfo } from "@/lib/cms";

export default async function ContactInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const c = await getContactInfo();
  return (
    <AdminShell current="/admin/contact-info" heading="Contact info">
      {saved ? <p className="admin-check pass">Saved.</p> : null}
      <p className="admin-note">Single record used across the site (footer, contact section, JSON-LD).</p>
      <form action={saveContactInfoAction} className="admin-editor">
        <label>
          Email
          <input name="email" type="email" defaultValue={c.email} required />
        </label>
        <label>
          Phone
          <input name="phone" type="tel" defaultValue={c.phone} />
        </label>
        <label>
          Location (EN)
          <input name="location_en" defaultValue={c.location.en} />
        </label>
        <label>
          Location (BN)
          <input name="location_bn" defaultValue={c.location.bn} />
        </label>
        <label>
          Availability (EN)
          <input name="availability_en" defaultValue={c.availability.en} />
        </label>
        <label>
          Availability (BN)
          <input name="availability_bn" defaultValue={c.availability.bn} />
        </label>
        <div className="admin-actions">
          <button type="submit" className="btn p">
            Save
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
