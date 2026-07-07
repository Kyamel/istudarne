/* ===================================================================
   Quiz IHC - modo Lista (list.js)
   Todas as questões empilhadas em uma coluna. Ao escolher uma
   alternativa, clique em "Ver resposta" para revelar a correta e a
   justificativa. Filtros no topo (todas, respondidas, acertadas,
   erradas, não respondidas) e ações no rodapé.
   =================================================================== */

(() => {
	const $ = (id) => document.getElementById(id);
	const S = () => Quiz.state;

	function quizUrl(page, extra) {
		const params = new URLSearchParams();
		params.set("quiz", Quiz.quizId || Quiz.DEFAULT_ID);
		if (extra) {
			Object.entries(extra).forEach(([key, value]) => {
				params.set(key, value);
			});
		}
		return `${page}?${params.toString()}`;
	}

	function showLoadError(message) {
		const box = $("load-error");
		box.classList.remove("hidden");
		box.innerHTML =
			"<strong>Não foi possível carregar este quiz.</strong>" +
			`<p>${Quiz.escapeHtml(message)}</p>` +
			'<p><a class="btn btn-primary btn-sm" href="index.html">Voltar ao início</a></p>';
	}

	// Cada filtro é uma função que decide se a questão entra na lista.
	const FILTERS = {
		all: () => true,
		answered: (id) => Quiz.isAnswered(id),
		correct: (id) => Quiz.isCorrect(id),
		wrong: (id) => Quiz.isWrong(id),
		unanswered: (id) => !Quiz.isAnswered(id),
	};

	function render() {
		updateCounts();

		document.querySelectorAll(".chip").forEach((c) => {
			c.classList.toggle("is-active", c.dataset.filter === S().listFilter);
		});

		const test = FILTERS[S().listFilter] || FILTERS.all;
		const ids = Quiz.QUESTIONS.map((q) => q.id).filter(test);

		const box = $("list-container");
		box.innerHTML = "";
		$("list-empty").classList.toggle("hidden", ids.length > 0);
		ids.forEach((id) => {
			box.appendChild(buildCard(Quiz.BY_ID[id]));
		});

		renderFooter();
	}

	function updateCounts() {
		const ids = Quiz.QUESTIONS.map((q) => q.id);
		$("cnt-all").textContent = ids.length;
		$("cnt-answered").textContent = ids.filter(Quiz.isAnswered).length;
		$("cnt-correct").textContent = ids.filter(Quiz.isCorrect).length;
		$("cnt-wrong").textContent = ids.filter(Quiz.isWrong).length;
		$("cnt-unanswered").textContent = ids.filter((id) => !Quiz.isAnswered(id)).length;
	}

	function renderFooter() {
		const ids = Quiz.QUESTIONS.map((q) => q.id);
		const answered = ids.filter(Quiz.isAnswered).length;
		const correct = ids.filter(Quiz.isCorrect).length;
		const wrong = ids.filter(Quiz.isWrong).length;
		$("list-summary").textContent =
			"Respondidas: " +
			answered +
			" de " +
			ids.length +
			" · Acertos: " +
			correct +
			" · Erros: " +
			wrong;
		$("btn-list-redo").disabled = wrong === 0;
	}

	function buildCard(q) {
		const card = document.createElement("article");
		card.className = "card list-card";
		card.dataset.id = q.id;
		fillCard(card, q);
		return card;
	}

	// (Re)preenche um cartão conforme o estado atual.
	function fillCard(card, q) {
		const revealed = !!S().revealed[q.id];
		const selected = S().answers[q.id];
		card.innerHTML = "";

		const topic = document.createElement("p");
		topic.className = "topic-tag";
		topic.textContent = q.topic || "";

		const stmt = document.createElement("h3");
		stmt.className = "statement";
		stmt.textContent = `${q.id}. ${q.statement}`;

		const ul = document.createElement("ul");
		ul.className = "options";
		q.options.forEach((opt) => {
			const li = Quiz.buildOptionEl(q, opt, selected, revealed);
			if (!revealed) {
				li.addEventListener("click", () => {
					S().answers[q.id] = opt.id;
					Quiz.save();
					fillCard(card, q); // atualiza só este cartão (preserva o scroll)
					updateCounts();
					renderFooter();
				});
			}
			ul.appendChild(li);
		});

		card.appendChild(topic);
		card.appendChild(stmt);
		card.appendChild(ul);

		const actions = document.createElement("div");
		actions.className = "list-card-actions actions";
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "btn btn-sm btn-reveal";
		btn.textContent = revealed ? "Ocultar resposta" : "Ver resposta";
		btn.addEventListener("click", () => {
			S().revealed[q.id] = !revealed;
			Quiz.save();
			fillCard(card, q);
			updateCounts();
			renderFooter();
		});
		actions.appendChild(btn);
		card.appendChild(actions);

		if (revealed) {
			const fb = document.createElement("p");
			fb.className = "feedback";
			Quiz.fillFeedback(fb, q);
			card.appendChild(fb);
		}
	}

	function setFilter(filter) {
		S().listFilter = filter;
		Quiz.save();
		render();
	}

	// ---------- ações do rodapé ----------
	function seeResult() {
		// Resultado considerando TODAS as questões.
		S().runIds = Quiz.QUESTIONS.map((q) => q.id);
		S().corrected = true;
		Quiz.save();
		location.href = quizUrl("quiz.html", { view: "result" });
	}

	async function redoWrong() {
		if (Quiz.countWrong() === 0) {
			Quiz.ui.toast("Você não tem questões erradas para refazer.", "info");
			return;
		}
		const ok = await Quiz.ui.confirm({
			title: "Refazer apenas erradas",
			message:
				"Isto limpa suas respostas erradas para você responder de novo no modo Quiz. As respostas certas serão mantidas.",
			confirmLabel: "Refazer",
		});
		if (!ok) return;
		Quiz.prepareRedoWrong();
		location.href = quizUrl("quiz.html");
	}

	async function restartAll() {
		const ok = await Quiz.ui.confirm({
			title: "Resetar progresso",
			message: "Isto apaga respostas, revisões e resultado salvo apenas deste quiz.",
			confirmLabel: "Resetar",
			danger: true,
		});
		if (!ok) return;
		Quiz.resetProgress(Quiz.quizId);
		location.href = "index.html";
	}

	function bind() {
		document.querySelectorAll(".chip").forEach((chip) => {
			chip.addEventListener("click", () => setFilter(chip.dataset.filter));
		});
		$("btn-list-result").addEventListener("click", seeResult);
		$("btn-list-redo").addEventListener("click", redoWrong);
		$("btn-list-restart").addEventListener("click", restartAll);
	}

	async function init() {
		bind();
		const r = await Quiz.load();
		if (!r.ok) {
			showLoadError(
				"Volte ao início e selecione um quiz salvo ou rode o MVP por um servidor local.",
			);
			$("screen-list").classList.add("hidden");
			return;
		}
		$("tab-quiz").href = quizUrl("quiz.html");
		$("tab-list").href = quizUrl("list.html");
		S().mode = "list";
		Quiz.save();
		render();
	}

	document.addEventListener("DOMContentLoaded", init);
})();
