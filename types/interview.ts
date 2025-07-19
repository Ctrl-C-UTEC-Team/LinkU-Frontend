export type JobPosition = 'Frontend' | 'Backend' | 'Product Manager' | 'Data Scientist' | 'DevOps' | 'QA Engineer' | 'UI/UX Designer' | 'Full Stack';

export type ExperienceLevel = 'Junior' | 'Mid' | 'Senior';

export type InterviewDuration = 15 | 30 | 45;

export interface InterviewConfig {
  position: JobPosition;
  level: ExperienceLevel;
  duration: InterviewDuration;
  targetCompany?: string;
  industry?: string;
}

export type InterviewStatus = 'configuring' | 'starting' | 'in-progress' | 'paused' | 'completed' | 'error';

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  status: InterviewStatus;
  startTime?: number;
  endTime?: number;
  duration?: number;
  messages: ChatMessage[];
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  audioData?: Blob;
  transcription?: string;
}

export type AIStatus = 'idle' | 'listening' | 'processing' | 'responding';

export interface InterviewFeedback {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  technicalSkills: {
    score: number;
    comments: string;
  };
  communicationSkills: {
    score: number;
    comments: string;
  };
  problemSolving: {
    score: number;
    comments: string;
  };
  recommendations: string[];
}

export interface EmotionSummary {
  finalMood: string;
  averageStressLevel: number;
  averageEngagementLevel: number;
  emotionHistory: any[]; // EmotionData[] - avoiding circular imports
}

export interface InterviewResult {
  sessionId: string;
  config: InterviewConfig;
  duration: number;
  transcript: ChatMessage[];
  feedback: InterviewFeedback;
  completedAt: number;
  emotionSummary?: EmotionSummary;
}