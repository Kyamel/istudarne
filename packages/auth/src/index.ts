export { createAuth } from "./create-auth";
export type { Auth, CreateAuthConfig } from "./create-auth";
export {
	DEFAULT_AUTH_POLICY,
	OPTIONAL_VERIFICATION_POLICY,
	type AuthPolicy,
	type EmailVerificationPolicy,
} from "./policy";
export {
	createConsoleEmailSender,
	type AuthEmailSender,
	type AuthLinkEmail,
	type AuthNewDeviceEmail,
} from "./emails";
export { describeDevice, sameDevice } from "./device";
