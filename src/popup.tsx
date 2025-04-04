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
    matrixRates: [
      { min: 0, max: 50, rate: 5 },
      { min: 50.01, max: 100, rate: 10 },
      { min: 100.01, max: 250, rate: 15 },
      { min: 250.01, max: 500, rate: 20 },
      { min: 500.01, max: 1000, rate: 25 },
      { min: 1000.01, max: null, rate: 30 },
    ],
  });
  const [showReloadButton, setShowReloadButton] = useState(false);
  const [lastSavedSettings, setLastSavedSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const defaultMatrixRates = [
      { min: 0, max: 50, rate: 5 },
      { min: 50.01, max: 100, rate: 10 },
      { min: 100.01, max: 250, rate: 15 },
      { min: 250.01, max: 500, rate: 20 },
      { min: 500.01, max: 1000, rate: 25 },
      { min: 1000.01, max: null, rate: 30 },
    ];

    chrome.storage.sync.get(['settings'], (result) => {
      if (result.settings) {
        // Ensure matrixRates is an array
        const loadedSettings = {
          ...result.settings,
          matrixRates: Array.isArray(result.settings.matrixRates) 
            ? result.settings.matrixRates 
            : defaultMatrixRates
        };
        setSettings(loadedSettings);
        setLastSavedSettings(loadedSettings);
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
      newSettings.enabled !== undefined && newSettings.enabled !== lastSavedSettings.enabled ||
      newSettings.showIndicator !== undefined && newSettings.showIndicator !== lastSavedSettings.showIndicator ||
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
    <div className="w-[350px] h-[450px] p-6 bg-white overflow-y-auto">
      <fieldset className="mb-2 border border-gray-200 rounded-md p-4">
        <legend className="text-sm font-medium text-gray-900">General Options</legend>
        <div className="flex justify-between items-center space-y-3">
          <span className="text-sm text-gray-600">Enable Price Markup</span>
          <Switch
            checked={settings.enabled}
            onChange={(checked) => handleSettingChange({ enabled: checked, showIndicator: checked ? settings.showIndicator : false })}
          />
        </div>
        <div className="flex justify-between items-center space-y-3 ">
          <span className="text-sm text-gray-600">Show Price Indicator</span>
          <Switch
            checked={settings.showIndicator}
            onChange={(checked) => handleSettingChange({ showIndicator: checked })}
          />
        </div>
      </fieldset>

      {settings.enabled && (
        <>
          <fieldset className="mb-2 border border-gray-200 rounded-md p-4">
            <legend className="text-sm font-medium text-gray-900 px-2">Markup Type</legend>
            <RadioGroup
              value={settings.markupType}
              onChange={(value) => handleSettingChange({ markupType: value as Settings['markupType'] })}
              options={[
                { label: 'Flat Rate', value: 'flat' },
                { label: 'Percentage', value: 'percentage' },
                { label: 'Matrix (%)', value: 'matrixPercentage' },
                { label: 'Matrix ($)', value: 'matrixFlat' },
              ]}
            />
          </fieldset>

          {settings.markupType === 'flat' && (
            <fieldset className="mb-2 border border-gray-200 rounded-md p-4">
              <legend className="text-sm font-medium text-gray-900 px-2">Flat Rate ($)</legend>
              <NumberInput
                value={settings.flatRate}
                onChange={(value) => handleSettingChange({ flatRate: value })}
                min={0}
                step={1}
              />
            </fieldset>
          )}

          {settings.markupType === 'percentage' && (
            <fieldset className="mb-2 border border-gray-200 rounded-md p-4">
              <legend className="text-sm font-medium text-gray-900 px-2">Percentage (%)</legend>
              <NumberInput
                value={settings.percentage}
                onChange={(value) => handleSettingChange({ percentage: value })}
                min={0}
                max={100}
                step={1}
              />
            </fieldset>
          )}

          {settings.markupType === 'matrixPercentage' && (
            <fieldset className="mb-2 border border-gray-200 rounded-md p-4">
              <legend className="text-sm font-medium text-gray-900 px-2">Matrix Rates (%)</legend>
              <MatrixInput
                rates={settings.matrixRates}
                onChange={(rates) => handleSettingChange({ matrixRates: rates })}
              />
            </fieldset>
          )}

          {settings.markupType === 'matrixFlat' && (
            <fieldset className="mb-2 border border-gray-200 rounded-md p-4">
              <legend className="text-sm font-medium text-gray-900 px-2">Matrix Rates ($)</legend>
              <MatrixInput
                rates={settings.matrixRates}
                onChange={(rates) => handleSettingChange({ matrixRates: rates })}
              />
            </fieldset>
          )}

        </>
      )}
      {showReloadButton && (
        <div className="mt-3 flex justify-center items-center">
          <button
            type="button"
            className="w-full py-2 px-4 bg-blue-600 text-white border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-blue-700 active:bg-blue-800"
            onClick={handleSave}
          >
            Apply Changes
          </button>
        </div>
      )}
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} 