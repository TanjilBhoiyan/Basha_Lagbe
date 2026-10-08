/**
 * The app uses "bachelor-male" / "semi-furnished" / "fire-safety",
 * Prisma enum names can't contain "-", so they use "_" in code.
 */
export const toApiEnum = (value: string) => value.replace(/_/g, '-');
export const fromApiEnum = <T extends string>(value: string) => value.replace(/-/g, '_') as T;