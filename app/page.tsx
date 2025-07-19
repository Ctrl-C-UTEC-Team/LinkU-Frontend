import Link from "next/link";
import { Play, Brain, Users, TrendingUp } from "lucide-react";

const jobPositions = [
  "Frontend Developer",
  "Backend Developer", 
  "Product Manager",
  "Data Scientist",
  "DevOps Engineer",
  "UI/UX Designer"
];

const features = [
  {
    icon: Brain,
    title: "AI-Powered Interviews",
    description: "Practice with Gemini AI that adapts to your experience level and target role"
  },
  {
    icon: Users,
    title: "Real-time Feedback",
    description: "Get instant analysis of your responses, communication skills, and technical knowledge"
  },
  {
    icon: TrendingUp,
    title: "Performance Tracking",
    description: "Track your improvement over time with detailed analytics and scoring"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen interview-gradient">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            LinkU
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Master Your Next Interview with AI
          </p>
          <p className="text-gray-400 mb-12 text-lg max-w-2xl mx-auto">
            Practice job interviews with our advanced AI interviewer. Get real-time feedback, 
            improve your skills, and land your dream job with confidence.
          </p>
          
          <Link 
            href="/setup"
            className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Play className="w-5 h-5" />
            Start Interview Practice
          </Link>
        </div>

        {/* Job Positions Preview */}
        <div className="mt-20">
          <p className="text-center text-gray-400 mb-8">Practice interviews for various positions:</p>
          <div className="flex flex-wrap justify-center gap-4">
            {jobPositions.map((position) => (
              <span 
                key={position}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300"
              >
                {position}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-800/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Why Choose LinkU?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How It Works
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">Configure</h3>
                <p className="text-gray-400">Choose your target position, experience level, and interview duration</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">Interview</h3>
                <p className="text-gray-400">Engage in real-time conversation with our AI interviewer via video and audio</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">Improve</h3>
                <p className="text-gray-400">Review detailed feedback and recommendations to enhance your performance</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/setup"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}