import React, { useRef, useState, useEffect } from 'react';
import styles from './MultiStepProgress.module.scss'; // Import as a CSS module

interface MultiStepProgressProps {
  status: number;
}

export const MultiStepProgress: React.FC<MultiStepProgressProps> = ({ status }) => {
  const [currentProgress, setCurrentProgress] = useState(status);
  const circle = useRef<HTMLDivElement>(null);
  const progressBar = useRef<HTMLSpanElement>(null);
  const progressArr = [1, 2, 3, 4, 5];

  useEffect(() => {
    if (circle.current && progressBar.current) {
      // Update the progress bar width
      progressBar.current.style.width = `${(status / 6) * 100}%`;

      // Update the active class for circles
      circle.current.childNodes.forEach((node: ChildNode, index: number) => {
        if (node instanceof HTMLElement) {
          if (index < status) {
            node.classList.add(styles.active); // Use styles.active for CSS modules
          } else {
            node.classList.remove(styles.active);
          }
        }
      });
    }
  }, [status]);

  return (
    <div className={styles.container}>
      <div className={styles.steps} ref={circle}>
        {progressArr.map((i) => (
          <span key={i} className={`${styles.circle} ${i <= currentProgress ? styles.active : ''}`}>
            {i}
          </span>
        ))}
        <div className={styles.progressBar}>
          <span ref={progressBar} className={styles.indicator}></span>
        </div>
      </div>
    </div>
  );
};
