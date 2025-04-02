import React from 'react';
import { MatrixInputProps } from '@/types';

export function MatrixInput({ rates, onChange }: MatrixInputProps) {
  const handleRateChange = (range: string, value: string) => {
    onChange({
      ...rates,
      [range]: Number(value),
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(rates).map(([range, rate]) => (
        <React.Fragment key={range}>
          <span className="text-sm text-gray-900">{range}:</span>
          <input
            type="number"
            value={rate}
            onChange={(e) => handleRateChange(range, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </React.Fragment>
      ))}
    </div>
  );
}