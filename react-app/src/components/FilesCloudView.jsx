import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FolderPlus, 
  Search, 
  FileText, 
  Image, 
  FileArchive, 
  FileCode, 
  Folder, 
  Clock, 
  Star, 
  Share2, 
  Trash2, 
  Cloud, 
  MoreHorizontal, 
  Download,
  ExternalLink,
  RefreshCw,
  Check, 
  X,
  Eye
} from 'lucide-react';
import { backendBridge } from '../services/backendBridge';
import ImagePreviewModal from './ImagePreviewModal';

export function FilesCloudView({ 
  files = [], 
  onUploadFile, 
  onDeleteFile,
  userProfile = {}
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchFile, setSearchFile] = useState('');
  const [actionMenuFileId, setActionMenuFileId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [storageStats, setStorageStats] = useState({
    status: 'online',
    storageMode: 'Private Google Drive Cloud',
    totalFiles: 0,
    totalBytesUsedFormatted: '0.0 MB'
  });
  const [backendStatus, setBackendStatus] = useState({ online: true });
  const [previewImage, setPreviewImage] = useState(null);

  const fileInputRef = useRef(null);

  const navCategories = [
    { id: 'all', label: 'All Files', icon: Folder },
    { id: 'images', label: 'Images & Photos', icon: Image },
    { id: 'docs', label: 'Documents & PDFs', icon: FileText },
    { id: 'code', label: 'Code & Scripts', icon: FileCode },
    { id: 'archives', label: 'Archives (ZIP)', icon: FileArchive }
  ];

  // Refresh storage statistics on mount and file change
  useEffect(() => {
    let isMounted = true;
    async function refreshStats() {
      const stats = await backendBridge.getStorageStatus();
      const health = await backendBridge.checkHealth();
      if (isMounted) {
        setStorageStats(stats);
        setBackendStatus(health);
      }
    }
    refreshStats();
    return () => { isMounted = false; };
  }, [files.length]);

  const getFileIcon = (type = '', name = '') => {
    const ext = (name.split('.').pop() || '').toLowerCase();
    const t = String(type).toLowerCase();

    if (t.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
      return <Image size={15} color="var(--text-secondary)" />;
    }
    if (t.includes('pdf') || ext === 'pdf') {
      return <FileText size={15} color="var(--accent-red, #ef4444)" />;
    }
    if (t.includes('archive') || ['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return <FileArchive size={15} color="#eab308" />;
    }
    if (['js', 'jsx', 'ts', 'tsx', 'cpp', 'h', 'py', 'json', 'html', 'css'].includes(ext)) {
      return <FileCode size={15} color="#10b981" />;
    }
    return <FileText size={15} color="var(--text-secondary)" />;
  };

  // Trigger File Upload (Native Dialog in Electron or HTML Input)
  const handleTriggerUpload = async () => {
    // 1. Try Native Dialog if in Electron
    if (typeof window !== 'undefined' && window.electronAPI?.selectAndUploadFile) {
      try {
        setIsUploading(true);
        const res = await backendBridge.uploadFile({
          useNativeDialog: true,
          uploaderId: userProfile?.name || 'Jagadish K',
          channelId: 'workspace_files'
        });

        if (res && res.success && res.attachment) {
          const a = res.attachment;
          onUploadFile({
            id: a.id,
            name: a.name,
            type: a.isImage ? 'Image' : (a.name.endsWith('.pdf') ? 'PDF' : 'Document'),
            size: a.size ? `${(a.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
            modified: new Date(a.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            downloadUrl: backendBridge.getDownloadUrl(a.id),
            previewUrl: backendBridge.getPreviewUrl(a.id),
            isImage: a.isImage
          });
        }
      } catch (err) {
        console.error('[UPLOAD ERROR]', err);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // 2. Browser fallback: click hidden HTML file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleHtmlFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await backendBridge.uploadFile(file, {
        uploaderId: userProfile?.name || 'Jagadish K',
        channelId: 'workspace_files'
      });

      if (res && res.success && res.attachment) {
        const a = res.attachment;
        onUploadFile({
          id: a.id,
          name: a.name,
          type: a.isImage ? 'Image' : (a.name.endsWith('.pdf') ? 'PDF' : 'Document'),
          size: a.size ? `${(a.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          modified: new Date(a.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          downloadUrl: backendBridge.getDownloadUrl(a.id),
          previewUrl: backendBridge.getPreviewUrl(a.id),
          isImage: a.isImage
        });
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = (file) => {
    if (file.dataUrl) {
      const a = document.createElement('a');
      a.href = file.dataUrl;
      a.download = file.name || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const url = file.downloadUrl || backendBridge.getDownloadUrl(file.id);
    window.open(url, '_blank');
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file from the storage gateway?')) {
      await backendBridge.deleteAttachment(fileId);
      onDeleteFile(fileId);
    }
  };

  // Filter files by category & search query
  const filteredFiles = files.filter(f => {
    const nameMatch = (f.name || '').toLowerCase().includes(searchFile.toLowerCase());
    if (!nameMatch) return false;

    if (selectedCategory === 'all') return true;
    const ext = ((f.name || '').split('.').pop() || '').toLowerCase();
    const t = String(f.type || '').toLowerCase();

    if (selectedCategory === 'images') {
      return t.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext);
    }
    if (selectedCategory === 'docs') {
      return t.includes('pdf') || t.includes('doc') || ['pdf', 'txt', 'csv', 'md'].includes(ext);
    }
    if (selectedCategory === 'code') {
      return ['js', 'jsx', 'ts', 'tsx', 'cpp', 'h', 'py', 'json', 'html', 'css'].includes(ext);
    }
    if (selectedCategory === 'archives') {
      return ['zip', 'rar', 'tar', 'gz', '7z'].includes(ext);
    }
    return true;
  });

  // Extract all previewable images for carousel
  const allImageFiles = filteredFiles
    .filter(f => f.isImage || (f.type && String(f.type).toLowerCase().includes('image')) || (f.name && /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(f.name)))
    .map(f => ({
      src: f.dataUrl || f.previewUrl || f.url || ((f.name || f.id) ? backendBridge.getPreviewUrl(f.name || f.id) : null),
      title: f.name,
      size: f.size,
      downloadUrl: f.downloadUrl || f.dataUrl || ((f.name || f.id) ? backendBridge.getDownloadUrl(f.name || f.id) : null)
    }))
    .filter(img => Boolean(img.src));

  return (
    <div className="files-cloud-view">
      {/* Hidden File Input for Browser / Web Fallback */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleHtmlFileChange} 
      />

      {/* Header */}
      <div className="view-header">
        <div className="view-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>Files &amp; Cloud</h1>
            <span className="badge">
              {files.length} Files Available
            </span>
          </div>
          <p>Secure Enterprise Storage Bridge &bull; Cloud Vault &amp; Workspace Assets.</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className="btn btn-primary" 
            onClick={handleTriggerUpload}
            disabled={isUploading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isUploading ? <RefreshCw size={14} className="spin" /> : <Upload size={14} />}
            <span>{isUploading ? 'Uploading to Gateway...' : 'Upload File'}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 18, alignItems: 'start' }}>
        {/* Left Column: My Files & Cloud Storage Widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Navigation Tree */}
          <div className="card-panel">
            <div className="panel-header">
              <span className="panel-title">Filter by Category</span>
            </div>
            <div style={{ padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {navCategories.map(cat => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? 'var(--bg-active-nav)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      transition: 'background 0.12s'
                    }}
                  >
                    <Icon size={14} />
                    <span>{cat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cloud Storage Widget */}
          <div className="card-panel">
            <div className="panel-header">
              <span className="panel-title">Storage Architecture</span>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
                <span>{storageStats.totalBytesUsedFormatted || `${files.length * 1.5} MB`} used</span>
                <span style={{ color: 'var(--text-primary)' }}>{storageStats.totalFiles || files.length} files</span>
              </div>

              {/* Storage Meter Bar */}
              <div style={{
                height: 6,
                background: 'var(--border-dim)',
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(8, (files.length * 5)))}%`,
                  background: 'var(--text-primary, #111827)'
                }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                <Cloud size={13} color="#10b981" />
                <span style={{ fontWeight: 600 }}>{storageStats.storageMode || 'Google Drive Cloud'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Search, File Table */}
        <div className="card-panel">
          {/* Subheader with search */}
          <div style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)'
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
              <span>REDDOT Workspace Cloud</span> &gt; <span style={{ color: 'var(--text-primary)' }}>Storage Gateway</span>
            </div>

            <div className="search-omnibox" style={{ width: 240, height: 32 }}>
              <Search size={13} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Search files..." 
                value={searchFile}
                onChange={e => setSearchFile(e.target.value)}
              />
              {searchFile && (
                <button className="win-btn" onClick={() => setSearchFile('')} style={{ width: 18, height: 18 }}>
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Files Table Container */}
          {filteredFiles.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Cloud size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                No files found
              </div>
              <p style={{ fontSize: 12, maxWidth: 360, margin: '0 auto 16px' }}>
                Click "Upload File" above to upload attachments, blueprints, code, or documents to the private gateway.
              </p>
              <button className="btn btn-primary" onClick={handleTriggerUpload}>
                <Upload size={14} />
                <span>Upload First File</span>
              </button>
            </div>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 220px)', minHeight: 320, overflowY: 'auto' }}>
              <table className="tech-table">
                <thead>
                  <tr style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)' }}>
                    <th style={{ width: '36px', background: 'var(--bg-subtle)' }}></th>
                    <th style={{ background: 'var(--bg-subtle)' }}>NAME</th>
                    <th style={{ width: '120px', background: 'var(--bg-subtle)' }}>TYPE</th>
                    <th style={{ width: '100px', background: 'var(--bg-subtle)' }}>SIZE</th>
                    <th style={{ width: '150px', background: 'var(--bg-subtle)' }}>MODIFIED</th>
                    <th style={{ width: '90px', textAlign: 'center', background: 'var(--bg-subtle)' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map(file => {
                    const isImg = file.isImage === true || 
                      (file.type && String(file.type).toLowerCase().includes('image')) ||
                      (file.mimeType && String(file.mimeType).toLowerCase().startsWith('image/')) ||
                      (file.name && /\.(png|jpe?g|webp|gif|svg|bmp|ico)$/i.test(file.name));

                    const previewSrc = file.dataUrl || file.previewUrl || file.url || ((file.name || file.id) ? backendBridge.getPreviewUrl(file.name || file.id) : null);

                    const openPreview = () => {
                      if (isImg && previewSrc) {
                        setPreviewImage({
                          src: previewSrc,
                          title: file.name,
                          size: file.size,
                          downloadUrl: file.downloadUrl || previewSrc
                        });
                      }
                    };

                    return (
                      <tr key={file.id}>
                        <td>
                          <input type="checkbox" style={{ cursor: 'pointer', accentColor: '#111827' }} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {isImg && previewSrc ? (
                              <div 
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: 4,
                                  overflow: 'hidden',
                                  border: '1px solid var(--border-color)',
                                  flexShrink: 0,
                                  cursor: 'pointer',
                                  background: 'rgba(0,0,0,0.1)'
                                }}
                                onClick={openPreview}
                                title="Click to preview image"
                              >
                                <img 
                                  src={previewSrc} 
                                  alt={file.name} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              getFileIcon(file.type, file.name)
                            )}
                            <span 
                              style={{ 
                                fontWeight: 600, 
                                cursor: (isImg && previewSrc) ? 'pointer' : 'default',
                                color: (isImg && previewSrc) ? 'var(--text-primary)' : 'inherit'
                              }}
                              onClick={openPreview}
                              title={(isImg && previewSrc) ? 'Click to preview' : file.name}
                            >
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{file.type || 'Document'}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{file.size || '1.0 MB'}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{file.modified || 'Today'}</td>
                        <td style={{ textAlign: 'center', position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            {isImg && previewSrc && (
                              <button 
                                className="icon-btn" 
                                title="Preview Image"
                                onClick={openPreview}
                                style={{ width: 26, height: 26 }}
                              >
                                <Eye size={13} />
                              </button>
                            )}
                            <button 
                              className="icon-btn" 
                              title="Download File"
                              onClick={() => handleDownload(file)}
                              style={{ width: 26, height: 26 }}
                            >
                              <Download size={13} />
                            </button>
                            <button 
                              className="icon-btn" 
                              title="Delete File"
                              onClick={() => handleDelete(file.id)}
                              style={{ width: 26, height: 26, color: 'var(--accent-red, #ef4444)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <ImagePreviewModal 
          image={previewImage} 
          images={allImageFiles}
          onClose={() => setPreviewImage(null)} 
        />
      )}
    </div>
  );
}
