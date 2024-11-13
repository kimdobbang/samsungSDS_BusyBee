import React, { useState } from 'react';
import styles from './Tooltip.module.scss';
import { TooltipProps } from '../model/Tooltip';

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  position,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);

  const handleFocus = () => setIsVisible(true);
  const handleBlur = () => setIsVisible(false);

  return (
    <div
      className={styles.tooltipWrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      {isVisible && (
        <div className={`${styles.tooltip} ${styles[position]}`}>
          <span>{text}</span>
        </div>
      )}
    </div>
  );
};
