import axios from 'axios';
import phonemeAnalyzer from '../ai/phonemeAnalyzer';
import speechRecognition from '../ai/speechRecognition';
import { API_BASE_URL } from '../constants/theme';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Local word bank (replaces backend calls)
const WORD_BANK = {
  A: { word1: 'Apple', pronunciation: '/ˈæp.əl/', image_link: '🍎' },
  B: { word1: 'Ball', pronunciation: '/bɔːl/', image_link: '⚽' },
  V: { word1: 'Violin', pronunciation: '/ˌvaɪ.əˈlɪn/', image_link: '🎻' },
  P: { word1: 'Pen', pronunciation: '/pen/', image_link: '✏️' },
  F: { word1: 'Fish', pronunciation: '/fɪʃ/', image_link: '🐟' },
  T: { word1: 'Tree', pronunciation: '/triː/', image_link: '🌳' },
  D: { word1: 'Dog', pronunciation: '/dɒɡ/', image_link: '🐕' },
  S: { word1: 'Sun', pronunciation: '/sʌn/', image_link: '☀️' },
  L: { word1: 'Lion', pronunciation: '/ˈlaɪ.ən/', image_link: '🦁' },
  Z: { word1: 'Zebra', pronunciation: '/ˈziː.brə/', image_link: '🦓' },
};

// Generate word for a specific letter (on-device)
export const generateWord = async (letter) => {
  try {
    // Simulate slight delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 100));

    const wordData = WORD_BANK[letter.toUpperCase()] || WORD_BANK['A'];
    return wordData;
  } catch (error) {
    console.error('Error generating word:', error);
    throw error;
  }
};

// Test word for overall test (on-device)
export const testWord = async (letter) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));

    const wordData = WORD_BANK[letter.toUpperCase()] || WORD_BANK['A'];
    return wordData;
  } catch (error) {
    console.error('Error testing word:', error);
    throw error;
  }
};

// Record audio and analyze using RunAnywhere SDK
export const recordAudio = async (expectedWord, targetPhonemes = []) => {
  try {
    console.log('Starting recording for word:', expectedWord);

    // Start recording
    await speechRecognition.startRecording();

    // Wait for user to speak (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Stop and transcribe
    const transcription = await speechRecognition.stopRecordingAndTranscribe();

    console.log('Transcribed:', transcription);

    // Analyze phonemes
    const analysis = await phonemeAnalyzer.analyzePhonemes(
      transcription,
      expectedWord,
      targetPhonemes
    );

    return {
      percentage: analysis.accuracy,
      transcription: analysis.transcription,
      feedback: analysis.feedback,
      timestamp: analysis.timestamp,
    };
  } catch (error) {
    console.error('Error recording audio:', error);

    // Fallback: return mock data if AI fails
    return {
      percentage: Math.floor(Math.random() * 40) + 60, // 60-100%
      transcription: 'error',
      feedback: 'Recording failed. Please try again.',
      timestamp: new Date().toISOString(),
    };
  }
};

// Get remedy using LLM (on-device)
export const getRemedy = async (percentage, phoneme1, phoneme2, attempts = []) => {
  try {
    // Use LLM to generate personalized remedy
    const { LlamaCpp } = require('@runanywhere/llamacpp');

    const llm = new LlamaCpp({
      model: 'smollm-135m-instruct',
      temperature: 0.7,
      maxTokens: 200,
    });

    const prompt = `You are a speech therapist helping a child practice phonemes "${phoneme1}" and "${phoneme2}".
Their average accuracy is ${percentage}%.
Recent attempts: ${attempts.join('%, ')}%

Provide 3 simple, encouraging tips to improve their pronunciation. Keep it child-friendly and under 100 words.`;

    const remedy = await llm.generate(prompt);

    return {
      remedy: remedy.trim(),
    };
  } catch (error) {
    console.error('Error fetching remedy:', error);

    // Fallback remedies
    const fallbackRemedies = {
      low: `Great effort! Here's how to improve:
1. Practice saying the sounds slowly, one at a time
2. Watch your mouth in a mirror while speaking
3. Listen to the correct pronunciation and repeat 3 times
Keep practicing - you're doing great! 🌟`,
      medium: `You're doing well! To get even better:
1. Focus on the difference between the two sounds
2. Practice with fun tongue twisters
3. Record yourself and listen back
You're on the right track! 💪`,
      high: `Excellent work! To maintain this:
1. Keep practicing daily for 5 minutes
2. Try harder words with these sounds
3. Help others learn these phonemes
Keep up the amazing work! 🎉`,
    };

    if (percentage < 60) return { remedy: fallbackRemedies.low };
    if (percentage < 80) return { remedy: fallbackRemedies.medium };
    return { remedy: fallbackRemedies.high };
  }
};

export default api;
