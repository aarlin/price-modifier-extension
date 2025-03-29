import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Switch } from './components/Switch';
import { MatrixInput } from './components/MatrixInput';
import { NumberInput } from './components/NumberInput';
import { RadioGroup } from './components/RadioGroup';
import { Settings } from './types';

function Popup() {
  const [settings, setSettings] = useState<Settings>({
    enabled: false,
    markupType: 'flat',
    flatRate: 0,
    percentage: 0,
    showIndicator: true,
    matrixRates: {
      '0-10': 5,
      '11-20': 10,
      '21-30': 15,
      '31-40': 20,
      '41-50': 25,
      '51+': 30,
    },
  });
  const [showReloadButton, setShowReloadButton] = useState(false);
  const [lastSavedSettings, setLastSavedSettings] = useState<Settings | null>(null);

  useEffect(() => {
    chrome.storage.sync.get(['settings'], (result) => {
      if (result.settings) {
        setSettings(result.settings);
        setLastSavedSettings(result.settings);
      }
    });
  }, []);

  const handleSettingChange = async (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Save settings immediately
    await chrome.storage.sync.set({ settings: updatedSettings });
    
    // Show reload button if rates have changed
    if (lastSavedSettings && (
      newSettings.flatRate !== undefined && newSettings.flatRate !== lastSavedSettings.flatRate ||
      newSettings.percentage !== undefined && newSettings.percentage !== lastSavedSettings.percentage ||
      newSettings.markupType !== undefined && newSettings.markupType !== lastSavedSettings.markupType ||
      (newSettings.matrixRates && JSON.stringify(newSettings.matrixRates) !== JSON.stringify(lastSavedSettings.matrixRates))
    )) {
      setShowReloadButton(true);
    }
  };

  const handleSave = async () => {
    await chrome.storage.sync.set({ settings });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'SETTINGS_UPDATED',
          settings,
        });
      }
    });
    setLastSavedSettings(settings);
    setShowReloadButton(false);
  };

  return (
    <div className="w-[250px] h-[250px] p-6 bg-white overflow-y-auto">
      <fieldset className="mb-6 border border-gray-200 rounded-md p-4">
        <legend className="text-base font-medium text-gray-900">General Options</legend>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">Enable Price Markup</span>
          <Switch
            checked={settings.enabled}
            onChange={(checked) => handleSettingChange({ enabled: checked })}
          />
        </div>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">Show Price Indicator</span>
          <Switch
            checked={settings.showIndicator}
            onChange={(checked) => handleSettingChange({ showIndicator: checked })}
          />
        </div>
      </fieldset>

      {settings.enabled && (
        <>
          <fieldset className="mb-6 border border-gray-200 rounded-md p-4">
            <legend className="text-base font-medium text-gray-900 px-2">Markup Type</legend>
            <RadioGroup
              value={settings.markupType}
              onChange={(value) => handleSettingChange({ markupType: value as Settings['markupType'] })}
              options={[
                { label: 'Flat Rate', value: 'flat' },
                { label: 'Percentage', value: 'percentage' },
                { label: 'Matrix', value: 'matrix' },
              ]}
            />
          </fieldset>

          {settings.markupType === 'flat' && (
            <fieldset className="mb-6 border border-gray-200 rounded-md p-4">
              <legend className="text-base font-medium text-gray-900 px-2">Flat Rate ($)</legend>
              <NumberInput
                value={settings.flatRate}
                onChange={(value) => handleSettingChange({ flatRate: value })}
                min={0}
                step={0.01}
              />
            </fieldset>
          )}

          {settings.markupType === 'percentage' && (
            <fieldset className="mb-6 border border-gray-200 rounded-md p-4">
              <legend className="text-base font-medium text-gray-900 px-2">Percentage (%)</legend>
              <NumberInput
                value={settings.percentage}
                onChange={(value) => handleSettingChange({ percentage: value })}
                min={0}
                max={100}
                step={0.1}
              />
            </fieldset>
          )}

          {settings.markupType === 'matrix' && (
            <fieldset className="mb-6 border border-gray-200 rounded-md p-4">
              <legend className="text-base font-medium text-gray-900 px-2">Matrix Rates (%)</legend>
              <MatrixInput
                rates={settings.matrixRates}
                onChange={(rates) => handleSettingChange({ matrixRates: rates })}
              />
            </fieldset>
          )}

          {showReloadButton && (
            <button
              type="button"
              className="w-full py-2 px-4 bg-blue-600 text-white border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-blue-700 active:bg-blue-800"
              onClick={handleSave}
            >
              Apply Changes
            </button>
          )}
        </>
      )}
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} 