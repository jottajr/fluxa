import type { Card } from "@/types";

export interface GenericPaymentMethod {
  id: string;
  name: string;
  icon: string;
}

export const GENERIC_PAYMENT_METHODS: GenericPaymentMethod[] = [
  { id: "dinheiro", name: "Dinheiro", icon: "💵" },
  { id: "pix", name: "Pix", icon: "⚡" },
  { id: "debito", name: "Débito", icon: "💳" },
  { id: "boleto", name: "Boleto", icon: "🧾" },
];

export function isGenericPaymentMethod(id: string): boolean {
  return GENERIC_PAYMENT_METHODS.some((method) => method.id === id);
}

export function getPaymentMethodLabel(
  id: string | null,
  cards: Card[],
  genericMethods: GenericPaymentMethod[] = GENERIC_PAYMENT_METHODS,
): string {
  if (!id) return "—";

  const generic = genericMethods.find((method) => method.id === id);
  if (generic) return `${generic.icon} ${generic.name}`;

  const card = cards.find((c) => c.id === id);
  return card ? card.name : "—";
}
