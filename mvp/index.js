/* ===================================================================
   Quiz IHC - tela inicial (index.js)
   Biblioteca local de quizzes: banco padrão + uploads salvos no
   localStorage, com progresso independente por quiz.
   =================================================================== */

(() => {
	const $ = (id) => document.getElementById(id);
	let defaultData = null;

	function quizUrl(page, id, extra) {
		const params = new URLSearchParams();
		params.set("quiz", id);
		if (extra) {
			Object.entries(extra).forEach(([key, value]) => {
				params.set(key, value);
			});
		}
		return `${page}?${params.toString()}`;
	}

	function showError(targetId, title, details) {
		const box = $(targetId);
		const list = Array.isArray(details) ? details : [details].filter(Boolean);
		box.classList.remove("hidden");
		box.innerHTML =
			`<strong>${Quiz.escapeHtml(title)}</strong>` +
			(list.length
				? `<ul>${list.map((item) => `<li>${Quiz.escapeHtml(item)}</li>`).join("")}</ul>`
				: "");
	}

	function clearError(targetId) {
		const box = $(targetId);
		box.classList.add("hidden");
		box.innerHTML = "";
	}

	function formatDate(ts) {
		if (!ts) return "";
		return new Intl.DateTimeFormat("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date(ts));
	}

	function questionCount(n) {
		return `${n} ${n === 1 ? "questão" : "questões"}`;
	}

	function entryData(entry) {
		return entry.id === Quiz.DEFAULT_ID ? defaultData : Quiz.library.getData(entry.id);
	}

	function buildEntries() {
		const fallback = {
			title: "Banco padrão",
			description: "Arquivo questions.json do MVP.",
			questions: [],
		};
		const data = defaultData || fallback;
		return [
			{
				id: Quiz.DEFAULT_ID,
				title: data.title || fallback.title,
				description: data.description || fallback.description,
				count: data.questions.length || 0,
				savedAt: null,
				isDefault: true,
			},
			...Quiz.library.list().map((entry) => ({ ...entry, isDefault: false })),
		];
	}

	function render() {
		const entries = buildEntries();
		const box = $("quiz-library");
		box.innerHTML = "";

		entries.forEach((entry) => {
			const data = entryData(entry);
			const questions = data?.questions || [];
			const summary = Quiz.library.progressSummary(
				entry.id,
				questions.length ? questions : entry.count,
			);
			box.appendChild(buildCard(entry, summary));
		});

		$("btn-delete-all").classList.toggle("hidden", Quiz.library.list().length === 0);
	}

	function buildCard(entry, summary) {
		const card = document.createElement("article");
		card.className = "library-card";
		card.dataset.quizId = entry.id;

		const answeredText = summary.total
			? `${summary.answered} de ${summary.total} respondidas`
			: questionCount(summary.answered);
		const scoreText = summary.corrected
			? `Corrigido: ${summary.correct} acerto(s)`
			: "Ainda não corrigido";

		card.innerHTML =
			'<div class="library-card-main">' +
			`<p class="topic-tag">${entry.isDefault ? "Padrão" : "Salvo"}</p>` +
			`<h3>${Quiz.escapeHtml(entry.title)}</h3>` +
			`<p class="muted">${Quiz.escapeHtml(entry.description || "Sem descrição.")}</p>` +
			'<div class="library-meta">' +
			`<span>${questionCount(entry.count || summary.total || 0)}</span>` +
			(summary.hasProgress
				? `<span>${answeredText}</span><span>${scoreText}</span>`
				: "<span>Sem progresso</span>") +
			(entry.savedAt
				? `<span>Salvo em ${formatDate(entry.savedAt)}</span>`
				: "<span>Banco incluído no app</span>") +
			"</div>" +
			"</div>";

		const actions = document.createElement("div");
		actions.className = "library-actions";

		actions.appendChild(
			actionButton(summary.hasProgress ? "Continuar" : "Começar", "btn btn-primary", () => {
				startQuiz(entry.id, !summary.hasProgress);
			}),
		);
		actions.appendChild(actionLink("Lista", "btn", quizUrl("list.html", entry.id)));
		actions.appendChild(
			actionButton("Resetar progresso", "btn btn-ghost", () => resetProgress(entry.id), {
				disabled: !summary.hasProgress,
			}),
		);
		if (!entry.isDefault) {
			actions.appendChild(
				actionButton("Excluir", "btn btn-ghost danger-text", () =>
					deleteQuiz(entry.id, entry.title),
				),
			);
		}

		card.appendChild(actions);
		return card;
	}

	function actionButton(label, className, onClick, options = {}) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = className;
		button.textContent = label;
		button.disabled = !!options.disabled;
		button.addEventListener("click", onClick);
		return button;
	}

	function actionLink(label, className, href) {
		const link = document.createElement("a");
		link.className = className;
		link.href = href;
		link.textContent = label;
		return link;
	}

	function startQuiz(id, fresh) {
		Quiz.library.setActive(id);
		if (fresh) Quiz.resetProgress(id);
		location.href = quizUrl("quiz.html", id);
	}

	async function resetProgress(id) {
		const ok = await Quiz.ui.confirm({
			title: "Resetar progresso",
			message: "Isto apaga respostas, revisões e resultado salvo apenas deste quiz.",
			confirmLabel: "Resetar",
			danger: true,
		});
		if (!ok) return;
		Quiz.resetProgress(id);
		Quiz.ui.toast("Progresso resetado.", "success");
		render();
	}

	async function deleteQuiz(id, title) {
		const ok = await Quiz.ui.confirm({
			title: "Excluir quiz salvo",
			message: `O quiz "${title}" será removido deste navegador junto com o progresso dele.`,
			confirmLabel: "Excluir",
			danger: true,
		});
		if (!ok) return;
		Quiz.library.remove(id);
		Quiz.ui.toast("Quiz excluído.", "success");
		render();
	}

	async function deleteAllSaved() {
		const count = Quiz.library.list().length;
		if (count === 0) return;
		const ok = await Quiz.ui.confirm({
			title: "Excluir todos os quizzes salvos",
			message: `Isto remove ${count} quiz(es) importado(s) e seus progressos. O banco padrão continua disponível.`,
			confirmLabel: "Excluir todos",
			danger: true,
		});
		if (!ok) return;
		Quiz.library.removeAll();
		Quiz.ui.toast("Quizzes salvos excluídos.", "success");
		render();
	}

	function setUploadStatus(message, type) {
		const el = $("file-status");
		el.textContent = message || "";
		el.dataset.type = type || "info";
	}

	function handleFileUpload(e) {
		const file = e.target.files?.[0];
		clearError("file-errors");
		if (!file) return;

		setUploadStatus("Lendo arquivo...", "info");
		const reader = new FileReader();

		reader.onerror = () => {
			setUploadStatus("");
			showError("file-errors", "Não foi possível ler o arquivo.", [
				"Tente selecionar o JSON novamente.",
			]);
		};

		reader.onload = () => {
			try {
				const data = JSON.parse(reader.result);
				const result = Quiz.library.add(data, file.name.replace(/\.json$/i, ""));
				if (!result.ok) {
					setUploadStatus("");
					showError("file-errors", "JSON inválido", result.errors);
					return;
				}
				$("file-json").value = "";
				setUploadStatus(
					`Salvo: ${questionCount(data.questions.length)} de ${file.name}.`,
					"success",
				);
				Quiz.ui.toast("Quiz salvo na biblioteca local.", "success");
				render();
			} catch (err) {
				setUploadStatus("");
				showError("file-errors", "JSON inválido", [
					err instanceof Error ? err.message : "Confira a sintaxe do arquivo.",
				]);
			}
		};

		reader.readAsText(file, "utf-8");
	}

	function bind() {
		$("file-json").addEventListener("change", handleFileUpload);
		$("btn-delete-all").addEventListener("click", deleteAllSaved);
	}

	async function init() {
		bind();
		const loaded = await Quiz.load();
		try {
			defaultData = await Quiz.library.getDefaultData();
		} catch (_e) {
			defaultData = Quiz.quizId === Quiz.DEFAULT_ID ? Quiz.DATA : null;
		}
		if (!loaded.ok && Quiz.library.list().length === 0) {
			showError("load-error", "Não foi possível carregar o questions.json", [
				"Se você abriu por file://, rode um servidor local simples.",
				"Você ainda pode adicionar quizzes selecionando um arquivo JSON abaixo.",
			]);
		}
		render();
	}

	document.addEventListener("DOMContentLoaded", init);
})();
