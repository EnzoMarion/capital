export const OVERSEAS_DEPARTMENT_CODES = ["971", "972", "973", "974", "976"] as const;

const overseasDepartmentCodeSet = new Set<string>(OVERSEAS_DEPARTMENT_CODES);

export function isOverseasDepartment(code: string | undefined): boolean {
    return Boolean(code && overseasDepartmentCodeSet.has(code.trim()));
}

export function normalizeDepartmentCode(code: string | undefined): string {
    return code?.trim().toUpperCase().padStart(2, "0") ?? "";
}
