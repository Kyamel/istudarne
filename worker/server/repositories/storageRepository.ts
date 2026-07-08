/** Object storage adapter (R2) for JSON documents (quiz files, AI payloads). */
export function createStorageRepository(bucket: R2Bucket) {
	return {
		putJson: (key: string, value: unknown) =>
			bucket.put(key, JSON.stringify(value, null, 2), {
				httpMetadata: { contentType: "application/json; charset=utf-8" },
			}),

		async getJson<T>(key: string): Promise<T | null> {
			const object = await bucket.get(key);
			if (!object) return null;
			return (await object.json()) as T;
		},

		delete: (key: string) => bucket.delete(key),
	};
}

export type StorageRepository = ReturnType<typeof createStorageRepository>;
