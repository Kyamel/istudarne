/* ===================================================================
   Quiz IHC - módulo compartilhado (common.js)

   Carregado por TODAS as páginas (index, quiz, list). Centraliza:
   - carregamento das questões (questions.json ou upload);
   - estado da sessão e persistência no localStorage;
   - helpers de questões (acertou/errou) e de UI (alternativa, feedback).

   Exposto como objeto global `window.Quiz`. As páginas leem/alteram
   `Quiz.state` e chamam `Quiz.save()` para persistir. Como o estado vive
   no localStorage, ele é o mesmo entre as páginas.
   =================================================================== */

(() => {
	const STORAGE_KEY = "quiz-ihc-progress-v1"; // progresso (respostas etc.)
	const DATA_KEY = "quiz-ihc-data-v1"; // banco enviado pelo usuário

	let DATA = null;
	let QUESTIONS = [];
	let BY_ID = {};
	let state = createEmptyState();

	// -----------------------------------------------------------------
	// Estado e persistência
	// -----------------------------------------------------------------

	function createEmptyState() {
		return {
			answers: {}, // { id: "A".."E" } — progresso ÚNICO (quiz e lista)
			runIds: [], // ids da rodada atual do Quiz
			index: 0, // posição atual no Quiz
			corrected: false, // o Quiz já foi corrigido?
			onlyWrong: false, // filtro "apenas erradas" no Quiz (revisão)
			revealed: {}, // { id: true } — respostas reveladas no modo Lista
			listFilter: "all", // filtro ativo no modo Lista
			mode: "start", // última tela usada: "start" | "quiz" | "list"
		};
	}

	function save() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch (e) {
			console.warn("Não foi possível salvar o progresso:", e);
		}
	}

	function loadSaved() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return null;
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed === "object") return parsed;
		} catch (e) {
			console.warn("Progresso salvo inválido:", e);
		}
		return null;
	}

	function clear() {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch (_e) {}
	}

	// --- banco de questões enviado pelo usuário (persistido à parte) ---

	function saveData() {
		try {
			localStorage.setItem(DATA_KEY, JSON.stringify(DATA));
		} catch (e) {
			console.warn("Não foi possível salvar o banco enviado:", e);
		}
	}

	function loadStoredData() {
		try {
			const raw = localStorage.getItem(DATA_KEY);
			if (!raw) return null;
			const parsed = JSON.parse(raw);
			if (parsed && Array.isArray(parsed.questions) && parsed.questions.length) {
				return parsed;
			}
		} catch (e) {
			console.warn("Banco enviado inválido:", e);
		}
		return null;
	}

	function clearData() {
		try {
			localStorage.removeItem(DATA_KEY);
		} catch (_e) {}
	}

	// Aplica e persiste um banco enviado pelo usuário (uploads).
	function setUploadedData(data) {
		applyData(data);
		saveData();
	}

	// Volta ao banco padrão (questions.json) descartando o enviado.
	function usesUploadedData() {
		return !!loadStoredData();
	}

	function resetAll() {
		clear();
		state = createEmptyState();
		state.runIds = QUESTIONS.map((q) => q.id);
		save();
	}

	// -----------------------------------------------------------------
	// Dados (questions.json)
	// -----------------------------------------------------------------

	function applyData(data) {
		DATA = data;
		QUESTIONS = data.questions || [];
		BY_ID = {};
		QUESTIONS.forEach((q) => {
			BY_ID[q.id] = q;
		});
	}

	// Carrega o banco de questões e recupera o progresso salvo.
	// Prioridade: banco enviado pelo usuário (localStorage) > questions.json.
	// Retorna { ok: true } ou { ok: false, error }.
	async function load() {
		const stored = loadStoredData();
		if (stored) {
			applyData(stored);
		} else {
			try {
				const res = await fetch("./questions.json");
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				applyData(await res.json());
			} catch (e) {
				console.error(e);
				return { ok: false, error: e };
			}
		}

		const saved = loadSaved();
		if (saved) {
			state = Object.assign(createEmptyState(), saved);
			state.runIds = (state.runIds || []).filter((id) => BY_ID[id]);
			if (state.runIds.length === 0) state.runIds = QUESTIONS.map((q) => q.id);
		} else {
			state.runIds = QUESTIONS.map((q) => q.id);
		}
		return { ok: true };
	}

	// -----------------------------------------------------------------
	// Helpers de questões
	// -----------------------------------------------------------------

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

	// Prepara a rodada "refazer apenas erradas": limpa SÓ as respostas
	// erradas (mantém as certas) e foca o Quiz nelas. Retorna a quantidade.
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

	// Confirmação única e clara para ações que apagam TODO o progresso.
	function confirmWipe() {
		const answered = Object.keys(state.answers).length;
		return confirm(
			"⚠️ APAGAR TODO O PROGRESSO\n\n" +
				"Esta ação vai apagar permanentemente todas as suas respostas salvas " +
				(answered ? `(${answered} questão(ões) respondida(s)) ` : "") +
				"neste navegador e recomeçar do zero.\n\n" +
				"Isto NÃO pode ser desfeito. Deseja continuar?",
		);
	}

	// -----------------------------------------------------------------
	// Helpers de UI reutilizáveis
	// -----------------------------------------------------------------

	function escapeHtml(str) {
		return String(str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}

	// Cria o <li> de uma alternativa. Se `locked`, aplica verde na correta
	// e vermelho na marcada errada, e o chamador não deve registrar clique.
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

	// Preenche um elemento de feedback (acertou/errou + justificativa).
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

	// -----------------------------------------------------------------
	// API pública
	// -----------------------------------------------------------------

	window.Quiz = {
		STORAGE_KEY,
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
		createEmptyState,
		save,
		clear,
		resetAll,
		applyData,
		load,
		setUploadedData,
		clearData,
		usesUploadedData,
		isAnswered,
		isCorrect,
		isWrong,
		countWrong,
		prepareRedoWrong,
		confirmWipe,
		escapeHtml,
		buildOptionEl,
		fillFeedback,
	};
})();
