import axios from 'axios'

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8888'

export interface Challenge {
  id: number
  name: string
  description: string
  difficulty: string
  points: number
  network: string
  targets: string[]
  order?: number  // 渗透顺序
}

export interface Progress {
  user_id: string
  completed_challenges: number[]
  total_score: number
  start_time: string
  last_update: string
  submission_history: Submission[]
}

export interface Submission {
  challenge_id: number
  flag: string
  correct: boolean
  timestamp: string
}

export interface NetworkNode {
  id: string
  name: string
  ip: string
  services: string[]
  network: string
  status: 'unknown' | 'discovered' | 'compromised'
}

export interface NetworkEdge {
  from: string
  to: string
  access: 'allowed' | 'blocked' | 'vpn'
}

export interface NetworkTopology {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
}

export interface SubmitFlagResponse {
  correct: boolean
  message: string
  points_earned?: number
  total_score?: number
  already_solved?: boolean
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const getChallenges = async (): Promise<Challenge[]> => {
  const response = await api.get('/api/challenges')
  return response.data
}

export const getChallenge = async (id: number): Promise<Challenge> => {
  const response = await api.get(`/api/challenges/${id}`)
  return response.data
}

export const submitFlag = async (
  challengeId: number,
  flag: string
): Promise<SubmitFlagResponse> => {
  const response = await api.post('/api/submit', {
    challenge_id: challengeId,
    flag: flag.trim(),
  })
  return response.data
}

export const getProgress = async (): Promise<Progress> => {
  const response = await api.get('/api/progress')
  return response.data
}

export const resetProgress = async (): Promise<void> => {
  await api.post('/api/reset')
}

export const getTopology = async (): Promise<NetworkTopology> => {
  const response = await api.get('/api/topology')
  return response.data
}

export const getHints = async (id: number): Promise<string[]> => {
  const response = await api.get(`/api/hints/${id}`)
  return response.data.hints
}
