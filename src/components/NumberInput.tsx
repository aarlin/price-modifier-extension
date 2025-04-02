import { NumberInputProps } from '@/types';

export function NumberInput({ value, onChange, min, max, step }: NumberInputProps) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
    />
  );
} 