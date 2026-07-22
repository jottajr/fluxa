const sectionSpacing = "border-t border-slate-200 pt-10 dark:border-slate-800";
const bodyText = "text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300";

const faqItems: { question: string; answer: string }[] = [
  {
    question: "O que é o Fluxa?",
    answer:
      "O Fluxa é um aplicativo de controle financeiro pessoal focado em simplicidade. Ele ajuda você a registrar receitas e despesas, acompanhar sua situação financeira e entender melhor para onde seu dinheiro está indo.",
  },
  {
    question: "O Fluxa possui integração com bancos?",
    answer:
      "Não há sincronização automática nem integração via Open Finance — essa foi uma decisão intencional. Você pode importar um extrato em CSV quando quiser, mas revisa e categoriza cada lançamento manualmente antes de confirmar, mantendo o controle consciente sobre seus dados.",
  },
  {
    question: "Por que o preenchimento é manual?",
    answer:
      "Porque acreditamos que registrar seus gastos conscientemente gera mais controle financeiro. Ao lançar uma despesa, você entende melhor seus hábitos e toma decisões mais conscientes sobre seu dinheiro.",
  },
  {
    question: "O Fluxa é indicado para quem?",
    answer:
      "Para pessoas que já tentaram usar planilhas e desistiram, não se adaptaram a aplicativos complexos, querem uma visão simples das próprias finanças, buscam criar disciplina financeira e preferem praticidade em vez de excesso de funcionalidades.",
  },
  {
    question: "Meus dados estão seguros?",
    answer:
      "A segurança dos seus dados é uma prioridade. Utilizamos boas práticas de armazenamento e proteção para garantir que suas informações permaneçam privadas e protegidas.",
  },
];

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-16 pb-16">
      <div className="space-y-6 text-center">
        <img src="/fluxa-icon.png" alt="" className="mx-auto h-16 w-auto" />
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-100">
          Conheça o Fluxa
        </h1>
        <p className={`${bodyText} mx-auto max-w-2xl`}>
          O Fluxa nasceu de uma experiência real. Depois de testar planilhas,
          aplicativos financeiros e diferentes métodos de controle, ficou
          claro que o problema não era a falta de recursos — era o excesso
          deles. A maioria das pessoas não precisa de mais informações.
          Precisa de mais clareza. O Fluxa foi criado para transformar o
          controle financeiro em um hábito simples e sustentável.
        </p>
      </div>

      <section className={`${sectionSpacing} space-y-8`}>
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
          Filosofia
        </p>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-slate-100">
            Menos automação. Mais consciência.
          </h2>
          <p className={bodyText}>
            Muitos aplicativos registram tudo automaticamente — mas registrar
            não significa entender. Quando você adiciona suas receitas e
            despesas manualmente, cria uma conexão maior com seus hábitos e
            passa a perceber padrões que normalmente passariam despercebidos.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-slate-100">
            Simplicidade é uma escolha.
          </h2>
          <p className={bodyText}>
            Cada funcionalidade do Fluxa existe por um motivo — nunca porque é
            popular ou porque outros aplicativos têm. O objetivo é manter uma
            experiência simples e fácil de usar por meses e anos, não só nos
            primeiros dias. Porque não importa quantos recursos um app tem se
            ele é abandonado depois de algumas semanas: o melhor controle
            financeiro é aquele que você realmente usa.
          </p>
        </div>
      </section>

      <section className={`${sectionSpacing} space-y-8`}>
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
          Perguntas frequentes
        </p>
        <div className="space-y-8">
          {faqItems.map((item) => (
            <div key={item.question} className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {item.question}
              </h2>
              <p className={bodyText}>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="border-t border-slate-200 pt-10 text-center text-xl font-semibold text-[var(--accent)] sm:text-2xl dark:border-slate-800 dark:text-slate-100">
        Fluxa. Seu dinheiro com mais clareza e menos complicação.
      </p>
    </div>
  );
}
