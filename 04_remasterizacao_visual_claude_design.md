# Handoff: Redesign visual do Fluxa

## Overview
Remasterização visual do app financeiro Fluxa (Next.js + Supabase), aplicada sobre a estrutura e funcionalidade já existentes. Não é um novo produto — é uma nova camada visual (tipografia, cor, espaçamento, componentes) para as telas já construídas.

## About the Design Files
O arquivo `Fluxa Dashboard.dc.html` é uma **referência de design em HTML** — um mockup mostrando aparência e hierarquia pretendidas, não código para copiar direto. A tarefa é **recriar esse visual no código real do Fluxa (Next.js)**, usando os componentes/hooks/estado já existentes do app — sem recriar lógica, rotas ou dados, só a camada visual.

## Fidelity
**Alta fidelidade (hifi)** para os padrões visuais: cores, tipografia, espaçamento e composição dos cards devem ser seguidos com precisão. Os dados mostrados (nomes, valores) são placeholders — usar sempre os dados reais do Supabase.

## Direção visual (resumo)
- Hierarquia tipográfica forte: números grandes/peso 800 (Manrope) para valores financeiros; labels pequenos, uppercase, cinza (`#9a9791`) para o que os identifica.
- Cards de indicador sempre com seta de variação percentual vs. período anterior (↑/↓ + cor verde/vermelho), nunca só o número estático.
- Estados vazios: ilustração simples (placeholder tracejado) + botão de ação clara — nunca gráfico zerado.
- Espaçamento generoso entre cards/seções (24–28px de gap), nunca blocos colados.
- Todo o sistema deriva de uma variável de cor de destaque (`--accent`), nunca cores fixas — precisa funcionar com qualquer cor escolhida pelo usuário no menu lateral.
- Sem mascote, personagem ou elemento de IA/WhatsApp — fora de escopo nesta fase.

## Screens / Views
Ver a seção `#t2` (Dashboard, opção `2a`) e `#t3` (Transações, opção `3a`) e `#t4` (opções `4a`–`4g`) do arquivo HTML — cada uma é um `<div class="dv-opt">` completo e independente, com o layout final aprovado.

1. **Dashboard** (`2a`) — cards Saldo/Entradas/Saídas/Economia, gráfico de evolução, gastos por categoria (donut + lista), últimas transações, metas, próximos pagamentos.
2. **Transações** (`3a`) — 3 KPIs (Entradas/Saídas/Saldo), tabela completa com avatar, categoria, forma de pagamento, valor, status.
3. **Extrato** (`4a`) — saldo inicial/atual, tabela com valor + saldo acumulado por lançamento.
4. **Pagamentos** (`4b`) — KPIs (a pagar/pagos/atrasados), lista de contas recorrentes com status.
5. **Categorias** (`4c`) — grid de cards por categoria com gasto, orçamento e barra de progresso.
6. **Investimentos** (`4d`) — KPIs de patrimônio/rentabilidade/aportes, donut de alocação, tabela de posições.
7. **Metas** (`4e`) — grid de cards de meta com valor atual/alvo, prazo e barra de progresso.
8. **Configurações** (`4f`) — linhas de preferências (workspace, moeda, fuso, notificações) + seletor de cor de destaque.
9. **Conheça o Fluxa** (`4g`) — grid de cards de recursos/ajuda.

Todas as 9 telas acima estão aprovadas para aplicar diretamente às páginas existentes de mesmo nome no produto.

## Design Tokens
- **Cor de destaque (`--accent`)**: customizável pelo usuário; mockup usa `#7c5cff` (roxo da marca) como valor de exemplo. Todo tom derivado (donuts, ícones, barras) usa `color-mix(in oklch, var(--accent) X%, white/black)` — reproduzir essa lógica de mistura para funcionar com qualquer cor escolhida.
- **Tipografia**: Manrope (600/700/800) para números e títulos; Inter (400–700) para texto de UI; JetBrains Mono disponível para variante técnica (não usada na versão aprovada).
- **Cores neutras**: fundo `#fafaf9`, cards `#ffffff`, borda `rgba(0,0,0,.06)`, texto secundário `#9a9791`, texto terciário `#57544f`, texto principal `#151417`.
- **Cores semânticas**: positivo `oklch(56% 0.14 148)` (verde), negativo `oklch(56% 0.18 25)` (vermelho).
- **Espaçamento**: gap grande 28px entre seções, gap médio 22px entre cards; padding interno de card 20–26px.
- **Raio de borda**: 14–16px em cards, 9–11px em botões/pills, 50% em avatares/badges circulares.
- **Sombra**: cards não usam sombra pesada — dependem de borda 1px sutil (`rgba(0,0,0,.06)`), não `box-shadow` de destaque.

## Interactions & Behavior
- Seletor de mês no topo (‹ Mês Ano ›) — mesma função já existente no app, só reestilizado.
- Botões primários (`+ Nova transação`, `+ Adicionar transação`, etc.) usam `var(--accent)` como fundo, texto branco.
- Barras de progresso (metas, categorias, orçamento) preenchidas com `var(--accent)`.
- Sidebar: item ativo com fundo `color-mix(in oklch, var(--accent) 12%, white)` e texto na cor de destaque; demais itens em cinza.
- Estado vazio: ilustração tracejada (placeholder) + texto explicativo + botão de ação — ver `sc-if value="{{empty}}"` no Dashboard (tweak `showEmptyState` alterna o estado para visualização).

## State Management
Nenhuma mudança de estado/lógica é necessária — este handoff é puramente visual. As props do protótipo (`accentColor`, `showEmptyState`, `compactSpacing`) existem só para visualizar variações no mockup; no app real, `accentColor` deve continuar vindo da preferência já salva do usuário.

## Assets
Nenhum asset externo — ícones e ilustrações são placeholders geométricos (divs/SVG simples) a serem substituídos por ícones reais do design system do Fluxa.

## Files
- `Fluxa Dashboard.dc.html` — arquivo único com todas as telas aprovadas, organizado em seções `<div class="dv-opt" id="...">`. Abrir no navegador para visualizar; cada opção é autocontida.
