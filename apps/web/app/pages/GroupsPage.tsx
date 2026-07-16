import type { SubmitEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
	Button,
	ButtonLink,
	ContentGrid,
	Field,
	FormCard,
	Muted,
	Page,
	PageHeader,
	Panel,
	Row,
	VisibilityTag,
} from "../components";
import type { GroupSummary } from "../lib/api";
import { createGroup, fetchGroups, joinGroup } from "../lib/api";
import { m } from "../lib/i18n";

export default function GroupsPage() {
	const navigate = useNavigate();
	const [groups, setGroups] = useState<GroupSummary[]>([]);
	const [status, setStatus] = useState<string>(m.groups_loading());
	const [showForm, setShowForm] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [busy, setBusy] = useState(false);

	function load() {
		fetchGroups()
			.then((data) => {
				setGroups(data.groups);
				setStatus(data.groups.length ? "" : m.groups_empty());
			})
			.catch((error: Error) => setStatus(error.message));
	}

	useEffect(load, []);

	async function handleCreate(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		try {
			const { id } = await createGroup({
				name,
				description: description || null,
				visibility: "public",
			});
			navigate(`/groups/${id}`);
		} catch (error) {
			setStatus(error instanceof Error ? error.message : m.auth_generic_error());
		} finally {
			setBusy(false);
		}
	}

	async function handleJoin(id: string) {
		await joinGroup(id);
		load();
	}

	return (
		<Page>
			<PageHeader
				eyebrow={m.groups_eyebrow()}
				title={m.groups_title()}
				description={m.groups_subtitle()}
				actions={
					<Button
						variant="primary"
						onClick={() => setShowForm((value) => !value)}
						aria-expanded={showForm}
					>
						{showForm ? m.groups_cancel() : m.groups_create()}
					</Button>
				}
			/>

			{showForm ? (
				<FormCard onSubmit={handleCreate}>
					<Field
						label={m.groups_name()}
						minLength={2}
						required
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
					<Field
						label={m.groups_description()}
						value={description}
						onChange={(event) => setDescription(event.target.value)}
					/>
					<Button variant="primary" disabled={busy} type="submit">
						{busy ? m.groups_creating() : m.groups_create_public()}
					</Button>
				</FormCard>
			) : null}

			{status ? <Muted>{status}</Muted> : null}

			<ContentGrid>
				{groups.map((group) => (
					<Panel key={group.id}>
						<Row justify="between" gap="sm">
							<h2 className="text-xl">{group.name}</h2>
							<VisibilityTag visibility={group.visibility} />
						</Row>
						<p>{group.description || "—"}</p>
						<Muted>{m.groups_members({ count: group.memberCount })}</Muted>
						<Row justify="end" gap="sm">
							{group.isMember ? (
								<ButtonLink to={`/groups/${group.id}`} variant="primary">
									{m.groups_open()}
								</ButtonLink>
							) : (
								<Button onClick={() => handleJoin(group.id)}>{m.groups_join()}</Button>
							)}
						</Row>
					</Panel>
				))}
			</ContentGrid>
		</Page>
	);
}
