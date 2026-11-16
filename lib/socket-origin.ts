/** Same-origin browser polling may omit Origin. Tickets still authenticate every socket. */
export function allowSocketOrigin(
  origin: string | undefined,
  fetchSite: string | undefined,
  allowedOrigin: string,
) {
  if (origin) return origin === new URL(allowedOrigin).origin;
  return fetchSite === "same-origin" || fetchSite === undefined;
}
