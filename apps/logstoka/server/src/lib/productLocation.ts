export type ProductLocation = {
  aisle: string;
  shelf: string;
  level: string;
  label: string;
};

export function getProductLocationByKey(key: string): ProductLocation {
  const n = key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const aisles = ['A', 'B', 'C', 'D', 'E'];
  const aisle = aisles[n % aisles.length]!;
  const shelf = String((n % 12) + 1).padStart(2, '0');
  const level = String((n % 5) + 1).padStart(2, '0');

  return {
    aisle: `Corredor ${aisle}`,
    shelf: `Prateleira ${shelf}`,
    level: `Nível ${level}`,
    label: `Corredor ${aisle} · Prateleira ${shelf} · Nível ${level}`,
  };
}
