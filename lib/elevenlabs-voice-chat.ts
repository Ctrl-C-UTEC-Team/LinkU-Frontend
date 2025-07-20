/**
 * ElevenLabs Real-time Voice Chat Implementation
 * Basado en la guía oficial paso a paso
 */

interface ElevenLabsVoiceChatOptions {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onUserTranscript?: (text: string) => void;
  onAgentResponse?: (text: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: string) => void;
}

export class ElevenLabsVoiceChat {
  private agentId: string;
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  // Callbacks
  private onConnected: () => void;
  private onDisconnected: () => void;
  private onUserTranscript: (text: string) => void;
  private onAgentResponse: (text: string) => void;
  private onError: (error: string) => void;
  private onStatusChange: (status: string) => void;

  constructor(agentId: string, options: ElevenLabsVoiceChatOptions = {}) {
    this.agentId = agentId;
    
    // Asignar callbacks con valores por defecto
    this.onConnected = options.onConnected || (() => {});
    this.onDisconnected = options.onDisconnected || (() => {});
    this.onUserTranscript = options.onUserTranscript || ((text) => console.log('Usuario:', text));
    this.onAgentResponse = options.onAgentResponse || ((text) => console.log('Agente:', text));
    this.onError = options.onError || ((error) => console.error('Error:', error));
    this.onStatusChange = options.onStatusChange || ((status) => console.log('Status:', status));
  }

  /**
   * PASO 2.2: Método para conectar
   */
  async connect(): Promise<void> {
    try {
      this.onStatusChange('Conectando...');
      
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (error) => this.handleError(error);
      this.ws.onclose = (event) => this.handleClose(event);
      
    } catch (error: any) {
      this.onError(`Error conectando: ${error.message}`);
    }
  }

  /**
   * PASO 3.1: Cuando se conecta
   */
  private handleOpen(): void {
    console.log('✅ Conectado a ElevenLabs');
    this.isConnected = true;
    this.onStatusChange('Conectado');
    this.onConnected();
    // NO envíes configuración si tu agente ya está configurado en dashboard
  }

  /**
   * PASO 3.2: Manejo de mensajes
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      switch(data.type) {
        case 'conversation_initiation_metadata':
          console.log('🎯 Conversación iniciada');
          this.onStatusChange('Conversación iniciada');
          this.startMicrophone(); // CRÍTICO: Iniciar micrófono aquí
          
          // IMPORTANTE: Enviar mensajes iniciales para activar al agente
          setTimeout(() => {
            this.sendInitialMessages();
          }, 1000); // Delay para asegurar que el micrófono esté listo
          break;
          
        case 'user_transcript':
          const userText = data.user_transcription_event.user_transcript;
          this.onUserTranscript(userText);
          break;
          
        case 'agent_response':
          const agentText = data.agent_response_event.agent_response;
          this.onAgentResponse(agentText);
          break;
          
        case 'audio':
          this.playAudio(data.audio_event.audio_base_64);
          break;
          
        case 'ping':
          // OBLIGATORIO: Responder ping
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              type: 'pong',
              event_id: data.event_id
            }));
          }
          break;
          
        default:
          console.log('Mensaje desconocido:', data.type);
      }
    } catch (error: any) {
      console.error('Error procesando mensaje:', error);
    }
  }

  /**
   * PASO 4.1: Iniciar captura de audio
   */
  private async startMicrophone(): Promise<void> {
    try {
      this.onStatusChange('Iniciando micrófono...');
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,    // OBLIGATORIO
          channelCount: 1,      // OBLIGATORIO
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      this.setupAudioProcessing();
      this.onStatusChange('Micrófono activo - Puedes hablar');
      
    } catch (error: any) {
      this.onError(`Error con micrófono: ${error.message}`);
    }
  }

  /**
   * PASO 4.2: Procesar audio
   */
  private setupAudioProcessing(): void {
    if (!this.stream) return;

    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    this.processor.onaudioprocess = (event) => {
      if (this.isConnected) {
        const audioData = event.inputBuffer.getChannelData(0);
        const base64Audio = this.convertToPCM16(audioData);
        this.sendAudio(base64Audio);
      }
    };
    
    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  /**
   * PASO 5.1: Convertir a formato correcto
   */
  private convertToPCM16(float32Array: Float32Array): string {
    // Convertir Float32 a PCM 16-bit
    const pcmData = new Int16Array(float32Array.length);
    
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      pcmData[i] = sample * 32767;
    }
    
    // Convertir a bytes y base64
    const uint8Array = new Uint8Array(pcmData.buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }

  /**
   * PASO 5.2: Enviar audio
   */
  private sendAudio(base64Audio: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        user_audio_chunk: base64Audio
      }));
    }
  }

  /**
   * Enviar mensajes iniciales para activar al agente
   */
  private sendInitialMessages(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Enviar varios chunks de silencio para asegurar activación
      const silenceChunk = this.generateSilenceChunk();
      
      // Enviar 3 chunks de silencio con intervalo
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              user_audio_chunk: silenceChunk
            }));
            console.log(`🚀 Chunk de silencio ${i + 1}/3 enviado`);
          }
        }, i * 200); // 200ms entre chunks
      }
      
             this.onStatusChange('Agente activado - Esperando saludo inicial');
       
       // Si no hay respuesta en 2 segundos, enviar más chunks de silencio
       setTimeout(() => {
         if (this.isConnected) {
           console.log('🤝 Enviando chunks adicionales para activar agente');
           const extraSilence = this.generateSilenceChunk();
           for (let i = 0; i < 5; i++) {
             setTimeout(() => {
               if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                 this.ws.send(JSON.stringify({
                   user_audio_chunk: extraSilence
                 }));
               }
             }, i * 100);
           }
         }
       }, 2000);
    }
  }

  /**
   * Generar un chunk de silencio en formato PCM 16-bit base64
   */
  private generateSilenceChunk(): string {
    // Crear 4096 samples de silencio (mismo tamaño que nuestros chunks normales)
    const silenceData = new Int16Array(4096);
    // Ya está lleno de ceros (silencio)
    
    // Convertir a bytes y base64
    const uint8Array = new Uint8Array(silenceData.buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }

  /**
   * Enviar mensaje de texto al agente
   */
  private sendTextMessage(text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'conversation_initiation_client_data',
        conversation_config_override: {
          agent: {
            prompt: {
              prompt: `Usuario dice: "${text}". Responde naturalmente como si fuera una conversación de voz.`
            }
          }
        }
      }));
      console.log(`💬 Mensaje de texto enviado: "${text}"`);
    }
  }

  /**
   * PASO 6.1: Reproducir respuesta
   */
  private async playAudio(base64Audio: string): Promise<void> {
    try {
      if (!this.audioContext) return;
      
      // Decodificar base64
      const binaryString = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(binaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
      
      // Reproducir
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
      
    } catch (error: any) {
      console.error(`Error reproduciendo audio: ${error.message}`);
      // No mostrar error al usuario para audio, es normal que algunos chunks fallen
    }
  }

  /**
   * Manejo de errores
   */
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.onError('Error de conexión WebSocket');
  }

  /**
   * Manejo de cierre de conexión
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket cerrado:', event.code, event.reason);
    this.isConnected = false;
    this.onStatusChange('Desconectado');
    this.onDisconnected();
  }

  /**
   * PASO 7.1: Desconectar
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.stopMicrophone();
    this.isConnected = false;
    this.onStatusChange('Desconectado');
    this.onDisconnected();
  }

  /**
   * Detener micrófono
   */
  private stopMicrophone(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Getters para estado
   */
  get connected(): boolean {
    return this.isConnected;
  }

  get hasStream(): boolean {
    return this.stream !== null;
  }

  /**
   * Método público para enviar mensaje de texto (para testing)
   */
  public sendTestMessage(text: string): void {
    this.sendTextMessage(text);
  }
} 