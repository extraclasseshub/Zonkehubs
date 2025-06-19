import React, { useState } from 'react';
import { Clock, Calendar, CheckCircle, XCircle, Save } from 'lucide-react';

interface AvailabilitySchedule {
  monday: { start: string; end: string; available: boolean };
  tuesday: { start: string; end: string; available: boolean };
  wednesday: { start: string; end: string; available: boolean };
  thursday: { start: string; end: string; available: boolean };
  friday: { start: string; end: string; available: boolean };
  saturday: { start: string; end: string; available: boolean };
  sunday: { start: string; end: string; available: boolean };
}

interface ProviderAvailabilityProps {
  initialAvailability?: AvailabilitySchedule;
  onSave: (availability: AvailabilitySchedule) => Promise<void>;
  loading?: boolean;
}

const defaultSchedule: AvailabilitySchedule = {
  monday: { start: '09:00', end: '17:00', available: true },
  tuesday: { start: '09:00', end: '17:00', available: true },
  wednesday: { start: '09:00', end: '17:00', available: true },
  thursday: { start: '09:00', end: '17:00', available: true },
  friday: { start: '09:00', end: '17:00', available: true },
  saturday: { start: '09:00', end: '15:00', available: false },
  sunday: { start: '09:00', end: '15:00', available: false },
};

export default function ProviderAvailability({ 
  initialAvailability, 
  onSave, 
  loading 
}: ProviderAvailabilityProps) {
  const [availability, setAvailability] = useState<AvailabilitySchedule>(
    initialAvailability || defaultSchedule
  );
  const [saving, setSaving] = useState(false);

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ] as const;

  const handleDayToggle = (day: keyof AvailabilitySchedule) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        available: !prev[day].available
      }
    }));
  };

  const handleTimeChange = (
    day: keyof AvailabilitySchedule, 
    timeType: 'start' | 'end', 
    value: string
  ) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [timeType]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(availability);
    } catch (error) {
      console.error('Error saving availability:', error);
    } finally {
      setSaving(false);
    }
  };

  const setAllDays = (available: boolean) => {
    const newAvailability = { ...availability };
    days.forEach(({ key }) => {
      newAvailability[key] = {
        ...newAvailability[key],
        available
      };
    });
    setAvailability(newAvailability);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-[#3db2ff] rounded-full p-2">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Availability Schedule</h3>
            <p className="text-sm text-[#cbd5e1]">Set your working hours for each day</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAllDays(true)}
            className="text-xs bg-[#00c9a7] hover:bg-teal-500 text-white px-3 py-1 rounded transition-colors"
          >
            Enable All
          </button>
          <button
            onClick={() => setAllDays(false)}
            className="text-xs bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded transition-colors"
          >
            Disable All
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {days.map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-4 p-4 bg-slate-700 rounded-lg">
            <div className="flex items-center space-x-3 w-32">
              <button
                onClick={() => handleDayToggle(key)}
                className={`p-1 rounded transition-colors ${
                  availability[key].available 
                    ? 'text-[#00c9a7]' 
                    : 'text-gray-400'
                }`}
              >
                {availability[key].available ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
              </button>
              <span className={`font-medium ${
                availability[key].available ? 'text-white' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </div>

            {availability[key].available ? (
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <input
                    type="time"
                    value={availability[key].start}
                    onChange={(e) => handleTimeChange(key, 'start', e.target.value)}
                    className="bg-slate-600 border border-slate-500 rounded px-3 py-1 text-white text-sm focus:border-[#3db2ff] focus:outline-none"
                  />
                </div>
                
                <span className="text-gray-400">to</span>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={availability[key].end}
                    onChange={(e) => handleTimeChange(key, 'end', e.target.value)}
                    className="bg-slate-600 border border-slate-500 rounded px-3 py-1 text-white text-sm focus:border-[#3db2ff] focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <span className="text-gray-400 text-sm">Not available</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-[#3db2ff] hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md transition-colors flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Schedule</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}