# Proposta visual — Fluxa (tipografia e layout)

## Escopo
Melhoria puramente visual: tipografia, hierarquia, espaçamento e microcomponentes.
Não mexe em lógica de backend nem no sistema de cor customizável já existente
(o usuário continua escolhendo a cor de destaque em Configurações).

## O que muda

### 1. Hierarquia tipográfica dos números
Hoje: valor e label têm o mesmo peso visual em vários pontos.
Proposta: label sempre em `13px`, cor secundária (cinza muted); valor sempre em
`22–24px`, peso 500. Isso vale para os três cards do topo, para o "Total
comprometido" e para qualquer outro número em destaque.

### 2. Indicador de variação nos cards
Cada card de Entradas / Saídas / Saldo ganha uma segunda linha pequena:
seta + percentual vs. mês anterior (ex.: "↑ 8% vs mês anterior"). Isso transforma
um número estático em informação acionável — é o tipo de detalhe que diferencia
um dashboard financeiro genérico de um que parece cuidado.

### 3. Gastos por categoria como barra de progresso
Trocar a lista simples de "categoria + valor" por barra de progresso horizontal
por categoria, ordenada da maior para a menor. Fica mais fácil escanear o que
pesa mais no orçamento sem precisar ler número por número.

### 4. Estados vazios com convite à ação
Hoje, quando não há dado, o gráfico mostra uma linha reta em zero — parece erro.
Proposta: card com ícone, uma frase curta ("nenhuma transação neste período") e
um botão de ação ("adicionar transação"). Vale para dashboard, transações e
qualquer tela que possa estar vazia.

### 5. Espaçamento
Aumentar o respiro vertical entre seções (de card para card, de card para
gráfico) em cerca de 30%. Hoje os blocos estão grudados, o que passa sensação
de densidade não intencional.

## O que não muda
- A paleta de cor customizável do usuário — a proposta assume que qualquer cor
  escolhida (inclusive o roxo padrão da logo) deve funcionar dentro dessa
  hierarquia, sem depender de uma cor fixa.
- Estrutura de navegação lateral (Dashboard, Transações, Pagamentos, Categorias
  etc.) — nome e ordem ficam como estão.

## Esforço estimado
Baixo a médio. É CSS e composição de componente, sem tocar em schema,
API routes ou lógica de negócio. Pode ser feito em paralelo aos outros dois
projetos deste conjunto sem gerar conflito.
