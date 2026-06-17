interface Env {
	DB: D1Database;
	QUIZ_FILES: R2Bucket;
	ASSETS: Fetcher;
	STUDY_GROUP_CHAT: DurableObjectNamespace;
}
