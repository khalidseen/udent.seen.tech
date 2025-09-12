import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
export function DateTime() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <div className="flex items-center gap-2 text-sm text-muted-foreground">
      
      <div className="flex flex-col">
        <span className="font-medium text-foreground">
          {formatTime(currentDateTime)}
        </span>
        <span className="text-xs">
          {formatDate(currentDateTime)}
        </span>
      </div>
    </div>;
}