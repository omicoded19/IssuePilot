const githubOrganizationAliases: Record<string, string> = {
  calcom: 'calcom',
  opensauced: 'open-sauced',
  freecodecamp: 'freeCodeCamp',
  tanstack: 'TanStack',
  tooljet: 'ToolJet',
}

export function getGitHubOrganizationLogoUrl(slug: string): string {
  const normalized = slug.trim().toLowerCase()
  const owner = githubOrganizationAliases[normalized] ?? slug
  return `https://github.com/${encodeURIComponent(owner)}.png?size=96`
}
