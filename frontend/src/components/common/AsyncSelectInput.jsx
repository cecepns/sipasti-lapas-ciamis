import { useCallback, useRef } from 'react';
import AsyncSelect from 'react-select/async';
import { getSelectStyles } from './SelectInput';

/**
 * Reusable React Select AsyncSelect with built-in debounce (>= 350ms)
 * for searching API records without hammering backend endpoints.
 */
export function AsyncSelectInput({
  loadOptionsFn,
  value = null,
  onChange,
  placeholder = 'Ketik untuk mencari...',
  isClearable = true,
  isDisabled = false,
  defaultOptions = true,
  debounceMs = 350,
  compact = false,
  className = '',
  cacheOptions = false,
}) {
  const timerRef = useRef(null);
  const safeDelay = Math.max(300, debounceMs);

  const debouncedLoadOptions = useCallback(
    (inputValue) =>
      new Promise((resolve) => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(async () => {
          try {
            const opts = await loadOptionsFn(inputValue || '');
            resolve(Array.isArray(opts) ? opts : []);
          } catch {
            resolve([]);
          }
        }, safeDelay);
      }),
    [loadOptionsFn, safeDelay]
  );

  return (
    <div className={className}>
      <AsyncSelect
        cacheOptions={cacheOptions}
        defaultOptions={defaultOptions}
        loadOptions={debouncedLoadOptions}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isClearable={isClearable}
        isDisabled={isDisabled}
        loadingMessage={() => 'Mencari data...'}
        noOptionsMessage={({ inputValue }) =>
          inputValue ? `Tidak ada hasil untuk "${inputValue}"` : 'Ketik untuk mencari data'
        }
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        styles={getSelectStyles(compact)}
      />
    </div>
  );
}
