/**
 * Error type thrown by server-side helpers. Route handlers translate it into
 * a JSON response with the matching HTTP status.
 */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export const notFound = (what = "Document") => new ApiError(404, `${what} not found`);
export const forbidden = (msg = "You do not have access to this document") =>
  new ApiError(403, msg);
export const unauthorized = () => new ApiError(401, "Please sign in");
export const badRequest = (msg: string) => new ApiError(400, msg);

export function errorResponse(err: unknown): Response {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return Response.json({ error: "Something went wrong" }, { status: 500 });
}
