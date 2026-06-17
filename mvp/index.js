/* ===================================================================
   Quiz IHC - tela inicial (index.js)
   Mostra título/descrição, navega para quiz.html / list.html, permite
   continuar de onde parou, carregar outro JSON e limpar o progresso.
   =================================================================== */

(() => {
	const $ = (id) => document.getElementById(id);

	function render() {
		$("start-title").textContent = Quiz.DATA.title || "Quiz";
		$("start-description").textContent = Quiz.DATA.description || "";

		// Há respostas salvas? Então mostramos "Continuar" e "Limpar".
		const hasProgress = Object.keys(Quiz.state.answers).length > 0;
		$("start-resume").classList.toggle("hidden", !hasProgress);
		$("btn-resume").classList.toggle("hidden", !hasProgress);
		$("btn-clear").classList.toggle("hidden", !hasProgress);

		// Indica qual banco está em uso (padrão ou enviado).
		const custom = Quiz.usesUploadedData();
		$("bank-status").textContent = custom
			? `Banco em uso: enviado por você (${Quiz.QUESTIONS.length} questões).`
			: `Banco em uso: padrão (${Quiz.QUESTIONS.length} questões).`;
		$("btn-default-bank").classList.toggle("hidden", !custom);
	}

	// "Começar quiz": abre o Quiz com TODAS as questões, sem apagar nada.
	function goQuizAll() {
		Quiz.state.runIds = Quiz.QUESTIONS.map((q) => q.id);
		Quiz.state.onlyWrong = false;
		Quiz.state.mode = "quiz";
		Quiz.save();
		location.href = "quiz.html";
	}

	function goList() {
		Quiz.state.mode = "list";
		Quiz.save();
		location.href = "list.html";
	}

	// "Continuar": volta para a última tela usada.
	function resume() {
		if (Quiz.state.mode === "list") return goList();
		if (Quiz.state.corrected) {
			location.href = "quiz.html?view=result";
			return;
		}
		location.href = "quiz.html";
	}

	function clearProgress() {
		if (!Quiz.confirmWipe()) return;
		Quiz.resetAll();
		$("file-status").textContent = "✓ Progresso apagado.";
		render();
	}

	function handleFileUpload(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const data = JSON.parse(reader.result);
				if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
					throw new Error('o arquivo precisa ter um campo "questions" com ao menos uma questão.');
				}
				if (Object.keys(Quiz.state.answers).length > 0) {
					const ok = confirm(
						"⚠️ SUBSTITUIR BANCO DE QUESTÕES\n\n" +
							"Carregar este arquivo vai trocar as questões atuais e APAGAR " +
							"todo o seu progresso salvo. Isto não pode ser desfeito.\n\n" +
							"Deseja continuar?",
					);
					if (!ok) {
						$("file-json").value = "";
						return;
					}
				}
				Quiz.setUploadedData(data); // aplica E persiste o banco enviado
				Quiz.resetAll(); // zera o progresso para o novo banco
				$("file-status").textContent =
					`✓ Carregado: ${Quiz.QUESTIONS.length} questões de ${file.name}`;
				render();
			} catch (err) {
				$("file-status").textContent = `✗ JSON inválido: ${err.message}`;
			}
		};
		reader.readAsText(file, "utf-8");
	}

	// Descarta o banco enviado e volta ao questions.json padrão.
	function useDefaultBank() {
		const ok = confirm(
			"Voltar ao banco padrão\n\n" +
				"Isto vai descartar o banco de questões que você enviou e também o " +
				"progresso atual, voltando ao questions.json padrão.\n\nDeseja continuar?",
		);
		if (!ok) return;
		Quiz.clearData();
		Quiz.clear();
		location.reload(); // recarrega para buscar o questions.json padrão
	}

	function bind() {
		$("btn-start").addEventListener("click", goQuizAll);
		$("btn-open-list").addEventListener("click", goList);
		$("btn-resume").addEventListener("click", resume);
		$("btn-clear").addEventListener("click", clearProgress);
		$("file-json").addEventListener("change", handleFileUpload);
		$("btn-default-bank").addEventListener("click", useDefaultBank);
	}

	async function init() {
		bind();
		const r = await Quiz.load();
		if (!r.ok) {
			$("start-title").textContent = "Carregue um arquivo de questões";
			$("start-description").textContent =
				"Não foi possível ler questions.json automaticamente. Se você abriu " +
				"o index.html direto (file://), use um servidor local (veja o README) " +
				"ou carregue um arquivo .json abaixo.";
			// Mesmo sem fetch, o upload abaixo continua funcionando.
			return;
		}
		render();
	}

	document.addEventListener("DOMContentLoaded", init);
})();
