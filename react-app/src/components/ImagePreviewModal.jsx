import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  ExternalLink, 
  Copy, 
  Check, 
  File,
  Code
} from 'lucide-react';

/**
 * UniversalFilePreviewModal (ImagePreviewModal)
 * Fullscreen, high-fidelity universal file lightbox supporting:
 * - High-res Images (Zoom, Rotate, Pan, Gallery Carousel)
 * - PDF Documents (Embedded Native PDF Reader, Page Navigation, System Open)
 * - Text, Code, & Markdown Files (Clean Monospace Reader with Copy to Clipboard)
 * - General Documents & Attachments
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
  const [fetchedTextContent, setFetchedTextContent] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const currentItem = allImages[currentIndex] || image;
  const initialSrc = currentItem?.src || currentItem?.dataUrl || currentItem?.previewUrl || currentItem?.url || '';
  const [activeSrc, setActiveSrc] = useState(initialSrc);

  const filename = (currentItem?.title || currentItem?.name || '').toLowerCase();
  const mime = (currentItem?.mimeType || currentItem?.type || '').toLowerCase();

  const isPdf = filename.endsWith('.pdf') || mime.includes('pdf');
  const isText = filename.endsWith('.txt') || filename.endsWith('.csv') || filename.endsWith('.md') || 
                 filename.endsWith('.json') || filename.endsWith('.js') || filename.endsWith('.ts') || 
                 filename.endsWith('.log') || filename.endsWith('.html') || filename.endsWith('.css') ||
                 mime.startsWith('text/') || mime === 'application/json';
  const isImage = !isPdf && !isText && (
    currentItem?.isImage === true || 
    mime.startsWith('image/') || 
    /\.(png|jpe?g|webp|gif|svg|bmp|ico)$/i.test(filename) ||
    Boolean(currentItem?.dataUrl?.startsWith('data:image'))
  );

  // Synchronously decode data:text without triggering effect render cascade
  const decodedDataText = useMemo(() => {
    const src = currentItem?.src || currentItem?.dataUrl || currentItem?.previewUrl || currentItem?.url || '';
    if (isText && src && src.startsWith('data:text')) {
      try {
        const base64 = src.split(',')[1];
        return atob(base64);
      } catch {
        return 'Could not decode text file.';
      }
    }
    return null;
  }, [isText, currentItem]);

  const textContent = decodedDataText !== null ? decodedDataText : fetchedTextContent;

  const [prevIndex, setPrevIndex] = useState(currentIndex);
  if (currentIndex !== prevIndex) {
    setPrevIndex(currentIndex);
    setScale(1);
    setRotation(0);
    setLoadError(false);
    setAttemptedFallback(false);
    setFetchedTextContent(null);
    setIsCopied(false);
    const src = currentItem?.src || currentItem?.dataUrl || currentItem?.previewUrl || currentItem?.url || '';
    setActiveSrc(src);
  }

  // Load remote text content asynchronously when document changes
  useEffect(() => {
    const src = currentItem?.src || currentItem?.dataUrl || currentItem?.previewUrl || currentItem?.url || '';
    if (isText && src && !src.startsWith('data:text')) {
      fetch(src)
        .then(r => r.text())
        .then(t => setFetchedTextContent(t))
        .catch(() => setFetchedTextContent('Could not fetch file contents.'));
    }
  }, [currentIndex, currentItem, isText]);

  const handleImageError = () => {
    if (!attemptedFallback && currentItem?.downloadUrl && currentItem.downloadUrl !== activeSrc) {
      setAttemptedFallback(true);
      setActiveSrc(currentItem.downloadUrl);
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
    } else if (e.key === 'ArrowRight' && isImage) {
      handleNext();
    } else if (e.key === 'ArrowLeft' && isImage) {
      handlePrev();
    }
  }, [onClose, handleNext, handlePrev, isImage]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!currentItem) return null;

  const title = currentItem.title || currentItem.name || (isPdf ? 'Document.pdf' : 'File Preview');
  const size = currentItem.size ? (typeof currentItem.size === 'number' ? `${(currentItem.size / 1024).toFixed(1)} KB` : currentItem.size) : '';

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.4));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleOpenExternal = () => {
    const targetUrl = currentItem.downloadUrl || currentItem.previewUrl || activeSrc;
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(targetUrl);
    } else {
      window.open(targetUrl, '_blank');
    }
  };

  const handleDownload = () => {
    const downloadUrl = currentItem.downloadUrl || currentItem.previewUrl || activeSrc;
    if (!downloadUrl) return;

    if (downloadUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = title || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.target = '_blank';
    a.download = title || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(() => {});
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(9, 11, 15, 0.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
    >
      {/* Top Floating Control Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: 'rgba(17, 24, 39, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 10
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Left: Metadata & Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div 
            style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 6, 
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f9fafb'
            }}
          >
            {isPdf ? <FileText size={16} /> : isText ? <Code size={16} /> : <File size={16} />}
          </div>

          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f9fafb', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{title}</span>
              {isPdf && (
                <span style={{ fontSize: 10, background: 'rgba(255, 255, 255, 0.15)', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                  PDF
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 8 }}>
              {size && <span>{size}</span>}
              {size && <span>&bull;</span>}
              <span>{isPdf ? 'PDF Document Viewer' : isText ? 'Plain Text / Source Code' : isImage ? 'Image Lightbox' : 'Workspace File'}</span>
              {allImages.length > 1 && isImage && (
                <>
                  <span>&bull;</span>
                  <span>{currentIndex + 1} of {allImages.length}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isImage && (
            <>
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
            </>
          )}

          {isText && textContent && (
            <button 
              className="win-btn" 
              title="Copy Content"
              onClick={handleCopyText}
              style={{ height: 32, padding: '0 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#fff' }}
            >
              {isCopied ? <Check size={14} color="#f9fafb" /> : <Copy size={14} />}
              <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
            </button>
          )}

          {(isPdf || !isImage) && (
            <button 
              className="win-btn" 
              title="Open in System PDF Reader / Browser"
              onClick={handleOpenExternal}
              style={{ height: 32, padding: '0 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#fff' }}
            >
              <ExternalLink size={14} />
              <span>Open in Window</span>
            </button>
          )}

          <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.15)', margin: '0 4px' }} />

          <button 
            className="btn btn-primary" 
            title="Download File"
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

      {/* Main Stage */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          padding: 16
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* PDF Document View */}
        {isPdf && (
          <div 
            onClick={e => e.stopPropagation()} 
            style={{
              width: '86vw',
              height: 'calc(100vh - 110px)',
              background: '#ffffff',
              borderRadius: 8,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <iframe 
              src={`${activeSrc}#toolbar=1&navpanes=1`}
              title={title}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#525659'
              }}
            />
          </div>
        )}

        {/* Text / Code View */}
        {isText && (
          <div 
            onClick={e => e.stopPropagation()} 
            style={{
              width: '80vw',
              maxWidth: 960,
              height: 'calc(100vh - 120px)',
              background: '#0d1117',
              borderRadius: 8,
              border: '1px solid #30363d',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '8px 16px',
              background: '#161b22',
              borderBottom: '1px solid #30363d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#8b949e',
              fontFamily: 'monospace'
            }}>
              <span>{title}</span>
              <span>{textContent ? `${textContent.split('\n').length} lines` : 'Loading...'}</span>
            </div>
            <pre style={{
              flex: 1,
              margin: 0,
              padding: 16,
              overflow: 'auto',
              color: '#c9d1d9',
              fontFamily: 'JetBrains Mono, Menlo, monospace',
              fontSize: 12.5,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {textContent || 'Loading file content...'}
            </pre>
          </div>
        )}

        {/* Standard Image View */}
        {isImage && (
          <>
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
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                }}
              >
                <ChevronLeft size={24} />
              </button>
            )}

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
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                }}
              >
                <ChevronRight size={24} />
              </button>
            )}

            {loadError ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 32px', background: 'rgba(17, 24, 39, 0.75)', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb', marginBottom: 6 }}>
                  Failed to load image preview
                </div>
                <div style={{ fontSize: 12, marginBottom: 16 }}>The image source may be unavailable or expired.</div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="win-btn"
                    style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6 }}
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
                    style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, background: 'var(--accent-blue)', color: '#fff' }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
              />
            )}
          </>
        )}

        {/* Fallback for Generic Binary Files */}
        {!isPdf && !isText && !isImage && (
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              padding: '36px 48px',
              background: 'rgba(17, 24, 39, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 12,
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
            }}
          >
            <FileText size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f9fafb', marginBottom: 6 }}>
              {title}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>
              {size ? `${size} • ` : ''}Ready for viewing in external system application
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={handleOpenExternal}>
                <ExternalLink size={14} />
                <span>Open in System</span>
              </button>
              <button className="win-btn" onClick={handleDownload}>
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Thumbnails Strip (if multiple images) */}
      {allImages.length > 1 && isImage && (
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
