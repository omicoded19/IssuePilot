import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useSkillsStore } from '@/store/skillsStore'
import type { ProficiencyLevel } from '@/types/user'

const levels: ProficiencyLevel[] = ['Beginner', 'Intermediate', 'Advanced']

interface SkillsManagerProps {
  compact?: boolean
}

export function SkillsManager({ compact = false }: SkillsManagerProps) {
  const skills = useSkillsStore((state) => state.skills)
  const addSkill = useSkillsStore((state) => state.addSkill)
  const removeSkill = useSkillsStore((state) => state.removeSkill)
  const updateProficiency = useSkillsStore((state) => state.updateProficiency)
  const toggleWantToLearn = useSkillsStore((state) => state.toggleWantToLearn)
  const [name, setName] = useState('')
  const [proficiency, setProficiency] = useState<ProficiencyLevel>('Beginner')

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault()
    const normalized = name.trim()
    if (!normalized) return
    addSkill(normalized, proficiency)
    setName('')
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-medium text-white">Skills used for matching</h3>
        <p className="mt-1 text-xs text-slate-500">
          GitHub-detected skills and skills you add manually are both sent to the recommendation engine.
        </p>
      </div>

      <form onSubmit={handleAdd} className="grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Add a skill, framework, or tool"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500/40 focus:outline-none"
        />
        <select
          value={proficiency}
          onChange={(event) => setProficiency(event.target.value as ProficiencyLevel)}
          className="rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm text-slate-300 focus:border-emerald-500/40 focus:outline-none"
        >
          {levels.map((level) => <option key={level}>{level}</option>)}
        </select>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      <div className={compact ? 'mt-4 grid gap-2' : 'mt-4 grid gap-2 sm:grid-cols-2'}>
        {skills.map((skill) => (
          <div key={skill.id} className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">{skill.name}</p>
              <button
                type="button"
                onClick={() => removeSkill(skill.id)}
                aria-label={`Remove ${skill.name}`}
                className="rounded-md p-1.5 text-slate-600 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <select
                value={skill.proficiency}
                onChange={(event) => updateProficiency(skill.id, event.target.value as ProficiencyLevel)}
                className="min-w-0 flex-1 rounded-md border border-white/8 bg-[#101010] px-2 py-1.5 text-xs text-slate-300"
              >
                {levels.map((level) => <option key={level}>{level}</option>)}
              </select>
              <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                <input
                  type="checkbox"
                  checked={skill.wantToLearn}
                  onChange={() => toggleWantToLearn(skill.id)}
                  className="accent-emerald-500"
                />
                Want to learn
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
