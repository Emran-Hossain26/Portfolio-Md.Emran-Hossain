import { saveRowAction, deleteRowAction } from "@/app/(admin)/actions";

export type AdminField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "check" | "number" | "select";
  value: string | number | boolean;
  /** Only for type "select". */
  options?: { value: string; label: string }[];
};

/**
 * One editable row → one <form> posting to the whitelisted saveRow action.
 * Server-component only (no client JS needed for plain editors).
 */
export function RowForm({
  table,
  id,
  fields,
}: {
  table: string;
  id: string;
  fields: AdminField[];
}) {
  const action = saveRowAction.bind(null, table, id);
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <form action={action} className="admin-editor">
        <input type="hidden" name="__id" value={id} />
        {fields.map((field) => {
          switch (field.type) {
            case "textarea":
              return (
                <label key={field.name}>
                  {field.label}
                  <textarea name={field.name} defaultValue={String(field.value)} rows={4} />
                </label>
              );
            case "check":
              return (
                <label key={field.name}>
                  <input
                    type="checkbox"
                    name={field.name}
                    defaultChecked={Boolean(field.value)}
                    style={{ marginRight: 8 }}
                  />
                  {field.label}
                </label>
              );
            case "select":
              return (
                <label key={field.name}>
                  {field.label}
                  <select name={field.name} defaultValue={String(field.value)}>
                    {(field.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            case "number":
              return (
                <div className="admin-row" key={field.name}>
                  <label>
                    {field.label}
                    <input
                      type="number"
                      name={field.name}
                      defaultValue={Number(field.value) || 0}
                    />
                  </label>
                </div>
              );
            default:
              return (
                <label key={field.name}>
                  {field.label}
                  <input type="text" name={field.name} defaultValue={String(field.value)} />
                </label>
              );
          }
        })}
        <div className="admin-actions">
          <button type="submit" className="btn p">
            Save
          </button>
        </div>
      </form>
      <form action={deleteRowAction.bind(null, table, id)} className="admin-actions">
        <button type="submit" className="btn admin-danger">
          Delete row
        </button>
      </form>
    </div>
  );
}

/** Field list helper: turns a DB row + spec into ordered AdminFields. */
export function fieldsFromSpec(
  spec: { name: string; label: string; type: AdminField["type"] }[],
  row: Record<string, unknown>,
): AdminField[] {
  return spec.map((field) => ({
    ...field,
    value: (row[field.name] ?? "") as string | number | boolean,
  }));
}
