import React from 'react';

const Filters = ({ filters, onChange, children, style = {} }) => {
  return (
    <div className="filters" style={style}>
      {Object.entries(filters).map(([key, filter]) => (
        <div key={key} className="fg">
          <label>{filter.label}</label>
          {filter.type === 'select' ? (
            <select 
              value={filter.value || ''} 
              onChange={(e) => onChange(key, e.target.value)}
              className="fc"
            >
              <option value="">{filter.placeholder || 'الكل'}</option>
              {filter.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : filter.type === 'date' ? (
            <input 
              type="date" 
              value={filter.value || ''} 
              onChange={(e) => onChange(key, e.target.value)}
              className="fc"
            />
          ) : filter.type === 'month' ? (
            <input 
              type="month" 
              value={filter.value || ''} 
              onChange={(e) => onChange(key, e.target.value)}
              className="fc"
            />
          ) : (
            <input 
              type="text" 
              placeholder={filter.placeholder || 'بحث...'} 
              value={filter.value || ''} 
              onChange={(e) => onChange(key, e.target.value)}
              className="fc"
            />
          )}
        </div>
      ))}
      {children}
    </div>
  );
};

export default Filters;