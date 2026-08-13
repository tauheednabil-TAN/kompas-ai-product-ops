/**
 * Stub for the `server-only` package.
 *
 * The real package throws on import from a client bundle. That guard is
 * enforced by Next during the build, where it matters; inside Vitest it would
 * simply make every server module untestable.
 */
export {}
