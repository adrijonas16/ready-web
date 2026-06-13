import { Section } from './types';

export function groupSections(sections: Section[]): { group: string; options: string[] }[] {
  const groups: Record<string, string[]> = {};
  const groupOrder: string[] = [];
  for (const s of sections) {
    if (!groups[s.groupName]) {
      groups[s.groupName] = [];
      groupOrder.push(s.groupName);
    }
    groups[s.groupName].push(s.name);
  }
  return groupOrder.map(g => ({ group: g, options: groups[g] }));
}
