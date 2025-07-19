export interface MediaPermissions {
  camera: PermissionState;
  microphone: PermissionState;
}

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'checking';

export interface VideoConfig {
  width: number;
  height: number;
  frameRate: number;
  facingMode?: 'user' | 'environment';
}

export interface AudioConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export interface MediaStreamConfig {
  video: VideoConfig;
  audio: AudioConfig;
}

export interface MediaError {
  name: string;
  message: string;
  constraint?: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  chunks: Blob[];
}

export interface AudioAnalysis {
  volume: number;
  frequency: number[];
  speaking: boolean;
}