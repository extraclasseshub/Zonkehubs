import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle, XCircle, Save, Loader2, AlertCircle } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update local state when initialAvailability changes
  useEffect(() => {
    if (initialAvailability) {
      console.log('📅 Updating availability from props:', initialAvailability);
      setAvailability(initialAvailability);
    }
  }, [initialAvailability]);

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
    setError(null);
    setSuccess(false);
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
    setError(null);
    setSuccess(false);
  };

  const validateSchedule = (schedule: AvailabilitySchedule): string | null => {
    for (const [dayKey, dayData] of Object.entries(schedule)) {
      if (dayData.available) {
        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(dayData.start) || !timeRegex.test(dayData.end)) {
          return `Invalid time format for ${dayKey}. Please use HH:MM format.`;
        }

        // Validate that end time is after start time
        const [startHour, startMin] = dayData.start.split(':').map(Number);
        const [endHour, endMin] = dayData.end.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (endMinutes <= startMinutes) {
          return `End time must be after start time for ${dayKey}.`;
        }
      }
    }
    return null;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate the schedule
      const validationError = validateSchedule(availability);
      if (validationError) {
        setError(validationError);
        setSaving(false);
        return;
      }

      console.log('💾 Saving availability schedule:', availability);
      
      await onSave(availability);
      
      console.log('✅ Availability saved successfully');
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('❌ Error saving availability:', error);
      setError(error instanceof Error ? error.message : 'Failed to save availability schedule');
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
    setError(null);
    setSuccess(false);
  };

  const hasChanges = JSON.stringify(availability) !== JSON.stringify(initialAvailability || defaultSchedule);

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
            disabled={saving || loading}
            className="text-xs bg-[#00c9a7] hover:bg-teal-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded transition-colors"
          >
            Enable All
          </button>
          <button
            onClick={() => setAllDays(false)}
            disabled={saving || loading}
            className="text-xs bg-slate-600 hover:bg-slate-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded transition-colors"
          >
            Disable All
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 flex items-center space-x-2 text-green-400 text-sm bg-green-900/20 border border-green-600 rounded-md p-3">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>Availability schedule saved successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 flex items-center space-x-2 text-red-400 text-sm bg-red-900/20 border border-red-600 rounded-md p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {days.map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-4 p-4 bg-slate-700 rounded-lg">
            <div className="flex items-center space-x-3 w-32">
              <button
                onClick={() => handleDayToggle(key)}
                disabled={saving || loading}
                className={`p-1 rounded transition-colors disabled:cursor-not-allowed ${
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
                    disabled={saving || loading}
                    className="bg-slate-600 border border-slate-500 rounded px-3 py-1 text-white text-sm focus:border-[#3db2ff] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                
                <span className="text-gray-400">to</span>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={availability[key].end}
                    onChange={(e) => handleTimeChange(key, 'end', e.target.value)}
                    disabled={saving || loading}
                    className="bg-slate-600 border border-slate-500 rounded px-3 py-1 text-white text-sm focus:border-[#3db2ff] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
          disabled={saving || loading || !hasChanges}
          className="bg-[#3db2ff] hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md transition-colors flex items-center space-x-2"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{hasChanges ? 'Save Schedule' : 'No Changes'}</span>
            </>
          )}
        </button>
      </div>

      {/* Schedule Summary */}
      <div className="mt-6 p-4 bg-slate-700 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-3">Schedule Summary</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {days.map(({ key, label }) => (
            <div key={key} className="flex justify-between">
              <span className="text-[#cbd5e1]">{label}:</span>
              <span className={availability[key].available ? 'text-[#00c9a7]' : 'text-gray-400'}>
                {availability[key].available 
                  ? `${availability[key].start} - ${availability[key].end}`
                  : 'Closed'
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}