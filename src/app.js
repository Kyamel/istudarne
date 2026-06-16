/* ===================================================================
   Quiz IHC - lógica da aplicação (JavaScript puro, sem dependências)

   Dois modos de uso:
   - "Quiz": uma questão por vez, com correção e tela de resultado.
   - "Lista": todas as questões empilhadas em uma coluna; ao escolher
     uma alternativa, o usuário pode clicar em "Ver resposta" para
     revelar a correta e a justificativa imediatamente. No topo há
     filtros (todas, respondidas, acertadas, erradas, não respondidas).

   Os dados vêm de ./questions.json (via fetch) ou de um arquivo .json
   carregado pelo próprio usuário na tela inicial.

   O progresso é salvo automaticamente no localStorage.
   =================================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "quiz-ihc-progress-v1";

  // Dados das questões.
  let DATA = null;
  let QUESTIONS = [];
  let BY_ID = {};

  // Estado da sessão.
  let state = createEmptyState();

  // Referências do DOM.
  const el = {};
  function cacheElements() {
    const ids = [
      "topbar", "tab-quiz", "tab-list", "btn-home",
      "screen-start", "screen-quiz", "screen-list", "screen-result",
      "start-title", "start-description", "start-resume",
      "btn-start", "btn-open-list", "btn-resume", "btn-clear",
      "file-json", "file-status",
      "progress-label", "progress-fill", "only-wrong-wrap", "chk-only-wrong",
      "q-topic", "q-statement", "q-options", "q-feedback",
      "btn-prev", "btn-next", "btn-correct", "btn-restart",
      "list-container", "list-empty",
      "cnt-all", "cnt-answered", "cnt-correct", "cnt-wrong", "cnt-unanswered",
      "score-correct", "score-wrong", "score-pct",
      "wrong-title", "wrong-list",
      "btn-review", "btn-redo-wrong", "btn-restart-2",
    ];
    ids.forEach((id) => { el[id] = document.getElementById(id); });
  }

  // =================================================================
  // Estado e persistência
  // =================================================================

  function createEmptyState() {
    return {
      answers: {},      // { id: "A".."E" }
      runIds: [],       // ids da rodada do modo Quiz
      index: 0,         // posição atual no modo Quiz
      corrected: false, // o Quiz já foi corrigido?
      onlyWrong: false, // filtro "apenas erradas" no Quiz (revisão)
      revealed: {},     // { id: true } — respostas reveladas no modo Lista
      listFilter: "all",// filtro ativo no modo Lista
      mode: "start",    // "start" | "quiz" | "list" (para retomar)
    };
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn("Não foi possível salvar o progresso:", e); }
  }

  function loadSavedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch (e) { console.warn("Progresso salvo inválido:", e); }
    return null;
  }

  function clearSavedState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  // =================================================================
  // Helpers de questões
  // =================================================================

  function isAnswered(id) { return !!state.answers[id]; }

  function isCorrect(id) {
    const q = BY_ID[id];
    return q && state.answers[id] === q.answer;
  }

  function isWrong(id) { return isAnswered(id) && !isCorrect(id); }

  // =================================================================
  // Controle de telas e da barra superior
  // =================================================================

  function showScreen(name) {
    ["start", "quiz", "list", "result"].forEach((n) => {
      el["screen-" + n].classList.add("hidden");
    });
    el["screen-" + name].classList.remove("hidden");

    // A barra de abas aparece nos modos quiz/list.
    const showBar = name === "quiz" || name === "list";
    el["topbar"].classList.toggle("hidden", !showBar);
    el["tab-quiz"].classList.toggle("is-active", name === "quiz");
    el["tab-list"].classList.toggle("is-active", name === "list");

    window.scrollTo(0, 0);
  }

  // =================================================================
  // Tela inicial
  // =================================================================

  function renderStart() {
    el["start-title"].textContent = DATA.title || "Quiz";
    el["start-description"].textContent = DATA.description || "";

    const hasProgress =
      state.runIds.length > 0 && Object.keys(state.answers).length > 0;
    el["start-resume"].classList.toggle("hidden", !hasProgress);
    el["btn-resume"].classList.toggle("hidden", !hasProgress);
    el["btn-clear"].classList.toggle("hidden", !hasProgress);

    showScreen("start");
  }

  // =================================================================
  // MODO QUIZ
  // =================================================================

  function visibleIds() {
    if (state.corrected && state.onlyWrong) {
      return state.runIds.filter((id) => isWrong(id));
    }
    return state.runIds;
  }

  function currentQuestion() {
    const id = visibleIds()[state.index];
    return id != null ? BY_ID[id] : null;
  }

  function clampIndex(i) {
    const n = visibleIds().length;
    if (n === 0) return 0;
    return Math.max(0, Math.min(i, n - 1));
  }

  function startNewRun() {
    const fresh = createEmptyState();
    fresh.runIds = QUESTIONS.map((q) => q.id);
    fresh.mode = "quiz";
    state = fresh;
    saveState();
    goToQuiz();
  }

  function redoWrongOnly() {
    const wrongIds = state.runIds.filter((id) => isWrong(id));
    if (wrongIds.length === 0) return;
    const fresh = createEmptyState();
    fresh.runIds = wrongIds;
    fresh.mode = "quiz";
    state = fresh;
    saveState();
    goToQuiz();
  }

  function goToQuiz() {
    state.mode = "quiz";
    state.index = clampIndex(state.index);
    if (state.runIds.length === 0) state.runIds = QUESTIONS.map((q) => q.id);
    saveState();
    renderQuiz();
    showScreen("quiz");
  }

  function renderQuiz() {
    const total = visibleIds().length;
    state.index = clampIndex(state.index);
    const q = currentQuestion();
    if (!q) return;

    el["progress-label"].textContent =
      "Questão " + (state.index + 1) + " de " + total;
    el["progress-fill"].style.width =
      total ? ((state.index + 1) / total) * 100 + "%" : "0%";

    el["q-topic"].textContent = q.topic || "";
    el["q-statement"].textContent = q.id + ". " + q.statement;

    renderQuizOptions(q);
    renderQuizFeedback(q);

    el["btn-prev"].disabled = state.index <= 0;
    el["btn-next"].disabled = state.index >= total - 1;
    el["btn-correct"].textContent = state.corrected ? "Ver resultado" : "Corrigir";

    el["only-wrong-wrap"].classList.toggle("hidden", !state.corrected);
    el["chk-only-wrong"].checked = state.onlyWrong;
  }

  function renderQuizOptions(q) {
    const ul = el["q-options"];
    ul.innerHTML = "";
    const selected = state.answers[q.id];

    q.options.forEach((opt) => {
      const li = buildOptionEl(q, opt, selected, state.corrected);
      if (!state.corrected) {
        li.addEventListener("click", () => {
          state.answers[q.id] = opt.id;
          saveState();
          renderQuiz();
        });
      }
      ul.appendChild(li);
    });
  }

  function renderQuizFeedback(q) {
    const fb = el["q-feedback"];
    if (!state.corrected) { fb.classList.add("hidden"); return; }
    fillFeedback(fb, q);
  }

  function goPrev() {
    if (state.index > 0) { state.index--; saveState(); renderQuiz(); }
  }
  function goNext() {
    if (state.index < visibleIds().length - 1) {
      state.index++; saveState(); renderQuiz();
    }
  }

  function correctRun() {
    if (!state.corrected) {
      const unanswered = state.runIds.filter((id) => !isAnswered(id)).length;
      if (unanswered > 0) {
        const ok = confirm(
          "Você ainda não respondeu " + unanswered +
          " questão(ões). Deseja corrigir mesmo assim?");
        if (!ok) return;
      }
      state.corrected = true;
      saveState();
    }
    renderResult();
  }

  function toggleOnlyWrong() {
    state.onlyWrong = el["chk-only-wrong"].checked;
    state.index = 0;
    saveState();
    renderQuiz();
  }

  // =================================================================
  // MODO LISTA
  // =================================================================

  const LIST_FILTERS = {
    all:        () => true,
    answered:   (id) => isAnswered(id),
    correct:    (id) => isCorrect(id),
    wrong:      (id) => isWrong(id),
    unanswered: (id) => !isAnswered(id),
  };

  function goToList() {
    state.mode = "list";
    saveState();
    renderList();
    showScreen("list");
  }

  function renderList() {
    updateListCounts();

    // Destaca o filtro ativo.
    document.querySelectorAll(".chip").forEach((c) => {
      c.classList.toggle("is-active", c.dataset.filter === state.listFilter);
    });

    const test = LIST_FILTERS[state.listFilter] || LIST_FILTERS.all;
    const ids = QUESTIONS.map((q) => q.id).filter(test);

    const box = el["list-container"];
    box.innerHTML = "";
    el["list-empty"].classList.toggle("hidden", ids.length > 0);

    ids.forEach((id) => box.appendChild(buildListCard(BY_ID[id])));
  }

  function updateListCounts() {
    const ids = QUESTIONS.map((q) => q.id);
    el["cnt-all"].textContent = ids.length;
    el["cnt-answered"].textContent = ids.filter(isAnswered).length;
    el["cnt-correct"].textContent = ids.filter(isCorrect).length;
    el["cnt-wrong"].textContent = ids.filter(isWrong).length;
    el["cnt-unanswered"].textContent = ids.filter((id) => !isAnswered(id)).length;
  }

  // Cria o cartão de uma questão no modo Lista.
  function buildListCard(q) {
    const card = document.createElement("article");
    card.className = "card list-card";
    card.dataset.id = q.id;
    fillListCard(card, q);
    return card;
  }

  // (Re)preenche o conteúdo de um cartão da lista, conforme o estado atual.
  function fillListCard(card, q) {
    const revealed = !!state.revealed[q.id];
    const selected = state.answers[q.id];
    card.innerHTML = "";

    const topic = document.createElement("p");
    topic.className = "topic-tag";
    topic.textContent = q.topic || "";

    const stmt = document.createElement("h3");
    stmt.className = "statement";
    stmt.textContent = q.id + ". " + q.statement;

    const ul = document.createElement("ul");
    ul.className = "options";
    q.options.forEach((opt) => {
      const li = buildOptionEl(q, opt, selected, revealed);
      if (!revealed) {
        li.addEventListener("click", () => {
          state.answers[q.id] = opt.id;
          saveState();
          fillListCard(card, q);   // atualiza só este cartão
          updateListCounts();
        });
      }
      ul.appendChild(li);
    });

    card.appendChild(topic);
    card.appendChild(stmt);
    card.appendChild(ul);

    // Botão "Ver resposta" / "Ocultar resposta".
    const actions = document.createElement("div");
    actions.className = "list-card-actions actions";
    const btn = document.createElement("button");
    btn.className = "btn btn-sm btn-reveal";
    btn.textContent = revealed ? "Ocultar resposta" : "Ver resposta";
    btn.addEventListener("click", () => {
      state.revealed[q.id] = !revealed;
      saveState();
      fillListCard(card, q);
      updateListCounts();
    });
    actions.appendChild(btn);
    card.appendChild(actions);

    // Justificativa, quando revelada.
    if (revealed) {
      const fb = document.createElement("p");
      fb.className = "feedback";
      fillFeedback(fb, q);
      card.appendChild(fb);
    }
  }

  function setListFilter(filter) {
    state.listFilter = filter;
    saveState();
    renderList();
  }

  // =================================================================
  // Tela de resultado (modo Quiz)
  // =================================================================

  function renderResult() {
    const ids = state.runIds;
    const total = ids.length;
    let correct = 0;
    ids.forEach((id) => { if (isCorrect(id)) correct++; });
    const wrong = total - correct;
    const pct = total ? Math.round((correct / total) * 100) : 0;

    el["score-correct"].textContent = correct;
    el["score-wrong"].textContent = wrong;
    el["score-pct"].textContent = pct + "%";

    renderWrongList(ids.filter((id) => !isCorrect(id)));
    el["btn-redo-wrong"].disabled = wrong === 0;

    showScreen("result");
  }

  function renderWrongList(wrongIds) {
    const box = el["wrong-list"];
    box.innerHTML = "";

    if (wrongIds.length === 0) {
      el["wrong-title"].textContent = "Parabéns! Você não errou nenhuma 🎉";
      return;
    }
    el["wrong-title"].textContent = "Questões erradas (" + wrongIds.length + ")";

    wrongIds.forEach((id) => {
      const q = BY_ID[id];
      const selected = state.answers[id] || "nenhuma";
      const selOpt = q.options.find((o) => o.id === selected);
      const rightOpt = q.options.find((o) => o.id === q.answer);

      const item = document.createElement("div");
      item.className = "wrong-item";
      item.innerHTML =
        '<div class="q-num">Questão ' + q.id + " · " + escapeHtml(q.topic) + "</div>" +
        '<div class="line">' + escapeHtml(q.statement) + "</div>" +
        '<div class="line your">Sua resposta: ' + escapeHtml(selected) +
          (selOpt ? " — " + escapeHtml(selOpt.text) : "") + "</div>" +
        '<div class="line right">Correta: ' + escapeHtml(q.answer) + " — " +
          escapeHtml(rightOpt.text) + "</div>" +
        '<div class="line exp">' + escapeHtml(q.explanation) + "</div>";
      box.appendChild(item);
    });
  }

  function reviewQuestions() {
    state.index = 0;
    saveState();
    goToQuiz();
  }

  // =================================================================
  // Reiniciar tudo
  // =================================================================

  function restartAll() {
    const ok = confirm("Tem certeza que deseja apagar o progresso e recomeçar?");
    if (!ok) return;
    clearSavedState();
    state = createEmptyState();
    state.runIds = QUESTIONS.map((q) => q.id);
    renderStart();
  }

  // Limpa o progresso salvo (botão da tela inicial).
  function clearProgress() {
    const ok = confirm(
      "Isto vai apagar todas as suas respostas salvas neste navegador. Continuar?");
    if (!ok) return;
    clearSavedState();
    state = createEmptyState();
    state.runIds = QUESTIONS.map((q) => q.id);
    el["file-status"].textContent = "✓ Progresso apagado.";
    renderStart();
  }

  // =================================================================
  // Componentes reutilizáveis
  // =================================================================

  // Cria o <li> de uma alternativa. Se `revealed`/`corrected`, aplica
  // verde na correta e vermelho na marcada errada, e trava o clique.
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
      "<strong>" + (correct ? "Você acertou! ✓" : "Você errou. ✗") + "</strong><br>" +
      "Sua resposta: <strong>" + escapeHtml(selected) + "</strong> · " +
      "Correta: <strong>" + escapeHtml(q.answer) + "</strong><br>" +
      "<em>" + escapeHtml(q.explanation) + "</em>";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // =================================================================
  // Upload de um questions.json pelo usuário
  // =================================================================

  function handleFileUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error('o arquivo precisa ter um campo "questions" com ao menos uma questão.');
        }
        applyData(data);
        clearSavedState();
        state = createEmptyState();
        state.runIds = QUESTIONS.map((q) => q.id);
        saveState();
        el["file-status"].textContent =
          "✓ Carregado: " + QUESTIONS.length + " questões de " + file.name;
        renderStart();
      } catch (err) {
        el["file-status"].textContent = "✗ JSON inválido: " + err.message;
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function applyData(data) {
    DATA = data;
    QUESTIONS = data.questions || [];
    BY_ID = {};
    QUESTIONS.forEach((q) => { BY_ID[q.id] = q; });
  }

  // =================================================================
  // Eventos
  // =================================================================

  function bindEvents() {
    // Tela inicial
    el["btn-start"].addEventListener("click", startNewRun);
    el["btn-open-list"].addEventListener("click", goToList);
    el["btn-resume"].addEventListener("click", resumeRun);
    el["btn-clear"].addEventListener("click", clearProgress);
    el["file-json"].addEventListener("change", handleFileUpload);

    // Barra superior
    el["tab-quiz"].addEventListener("click", goToQuiz);
    el["tab-list"].addEventListener("click", goToList);
    el["btn-home"].addEventListener("click", () => { state.mode = "start"; saveState(); renderStart(); });

    // Quiz
    el["btn-prev"].addEventListener("click", goPrev);
    el["btn-next"].addEventListener("click", goNext);
    el["btn-correct"].addEventListener("click", correctRun);
    el["btn-restart"].addEventListener("click", restartAll);
    el["chk-only-wrong"].addEventListener("change", toggleOnlyWrong);

    // Lista (filtros)
    document.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => setListFilter(chip.dataset.filter));
    });

    // Resultado
    el["btn-review"].addEventListener("click", reviewQuestions);
    el["btn-redo-wrong"].addEventListener("click", redoWrongOnly);
    el["btn-restart-2"].addEventListener("click", restartAll);

    // Teclado: setas navegam no modo Quiz.
    document.addEventListener("keydown", (e) => {
      if (el["screen-quiz"].classList.contains("hidden")) return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    });
  }

  function resumeRun() {
    if (state.mode === "list") return goToList();
    if (state.corrected) return renderResult();
    return goToQuiz();
  }

  // =================================================================
  // Inicialização
  // =================================================================

  async function init() {
    cacheElements();
    bindEvents();

    try {
      const res = await fetch("./questions.json");
      if (!res.ok) throw new Error("HTTP " + res.status);
      applyData(await res.json());
    } catch (e) {
      // Mesmo sem o fetch, o usuário ainda pode carregar um .json manualmente.
      console.error(e);
      el["start-title"].textContent = "Carregue um arquivo de questões";
      el["start-description"].textContent =
        "Não foi possível ler questions.json automaticamente. Se você abriu " +
        "o index.html direto (file://), use um servidor local (veja o README) " +
        "ou carregue um arquivo .json abaixo.";
      DATA = DATA || { title: "Quiz IHC", description: "", questions: [] };
      QUESTIONS = [];
      BY_ID = {};
      showScreen("start");
      return;
    }

    // Recupera progresso salvo compatível com o banco atual.
    const saved = loadSavedState();
    if (saved) {
      state = Object.assign(createEmptyState(), saved);
      state.runIds = (state.runIds || []).filter((id) => BY_ID[id]);
      if (state.runIds.length === 0) state.runIds = QUESTIONS.map((q) => q.id);
    } else {
      state.runIds = QUESTIONS.map((q) => q.id);
    }

    renderStart();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
