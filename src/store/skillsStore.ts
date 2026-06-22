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
      resetSkills: () => set({ skills: defaultSkills }),
    }),
    { name: 'issuepilot-skills' }
  )
)
