import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProficiencyLevel, Skill } from '@/types/user'

interface SkillsState {
  skills: Skill[]
  addSkill: (name: string, proficiency?: ProficiencyLevel) => void
  removeSkill: (id: string) => void
  updateProficiency: (id: string, proficiency: ProficiencyLevel) => void
  toggleWantToLearn: (id: string) => void
  setDetectedSkills: (skills: Array<{ name: string; proficiency: ProficiencyLevel }>) => void
  replaceSkills: (skills: Skill[]) => void
  resetSkills: () => void
}

export const useSkillsStore = create<SkillsState>()(
  persist(
    (set) => ({
      skills: [],
      addSkill: (name, proficiency = 'Beginner') =>
        set((state) => {
          const normalized = name.trim()
          if (!normalized) return state
          if (state.skills.some((skill) => skill.name.toLowerCase() === normalized.toLowerCase())) {
            return state
          }

          return {
            skills: [
              ...state.skills,
              {
                id: crypto.randomUUID(),
                name: normalized,
                proficiency,
                wantToLearn: false,
              },
            ],
          }
        }),
      removeSkill: (id) =>
        set((state) => ({
          skills: state.skills.filter((skill) => skill.id !== id),
        })),
      updateProficiency: (id, proficiency) =>
        set((state) => ({
          skills: state.skills.map((skill) =>
            skill.id === id ? { ...skill, proficiency } : skill,
          ),
        })),
      toggleWantToLearn: (id) =>
        set((state) => ({
          skills: state.skills.map((skill) =>
            skill.id === id ? { ...skill, wantToLearn: !skill.wantToLearn } : skill,
          ),
        })),
      setDetectedSkills: (detectedSkills) =>
        set((state) => {
          const existingByName = new Map(
            state.skills.map((skill) => [skill.name.toLowerCase(), skill]),
          )

          const detectedNames = new Set(
            detectedSkills.map((skill) => skill.name.toLowerCase()),
          )
          const detected = detectedSkills.map((skill) => {
            const existing = existingByName.get(skill.name.toLowerCase())
            return {
              id: existing?.id ?? crypto.randomUUID(),
              name: skill.name,
              proficiency: existing?.proficiency ?? skill.proficiency,
              wantToLearn: existing?.wantToLearn ?? false,
            }
          })
          const manuallyAdded = state.skills.filter(
            (skill) => !detectedNames.has(skill.name.toLowerCase()),
          )

          return { skills: [...detected, ...manuallyAdded] }
        }),
      replaceSkills: (skills) => set({ skills }),
      resetSkills: () => set({ skills: [] }),
    }),
    { name: 'issuepilot-skills' },
  ),
)
