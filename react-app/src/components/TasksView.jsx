import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  List, 
  LayoutGrid, 
  Trash2, 
  Edit3, 
  FileText, 
  X, 
  Paperclip, 
  CheckSquare, 
  Square, 
  Image as ImageIcon, 
  Calendar, 
  Tag, 
  ChevronLeft, 
  ChevronRight,
  Bold,
  Italic,
  Underline,
  Heading,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';
import ImagePreviewModal from './ImagePreviewModal';

/**
 * Parses inline formatting:
 * - URLs -> Underlined clickable blue links
 * - **bold** -> <strong>
 * - *italic* -> <em>
 * - _underline_ or <u> -> <span style="text-decoration: underline">
 * - `code` -> <code>
 */
function parseInlineFormatting(str) {
  if (!str) return '';
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = str.split(urlRegex);

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noreferrer" 
          style={{ 
            color: 'var(--accent-blue, #2563eb)', 
            textDecoration: 'underline', 
            fontWeight: 700,
            cursor: 'pointer',
            wordBreak: 'break-all'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (typeof window !== 'undefined' && window.electronAPI?.openExternal) {
              e.preventDefault();
              window.electronAPI.openExternal(part);
            }
          }}
        >
          {part}
        </a>
      );
    }

    const tokenRegex = /(\*\*.*?\*\*|_.*?_|<u>.*?<\/u>|\*.*?\*|`.*?`)/g;
    const tokens = part.split(tokenRegex);

    return tokens.map((token, j) => {
      if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
        return <strong key={`${i}_${j}`} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
        return (
          <code key={`${i}_${j}`} style={{
            background: 'var(--bg-active-nav, rgba(0,0,0,0.06))',
            padding: '2px 5px',
            borderRadius: 4,
            fontFamily: 'monospace',
            fontSize: '0.9em',
            color: 'var(--text-primary)'
          }}>
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
        return <em key={`${i}_${j}`} style={{ fontStyle: 'italic' }}>{token.slice(1, -1)}</em>;
      }
      if (token.startsWith('_') && token.endsWith('_') && token.length >= 2) {
        return <span key={`${i}_${j}`} style={{ textDecoration: 'underline' }}>{token.slice(1, -1)}</span>;
      }
      if (token.startsWith('<u>') && token.endsWith('</u>')) {
        return <span key={`${i}_${j}`} style={{ textDecoration: 'underline' }}>{token.slice(3, -4)}</span>;
      }
      return token;
    });
  });
}

/**
 * Renders rich formatted task description with:
 * - Clear section headers with accent border and uppercase bold
 * - Indented bullet points / deliverables
 * - Underlined links
 * - Spaced paragraphs (line-height 1.6)
 */
function renderFormattedDescription(text) {
  if (!text || !text.trim()) {
    return (
      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px 0', textAlign: 'center', fontSize: 12 }}>
        No detailed description provided for this task. Click "Edit Task" to add specifications.
      </div>
    );
  }

  const lines = text.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = (key) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list_${key}`} style={{ margin: '6px 0 10px 18px', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {currentList.map((item, idx) => (
            <li key={idx} style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--text-primary)' }}>
              {item}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushList(index);
      elements.push(<div key={`sp_${index}`} style={{ height: 6 }} />);
      return;
    }

    // Alignment tags: [center]...[/center] or [right]...[/right] or [left]...[/left]
    if (line.startsWith('[center]') && line.endsWith('[/center]')) {
      flushList(index);
      elements.push(
        <div key={`center_${index}`} style={{ textAlign: 'center', margin: '4px 0', fontSize: 12, color: 'var(--text-primary)' }}>
          {parseInlineFormatting(line.slice(8, -9))}
        </div>
      );
      return;
    }
    if (line.startsWith('[right]') && line.endsWith('[/right]')) {
      flushList(index);
      elements.push(
        <div key={`right_${index}`} style={{ textAlign: 'right', margin: '4px 0', fontSize: 12, color: 'var(--text-primary)' }}>
          {parseInlineFormatting(line.slice(7, -8))}
        </div>
      );
      return;
    }
    if (line.startsWith('[left]') && line.endsWith('[/left]')) {
      flushList(index);
      elements.push(
        <div key={`left_${index}`} style={{ textAlign: 'left', margin: '4px 0', fontSize: 12, color: 'var(--text-primary)' }}>
          {parseInlineFormatting(line.slice(6, -7))}
        </div>
      );
      return;
    }

    // Markdown Heading 3: ### Heading
    if (line.startsWith('### ')) {
      flushList(index);
      elements.push(
        <div 
          key={`h3_${index}`}
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            letterSpacing: '0.4px',
            color: 'var(--text-primary)',
            marginTop: index === 0 ? 0 : 12,
            marginBottom: 6,
            paddingBottom: 4,
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span style={{ width: 4, height: 12, background: 'var(--text-primary)', borderRadius: 2 }} />
          <span>{line.slice(4)}</span>
        </div>
      );
      return;
    }

    // Detect section headers
    const upper = line.toUpperCase();
    const isSectionHeader = upper.startsWith('TASK:') || 
                           upper.startsWith('REQUIREMENT') || 
                           upper === 'DELIVERABLES' || 
                           upper === 'REPORT REQUIREMENTS' || 
                           upper === 'EXPECTED OUTCOME' || 
                           upper === 'DELIVERABLES:' ||
                           upper === 'SCOPE' ||
                           upper.startsWith('PHASE ');

    if (isSectionHeader) {
      flushList(index);
      elements.push(
        <div 
          key={`header_${index}`}
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            letterSpacing: '0.4px',
            color: 'var(--text-primary)',
            marginTop: index === 0 ? 0 : 12,
            marginBottom: 6,
            paddingBottom: 4,
            borderBottom: '1px solid var(--border-color)',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span style={{ width: 4, height: 12, background: 'var(--text-primary)', borderRadius: 2 }} />
          <span>{line}</span>
        </div>
      );
      return;
    }

    // Detect bullet or numbered items
    const isBullet = line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ') || /^\d+[.)]\s/.test(line);
    const isKnownDeliverableItem = [
      'UI design changes', 'UX improvements', 'Layout and alignment', 'Typography and color',
      'Navigation changes', 'Hero section enhancements', 'New features', 'Removed or modified',
      'Avatar/character', 'Loading screen', 'Animation and transition', 'Mobile responsiveness',
      'Cross-browser', 'SEO enhancements', 'Performance optimizations', 'Content modifications',
      'Image and media', 'Contact and inquiry', 'Security-related', 'Accessibility', 'Any minor visual',
      'Compare old vs.', 'Include screenshots', 'Mention the business', 'Highlight critical',
      'Create a clear', 'Document even minute'
    ].some(prefix => line.startsWith(prefix));

    if (isBullet || isKnownDeliverableItem) {
      const cleanText = line.replace(/^[-•*]\s*/, '').replace(/^\d+[.)]\s*/, '');
      currentList.push(parseInlineFormatting(cleanText));
      return;
    } else {
      flushList(index);
    }

    // Sub-labels like "Old Website: ...", "New Website: ...", "Team,"
    if (line.startsWith('Old Website:') || line.startsWith('New Website:') || line === 'Team,' || line.endsWith(':')) {
      elements.push(
        <div key={`sublbl_${index}`} style={{ fontSize: 12, fontWeight: 700, margin: '6px 0 2px 0', color: 'var(--text-primary)' }}>
          {parseInlineFormatting(line)}
        </div>
      );
      return;
    }

    // Standard body paragraph
    elements.push(
      <p key={`p_${index}`} style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '4px 0' }}>
        {parseInlineFormatting(line)}
      </p>
    );
  });

  flushList('final');
  return elements;
}

/**
 * Rich Formatting Toolbar & Markdown Description Editor
 * Provides one-click formatting: Bold, Italic, Underline, Bullets, Numbers, Alignments, Headings, Code, and Live Preview.
 */
function RichDescriptionEditor({
  value = '',
  onChange,
  placeholder = 'Enter task scope, specifications, or deliverables...',
  minRows = 3,
  label = 'TASK DESCRIPTION'
}) {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef(null);

  const applyFormatting = (prefix, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = value || '';
    const selectedText = currentVal.substring(start, end) || defaultText;

    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);

    const replacement = `${prefix}${selectedText}${suffix}`;
    const nextValue = before + replacement + after;
    onChange(nextValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  const applyLinePrefix = (prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = value || '';

    const lastNewline = currentVal.lastIndexOf('\n', start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const nextNewline = currentVal.indexOf('\n', end);
    const lineEnd = nextNewline === -1 ? currentVal.length : nextNewline;

    const selectedLines = currentVal.substring(lineStart, lineEnd);
    const transformed = selectedLines
      .split('\n')
      .map(line => `${prefix}${line.replace(/^[-•*]\s*|^\d+[.)]\s*/, '')}`)
      .join('\n');

    const nextValue = currentVal.substring(0, lineStart) + transformed + currentVal.substring(lineEnd);
    onChange(nextValue);

    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const applyAlignment = (align) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = value || '';
    const selectedText = currentVal.substring(start, end) || 'Centered Content';

    if (align === 'left') {
      const cleaned = selectedText.replace(/\[center\]|\[\/center\]|\[right\]|\[\/right\]|\[left\]|\[\/left\]/g, '');
      const nextValue = currentVal.substring(0, start) + cleaned + currentVal.substring(end);
      onChange(nextValue);
    } else {
      applyFormatting(`[${align}]`, `[/${align}]`, `${align === 'center' ? 'Center' : 'Right'} Aligned Text`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            fontSize: 10.5,
            fontWeight: 600,
            borderRadius: 4,
            border: '1px solid var(--border-color)',
            background: isPreview ? 'var(--control-background, #22262B)' : 'transparent',
            color: isPreview ? '#FFFFFF' : 'var(--text-secondary)',
            cursor: 'pointer'
          }}
          title={isPreview ? 'Back to Editor' : 'Live Preview Description'}
        >
          {isPreview ? <EyeOff size={11} /> : <Eye size={11} />}
          <span>{isPreview ? 'Edit' : 'Preview'}</span>
        </button>
      </div>

      {/* Formatting Toolbar */}
      {!isPreview && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 3,
            padding: '4px 6px',
            background: 'var(--bg-subtle, rgba(0,0,0,0.03))',
            border: '1px solid var(--border-color)',
            borderBottom: 'none',
            borderRadius: '6px 6px 0 0'
          }}
        >
          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24, padding: 0 }}
            onClick={() => applyFormatting('**', '**', 'Bold text')}
            title="Bold (**text**)"
          >
            <Bold size={13} />
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24, padding: 0 }}
            onClick={() => applyFormatting('*', '*', 'Italic text')}
            title="Italic (*text*)"
          >
            <Italic size={13} />
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24, padding: 0 }}
            onClick={() => applyFormatting('<u>', '</u>', 'Underlined text')}
            title="Underline (<u>text</u>)"
          >
            <Underline size={13} />
          </button>

          <span style={{ width: 1, height: 16, background: 'var(--border-color)', margin: '0 2px' }} />

          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24, padding: 0 }}
            onClick={() => applyLinePrefix('• ')}
            title="Bullet List (• item)"
          >
            <List size={13} />
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24, padding: 0 }}
            onClick={() => applyLinePrefix('1. ')}
            title="Numbered List (1. item)"
          >
            <ListOrdered size={13} />
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24, padding: 0 }}
            onClick={() => applyLinePrefix('TASK: ')}
            title="Section Heading (TASK: ...)"
          >
            <Heading size={13} />
          </button>

          <span style={{ width: 1, height: 16, background: 'var(--border-color)', margin: '0 2px' }} />

          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24, padding: 0 }}
            onClick={() => applyAlignment('left')}
            title="Align Left"
          >
            <AlignLeft size={13} />
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24, padding: 0 }}
            onClick={() => applyAlignment('center')}
            title="Align Center ([center]...[/center])"
          >
            <AlignCenter size={13} />
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24, padding: 0 }}
            onClick={() => applyAlignment('right')}
            title="Align Right ([right]...[/right])"
          >
            <AlignRight size={13} />
          </button>

          <span style={{ width: 1, height: 16, background: 'var(--border-color)', margin: '0 2px' }} />

          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24, padding: 0 }}
            onClick={() => applyFormatting('`', '`', 'code')}
            title="Inline Code (`code`)"
          >
            <Code size={13} />
          </button>
        </div>
      )}

      {/* Editor Body or Preview */}
      {isPreview ? (
        <div 
          style={{
            minHeight: minRows * 30,
            maxHeight: 220,
            overflowY: 'auto',
            padding: '10px 12px',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            fontSize: 12
          }}
        >
          {renderFormattedDescription(value)}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="input-control"
          rows={minRows}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            resize: 'vertical',
            borderRadius: '0 0 6px 6px',
            borderTop: 'none',
            fontFamily: 'inherit',
            fontSize: 12,
            lineHeight: 1.55
          }}
        />
      )}
    </div>
  );
}

export function TasksView({ 
  tasks = [], 
  onAddTask, 
  onUpdateTask,
  onToggleTask, 
  onDeleteTask, 
  onUpdateStatus,
  onToggleSubtask,
  teamMembers = [] 
}) {
  const [activeTab, setActiveTab] = useState('all'); // all, in_progress, completed, pending
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMember, setSelectedMember] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'board'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // Task object being edited

  // Selected Task for Detail Drawer
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id || '01');

  // Form State for Add Task
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(teamMembers[0]?.name || 'Jagadish K');
  const [newTaskDueDate, setNewTaskDueDate] = useState('Today, 5:00 PM');
  const [newTaskPriority, setNewTaskPriority] = useState('High');
  const [newTaskCategory, setNewTaskCategory] = useState('Engineering');
  const [modalSubtasks, setModalSubtasks] = useState([]);
  const [modalSubtaskInput, setModalSubtaskInput] = useState('');

  // Subtask Creation State in Detail Box
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [subtaskImage, setSubtaskImage] = useState(null); // base64 dataUrl
  const [subtaskImageName, setSubtaskImageName] = useState('');
  const [subtaskImageSize, setSubtaskImageSize] = useState('');
  const subtaskFileInputRef = useRef(null);

  // Task Document Attachment State & Ref
  const docFileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getDocIcon = (filename = '', mimeType = '') => {
    const ext = String(filename).split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext) || (mimeType && mimeType.startsWith('image/'))) {
      return ImageIcon;
    }
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'cpp', 'c', 'cs', 'java', 'sql'].includes(ext)) {
      return Code;
    }
    return FileText;
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !selectedTask) return;

    let pendingFiles = files.length;
    const newDocs = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newDocs.push({
          id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: formatFileSize(file.size),
          rawSize: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl: event.target.result,
          uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          uploadedBy: 'Jagadish K'
        });

        pendingFiles--;
        if (pendingFiles === 0) {
          const existingDocs = Array.isArray(selectedTask.documents) ? selectedTask.documents : [];
          const updatedDocs = [...existingDocs, ...newDocs];
          const updatedTask = { ...selectedTask, documents: updatedDocs };
          if (typeof onUpdateTask === 'function') {
            onUpdateTask(updatedTask);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    if (docFileInputRef.current) docFileInputRef.current.value = '';
  };

  const handleDeleteDocument = (docId, e) => {
    if (e) e.stopPropagation();
    if (!selectedTask) return;
    const existingDocs = Array.isArray(selectedTask.documents) ? selectedTask.documents : [];
    const updatedDocs = existingDocs.filter(d => d.id !== docId);
    const updatedTask = { ...selectedTask, documents: updatedDocs };
    if (typeof onUpdateTask === 'function') {
      onUpdateTask(updatedTask);
    }
  };

  const handleDownloadDocument = (doc, e) => {
    if (e) e.stopPropagation();
    if (!doc || !doc.dataUrl) return;
    const link = document.createElement('a');
    link.href = doc.dataUrl;
    link.download = doc.name || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Lightbox Preview for Subtask Images
  const [previewImage, setPreviewImage] = useState(null);

  // Drag and Drop State for Kanban Board
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Deduplicate tasks: ensures identical tasks (same title & assignee) are unified
  const deduplicatedTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    const seen = new Map();
    tasks.forEach(t => {
      if (!t) return;
      const normTitle = String(t.title || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const normAssignee = String(t.assignedTo || t.assignee || '').trim().toLowerCase();
      const key = normTitle ? `${normTitle}__${normAssignee}` : String(t.id);
      if (!seen.has(key)) {
        seen.set(key, t);
      } else {
        const existing = seen.get(key);
        const existingSubs = Array.isArray(existing.subtasks) ? existing.subtasks.length : 0;
        const currentSubs = Array.isArray(t.subtasks) ? t.subtasks.length : 0;
        if (currentSubs > existingSubs) {
          seen.set(key, t);
        }
      }
    });
    return Array.from(seen.values());
  }, [tasks]);

  // Count by status from clean deduplicated tasks
  const inProgressCount = deduplicatedTasks.filter(t => t.status === 'In Progress').length;
  const completedCount = deduplicatedTasks.filter(t => t.completed || t.status === 'Completed').length;
  const pendingCount = deduplicatedTasks.filter(t => t.status === 'Pending').length;

  // Filter tasks from deduplicatedTasks
  const filteredTasks = deduplicatedTasks.filter(task => {
    if (activeTab === 'in_progress' && task.status !== 'In Progress') return false;
    if (activeTab === 'completed' && !(task.completed || task.status === 'Completed')) return false;
    if (activeTab === 'pending' && task.status !== 'Pending') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (task.title || '').toLowerCase().includes(q);
      const matchAssignee = (task.assignedTo || task.assignee || '').toLowerCase().includes(q);
      if (!matchTitle && !matchAssignee) return false;
    }

    if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;
    if (selectedMember !== 'all' && (task.assignedTo !== selectedMember && task.assignee !== selectedMember)) return false;
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;
    if (selectedStatus !== 'all' && task.status !== selectedStatus) return false;

    return true;
  });

  const selectedTask = deduplicatedTasks.find(t => t.id === selectedTaskId) || deduplicatedTasks[0] || null;

  // Subtasks for selected task (Real subtasks only, no fake dummy data)
  const currentSubtasks = useMemo(() => {
    if (!selectedTask) return [];
    if (Array.isArray(selectedTask.subtasks)) {
      return selectedTask.subtasks.map(s => ({
        ...s,
        done: Boolean(s.completed || s.done)
      }));
    }
    return [];
  }, [selectedTask]);

  const doneSubtasksCount = currentSubtasks.filter(s => s.done).length;
  const subtasksPercent = currentSubtasks.length > 0 ? Math.round((doneSubtasksCount / currentSubtasks.length) * 100) : 0;

  // Handle Create Task
  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newId = `task_${Date.now()}`;
    const taskObj = {
      id: newId,
      title: newTaskTitle.trim().toUpperCase(),
      description: newTaskDescription.trim(),
      assignedTo: newTaskAssignee,
      dueDate: newTaskDueDate,
      priority: newTaskPriority,
      status: 'Pending',
      category: newTaskCategory,
      completed: false,
      subtasks: modalSubtasks.length > 0 ? modalSubtasks : []
    };

    onAddTask(taskObj);
    setSelectedTaskId(newId);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setModalSubtasks([]);
    setModalSubtaskInput('');
    setShowAddModal(false);
  };

  // Open Edit Task Modal
  const openEditModal = (task) => {
    if (!task) return;
    setEditingTask({
      id: task.id,
      title: task.title || '',
      description: task.description || '',
      assignedTo: task.assignedTo || teamMembers[0]?.name || 'Jagadish K',
      dueDate: task.dueDate || 'Today, 5:00 PM',
      priority: task.priority || 'High',
      status: task.status || 'Pending',
      category: task.category || 'Engineering',
      subtasks: Array.isArray(task.subtasks) ? [...task.subtasks] : []
    });
  };

  // Handle Save Edited Task
  const handleSaveEditTask = (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;

    const isCompleted = editingTask.status === 'Completed';
    const targetTask = tasks.find(t => t.id === editingTask.id) || selectedTask || {};
    const updated = {
      ...targetTask,
      ...editingTask,
      title: editingTask.title.trim().toUpperCase(),
      completed: isCompleted
    };

    if (typeof onUpdateTask === 'function') {
      onUpdateTask(updated);
    }
    setEditingTask(null);
  };

  // Toggle Subtask
  const toggleSubtask = (subId) => {
    if (!selectedTask) return;
    const existingList = Array.isArray(selectedTask.subtasks) ? selectedTask.subtasks : [];
    const target = existingList.find(s => s.id === subId);
    const nextDone = !(target?.done || target?.completed);

    const updatedSubtasks = existingList.map(s => {
      if (s.id === subId) {
        return { ...s, done: nextDone, completed: nextDone };
      }
      return s;
    });

    const updatedTask = {
      ...selectedTask,
      subtasks: updatedSubtasks
    };

    if (typeof onUpdateTask === 'function') {
      onUpdateTask(updatedTask);
    } else if (typeof onToggleSubtask === 'function') {
      onToggleSubtask(selectedTask.id, subId, nextDone);
    }
  };

  // Delete Subtask
  const handleDeleteSubtask = (subId, e) => {
    e.stopPropagation();
    if (!selectedTask) return;
    const existingList = Array.isArray(selectedTask.subtasks) ? selectedTask.subtasks : [];
    const updatedSubtasks = existingList.filter(s => s.id !== subId);
    const updatedTask = {
      ...selectedTask,
      subtasks: updatedSubtasks
    };

    if (typeof onUpdateTask === 'function') {
      onUpdateTask(updatedTask);
    }
  };

  // Subtask Image File Upload with automatic compression
  const handleSubtaskImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const compressed = await compressSubtaskImage(event.target.result, 800, 0.72);
        setSubtaskImage(compressed);
        setSubtaskImageName(file.name);
        // Calculate compressed size in KB
        const approxKb = Math.max(1, Math.round((compressed.length * 3 / 4) / 1024));
        setSubtaskImageSize(`${approxKb} KB`);
      } catch {
        setSubtaskImage(event.target.result);
        setSubtaskImageName(file.name);
        setSubtaskImageSize(`${Math.max(1, Math.round(file.size / 1024))} KB`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Subtask with optional compressed image
  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTask) return;

    const newSubtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: newSubtaskTitle.trim(),
      done: false,
      completed: false,
      ...(subtaskImage ? { image: subtaskImage } : {}),
      ...(subtaskImageName ? { imageName: subtaskImageName } : {}),
      ...(subtaskImageSize ? { imageSize: subtaskImageSize } : {})
    };

    const existingList = Array.isArray(selectedTask.subtasks) ? selectedTask.subtasks : [];
    const updatedTask = {
      ...selectedTask,
      subtasks: [...existingList, newSubtask]
    };

    if (typeof onUpdateTask === 'function') {
      onUpdateTask(updatedTask);
    }

    setNewSubtaskTitle('');
    setSubtaskImage(null);
    setSubtaskImageName('');
    setSubtaskImageSize('');
    if (subtaskFileInputRef.current) subtaskFileInputRef.current.value = '';
  };

  return (
    <div className="tasks-view" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="view-header" style={{ marginBottom: 0 }}>
        <div className="view-title-block">
          <h1>Tasks</h1>
          <p>Manage and track your tasks, assignments, and daily deliverables.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={14} />
          <span>Add Task</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="filter-tabs">
        <div 
          className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Tasks ({deduplicatedTasks.length})
        </div>
        <div 
          className={`filter-tab ${activeTab === 'in_progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('in_progress')}
        >
          In Progress ({inProgressCount})
        </div>
        <div 
          className={`filter-tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({completedCount})
        </div>
        <div 
          className={`filter-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingCount})
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group-left">
          {/* Search */}
          <div className="search-omnibox" style={{ width: 220 }}>
            <Search size={13} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Categories */}
          <select 
            className="select-control"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Engineering">Engineering</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Management">Management</option>
          </select>

          {/* Members */}
          <select 
            className="select-control"
            value={selectedMember}
            onChange={e => setSelectedMember(e.target.value)}
          >
            <option value="all">All Members</option>
            {teamMembers.map(m => (
              <option key={m.id || m.name} value={m.name}>{m.name}</option>
            ))}
          </select>

          {/* Priority */}
          <select 
            className="select-control"
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
          >
            <option value="all">Priority: All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Status */}
          <select 
            className="select-control"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="all">Status: All</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* View Switcher: List vs Board */}
        <div className="view-switcher">
          <button 
            className={`view-switcher-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={13} />
            <span>List</span>
          </button>
          <button 
            className={`view-switcher-btn ${viewMode === 'board' ? 'active' : ''}`}
            onClick={() => setViewMode('board')}
          >
            <LayoutGrid size={13} />
            <span>Board</span>
          </button>
        </div>
      </div>

      {/* Main Content: List Mode or Board Mode */}
      {viewMode === 'list' ? (
        <div 
            className="card-panel" 
            style={{ 
              maxHeight: selectedTask ? '185px' : 'calc(100vh - 230px)',
              minHeight: selectedTask ? '140px' : '200px',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <table className="tech-table">
              <thead>
                <tr style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-subtle)' }}>
                  <th style={{ width: '36px', background: 'var(--bg-subtle)' }}></th>
                  <th style={{ width: '130px', background: 'var(--bg-subtle)' }}>#</th>
                  <th style={{ background: 'var(--bg-subtle)' }}>TITLE</th>
                  <th style={{ width: '130px', background: 'var(--bg-subtle)' }}>ASSIGNED TO</th>
                  <th style={{ width: '130px', background: 'var(--bg-subtle)' }}>DUE DATE</th>
                  <th style={{ width: '90px', background: 'var(--bg-subtle)' }}>PRIORITY</th>
                  <th style={{ width: '130px', background: 'var(--bg-subtle)' }}>STATUS</th>
                  <th style={{ width: '90px', background: 'var(--bg-subtle)' }}>PROGRESS</th>
                  <th style={{ width: '80px', textAlign: 'center', background: 'var(--bg-subtle)' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No tasks match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task, idx) => {
                    const isCompleted = task.completed || task.status === 'Completed';
                    const isInProgress = task.status === 'In Progress';
                    const isSelected = selectedTask && selectedTask.id === task.id;
                    const taskSubs = Array.isArray(task.subtasks) ? task.subtasks : [];
                    const doneSubs = taskSubs.filter(s => s.done || s.completed).length;
                    const progressRatio = taskSubs.length > 0 ? `${doneSubs}/${taskSubs.length}` : (isCompleted ? '1/1' : '0/4');

                    return (
                      <tr 
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        style={{ 
                          cursor: 'pointer',
                          background: isSelected ? 'var(--bg-active-nav)' : 'transparent',
                          transition: 'background 0.1s ease'
                        }}
                      >
                        <td onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isCompleted}
                            onChange={() => onToggleTask(task.id)}
                            style={{ cursor: 'pointer', accentColor: '#111827' }}
                          />
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>
                          {task.id || `task_${idx + 1}`}
                        </td>
                        <td style={{ 
                          fontWeight: 600, 
                          color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: isCompleted ? 'line-through' : 'none'
                        }}>
                          {task.title}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {task.assignedTo || 'Unassigned'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                          {task.dueDate || 'No due date'}
                        </td>
                        <td>
                          <span className={`badge ${task.priority === 'High' ? 'badge-priority-high' : ''}`}>
                            {task.priority || 'Medium'}
                          </span>
                        </td>
                        <td>
                          {isCompleted ? (
                            <span className="badge badge-completed">● Completed</span>
                          ) : isInProgress ? (
                            <span className="badge badge-in-progress">● In Progress</span>
                          ) : (
                            <span className="badge badge-pending">● Pending</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                          {progressRatio}
                        </td>
                        <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <button 
                              className="icon-btn" 
                              title="Edit Task Info" 
                              style={{ width: 24, height: 24 }}
                              onClick={() => openEditModal(task)}
                            >
                              <Edit3 size={12} />
                            </button>
                            <button 
                              className="icon-btn" 
                              title="Delete Task" 
                              style={{ width: 24, height: 24, color: 'var(--text-muted)' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                              onClick={() => onDeleteTask(task.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { key: 'Pending', label: 'PENDING', dotColor: 'var(--text-muted, #777F88)' },
            { key: 'In Progress', label: 'IN PROGRESS', dotColor: 'var(--text-secondary, #515860)' },
            { key: 'Completed', label: 'COMPLETED', dotColor: 'var(--text-primary, #17191C)' }
          ].map(({ key: colStatus, label, dotColor }) => {
            const colTasks = filteredTasks.filter(t => 
              colStatus === 'Completed' ? (t.completed || t.status === 'Completed') : t.status === colStatus
            );
            const isDropTarget = dragOverColumn === colStatus;

            return (
              <div 
                key={colStatus} 
                className="card-panel" 
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverColumn !== colStatus) setDragOverColumn(colStatus);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget)) return;
                  setDragOverColumn(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const tId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                  if (tId) {
                    onUpdateStatus(tId, colStatus);
                    if (colStatus === 'Completed') onToggleTask(tId, true);
                  }
                  setDraggedTaskId(null);
                  setDragOverColumn(null);
                }}
                style={{ 
                  background: isDropTarget ? 'var(--bg-active-nav)' : 'var(--bg-subtle)',
                  border: isDropTarget ? '2px dashed var(--text-primary, #17191C)' : '1px solid var(--border-color)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Column Header */}
                <div className="panel-header" style={{ 
                  background: 'var(--bg-surface)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--text-primary)' }}>{label}</span>
                    <span className="badge" style={{ fontSize: 10, padding: '1px 6px' }}>{colTasks.length}</span>
                  </div>
                  <button 
                    type="button"
                    className="icon-btn" 
                    style={{ width: 22, height: 22 }} 
                    title={`Add Task to ${colStatus}`}
                    onClick={() => {
                      setNewTaskCategory('Engineering');
                      setNewTaskPriority('High');
                      setShowAddModal(true);
                    }}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Column Cards Drop Zone */}
                <div style={{ 
                  padding: 12, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 10, 
                  minHeight: 220, 
                  maxHeight: selectedTask ? 250 : 'calc(100vh - 280px)',
                  overflowY: 'auto'
                }}>
                  {colTasks.length === 0 ? (
                    <div style={{ 
                      color: 'var(--text-muted)', 
                      fontSize: 11, 
                      textAlign: 'center', 
                      marginTop: 36,
                      border: '1px dashed var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '24px 12px'
                    }}>
                      {isDropTarget ? 'Drop task here to move' : `No tasks in ${colStatus}`}
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const isSelected = selectedTask && selectedTask.id === task.id;
                      const isBeingDragged = draggedTaskId === task.id;
                      const taskSubs = Array.isArray(task.subtasks) ? task.subtasks : [];
                      const doneSubs = taskSubs.filter(s => s.done || s.completed).length;
                      const subPercent = taskSubs.length > 0 ? Math.round((doneSubs / taskSubs.length) * 100) : (task.completed ? 100 : 0);

                      return (
                        <div 
                          key={task.id} 
                          draggable={true}
                          onDragStart={(e) => {
                            setDraggedTaskId(task.id);
                            e.dataTransfer.setData('text/plain', task.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverColumn(null);
                          }}
                          onClick={() => setSelectedTaskId(task.id)}
                          style={{
                            background: 'var(--bg-surface)',
                            border: isSelected ? '1.5px solid var(--text-primary)' : '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '12px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            boxShadow: isSelected ? 'var(--shadow-medium)' : 'var(--shadow-subtle)',
                            cursor: 'grab',
                            opacity: isBeingDragged ? 0.45 : 1,
                            transform: isBeingDragged ? 'scale(0.98)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* Card Header: ID, Category & Priority */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ 
                              fontSize: 9.5, 
                              fontWeight: 700, 
                              fontFamily: 'var(--font-mono)', 
                              color: 'var(--text-muted)',
                              letterSpacing: '0.4px'
                            }}>
                              #{task.id}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ 
                                fontSize: 9, 
                                fontWeight: 600, 
                                padding: '1px 5px', 
                                borderRadius: 3, 
                                background: 'var(--bg-active-nav)', 
                                color: 'var(--text-secondary)' 
                              }}>
                                {task.category || 'General'}
                              </span>
                              <span className={`badge ${task.priority === 'High' ? 'badge-priority-high' : ''}`} style={{ fontSize: 9.5, padding: '1px 6px' }}>
                                {task.priority || 'Medium'}
                              </span>
                            </div>
                          </div>

                          {/* Card Title */}
                          <div style={{ 
                            fontWeight: 600, 
                            fontSize: 12, 
                            color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: task.completed ? 'line-through' : 'none',
                            lineHeight: 1.35
                          }}>
                            {task.title}
                          </div>

                          {/* Subtasks Progress Bar (if task has deliverables) */}
                          {taskSubs.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 2 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <CheckSquare size={11} /> {doneSubs}/{taskSubs.length} subtasks
                                </span>
                                <span>{subPercent}%</span>
                              </div>
                              <div style={{ height: 4, background: 'var(--border-dim)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ width: `${subPercent}%`, height: '100%', background: 'var(--text-primary)', transition: 'width 0.2s' }} />
                              </div>
                            </div>
                          )}

                          {/* Card Footer: Assignee, Due Date & Quick Shift Actions */}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            paddingTop: 6, 
                            borderTop: '1px solid var(--border-color)', 
                            marginTop: 2 
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                              <div style={{
                                width: 18, height: 18, borderRadius: '50%', background: '#111827', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700, flexShrink: 0
                              }}>
                                {(task.assignedTo || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: 10.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 85 }}>
                                {task.assignedTo || 'Unassigned'}
                              </span>
                            </div>

                            {/* Card Quick Actions: Move, Edit, Delete */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={e => e.stopPropagation()}>
                              {/* Move Back (if in In Progress or Completed) */}
                              {colStatus !== 'Pending' && (
                                <button
                                  type="button"
                                  className="icon-btn"
                                  style={{ width: 20, height: 20, padding: 0 }}
                                  title={colStatus === 'Completed' ? "Move back to In Progress" : "Move back to Pending"}
                                  onClick={() => {
                                    const prevStatus = colStatus === 'Completed' ? 'In Progress' : 'Pending';
                                    onUpdateStatus(task.id, prevStatus);
                                  }}
                                >
                                  <ChevronLeft size={12} />
                                </button>
                              )}

                              {/* Move Forward (if in Pending or In Progress) */}
                              {colStatus !== 'Completed' && (
                                <button
                                  type="button"
                                  className="icon-btn"
                                  style={{ width: 20, height: 20, padding: 0 }}
                                  title={colStatus === 'Pending' ? "Advance to In Progress" : "Mark Completed"}
                                  onClick={() => {
                                    const nextStatus = colStatus === 'Pending' ? 'In Progress' : 'Completed';
                                    onUpdateStatus(task.id, nextStatus);
                                    if (nextStatus === 'Completed') onToggleTask(task.id, true);
                                  }}
                                >
                                  <ChevronRight size={12} />
                                </button>
                              )}

                              {/* Edit Modal */}
                              <button 
                                type="button"
                                className="icon-btn" 
                                style={{ width: 20, height: 20, padding: 0 }}
                                onClick={() => openEditModal(task)}
                                title="Edit Task"
                              >
                                <Edit3 size={11} />
                              </button>

                              {/* Delete Task */}
                              <button 
                                type="button"
                                className="icon-btn" 
                                style={{ width: 20, height: 20, padding: 0, color: 'var(--text-muted)' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                onClick={() => onDeleteTask(task.id)}
                                title="Delete Task"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Task Detail Drawer & Subtasks with Board Info Type Layout (rendered in both List & Board modes) */}
{/* Selected Task Detail Drawer & Subtasks with Board Info Type Layout */}
          {selectedTask && (
            <div className="card-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Detail Header with Breadcrumb and Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: 10, 
                    fontWeight: 700, 
                    padding: '2px 7px', 
                    background: 'var(--bg-active-nav)', 
                    borderRadius: 3, 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)'
                  }}>
                    #{selectedTask.id}
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.3, color: 'var(--text-primary)' }}>
                    {selectedTask.title}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button 
                    className="btn" 
                    style={{ height: 28, padding: '0 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}
                    onClick={() => openEditModal(selectedTask)}
                  >
                    <Edit3 size={12} />
                    <span>Edit Task</span>
                  </button>
                  <button className="icon-btn" title="Close Detail" onClick={() => setSelectedTaskId(null)} style={{ width: 28, height: 28 }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Board Info Type Properties Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 10,
                padding: '10px 14px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)'
              }}>
                {/* ASSIGNEE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--text-muted)' }}>ASSIGNEE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: '#111827', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0
                    }}>
                      {(selectedTask.assignedTo || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedTask.assignedTo || 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* STATUS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--text-muted)' }}>STATUS</span>
                  <div>
                    <span className={`badge ${selectedTask.status === 'Completed' ? 'badge-completed' : (selectedTask.status === 'In Progress' ? 'badge-in-progress' : 'badge-pending')}`}>
                      ● {selectedTask.status || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* PRIORITY */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--text-muted)' }}>PRIORITY</span>
                  <div>
                    <span className={`badge ${selectedTask.priority === 'High' ? 'badge-priority-high' : ''}`}>
                      {selectedTask.priority || 'Medium'}
                    </span>
                  </div>
                </div>

                {/* DUE DATE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--text-muted)' }}>DUE DATE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Calendar size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedTask.dueDate || 'Today, 5:00 PM'}</span>
                  </div>
                </div>

                {/* CATEGORY */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--text-muted)' }}>CATEGORY</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Tag size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedTask.category || 'Engineering'}</span>
                  </div>
                </div>

                {/* PROGRESS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--text-muted)' }}>PROGRESS</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>{doneSubtasksCount}/{currentSubtasks.length} ({subtasksPercent}%)</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border-dim)', borderRadius: 3, overflow: 'hidden', marginTop: 3 }}>
                    <div style={{ width: `${subtasksPercent}%`, height: '100%', background: 'var(--text-primary)', transition: 'width 0.2s' }} />
                  </div>
                </div>
              </div>

              {/* Main Content Split: Formatted Description (Left) & Subtasks with Images (Right) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1.15fr', gap: 18, alignItems: 'start' }}>
                {/* Left Column: Formatted Description & Documents */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Formatted Description Card */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        <FileText size={13} />
                        <span>Description &amp; Specifications</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Rich Text &bull; Auto-Formatted</span>
                    </div>

                    <div style={{
                      padding: '14px 16px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      maxHeight: 280,
                      overflowY: 'auto',
                      fontSize: 12
                    }}>
                      {renderFormattedDescription(selectedTask.description)}
                    </div>
                  </div>

                  {/* Task Documents & Attachments Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        <Paperclip size={13} />
                        <span>Task Documents &amp; Attachments</span>
                        {Array.isArray(selectedTask?.documents) && selectedTask.documents.length > 0 && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({selectedTask.documents.length})</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => docFileInputRef.current?.click()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          fontSize: 10.5,
                          fontWeight: 600,
                          borderRadius: 4,
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-subtle)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                        title="Upload specification document, diagram, or reference file"
                      >
                        <Plus size={12} />
                        <span>Add Document</span>
                      </button>
                      <input 
                        type="file"
                        ref={docFileInputRef}
                        onChange={handleDocumentUpload}
                        multiple
                        style={{ display: 'none' }}
                      />
                    </div>

                    {/* Document List or Empty State */}
                    {Array.isArray(selectedTask?.documents) && selectedTask.documents.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                        {selectedTask.documents.map(doc => {
                          const DocIcon = getDocIcon(doc.name, doc.type);
                          return (
                            <div
                              key={doc.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-xs)',
                                gap: 10
                              }}
                            >
                              <div 
                                style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, cursor: 'pointer' }}
                                onClick={() => handleDownloadDocument(doc)}
                                title={`Click to download/open ${doc.name}`}
                              >
                                <DocIcon size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                  <span style={{ fontSize: 11.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {doc.name}
                                  </span>
                                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                    {doc.size || 'Attachment'} {doc.uploadedAt ? `· ${doc.uploadedAt}` : ''}
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  style={{ width: 22, height: 22, color: 'var(--text-secondary)' }}
                                  onClick={() => handleDownloadDocument(doc)}
                                  title="Download / Open File"
                                >
                                  <Download size={12} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  style={{ width: 22, height: 22, color: 'var(--text-muted)' }}
                                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                  onClick={(e) => handleDeleteDocument(doc.id, e)}
                                  title="Remove Document"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div 
                        onClick={() => docFileInputRef.current?.click()}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '16px 12px',
                          border: '1px dashed var(--border-color)',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-subtle, rgba(0,0,0,0.02))',
                          cursor: 'pointer',
                          gap: 6,
                          textAlign: 'center'
                        }}
                        title="Click to browse and upload documents"
                      >
                        <Paperclip size={18} color="var(--text-muted)" style={{ opacity: 0.7 }} />
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                          No documents attached
                        </span>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                          Click "+ Add Document" to attach PDFs, specs, or files.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Subtasks & Deliverables with Image Upload */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      <CheckSquare size={13} />
                      <span>Subtasks &amp; Deliverables</span>
                    </div>
                    <span className="badge" style={{ fontSize: 10 }}>
                      {doneSubtasksCount} of {currentSubtasks.length} Completed
                    </span>
                  </div>

                  {/* Subtasks List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                    {currentSubtasks.length === 0 ? (
                      <div style={{ 
                        padding: '12px 14px', 
                        textAlign: 'center', 
                        fontSize: 11, 
                        color: 'var(--text-muted)',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px dashed var(--border-color)'
                      }}>
                        No subtasks added yet. Type below to add deliverables or attach screenshots.
                      </div>
                    ) : currentSubtasks.map(st => (
                      <div 
                        key={st.id}
                        onClick={() => toggleSubtask(st.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          padding: '7px 10px',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-xs)',
                          cursor: 'pointer',
                          fontSize: 11.5,
                          transition: 'all 0.1s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          {st.done ? (
                            <CheckSquare size={14} color="var(--text-primary)" style={{ flexShrink: 0 }} />
                          ) : (
                            <Square size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          )}
                          <span style={{ 
                            textDecoration: st.done ? 'line-through' : 'none', 
                            color: st.done ? 'var(--text-muted)' : 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: st.done ? 400 : 500
                          }}>
                            {st.title}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                          {/* Attached Image Thumbnail */}
                          {st.image && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage({
                                  src: st.image,
                                  title: `${st.title} • Attached Image`,
                                  size: st.imageSize || '350 KB',
                                  downloadUrl: st.image
                                });
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 6px',
                                background: 'var(--bg-active-nav)',
                                borderRadius: 4,
                                border: '1px solid var(--border-color)',
                                cursor: 'pointer'
                              }}
                              title="Click to view attached screenshot"
                            >
                              <img 
                                src={st.image} 
                                alt="preview" 
                                style={{ width: 18, height: 18, borderRadius: 2, objectFit: 'cover' }} 
                              />
                              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>Image</span>
                            </div>
                          )}

                          {/* Delete Subtask Button */}
                          <button 
                            className="icon-btn" 
                            style={{ width: 20, height: 20 }}
                            onClick={(e) => handleDeleteSubtask(st.id, e)}
                            title="Delete subtask"
                          >
                            <X size={11} color="var(--text-muted)" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Subtask Form with Image Attachment Option */}
                  <form onSubmit={handleAddSubtask} style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input 
                        type="text"
                        className="input-control"
                        placeholder="Add subtask title..."
                        value={newSubtaskTitle}
                        onChange={e => setNewSubtaskTitle(e.target.value)}
                        style={{ flex: 1, height: 30, fontSize: 11 }}
                      />

                      {/* Hidden file input for subtask image */}
                      <input 
                        type="file" 
                        ref={subtaskFileInputRef} 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={handleSubtaskImageSelect} 
                      />

                      <button 
                        type="button" 
                        className="btn" 
                        title="Attach screenshot or design image to this subtask"
                        style={{ height: 30, padding: '0 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                        onClick={() => subtaskFileInputRef.current?.click()}
                      >
                        <ImageIcon size={13} />
                        <span>Attach Image</span>
                      </button>

                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={!newSubtaskTitle.trim()}
                        style={{ height: 30, padding: '0 10px', fontSize: 11 }}
                      >
                        <Plus size={13} />
                        <span>Add</span>
                      </button>
                    </div>

                    {/* Subtask Selected Image Chip Preview */}
                    {subtaskImage && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: 'var(--bg-active-nav)',
                        borderRadius: 4,
                        border: '1px solid var(--border-color)',
                        fontSize: 11
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <img src={subtaskImage} alt="preview" style={{ width: 22, height: 22, borderRadius: 2, objectFit: 'cover' }} />
                          <span style={{ fontWeight: 600 }}>{subtaskImageName || 'Screenshot.png'}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({subtaskImageSize || 'Image'})</span>
                        </div>
                        <button 
                          type="button" 
                          className="icon-btn" 
                          style={{ width: 18, height: 18 }} 
                          onClick={() => {
                            setSubtaskImage(null);
                            setSubtaskImageName('');
                            setSubtaskImageSize('');
                            if (subtaskFileInputRef.current) subtaskFileInputRef.current.value = '';
                          }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Edit Task Information</h3>
              <button className="icon-btn" onClick={() => setEditingTask(null)}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveEditTask}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label>TASK TITLE</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={editingTask.title}
                    onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <RichDescriptionEditor
                    value={editingTask.description}
                    onChange={val => setEditingTask({ ...editingTask, description: val })}
                    placeholder="Enter task scope, specifications, or deliverables..."
                    minRows={4}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>ASSIGNED TO</label>
                    <select 
                      className="select-control"
                      value={editingTask.assignedTo}
                      onChange={e => setEditingTask({ ...editingTask, assignedTo: e.target.value })}
                    >
                      {teamMembers.map(m => (
                        <option key={m.id || m.name} value={m.name}>{m.name} ({m.role || 'Member'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>DUE DATE</label>
                    <input 
                      type="text" 
                      className="input-control" 
                      value={editingTask.dueDate}
                      onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>PRIORITY</label>
                    <select 
                      className="select-control"
                      value={editingTask.priority}
                      onChange={e => setEditingTask({ ...editingTask, priority: e.target.value })}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>STATUS</label>
                    <select 
                      className="select-control"
                      value={editingTask.status}
                      onChange={e => setEditingTask({ ...editingTask, status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>CATEGORY</label>
                    <select 
                      className="select-control"
                      value={editingTask.category}
                      onChange={e => setEditingTask({ ...editingTask, category: e.target.value })}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setEditingTask(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Task</h3>
              <button className="icon-btn" onClick={() => setShowAddModal(false)}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label>TASK TITLE</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="e.g. DOC CARE APPLICATION GENERATION"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <RichDescriptionEditor
                    value={newTaskDescription}
                    onChange={val => setNewTaskDescription(val)}
                    placeholder="Optional scope or deliverable notes..."
                    minRows={3}
                  />
                </div>

                <div className="form-group">
                  <label>ASSIGNED TO</label>
                  <select 
                    className="select-control"
                    value={newTaskAssignee}
                    onChange={e => setNewTaskAssignee(e.target.value)}
                  >
                    {teamMembers.map(m => (
                      <option key={m.id || m.name} value={m.name}>{m.name} ({m.role || 'Member'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>DUE DATE</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="e.g. Today, 5:00 PM or Tomorrow"
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>PRIORITY</label>
                    <select 
                      className="select-control"
                      value={newTaskPriority}
                      onChange={e => setNewTaskPriority(e.target.value)}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>CATEGORY</label>
                    <select 
                      className="select-control"
                      value={newTaskCategory}
                      onChange={e => setNewTaskCategory(e.target.value)}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>SUBTASKS & DELIVERABLES</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({modalSubtasks.length} subtasks)</span>
                  </label>
                  
                  {modalSubtasks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8, maxHeight: 110, overflowY: 'auto' }}>
                      {modalSubtasks.map((st, idx) => (
                        <div key={st.id || idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 8px',
                          background: 'var(--bg-subtle)',
                          borderRadius: 3,
                          fontSize: 11,
                          border: '1px solid var(--border-color)'
                        }}>
                          <span>{st.title}</span>
                          <button 
                            type="button" 
                            className="icon-btn" 
                            style={{ width: 18, height: 18 }}
                            onClick={() => setModalSubtasks(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6 }}>
                    <input 
                      type="text" 
                      className="input-control" 
                      placeholder="Add initial subtask..."
                      value={modalSubtaskInput}
                      onChange={e => setModalSubtaskInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (modalSubtaskInput.trim()) {
                            setModalSubtasks(prev => [...prev, {
                              id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 3),
                              title: modalSubtaskInput.trim(),
                              done: false,
                              completed: false
                            }]);
                            setModalSubtaskInput('');
                          }
                        }
                      }}
                      style={{ fontSize: 11, height: 30 }}
                    />
                    <button 
                      type="button" 
                      className="btn" 
                      style={{ height: 30, padding: '0 10px', fontSize: 11 }}
                      onClick={() => {
                        if (modalSubtaskInput.trim()) {
                          setModalSubtasks(prev => [...prev, {
                            id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 3),
                            title: modalSubtaskInput.trim(),
                            done: false,
                            completed: false
                          }]);
                          setModalSubtaskInput('');
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subtask Image Fullscreen Lightbox Modal */}
      {previewImage && (
        <ImagePreviewModal 
          image={previewImage} 
          onClose={() => setPreviewImage(null)} 
        />
      )}
    </div>
  );
}

export default TasksView;
