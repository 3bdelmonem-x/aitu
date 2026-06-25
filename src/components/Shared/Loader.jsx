import React from 'react';

const Loader = ({ message = 'جاري التحميل...' }) => {
  return (
    <div className="page-loader">
      <div className="spin"></div>
      <span>{message}</span>
    </div>
  );
};

export default Loader;