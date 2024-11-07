import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import { useEffect, useRef, useState } from 'react';

export const useVoice = () => {
  const {
    transcript: rawTranscript,
    listening,
    resetTranscript,
  } = useSpeechRecognition();
  const [transcript, setTranscript] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const silenceTimer = useRef<number | undefined>(undefined);

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      clearTimeout(silenceTimer.current);
      setIsFinal(true);
      setTranscript('');
      resetTranscript();
    } else {
      resetTranscript();
      setTranscript('');
      SpeechRecognition.startListening({ language: 'ko-KR', continuous: true });
      startSilenceTimer();
      setIsFinal(false);
    }
  };

  const startSilenceTimer = () => {
    clearTimeout(silenceTimer.current);
    silenceTimer.current = window.setTimeout(() => {
      SpeechRecognition.stopListening();
      setIsFinal(true);
      setTranscript('');
      resetTranscript();
      console.log('2초간 조용해서 음성 인식 끌거임');
    }, 2000);
  };

  useEffect(() => {
    if (!isFinal) {
      setTranscript(rawTranscript);
    }
  }, [rawTranscript, isFinal]);

  useEffect(() => {
    if (listening && rawTranscript) {
      startSilenceTimer();
    }
  }, [rawTranscript, listening]);

  return { transcript, listening, toggleListening, isFinal };
};
