# Estilo visual: Verde Mate

O tema visual do Istudarne segue uma direção **verde mate, editorial e caderno digital**. A referência é o Obsidian de forma sutil: painéis laterais, superfícies foscas, bordas discretas e grafite/ardósia. A diferença é que o Istudarne deve parecer menos ferramenta de desenvolvedor e mais app brasileiro de estudo, com uma assinatura visual de erva-mate, papel e grafite.

Nome alternativo mais informal:

```text
Caderno Mate
```

## Sensação

A interface deve parecer:

- calma para longas sessões de estudo;
- acadêmica sem ficar burocrática;
- editorial sem virar landing page decorativa;
- fosca, tátil e discreta;
- confiável para histórico, progresso e comunidade.

Evitar:

- branco puro com azul genérico;
- visual neon;
- glassmorphism exagerado;
- gradientes saturados;
- contraste agressivo;
- componentes que pareçam dashboard financeiro genérico.

## Tokens

Todos os estilos principais devem usar CSS variables. A ideia é que cores, bordas, sombras e raios possam ser modificados sem reescrever componentes.

Tokens principais:

```css
--bg
--surface
--surface-muted
--surface-raised
--text
--text-muted
--text-soft
--border
--border-strong
--primary
--primary-hover
--primary-soft
--secondary
--secondary-soft
--danger
--danger-soft
--warning
--warning-soft
--success
--success-soft
--shadow
--focus-ring
--radius-sm
--radius-md
--radius-lg
```

## Paleta light

```css
:root {
  --bg: #f4f1ea;
  --surface: #fbfaf7;
  --surface-muted: #ece7dc;
  --surface-raised: #ffffff;

  --text: #25221e;
  --text-muted: #6f685f;
  --text-soft: #9a9186;

  --border: #ddd5c8;
  --border-strong: #c7bbaa;

  --primary: #4f6f52;
  --primary-hover: #405b43;
  --primary-soft: #dfe9dc;

  --secondary: #7a6134;
  --secondary-soft: #efe3c8;

  --danger: #b45353;
  --warning: #b7791f;
  --success: #4f7f55;

  --shadow: rgba(52, 45, 38, 0.08);
}
```

Uso visual:

- fundo bege-papel;
- cards quase brancos;
- texto grafite;
- verde mate para ação e identidade;
- dourado/erva seca como apoio discreto, metadados e estados secundários.

## Paleta dark

```css
:root[data-theme="dark"] {
  --bg: #17171c;
  --surface: #202027;
  --surface-muted: #282832;

  --text: #e8e3d8;
  --text-muted: #aaa39a;
  --text-soft: #77717a;

  --border: #33333d;
  --border-strong: #444454;

  --primary: #9fcb9c;
  --primary-hover: #b7ddb3;
  --primary-soft: #253727;

  --secondary: #d6b76f;
  --secondary-soft: #403622;

  --danger: #e08787;
  --warning: #d6a84f;
  --success: #8fca90;

  --shadow: rgba(0, 0, 0, 0.32);
}
```

Uso visual:

- fundo grafite azulado;
- superfícies carvão;
- texto bege claro;
- verde mate claro como destaque;
- dourado fosco como cor secundária.

## Componentes

### Sidebar

A sidebar deve ser uma superfície lateral discreta:

- `background: var(--surface-muted)`;
- `border-right: 1px solid var(--border)`;
- navegação em blocos foscos;
- item ativo com superfície clara/escura sem saturação.

### Cards

Cards devem funcionar como notas ou blocos de caderno:

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px var(--shadow);
}
```

Cards de conteúdo podem usar uma linha lateral verde mate:

```css
.note-card {
  border-left: 3px solid var(--primary);
}
```

### Botões

Botões primários:

```css
.button-primary {
  background: var(--primary);
  border-color: var(--primary);
  color: #ffffff;
  border-radius: var(--radius-sm);
}
```

Botões secundários:

```css
.button {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
}
```

### Inputs

Inputs devem parecer blocos foscos:

```css
.input {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
}
```

### Feedback de quiz

Estados de resposta devem usar tokens sem depender só de cor:

- correta: `--success` e `--success-soft`;
- incorreta: `--danger` e `--danger-soft`;
- alerta/status: `--warning` e `--warning-soft`.

Sempre manter texto ou estado visível junto com a cor.

## Implementação atual

O tema está implementado em:

- [app/styles/app.css](/home/lucas/dev/web/istudarne/app/styles/app.css)
- [app/main.tsx](/home/lucas/dev/web/istudarne/app/main.tsx)
- [worker/html.ts](/home/lucas/dev/web/istudarne/worker/html.ts)

A SPA usa `document.documentElement.dataset.theme` para alternar:

```text
light: :root
dark:  :root[data-theme="dark"]
```

O tema escolhido pelo usuário é salvo em:

```text
localStorage["istudarne-theme"]
```
