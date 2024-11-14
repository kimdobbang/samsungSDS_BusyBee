import React, { useRef, useState, useEffect } from 'react';
import styles from './MultiStepProgress.module.scss'; // Import as a CSS module

interface MultiStepProgressProps {
  status: number;
}

interface StatusData {
  status: number;
  name: string;
}

export const MultiStepProgress: React.FC<MultiStepProgressProps> = ({ status }) => {
  const [currentProgress, setCurrentProgress] = useState(status);
  const circle = useRef<HTMLDivElement>(null);
  const progressBar = useRef<HTMLSpanElement>(null);
  const progressArr: StatusData[] = [
    { status: 1, name: '견적 요청' },
    { status: 2, name: '견적 발급' },
    { status: 3, name: '주문' },
    { status: 4, name: '운송중' },
    { status: 5, name: '운송 완료' },
  ];
  useEffect(() => {
    if (circle.current && progressBar.current) {
      // Update the progress bar width
      progressBar.current.style.width = `${(status / 5) * 100}%`;

      // Update the active class for circles
      circle.current.childNodes.forEach((node: ChildNode, index: number) => {
        if (node instanceof HTMLElement) {
          if (index <= status) {
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
          <div className={styles.info}>
            <span
              key={i.status}
              className={`${styles.circle} ${i.status <= currentProgress ? styles.active : ''}`}
            >
              {i.status}
            </span>
          </div>
        ))}
        <div className={styles.progressBar}>
          <span ref={progressBar} className={styles.indicator}></span>
        </div>
      </div>
      <div className={styles.names}>
        {progressArr.map((i) => (
          <span>{i.name}</span>
        ))}
        <span>{''}</span>
      </div>
    </div>
  );
};
