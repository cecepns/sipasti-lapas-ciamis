import Select from 'react-select';

export function getSelectStyles(compact = false) {
  return {
    control: (base, state) => ({
      ...base,
      minHeight: compact ? '34px' : '40px',
      borderRadius: '0.75rem',
      borderColor: state.isFocused ? '#10b981' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(16, 185, 129, 0.16)' : 'none',
      backgroundColor: state.isDisabled ? '#f8fafc' : '#ffffff',
      fontSize: compact ? '0.75rem' : '0.875rem',
      '&:hover': {
        borderColor: state.isFocused ? '#10b981' : '#cbd5e1',
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: compact ? '0 8px' : '2px 10px',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#94a3b8',
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.75rem',
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
      boxShadow: '0 12px 28px -8px rgba(15, 23, 42, 0.14)',
      fontSize: '0.875rem',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#059669'
        : state.isFocused
        ? '#ecfdf5'
        : '#ffffff',
      color: state.isSelected ? '#ffffff' : '#1e293b',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
    singleValue: (base) => ({
      ...base,
      color: '#0f172a',
      fontWeight: 500,
    }),
  };
}

export function SelectInput({
  options = [],
  value = null,
  onChange,
  placeholder = 'Pilih...',
  isClearable = true,
  isSearchable = true,
  isDisabled = false,
  menuPlacement = 'auto',
  compact = false,
  className = '',
  noOptionsMessage = () => 'Data tidak ditemukan',
}) {
  return (
    <div className={className}>
      <Select
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isClearable={isClearable}
        isSearchable={isSearchable}
        isDisabled={isDisabled}
        menuPlacement={menuPlacement}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        styles={getSelectStyles(compact)}
        noOptionsMessage={noOptionsMessage}
      />
    </div>
  );
}
