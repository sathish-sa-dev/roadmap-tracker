import React from 'react';

interface IconProps {
  className?: string;
}

const SparklesIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 7.5l1.406-1.406a1.875 1.875 0 00-2.652-2.652L15.594 5.09c-.888-.07-1.794-.07-2.682 0L11.506 3.684a1.875 1.875 0 00-2.652 2.652L10.26 7.742c.04.43.065.865.077 1.304M12 21a8.963 8.963 0 01-4.18-1.035m4.18 1.035A8.963 8.963 0 0016.18 20M12 3.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75z" />
 </svg>
);
export default SparklesIcon;