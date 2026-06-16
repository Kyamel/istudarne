/* ===================================================================
   Quiz IHC - modo Quiz (quiz.js)
   Uma questão por vez, correção e tela de resultado. Usa o estado e os
   helpers de common.js. Abrir quiz.html?view=result vai direto ao
   resultado (usado pelo botão "Ver resultado" do modo Lista).
   =================================================================== */

(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const S = () => Quiz.state; // atalho para o estado vivo

  // ---------- navegação de telas internas ----------
  function showScreen(name) {
    $("screen-quiz").classList.toggle("hidden", name !== "quiz");
    $("screen-result").classList.toggle("hidden", name !== "result");
    window.scrollTo(0, 0);
  }

  // ---------- lista de questões visíveis ----------
  function visibleIds() {
    if (S().corrected && S().onlyWrong) {
      return S().runIds.filter((id) => Quiz.isWrong(id));
    }
    return S().runIds;
  }
  function currentQuestion() {
    const id = visibleIds()[S().index];
    return id != null ? Quiz.BY_ID[id] : null;
  }
  function clampIndex(i) {
    const n = visibleIds().length;
    if (n === 0) return 0;
    return Math.max(0, Math.min(i, n - 1));
  }

  // ---------- render do Quiz ----------
  function renderQuiz() {
    showScreen("quiz");
    const total = visibleIds().length;
    S().index = clampIndex(S().index);
    const q = currentQuestion();
    if (!q) return;

    $("progress-label").textContent =
      "Questão " + (S().index + 1) + " de " + total;
    $("progress-fill").style.width =
      total ? ((S().index + 1) / total) * 100 + "%" : "0%";

    $("q-topic").textContent = q.topic || "";
    $("q-statement").textContent = q.id + ". " + q.statement;

    renderOptions(q);

    const fb = $("q-feedback");
    if (S().corrected) Quiz.fillFeedback(fb, q);
    else fb.classList.add("hidden");

    $("btn-prev").disabled = S().index <= 0;
    $("btn-next").disabled = S().index >= total - 1;
    $("btn-correct").textContent = S().corrected ? "Ver resultado" : "Corrigir";

    $("only-wrong-wrap").classList.toggle("hidden", !S().corrected);
    $("chk-only-wrong").checked = S().onlyWrong;
  }

  function renderOptions(q) {
    const ul = $("q-options");
    ul.innerHTML = "";
    const selected = S().answers[q.id];
    q.options.forEach((opt) => {
      const li = Quiz.buildOptionEl(q, opt, selected, S().corrected);
      if (!S().corrected) {
        li.addEventListener("click", () => {
          S().answers[q.id] = opt.id;
          Quiz.save();
          renderQuiz();
        });
      }
      ul.appendChild(li);
    });
  }

  // ---------- navegação entre questões ----------
  function goPrev() {
    if (S().index > 0) { S().index--; Quiz.save(); renderQuiz(); }
  }
  function goNext() {
    if (S().index < visibleIds().length - 1) {
      S().index++; Quiz.save(); renderQuiz();
    }
  }

  // ---------- correção ----------
  function correctRun() {
    if (!S().corrected) {
      const unanswered = S().runIds.filter((id) => !Quiz.isAnswered(id)).length;
      if (unanswered > 0) {
        const ok = confirm(
          "Você ainda não respondeu " + unanswered +
          " questão(ões). Deseja corrigir mesmo assim?");
        if (!ok) return;
      }
      S().corrected = true;
      Quiz.save();
    }
    renderResult(S().runIds);
  }

  function toggleOnlyWrong() {
    S().onlyWrong = $("chk-only-wrong").checked;
    S().index = 0;
    Quiz.save();
    renderQuiz();
  }

  // ---------- resultado ----------
  function renderResult(scope) {
    const ids = scope || S().runIds;
    const total = ids.length;
    let correct = 0;
    ids.forEach((id) => { if (Quiz.isCorrect(id)) correct++; });
    const wrong = total - correct;
    const pct = total ? Math.round((correct / total) * 100) : 0;

    $("score-correct").textContent = correct;
    $("score-wrong").textContent = wrong;
    $("score-pct").textContent = pct + "%";

    renderWrongList(ids.filter((id) => !Quiz.isCorrect(id)));
    $("btn-redo-wrong").disabled = wrong === 0;

    showScreen("result");
  }

  function renderWrongList(wrongIds) {
    const box = $("wrong-list");
    box.innerHTML = "";
    if (wrongIds.length === 0) {
      $("wrong-title").textContent = "Parabéns! Você não errou nenhuma 🎉";
      return;
    }
    $("wrong-title").textContent = "Questões erradas (" + wrongIds.length + ")";

    wrongIds.forEach((id) => {
      const q = Quiz.BY_ID[id];
      const selected = S().answers[id] || "nenhuma";
      const selOpt = q.options.find((o) => o.id === selected);
      const rightOpt = q.options.find((o) => o.id === q.answer);
      const esc = Quiz.escapeHtml;

      const item = document.createElement("div");
      item.className = "wrong-item";
      item.innerHTML =
        '<div class="q-num">Questão ' + q.id + " · " + esc(q.topic) + "</div>" +
        '<div class="line">' + esc(q.statement) + "</div>" +
        '<div class="line your">Sua resposta: ' + esc(selected) +
          (selOpt ? " — " + esc(selOpt.text) : "") + "</div>" +
        '<div class="line right">Correta: ' + esc(q.answer) + " — " +
          esc(rightOpt.text) + "</div>" +
        '<div class="line exp">' + esc(q.explanation) + "</div>";
      box.appendChild(item);
    });
  }

  function reviewQuestions() {
    S().index = 0;
    Quiz.save();
    renderQuiz();
  }

  function redoWrongOnly() {
    if (Quiz.countWrong() === 0) {
      alert("Você não tem questões erradas para refazer.");
      return;
    }
    const ok = confirm(
      "Refazer apenas erradas\n\n" +
      "Isto vai LIMPAR suas respostas das questões erradas para você " +
      "respondê-las de novo. As respostas certas serão mantidas.\n\n" +
      "Deseja continuar?");
    if (!ok) return;
    Quiz.prepareRedoWrong();
    renderQuiz();
  }

  function restartAll() {
    if (!Quiz.confirmWipe()) return;
    Quiz.resetAll();
    location.href = "index.html";
  }

  // ---------- eventos ----------
  function bind() {
    $("btn-prev").addEventListener("click", goPrev);
    $("btn-next").addEventListener("click", goNext);
    $("btn-correct").addEventListener("click", correctRun);
    $("btn-restart").addEventListener("click", restartAll);
    $("chk-only-wrong").addEventListener("change", toggleOnlyWrong);

    $("btn-review").addEventListener("click", reviewQuestions);
    $("btn-redo-wrong").addEventListener("click", redoWrongOnly);
    $("btn-restart-2").addEventListener("click", restartAll);

    document.addEventListener("keydown", (e) => {
      if (!$("screen-quiz").classList.contains("hidden")) {
        if (e.key === "ArrowLeft") goPrev();
        if (e.key === "ArrowRight") goNext();
      }
    });
  }

  async function init() {
    bind();
    const r = await Quiz.load();
    if (!r.ok) {
      alert("Não foi possível carregar as questões. Volte ao início e use um servidor local.");
      location.href = "index.html";
      return;
    }
    S().mode = "quiz";
    Quiz.save();

    // ?view=result abre direto o resultado (vindo do modo Lista).
    const params = new URLSearchParams(location.search);
    if (params.get("view") === "result") {
      renderResult(S().runIds);
    } else {
      renderQuiz();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
