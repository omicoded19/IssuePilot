import type { Skill } from '@/types/user'

export const defaultSkills: Skill[] = [
  { id: '1', name: 'React', proficiency: 'Intermediate', wantToLearn: false },
  { id: '2', name: 'TypeScript', proficiency: 'Intermediate', wantToLearn: false },
  { id: '3', name: 'Node.js', proficiency: 'Intermediate', wantToLearn: false },
  { id: '4', name: 'C++', proficiency: 'Advanced', wantToLearn: false },
  { id: '5', name: 'Python', proficiency: 'Beginner', wantToLearn: true },
  { id: '6', name: 'MongoDB', proficiency: 'Intermediate', wantToLearn: false },
  { id: '7', name: 'Express', proficiency: 'Intermediate', wantToLearn: false },
  { id: '8', name: 'Tailwind CSS', proficiency: 'Intermediate', wantToLearn: false },
]

export const contributionPreferences = [
  'Frontend',
  'Backend',
  'Full stack',
  'Documentation',
  'Testing',
  'Bug fixes',
  'Features',
  'UI improvements',
  'Developer tools',
] as const
