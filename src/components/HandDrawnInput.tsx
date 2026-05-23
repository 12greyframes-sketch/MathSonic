import React from 'react';
import { useWobblyRadius } from './wobbly';
import { soundEngine } from '../utils/soundEngine';

interface HandDrawnInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (val: string) => void;
  id: string; // strict HTML ID GUIDELINES
  className?: string;
  label?: string;
}

export const HandDrawnInput: React.FC<HandDrawnInputProps> = ({
  value,
  onChange,
  id,
  className = '',
  label,
  placeholder,
  ...props
}) => {
  const wobbleRadius = useWobblyRadius('button');

  const handleKeyPress = () => {
    // Light scratch on typing
    soundEngine.playScribble();
  };

  const handleFocus = () => {
    soundEngine.playPenClick();
  };

  return (
    <div id={`${id}-wrapper`} className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          id={`${id}-label`}
          htmlFor={id}
          className="text-pencil font-semibold font-heading text-lg self-start ml-2 relative"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={props.type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyPress}
        onFocus={handleFocus}
        placeholder={placeholder}
        style={{ borderRadius: wobbleRadius }}
        className="
          w-full px-5 py-3 
          border-[3px] border-pencil
          bg-white text-pencil
          font-sans text-xl md:text-2xl
          shadow-[3px_3px_0px_0px_rgba(45,45,45,1)]
          transition-all duration-100
          placeholder-pencil/40
          focus:outline-none focus:border-ballpoint focus:ring-4 focus:ring-ballpoint/10
          focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]
        "
        {...props}
      />
    </div>
  );
};
