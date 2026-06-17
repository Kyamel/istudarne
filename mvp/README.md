# Quiz IHC — Autoavaliação de Questões Objetivas

Site **estático** (HTML + CSS + JavaScript puro, sem backend e sem
dependências) para estudar e se autoavaliar com 100 questões de múltipla
escolha de **Interação Humano-Computador (IHC)**.

As questões são carregadas dinamicamente de um arquivo
[`questions.json`](questions.json), então você pode editar ou trocar o banco de
questões sem mexer no código.

## ✨ Funcionalidades

- **Dois modos** (alterne pelas abas no topo):
  - **Quiz**: uma questão por vez, com correção e tela de resultado.
  - **Lista**: todas as questões empilhadas em uma única coluna; ao escolher
    uma alternativa você clica em **“Ver resposta”** para revelar a correta e a
    justificativa na hora. No topo há **filtros** (Todas, Respondidas,
    Acertadas, **Erradas**, Não respondidas) para revisar.
- **Carregar um `questions.json`** pela própria tela inicial (botão de upload),
  útil para testar outro banco sem editar arquivos. O app também lê
  automaticamente o `questions.json` da raiz.
- Tela inicial com título, descrição e botão **Começar**.
- Uma questão por vez, com indicador de progresso (“Questão 12 de 100”).
- Seleção de alternativa clicando nela.
- Botões **Anterior**, **Próxima**, **Corrigir** e **Reiniciar**.
- Progresso salvo automaticamente no `localStorage` (continue de onde parou).
- Ao corrigir: total de acertos, erros, porcentagem, lista de erradas com a
  alternativa marcada, a correta e a justificativa.
- Destaque visual: **alternativa correta em verde**, **alternativa errada
  marcada em vermelho**.
- Revisão das questões após a correção.
- Opções **“mostrar apenas erradas”** e **“refazer apenas erradas”**.
- Layout limpo e responsivo (funciona bem em desktop e celular).
- Navegação por teclado: setas ← e →.

## 📂 Estrutura do projeto

```text
mvp/
├─ index.html      # tela inicial (home)
├─ index.js        # lógica da tela inicial
├─ quiz.html       # modo Quiz (uma questão por vez) + resultado
├─ quiz.js         # lógica do modo Quiz
├─ list.html       # modo Lista (todas em coluna, com filtros)
├─ list.js         # lógica do modo Lista
├─ common.js       # compartilhado: estado, dados, persistência, helpers
├─ style.css       # estilos (responsivo, usado pelas 3 páginas)
├─ questions.json  # banco de questões
└─ README.md
```

> Cada página (`index`, `quiz`, `list`) carrega o `common.js` primeiro e
> depois o seu próprio `.js`. O progresso é compartilhado entre as páginas
> porque fica salvo no `localStorage`.

## ▶️ Como rodar localmente

Como o app usa `fetch("./questions.json")`, **abrir o `index.html` direto pelo
navegador (`file://`) costuma falhar** por causa das regras de segurança do
navegador. Use um servidor local simples:

```bash
# dentro da pasta quiz-ihc/
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

> Alternativas: `npx serve` (Node.js) ou a extensão **Live Server** do VS Code.

## 🚀 Como publicar no GitHub Pages

1. Crie um repositório no GitHub (ex.: `quiz-ihc`).
2. Envie os arquivos do projeto para o repositório:

   ```bash
   git init
   git add .
   git commit -m "Quiz IHC"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/quiz-ihc.git
   git push -u origin main
   ```

3. No GitHub, vá em **Settings > Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/root` (raiz). Salve.
6. Aguarde alguns instantes e acesse a URL gerada, no formato:

   ```text
   https://SEU_USUARIO.github.io/quiz-ihc/
   ```

> Se você colocou os arquivos dentro de uma subpasta no repositório, ajuste a
> seleção de pasta no passo 5 ou mova os arquivos para a raiz.

## ✏️ Como editar ou adicionar questões

Edite o arquivo [`questions.json`](questions.json). O formato é:

```json
{
  "title": "Banco de 100 Questões Objetivas - Interação Humano-Computador",
  "description": "Questões de múltipla escolha com cinco alternativas e apenas uma resposta correta.",
  "questions": [
    {
      "id": 1,
      "topic": "Introdução e conceitos básicos",
      "statement": "A Interação Humano-Computador (IHC) é definida principalmente como a área que:",
      "options": [
        { "id": "A", "text": "analisa somente o desempenho de hardware e redes." },
        { "id": "B", "text": "estuda apenas a programação de interfaces gráficas." },
        { "id": "C", "text": "investiga o design, a avaliação e a implementação de sistemas para uso humano, além dos fenômenos envolvidos na interação." },
        { "id": "D", "text": "se limita à escolha de cores e tipografia de aplicativos." },
        { "id": "E", "text": "substitui integralmente a Engenharia de Software." }
      ],
      "answer": "C",
      "explanation": "IHC abrange pessoas, sistemas, tarefas e contexto, envolvendo design, avaliação e implementação."
    }
  ]
}
```

Regras dos campos:

- `id`: número único da questão.
- `topic`: tema (aparece como etiqueta na tela).
- `statement`: enunciado.
- `options`: lista com exatamente as alternativas; cada uma com `id`
  (`"A"`…`"E"`) e `text`.
- `answer`: o `id` da alternativa correta.
- `explanation`: justificativa mostrada após a correção.

> Dica: ao alterar o conteúdo, se notar comportamento estranho por causa de um
> progresso antigo salvo, clique em **Reiniciar** no app (limpa o
> `localStorage`).

## 🛠️ Tecnologias

HTML, CSS e JavaScript puro. Sem frameworks, sem build, sem dependências
externas. Funciona em qualquer hospedagem de arquivos estáticos.
