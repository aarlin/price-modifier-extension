import { MatrixInputProps } from '../types';

export function MatrixInput({ rates, onChange }: MatrixInputProps) {
  const handleRateChange = (range: string, value: string) => {
    onChange({
      ...rates,
      [range]: Number(value),
    });
  };

  return (
    <div className="space-y-2">
      {Object.entries(rates).map(([range, rate]) => (
        <div key={range} className="flex items-center space-x-3">
          <span className="text-base text-gray-900">{range}%:</span>
          <input
            type="number"
            value={rate}
            onChange={(e) => handleRateChange(range, e.target.value)}
            className="w-24 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
      ))}
    </div>
  );
} 