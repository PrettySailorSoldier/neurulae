import { useState, useEffect, useCallback, useMemo } from 'react';
import { SunlightAnchorWidget as SunlightAnchorWidgetType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, Sun, Moon, MapPin, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SunlightAnchorWidgetProps {
  widget: SunlightAnchorWidgetType;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateSettings?: (updates: Partial<SunlightAnchorWidgetType>) => void;
}

type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'golden' | 'dusk' | 'night';

// Calculate sunrise/sunset using simplified solar position algorithm
// Based on NOAA Solar Calculator equations
const calculateSunTimes = (lat: number, lng: number, date: Date): { sunrise: Date; sunset: Date; solarNoon: Date } => {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);

  // Fractional year (radians)
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (date.getHours() - 12) / 24);

  // Equation of time (minutes)
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));

  // Solar declination (radians)
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

  // Hour angle at sunrise/sunset (radians)
  const latRad = lat * Math.PI / 180;
  const zenith = 90.833 * Math.PI / 180; // Official sunrise/sunset

  const cosHa = (Math.cos(zenith) / (Math.cos(latRad) * Math.cos(decl))) - Math.tan(latRad) * Math.tan(decl);

  // Clamp to prevent NaN in polar regions
  const clampedCosHa = Math.max(-1, Math.min(1, cosHa));
  const ha = Math.acos(clampedCosHa) * 180 / Math.PI;

  // Calculate times in minutes from midnight UTC
  const solarNoonMinutes = 720 - 4 * lng - eqTime;
  const sunriseMinutes = solarNoonMinutes - ha * 4;
  const sunsetMinutes = solarNoonMinutes + ha * 4;

  // Convert to local Date objects
  const baseDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const timezoneOffset = date.getTimezoneOffset();

  const sunrise = new Date(baseDate.getTime() + (sunriseMinutes + timezoneOffset) * 60000);
  const sunset = new Date(baseDate.getTime() + (sunsetMinutes + timezoneOffset) * 60000);
  const solarNoon = new Date(baseDate.getTime() + (solarNoonMinutes + timezoneOffset) * 60000);

  return { sunrise, sunset, solarNoon };
};

// Format time as "HH:MM AM/PM"
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Get minutes since midnight
const getMinutesSinceMidnight = (date: Date): number => {
  return date.getHours() * 60 + date.getMinutes();
};

// Calculate sun's position as percentage (0 = sunrise, 50 = noon, 100 = sunset)
const calculateSunPosition = (now: Date, sunrise: Date, sunset: Date): number => {
  const nowMinutes = getMinutesSinceMidnight(now);
  const sunriseMinutes = getMinutesSinceMidnight(sunrise);
  const sunsetMinutes = getMinutesSinceMidnight(sunset);

  if (nowMinutes < sunriseMinutes) {
    // Before sunrise - sun is below horizon (negative position mapped to bottom)
    const nightDuration = sunriseMinutes + (24 * 60 - sunsetMinutes);
    const minutesSinceSunset = nowMinutes + (24 * 60 - sunsetMinutes);
    return -50 + (minutesSinceSunset / nightDuration) * 50; // -50 to 0
  } else if (nowMinutes > sunsetMinutes) {
    // After sunset - moon position
    const nightDuration = sunriseMinutes + (24 * 60 - sunsetMinutes);
    const minutesSinceSunset = nowMinutes - sunsetMinutes;
    return (minutesSinceSunset / nightDuration) * 50; // 0 to ~50 (for moon arc)
  } else {
    // Daytime - sun arc from 0% to 100%
    const dayDuration = sunsetMinutes - sunriseMinutes;
    return ((nowMinutes - sunriseMinutes) / dayDuration) * 100;
  }
};

// Determine time of day based on sun position relative to sunrise/sunset
const getTimeOfDay = (now: Date, sunrise: Date, sunset: Date): TimeOfDay => {
  const nowMinutes = getMinutesSinceMidnight(now);
  const sunriseMinutes = getMinutesSinceMidnight(sunrise);
  const sunsetMinutes = getMinutesSinceMidnight(sunset);

  // Dawn: 30 min before to 30 min after sunrise
  const dawnStart = sunriseMinutes - 30;
  const dawnEnd = sunriseMinutes + 30;

  // Golden hour: 60 min before sunset
  const goldenStart = sunsetMinutes - 60;

  // Dusk: 30 min after sunset
  const duskEnd = sunsetMinutes + 30;

  if (nowMinutes < dawnStart || nowMinutes > duskEnd) {
    return 'night';
  } else if (nowMinutes >= dawnStart && nowMinutes < dawnEnd) {
    return 'dawn';
  } else if (nowMinutes >= dawnEnd && nowMinutes < sunriseMinutes + 180) {
    return 'morning';
  } else if (nowMinutes >= sunriseMinutes + 180 && nowMinutes < goldenStart - 120) {
    return 'midday';
  } else if (nowMinutes >= goldenStart - 120 && nowMinutes < goldenStart) {
    return 'afternoon';
  } else if (nowMinutes >= goldenStart && nowMinutes <= sunsetMinutes) {
    return 'golden';
  } else {
    return 'dusk';
  }
};

// Default fallback times (for when geolocation is unavailable)
const DEFAULT_SUNRISE = '06:30';
const DEFAULT_SUNSET = '18:30';

const parseTimeString = (timeStr: string, date: Date): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

export function SunlightAnchorWidget({ widget, onEdit, onDelete, onUpdateSettings }: SunlightAnchorWidgetProps) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('midday');
  const [sunPosition, setSunPosition] = useState(50);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sunTimes, setSunTimes] = useState<{ sunrise: Date; sunset: Date; solarNoon: Date } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'manual'>('loading');
  const [locationError, setLocationError] = useState<string | null>(null);

  // Request geolocation
  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Geolocation not supported');
      return;
    }

    setLocationStatus('loading');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (onUpdateSettings) {
          onUpdateSettings({
            latitude,
            longitude,
            useGeolocation: true,
            cachedSunrise: undefined,
            cachedSunset: undefined,
          });
        }

        setLocationStatus('success');
        setLocationError(null);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationStatus('error');

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out');
            break;
          default:
            setLocationError('Unable to get location');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 3600000, // Cache for 1 hour
      }
    );
  }, [onUpdateSettings]);

  // Initialize geolocation on mount if enabled
  useEffect(() => {
    if (widget.useGeolocation && !widget.latitude && !widget.longitude) {
      requestGeolocation();
    } else if (widget.latitude && widget.longitude) {
      setLocationStatus('success');
    } else if (widget.manualSunrise && widget.manualSunset) {
      setLocationStatus('manual');
    } else {
      // Default: request geolocation
      requestGeolocation();
    }
  }, []);

  // Calculate sun times based on location
  useEffect(() => {
    const now = new Date();

    if (widget.latitude !== undefined && widget.longitude !== undefined) {
      // Use geolocation-based calculation
      const times = calculateSunTimes(widget.latitude, widget.longitude, now);
      setSunTimes(times);

      // Cache the calculated times
      if (onUpdateSettings && (
        widget.cachedSunrise !== formatTime(times.sunrise) ||
        widget.cachedSunset !== formatTime(times.sunset)
      )) {
        onUpdateSettings({
          cachedSunrise: formatTime(times.sunrise),
          cachedSunset: formatTime(times.sunset),
        });
      }
    } else if (widget.manualSunrise && widget.manualSunset) {
      // Use manual times
      setSunTimes({
        sunrise: parseTimeString(widget.manualSunrise, now),
        sunset: parseTimeString(widget.manualSunset, now),
        solarNoon: parseTimeString('12:00', now),
      });
    } else {
      // Use defaults
      setSunTimes({
        sunrise: parseTimeString(DEFAULT_SUNRISE, now),
        sunset: parseTimeString(DEFAULT_SUNSET, now),
        solarNoon: parseTimeString('12:00', now),
      });
    }
  }, [widget.latitude, widget.longitude, widget.manualSunrise, widget.manualSunset]);

  // Update time and position every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);

      if (sunTimes) {
        const position = calculateSunPosition(now, sunTimes.sunrise, sunTimes.sunset);
        const period = getTimeOfDay(now, sunTimes.sunrise, sunTimes.sunset);

        setSunPosition(position);
        setTimeOfDay(period);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [sunTimes]);

  // Calculate celestial body position for rendering (arc movement)
  const celestialStyle = useMemo(() => {
    if (!sunTimes) return { left: '50%', bottom: '50%' };

    const isNight = timeOfDay === 'night' || timeOfDay === 'dusk';

    if (isNight) {
      // Moon follows a simpler arc at night
      const moonProgress = sunPosition < 0 ? (sunPosition + 50) / 50 : sunPosition / 50;
      const left = 10 + moonProgress * 80; // 10% to 90%
      const arcHeight = Math.sin(moonProgress * Math.PI) * 60; // Arc from 0 to 60%
      return { left: `${left}%`, bottom: `${20 + arcHeight}%` };
    } else {
      // Sun follows parabolic arc during day
      const normalizedPosition = Math.max(0, Math.min(100, sunPosition));
      const left = 10 + (normalizedPosition / 100) * 80; // 10% to 90%
      const arcHeight = Math.sin((normalizedPosition / 100) * Math.PI) * 70; // Arc peaks at 70%
      return { left: `${left}%`, bottom: `${10 + arcHeight}%` };
    }
  }, [sunPosition, timeOfDay, sunTimes]);

  const gradientClasses: Record<TimeOfDay, string> = {
    dawn: 'from-indigo-400 via-pink-300 to-amber-200',
    morning: 'from-sky-300 via-amber-200 to-orange-200',
    midday: 'from-sky-400 to-blue-500',
    afternoon: 'from-sky-400 via-blue-400 to-cyan-300',
    golden: 'from-orange-400 via-pink-500 to-purple-600',
    dusk: 'from-purple-600 via-pink-600 to-orange-500',
    night: 'from-indigo-900 via-purple-900 to-slate-950',
  };

  const labels: Record<TimeOfDay, string> = {
    dawn: 'Dawn breaking',
    morning: 'Good morning',
    midday: 'High noon',
    afternoon: 'Afternoon',
    golden: 'Golden hour',
    dusk: 'Twilight',
    night: 'Night time',
  };

  const isNight = timeOfDay === 'night' || timeOfDay === 'dusk';

  return (
    <Card className={cn(
      'border-0 rounded-2xl overflow-hidden transition-all duration-1000',
      'bg-gradient-to-br',
      gradientClasses[timeOfDay]
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <CardTitle className="text-lg font-semibold text-white drop-shadow-lg flex items-center gap-2">
          {widget.title}
          {locationStatus === 'success' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <MapPin className="h-3 w-3 text-white/60" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Using your location for accurate times</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        <div className="flex gap-1">
          {locationStatus === 'error' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={requestGeolocation}
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{locationError} - Click to retry</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-white/80 hover:text-red-400 hover:bg-red-950/30"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative h-36 overflow-hidden">
        {/* Horizon line */}
        <div className="absolute bottom-8 left-0 right-0 h-px bg-white/20" />

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Stars (only at night) */}
        {isNight && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  opacity: 0.3 + Math.random() * 0.5,
                }}
              />
            ))}
          </div>
        )}

        {/* Celestial body */}
        <div
          className="absolute transition-all duration-1000 ease-out"
          style={{
            left: celestialStyle.left,
            bottom: celestialStyle.bottom,
            transform: 'translate(-50%, 50%)',
          }}
        >
          {isNight ? (
            <Moon className="h-10 w-10 text-yellow-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
          ) : (
            <Sun className="h-12 w-12 text-yellow-200 drop-shadow-[0_0_30px_rgba(255,215,0,0.8)] animate-pulse" />
          )}
        </div>

        {/* Time info */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-between px-4 text-xs text-white/70">
          {sunTimes && (
            <>
              <span>☀️ {formatTime(sunTimes.sunrise)}</span>
              <span>🌙 {formatTime(sunTimes.sunset)}</span>
            </>
          )}
        </div>

        {/* Current status */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <p className="text-white font-medium text-sm drop-shadow-lg text-center">
            {labels[timeOfDay]}
          </p>
          <p className="text-white/60 text-xs text-center">
            {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
