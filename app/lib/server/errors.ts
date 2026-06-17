/** Erro de domínio com status HTTP associado, mapeado pela camada de interface. */
export class AppError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
		this.name = "AppError";
	}
}

export const unauthorized = (message = "Faça login para continuar.") => new AppError(401, message);
export const forbidden = (message = "Sem permissão.") => new AppError(403, message);
export const notFound = (message = "Recurso não encontrado.") => new AppError(404, message);
export const conflict = (message: string) => new AppError(409, message);
export const badRequest = (message: string) => new AppError(400, message);
