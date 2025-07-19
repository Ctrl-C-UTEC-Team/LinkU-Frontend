'use client';

import { 
  WebSocketConfig, 
  WebSocketConnectionStatus, 
  GeminiWebSocketMessage, 
  GeminiAudioMessage, 
  GeminiTextMessage, 
  GeminiControlMessage,
  GeminiResponse 
} from '@/types';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private connectionStatus: WebSocketConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageQueue: GeminiWebSocketMessage[] = [];
  
  // Event callbacks
  private onStatusChange: (status: WebSocketConnectionStatus) => void = () => {};
  private onMessage: (response: GeminiResponse) => void = () => {};
  private onError: (error: Error) => void = () => {};

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  public setCallbacks(callbacks: {
    onStatusChange?: (status: WebSocketConnectionStatus) => void;
    onMessage?: (response: GeminiResponse) => void;
    onError?: (error: Error) => void;
  }) {
    if (callbacks.onStatusChange) this.onStatusChange = callbacks.onStatusChange;
    if (callbacks.onMessage) this.onMessage = callbacks.onMessage;
    if (callbacks.onError) this.onError = callbacks.onError;
  }

  public async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setConnectionStatus('connecting');
    
    try {
      this.ws = new WebSocket(this.config.url);
      
      // Set up event handlers
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

    } catch (error) {
      this.handleError(error as Event);
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.setConnectionStatus('disconnected');
    this.reconnectAttempts = 0;
  }

  public sendAudio(audioData: ArrayBuffer, format: 'webm' | 'wav' | 'mp3' = 'webm', sampleRate: number = 44100): void {
    const message: GeminiAudioMessage = {
      type: 'audio',
      data: {
        audioData,
        format,
        sampleRate
      },
      timestamp: Date.now()
    };
    
    this.sendMessage(message);
  }

  public sendText(content: string, role: 'user' | 'assistant' = 'user'): void {
    const message: GeminiTextMessage = {
      type: 'text',
      data: {
        content,
        role
      },
      timestamp: Date.now()
    };
    
    this.sendMessage(message);
  }

  public sendControl(action: 'start' | 'stop' | 'pause' | 'resume', sessionId?: string): void {
    const message: GeminiControlMessage = {
      type: 'control',
      data: {
        action,
        sessionId
      },
      timestamp: Date.now()
    };
    
    this.sendMessage(message);
  }

  private sendMessage(message: GeminiWebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        // For Gemini API, we need to format the message according to their schema
        const geminiMessage = this.formatForGemini(message);
        this.ws.send(JSON.stringify(geminiMessage));
      } catch (error) {
        console.error('Error sending message:', error);
        this.onError(new Error('Failed to send message'));
      }
    } else {
      // Queue message for when connection is established
      this.messageQueue.push(message);
    }
  }

  private formatForGemini(message: GeminiWebSocketMessage): any {
    // Format message according to Gemini's WebSocket API schema
    const baseMessage = {
      setup: {
        model: 'models/gemini-2.0-flash-exp',
        generation_config: {
          response_modalities: ['AUDIO', 'TEXT'],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: 'Aoede'
              }
            }
          }
        },
        system_instruction: {
          parts: [{
            text: 'You are an AI interviewer conducting a professional job interview. Be engaging, ask relevant questions based on the candidate\'s responses, and provide constructive feedback. Keep questions appropriate for the specified role and experience level.'
          }]
        }
      }
    };

    switch (message.type) {
      case 'audio':
        return {
          ...baseMessage,
          client_content: {
            turns: [{
              role: 'user',
              parts: [{
                inline_data: {
                  mime_type: `audio/${message.data.format}`,
                  data: this.arrayBufferToBase64(message.data.audioData)
                }
              }]
            }],
            turn_complete: true
          }
        };

      case 'text':
        return {
          ...baseMessage,
          client_content: {
            turns: [{
              role: message.data.role,
              parts: [{
                text: message.data.content
              }]
            }],
            turn_complete: true
          }
        };

      case 'control':
        return {
          type: 'control',
          action: message.data.action,
          session_id: message.data.sessionId
        };

      default:
        return baseMessage;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private handleOpen(): void {
    console.log('WebSocket connected to Gemini');
    this.setConnectionStatus('connected');
    this.reconnectAttempts = 0;
    
    // Send queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Parse Gemini response format
      if (data.server_content && data.server_content.model_turn) {
        const modelTurn = data.server_content.model_turn;
        
        // Handle text response
        if (modelTurn.parts) {
          for (const part of modelTurn.parts) {
            if (part.text) {
              const response: GeminiResponse = {
                id: `${Date.now()}-${Math.random()}`,
                content: part.text,
                role: 'assistant',
                timestamp: Date.now(),
                confidence: data.confidence
              };
              this.onMessage(response);
            }
          }
        }
      }
      
      // Handle audio responses (if supported)
      if (data.audio_data) {
        // Handle audio response from Gemini
        console.log('Received audio response from Gemini');
      }
      
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.onError(new Error('Failed to parse message from AI'));
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);
    this.ws = null;
    
    if (this.connectionStatus !== 'disconnected') {
      this.setConnectionStatus('disconnected');
      this.attemptReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.setConnectionStatus('error');
    this.onError(new Error('WebSocket connection error'));
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.reconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.config.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.config.reconnectInterval);
  }

  private setConnectionStatus(status: WebSocketConnectionStatus): void {
    this.connectionStatus = status;
    this.onStatusChange(status);
  }

  public getConnectionStatus(): WebSocketConnectionStatus {
    return this.connectionStatus;
  }
}

export const createWebSocketManager = (bearerToken: string): WebSocketManager => {
  const config: WebSocketConfig = {
    url: 'wss://us-central1-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent',
    bearerToken,
    reconnectAttempts: 3,
    reconnectInterval: 2000
  };

  return new WebSocketManager(config);
};