import React from 'react';

interface IconProps {
  className?: string;
}

const CogIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93s.844.149 1.268.038l.831-.39c.5-.234 1.09-.023 1.348.44l.694 1.2c.258.462.078.999-.393 1.268l-.76.425c-.36.202-.628.53-.705.91s-.056.79.068 1.15l.408.99c.18.44.028.95-.33 1.208l-1.116.802c-.33.234-.78.234-1.11 0l-1.116-.802c-.358-.258-.51-.768-.33-1.208l.408-.99c.124-.36.145-.77.068-1.15s-.345-.708-.705-.91l-.76-.425c-.47-.268-.65-.805-.393-1.268l.694-1.2c.258-.463.848-.674 1.348-.44l.831.39c.424.11.88.092 1.268-.038.396-.166.71-.506.78-.93L13.657 3.94zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
  </svg>
);

export default CogIcon;
