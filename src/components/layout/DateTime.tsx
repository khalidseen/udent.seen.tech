import { useState, useEffect } from "react";
import { useFormatters } from "@/hooks/useFormatters";

export function DateTime() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const { formatDate, formatTime } = useFormatters();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="flex flex-col">
        <span className="font-medium text-foreground">
          {formatTime(currentDateTime)}
        </span>
        <span className="text-xs">
          {formatDate(currentDateTime, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}
