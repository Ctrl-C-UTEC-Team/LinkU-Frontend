# LinkU - AI Interview Practice App

A modern Next.js 15 application for practicing job interviews with AI using **ElevenLabs Conversational AI** for natural conversation and **Gemini Vision API + face-api.js** for real-time emotion detection. Built with the latest React 19, Tailwind CSS 4.0, and advanced WebSocket integration.

## ✨ Features

### 🎯 **Core Functionality**
- **Real-time AI Interview**: Natural conversation with ElevenLabs AI using voice and video
- **Emotion Detection**: Real-time facial emotion analysis with Gemini Vision or face-api.js
- **Smart Configuration**: Customize interviews by job position, experience level, and duration
- **Live Transcription**: Real-time speech-to-text during interviews
- **Adaptive AI**: AI interviewer adapts based on detected stress levels and emotions
- **Comprehensive Feedback**: Detailed analysis including emotional state throughout interview
- **Professional UI**: Modern design with real-time emotion indicators

### 🚀 **Technical Stack**
- **Next.js 15** with App Router and Turbopack
- **React 19** with Server Components and Suspense
- **Tailwind CSS 4.0** with Lightning CSS engine
- **TypeScript 5.7** with strict configuration
- **Zustand 5.0** for state management
- **Framer Motion 11** for animations
- **Radix UI** for accessible components
- **WebSocket** integration for real-time AI communication

### 🎤 **AI & Media Features**
- **ElevenLabs Conversational AI** for natural interview conversation
- **Gemini Vision API** for advanced emotion detection (optional)
- **face-api.js** for local emotion detection (fallback)
- **WebRTC** video/audio capture with real-time processing
- **Audio Analysis** with voice activity detection
- **Real-time Emotion Feedback** sent to AI interviewer for adaptive responses
- **Permission Management** for camera/microphone access

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ (recommended: Node.js 20)
- npm, yarn, or pnpm
- Modern browser with WebRTC support

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd LinkU-Frontend
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Environment Configuration**
Copy the example environment file and configure your API keys:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your API keys:
```env
# REQUIRED: ElevenLabs Configuration
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here

# OPTIONAL: Gemini for advanced emotion detection
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# OPTIONAL: Custom voice selection
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

**How to get API keys:**
- **ElevenLabs**: Visit [ElevenLabs API Keys](https://elevenlabs.io/app/settings/api-keys)
- **ElevenLabs Agent**: Create an agent at [Conversational AI](https://elevenlabs.io/app/conversational-ai)
- **Gemini** (optional): Get key from [Google AI Studio](https://makersuite.google.com/app/apikey)

4. **Start the development server**
```bash
npm run dev
```

5. **Open the application**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
LinkU-Frontend/
├── app/                              # Next.js App Router
│   ├── interview/                   # Interview session page with emotion detection
│   ├── results/                     # Results and feedback page
│   ├── setup/                       # Interview configuration page
│   ├── layout.tsx                  # Root layout with theme provider
│   └── page.tsx                    # Home page
├── components/
│   ├── ui/                         # Reusable UI components (Radix UI + CVA)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   └── toast.tsx
│   └── theme-provider.tsx          # Dark/light theme provider
├── lib/
│   ├── services/
│   │   ├── elevenlabs-conversational.ts    # ElevenLabs conversation service
│   │   ├── emotion-detection-service.ts    # Gemini + face-api.js emotion detection
│   │   ├── integrated-interview-service.ts # Combined interview service
│   │   └── gemini-emotion-detector.ts      # Legacy Gemini service
│   ├── stores/
│   │   └── interview-store.ts      # Zustand store with emotion state
│   └── utils.ts                    # Utility functions
├── types/                          # TypeScript type definitions
│   ├── interview.ts               # Interview and emotion types
│   ├── media.ts
│   └── websocket.ts
├── public/
│   └── models/                     # face-api.js ML models
│       ├── face_expression_model-*
│       └── README.md              # Model setup instructions
└── .env.local.example             # Environment variables template
```

## 🎮 Usage Guide

### 1. Interview Setup
- Select job position (Frontend, Backend, Product Manager, etc.)
- Choose experience level (Junior, Mid, Senior)
- Set interview duration (15, 30, 45 minutes)
- Optional: Add target company and industry
- Grant camera and microphone permissions

### 2. Interview Session
- **Video Feed**: See yourself during the interview with emotion overlay
- **Voice Interaction**: Natural conversation with ElevenLabs AI interviewer
- **Live Transcription**: View real-time speech-to-text
- **Emotion Detection**: Real-time mood, stress level, and engagement tracking
- **Adaptive AI**: Interviewer responds to your emotional state
- **Connection Status**: Monitor ElevenLabs and Emotion AI connections
- **Controls**: Start/stop recording, pause/resume interview

### 3. Results Analysis
- **Overall Score**: Comprehensive performance rating
- **Competency Breakdown**: Detailed skill analysis including emotional intelligence
- **Emotion Summary**: Complete emotional journey throughout interview
- **Stress Analysis**: Stress level patterns and peak moments
- **Engagement Metrics**: Attention and enthusiasm tracking
- **Strengths & Improvements**: Specific feedback areas including emotional control
- **Interview Metrics**: Words per minute, filler word analysis
- **Export Options**: Download results including emotion data as JSON

## 🔧 API Integration

### ElevenLabs Conversational AI

The app uses ElevenLabs Conversational AI for natural interview conversations:

```typescript
// WebSocket connection to ElevenLabs
const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`

// Send audio chunk
{
  "user_audio_chunk": "base64_encoded_audio"
}

// Receive AI response
{
  "type": "agent_response",
  "agent_response_event": {
    "agent_response": "Tell me about your experience with React"
  }
}
```

### Emotion Detection Integration

**Gemini Vision API** (when available):
- Captures video frames for emotion analysis
- Sends contextual updates to ElevenLabs based on emotions
- Provides confidence scores and detailed emotion breakdown

**face-api.js** (fallback):
- Local emotion detection using ML models
- No external API calls required
- Real-time facial expression analysis

### Adaptive Interview Flow

The AI interviewer receives emotion context:
```typescript
// Example emotion update sent to ElevenLabs
{
  "type": "contextual_update",
  "text": "Candidate appears stressed (70%) and moderately engaged (60%). Adjust tone to be more encouraging."
}
```

## 🚀 Production Deployment

### Build Optimization

```bash
# Create production build
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Performance Features
- **Turbopack**: 5x faster builds than Webpack
- **React Compiler**: Automatic optimization
- **Bundle Splitting**: Route-based code splitting
- **Image Optimization**: Next.js automatic image optimization
- **Streaming SSR**: Progressive page loading

### Deployment Options

**Vercel** (Recommended):
```bash
npm install -g vercel
vercel --prod
```

**Docker**:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Create production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler
```

### Code Quality

- **ESLint 9**: Latest linting rules
- **TypeScript**: Strict mode enabled
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔒 Security Features

- **CSP Headers**: Content Security Policy protection
- **HTTPS Only**: Secure connections mandatory
- **Permission API**: Proper media access handling
- **Input Sanitization**: XSS protection
- **Rate Limiting**: API abuse prevention

## 📊 Monitoring

### Analytics Integration

The app supports integration with analytics services:

```typescript
// Track interview completion
analytics.track('interview_completed', {
  duration: sessionDuration,
  position: jobPosition,
  score: overallScore
})
```

### Error Tracking

Built-in error boundaries and logging:

```typescript
// Global error handling
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ using Next.js 15, React 19, and Gemini AI**