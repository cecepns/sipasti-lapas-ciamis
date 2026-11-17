import { useEffect, useState } from 'react';

export function useDebounce(value, delay = 350) {
  const safeDelay = Math.max(300, delay);
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, safeDelay);
    return () => clearTimeout(timer);
  }, [value, safeDelay]);

  return debouncedValue;
}
