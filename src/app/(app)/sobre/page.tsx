const bodyText = "text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300";
const panel =
  "dark:rounded-2xl dark:border dark:border-slate-800 dark:bg-slate-900/60 dark:p-8 dark:shadow-lg dark:shadow-black/20";
const sectionSpacing = `border-t border-slate-200 pt-10 dark:border-t dark:pt-8 ${panel}`;
const sectionTitle =
  "text-2xl font-bold text-[var(--accent)] sm:text-3xl dark:text-slate-100";
const subtitle =
  "text-lg font-semibold text-slate-900 sm:text-xl dark:text-slate-100";

const faqItems: { question: string; answer: string }[] = [
  {
    question: "O que é o Fluxa?",
    answer:
      "O Fluxa é um aplicativo de controle financeiro pessoal focado em simplicidade. Ele ajuda você a registrar receitas e despesas, acompanhar sua situação financeira e entender melhor para onde seu dinheiro está indo.",
  },
  {
    question: "O Fluxa possui integração com bancos?",
    answer:
      "Não há sincronização automática nem integração via Open Finance. Essa foi uma decisão intencional. Você pode importar um extrato em CSV quando quiser, mas revisa e categoriza cada lançamento manualmente antes de confirmar, mantendo o controle consciente sobre seus dados.",
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
      <div className={`space-y-6 text-center ${panel}`}>
        <img src="/fluxa-icon.png" alt="" className="mx-auto h-16 w-auto" />
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-100">
          Conheça o Fluxa
        </h1>
        <div className="mx-auto max-w-2xl space-y-4">
          <p className={bodyText}>
            O Fluxa nasceu de uma experiência real. Depois de testar
            planilhas, aplicativos financeiros e diferentes métodos de
            controle, ficou claro que o problema não era a falta de recursos.
            Era o excesso deles.
          </p>
          <p className={bodyText}>
            A maioria das pessoas não precisa de mais informações. Precisa de
            mais clareza. O Fluxa foi criado para transformar o controle
            financeiro em um hábito simples e sustentável.
          </p>
        </div>
      </div>

      <section className={`${sectionSpacing} space-y-8`}>
        <h2 className={sectionTitle}>Filosofia</h2>

        <div className="space-y-3">
          <h3 className={subtitle}>Menos automação. Mais consciência.</h3>
          <p className={bodyText}>
            Muitos aplicativos registram tudo automaticamente. Mas registrar
            não significa entender. Quando você adiciona suas receitas e
            despesas manualmente, cria uma conexão maior com seus hábitos e
            passa a perceber padrões que normalmente passariam despercebidos.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className={subtitle}>Simplicidade é uma escolha.</h3>
          <p className={bodyText}>
            Cada funcionalidade do Fluxa existe por um motivo. Nunca porque é
            popular ou porque outros aplicativos têm. O objetivo é manter uma
            experiência simples e fácil de usar por meses e anos, não só nos
            primeiros dias. Porque não importa quantos recursos um app tem se
            ele é abandonado depois de algumas semanas: o melhor controle
            financeiro é aquele que você realmente usa.
          </p>
        </div>
      </section>

      <section className={`${sectionSpacing} space-y-8`}>
        <h2 className={sectionTitle}>Perguntas frequentes</h2>
        <div className="space-y-8">
          {faqItems.map((item) => (
            <div key={item.question} className="space-y-2">
              <h3 className={subtitle}>{item.question}</h3>
              <p className={bodyText}>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <p
        className={`border-t border-slate-200 pt-10 text-center text-xl font-semibold text-[var(--accent)] sm:text-2xl dark:border-t dark:pt-8 dark:text-slate-100 ${panel}`}
      >
        Fluxa. Seu dinheiro com mais clareza e menos complicação.
      </p>
    </div>
  );
}
