/* ===================================================================
   Quiz IHC - shared module (common.js)

   Loaded by every page (index, quiz, list). Centralizes:
   - the quiz library: user-uploaded question banks saved in localStorage,
     plus the built-in questions.json bank;
   - per-quiz progress (answers, current position, corrections);
   - JSON validation with human-readable error messages;
   - UI helpers: dialog-based confirm, toasts, option/feedback builders.

   Exposed as the global `window.Quiz`. Pages read/mutate `Quiz.state`
   and call `Quiz.save()`; state is persisted per quiz, so every saved
   quiz keeps its own independent progress.
   =================================================================== */

(() => {
	// ---------------------------------------------------------------
	// Storage keys (v2: one progress entry per quiz)
	// ---------------------------------------------------------------
	const LIBRARY_KEY = "quizihc:library:v2"; // [{ id, title, description, count, savedAt }]
	const ACTIVE_KEY = "quizihc:active:v2"; // id of the last used quiz
	const quizKey = (id) => `quizihc:quiz:${id}`; // full quiz data
	const progressKey = (id) => `quizihc:progress:${id}`; // per-quiz state

	// Legacy v1 keys (single bank + single progress), migrated on load.
	const V1_PROGRESS_KEY = "quiz-ihc-progress-v1";
	const V1_DATA_KEY = "quiz-ihc-data-v1";

	const DEFAULT_ID = "default"; // the bundled questions.json bank

	let quizId = null;
	let DATA = null;
	let QUESTIONS = [];
	let BY_ID = {};
	let state = createEmptyState();

	// ---------------------------------------------------------------
	// Small storage helpers (localStorage may be unavailable/full)
	// ---------------------------------------------------------------

	function readJson(key) {
		try {
			const raw = localStorage.getItem(key);
			return raw ? JSON.parse(raw) : null;
		} catch (_e) {
			return null;
		}
	}

	function writeJson(key, value) {
		try {
			localStorage.setItem(key, JSON.stringify(value));
			return true;
		} catch (e) {
			console.warn(`Não foi possível salvar "${key}":`, e);
			return false;
		}
	}

	function removeKey(key) {
		try {
			localStorage.removeItem(key);
		} catch (_e) {}
	}

	// ---------------------------------------------------------------
	// Progress state
	// ---------------------------------------------------------------

	function createEmptyState() {
		return {
			answers: {}, // { questionId: "A".."E" }
			runIds: [], // ids of the current Quiz round
			index: 0, // current position in the Quiz
			corrected: false, // has this round been corrected?
			onlyWrong: false, // "only wrong" review filter (Quiz mode)
			revealed: {}, // { questionId: true } — revealed in List mode
			listFilter: "all", // active filter in List mode
			mode: "start", // last screen used: "start" | "quiz" | "list"
		};
	}

	function save() {
		if (quizId) writeJson(progressKey(quizId), state);
	}

	function resetProgress(id) {
		removeKey(progressKey(id));
		if (id === quizId) {
			state = createEmptyState();
			state.runIds = QUESTIONS.map((q) => q.id);
			save();
		}
	}

	// ---------------------------------------------------------------
	// Validation — returns readable, specific error messages
	// ---------------------------------------------------------------

	function validateQuizData(data) {
		const errors = [];

		if (!data || typeof data !== "object" || Array.isArray(data)) {
			return { ok: false, errors: ["O arquivo precisa conter um objeto JSON ({...})."] };
		}
		if (data.title != null && typeof data.title !== "string") {
			errors.push('O campo "title" precisa ser um texto.');
		}
		if (!Array.isArray(data.questions) || data.questions.length === 0) {
			errors.push('O campo "questions" precisa ser uma lista com ao menos uma questão.');
			return { ok: false, errors };
		}

		const seen = new Set();
		data.questions.forEach((q, i) => {
			const label = `Questão ${i + 1}`;
			if (!q || typeof q !== "object") {
				errors.push(`${label}: precisa ser um objeto.`);
				return;
			}
			if (q.id == null || q.id === "") {
				errors.push(`${label}: falta o campo "id".`);
			} else if (seen.has(String(q.id))) {
				errors.push(`${label}: o id "${q.id}" está repetido.`);
			} else {
				seen.add(String(q.id));
			}
			if (typeof q.statement !== "string" || !q.statement.trim()) {
				errors.push(`${label}: falta o enunciado ("statement").`);
			}
			if (!Array.isArray(q.options) || q.options.length < 2) {
				errors.push(`${label}: "options" precisa de pelo menos 2 alternativas.`);
			} else {
				q.options.forEach((opt, j) => {
					if (!opt || typeof opt !== "object" || opt.id == null || typeof opt.text !== "string") {
						errors.push(`${label}, alternativa ${j + 1}: precisa de "id" e "text".`);
					}
				});
				if (q.answer == null || !q.options.some((opt) => opt && opt.id === q.answer)) {
					errors.push(
						`${label}: "answer" (${JSON.stringify(q.answer)}) não corresponde a nenhuma alternativa.`,
					);
				}
			}
		});

		return { ok: errors.length === 0, errors };
	}

	// ---------------------------------------------------------------
	// Quiz library (saved banks)
	// ---------------------------------------------------------------

	function libraryList() {
		const list = readJson(LIBRARY_KEY);
		return Array.isArray(list) ? list : [];
	}

	function librarySaveIndex(list) {
		return writeJson(LIBRARY_KEY, list);
	}

	// Adds a validated bank to the library. Returns { ok, id?, errors? }.
	function libraryAdd(data, sourceName) {
		const check = validateQuizData(data);
		if (!check.ok) return { ok: false, errors: check.errors };

		const id = `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
		if (!writeJson(quizKey(id), data)) {
			return {
				ok: false,
				errors: ["Sem espaço no armazenamento do navegador (localStorage cheio)."],
			};
		}
		const entry = {
			id,
			title: data.title || sourceName || "Quiz sem título",
			description: data.description || "",
			count: data.questions.length,
			savedAt: Date.now(),
		};
		librarySaveIndex([entry, ...libraryList()]);
		return { ok: true, id };
	}

	function libraryRemove(id) {
		librarySaveIndex(libraryList().filter((e) => e.id !== id));
		removeKey(quizKey(id));
		removeKey(progressKey(id));
		if (readActiveId() === id) removeKey(ACTIVE_KEY);
	}

	function libraryRemoveAll() {
		libraryList().forEach((e) => {
			removeKey(quizKey(e.id));
			removeKey(progressKey(e.id));
		});
		librarySaveIndex([]);
		removeKey(ACTIVE_KEY);
	}

	// Progress summary used by the home page cards.
	function progressSummary(id, questionsOrTotal) {
		const questions = Array.isArray(questionsOrTotal) ? questionsOrTotal : [];
		const total = questions.length || Number(questionsOrTotal) || 0;
		const saved = readJson(progressKey(id));
		if (!saved || typeof saved !== "object") {
			return {
				answered: 0,
				correct: 0,
				total,
				corrected: false,
				hasProgress: false,
				mode: "start",
			};
		}
		const answers = saved.answers && typeof saved.answers === "object" ? saved.answers : {};
		const ids = questions.length ? questions.map((q) => q.id) : Object.keys(answers);
		const answered = ids.filter((qid) => answers[qid]).length;
		const correct = questions.filter((q) => answers[q.id] === q.answer).length;
		return {
			answered,
			correct,
			total,
			corrected: !!saved.corrected,
			hasProgress: answered > 0 || !!saved.corrected,
			mode: saved.mode || "start",
		};
	}

	function readActiveId() {
		try {
			return localStorage.getItem(ACTIVE_KEY);
		} catch (_e) {
			return null;
		}
	}

	function setActive(id) {
		try {
			localStorage.setItem(ACTIVE_KEY, id);
		} catch (_e) {}
	}

	// ---------------------------------------------------------------
	// Legacy v1 migration (single uploaded bank + single progress)
	// ---------------------------------------------------------------

	function migrateV1() {
		const oldData = readJson(V1_DATA_KEY);
		const oldProgress = readJson(V1_PROGRESS_KEY);
		if (!oldData && !oldProgress) return;

		if (oldData && validateQuizData(oldData).ok) {
			const result = libraryAdd(oldData, "Quiz importado");
			if (result.ok && oldProgress) writeJson(progressKey(result.id), oldProgress);
		} else if (oldProgress) {
			// Progress belonged to the default bank.
			if (!readJson(progressKey(DEFAULT_ID))) writeJson(progressKey(DEFAULT_ID), oldProgress);
		}
		removeKey(V1_DATA_KEY);
		removeKey(V1_PROGRESS_KEY);
	}

	// ---------------------------------------------------------------
	// Loading (default bank via fetch; saved banks via localStorage)
	// ---------------------------------------------------------------

	function applyData(data) {
		DATA = data;
		QUESTIONS = data.questions || [];
		BY_ID = {};
		QUESTIONS.forEach((q) => {
			BY_ID[q.id] = q;
		});
	}

	async function fetchDefault() {
		const res = await fetch("./questions.json");
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return res.json();
	}

	// Loads the quiz selected by ?quiz=<id> (or the last active one) and
	// restores its saved progress. Returns { ok: true } or { ok: false, error }.
	async function load() {
		migrateV1();

		const params = new URLSearchParams(location.search);
		const requested = params.get("quiz") || readActiveId() || DEFAULT_ID;

		if (requested !== DEFAULT_ID) {
			const data = readJson(quizKey(requested));
			if (data) {
				quizId = requested;
				applyData(data);
			}
		}

		if (!quizId) {
			try {
				const data = await fetchDefault();
				quizId = DEFAULT_ID;
				applyData(data);
			} catch (e) {
				console.error(e);
				return { ok: false, error: e };
			}
		}

		setActive(quizId);

		const saved = readJson(progressKey(quizId));
		if (saved && typeof saved === "object") {
			state = Object.assign(createEmptyState(), saved);
			state.runIds = (state.runIds || []).filter((id) => BY_ID[id]);
			if (state.runIds.length === 0) state.runIds = QUESTIONS.map((q) => q.id);
		} else {
			state = createEmptyState();
			state.runIds = QUESTIONS.map((q) => q.id);
		}
		return { ok: true };
	}

	// ---------------------------------------------------------------
	// Question helpers
	// ---------------------------------------------------------------

	function isAnswered(id) {
		return !!state.answers[id];
	}
	function isCorrect(id) {
		const q = BY_ID[id];
		return q && state.answers[id] === q.answer;
	}
	function isWrong(id) {
		return isAnswered(id) && !isCorrect(id);
	}

	function countWrong() {
		return QUESTIONS.map((q) => q.id).filter(isWrong).length;
	}

	// Prepares the "redo only wrong" round: clears ONLY the wrong answers
	// (correct ones are kept) and focuses the Quiz on them.
	function prepareRedoWrong() {
		const wrongIds = QUESTIONS.map((q) => q.id).filter(isWrong);
		if (wrongIds.length === 0) return 0;
		wrongIds.forEach((id) => {
			delete state.answers[id];
			delete state.revealed[id];
		});
		state.runIds = wrongIds;
		state.corrected = false;
		state.onlyWrong = false;
		state.index = 0;
		save();
		return wrongIds.length;
	}

	// ---------------------------------------------------------------
	// UI helpers: dialog confirm + toasts (no native alert/confirm)
	// ---------------------------------------------------------------

	let dialogEl = null;

	function ensureDialog() {
		if (dialogEl) return dialogEl;
		dialogEl = document.createElement("dialog");
		dialogEl.className = "app-dialog";
		dialogEl.innerHTML =
			'<h2 class="app-dialog-title"></h2>' +
			'<p class="app-dialog-message"></p>' +
			'<div class="actions actions-center">' +
			'<button type="button" class="btn" data-action="cancel">Cancelar</button>' +
			'<button type="button" class="btn btn-primary" data-action="confirm">Confirmar</button>' +
			"</div>";
		document.body.appendChild(dialogEl);
		return dialogEl;
	}

	// Promise-based confirmation dialog. Options:
	// { title, message, confirmLabel, cancelLabel, danger }
	function confirmDialog(options) {
		const dialog = ensureDialog();
		dialog.querySelector(".app-dialog-title").textContent = options.title || "Confirmar";
		dialog.querySelector(".app-dialog-message").textContent = options.message || "";

		const confirmBtn = dialog.querySelector('[data-action="confirm"]');
		const cancelBtn = dialog.querySelector('[data-action="cancel"]');
		confirmBtn.textContent = options.confirmLabel || "Confirmar";
		cancelBtn.textContent = options.cancelLabel || "Cancelar";
		confirmBtn.classList.toggle("btn-danger", !!options.danger);
		confirmBtn.classList.toggle("btn-primary", !options.danger);

		return new Promise((resolve) => {
			const finish = (value) => {
				confirmBtn.onclick = null;
				cancelBtn.onclick = null;
				dialog.onclose = null;
				if (dialog.open) dialog.close();
				resolve(value);
			};
			confirmBtn.onclick = () => finish(true);
			cancelBtn.onclick = () => finish(false);
			dialog.onclose = () => finish(false); // Esc key
			dialog.showModal();
			cancelBtn.focus();
		});
	}

	let toastEl = null;
	let toastTimer = 0;

	// Non-blocking notification. type: "info" | "success" | "error".
	function toast(message, type) {
		if (!toastEl) {
			toastEl = document.createElement("div");
			toastEl.className = "toast";
			toastEl.setAttribute("role", "status");
			document.body.appendChild(toastEl);
		}
		toastEl.textContent = message;
		toastEl.dataset.type = type || "info";
		toastEl.classList.add("is-visible");
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 4000);
	}

	// ---------------------------------------------------------------
	// Reusable rendering helpers
	// ---------------------------------------------------------------

	function escapeHtml(str) {
		return String(str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}

	// Builds the <li> of one option. When `locked`, paints the correct one
	// green and the selected wrong one red; the caller must not bind clicks.
	function buildOptionEl(q, opt, selected, locked) {
		const li = document.createElement("li");
		li.className = "option";
		li.dataset.optionId = opt.id;

		if (selected === opt.id) li.classList.add("selected");
		if (locked) {
			li.classList.add("locked");
			if (opt.id === q.answer) li.classList.add("correct");
			else if (selected === opt.id) li.classList.add("wrong");
		}

		const letter = document.createElement("span");
		letter.className = "letter";
		letter.textContent = opt.id;

		const text = document.createElement("span");
		text.className = "text";
		text.textContent = opt.text;

		li.appendChild(letter);
		li.appendChild(text);
		return li;
	}

	// Fills a feedback element (right/wrong + explanation).
	function fillFeedback(fb, q) {
		const correct = isCorrect(q.id);
		const selected = state.answers[q.id] || "nenhuma";
		fb.classList.remove("hidden", "is-correct", "is-wrong");
		fb.classList.add(correct ? "is-correct" : "is-wrong");
		fb.innerHTML =
			"<strong>" +
			(correct ? "Você acertou! ✓" : "Você errou. ✗") +
			"</strong><br>" +
			"Sua resposta: <strong>" +
			escapeHtml(selected) +
			"</strong> · " +
			"Correta: <strong>" +
			escapeHtml(q.answer) +
			"</strong><br>" +
			"<em>" +
			escapeHtml(q.explanation) +
			"</em>";
	}

	// ---------------------------------------------------------------
	// Public API
	// ---------------------------------------------------------------

	window.Quiz = {
		DEFAULT_ID,
		get quizId() {
			return quizId;
		},
		get state() {
			return state;
		},
		get DATA() {
			return DATA;
		},
		get QUESTIONS() {
			return QUESTIONS;
		},
		get BY_ID() {
			return BY_ID;
		},
		load,
		save,
		resetProgress,
		validateQuizData,
		library: {
			list: libraryList,
			add: libraryAdd,
			remove: libraryRemove,
			removeAll: libraryRemoveAll,
			progressSummary,
			setActive,
			getData: (id) => readJson(quizKey(id)),
			getDefaultData: fetchDefault,
		},
		ui: {
			confirm: confirmDialog,
			toast,
		},
		isAnswered,
		isCorrect,
		isWrong,
		countWrong,
		prepareRedoWrong,
		escapeHtml,
		buildOptionEl,
		fillFeedback,
	};
})();
