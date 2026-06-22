export interface GitHubRepositoryResponse {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  default_branch: string
  language: string | null
  stargazers_count: number
  forks_count: number
  subscribers_count?: number
  watchers_count: number
  open_issues_count: number
  license: { spdx_id: string | null; name: string } | null
  topics?: string[]
  size: number
  archived: boolean
  fork: boolean
  created_at: string
  updated_at: string
  pushed_at: string | null
  owner: { login: string }
}

export interface GitHubContentResponse {
  name: string
  path: string
  type: 'file' | 'dir' | 'symlink' | 'submodule'
  html_url: string | null
  download_url: string | null
  size: number
  encoding?: string
  content?: string
}

export interface GitHubIssueResponse {
  id: number
  number: number
  title: string
  body: string | null
  html_url: string
  labels: Array<string | { name?: string | null }>
  state: string
  user: { login: string } | null
  assignees: Array<{ login: string }>
  comments: number
  created_at: string
  updated_at: string
  pull_request?: unknown
}


export interface GitHubIssueCommentResponse {
  id: number
  body: string | null
  html_url: string
  user: { login: string } | null
  created_at: string
  updated_at: string
}

export interface GitHubUserResponse {
  id: number
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  bio: string | null
  location: string | null
  company: string | null
  blog: string
  public_repos: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

export interface GitHubUserRepositoryResponse extends GitHubRepositoryResponse {
  topics?: string[]
}
