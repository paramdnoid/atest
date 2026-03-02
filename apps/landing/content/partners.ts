import {
  Award,
  BadgeCheck,
  Building2,
  Palette,
  ShieldCheck,
  Thermometer,
} from "lucide-react";

export const partners = [
  { name: "Handwerkskammer", icon: Building2 },
  { name: "ZVSHK", icon: Thermometer },
  { name: "Bundesverband", icon: Award },
  { name: "Malerverband", icon: Palette },
  { name: "TÜV Zertifiziert", icon: ShieldCheck },
  { name: "ISO 27001", icon: BadgeCheck },
] as const;
