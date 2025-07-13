import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: string | Date;
  className?: string;
}

export default function CountdownTimer({ targetDate, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className={`text-center ${className}`}>
      <div className="text-3xl font-bold text-yellow-600 mb-1">
        {timeLeft.days}
      </div>
      <div className="text-sm text-gray-600">
        Days Remaining
      </div>
      {timeLeft.days > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </div>
      )}
    </div>
  );
}
