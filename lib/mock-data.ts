// Import types from centralized types file
import type { CompetencyScores } from './types'
export type { CompetencyScores } from './types'

// Calculate competency scores based on interview performance
export const calculateCompetencyScores = (sessionData: any): CompetencyScores => {
  const { totalWords, fillerWords, questionResponses } = sessionData

  const avgWordsPerResponse = totalWords / Math.max(questionResponses.length, 1)
  const fillerWordRatio = fillerWords / Math.max(totalWords, 1)

  // Basic calculation since we're using ElevenLabs agent
  const getCompetencyScore = () => {
    return Math.min(5, Math.max(1, 3 + avgWordsPerResponse / 50 - fillerWordRatio * 2))
  }

  return {
    adaptabilidad: Math.min(5, Math.max(1, 3 - fillerWordRatio * 2)),
    escuchaActiva: Math.min(5, Math.max(1, 4 - fillerWordRatio * 2)),
    claridad: Math.min(5, Math.max(1, 2 + avgWordsPerResponse / 50)),
    liderazgo: Math.min(5, Math.max(1, 3)),
    resolucionProblemas: Math.min(5, Math.max(1, 3)),
    comunicacion: Math.min(5, Math.max(1, 3 + avgWordsPerResponse / 60)),
  }
}

