import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  Paperclip, 
  Send, 
  Smile, 
  CheckCheck,
  Check,
  FileText,
  Download,
  Info,
  X,
  Phone,
  Video,
  CornerUpLeft,
  Trash2,
  Copy,
  Plus,
  RefreshCw,
  Eye
} from 'lucide-react';
import { firebaseBridge } from '../services/firebaseBridge';
import { backendBridge } from '../services/backendBridge';
import ImagePreviewModal from './ImagePreviewModal';

const formatMessageDate = (timestamp) => {
  if (!timestamp) return 'Today';
  const d = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  if (isNaN(d.getTime())) return 'Today';

  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return d.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric', 
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
  });
};

// Rich message text formatter: handles URL linkification, search highlighting, and clean whitespace
const renderFormattedMessageText = (text, searchQuery) => {
  if (!text) return null;
  // Match standard URLs (http, https, www)
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, idx) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={`url_${idx}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--msg-link, #2563eb)',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            wordBreak: 'break-all',
            cursor: 'pointer',
            fontWeight: 600
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (window.electronAPI?.openExternal) {
              e.preventDefault();
              window.electronAPI.openExternal(part);
            }
          }}
        >
          {part}
        </a>
      );
    }

    if (searchQuery && part.toLowerCase().includes(searchQuery.toLowerCase())) {
      const qRegex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const subParts = part.split(qRegex);
      return (
        <React.Fragment key={`text_${idx}`}>
          {subParts.map((sub, sIdx) => 
            sub.toLowerCase() === searchQuery.toLowerCase() ? (
              <mark key={`mark_${sIdx}`} style={{ background: 'rgba(56, 189, 248, 0.35)', color: 'inherit', padding: '1px 3px', borderRadius: 3 }}>
                {sub}
              </mark>
            ) : sub
          )}
        </React.Fragment>
      );
    }

    return <React.Fragment key={`text_${idx}`}>{part}</React.Fragment>;
  });
};

const isCurrentMember = (member, name, email, uid) =>
  (!!email && member?.email?.toLowerCase() === email.toLowerCase()) ||
  (!!uid && (member?.uid === uid || member?.id === uid)) ||
  (!!name && member?.name?.toLowerCase() === name.toLowerCase());

export function MessagesView({ 
  conversations = [], 
  messages = {}, 
  onSendMessage, 
  onDeleteMessage,
  onToggleReaction,
  currentUser = 'Jagadish K',
  currentUserEmail = '',
  currentUserUid = '',
  currentUserEmpId = '',
  currentUserRole = '',
  onSyncCloudMessages,
  teamMembers = [],
  initialActiveChannelId = null,
  onSelectChannel = null,
  onStartCall = null
}) {
  const [activeChannelId, setActiveChannelId] = useState(initialActiveChannelId || conversations[0]?.id || 'general');
  const [prevInitialId, setPrevInitialId] = useState(initialActiveChannelId);

  if (initialActiveChannelId && initialActiveChannelId !== prevInitialId) {
    setPrevInitialId(initialActiveChannelId);
    setActiveChannelId(initialActiveChannelId);
  }

  const handleSelectChannel = (id) => {
    setActiveChannelId(id);
    if (typeof onSelectChannel === 'function') {
      onSelectChannel(id);
    }
  };
  const [inputText, setInputText] = useState('');
  const [searchChannel, setSearchChannel] = useState('');
  const [searchMessageQuery, setSearchMessageQuery] = useState('');
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [showChannelInfo, setShowChannelInfo] = useState(true);
  const [showReactionPickerId, setShowReactionPickerId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [modalTab, setModalTab] = useState('contact'); // 'contact' | 'channel'
  const [contactSearch, setContactSearch] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
  const [convFilter, setConvFilter] = useState('all'); // 'all' | 'channels' | 'direct'

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatFileInputRef = useRef(null);
  const currentUserIdentity = currentUserEmail || currentUserUid || currentUser;
  const selfDirectMessageId = currentUserIdentity
    ? firebaseBridge.getDeterministicDMChannelId(currentUserIdentity, currentUserIdentity)
    : '';

  const filteredConversations = useMemo(() => {
    const channelMap = new Map();
    conversations.forEach(c => {
      if (c.id === selfDirectMessageId) return;
      if (c.id?.includes('___rd_jagadi')) return;
      if (c.title === 'Direct Message' || c.id.includes('user_a')) return;
      channelMap.set(c.id, { ...c });
    });

    // Resolve any generic or unassigned DM titles using teamMembers
    channelMap.forEach((conv, chanId) => {
      if (!conv.isGroup) {
        const lowerChan = chanId.toLowerCase();
        for (const m of teamMembers) {
          if (!m || !m.name || isCurrentMember(m, currentUser, currentUserEmail, currentUserUid)) continue;
          const cleanEmail = (m.email || '').toLowerCase().replace(/[@.]/g, '_');
          const emailUser = m.email ? m.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_') : '';
          const cleanUid = (m.uid || m.id || '').toLowerCase();
          const mName = m.name.toLowerCase();

          if ((cleanEmail && lowerChan.includes(cleanEmail)) || 
              (emailUser && emailUser.length > 2 && lowerChan.includes(emailUser)) ||
              (cleanUid && cleanUid.length > 3 && lowerChan.includes(cleanUid)) ||
              (lowerChan.includes(mName.replace(/\s+/g, ''))) ||
              (mName.includes('tejaswini') && lowerChan.includes('tejaswini')) ||
              (mName.includes('pavithra') && (lowerChan.includes('pavithra') || lowerChan.includes('emp-002') || lowerChan.includes('emp_002')))) {
            const isSelf = isCurrentMember(m, currentUser, currentUserEmail, currentUserUid);
            const isTrulyOnline = isSelf || m.isOnline === true;
            conv.title = m.name;
            conv.name = m.name;
            conv.status = isTrulyOnline ? 'Online' : 'Offline';
            conv.isOnline = isTrulyOnline;
            conv.avatar = m.avatar || m.photoUrl || m.photoURL || './assets/id-card.png';
            break;
          }
        }
      }
    });

    // Ensure every teammate has exactly ONE DM entry
    teamMembers.forEach(m => {
      const isSelf = isCurrentMember(m, currentUser, currentUserEmail, currentUserUid);
      if (isSelf || !m.name || m.name.toLowerCase().includes('teammate')) return;

      const cleanEmail = (m.email || '').toLowerCase().replace(/[@.]/g, '_');
      const directKey = firebaseBridge.getDeterministicDMChannelId(currentUserIdentity, m.email || m.uid || m.id);
      const isTrulyOnline = m.isOnline === true;

      let found = false;
      for (const [k, v] of channelMap.entries()) {
        const mName = m.name.toLowerCase();
        if (!v.isGroup && (
          v.title?.toLowerCase() === mName ||
          (cleanEmail && k.includes(cleanEmail)) ||
          (mName.includes('tejaswini') && k.includes('tejaswini')) ||
          (mName.includes('pavithra') && (k.includes('pavithra') || k.includes('emp-002') || k.includes('emp_002')))
        )) {
          found = true;
          v.title = m.name;
          v.name = m.name;
          v.status = isTrulyOnline ? 'Online' : 'Offline';
          v.isOnline = isTrulyOnline;
          v.avatar = m.avatar || m.photoUrl || m.photoURL || './assets/id-card.png';
          break;
        }
      }

      if (!found) {
        channelMap.set(directKey, {
          id: directKey,
          title: m.name,
          name: m.name,
          status: isTrulyOnline ? 'Online' : 'Offline',
          isOnline: isTrulyOnline,
          avatar: m.avatar || m.photoUrl || m.photoURL || './assets/id-card.png',
          membersCount: 2,
          time: isTrulyOnline ? 'Now' : (m.lastActive && m.lastActive !== 'Now' ? m.lastActive : 'Offline'),
          timestamp: 0,
          isGroup: false,
          lastMessage: isTrulyOnline ? 'Active now' : 'Start a direct chat'
        });
      }
    });

    // Ensure each channel and DM reflects the latest message timestamp and preview
    channelMap.forEach((conv, chanId) => {
      const chanMsgs = messages[chanId];
      if (Array.isArray(chanMsgs) && chanMsgs.length > 0) {
        const lastMsg = chanMsgs[chanMsgs.length - 1];
        const rawCreated = lastMsg.createdAt || lastMsg.timestamp;
        const lastMsgTime = typeof rawCreated === 'number' ? rawCreated : (rawCreated ? new Date(rawCreated).getTime() : 0);
        if (lastMsgTime > (conv.timestamp || 0)) {
          conv.timestamp = lastMsgTime;
          conv.time = lastMsg.time || conv.time;
          conv.lastMessage = lastMsg.text || (lastMsg.attachments?.length ? 'Sent an attachment' : conv.lastMessage);
        }
      }
    });

    // Deduplicate so each teammate appears exactly once
    const seenNames = new Set();
    const uniqueConversations = [];

    Array.from(channelMap.values())
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .forEach(c => {
        if (c.isGroup) {
          uniqueConversations.push(c);
        } else {
          const key = (c.title || c.name || '').toLowerCase();
          if (key && !seenNames.has(key) && key !== 'direct message') {
            seenNames.add(key);
            uniqueConversations.push(c);
          }
        }
      });

    const groupChannels = [];
    const directMessages = [];

    uniqueConversations
      .filter(c => {
        if (convFilter === 'channels' && !c.isGroup) return false;
        if (convFilter === 'direct' && c.isGroup) return false;
        if (!searchChannel.trim()) return true;
        const q = searchChannel.toLowerCase();
        return (c.title || '').toLowerCase().includes(q) ||
               (c.name || '').toLowerCase().includes(q) ||
               (c.lastMessage && c.lastMessage.toLowerCase().includes(q));
      })
      .forEach(c => {
        if (c.isGroup) groupChannels.push(c);
        else directMessages.push(c);
      });

    // 1. Group Channels ranking: # general ALWAYS #1 on top, other groups by recent activity
    groupChannels.sort((a, b) => {
      const isAGen = a.id === 'general' || (a.title && a.title.toLowerCase().includes('general'));
      const isBGen = b.id === 'general' || (b.title && b.title.toLowerCase().includes('general'));
      if (isAGen && !isBGen) return -1;
      if (!isAGen && isBGen) return 1;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    // 2. Direct Messages ranking: sorted by recent activity
    directMessages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (convFilter === 'channels') return groupChannels;
    if (convFilter === 'direct') return directMessages;

    // In 'All' view: Groups ranked on top, Personal Direct Messages below
    return [...groupChannels, ...directMessages];
  }, [conversations, messages, teamMembers, searchChannel, convFilter, currentUserIdentity, currentUserEmail, currentUserUid, currentUser, selfDirectMessageId]);

  const activeChannel = useMemo(() => {
    // 1. Search in filteredConversations first
    let found = filteredConversations.find(c => c.id === activeChannelId) ||
                filteredConversations.find(c => c.name?.toLowerCase() === (activeChannelId || '').toLowerCase() || c.title?.toLowerCase() === (activeChannelId || '').toLowerCase());

    // 2. Fallback to raw conversations
    if (!found) {
      found = conversations.find(c => c.id === activeChannelId) ||
              conversations.find(c => c.name?.toLowerCase() === (activeChannelId || '').toLowerCase() || c.title?.toLowerCase() === (activeChannelId || '').toLowerCase());
    }

    // 3. Fallback to first conversation
    if (!found) {
      found = filteredConversations[0] || conversations[0] || {
        id: activeChannelId || 'general',
        title: activeChannelId?.startsWith('#') ? activeChannelId : `# ${activeChannelId || 'general'}`,
        name: activeChannelId || 'general',
        membersCount: 6,
        isGroup: !String(activeChannelId || '').startsWith('dm_')
      };
    }

    const channelObj = { ...found };

    // 4. If it is a Direct Message or matches a teammate, strictly resolve the teammate
    const isDM = !channelObj.isGroup || String(channelObj.id || '').startsWith('dm_') || String(activeChannelId || '').startsWith('dm_');
    if (isDM) {
      channelObj.isGroup = false;
      const lowerChan = String(channelObj.id || activeChannelId || '').toLowerCase();
      const lowerTitle = String(channelObj.title || channelObj.name || '').toLowerCase();

      // Find the teammate who is NOT the current logged-in user
      const mate = teamMembers.find(m => {
        if (!m || !m.name) return false;
        const isSelf = isCurrentMember(m, currentUser, currentUserEmail, currentUserUid);
        if (isSelf) return false;
        const cleanEmail = (m.email || '').toLowerCase().replace(/[@.]/g, '_');
        const emailUser = m.email ? m.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_') : '';
        const cleanUid = (m.uid || m.id || '').toLowerCase();
        const mName = m.name.toLowerCase();

        return (cleanEmail && lowerChan.includes(cleanEmail)) ||
               (emailUser && emailUser.length > 2 && lowerChan.includes(emailUser)) ||
               (cleanUid && cleanUid.length > 3 && lowerChan.includes(cleanUid)) ||
               (lowerChan.includes(mName.replace(/\s+/g, ''))) ||
               (lowerTitle.includes(mName)) ||
               (mName.includes('tejaswini') && (lowerChan.includes('tejaswini') || lowerTitle.includes('tejaswini'))) ||
               (mName.includes('pavithra') && (lowerChan.includes('pavithra') || lowerChan.includes('emp-002') || lowerChan.includes('emp_002') || lowerTitle.includes('pavithra')));
      });

      if (mate) {
        channelObj.title = mate.name;
        channelObj.name = mate.name;
        channelObj.avatar = mate.avatar || mate.photoUrl || mate.photoURL || './assets/id-card.png';
        const mateSelf = isCurrentMember(mate, currentUser, currentUserEmail, currentUserUid);
        const mateLastSeen = Number(mate.lastSeenAt || 0);
        const mateOnline = mateSelf || (
          (mate.status === 'Online' || mate.isOnline) &&
          mate.status !== 'OFFLINE' &&
          mate.status !== 'Offline' &&
          mateLastSeen > 0 &&
          (Date.now() - mateLastSeen) < 120000
        );
        channelObj.status = mateOnline ? 'Online' : 'Offline';
        channelObj.isOnline = mateOnline;
        channelObj.member = { ...mate, status: channelObj.status, isOnline: mateOnline };
      }

      // Safeguard: NEVER let direct message avatar point to current user's photo
      if (channelObj.avatar && (channelObj.avatar.includes('profile-photo.jpeg') || channelObj.avatar.includes('1aE0qcOkewuGFzXtCTcUCrjOrRc1-6aRq'))) {
        const curMemberObj = teamMembers.find(m => isCurrentMember(m, currentUser, currentUserEmail, currentUserUid));
        if (curMemberObj && (curMemberObj.avatar?.includes('profile-photo.jpeg') || curMemberObj.avatar?.includes('1aE0qcOkewuGFzXtCTcUCrjOrRc1-6aRq'))) {
          channelObj.avatar = channelObj.member?.avatar || './assets/id-card.png';
        }
      }

      // Strip leading '#' if present for DMs
      if (channelObj.title && channelObj.title.startsWith('#')) {
        channelObj.title = channelObj.title.replace(/^#\s*/, '');
      }
    }

    return channelObj;
  }, [filteredConversations, conversations, activeChannelId, teamMembers]);

  const channelMessages = useMemo(() => {
    if (Array.isArray(messages[activeChannelId]) && messages[activeChannelId].length > 0) {
      return messages[activeChannelId];
    }
    // Alias check e.g. 'general' <-> 'team-general'
    if (activeChannelId === 'general' && Array.isArray(messages['team-general']) && messages['team-general'].length > 0) {
      return messages['team-general'];
    }
    // Case-insensitive or suffix/prefix match
    const foundKey = Object.keys(messages).find(k => {
      const lk = k.toLowerCase();
      const la = (activeChannelId || '').toLowerCase();
      return lk === la || lk.endsWith(la) || la.endsWith(lk);
    });
    if (foundKey && Array.isArray(messages[foundKey])) {
      return messages[foundKey];
    }
    return [];
  }, [messages, activeChannelId]);

  // Smooth scroll to bottom
  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [channelMessages.length, activeChannelId]);

  // Stable ref for message synchronization callback
  const onSyncCloudMessagesRef = useRef(onSyncCloudMessages);
  useEffect(() => {
    onSyncCloudMessagesRef.current = onSyncCloudMessages;
  }, [onSyncCloudMessages]);

  // Live Cloud Firestore Channel Messages Subscription
  const seenMessageIdsRef = useRef(new Set());
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (!activeChannelId) return;
    const unsub = firebaseBridge.subscribeChannelMessages(activeChannelId, (cloudMsgs) => {
      if (cloudMsgs && Array.isArray(cloudMsgs)) {
        // Trigger native notification for incoming new messages from other participants
        if (initialLoadDoneRef.current) {
          cloudMsgs.forEach(m => {
            const mId = m.id || `${m.timestamp}_${m.sender}`;
            if (!seenMessageIdsRef.current.has(mId)) {
              seenMessageIdsRef.current.add(mId);
              const isFromSelf = m.isSelf || m.isOutgoing || 
                (currentUser && m.sender?.toLowerCase() === currentUser.toLowerCase()) ||
                (currentUserEmail && m.senderEmail?.toLowerCase() === currentUserEmail.toLowerCase());
              if (!isFromSelf) {
                const senderName = m.senderDisplayName || m.sender || activeChannel.title || 'Teammate';
                const bodyText = m.text || (m.attachments?.length ? 'Sent an attachment' : 'New message');
                if (window.electronAPI?.showNotification) {
                  window.electronAPI.showNotification({
                    title: `${senderName} (${activeChannel.title || 'REDDOT Chat'})`,
                    body: bodyText
                  });
                } else if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(`${senderName} (${activeChannel.title || 'REDDOT Chat'})`, {
                    body: bodyText,
                    icon: './assets/id-card.png'
                  });
                }
              }
            }
          });
        } else {
          // Record initial existing messages so we don't spam notifications on channel open
          cloudMsgs.forEach(m => {
            const mId = m.id || `${m.timestamp}_${m.sender}`;
            seenMessageIdsRef.current.add(mId);
          });
          initialLoadDoneRef.current = true;
        }

        if (typeof onSyncCloudMessagesRef.current === 'function') {
          onSyncCloudMessagesRef.current(activeChannelId, cloudMsgs);
        }
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [activeChannelId, currentUser, currentUserEmail, activeChannel.title]);

  // Format current AM/PM time
  const formatCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Clipboard Paste Support (e.g. screenshots with Ctrl+V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const filesToRead = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) filesToRead.push(file);
      }
    }

    if (filesToRead.length > 0) {
      e.preventDefault();
      filesToRead.forEach((file, fIdx) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          setPendingAttachments(prev => [...prev, {
            id: `paste_${Date.now()}_${fIdx}`,
            name: `screenshot_${Date.now()}_${fIdx + 1}.png`,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: 'image/png',
            previewUrl: dataUrl,
            dataUrl: dataUrl,
            isImage: true
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Handle Real Attachment Upload via Gateway
  const handleAttachClick = async () => {
    if (typeof window !== 'undefined' && window.electronAPI?.selectAndUploadFile) {
      try {
        setIsUploading(true);
        const res = await backendBridge.uploadFile({
          useNativeDialog: true,
          channelId: activeChannelId,
          uploaderId: currentUser
        });
        if (res && res.success && res.attachment) {
          const a = res.attachment;
          setPendingAttachments(prev => [...prev, {
            id: a.id,
            name: a.name,
            size: a.size ? `${(a.size / 1024).toFixed(1)} KB` : '1.2 MB',
            type: a.isImage ? 'Image' : 'Document',
            downloadUrl: backendBridge.getDownloadUrl(a.id),
            previewUrl: backendBridge.getPreviewUrl(a.id),
            isImage: a.isImage
          }]);
        }
      } catch (err) {
        console.error('[ATTACHMENT ERROR]', err);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    if (chatFileInputRef.current) {
      chatFileInputRef.current.click();
    }
  };

  const handleChatFileSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setIsUploading(true);
      const newItems = [];

      for (const file of files) {
        let localDataUrl = null;
        const isImageFile = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);

        if (isImageFile) {
          try {
            localDataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(file);
            });
          } catch {}
        }

        try {
          const res = await backendBridge.uploadFile(file, {
            channelId: activeChannelId,
            uploaderId: currentUser
          });

          if (res && res.success && res.attachment) {
            const a = res.attachment;
            newItems.push({
              id: a.id,
              name: a.name || file.name,
              size: a.size ? `${(a.size / 1024).toFixed(1)} KB` : `${(file.size / 1024).toFixed(1)} KB`,
              type: a.isImage || isImageFile ? 'Image' : 'Document',
              downloadUrl: backendBridge.getDownloadUrl(a.id),
              previewUrl: localDataUrl || backendBridge.getPreviewUrl(a.id),
              dataUrl: localDataUrl,
              isImage: a.isImage || isImageFile
            });
          } else if (localDataUrl) {
            newItems.push({
              id: `local-${Date.now()}-${Math.random()}`,
              name: file.name,
              size: `${(file.size / 1024).toFixed(1)} KB`,
              type: 'Image',
              previewUrl: localDataUrl,
              dataUrl: localDataUrl,
              isImage: true
            });
          }
        } catch {
          if (localDataUrl) {
            newItems.push({
              id: `local-${Date.now()}-${Math.random()}`,
              name: file.name,
              size: `${(file.size / 1024).toFixed(1)} KB`,
              type: 'Image',
              previewUrl: localDataUrl,
              dataUrl: localDataUrl,
              isImage: true
            });
          }
        }
      }

      if (newItems.length > 0) {
        setPendingAttachments(prev => [...prev, ...newItems]);
      }
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleCopyText = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 1800);
    }).catch(() => {});
  };

  const handleStartDirectChat = (member) => {
    const directKey = firebaseBridge.getDeterministicDMChannelId(currentUserIdentity, member.email || member.uid || member.id);
    handleSelectChannel(directKey);
    setShowNewChannelModal(false);
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim() && pendingAttachments.length === 0) return;

    const timeStr = formatCurrentTime();
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: currentUser,
      senderDisplayName: currentUser,
      senderUid: currentUserUid,
      senderEmpId: currentUserEmpId || currentUserUid,
      senderEmail: currentUserEmail,
      senderRoleTag: currentUserRole,
      time: timeStr,
      timestamp: Date.now(),
      createdAt: Date.now(),
      text: inputText.trim(),
      isSelf: true,
      isSelfMsg: true,
      attachment: pendingAttachments[0] || null,
      attachments: [...pendingAttachments],
      reactions: {},
      replyTo: replyingTo ? {
        id: replyingTo.id,
        sender: replyingTo.sender,
        text: replyingTo.text || (replyingTo.attachments?.length ? 'Attachment' : '')
      } : null,
      status: 'READ'
    };

    onSendMessage(activeChannelId, newMsg);
    setInputText('');
    setPendingAttachments([]);
    setReplyingTo(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleCreateChannelSubmit = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    await firebaseBridge.createChannel(newChannelName.trim());
    setNewChannelName('');
    setShowNewChannelModal(false);
  };

  const handleStartCall = (isVideo = false) => {
    if (typeof onStartCall === 'function') {
      onStartCall({
        targetMember: activeChannel.member || {
          name: activeChannel.title || activeChannel.name,
          email: activeChannel.id?.includes('@') ? activeChannel.id : '',
          id: activeChannel.id
        },
        channelId: activeChannelId,
        isVideo
      });
      return;
    }

    const meetingUrl = `https://meet.jit.si/reddot-${activeChannelId || 'general'}`;
    const callTitle = `REDDOT ${isVideo ? 'Video' : 'Voice'} Call — #${activeChannel.title || activeChannelId}`;

    if (window.electronAPI?.openCallWindow) {
      window.electronAPI.openCallWindow({ url: meetingUrl, title: callTitle });
    } else {
      window.open(meetingUrl, '_blank', 'width=1100,height=750');
    }
  };



  const displayedMessages = useMemo(() => {
    if (!searchMessageQuery.trim()) return channelMessages;
    return channelMessages.filter(m => 
      m.text?.toLowerCase().includes(searchMessageQuery.toLowerCase()) ||
      m.sender?.toLowerCase().includes(searchMessageQuery.toLowerCase())
    );
  }, [channelMessages, searchMessageQuery]);

  return (
    <div className="messages-view">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={chatFileInputRef} 
        multiple
        style={{ display: 'none' }} 
        onChange={handleChatFileSelected} 
      />

      {/* Header */}
      <div className="view-header" style={{ marginBottom: 14 }}>
        <div className="view-title-block">
          <h1>Messages</h1>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: showChannelInfo ? '280px 1fr 280px' : '280px 1fr',
        gap: 16,
        height: 'calc(100vh - 150px)',
        minHeight: 520,
        transition: 'grid-template-columns 0.2s ease'
      }}>
        {/* =========================================================================
            LEFT COLUMN: CONVERSATIONS LIST
            ========================================================================= */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Conversations</span>
              <button 
                className="icon-btn" 
                title={convFilter === 'direct' ? "Start Direct Message" : "New Conversation / Channel"}
                onClick={() => {
                  setModalTab(convFilter === 'direct' ? 'contact' : 'channel');
                  setShowNewChannelModal(true);
                }}
                style={{ width: 24, height: 24 }}
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Conversation Category Filter Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {['all', 'channels', 'direct'].map(filterKey => (
                <button
                  key={filterKey}
                  className="win-btn"
                  onClick={() => setConvFilter(filterKey)}
                  style={{
                    flex: 1,
                    fontSize: 10.5,
                    padding: '3px 0',
                    fontWeight: convFilter === filterKey ? 700 : 500,
                    background: convFilter === filterKey ? 'var(--bg-card)' : 'transparent',
                    border: convFilter === filterKey ? '1px solid var(--border-color)' : '1px solid transparent',
                    color: convFilter === filterKey ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {filterKey === 'all' ? 'All' : (filterKey === 'channels' ? 'Channels' : 'Direct Messages')}
                </button>
              ))}
            </div>

            <div className="search-omnibox" style={{ width: '100%', height: 32 }}>
              <Search size={13} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={searchChannel}
                onChange={e => setSearchChannel(e.target.value)}
              />
              {searchChannel && (
                <button className="win-btn" onClick={() => setSearchChannel('')} style={{ width: 18, height: 18 }}>
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11.5 }}>
                No conversations found
              </div>
            ) : (
              filteredConversations.map((conv, cIdx) => {
                const isActive = conv.id === activeChannelId;
                const isDirect = !conv.isGroup;
                const isOnline = conv.status === 'Online';

                // In 'all' view, render section header when transitioning from groups to DMs or on the first item
                const showGroupHeader = convFilter === 'all' && cIdx === 0 && conv.isGroup;
                const prevConv = cIdx > 0 ? filteredConversations[cIdx - 1] : null;
                const showDmHeader = convFilter === 'all' && isDirect && (cIdx === 0 || (prevConv && prevConv.isGroup));

                return (
                  <React.Fragment key={conv.id}>
                    {showGroupHeader && (
                      <div style={{
                        padding: '10px 14px 4px 14px',
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        background: 'var(--bg-subtle, #F8FAFC)',
                        borderBottom: '1px solid var(--border-dim)'
                      }}>
                        Channels &amp; Groups
                      </div>
                    )}
                    {showDmHeader && (
                      <div style={{
                        padding: '12px 14px 4px 14px',
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        background: 'var(--bg-subtle, #F8FAFC)',
                        borderBottom: '1px solid var(--border-dim)',
                        borderTop: cIdx > 0 ? '1px solid var(--border-dim)' : 'none'
                      }}>
                        Direct Messages
                      </div>
                    )}
                    <div 
                      onClick={() => handleSelectChannel(conv.id)}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--border-dim)',
                        background: isActive ? 'var(--bg-active-nav)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                      }}
                    >
                      {/* Avatar / Channel Hash icon */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                      {isDirect ? (
                        <img 
                          src={conv.avatar || './assets/id-card.png'} 
                          alt="" 
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} 
                          onError={e => { e.target.src = './assets/id-card.png'; }}
                        />
                      ) : (
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 4,
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-dim)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 13,
                          color: 'var(--text-secondary)'
                        }}>
                          #
                        </div>
                      )}
                      {isDirect && (
                        <span 
                          className={`status-dot ${isOnline ? 'online' : 'offline'}`} 
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            border: '2px solid var(--bg-surface)'
                          }} 
                        />
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ 
                          fontWeight: isActive ? 700 : 600, 
                          fontSize: 12.5, 
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {conv.title}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 6 }}>
                          {conv.time || 'Live'}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {conv.lastMessage || (isDirect ? 'Direct conversation' : 'Active channel')}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          </div>
        </div>

        {/* =========================================================================
            CENTER COLUMN: ACTIVE CHAT SCREEN
            ========================================================================= */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Channel Header Bar */}
          <div style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {!activeChannel.isGroup && (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={activeChannel.avatar || './assets/id-card.png'} 
                    alt="" 
                    style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} 
                    onError={e => { e.target.src = './assets/id-card.png'; }}
                  />
                  <span 
                    className={`status-dot ${activeChannel.isOnline ? 'online' : 'offline'}`}
                    style={{ position: 'absolute', bottom: -1, right: -1, border: '2px solid var(--bg-surface)' }}
                  />
                </div>
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeChannel.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {activeChannel.isGroup ? (
                    `${activeChannel.membersCount || 7} participants • Secure Realtime Mesh`
                  ) : (
                    `${activeChannel.status || 'Offline'} • Direct Encrypted Conversation`
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button 
                className={`icon-btn ${showSearchInChat ? 'active' : ''}`}
                title="Search Messages in this Chat"
                style={{ background: showSearchInChat ? 'var(--bg-hover)' : 'transparent' }}
                onClick={() => setShowSearchInChat(!showSearchInChat)}
              >
                <Search size={15} />
              </button>
              <button 
                className="icon-btn" 
                title="Start Voice Call"
                onClick={() => handleStartCall(false)}
              >
                <Phone size={15} />
              </button>
              <button 
                className="icon-btn" 
                title="Start Video Meeting"
                onClick={() => handleStartCall(true)}
              >
                <Video size={15} />
              </button>
              <button 
                className="icon-btn" 
                title="Toggle Details"
                onClick={() => setShowChannelInfo(!showChannelInfo)}
              >
                <Info size={15} />
              </button>
            </div>
          </div>

          {/* In-Chat Message Search Bar */}
          {showSearchInChat && (
            <div style={{
              padding: '8px 16px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <Search size={13} color="var(--text-muted)" />
              <input 
                type="text" 
                className="input-control" 
                placeholder="Search messages in this conversation..."
                value={searchMessageQuery}
                onChange={e => setSearchMessageQuery(e.target.value)}
                style={{ flex: 1, height: 28, fontSize: 12 }}
                autoFocus
              />
              {searchMessageQuery && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {displayedMessages.length} match{displayedMessages.length === 1 ? '' : 'es'}
                </span>
              )}
              <button 
                className="win-btn" 
                style={{ width: 22, height: 22, padding: 0 }}
                onClick={() => {
                  setSearchMessageQuery('');
                  setShowSearchInChat(false);
                }}
                title="Close Search"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Messages Feed */}
          <div style={{
            flex: 1,
            padding: '16px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            background: 'var(--bg-surface)'
          }}>
            {displayedMessages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 13 }}>No messages in this channel yet.</p>
                <p style={{ fontSize: 11 }}>Send a greeting or attach a document below.</p>
              </div>
            ) : (
              displayedMessages.map((msg, mIdx) => {
                const isSelf = msg.isSelf || msg.sender === currentUser || msg.isOutgoing;
                const msgTs = msg.timestamp || (msg.createdAt ? (typeof msg.createdAt === 'number' ? msg.createdAt : new Date(msg.createdAt).getTime()) : 0);
                const currentDate = formatMessageDate(msgTs);
                const prevMsg = mIdx > 0 ? displayedMessages[mIdx - 1] : null;
                const prevMsgTs = prevMsg ? (prevMsg.timestamp || (prevMsg.createdAt ? (typeof prevMsg.createdAt === 'number' ? prevMsg.createdAt : new Date(prevMsg.createdAt).getTime()) : 0)) : 0;
                const prevDate = prevMsg ? formatMessageDate(prevMsgTs) : null;
                const showDateDivider = mIdx === 0 || currentDate !== prevDate;

                const allAttach = (msg.attachments && msg.attachments.length > 0)
                  ? msg.attachments
                  : (msg.attachment ? [msg.attachment] : []);

                const images = allAttach.filter(a => {
                  return a.isImage === true || 
                    Boolean(a.dataUrl) ||
                    (a.type && String(a.type).startsWith('image/')) || 
                    (a.mimeType && String(a.mimeType).startsWith('image/')) || 
                    (a.name && /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(a.name));
                });

                const docs = allAttach.filter(a => !images.includes(a));

                const mappedImages = images.map(img => {
                  const targetKey = img.name || img.id;
                  const previewSrc = img.dataUrl || img.previewUrl || img.url || (targetKey ? backendBridge.getPreviewUrl(targetKey) : null);
                  const downloadSrc = img.downloadUrl || (targetKey ? backendBridge.getDownloadUrl(targetKey) : null) || previewSrc;
                  return {
                    src: previewSrc,
                    title: img.name || 'Image Attachment',
                    size: img.size,
                    downloadUrl: downloadSrc
                  };
                });

                return (
                  <React.Fragment key={msg.id || mIdx}>
                    {showDateDivider && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '18px 0 10px 0',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          height: 1,
                          background: 'var(--border-color)',
                          zIndex: 1
                        }} />
                        <span style={{
                          position: 'relative',
                          zIndex: 2,
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 12,
                          padding: '3px 14px',
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          letterSpacing: '0.04em',
                          boxShadow: 'var(--shadow-subtle)'
                        }}>
                          {currentDate}
                        </span>
                      </div>
                    )}
                    <div 
                      className="chat-message-row"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isSelf ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        alignSelf: isSelf ? 'flex-end' : 'flex-start',
                        position: 'relative',
                        marginTop: 6,
                        marginBottom: 6
                      }}
                    >
                    {/* Sender Name & Time */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                      fontSize: 11,
                      color: 'var(--text-muted)'
                    }}>
                      {!isSelf && (
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {msg.sender}
                        </span>
                      )}
                      <span title={msgTs ? new Date(msgTs).toLocaleString() : undefined}>
                        {msg.time}
                      </span>
                      {isSelf && (
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {currentUser}
                        </span>
                      )}
                    </div>

                    {/* Relative Container for Bubble and Floating Action Toolbar */}
                    <div style={{ position: 'relative', maxWidth: '100%' }}>
                      {/* Hover Quick Action Bar floating smoothly without layout shift */}
                      <div 
                        className={`chat-message-actions ${showReactionPickerId === msg.id ? 'has-active-picker' : ''}`}
                        style={{
                          [isSelf ? 'right' : 'left']: 8
                        }}
                      >
                        {/* Reaction Picker Button */}
                        <div style={{ position: 'relative' }}>
                          <button 
                            type="button"
                            className="win-btn" 
                            style={{ width: 22, height: 22, padding: 0 }}
                            title="Add Reaction"
                            onClick={() => setShowReactionPickerId(showReactionPickerId === msg.id ? null : msg.id)}
                          >
                            <Smile size={12} />
                          </button>
                          {showReactionPickerId === msg.id && (
                            <div 
                              style={{
                                position: 'absolute',
                                bottom: 'calc(100% + 6px)',
                                [isSelf ? 'right' : 'left']: 0,
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 16,
                                boxShadow: 'var(--shadow-floating)',
                                display: 'flex',
                                gap: 4,
                                padding: '3px 8px',
                                zIndex: 50
                              }}
                            >
                              {['👍', '❤️', '🔥', '👏', '🎉', '💡'].map(emoji => (
                                <button
                                  key={emoji}
                                  type="button"
                                  className="win-btn"
                                  style={{ width: 24, height: 24, fontSize: 13, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                                  onClick={() => {
                                    if (typeof onToggleReaction === 'function') {
                                      onToggleReaction(activeChannelId, msg.id, emoji);
                                    }
                                    setShowReactionPickerId(null);
                                  }}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Reply button */}
                        <button 
                          type="button"
                          className="win-btn" 
                          style={{ width: 22, height: 22, padding: 0 }}
                          title="Reply to message"
                          onClick={() => {
                            setReplyingTo(msg);
                            if (inputRef.current) inputRef.current.focus();
                          }}
                        >
                          <CornerUpLeft size={12} />
                        </button>

                        {/* Copy text button */}
                        <button 
                          type="button"
                          className="win-btn" 
                          style={{ width: 22, height: 22, padding: 0 }}
                          title={copiedMsgId === msg.id ? "Copied!" : "Copy message"}
                          onClick={() => handleCopyText(msg.text, msg.id)}
                        >
                          {copiedMsgId === msg.id ? <Check size={12} color="var(--accent-green)" /> : <Copy size={12} />}
                        </button>

                        {/* Delete message button (if self or founder) */}
                        {isSelf && (
                          <button 
                            type="button"
                            className="win-btn" 
                            style={{ width: 22, height: 22, padding: 0, color: 'var(--accent-red)' }}
                            title="Delete message"
                            onClick={() => {
                              if (typeof onDeleteMessage === 'function') {
                                onDeleteMessage(activeChannelId, msg.id);
                              }
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      {/* Bubble */}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: isSelf ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                        fontSize: 12.5,
                        lineHeight: 1.55,
                        background: isSelf ? 'var(--msg-outgoing-bg, #E3E7EB)' : 'var(--bg-surface)',
                        border: isSelf ? '1px solid var(--msg-outgoing-border, #CBD2D9)' : '1px solid var(--border-color)',
                        color: isSelf ? 'var(--msg-outgoing-text, var(--text-primary))' : 'var(--text-primary)',
                        boxShadow: isSelf ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'var(--shadow-subtle)',
                        position: 'relative'
                      }}>
                        {/* Quoted Reply Block */}
                        {msg.replyTo && (
                          <div style={{
                            padding: '4px 8px',
                            marginBottom: 6,
                            borderLeft: '2px solid var(--text-muted)',
                            background: 'rgba(0, 0, 0, 0.04)',
                            borderRadius: 3,
                            fontSize: 11
                          }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                              {msg.replyTo.sender}
                            </div>
                            <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {msg.replyTo.text}
                            </div>
                          </div>
                        )}

                        {/* Text content with formatted URLs and search match highlight */}
                        {msg.text && (
                          <div style={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                          }}>
                            {renderFormattedMessageText(msg.text, searchMessageQuery)}
                          </div>
                        )}

                      {/* Attachments (Multi-Image & Document) Rendering */}
                      {allAttach.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {/* Single Image Card */}
                          {images.length === 1 && (() => {
                            const img = images[0];
                            const imgSrc = mappedImages[0]?.src;
                            return (
                              <div 
                                className="chat-image-thumbnail-wrapper"
                                style={{
                                  position: 'relative',
                                  borderRadius: 8,
                                  overflow: 'hidden',
                                  border: '1px solid var(--border-color)',
                                  background: 'rgba(0, 0, 0, 0.2)',
                                  cursor: 'pointer',
                                  maxWidth: 290,
                                  boxShadow: 'var(--shadow-subtle)',
                                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                                }}
                                onClick={() => setPreviewData({
                                  image: mappedImages[0],
                                  images: mappedImages,
                                  initialIndex: 0
                                })}
                                title="Click to view full image preview"
                              >
                                <img 
                                  src={imgSrc} 
                                  alt={img.name || 'Attachment'}
                                  style={{ display: 'block', width: '100%', maxHeight: 220, objectFit: 'cover' }}
                                  loading="lazy"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <div style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  padding: '6px 10px',
                                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 8,
                                  color: '#fff'
                                }}>
                                  <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Eye size={12} color="#38bdf8" />
                                    <span style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {img.name}
                                    </span>
                                  </div>
                                  <button 
                                    className="icon-btn" 
                                    title="Download Image"
                                    style={{ width: 22, height: 22, color: '#fff', background: 'rgba(255, 255, 255, 0.2)' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const url = img.downloadUrl || imgSrc || backendBridge.getDownloadUrl(img.id);
                                      if (url && url.startsWith('data:')) {
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = img.name || 'downloaded-image.png';
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                      } else if (url) {
                                        window.open(url, '_blank');
                                      }
                                    }}
                                  >
                                    <Download size={11} />
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Multiple Images Gallery Grid (2, 3, 4, 5+ images) */}
                          {images.length > 1 && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: images.length === 2 ? 'repeat(2, 1fr)' : (images.length === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'),
                              gap: 6,
                              maxWidth: images.length === 3 ? 380 : 320,
                              borderRadius: 8,
                              overflow: 'hidden'
                            }}>
                              {images.slice(0, 4).map((img, idx) => {
                                const imgSrc = mappedImages[idx]?.src;
                                const isLastOverflow = idx === 3 && images.length > 4;
                                const overflowCount = images.length - 3;

                                return (
                                  <div 
                                    key={img.id || idx}
                                    className="chat-image-thumbnail-wrapper"
                                    style={{
                                      position: 'relative',
                                      height: images.length === 2 ? 140 : 105,
                                      borderRadius: 6,
                                      overflow: 'hidden',
                                      border: '1px solid var(--border-color)',
                                      cursor: 'pointer',
                                      background: 'rgba(0,0,0,0.2)'
                                    }}
                                    onClick={() => setPreviewData({
                                      image: mappedImages[idx],
                                      images: mappedImages,
                                      initialIndex: idx
                                    })}
                                    title={isLastOverflow ? `+${overflowCount} more images` : (img.name || 'Click to preview')}
                                  >
                                    <img 
                                      src={imgSrc} 
                                      alt={img.name || ''} 
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      loading="lazy"
                                    />
                                    {isLastOverflow ? (
                                      <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'rgba(5, 7, 13, 0.78)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontWeight: 700,
                                        fontSize: 16
                                      }}>
                                        <span>+{overflowCount}</span>
                                        <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>more</span>
                                      </div>
                                    ) : (
                                      <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: '3px 6px',
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                                        color: '#fff',
                                        fontSize: 10,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                      }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                                          {img.name}
                                        </span>
                                        <Eye size={10} color="#38bdf8" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Documents List */}
                          {docs.map((doc, dIdx) => {
                            const previewUrl = doc.previewUrl || doc.dataUrl || doc.downloadUrl || backendBridge.getPreviewUrl(doc.id || doc.name);
                            const handleOpenDoc = () => {
                              setPreviewData({
                                image: {
                                  src: previewUrl,
                                  title: doc.name,
                                  name: doc.name,
                                  size: doc.size,
                                  downloadUrl: doc.downloadUrl || backendBridge.getDownloadUrl(doc.id || doc.name)
                                },
                                images: [{
                                  src: previewUrl,
                                  title: doc.name,
                                  name: doc.name,
                                  size: doc.size,
                                  downloadUrl: doc.downloadUrl || backendBridge.getDownloadUrl(doc.id || doc.name)
                                }],
                                initialIndex: 0
                              });
                            };

                            return (
                              <div 
                                key={doc.id || dIdx}
                                className="fallback-chip"
                                style={{
                                  display: 'flex',
                                  padding: '8px 10px',
                                  background: 'var(--bg-hover)',
                                  border: '1px solid var(--border-dim)',
                                  borderRadius: 'var(--radius-xs)',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 12,
                                  cursor: 'pointer'
                                }}
                                onClick={handleOpenDoc}
                                title="Click to preview file"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <FileText size={16} color="var(--accent-blue)" />
                                  <div>
                                    <div style={{ fontSize: 11.5, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '2px' }}>{doc.name}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{doc.size || 'Attachment'} &bull; Click to preview</div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                                  <button 
                                    className="icon-btn" 
                                    title="Preview File"
                                    onClick={handleOpenDoc}
                                    style={{ width: 24, height: 24 }}
                                  >
                                    <Eye size={12} />
                                  </button>
                                  <button 
                                    className="icon-btn" 
                                    title="Download Attachment"
                                    onClick={() => {
                                      const url = doc.downloadUrl || backendBridge.getDownloadUrl(doc.id || doc.name);
                                      window.open(url, '_blank');
                                    }}
                                    style={{ width: 24, height: 24 }}
                                  >
                                    <Download size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Interactive Reaction Pills */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                          {Object.entries(msg.reactions).map(([emoji, users]) => {
                            const userList = Array.isArray(users) ? users : [];
                            const hasReacted = userList.includes(currentUser);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                className="win-btn"
                                style={{
                                  fontSize: 11,
                                  padding: '1px 6px',
                                  borderRadius: 12,
                                  background: hasReacted ? 'var(--bg-hover)' : 'var(--bg-card)',
                                  border: '1px solid var(--border-color)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  if (typeof onToggleReaction === 'function') {
                                    onToggleReaction(activeChannelId, msg.id, emoji);
                                  }
                                }}
                                title={userList.join(', ')}
                              >
                                <span>{emoji}</span>
                                <span style={{ fontWeight: 700, fontSize: 10 }}>{userList.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Read Receipts */}
                      {isSelf && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{msg.time}</span>
                          <CheckCheck size={13} color="var(--msg-outgoing-check, var(--text-secondary))" title="Delivered &amp; Read" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </React.Fragment>
              );
            })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending Attachments Strip with Multiple Thumbnail Chips */}
          {pendingAttachments.length > 0 && (
            <div style={{
              padding: '8px 16px',
              background: 'var(--bg-subtle)',
              borderTop: '1px solid var(--border-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              overflowX: 'auto'
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                ATTACHMENTS ({pendingAttachments.length}):
              </div>
              {pendingAttachments.map((att, idx) => (
                <div key={att.id || idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  fontSize: 12,
                  flexShrink: 0
                }}>
                  {att.previewUrl || att.dataUrl ? (
                    <div 
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                        flexShrink: 0,
                        cursor: 'pointer'
                      }}
                      onClick={() => setPreviewData({
                        image: att,
                        images: pendingAttachments.filter(a => a.isImage || a.dataUrl),
                        initialIndex: idx
                      })}
                      title="Click to preview"
                    >
                      <img 
                        src={att.previewUrl || att.dataUrl} 
                        alt="Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                  ) : (
                    <Paperclip size={13} color="var(--text-secondary)" />
                  )}
                  <span style={{ fontWeight: 600, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {att.name}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10.5, flexShrink: 0 }}>
                    ({att.size})
                  </span>
                  <button 
                    className="win-btn" 
                    onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))} 
                    style={{ width: 16, height: 16, padding: 0, flexShrink: 0 }}
                    title="Remove attachment"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quoted Reply Banner */}
          {replyingTo && (
            <div style={{
              padding: '6px 14px',
              background: 'var(--bg-subtle)',
              borderTop: '1px solid var(--border-color)',
              borderLeft: '3px solid var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <CornerUpLeft size={13} color="var(--accent-blue)" />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Replying to {replyingTo.sender}:
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {replyingTo.text || (replyingTo.attachments?.length ? 'Sent an attachment' : 'Message')}
                </span>
              </div>
              <button 
                type="button"
                className="win-btn" 
                onClick={() => setReplyingTo(null)}
                style={{ width: 18, height: 18, padding: 0, flexShrink: 0 }}
                title="Cancel reply"
              >
                <X size={10} />
              </button>
            </div>
          )}

          {/* Chat Input Bar with Clipboard Paste */}
          <form 
            onSubmit={handleSend} 
            onPaste={handlePaste}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--bg-surface)'
            }}
          >
            <button 
              type="button" 
              className="icon-btn" 
              title="Attach File / Screenshot"
              onClick={handleAttachClick}
              disabled={isUploading}
            >
              {isUploading ? <RefreshCw size={15} className="spin" /> : <Paperclip size={15} />}
            </button>

            {/* Emoji Insert Picker (Theme-adaptive) */}
            <div style={{ position: 'relative' }}>
              <button 
                type="button" 
                className="icon-btn" 
                title="Insert Emoji"
                onClick={() => setShowInputEmojiPicker(prev => !prev)}
              >
                <Smile size={16} />
              </button>
              {showInputEmojiPicker && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 12px)',
                    left: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow-modal)',
                    padding: '10px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 32px)',
                    gap: 6,
                    zIndex: 100
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  {['👍', '❤️', '🔥', '👏', '🎉', '💡', '🚀', '✅', '👀', '💯', '🎯', '✨', '🤝', '🙏', '⚡', '📌', '😊', '💪', '🙌', '🏆', '💼', '💻', '📊', '📁'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      style={{
                        width: 32,
                        height: 32,
                        fontSize: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                        setInputText(prev => prev + emoji);
                        setShowInputEmojiPicker(false);
                        if (inputRef.current) inputRef.current.focus();
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input 
              ref={inputRef}
              type="text" 
              className="input-control" 
              placeholder="Type here..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onPaste={handlePaste}
              style={{ flex: 1, height: 36 }}
            />

            <button type="submit" className="btn btn-primary" style={{ height: 36, padding: '0 16px' }}>
              <Send size={14} />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: CHANNEL INFO & PARTICIPANTS
            ========================================================================= */}
        {showChannelInfo && (
          <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="panel-header">
              <span className="panel-title">{activeChannel.isGroup ? 'Channel Details' : 'Direct Conversation'}</span>
            </div>
            <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!activeChannel.isGroup ? (
                /* Direct Teammate Profile Card */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '12px 8px', background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border-dim)' }}>
                  <div style={{ position: 'relative', marginBottom: 10 }}>
                    <img
                      src={activeChannel.avatar || './assets/id-card.png'}
                      alt=""
                      style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
                      onError={e => { e.target.src = './assets/id-card.png'; }}
                    />
                    <span 
                      className={`status-dot ${activeChannel.isOnline ? 'online' : 'offline'}`}
                      style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, border: '2px solid var(--bg-surface)' }}
                    />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {activeChannel.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    {activeChannel.member?.role || 'Team Member'} &bull; {activeChannel.member?.department || activeChannel.member?.dept || 'Engineering'}
                  </div>
                  {activeChannel.member?.email && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, wordBreak: 'break-all' }}>
                      {activeChannel.member.email}
                    </div>
                  )}
                  <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'var(--bg-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                    <span className={`status-dot ${activeChannel.isOnline ? 'online' : 'offline'}`} style={{ position: 'static', width: 7, height: 7, flexShrink: 0, background: activeChannel.isOnline ? 'var(--text-primary)' : 'var(--text-muted)' }} />
                    {activeChannel.isOnline ? 'Active Online' : 'Currently Offline'}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>NAME</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{activeChannel.title}</div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {activeChannel.isGroup ? `TEAM PARTICIPANTS (${teamMembers.filter(m => m.status === 'Online').length} Online / ${teamMembers.length} Total)` : 'CONVERSATION PARTICIPANTS'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(() => {
                    let membersToList = [];
                    if (!activeChannel.isGroup) {
                      // Show current authenticated user AND the conversation partner
                      const currentUserObj = teamMembers.find(m => isCurrentMember(m, currentUser, currentUserEmail, currentUserUid)) || {
                        name: currentUser || 'User',
                        role: currentUserRole || 'Member',
                        department: 'Engineering',
                        avatar: './assets/id-card.png',
                        status: 'Online',
                        isOnline: true
                      };
                      const mate = activeChannel.member || teamMembers.find(m => m.name?.toLowerCase() === activeChannel.title?.toLowerCase() && !isCurrentMember(m, currentUser, currentUserEmail, currentUserUid)) || {
                        name: activeChannel.title,
                        role: 'Team Member',
                        department: 'Software & Web',
                        avatar: activeChannel.avatar,
                        status: activeChannel.status || 'Offline',
                        isOnline: !!activeChannel.isOnline
                      };
                      membersToList = [currentUserObj, mate];
                    } else {
                      // Deduplicate by name/email
                      const seen = new Set();
                      membersToList = teamMembers.filter(m => {
                        const key = (m.email || m.name || '').toLowerCase();
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                      });

                      // Sort online members first, then offline
                      membersToList.sort((a, b) => {
                        if (a.status === 'Online' && b.status !== 'Online') return -1;
                        if (a.status !== 'Online' && b.status === 'Online') return 1;
                        return (a.name || '').localeCompare(b.name || '');
                      });
                    }

                    return membersToList.map(m => {
                      const isOnline = m.status === 'Online' || m.isOnline;
                      const isSelf = isCurrentMember(m, currentUser, currentUserEmail, currentUserUid);
                      return (
                        <div 
                          key={m.id || m.uid || m.email || m.name} 
                          onClick={() => {
                            if (!isSelf && activeChannel.isGroup) handleStartDirectChat(m);
                          }}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 10,
                            padding: '4px 6px',
                            borderRadius: 4,
                            cursor: (isSelf || !activeChannel.isGroup) ? 'default' : 'pointer',
                            transition: 'background 0.12s ease'
                          }}
                          className={(isSelf || !activeChannel.isGroup) ? '' : 'fallback-chip'}
                          title={isSelf ? 'You (Workspace Founder)' : (activeChannel.isGroup ? `Click to message ${m.name}` : m.name)}
                        >
                          <img 
                            src={m.avatar || './assets/id-card.png'} 
                            alt={m.name} 
                            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} 
                            onError={e => { e.target.src = './assets/id-card.png'; }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {m.name} {isSelf ? '(You)' : ''}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{m.role || 'Member'} &bull; {m.department || m.dept || 'Engineering'}</div>
                          </div>
                          <span 
                            className={`status-dot ${isOnline ? 'online' : 'offline'}`} 
                            style={{ position: 'static', margin: '0 4px', flexShrink: 0 }}
                            title={isOnline ? 'Online' : 'Offline'}
                          />
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Start Direct Message or Create Channel Modal */}
      {showNewChannelModal && (
        <div className="modal-overlay" onClick={() => setShowNewChannelModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setModalTab('contact')}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: modalTab === 'contact' ? 700 : 500,
                    background: modalTab === 'contact' ? 'var(--bg-card)' : 'transparent',
                    border: modalTab === 'contact' ? '1px solid var(--border-color)' : '1px solid transparent',
                    color: modalTab === 'contact' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderRadius: 4,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Direct Message
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setModalTab('channel')}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: modalTab === 'channel' ? 700 : 500,
                    background: modalTab === 'channel' ? 'var(--bg-card)' : 'transparent',
                    border: modalTab === 'channel' ? '1px solid var(--border-color)' : '1px solid transparent',
                    color: modalTab === 'channel' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderRadius: 4,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  New Channel
                </button>
              </div>
              <button className="icon-btn" onClick={() => setShowNewChannelModal(false)}>
                <X size={15} />
              </button>
            </div>

            {modalTab === 'contact' ? (
              <div className="modal-body" style={{ maxHeight: 380, overflowY: 'auto' }}>
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Search team member to message..."
                    value={contactSearch}
                    onChange={e => setContactSearch(e.target.value)}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {teamMembers
                    .filter(m => {
                      const isSelf = isCurrentMember(m, currentUser, currentUserEmail, currentUserUid);
                      if (isSelf) return false;
                      if (!contactSearch.trim()) return true;
                      const q = contactSearch.toLowerCase();
                      return (m.name || '').toLowerCase().includes(q) || (m.role || '').toLowerCase().includes(q);
                    })
                    .map(m => {
                      const isOnline = m.status === 'Online' || m.isOnline;
                      return (
                        <div
                          key={m.id || m.uid || m.email}
                          onClick={() => handleStartDirectChat(m)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border-dim)',
                            borderRadius: 6,
                            cursor: 'pointer'
                          }}
                          className="chat-contact-item"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ position: 'relative' }}>
                              <img
                                src={m.avatar || './assets/id-card.png'}
                                alt=""
                                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                                onError={e => { e.target.src = './assets/id-card.png'; }}
                              />
                              <span
                                className={`status-dot ${isOnline ? 'online' : 'offline'}`}
                                style={{ position: 'absolute', bottom: -1, right: -1, border: '2px solid var(--bg-surface)' }}
                              />
                            </div>
                            <div>
                              <div style={{ fontSize: 12.5, fontWeight: 700 }}>{m.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {m.role || 'Member'} &bull; {m.department || m.dept || 'Engineering'}
                              </div>
                            </div>
                          </div>
                          <button type="button" className="btn" style={{ fontSize: 11, padding: '4px 10px' }}>
                            Message
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateChannelSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>CHANNEL NAME</label>
                    <input 
                      type="text" 
                      className="input-control" 
                      placeholder="e.g. sprint-15-deployment"
                      value={newChannelName}
                      onChange={e => setNewChannelName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={() => setShowNewChannelModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Channel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Lightbox Modal with Multi-Image Support */}
      {previewData && (
        <ImagePreviewModal 
          image={previewData.image} 
          images={previewData.images}
          initialIndex={previewData.initialIndex}
          onClose={() => setPreviewData(null)} 
        />
      )}
    </div>
  );
}

export default MessagesView;
