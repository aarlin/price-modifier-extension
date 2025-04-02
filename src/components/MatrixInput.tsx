import { MatrixInputProps } from '@/types';

export function MatrixInput({ rates, onChange }: MatrixInputProps) {
  const handleRateChange = (index: number, value: string) => {
    const newRates = [...rates];
    newRates[index] = {
      ...newRates[index],
      rate: Number(value),
    };
    onChange(newRates);
  };

  const handleMinChange = (index: number, value: string) => {
    const newRates = [...rates];
    newRates[index] = {
      ...newRates[index],
      min: Number(value),
    };
    onChange(newRates);
  };

  const handleMaxChange = (index: number, value: string) => {
    const newRates = [...rates];
    newRates[index] = {
      ...newRates[index],
      max: value === '' ? null : Number(value),
    };
    onChange(newRates);
  };

  return (
    <div className="space-y-3">
      {/* Headers */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <div className="text-xs font-medium text-gray-900">Range</div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-900">Markup</div>
        </div>
      </div>

      {/* Inputs */}
      {rates.map((rate, index) => (
        <div key={`${rate.min}-${rate.max ?? 'inf'}`} className="grid grid-cols-3 gap-2 items-center">
          <input
            type="number"
            value={rate.min}
            onChange={(e) => handleMinChange(index, e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Min"
          />
          <input
            type="number"
            value={rate.max ?? ''}
            onChange={(e) => handleMaxChange(index, e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Max"
          />
          <input
            type="number"
            value={rate.rate}
            onChange={(e) => handleRateChange(index, e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Rate"
          />
        </div>
      ))}
    </div>
  );
}