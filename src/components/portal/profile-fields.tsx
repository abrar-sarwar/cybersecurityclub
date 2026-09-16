import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { graduationYearOptions, INTERESTS, MONTHS } from "@/lib/portal";

export type ProfileValues = {
  full_name?: string | null;
  grad_month?: number | string | null;
  grad_year?: number | string | null;
  major?: string | null;
  interests?: readonly string[] | null;
  notify_events?: boolean | string | null;
};

/** Profile inputs shared by onboarding and settings. */
export function ProfileFields({ values, errors = {} }: { values: ProfileValues; errors?: Record<string, string> }) {
  const years = graduationYearOptions();
  const selectedYear = values.grad_year ? Number(values.grad_year) : null;
  if (selectedYear && !years.includes(selectedYear)) years.unshift(selectedYear);
  const interests = new Set(values.interests ?? []);

  return (
    <>
      <Field label="Name" name="full_name" error={errors.full_name}>
        <Input name="full_name" autoComplete="name" required maxLength={120} defaultValue={values.full_name ?? ""} error={errors.full_name} />
      </Field>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-semibold text-navy-900">Expected graduation</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="grad_month" className="sr-only">Month</label>
            <Select name="grad_month" required defaultValue={values.grad_month ? String(values.grad_month) : ""} error={errors.grad_month}>
              <option value="" disabled>Month</option>
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="grad_year" className="sr-only">Year</label>
            <Select name="grad_year" required defaultValue={selectedYear ? String(selectedYear) : ""} error={errors.grad_year}>
              <option value="" disabled>Year</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Select>
          </div>
        </div>
        {errors.grad_month || errors.grad_year ? (
          <p className="text-[0.8125rem] font-medium text-danger-700" role="alert">{errors.grad_month ?? errors.grad_year}</p>
        ) : null}
      </fieldset>

      <Field label="Major" name="major" optional error={errors.major}>
        <Input name="major" maxLength={120} defaultValue={values.major ?? ""} error={errors.major} />
      </Field>

      <fieldset>
        <legend className="flex w-full items-baseline justify-between gap-3 text-sm font-semibold text-navy-900">
          <span>Interests</span>
          <span className="text-xs font-medium text-muted">Optional</span>
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {INTERESTS.map((interest) => (
            <label
              key={interest.value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-line-strong bg-surface px-3.5 text-[0.95rem] text-navy-900 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
            >
              <input
                type="checkbox"
                name="interests"
                value={interest.value}
                defaultChecked={interests.has(interest.value)}
                className="size-4 shrink-0 accent-brand-600"
              />
              {interest.label}
            </label>
          ))}
        </div>
        {errors.interests ? <p className="mt-1.5 text-[0.8125rem] font-medium text-danger-700" role="alert">{errors.interests}</p> : null}
      </fieldset>

      <Checkbox
        name="notify_events"
        label="Email me about upcoming club events"
        description="Occasional announcements. Every email has an unsubscribe link."
        defaultChecked={values.notify_events === true || values.notify_events === "on"}
      />
    </>
  );
}
