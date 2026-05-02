export interface MTGCard {
  id: string;
  name: string;
  manaCost: string;
  type: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Mythic Rare";
  pt: string; // Power/Toughness or Loyalty
  abilities: string;
  flavorText: string;
  imageUrl: string;
  theme: string;
  color: string[]; // ['W', 'U', 'B', 'R', 'G']
}
