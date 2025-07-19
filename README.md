# LinkU - AI Interview Practice App

A modern Next.js 15 application for practicing job interviews with AI using Gemini. Built with the latest React 19, Tailwind CSS 4.0, and advanced WebSocket integration for real-time conversational interviews.

## ✨ Features

### 🎯 **Core Functionality**
- **Real-time AI Interview**: Practice with Gemini AI using voice and video
- **Smart Configuration**: Customize interviews by job position, experience level, and duration
- **Live Transcription**: Real-time speech-to-text during interviews
- **Comprehensive Feedback**: Detailed analysis with scoring and improvement suggestions
- **Professional UI**: Modern design with dark theme and smooth animations

### 🚀 **Technical Stack**
- **Next.js 15** with App Router and Turbopack
- **React 19** with Server Components and Suspense
- **Tailwind CSS 4.0** with Lightning CSS engine
- **TypeScript 5.7** with strict configuration
- **Zustand 5.0** for state management
- **Framer Motion 11** for animations
- **Radix UI** for accessible components
- **WebSocket** integration for real-time AI communication

### 🎤 **Media Features**
- **WebRTC** video/audio capture
- **Audio Analysis** with real-time level detection
- **MediaRecorder** for audio streaming
- **Permission Management** for camera/microphone access
- **Audio Chunking** for continuous streaming to AI

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
Create a `.env.local` file in the root directory:
```env
# Gemini AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_WEBSOCKET_URL=wss://your-gemini-websocket-endpoint

# Optional: Development settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open the application**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
LinkU-Frontend/
├── app/                          # Next.js App Router
│   ├── interview/               # Interview session page
│   ├── results/                 # Results and feedback page
│   ├── setup/                   # Interview configuration page
│   ├── layout.tsx              # Root layout with theme provider
│   └── page.tsx                # Home page
├── components/
│   ├── ui/                     # Reusable UI components (Radix UI + CVA)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   └── toast.tsx
│   └── theme-provider.tsx      # Dark/light theme provider
├── lib/
│   ├── services/
│   │   └── gemini-websocket.ts # Gemini AI WebSocket service
│   ├── stores/
│   │   └── interview-store.ts  # Zustand global state management
│   └── utils.ts                # Utility functions
├── types/                      # TypeScript type definitions
│   ├── interview.ts
│   ├── media.ts
│   └── websocket.ts
└── public/                     # Static assets
```

## 🎮 Usage Guide

### 1. Interview Setup
- Select job position (Frontend, Backend, Product Manager, etc.)
- Choose experience level (Junior, Mid, Senior)
- Set interview duration (15, 30, 45 minutes)
- Optional: Add target company and industry
- Grant camera and microphone permissions

### 2. Interview Session
- **Video Feed**: See yourself during the interview
- **Voice Interaction**: Speak naturally with AI interviewer
- **Live Transcription**: View real-time speech-to-text
- **AI Status**: Monitor AI listening/processing states
- **Controls**: Start/stop recording, pause/resume interview

### 3. Results Analysis
- **Overall Score**: Comprehensive performance rating
- **Competency Breakdown**: Detailed skill analysis
- **Strengths & Improvements**: Specific feedback areas
- **Interview Metrics**: Words per minute, filler word analysis
- **Export Options**: Download results as JSON

## 🔧 API Integration

### Gemini WebSocket Configuration

The app connects to Gemini AI through WebSocket for real-time conversation:

```typescript
// Example WebSocket message structure
{
  "type": "audio_chunk",
  "audio_data": "base64_encoded_audio",
  "timestamp": 1672531200000
}

// AI Response
{
  "type": "interview_question",
  "content": "Tell me about your experience with React",
  "timestamp": 1672531201000
}
```

### Mock Development Mode

For development without Gemini API access, the app includes a mock WebSocket service that simulates AI responses.

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