import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultSkills } from '@/data/skills'
import type { ProficiencyLevel, Skill } from '@/types/user'

interface SkillsState {
  skills: Skill[]
  addSkill: (name: string, proficiency?: ProficiencyLevel) => void
  removeSkill: (id: string) => void
  updateProficiency: (id: string, proficiency: ProficiencyLevel) => void
  toggleWantToLearn: (id: string) => void
  setDetectedSkills: (skills: Array<{ name: string; proficiency: ProficiencyLevel }>) => void
  resetSkills: () => void
}

export const useSkillsStore = create<SkillsState>()(
  persist(
    (set) => ({
      skills: defaultSkills,
      addSkill: (name, proficiency = 'Beginner') =>
        set((state) => ({
          skills: [
            ...state.skills,
            {
              id: crypto.randomUUID(),
              name,
              proficiency,
              wantToLearn: false,
            },
          ],
        })),
      removeSkill: (id) =>
        set((state) => ({
          skills: state.skills.filter((s) => s.id !== id),
        })),
      updateProficiency: (id, proficiency) =>
        set((state) => ({
          skills: state.skills.map((s) =>
            s.id === id ? { ...s, proficiency } : s
          ),
        })),
      toggleWantToLearn: (id) =>
        set((state) => ({
          skills: state.skills.map((s) =>
            s.id === id ? { ...s, wantToLearn: !s.wantToLearn } : s
          ),
        })),
      setDetectedSkills: (detectedSkills) =>
        set((state) => {
          const existingByName = new Map(
            state.skills.map((skill) => [skill.name.toLowerCase(), skill]),
          )
          return {
            skills: detectedSkills.map((skill) => {
              const existing = existingByName.get(skill.name.toLowerCase())
              return {
                id: existing?.id ?? crypto.randomUUID(),
                name: skill.name,
                proficiency: skill.proficiency,
                wantToLearn: existing?.wantToLearn ?? false,
              }
            }),
          }
        }),
      resetSkills: () => set({ skills: defaultSkills }),
    }),
    { name: 'issuepilot-skills' }
  )
)
