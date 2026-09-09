import {
  Truck,
  Package,
  Leaf,
  Gift,
  RotateCcw,
  CreditCard,
  Clock,
  ShieldCheck,
  Phone,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { FAQ_ICON_KEYS, type FaqIconKey } from "./faq-icons";

export const FAQ_ICON_COMPONENTS: Record<FaqIconKey, LucideIcon> = {
  truck: Truck,
  package: Package,
  leaf: Leaf,
  gift: Gift,
  "rotate-ccw": RotateCcw,
  "credit-card": CreditCard,
  clock: Clock,
  "shield-check": ShieldCheck,
  phone: Phone,
  "help-circle": HelpCircle,
};

/** Falls back to the position-based cycle when the admin picked no icon. */
export function resolveFaqIcon(
  iconKey: string | null | undefined,
  fallbackIndex: number
): LucideIcon {
  if (iconKey && iconKey in FAQ_ICON_COMPONENTS) {
    return FAQ_ICON_COMPONENTS[iconKey as FaqIconKey];
  }

  const cycleKey = FAQ_ICON_KEYS[fallbackIndex % FAQ_ICON_KEYS.length];
  return FAQ_ICON_COMPONENTS[cycleKey];
}
