import React, { useRef, useState, useEffect } from 'react';
import styles from './MultiStepProgress.module.scss';

interface MultiStepProgressProps {
  status: number;
}

interface StatusData {
  status: number;
  name: string;
}

export const MultiStepProgress: React.FC<MultiStepProgressProps> = ({ status }) => {
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
      // 너비 계산: status가 5일 때는 4/5 (80%)로 설정
      const adjustedWidth = status === 5 ? (4 / 5) * 100 : (status / 5) * 100;
      progressBar.current.style.width = `${adjustedWidth}%`;

      // 각 원(circle)에 active 클래스 추가
      circle.current.childNodes.forEach((node: ChildNode, index: number) => {
        if (node instanceof HTMLElement) {
          if (index < status) {
            node.classList.add(styles.active);
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
        {progressArr.map((i, index) => (
          <div className={styles.info} key={index}>
            <span
              key={`${i.status}-${index}`}
              className={`${styles.circle} ${i.status <= status ? styles.active : ''}`}
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
        {progressArr.map((i, index) => (
          <span key={`${i.status}-${index}`}>{i.name}</span>
        ))}
        <span>{''}</span>
      </div>
    </div>
  );
};
