import phonemeAnalyzer from '../ai/phonemeAnalyzer';
import speechRecognition from '../ai/speechRecognition';

const API_BASE_URL = 'https://neuro-ai-3ipn.onrender.com/api';

// Hardcoded words for each letter with phonetics
const LETTER_WORDS = {
  A: { word: 'Apple', pronunciation: '/ˈæp.əl/', emoji: '🍎' },
  B: { word: 'Ball', pronunciation: '/bɔːl/', emoji: '⚽' },
  C: { word: 'Cat', pronunciation: '/kæt/', emoji: '🐱' },
  D: { word: 'Dog', pronunciation: '/dɔːɡ/', emoji: '🐕' },
  E: { word: 'Elephant', pronunciation: '/ˈel.ɪ.fənt/', emoji: '🐘' },
  F: { word: 'Fish', pronunciation: '/fɪʃ/', emoji: '🐠' },
  G: { word: 'Goat', pronunciation: '/ɡoʊt/', emoji: '🐐' },
  H: { word: 'Hat', pronunciation: '/hæt/', emoji: '🎩' },
  I: { word: 'Ice', pronunciation: '/aɪs/', emoji: '🧊' },
  J: { word: 'Juice', pronunciation: '/dʒuːs/', emoji: '🧃' },
  K: { word: 'Kite', pronunciation: '/kaɪt/', emoji: '🪁' },
  L: { word: 'Lion', pronunciation: '/ˈlaɪ.ən/', emoji: '🦁' },
  M: { word: 'Moon', pronunciation: '/muːn/', emoji: '🌙' },
  N: { word: 'Nose', pronunciation: '/noʊz/', emoji: '👃' },
  O: { word: 'Orange', pronunciation: '/ˈɔː.rɪndʒ/', emoji: '🍊' },
  P: { word: 'Pen', pronunciation: '/pen/', emoji: '🖊️' },
  Q: { word: 'Queen', pronunciation: '/kwiːn/', emoji: '👑' },
  R: { word: 'Rabbit', pronunciation: '/ˈræb.ɪt/', emoji: '🐰' },
  S: { word: 'Sun', pronunciation: '/sʌn/', emoji: '☀️' },
  T: { word: 'Tree', pronunciation: '/triː/', emoji: '🌳' },
  U: { word: 'Umbrella', pronunciation: '/ʌmˈbrel.ə/', emoji: '☂️' },
  V: { word: 'Van', pronunciation: '/væn/', emoji: '🚐' },
  W: { word: 'Water', pronunciation: '/ˈwɔː.tər/', emoji: '💧' },
  X: { word: 'Xylophone', pronunciation: '/ˈzaɪ.lə.foʊn/', emoji: '🎹' },
  Y: { word: 'Yellow', pronunciation: '/ˈjel.oʊ/', emoji: '💛' },
  Z: { word: 'Zebra', pronunciation: '/ˈziː.brə/', emoji: '🦓' },
};

// Generate word - now uses hardcoded data
export const generateWord = async (letter) => {
  console.log(`Getting hardcoded word for letter: ${letter}`);
  
  const letterData = LETTER_WORDS[letter.toUpperCase()];
  
  if (!letterData) {
    console.warn(`No word found for letter ${letter}, using Apple`);
    return {
      word1: 'Apple',
      pronunciation: '/ˈæp.əl/',
      image_link: '🍎'
    };
  }

  return {
    word1: letterData.word,
    pronunciation: letterData.pronunciation,
    image_link: letterData.emoji
  };
};

// Test word - same as generateWord
export const testWord = async (letter) => {
  return generateWord(letter);
};

// Record audio and analyze with AI
export const recordAudio = async (expectedWord, targetPhonemes = []) => {
  try {
    console.log('Starting recording for word:', expectedWord);
    
    if (!expectedWord) {
      throw new Error('Expected word is required');
    }

    let transcription = '';
    let transcriptionFailed = false;

    try {
      // Start recording
      await speechRecognition.startRecording();
      
      // Wait for 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Stop and transcribe
      transcription = await speechRecognition.stopRecordingAndTranscribe();
      console.log('Transcription successful:', transcription);
    } catch (error) {
      console.error('Transcription failed, using fallback:', error);
      transcriptionFailed = true;
      // Use a fallback transcription for testing
      transcription = expectedWord.toLowerCase();
    }

    // Always analyze with AI, even if transcription failed
    const analysisResult = await phonemeAnalyzer.analyzePhonemes(
      transcription,
      expectedWord,
      targetPhonemes
    );

    console.log('Analysis result:', analysisResult);

    // If transcription failed, add note to feedback
    if (transcriptionFailed) {
      analysisResult.feedback = `[Note: Audio transcription unavailable] ${analysisResult.feedback}`;
    }

    return {
      transcription: analysisResult.transcription,
      percentage: analysisResult.accuracy,
      feedback: analysisResult.feedback,
      timestamp: analysisResult.timestamp,
    };
  } catch (error) {
    console.error('Error in recordAudio:', error);
    
    // Return a fallback result so the app doesn't crash
    return {
      transcription: expectedWord.toLowerCase(),
      percentage: 50,
      feedback: `Could not analyze recording. Try saying "${expectedWord}" clearly and slowly.`,
      timestamp: new Date().toISOString(),
    };
  }
};

// Get AI remedy
export const getRemedy = async (percentage, phoneme1, phoneme2, attempts = []) => {
  try {
    console.log('Getting AI remedy for:', { percentage, phoneme1, phoneme2 });

    const prompt = `You are a speech therapist. A child scored ${percentage}% accuracy on phonemes ${phoneme1} and ${phoneme2}.

Provide:
1. Brief assessment (20 words max)
2. 3 specific practice tips
3. Encouragement

Keep response under 80 words, child-friendly language.`;

    const { RunAnywhere } = await import('@runanywhere/core');
    const result = await RunAnywhere.generate(prompt, {
      maxTokens: 150,
      temperature: 0.7,
    });

    return {
      remedy: result.text,
      percentage,
      phonemes: [phoneme1, phoneme2],
    };
  } catch (error) {
    console.error('Error getting remedy:', error);
    
    // Fallback remedy
    let remedy = '';
    if (percentage >= 80) {
      remedy = `Excellent work on ${phoneme1} and ${phoneme2}! You're doing great. Keep practicing daily for 5 minutes to maintain your skills.`;
    } else if (percentage >= 60) {
      remedy = `Good progress on ${phoneme1} and ${phoneme2}! Practice these sounds slowly, focusing on mouth positioning. Try 10 repetitions daily.`;
    } else {
      remedy = `Let's work on ${phoneme1} and ${phoneme2} together. Break the sounds into smaller parts. Watch your mouth in a mirror while practicing. Be patient with yourself!`;
    }

    return { remedy, percentage, phonemes: [phoneme1, phoneme2] };
  }
};
