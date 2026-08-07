# Roadmap de funcionalidades — Fluxa

## Regra de execução (leia antes de tudo)

**Cada item desta lista deve ser implementado de forma individual e sequencial.**
Não iniciar o item seguinte sem antes:
1. Apresentar o plano de implementação do item atual (o que será criado/alterado)
2. Obter minha aprovação explícita
3. Concluir e validar o item atual em funcionamento

Isso segue a mesma regra já definida no `CLAUDE.md` do projeto — este documento
não substitui aquelas regras, só organiza a fila de prioridade das próximas
funcionalidades.

## Etapa visual obrigatória por item (antes da implementação de código)

Nenhum dos seis itens abaixo tem tela ou componente já exemplificado no
sistema visual atual do Fluxa. Por isso, cada item passa por uma etapa extra
antes da implementação funcional:

1. **Gerar o mockup daquele item específico no Claude Design**, usando como
   restrição de sistema visual:
   - `01_proposta_visual_fluxa.md` (regras de tipografia, espaçamento,
     indicadores de variação, estados vazios)
   - `04_remasterizacao_visual_claude_design.html` (referência mais
     atualizada de identidade visual já aplicada nas demais páginas do Fluxa)
2. **Apresentar o mockup gerado para minha aprovação** — esta é uma aprovação
   **separada** da aprovação funcional/de código. Ou seja: visual aprovado
   não significa implementação aprovada, e vice-versa. As duas aprovações
   são obrigatórias e independentes antes do Claude Code escrever qualquer
   linha de código daquele item.
3. Só depois das duas aprovações (visual e funcional), o Claude Code
   implementa o item.

Essa etapa vale para todos os seis itens da lista abaixo, um de cada vez,
seguindo a mesma ordem sequencial da regra de execução.

**Organização no Claude Design:** todos os mockups são gerados na **mesma
conversa contínua** (não uma conversa separada por item) — os dois arquivos
de referência (`01_proposta_visual_fluxa.md` e
`04_remasterizacao_visual_claude_design.html`) são anexados uma única vez,
no início, e o contexto acumulado ao longo dos itens ajuda a manter
consistência entre as telas, sem precisar reanexar nada a cada novo item.

---

## 1. WhatsApp + IA para lançamento de transações

**O que é:** usuário manda uma mensagem no WhatsApp (ex.: "uber 23,50 ontem")
ou digita em campo de texto livre dentro do app. A IA interpreta, categoriza
e lança a transação **automaticamente**, sem pedir confirmação prévia no
próprio WhatsApp.

**Fluxo de confirmação:** o lançamento entra no sistema com status **"pendente
de confirmação"**. Fica assim até o usuário validar (ou corrigir) dentro do
app. Não bloqueia nem espera resposta no WhatsApp.

**Depende de:** definição de provedor (recomendado: API oficial da Meta,
Cloud API direta — ver justificativa de custo abaixo), endpoint de webhook,
integração com API da Anthropic para extração de dados.

**Custo recorrente:** mensagens de resposta ao usuário (dentro da janela de
24h iniciada por ele) são gratuitas. Avisos proativos futuros (fora do escopo
deste item) usariam categoria "utility", ~R$0,035/mensagem.

---

## 2. Parcelamento com projeção futura + sugestão automática de corte

**Parte A — Projeção:** usando os campos de cartão já existentes no schema
(`dia_fechamento`, `dia_vencimento`), o app projeta parcelas futuras de
compras já lançadas (ex.: "você ainda deve 7 parcelas de R$120 até março").

**Parte B — Sugestão de corte:** a IA analisa o histórico real de gasto do
usuário e sugere onde cortar, com base em padrão observado (ex.: "seu gasto
com delivery subiu 20% esse mês").

**Depende de:** lógica de cálculo de projeção (não depende de IA, é cálculo
determinístico); a parte B depende de volume mínimo de histórico para ter
sugestão relevante.

---

## 3. Perfil comportamental com alerta preditivo

**O que é:** com histórico acumulado de uso, o app aprende o padrão de gasto
do usuário e antecipa picos recorrentes (ex.: "seu gasto sempre sobe entre os
dias 25 e 30, quer um alerta reforçado nessa janela?").

**Importante:** só fica preciso com tempo de uso acumulado — não funciona
bem nos primeiros meses. Depende dos dados do item 2 e do uso contínuo do
app para ter base histórica suficiente.

---

## 4. Leitura de boleto/QR (Pix) por foto

**O que é:** usuário tira foto ou print de um boleto ou QR code de Pix, e o
app lança e categoriza automaticamente via OCR — sem precisar digitar ou
descrever por texto. É um canal de entrada separado do WhatsApp por texto
(item 1).

**Depende de:** integração de OCR/leitura de imagem, definição de onde esse
canal fica disponível (só no app? também via WhatsApp enviando a foto?).

---

## 5. Aba de assinaturas e contas recorrentes

**O que é:** tela dedicada listando assinaturas e contas recorrentes, com
nome, valor, dia aproximado de cobrança e total mensal comprometido.

**Como a recorrência é identificada:**
- **Lançamento manual pelo app:** o usuário já informa se é recorrente no
  momento do lançamento (campo `recorrente` já existente no schema) — a
  plataforma já sabe, não precisa detectar nada.
- **Lançamento via WhatsApp/IA (item 1):** como não há campo preenchido
  manualmente, a IA precisa **inferir** se aquele lançamento é recorrente,
  com base em padrão de descrição, valor e intervalo entre ocorrências.

**Depende de:** item 1 estar implementado, para que a inferência via IA
tenha lançamentos de WhatsApp para analisar.

---

## 6. Onboarding personalizado (5 perguntas obrigatórias)

**O que é:** na criação de conta, 5 perguntas sem opção de pular:

1. O que te trouxe até aqui? → dívida / guardar dinheiro / dia a dia / visão geral
2. Como é sua renda? → fixa / variável / mista
3. Paga mais parcelado ou à vista/Pix?
4. Organiza sozinho ou com mais alguém?
5. Quer aviso proativo ou só consulta quando abrir o app?

**O que as respostas controlam:**
- Ordem/destaque dos cards no dashboard (ex.: quem respondeu "dívida" vê o
  card de cartão/fatura em primeiro lugar)
- Ativação padrão de avisos proativos via WhatsApp (pergunta 5)
- Sinalização para oferecer convite de perfil vinculado (pergunta 4)

**Revisável:** o usuário pode refazer essas respostas depois, em
Configurações, e o dashboard se reordena de novo.

**Depende de:** campo `onboarding_preferences` (JSON) na tabela `profiles`
— schema simples, sem tabela nova.

---

## Ordem sugerida de implementação

A ordem abaixo considera dependência técnica entre itens, não é obrigatória
— pode ser ajustada por prioridade de negócio a qualquer momento, desde que
a regra de execução individual no topo deste documento seja respeitada:

1. Onboarding personalizado (item 6) — independente dos demais, mais simples
2. WhatsApp + IA para lançamento (item 1) — base para os itens 5 e parte do 3
3. Parcelamento com projeção + sugestão de corte (item 2)
4. Aba de assinaturas/recorrentes (item 5) — depende do item 1
5. Leitura de boleto/QR por foto (item 4)
6. Perfil comportamental com alerta preditivo (item 3) — depende de histórico
   acumulado, faz sentido vir por último

## Prompt para o Claude Design — mockup do item 6 (onboarding)

Como o onboarding é o primeiro item da fila de implementação, este é o
primeiro mockup a ser gerado. Prompt pronto para colar no Claude Design,
anexando os dois arquivos de referência junto:

```
Preciso desenhar as 5 telas de onboarding do meu app financeiro Fluxa.
Estou anexando dois arquivos de referência que definem o sistema visual
já em uso no app — não é para criar uma identidade nova, é para estender
a existente a essas telas novas, que ainda não têm exemplo nenhum hoje:

1. 01_proposta_visual_fluxa.md — regras de tipografia, hierarquia,
   espaçamento e estados vazios já aprovadas
2. 04_remasterizacao_visual_claude_design.html — referência mais
   atualizada da identidade visual já aplicada nas páginas existentes do
   Fluxa (é a fonte mais confiável de cor, componente e estilo atual)

As 5 telas, uma pergunta obrigatória por tela (sem opção de pular),
com indicador de progresso (5 etapas):

1. "O que te trouxe até aqui?" — 4 opções: Sair das dívidas / Guardar
   dinheiro / Controlar o dia a dia / Ver tudo num só lugar
2. "Como é sua renda?" — 3 opções: Fixa / Variável / Mista
3. "Você paga mais no crédito parcelado ou à vista/Pix?" — 3 opções:
   Majoritariamente parcelado / Misto / Quase tudo à vista ou Pix
4. "Você organiza as finanças sozinho ou com mais alguém?" — 3 opções:
   Sozinho / Com cônjuge ou parceiro / Com a família toda
5. "Prefere que o app te avise proativamente ou só consultar quando
   quiser?" — 2 opções: Me avisa sempre / Só quando eu abrir o app

Cada tela tem botão de voltar (exceto a primeira) e avança automaticamente
ao selecionar uma opção, sem botão de "próximo" separado.
```

Não implementar nada no Claude Code a partir desse mockup sem antes eu
aprovar o resultado visual gerado.

## Fora de escopo (decidido e não deve voltar a ser sugerido)
- Relatório PJ/freelancer para autônomo
- Gamificação (streaks, missões, XP)
- Open Finance / integração bancária direta
