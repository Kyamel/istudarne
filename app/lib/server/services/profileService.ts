import { badRequest, notFound } from "../errors";
import type { SocialRepository } from "../repositories/socialRepository";
import type { UserRepository } from "../repositories/userRepository";

export function createProfileService(social: SocialRepository, users: UserRepository) {
	async function resolveTarget(username: string) {
		const target = await users.getByUsername(username);
		if (!target) throw notFound("User not found.");
		return target;
	}

	return {
		async get(username: string, viewerId: string | null) {
			const profile = await social.profile(username, viewerId);
			if (!profile) throw notFound("User not found.");
			return profile;
		},

		async follow(viewerId: string, username: string) {
			const target = await resolveTarget(username);
			if (target.id === viewerId) {
				throw badRequest("You cannot follow yourself.");
			}
			await social.follow(viewerId, target.id);
		},

		async unfollow(viewerId: string, username: string) {
			const target = await resolveTarget(username);
			await social.unfollow(viewerId, target.id);
		},
	};
}

export type ProfileService = ReturnType<typeof createProfileService>;
