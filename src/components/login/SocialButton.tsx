import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface SocialButtonProps {
  icon: LucideIcon;
  label: string;
  provider: string;
  onClick?: () => void;
}

const SocialButton: React.FC<SocialButtonProps> = ({ icon: Icon, label, provider, onClick }) => {
  const getProviderStyles = () => {
    switch (provider.toLowerCase()) {
      case 'google':
        return 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50';
      case 'facebook':
        return 'border-blue-700 bg-blue-600 text-white hover:bg-blue-700';
      case 'twitter':
        return 'border-blue-400 bg-blue-400 text-white hover:bg-blue-500';
      case 'github':
        return 'border-gray-700 bg-gray-800 text-white hover:bg-gray-900';
      case 'apple':
        return 'border-gray-800 bg-black text-white hover:bg-gray-900';
      default:
        return 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50';
    }
  };

  return (
    <button
      type="button"
      className={`w-full flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${getProviderStyles()}`}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
};

export default SocialButton;