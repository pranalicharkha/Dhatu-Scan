export function calculateAgeInMonths(
  dateOfBirth: string,
  asOf: Date = new Date(),
): number {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 0;

  let months =
    (asOf.getFullYear() - dob.getFullYear()) * 12 +
    (asOf.getMonth() - dob.getMonth());

  if (asOf.getDate() < dob.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

export function formatAgeFromMonths(ageMonths: number): string {
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;

  if (years <= 0) {
    return `${months} month${months === 1 ? "" : "s"}`;
  }

  if (months === 0) {
    return `${years} year${years === 1 ? "" : "s"}`;
  }

  return `${years} year${years === 1 ? "" : "s"} ${months} month${months === 1 ? "" : "s"}`;
}
