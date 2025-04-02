import { RadioGroupProps } from '@/types';

export function RadioGroup({ value, onChange, options }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-3">
          <input
            type="radio"
            id={`radio-${option.value}`}
            name="radio-group"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor={`radio-${option.value}`} className="text-sm text-gray-900">
            {option.label}
          </label>
        </div>
      ))}
    </div>
  );
} 