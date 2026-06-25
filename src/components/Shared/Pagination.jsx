import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        pages.push(i);
      } else if (Math.abs(i - currentPage) === 2) {
        if (!pages.includes('...')) pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div className="pag-btns">
      <button className="pag-btn" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
        <i className="bi bi-chevron-right"></i>
      </button>
      {getPageNumbers().map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} style={{ padding: '0 4px', color: 'var(--text3)' }}>…</span>
        ) : (
          <button 
            key={page} 
            className={`pag-btn ${page === currentPage ? 'on' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        )
      ))}
      <button className="pag-btn" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
        <i className="bi bi-chevron-right" style={{ transform: 'scaleX(-1)' }}></i>
      </button>
    </div>
  );
};

export default Pagination;