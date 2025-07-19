'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, Mic, AlertCircle, CheckCircle, Play } from 'lucide-react';
import { InterviewConfig, JobPosition, ExperienceLevel, InterviewDuration, MediaPermissions } from '@/types';

const jobPositions: JobPosition[] = ['Frontend', 'Backend', 'Product Manager', 'Data Scientist', 'DevOps', 'QA Engineer', 'UI/UX Designer', 'Full Stack'];
const experienceLevels: ExperienceLevel[] = ['Junior', 'Mid', 'Senior'];
const durations: InterviewDuration[] = [15, 30, 45];

export default function SetupPage() {
  const router = useRouter();
  const [config, setConfig] = useState<InterviewConfig>({
    position: 'Frontend',
    level: 'Mid',
    duration: 30,
    targetCompany: '',
    industry: ''
  });
  
  const [permissions, setPermissions] = useState<MediaPermissions>({
    camera: 'checking',
    microphone: 'checking'
  });
  
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  useEffect(() => {
    checkMediaPermissions();
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkMediaPermissions = async () => {
    try {
      // Check camera permission
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      setPermissions({
        camera: cameraPermission.state,
        microphone: micPermission.state
      });

      // Try to get user media to test actual access
      if (cameraPermission.state === 'granted' && micPermission.state === 'granted') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240 },
            audio: true
          });
          setPreviewStream(stream);
        } catch (error) {
          console.error('Error accessing media devices:', error);
        }
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissions({
        camera: 'denied',
        microphone: 'denied'
      });
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const requestPermissions = async () => {
    try {
      setIsCheckingPermissions(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      setPreviewStream(stream);
      setPermissions({
        camera: 'granted',
        microphone: 'granted'
      });
    } catch (error: any) {
      console.error('Permission request failed:', error);
      if (error.name === 'NotAllowedError') {
        setPermissions({
          camera: 'denied',
          microphone: 'denied'
        });
      }
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const handleStartInterview = () => {
    if (permissions.camera !== 'granted' || permissions.microphone !== 'granted') {
      alert('Camera and microphone permissions are required to start the interview.');
      return;
    }
    
    // Store config in sessionStorage for the interview page
    sessionStorage.setItem('interviewConfig', JSON.stringify(config));
    router.push('/interview');
  };

  const canStartInterview = permissions.camera === 'granted' && permissions.microphone === 'granted';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Interview Setup</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl">
          {/* Configuration Form */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-6">Configure Your Interview</h2>
              
              {/* Job Position */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Job Position</label>
                <div className="grid grid-cols-2 gap-3">
                  {jobPositions.map((position) => (
                    <button
                      key={position}
                      onClick={() => setConfig(prev => ({ ...prev, position }))}
                      className={`p-3 rounded-lg border transition-colors ${
                        config.position === position
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {position}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Experience Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {experienceLevels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setConfig(prev => ({ ...prev, level }))}
                      className={`p-3 rounded-lg border transition-colors ${
                        config.level === level
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Interview Duration</label>
                <div className="grid grid-cols-3 gap-3">
                  {durations.map((duration) => (
                    <button
                      key={duration}
                      onClick={() => setConfig(prev => ({ ...prev, duration }))}
                      className={`p-3 rounded-lg border transition-colors ${
                        config.duration === duration
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {duration} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-2">
                    Target Company (Optional)
                  </label>
                  <input
                    id="company"
                    type="text"
                    value={config.targetCompany}
                    onChange={(e) => setConfig(prev => ({ ...prev, targetCompany: e.target.value }))}
                    placeholder="e.g., Google, Microsoft, Startup"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium mb-2">
                    Industry (Optional)
                  </label>
                  <input
                    id="industry"
                    type="text"
                    value={config.industry}
                    onChange={(e) => setConfig(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g., FinTech, E-commerce, Healthcare"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Permissions & Preview */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-6">Camera & Microphone Setup</h2>
              
              {/* Permissions Status */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
                  <Camera className="w-5 h-5" />
                  <span className="flex-1">Camera</span>
                  {permissions.camera === 'granted' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : permissions.camera === 'denied' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
                  <Mic className="w-5 h-5" />
                  <span className="flex-1">Microphone</span>
                  {permissions.microphone === 'granted' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : permissions.microphone === 'denied' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>

              {/* Video Preview */}
              <div className="video-container aspect-video bg-black rounded-lg mb-6 relative overflow-hidden">
                {previewStream ? (
                  <video
                    autoPlay
                    muted
                    playsInline
                    ref={(video) => {
                      if (video && previewStream) {
                        video.srcObject = previewStream;
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400">Camera preview will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Permission Actions */}
              {(permissions.camera !== 'granted' || permissions.microphone !== 'granted') && (
                <button
                  onClick={requestPermissions}
                  disabled={isCheckingPermissions}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isCheckingPermissions ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Checking Permissions...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Allow Camera & Microphone
                    </>
                  )}
                </button>
              )}

              {/* Start Interview Button */}
              <div className="mt-8">
                <button
                  onClick={handleStartInterview}
                  disabled={!canStartInterview}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-3 text-lg"
                >
                  <Play className="w-5 h-5" />
                  Start Interview
                </button>
                
                {!canStartInterview && (
                  <p className="text-sm text-gray-400 mt-2 text-center">
                    Please allow camera and microphone access to continue
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}