/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CameraHandle } from './components/Camera';
import { readText, describeScene } from './lib/ai';
import { speaker } from './lib/speaker';
import { VoiceController } from './lib/voice';
import { Eye, BookOpen, Mic, Square, AlertTriangle, PhoneCall } from 'lucide-react';

export default function App() {
  const cameraRef = useRef<CameraHandle>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Ready. Tap a button or say "Read this" or "Describe scene".');
  const [isListening, setIsListening] = useState(false);
  const voiceControllerRef = useRef<VoiceController | null>(null);

  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleCommand = useCallback(async (command: string) => {
    if (command.includes('read') || command.includes('text')) {
      handleReadText();
    } else if (command.includes('describe') || command.includes('what is') || command.includes('scene')) {
      handleDescribeScene();
    } else if (command.includes('stop')) {
      handleStop();
    } else {
      setStatus(`Unrecognized command: "${command}". Try "Read this" or "Describe scene".`);
      speaker.speak("Unrecognized command. Try Read this or Describe scene.");
    }
  }, []);

  useEffect(() => {
    voiceControllerRef.current = new VoiceController(handleCommand);
    speaker.speak("Vision Assistant ready. Tap the screen or use voice commands.");
    return () => {
      speaker.stop();
      voiceControllerRef.current?.stop();
    };
  }, [handleCommand]);

  const processImage = async (action: 'read' | 'describe') => {
    if (isProcessing) return;
    vibrate();
    speaker.stop();
    setIsProcessing(true);
    setStatus(action === 'read' ? 'Reading text...' : 'Describing scene...');
    speaker.speak(action === 'read' ? 'Reading...' : 'Analyzing...');

    try {
      const base64Image = cameraRef.current?.captureFrame();
      if (!base64Image) {
        throw new Error("Could not capture image from camera.");
      }

      let result = '';
      if (action === 'read') {
        result = await readText(base64Image);
      } else {
        result = await describeScene(base64Image);
      }

      if (result) {
        setStatus(result);
        speaker.speak(result, () => {
          setStatus('Ready.');
        });
      } else {
        setStatus('No result found.');
        speaker.speak('I could not find anything to report.');
      }
    } catch (error) {
      console.error(error);
      setStatus('Error processing image.');
      speaker.speak('Sorry, there was an error processing the image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReadText = () => processImage('read');
  const handleDescribeScene = () => processImage('describe');

  const handleStop = () => {
    vibrate();
    speaker.stop();
    setStatus('Stopped. Ready.');
  };

  const toggleListening = () => {
    vibrate();
    if (isListening) {
      voiceControllerRef.current?.stop();
      setIsListening(false);
      setStatus('Voice control stopped.');
      speaker.speak('Voice control stopped.');
    } else {
      voiceControllerRef.current?.start();
      setIsListening(true);
      setStatus('Listening for commands...');
      speaker.speak('Listening.');
    }
  };

  const handleEmergency = () => {
    vibrate();
    speaker.stop();
    setStatus('Calling emergency contact...');
    speaker.speak('Calling emergency contact.');
    // In a real app, this would trigger a phone call intent
    // window.location.href = 'tel:911';
    setTimeout(() => {
      setStatus('Ready.');
    }, 3000);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      {/* Camera View Area */}
      <div className="relative flex-1 bg-gray-900">
        <Camera ref={cameraRef} />

        {/* Status Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <p className="text-2xl font-bold leading-tight drop-shadow-lg" aria-live="polite">
            {status}
          </p>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Controls Area - High Contrast, Large Buttons */}
      <div className="grid grid-cols-2 gap-2 p-2 bg-black h-2/5 min-h-[300px]">
        <button
          onClick={handleReadText}
          disabled={isProcessing}
          className="flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-2xl p-4 transition-colors disabled:opacity-50"
          aria-label="Read Text"
        >
          <BookOpen size={48} className="mb-4" />
          <span className="text-2xl font-bold">Read Text</span>
        </button>

        <button
          onClick={handleDescribeScene}
          disabled={isProcessing}
          className="flex flex-col items-center justify-center bg-green-600 hover:bg-green-500 active:bg-green-700 rounded-2xl p-4 transition-colors disabled:opacity-50"
          aria-label="Describe Scene"
        >
          <Eye size={48} className="mb-4" />
          <span className="text-2xl font-bold">Describe</span>
        </button>

        <button
          onClick={toggleListening}
          className={`flex flex-col items-center justify-center rounded-2xl p-4 transition-colors ${
            isListening ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600 hover:bg-purple-500'
          }`}
          aria-label={isListening ? "Stop Listening" : "Start Voice Control"}
        >
          <Mic size={48} className={`mb-4 ${isListening ? 'animate-pulse' : ''}`} />
          <span className="text-2xl font-bold">{isListening ? 'Listening...' : 'Voice Cmd'}</span>
        </button>

        <button
          onClick={handleStop}
          className="flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 active:bg-gray-800 rounded-2xl p-4 transition-colors"
          aria-label="Stop Speaking"
        >
          <Square size={48} className="mb-4" />
          <span className="text-2xl font-bold">Stop</span>
        </button>

        {/* Emergency Button - Spans full width at bottom */}
        <button
          onClick={handleEmergency}
          className="col-span-2 flex items-center justify-center gap-4 bg-red-700 hover:bg-red-600 active:bg-red-800 rounded-2xl p-4 transition-colors border-4 border-red-500"
          aria-label="Emergency Call"
        >
          <AlertTriangle size={40} />
          <span className="text-3xl font-black uppercase tracking-wider">Emergency</span>
          <PhoneCall size={40} />
        </button>
      </div>
    </div>
  );
}
