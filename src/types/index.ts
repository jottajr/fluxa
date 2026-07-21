export type ProfileType = "pessoal" | "empresarial";

export interface Profile {
  id: string;
  name: string;
  type: ProfileType;
  document: string | null;
  icon: string;
}

export type TransactionType = "entrada" | "saida";

export type TransactionStatus = "pendente" | "pago" | "agendado" | "atrasado";

export type CardType = "credito" | "debito" | "ambos";

export interface Card {
  id: string;
  name: string;
  bank: string;
  type: CardType;
  closingDay: number | null;
  dueDay: number | null;
  creditLimit: number | null;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  icon: string;
}

export interface BudgetGoal {
  id: string;
  categoryId: string | null;
  paymentMethodId: string | null;
  monthlyLimit: number;
}

export interface InvestmentReturn {
  id: string;
  date: string;
  amount: number;
  note: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: TransactionStatus;
  type: TransactionType;
  paymentMethodId: string | null;
  categoryId: string | null;
  recurring: boolean;
  note: string;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
}
