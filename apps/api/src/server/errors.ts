/** Domain error with an associated HTTP status, mapped by the interface layer. */
export class AppError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
		this.name = "AppError";
	}
}

export const unauthorized = (message = "Please sign in to continue.") => new AppError(401, message);
export const forbidden = (message = "Permission denied.") => new AppError(403, message);
export const notFound = (message = "Resource not found.") => new AppError(404, message);
export const conflict = (message: string) => new AppError(409, message);
export const badRequest = (message: string) => new AppError(400, message);
