import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ImagePreviewModal
 * Fullscreen, high-fidelity image lightbox with zoom, rotation, pan, download,
 * and multi-image carousel/gallery navigation (Next/Prev + Keyboard Arrows).
 */
export default function ImagePreviewModal({ image, images = [], initialIndex = 0, onClose }) {
  const allImages = (images && images.length > 0) ? images : (image ? [image] : []);
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (image) {
      const idx = allImages.findIndex(img => 
        (img.title && image.title && img.title === image.title) ||
        ((img.src || img.dataUrl || img.previewUrl) === (image.src || image.dataUrl || image.previewUrl))
      );
      if (idx !== -1) return idx;
    }
    if (typeof initialIndex === 'number' && initialIndex > 0 && initialIndex < allImages.length) return initialIndex;
    return 0;
  });

  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [attemptedFallback, setAttemptedFallback] = useState(false);

  const currentImage = allImages[currentIndex] || image;
  const initialSrc = currentImage?.src || currentImage?.dataUrl || currentImage?.previewUrl || currentImage?.url || '';
  const [activeSrc, setActiveSrc] = useState(initialSrc);

  // Reset zoom, rotation and fallback whenever active image changes
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setLoadError(false);
    setAttemptedFallback(false);
    setActiveSrc(currentImage?.src || currentImage?.dataUrl || currentImage?.previewUrl || currentImage?.url || '');
  }, [currentIndex, currentImage]);

  const handleImageError = () => {
    if (!attemptedFallback && currentImage?.downloadUrl && currentImage.downloadUrl !== activeSrc) {
      setAttemptedFallback(true);
      setActiveSrc(currentImage.downloadUrl);
    } else {
      setLoadError(true);
    }
  };

  const handleNext = useCallback((e) => {
    e?.stopPropagation?.();
    if (allImages.length <= 1) return;
    setCurrentIndex(prev => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const handlePrev = useCallback((e) => {
    e?.stopPropagation?.();
    if (allImages.length <= 1) return;
    setCurrentIndex(prev => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  // Keyboard navigation: Escape to close, Left/Right arrows for next/prev
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrev();
    }
  }, [onClose, handleNext, handlePrev]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!currentImage) return null;

  const src = currentImage.src || currentImage.dataUrl || currentImage.previewUrl || currentImage.url || '';
  const title = currentImage.title || currentImage.name || 'Image Preview';
  const size = currentImage.size ? (typeof currentImage.size === 'number' ? `${(currentImage.size / 1024).toFixed(1)} KB` : currentImage.size) : '';

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.4));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleDownload = () => {
    const downloadUrl = currentImage.downloadUrl || src;
    if (!downloadUrl) return;

    if (downloadUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = title || 'downloaded-image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <div 
      className="image-preview-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 13, 0.90)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Top Header Bar */}
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          height: 52,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(17, 24, 39, 0.80)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          userSelect: 'none',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.7)'
          }} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#f9fafb',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 320
            }}>
              {title}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 8 }}>
              {allImages.length > 1 && (
                <span style={{ 
                  color: '#38bdf8', 
                  fontWeight: 600, 
                  background: 'rgba(56, 189, 248, 0.15)', 
                  padding: '1px 6px', 
                  borderRadius: 4 
                }}>
                  {currentIndex + 1} of {allImages.length}
                </span>
              )}
              {size && <span>{size}</span>}
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            className="icon-btn" 
            title="Zoom Out (-)"
            onClick={handleZoomOut}
            style={{ width: 32, height: 32, color: '#e5e7eb' }}
          >
            <ZoomOut size={16} />
          </button>
          
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', minWidth: 42, textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>

          <button 
            className="icon-btn" 
            title="Zoom In (+)"
            onClick={handleZoomIn}
            style={{ width: 32, height: 32, color: '#e5e7eb' }}
          >
            <ZoomIn size={16} />
          </button>

          <button 
            className="icon-btn" 
            title="Rotate 90°"
            onClick={handleRotate}
            style={{ width: 32, height: 32, color: '#e5e7eb' }}
          >
            <RotateCw size={15} />
          </button>

          <button 
            className="icon-btn" 
            title="Fit to Screen"
            onClick={handleReset}
            style={{ width: 32, height: 32, color: '#e5e7eb' }}
          >
            <Maximize2 size={15} />
          </button>

          <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.15)', margin: '0 4px' }} />

          <button 
            className="btn btn-primary" 
            title="Download Image"
            onClick={handleDownload}
            style={{ height: 32, padding: '0 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={13} />
            <span>Download</span>
          </button>

          <button 
            className="icon-btn" 
            title="Close Preview (Esc)"
            onClick={onClose}
            style={{ width: 32, height: 32, color: '#f3f4f6', marginLeft: 8 }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Stage with Navigation Arrows */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          padding: 24,
          cursor: scale > 1 ? 'grab' : 'zoom-in'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          } else {
            handleZoomIn();
          }
        }}
      >
        {/* Previous Button (if multiple images) */}
        {allImages.length > 1 && (
          <button
            className="lightbox-nav-btn"
            title="Previous Image (Left Arrow)"
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(17, 24, 39, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              transition: 'background 0.2s, transform 0.1s'
            }}
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Next Button (if multiple images) */}
        {allImages.length > 1 && (
          <button
            className="lightbox-nav-btn"
            title="Next Image (Right Arrow)"
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(17, 24, 39, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              transition: 'background 0.2s, transform 0.1s'
            }}
          >
            <ChevronRight size={24} />
          </button>
        )}

        {loadError ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 32px', background: 'rgba(17, 24, 39, 0.75)', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>
              Failed to load image preview
            </div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>The image source may be unavailable or expired.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                className="win-btn"
                style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setLoadError(false);
                  setAttemptedFallback(false);
                  setActiveSrc(initialSrc + (initialSrc.includes('?') ? '&' : '?') + 'r=' + Date.now());
                }}
              >
                Retry
              </button>
              <button
                type="button"
                className="win-btn"
                style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-blue)', color: '#fff' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
              >
                Download File
              </button>
            </div>
          </div>
        ) : (
          <img 
            src={activeSrc} 
            alt={title}
            onError={handleImageError}
            style={{
              maxWidth: '88vw',
              maxHeight: 'calc(100vh - 120px)',
              objectFit: 'contain',
              borderRadius: 6,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
              userSelect: 'none',
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>

      {/* Bottom Thumbnails Strip (if multiple images) */}
      {allImages.length > 1 && (
        <div 
          onClick={e => e.stopPropagation()}
          style={{
            height: 68,
            padding: '8px 16px',
            background: 'rgba(17, 24, 39, 0.85)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            overflowX: 'auto',
            zIndex: 10
          }}
        >
          {allImages.map((img, idx) => {
            const thumbSrc = img.src || img.dataUrl || img.previewUrl || img.url;
            const isSelected = idx === currentIndex;
            return (
              <div 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 4,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                  opacity: isSelected ? 1 : 0.6,
                  transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                <img 
                  src={thumbSrc} 
                  alt="" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
