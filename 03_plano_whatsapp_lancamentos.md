# Plano de implementação — lançamento via WhatsApp (e app)

## Objetivo
Permitir que o usuário mande uma mensagem tipo "uber 23,50 ontem" pelo
WhatsApp ou por um campo de texto livre no próprio app, e o sistema já grave
a transação categorizada, sem preencher formulário.

## Recomendação de provedor: API oficial da Meta (Cloud API), direto

Comparando as duas opções que existem hoje:

| | Meta Cloud API direto | Twilio (BSP) |
|---|---|---|
| Custo por mensagem | Só a tarifa da Meta (varia por país/categoria) | Tarifa da Meta + markup próprio de cerca de US$0,005 por mensagem |
| Conversas iniciadas pelo usuário | Gratuitas dentro da janela de 24h | Mesma regra, mas com o markup do Twilio por cima |
| Esforço de setup | Maior — você monta o webhook, gerencia templates de mensagem | Menor — Twilio abstrai parte da integração e tem sandbox de teste mais simples |
| Adequação ao seu caso | Alta — o usuário sempre inicia a conversa mandando o gasto, isso cai na categoria de "conversa de serviço", que é gratuita | Também funciona, mas você paga markup por algo que a Meta já oferece de graça nesse fluxo |

**Por que direto na Meta:** no seu uso, quem sempre inicia a conversa é o
usuário mandando o gasto — isso classifica como conversa de serviço, que fica
dentro da janela gratuita de 24h. Pagar markup de um BSP como o Twilio faz
mais sentido quando a empresa também dispara mensagens (lembretes, campanhas),
que não é o seu caso hoje. Como você já vai construir a lógica de
interpretação da mensagem de qualquer forma (não tem como terceirizar isso),
o esforço extra de configurar o webhook direto na Meta é pequeno perto da
economia de não pagar markup por usuário ativo.

Se no futuro o Fluxa evoluir para mandar lembretes proativos ("você está perto
do limite de Alimentação"), vale reavaliar — aí sim um BSP com ferramentas de
template pronto pode compensar o custo.

## Fluxo técnico (visão geral, sem código)
1. Usuário manda mensagem no WhatsApp → Meta entrega no seu endpoint de
   webhook (uma API route no Next.js)
2. O endpoint identifica o usuário pelo número de telefone cadastrado
3. O texto da mensagem é enviado para a API da Anthropic, pedindo para
   extrair `{descrição, valor, categoria sugerida, data}`
4. O sistema responde no próprio WhatsApp pedindo confirmação
   ("Uber, R$23,50, categoria Transporte — confirma?")
5. Só depois da confirmação, grava na tabela `transactions` já existente

## Por que a confirmação (passo 4) não é opcional
Sem ela, o primeiro erro de categorização vira motivo para o usuário parar de
confiar no recurso. É mais barato pedir uma confirmação de um toque do que
corrigir a percepção de "a IA erra".

## O mesmo fluxo, mas dentro do app
O campo de texto livre no app usa exatamente a mesma lógica de interpretação
(passos 3 e 4) — só muda a origem da mensagem. Isso significa que a parte
mais difícil (interpretar texto e categorizar) é construída uma única vez e
serve os dois canais.

## Pré-requisitos e pontos de decisão
- Cadastro de número de telefone vinculado ao `profile` do usuário (campo
  novo no schema — precisa de aprovação)
- Conta de desenvolvedor Meta + número de WhatsApp Business verificado
  (processo de verificação da Meta, pode levar alguns dias)
- Definir o que acontece se a IA não conseguir extrair a informação com
  confiança (pedir mais detalhe? cair para lançamento manual?)

## Esforço estimado
Médio. A parte de infraestrutura (webhook, autenticação por telefone) é
trabalho novo, mas a gravação final usa a tabela e as regras de RLS que já
existem — não há redesenho de schema além do campo de telefone.

## Ordem sugerida em relação aos outros dois planos
Pode ser feito em paralelo à Proposta Visual (não há conflito de arquivos).
Depende do Nível 1 do Plano de IA/Insights estar pelo menos esboçado, porque
a lógica de categorização automática é compartilhada entre os dois.
