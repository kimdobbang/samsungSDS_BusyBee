import { useEffect } from 'react';
import styles from './Voice.module.scss';
import { useVoice } from '../hooks/useVoice';
import { VoiceProps } from '../model/VoiceProps';
import { Mic, MicOff } from 'lucide-react';

export const Voice = ({ onTranscriptChange }: VoiceProps) => {
  const { transcript, listening, toggleListening, isFinal } = useVoice();

  useEffect(() => {
    // && onTranscriptChange
    if (transcript) {
      onTranscriptChange(transcript, isFinal);
    }
  }, [transcript, isFinal, onTranscriptChange]);

  return (
    <div>
      <button className={styles.img} onClick={toggleListening}>
        {listening ? <MicOff /> : <Mic />}
      </button>
    </div>
  );
};
