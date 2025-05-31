import React, { forwardRef } from 'react';
import { Eye, EyeOff, DivideIcon as LucideIcon } from 'lucide-react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  fullWidth?: boolean;
  showPasswordToggle?: boolean;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, icon: Icon, fullWidth = true, className = '', type = 'text', showPasswordToggle = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`
              block rounded-md shadow-sm
              ${Icon ? 'pl-10' : 'pl-4'} 
              ${showPasswordToggle ? 'pr-10' : 'pr-4'}
              py-2 w-full
              border ${error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}
              focus:outline-none focus:ring-2 focus:ring-blue-500/50
              disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-all duration-200
              ${className}
            `}
            {...props}
          />
          {showPasswordToggle && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export default InputField;