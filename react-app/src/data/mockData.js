export const INITIAL_TASKS = [
  {
    id: "task_1789309991954",
    title: "A.R W&T, GRANDS (DESIGN)",
    description: "VISITING CARD DESIGN",
    assignedTo: "JAGADISH K",
    assignedEmail: "jagadish2k2006@gmail.com",
    dueDate: "5:00 PM",
    priority: "High",
    status: "Completed",
    category: "Engineering",
    completed: true,
    subtasks: []
  },
  {
    id: "task_1792213668546",
    title: "DISCOVERY FUNCTION (SEM)",
    description: "The AI model for the SEM application needs to be completed and optimized for automatic data fetching from multiple sources.",
    assignedTo: "Jai Keerthi",
    assignedEmail: "keerthijai909@gmail.com",
    dueDate: "25-10-2026, 5:00 PM",
    priority: "High",
    status: "In Progress",
    category: "Engineering",
    completed: false,
    subtasks: [
      { id: "st_1792816702762_q5xd", title: "Deliverable", done: true, completed: true }
    ]
  },
  {
    id: "task_1792673269774",
    title: "REPORT FOR ARGRNADS WEBSITE",
    description: "Detailed comparison report between the old and new versions of the AR Grands website.",
    assignedTo: "Tejaswini Siva",
    assignedEmail: "tejaswinisiva02@gmail.com",
    dueDate: "Today, 8:00 PM",
    priority: "High",
    status: "Pending",
    category: "Engineering",
    completed: false,
    subtasks: []
  },
  {
    id: "task_1792849001001",
    title: "IMPROVE SEO IN REDDOT & SEM APPLICATION",
    description: "Optimize meta descriptions, search engine keywords, site indexing, and SEM data integration for the REDDOT platform.",
    assignedTo: "Mukesh",
    assignedEmail: "mukeshk.webdev@gmail.com",
    dueDate: "Today, 6:00 PM",
    priority: "High",
    status: "In Progress",
    category: "Engineering",
    completed: false,
    subtasks: [
      { id: "st_seo_1", title: "Audit core web vitals and keyword ranking", done: true, completed: true },
      { id: "st_seo_2", title: "Implement dynamic sitemap and structured schema", done: false, completed: false }
    ]
  },
  {
    id: "task_1792849002002",
    title: "DOC CARE APPLICATION GENERATION & API SYNC",
    description: "Build and verify automatic PDF/Doc generator workflow with cloud storage integration and cross-platform verification.",
    assignedTo: "Kishor A",
    assignedEmail: "kishoroffical06@gmail.com",
    dueDate: "Tomorrow, 5:00 PM",
    priority: "High",
    status: "Pending",
    category: "Engineering",
    completed: false,
    subtasks: [
      { id: "st_doc_1", title: "Configure PDF document generation pipeline", done: false, completed: false }
    ]
  },
  {
    id: "task_1792849003003",
    title: "REDDOT WORKSTATION UI/UX & LOGO REFINEMENT",
    description: "Refine high-density blueprint design tokens, resolve layout alignment, and ensure all tabs adhere strictly to the monochrome theme.",
    assignedTo: "Pavithra R",
    assignedEmail: "pavithratech1206@gmail.com",
    dueDate: "Tomorrow, 7:00 PM",
    priority: "High",
    status: "Pending",
    category: "Design",
    completed: false,
    subtasks: [
      { id: "st_ui_1", title: "Remove non-theme colors and audit contrast", done: true, completed: true }
    ]
  }
];

export const INITIAL_TEAM = [
  {
    id: "RD-FOUNDER-001",
    uid: "RD-FOUNDER-001",
    name: "JAGADISH K",
    role: "Founder",
    department: "Hardware Architecture",
    status: "Online",
    isOnline: true,
    email: "jagadish2k2006@gmail.com",
    lastActive: "Now",
    avatar: "./assets/profile-photo.jpeg"
  },
  {
    id: "RD-FAE7BQ",
    uid: "FAe7Bqs5PQTBHZh91Z2uUs8SZur2",
    name: "Jai Keerthi",
    role: "CEO",
    department: "AI / ML Systems",
    status: "Offline",
    isOnline: false,
    email: "keerthijai909@gmail.com",
    lastActive: "1h ago",
    avatar: "./assets/profile-photo1.jpeg"
  },
  {
    id: "RD-002",
    uid: "RD-002",
    name: "Tejaswini Siva",
    role: "Intern",
    department: "Software & Web",
    status: "Offline",
    isOnline: false,
    email: "tejaswinisiva02@gmail.com",
    lastActive: "3h ago",
    avatar: "https://lh3.googleusercontent.com/d/1mc4rOkyg16zrVQkK9vBn51YtduJOSdhe=s1000"
  },
  {
    id: "RD-8TG5Q9",
    uid: "RD-8TG5Q9",
    name: "Mukesh",
    role: "Intern",
    department: "Software & Web",
    status: "Offline",
    isOnline: false,
    email: "mukeshk.webdev@gmail.com",
    lastActive: "Yesterday",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJHLuNumB86tcfiWAI4litdkfoLUmWqDkeDAFyw6ASAEdkuOg=s96-c"
  },
  {
    id: "RD-DYZH9L",
    uid: "RD-DYZH9L",
    name: "Kishor A",
    role: "Intern",
    department: "Software & Web",
    status: "Offline",
    isOnline: false,
    email: "kishoroffical06@gmail.com",
    lastActive: "30 min ago",
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocIfDzQr6AGeIeDRqfsC3FSC1kuwNHNdXh_XFYH9Za6HFk24oe8=s96-c"
  },
  {
    id: "RD-EMP-002",
    uid: "RD-EMP-002",
    name: "Pavithra R",
    role: "Employee",
    department: "Engineering & Development",
    status: "Resigned",
    isOnline: false,
    email: "pavithratech1206@gmail.com",
    lastActive: "Offline",
    avatar: "https://lh3.googleusercontent.com/d/1TorRfvW0NgrOrGzIC5Rcmc6Ozidg78QW=s1000"
  }
];

export const INITIAL_ATTENDANCE = [
  {
    id: "att-1",
    date: "Oct 5, 2026",
    member: "Jagadish K",
    checkIn: "09:12 AM",
    checkOut: "--:--",
    workHours: "8h 30m",
    status: "Present"
  },
  {
    id: "att-2",
    date: "Oct 5, 2026",
    member: "Jai Keerthi",
    checkIn: "09:30 AM",
    checkOut: "--:--",
    workHours: "8h 12m",
    status: "Present"
  },
  {
    id: "att-3",
    date: "Oct 5, 2026",
    member: "Tejaswin S",
    checkIn: "--:--",
    checkOut: "--:--",
    workHours: "--",
    status: "Absent"
  },
  {
    id: "att-4",
    date: "Oct 5, 2026",
    member: "Kavya R",
    checkIn: "--:--",
    checkOut: "--:--",
    workHours: "--",
    status: "Absent"
  },
  {
    id: "att-5",
    date: "Oct 4, 2026",
    member: "Jagadish K",
    checkIn: "09:05 AM",
    checkOut: "06:12 PM",
    workHours: "8h 07m",
    status: "Present"
  },
  {
    id: "att-6",
    date: "Oct 4, 2026",
    member: "Jai Keerthi",
    checkIn: "09:28 AM",
    checkOut: "06:01 PM",
    workHours: "8h 33m",
    status: "Present"
  },
  {
    id: "att-7",
    date: "Oct 4, 2026",
    member: "Tejaswin S",
    checkIn: "09:31 AM",
    checkOut: "05:45 PM",
    workHours: "8h 14m",
    status: "Present"
  }
];

export const INITIAL_CONVERSATIONS = [
  {
    id: "general",
    title: "# general",
    name: "general",
    membersCount: 6,
    time: "11:02 AM",
    timestamp: 1792560732796,
    isGroup: true,
    lastMessage: "REPORT: TODAY 20-10-2026 I WORKED ON COMPUTER VISION (CV) MODEL..."
  },
  {
    id: "projects",
    title: "# projects",
    name: "projects",
    membersCount: 6,
    time: "08:20 PM",
    timestamp: 1792507824700,
    isGroup: true,
    lastMessage: "YEAH, THANKS FOR SHARING"
  },
  {
    id: "watercooler",
    title: "# V4_SURE",
    name: "V4_SURE",
    membersCount: 6,
    time: "09:47 PM",
    timestamp: 1789661875078,
    isGroup: true,
    lastMessage: "I HAVE COMPLETED THE L2 TEST BY MY OWN AND STARTED THE PROCESS..."
  },
  {
    id: "ar-wheels-and-tires",
    title: "# AR_W&T",
    name: "AR_W&T",
    membersCount: 6,
    time: "10:10 PM",
    timestamp: 1789576848663,
    isGroup: true,
    lastMessage: "THE ABOVE LINK HAS BOTH THE DESIGN YOU GUYS CAN VERIFY"
  },
  {
    id: "dealer-contact",
    title: "# Dealer-Contact",
    name: "Dealer-Contact",
    membersCount: 6,
    time: "12:34 AM",
    timestamp: 1788635049334,
    isGroup: true,
    lastMessage: "Lakshana Cards (erukkanchery) 9840634239"
  },
  {
    id: "contacts",
    title: "# Leads Contacts",
    name: "Leads Contacts",
    membersCount: 6,
    time: "12:27 AM",
    timestamp: 1788634645370,
    isGroup: true,
    lastMessage: "asked to call me at november due to there renovation work"
  },
  {
    id: "engineering",
    title: "# engineering",
    name: "engineering",
    membersCount: 6,
    time: "04:11 PM",
    timestamp: 1788259299852,
    isGroup: true,
    lastMessage: "Recent discussions"
  },
  {
    id: "announcements",
    title: "# announcements",
    name: "announcements",
    membersCount: 6,
    time: "04:11 PM",
    timestamp: 1788259299054,
    isGroup: true,
    lastMessage: "Recent discussions"
  },
  {
    id: "dm_jagadish2k2006_gmail_com___keerthijai909_gmail_com",
    title: "Jai Keerthi",
    name: "Jai Keerthi",
    status: "Online",
    isOnline: true,
    avatar: "./assets/profile-photo1.jpeg",
    membersCount: 2,
    time: "Just now",
    timestamp: Date.now() - 300000,
    isGroup: false,
    lastMessage: "Backend synchronization and storage gateway operational."
  },
  {
    id: "dm_jagadish2k2006_gmail_com___tejaswinisiva02_gmail_com",
    title: "Tejaswini Siva",
    name: "Tejaswini Siva",
    status: "Online",
    isOnline: true,
    avatar: "https://lh3.googleusercontent.com/d/1mc4rOkyg16zrVQkK9vBn51YtduJOSdhe=s1000",
    membersCount: 2,
    time: "15 min ago",
    timestamp: Date.now() - 900000,
    isGroup: false,
    lastMessage: "I have reviewed the designs and test reports."
  },
  {
    id: "dm_jagadish2k2006_gmail_com___mukeshk_webdev_gmail_com",
    title: "Mukesh",
    name: "Mukesh",
    status: "Online",
    isOnline: true,
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocJHLuNumB86tcfiWAI4litdkfoLUmWqDkeDAFyw6ASAEdkuOg=s96-c",
    membersCount: 2,
    time: "Yesterday",
    timestamp: Date.now() - 86400000,
    isGroup: false,
    lastMessage: "Start a direct chat"
  },
  {
    id: "dm_jagadish2k2006_gmail_com___kishoroffical06_gmail_com",
    title: "Kishor A",
    name: "Kishor A",
    status: "Offline",
    isOnline: false,
    avatar: "https://lh3.googleusercontent.com/a/ACg8ocIfDzQr6AGeIeDRqfsC3FSC1kuwNHNdXh_XFYH9Za6HFk24oe8=s96-c",
    membersCount: 2,
    time: "Yesterday",
    timestamp: Date.now() - 90000000,
    isGroup: false,
    lastMessage: "Start a direct chat"
  },
  {
    id: "dm_jagadish2k2006_gmail_com___pavithratech1206_gmail_com",
    title: "Pavithra R",
    name: "Pavithra R",
    status: "Resigned",
    isOnline: false,
    avatar: "https://lh3.googleusercontent.com/d/1TorRfvW0NgrOrGzIC5Rcmc6Ozidg78QW=s1000",
    membersCount: 2,
    time: "12:00 PM",
    timestamp: 1788259200000,
    isGroup: false,
    lastMessage: "I would like to inform you that the designs are ready."
  }
];

export const INITIAL_MESSAGES = {
  "general": [
    {
      id: "msg-gen-1",
      sender: "Jai Keerthi",
      avatar: "./assets/profile-photo1.jpeg",
      time: "10:30 AM",
      text: "REPORT: TODAY 20-10-2026 I WORKED ON COMPUTER VISION (CV) MODEL AND MODEL PIPELINE.",
      isSelf: false
    },
    {
      id: "msg-gen-2",
      sender: "Tejaswini Siva",
      avatar: "./assets/id-card.png",
      time: "10:45 AM",
      text: "Completed testing of the interface components and verification suite.",
      isSelf: false
    },
    {
      id: "msg-gen-3",
      sender: "JAGADISH K",
      avatar: "./assets/profile-photo.jpeg",
      time: "11:02 AM",
      text: "Excellent progress. All real-time channels and local database stores are synchronized.",
      isSelf: true
    }
  ],
  "projects": [
    {
      id: "msg-p-1",
      sender: "Tejaswini Siva",
      avatar: "./assets/id-card.png",
      time: "08:20 PM",
      text: "YEAH, THANKS FOR SHARING",
      isSelf: false
    }
  ],
  "watercooler": [
    {
      id: "msg-w-1",
      sender: "JAGADISH K",
      avatar: "./assets/profile-photo.jpeg",
      time: "09:47 PM",
      text: "I HAVE COMPLETED THE L2 TEST BY MY OWN AND STARTED THE DEVELOPMENT PROCESSES HEADING TOWARDS L3",
      isSelf: true
    }
  ],
  "ar-wheels-and-tires": [
    {
      id: "msg-ar-1",
      sender: "JAGADISH K",
      avatar: "./assets/profile-photo.jpeg",
      time: "10:10 PM",
      text: "THE ABOVE LINK HAS BOTH THE DESIGN YOU GUYS CAN VERIFY",
      isSelf: true
    }
  ],
  "dealer-contact": [
    {
      id: "msg-dc-1",
      sender: "JAGADISH K",
      avatar: "./assets/profile-photo.jpeg",
      time: "12:34 AM",
      text: "Lakshana Cards (erukkanchery)\n9840634239",
      isSelf: true
    }
  ],
  "contacts": [
    {
      id: "msg-c-1",
      sender: "JAGADISH K",
      avatar: "./assets/profile-photo.jpeg",
      time: "12:27 AM",
      text: "asked to call me at november due to there renovation work",
      isSelf: true
    }
  ]
};

export const INITIAL_FILES = [
  {
    id: "f-1",
    name: "project_reddot.pdf",
    type: "PDF",
    size: "2.4 MB",
    modified: "Oct 5, 2026, 02:30 PM",
    icon: "file-text"
  },
  {
    id: "f-2",
    name: "ui_mockup.fig",
    type: "Design",
    size: "1.8 MB",
    modified: "Oct 5, 2026, 12:10 PM",
    icon: "figma"
  },
  {
    id: "f-3",
    name: "source_code.zip",
    type: "Archive",
    size: "5.2 MB",
    modified: "Oct 4, 2026, 08:45 PM",
    icon: "archive"
  },
  {
    id: "f-4",
    name: "logo_reddot.png",
    type: "Image",
    size: "1.1 MB",
    modified: "Oct 3, 2026, 10:20 AM",
    icon: "image",
    isImage: true,
    previewUrl: "./assets/id-card.png"
  },
  {
    id: "f-5",
    name: "presentation.pptx",
    type: "Presentation",
    size: "4.8 MB",
    modified: "Oct 2, 2026, 03:15 PM",
    icon: "file-text"
  },
  {
    id: "f-6",
    name: "requirements.txt",
    type: "Text",
    size: "12 KB",
    modified: "Oct 2, 2026, 11:30 AM",
    icon: "file"
  }
];

export const INITIAL_EVENTS = [];
