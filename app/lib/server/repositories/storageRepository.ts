/** Adaptador de armazenamento de objetos (R2) para arquivos originais de quiz. */
export function createStorageRepository(bucket: R2Bucket) {
	return {
		putJson: (key: string, value: unknown) =>
			bucket.put(key, JSON.stringify(value, null, 2), {
				httpMetadata: { contentType: "application/json; charset=utf-8" },
			}),
	};
}

export type StorageRepository = ReturnType<typeof createStorageRepository>;
