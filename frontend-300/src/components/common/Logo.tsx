import React from 'react';
import { Pill } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'default',
  className = ''
}) => {
  const textColor = variant === 'white' ? 'text-white' : 'text-gray-900';
  const gradientFrom = variant === 'white' ? 'from-white/80' : 'from-red-500';
  const gradientTo = variant === 'white' ? 'to-white' : 'to-blue-600';
  
  const sizeClasses = {
    sm: {
      container: 'h-8',
      icon: 'w-5 h-5',
      text: 'text-lg'
    },
    md: {
      container: 'h-10',
      icon: 'w-6 h-6',
      text: 'text-xl'
    },
    lg: {
      container: 'h-14',
      icon: 'w-8 h-8',
      text: 'text-2xl'
    }
  };

  return (
    <div className={`flex items-center ${sizeClasses[size].container} ${className}`}>
      <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-lg p-2 mr-2 shadow-lg`}>
        <Pill className={`${sizeClasses[size].icon} text-white`} />
      </div>
      <div className="flex flex-col">
        <span className={`font-bold ${textColor} ${sizeClasses[size].text} leading-none`}>
          Mavoily
        </span>
        <span className={`text-xs ${variant === 'white' ? 'text-white/80' : 'text-gray-600'}`}>
          Pharma Delivery
        </span>
      </div>
    </div>
  );
};

export default Logo;