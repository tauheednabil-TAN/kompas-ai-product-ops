/**
 * Emits a script that runs during HTML parsing, before first paint.
 *
 * `type` is `text/javascript` on the server and `text/plain` on the client:
 * React warns when a component renders a `<script>` tag, and scripts inserted
 * by client-side DOM updates never execute anyway. `suppressHydrationWarning`
 * covers the resulting type mismatch.
 *
 * This is the pattern documented in
 * node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
