import type { CardType } from "@/types";

export function cardTypeLabel(type: CardType): string {
  if (type === "credito") return "Crédito";
  if (type === "debito") return "Débito";
  return "Crédito e Débito";
}
