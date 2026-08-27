import React, { useState, useEffect, useRef } from 'react';
import { AUTH_PASSWORD } from './config';
import { playClickSound, playCelebrationSound } from './utils/audio';

// Beautiful color palette for spinner segments
const COLORS = [
  '#E63946', '#FF758F', '#d91d2c', '#ff5c7d',
  '#c71f2a', '#ff8fa3', '#a61c25', '#ffb3c1',
  '#d00000', '#ff4d6d', '#9b2226', '#c9184a',
  '#a4133c', '#ff85a1', '#800f2f', '#f72585'
];

// INDEPENDENT MODULAR WHEEL COMPONENT
function Wheel({ category, items, onSpinComplete, isMusicOn = true }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const angleRef = useRef(0);
  const lastSliceIndexRef = useRef(-1);

  // Local Spin States
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);

  // Redraw wheel when items change
  useEffect(() => {
    drawWheel(angleRef.current);
    setWinner(null);
  }, [items]);

  const drawWheel = (currentAngle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;

    ctx.clearRect(0, 0, size, size);

    if (items.length === 0) {
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#475569';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('কোনো অপশন নেই', center, center);
      return;
    }

    const numSlices = items.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    for (let i = 0; i < numSlices; i++) {
      const item = items[i];
      const startAngle = currentAngle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Draw slice segment
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();

      // Draw segment labels
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      const isImage = typeof item === 'object' && item !== null && item.url;
      let text = (i + 1).toString();
      if (!isImage) {
        const rawText = typeof item === 'object' && item !== null ? item.name : item;
        text = rawText.length > 8 ? rawText.substring(0, 7) + '..' : rawText;
      }
      ctx.fillText(text, radius - 15, 0);
      ctx.restore();
    }

    // Center Pin
    ctx.beginPath();
    ctx.arc(center, center, 14, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
  };

  const handleSpin = () => {
    if (isSpinning || items.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    let velocity = 15 + Math.random() * 8;
    const friction = 0.976 + Math.random() * 0.008;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    lastSliceIndexRef.current = -1;

    const animate = () => {
      angleRef.current += (velocity * Math.PI) / 180;
      angleRef.current = angleRef.current % (2 * Math.PI);

      const numSlices = items.length;
      const sliceSize = (2 * Math.PI) / numSlices;
      const pointerAngle = 1.5 * Math.PI;
      
      let relativeAngle = (pointerAngle - angleRef.current) % (2 * Math.PI);
      if (relativeAngle < 0) relativeAngle += 2 * Math.PI;

      let currentSliceIndex = Math.floor(relativeAngle / sliceSize);
      currentSliceIndex = ((currentSliceIndex % numSlices) + numSlices) % numSlices;

      if (currentSliceIndex !== lastSliceIndexRef.current) {
        if (isMusicOn) playClickSound();
        lastSliceIndexRef.current = currentSliceIndex;
      }

      drawWheel(angleRef.current);

      velocity *= friction;

      if (velocity < 0.05) {
        setIsSpinning(false);
        const winningItem = items[currentSliceIndex];
        if (isMusicOn) playCelebrationSound();
        setWinner(winningItem);
        onSpinComplete(winningItem);
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const isWinnerImage = winner && typeof winner === 'object' && winner.url;

  return (
    <div className="flex flex-col items-center bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 shadow-lg text-center flex-1 min-w-[240px]">
      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">চাকার নাম</span>
      <h3 className="text-base font-extrabold text-white mb-3 truncate max-w-full px-2" title={category.name}>
        {category.name}
      </h3>

      {/* Wheel Canvas wrapper */}
      <div className="relative">
        {/* Pointer Arrow */}
        <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 z-10 filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">
          <svg width="22" height="24" viewBox="0 0 40 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 45L0 10C0 10 7 0 20 0C33 0 40 10 40 10L20 45Z" fill="#ffffff" />
            <path d="M20 38L5 12C5 12 11 4 20 4C29 4 35 12 35 12L20 38Z" fill="#ef4444" />
          </svg>
        </div>
        <div className="bg-slate-900 p-2 rounded-full border-4 border-slate-800 shadow-xl">
          <canvas
            ref={canvasRef}
            width="200"
            height="200"
            className="rounded-full max-w-full aspect-square"
          />
        </div>
      </div>

      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || items.length === 0}
        className={`mt-4 w-full py-2.5 rounded-xl font-bold text-sm text-white shadow transform active:scale-[0.98] transition-all duration-150 ${
          isSpinning || items.length === 0
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md'
        }`}
      >
        {isSpinning ? 'ঘুরছে...' : 'স্পিন করুন'}
      </button>

      {/* Individual Wheel Winner Result Box */}
      <div className="mt-4 w-full h-[64px] flex items-center justify-center border border-slate-700/60 bg-slate-900/50 rounded-xl p-2">
        {winner ? (
          isWinnerImage ? (
            <div className="flex items-center space-x-2 w-full text-left animate-fade-in">
              <img
                src={winner.url}
                alt={winner.name}
                className="w-10 h-10 object-cover rounded-lg border border-yellow-500"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{winner.name}</p>
                {winner.description && (
                  <p className="text-[10px] text-slate-400 truncate">{winner.description}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="min-w-0 flex-1 text-center animate-scale-up">
              <span className="text-sm font-extrabold text-green-400 tracking-wide block truncate">
                {typeof winner === 'object' && winner !== null ? winner.name : winner}
              </span>
              {typeof winner === 'object' && winner !== null && winner.description && (
                <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                  {winner.description}
                </span>
              )}
            </div>
          )
        ) : (
          <span className="text-[11px] text-slate-500 italic">
            {items.length === 0 ? 'চাকাটি খালি' : 'ফলাফলের জন্য স্পিন করুন'}
          </span>
        )}
      </div>
    </div>
  );
}

const DEFAULT_HUSBAND_TASKS = [
  { id: 4001, name: "কবিতা শোনানো", description: "স্ত্রীকে সুন্দর একটি প্রশংসামূলক কবিতা শোনানো" },
  { id: 4002, name: "পা ম্যাসাজ", description: "স্ত্রীর পা ৫ মিনিট ম্যাসাজ করে দেওয়া" },
  { id: 4003, name: "কোলে তুলে থাকা", description: "স্ত্রীকে কোলে তুলে ১ মিনিট থাকা" },
  { id: 4004, name: "নাস্তা তৈরি", description: "স্ত্রীর পছন্দের একটি রান্না বা নাস্তা তৈরি করা" },
  { id: 4005, name: "চকলেট/গিফট", description: "স্ত্রীকে একটি সুন্দর সারপ্রাইজ গিফট বা চকলেট দেওয়া" },
  { id: 4006, name: "রোমান্টিক ডায়ালগ", description: "স্ত্রীর হাত ধরে মিষ্টি একটি রোমান্টিক ডায়ালগ বলা" },
  { id: 4007, name: "মাথা ম্যাসাজ", description: "স্ত্রীর মাথা ম্যাসাজ করে দেওয়া" },
  { id: 4008, name: "গান গেয়ে শোনানো", description: "স্ত্রীর পছন্দের গান গেয়ে শোনানো" },
  { id: 4009, name: "ব্যাক-হাগ", description: "স্ত্রীকে ব্যাক-হাগ (পিছন থেকে জড়িয়ে ধরে) করে ১ মিনিট থাকা" }
];

const DEFAULT_WIFE_TASKS = [
  { id: 5001, name: "প্রিয় খাবার রান্না", description: "স্বামীর প্রিয় একটি খাবার রান্না করে খাওয়ানো" },
  { id: 5002, name: "কাঁধ ম্যাসাজ", description: "স্বামীর কাঁধ ৩ মিনিট ম্যাসাজ করে দেওয়া" },
  { id: 5003, name: "কপালে চুমু", description: "স্বামীকে জড়িয়ে ধরে কপালে একটি চুমু দেওয়া" },
  { id: 5004, name: "মিষ্টি সুরে গান", description: "স্বামীকে মিষ্টি সুরে গান শোনানো" },
  { id: 5005, name: "কফি বানানো", description: "স্বামীর জন্য এক কাপ কফি বানিয়ে আনা" },
  { id: 5006, name: "চুল ব্রাশ", description: "স্বামীর চুল ব্রাশ করে দেওয়া" },
  { id: 5007, name: "আই-কন্ট্যাক্ট", description: "স্বামীকে ১ মিনিট ধরে আই-কন্ট্যাক্ট বা চোখে চোখ রেখে মিষ্টি কথা বলা" },
  { id: 5008, name: "পছন্দের কাজ", description: "স্বামীর পছন্দের যেকোনো একটি কাজ করে দেওয়া" }
];

const DEFAULT_GAMES = [
  { id: 'spin', name: '🎡 মায়াবৃত্ত স্পিন গেম', description: 'বিভিন্ন চাকা ও ক্যাটেগরি স্পিন করে রোমান্টিক সংমিশ্রণ ফলাফল তৈরি করুন।', type: 'spin', enabled: true },
  { id: 'dice', name: '🎲 ডাইস গেসিং গেম', description: 'ডাইস রোল করে সঠিক অনুমান করার খেলা। ভুল অনুমানের জন্য রোমান্টিক পেনাল্টি টাস্ক!', type: 'dice', enabled: true }
];

// MAIN APP COMPONENT
function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('spinner_logged_in') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Vite Dev Server / Prod Environment Detect
  const isDev = import.meta.env.DEV;

  // Detect Admin Mode from Dev env or URL Hash #admin
  const isAdminRoute = isDev || window.location.hash === '#admin';

  // Configuration and Images State
  const [categories, setCategories] = useState([]);
  const [selectedImageIds, setSelectedImageIds] = useState(new Set());
  
  // New Category Input (Dev Mode)
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItemsText, setNewItemsText] = useState({}); // Stores text inputs by category ID

  // Upload States mapped by Category ID: { [catId]: [pendingFiles] }
  const [pendingUploads, setPendingUploads] = useState({});
  const [uploadingCategory, setUploadingCategory] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // Editing State
  const [editingImage, setEditingImage] = useState(null);

  // Global Combined Combo Winner Results
  const [comboResults, setComboResults] = useState({});

  // Active Popup Winner State
  const [activePopupWinner, setActivePopupWinner] = useState(null); // { categoryName, categoryId, item }

  // Detail View Modal State
  const [detailViewItem, setDetailViewItem] = useState(null); // { categoryName, item }

  // Sequential Active Wheel Index
  const [activeWheelIndex, setActiveWheelIndex] = useState(0);

  // Category Renaming States
  const [renamingCatId, setRenamingCatId] = useState(null);
  const [renamingNameValue, setRenamingNameValue] = useState('');

  // Add Item File Upload State
  const [addItemFile, setAddItemFile] = useState({});

  // Control Board Visibility State (Reading Mode vs Editor Mode)
  const [showControlBoard, setShowControlBoard] = useState(isAdminRoute);

  // Game Tab Switcher
  const [activeGameTab, setActiveGameTab] = useState('spin'); // 'spin' or 'dice'
  const [isMusicOn, setIsMusicOn] = useState(true);

  // GitHub Integration States (for mobile deployment & syncing)
  const [ghUsername, setGhUsername] = useState(localStorage.getItem('gh_username') || '');
  const [ghRepo, setGhRepo] = useState(localStorage.getItem('gh_repo') || '');
  const [ghToken, setGhToken] = useState(localStorage.getItem('gh_token') || '');
  const [ghBranch, setGhBranch] = useState(localStorage.getItem('gh_branch') || 'main');
  const [isSyncing, setIsSyncing] = useState(false);

  // Games Selection & Customization States
  const [games, setGames] = useState([]);
  const [activeGameId, setActiveGameId] = useState(null);
  const [newGameName, setNewGameName] = useState('');
  const [newGameDesc, setNewGameDesc] = useState('');
  const [newGameType, setNewGameType] = useState('spin');

  // Derived structured task lists from categories
  const husbandTasks = categories.find(c => c.id === 'husband_tasks')?.items || [];
  const wifeTasks = categories.find(c => c.id === 'wife_tasks')?.items || [];

  // Dice Game Session State
  const [diceGameState, setDiceGameState] = useState('setup'); // 'setup', 'playing', 'result', 'penalty', 'ended'
  const [diceTotalRounds, setDiceTotalRounds] = useState(10);
  const [diceCurrentRound, setDiceCurrentRound] = useState(1);
  const [diceCurrentTurn, setDiceCurrentTurn] = useState('wife'); // 'wife' or 'husband'
  const [diceRolledNumber, setDiceRolledNumber] = useState(null);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [activePenaltyTask, setActivePenaltyTask] = useState(null);
  const [usedTasks, setUsedTasks] = useState([]); // Array of strings/objects (used tasks)
  const [diceRoundHistory, setDiceRoundHistory] = useState([]); // History array for display

  // Helper to extract image IDs
  const initializeImageIds = (cats) => {
    const imgIds = new Set();
    cats.forEach(cat => {
      if (Array.isArray(cat.items)) {
        cat.items.forEach(item => {
          const isImage = typeof item === 'object' && item !== null && item.url;
          if (isImage) {
            imgIds.add(item.id);
          }
        });
      }
    });
    setSelectedImageIds(imgIds);
  };

  // Helper to load settings from config object/array
  const applyLoadedConfig = (configData) => {
    let cats = [];
    if (Array.isArray(configData)) {
      cats = configData;
    } else if (configData && Array.isArray(configData.categories)) {
      cats = configData.categories;
      
      let loadedGames = DEFAULT_GAMES;
      if (Array.isArray(configData.games)) {
        loadedGames = configData.games;
      } else {
        loadedGames = [
          { id: 'spin', name: '🎡 মায়াবৃত্ত স্পিন গেম', description: 'বিভিন্ন চাকা ও ক্যাটেগরি স্পিন করে রোমান্টিক সংমিশ্রণ ফলাফল তৈরি করুন।', type: 'spin', enabled: configData.showSpinGame !== undefined ? configData.showSpinGame : true },
          { id: 'dice', name: '🎲 ডাইস গেসিং গেম', description: 'ডাইস রোল করে সঠিক অনুমান করার খেলা। ভুল অনুমানের জন্য রোমান্টিক পেনাল্টি টাস্ক!', type: 'dice', enabled: configData.showDiceGame !== undefined ? configData.showDiceGame : true }
        ];
      }
      setGames(loadedGames);
    }

    // Migrate/Initialize husband_tasks and wife_tasks categories
    let updatedCats = [...cats];
    if (!updatedCats.some(c => c.id === 'husband_tasks')) {
      let items = [];
      if (configData && Array.isArray(configData.husbandTasks)) {
        items = configData.husbandTasks.map((t, idx) => (
          typeof t === 'object' && t !== null 
            ? { id: t.id || (4000 + idx), name: t.name || '', description: t.description || '', url: t.url, filename: t.filename }
            : { id: 4000 + idx, name: typeof t === 'string' ? t : '', description: '' }
        ));
      } else {
        items = DEFAULT_HUSBAND_TASKS;
      }
      updatedCats.push({
        id: 'husband_tasks',
        name: '👨 ছেলের পেনাল্টি টাস্ক',
        enabled: true,
        items: items
      });
    }

    if (!updatedCats.some(c => c.id === 'wife_tasks')) {
      let items = [];
      if (configData && Array.isArray(configData.wifeTasks)) {
        items = configData.wifeTasks.map((t, idx) => (
          typeof t === 'object' && t !== null 
            ? { id: t.id || (5000 + idx), name: t.name || '', description: t.description || '', url: t.url, filename: t.filename }
            : { id: 5000 + idx, name: typeof t === 'string' ? t : '', description: '' }
        ));
      } else {
        items = DEFAULT_WIFE_TASKS;
      }
      updatedCats.push({
        id: 'wife_tasks',
        name: '👩 মেয়ের পেনাল্টি টাস্ক',
        enabled: true,
        items: items
      });
    }

    setCategories(updatedCats);
    initializeImageIds(updatedCats);
  };

  // Fetch configs on load
  useEffect(() => {
    if (isAuthenticated) {
      // 1. Check localStorage first
      const localConfig = localStorage.getItem('spinner_custom_config');
      if (localConfig) {
        try {
          const parsed = JSON.parse(localConfig);
          applyLoadedConfig(parsed);
          return;
        } catch (e) {
          console.error("Failed to parse local config:", e);
        }
      }

      // 2. Fetch from server configuration file
      fetch('/uploads/config.json?t=' + Date.now())
        .then(res => {
          if (!res.ok) throw new Error('No config found');
          return res.json();
        })
        .then(data => {
          applyLoadedConfig(data);
        })
        .catch(err => {
          console.warn("Could not load categories configuration:", err);
        });
    }
  }, [isAuthenticated]);

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === AUTH_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('spinner_logged_in', 'true');
      setAuthError('');
    } else {
      setAuthError('ভুল পাসওয়ার্ড, দয়া করে আবার চেষ্টা করুন!');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('spinner_logged_in');
    setPasswordInput('');
  };

  // Export Custom Configurations to JSON File
  const handleExportConfig = () => {
    try {
      const configToExport = {
        categories,
        games
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configToExport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "spinner_config.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Export failed:", e);
      alert("কনফিগারেশন এক্সপোর্ট করা যায়নি!");
    }
  };

  // Import Custom Configurations from JSON File
  const handleImportConfig = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        let valid = false;
        
        if (Array.isArray(parsed)) {
          valid = true;
        } else if (parsed && Array.isArray(parsed.categories)) {
          valid = true;
        }
        
        if (valid) {
          if (window.confirm("আপনি কি নিশ্চিতভাবে এই কনফিগারেশনটি ইমপোর্ট করতে চান? এটি আপনার বর্তমান সব চাকা, গেম সেটিংস ও টাস্কগুলোকে ওভাররাইট করে দেবে!")) {
            applyLoadedConfig(parsed);
            
            const gamesList = parsed.games || DEFAULT_GAMES;
            const cats = Array.isArray(parsed) ? parsed : parsed.categories;
            await saveConfigToServer(cats, { games: gamesList });
            alert("কনফিগারেশন সফলভাবে ইমপোর্ট করা হয়েছে!");
            window.location.reload();
          }
        } else {
          alert("ভুল ফাইল ফরম্যাট! সঠিক JSON ফাইল নির্বাচন করুন।");
        }
      } catch (err) {
        console.error("Import failed:", err);
        alert("ফাইলটি পড়া যায়নি বা ফাইলটি সঠিক JSON নয়!");
      }
    };
    reader.readAsText(file);
  };

  // Save Category Config to localStorage (and to server if in Dev Mode)
  const saveConfigToServer = async (updatedCategories, settingsOverride = {}) => {
    const configToSave = {
      categories: updatedCategories,
      games: settingsOverride.games || games
    };

    // 1. Always save to localStorage
    try {
      localStorage.setItem('spinner_custom_config', JSON.stringify(configToSave));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }

    // 2. Sync to server (Vite dev Node server or Hostinger PHP backend)
    try {
      const url = isDev ? '/api/save-config' : '/api.php?action=save-config';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave)
      });
      if (!response.ok) throw new Error('Failed to save config to server');
    } catch (err) {
      console.warn("Could not sync config to server (this is normal if running statically):", err);
    }
  };


  // Sync config to GitHub (triggers Netlify build to deploy updates live from mobile)
  const handleSyncToGitHub = async (e) => {
    e.preventDefault();
    if (!ghUsername.trim() || !ghRepo.trim() || !ghToken.trim()) {
      alert("দয়া করে গিটহাব ইউজারনেম, রিপোজিটরি এবং পার্সোনাল অ্যাক্সেস টোকেন (PAT) লিখুন!");
      return;
    }

    setIsSyncing(true);

    try {
      // Save inputs to localStorage for convenience
      localStorage.setItem('gh_username', ghUsername.trim());
      localStorage.setItem('gh_repo', ghRepo.trim());
      localStorage.setItem('gh_token', ghToken.trim());
      localStorage.setItem('gh_branch', ghBranch.trim());

      const configToSave = {
        categories,
        games
      };
      const configString = JSON.stringify(configToSave, null, 2);

      // Safe base64 encoding for UTF-8
      const utf8Bytes = new TextEncoder().encode(configString);
      let binary = '';
      for (let i = 0; i < utf8Bytes.byteLength; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      const base64Content = window.btoa(binary);

      const path = 'public/uploads/config.json';
      const url = `https://api.github.com/repos/${ghUsername.trim()}/${ghRepo.trim()}/contents/${path}`;
      const headers = {
        'Authorization': `token ${ghToken.trim()}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };

      // Fetch existing file SHA
      let sha = null;
      try {
        const getRes = await fetch(`${url}?ref=${ghBranch.trim()}`, { headers });
        if (getRes.ok) {
          const getData = await getRes.json();
          sha = getData.sha;
        }
      } catch (err) {
        console.warn("Could not fetch existing SHA, assuming new file:", err);
      }

      // Commit file to GitHub
      const putBody = {
        message: "Update game configuration from mobile admin panel 📱🚀",
        content: base64Content,
        branch: ghBranch.trim()
      };
      if (sha) {
        putBody.sha = sha;
      }

      const putRes = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(putBody)
      });

      if (!putRes.ok) {
        const errData = await putRes.json();
        throw new Error(errData.message || "Failed to push to GitHub");
      }

      alert("🎉 গিটহাবে সফলভাবে সিঙ্ক ও আপডেট করা হয়েছে! নেটলিফাই এখন সাইটটি লাইভ করছে। প্রায় ৩০-৪৫ সেকেন্ডের মধ্যে আপনার আপডেট করা অপশনগুলো যেকোনো ডিভাইসে লাইভ দেখতে পাবেন।");
    } catch (err) {
      console.error(err);
      alert(`গিটহাব সিঙ্ক ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };


  // --- DICE GAME LOGIC ---
  const handleStartDiceGame = (rounds, startingTurn) => {
    setDiceTotalRounds(rounds);
    setDiceCurrentRound(1);
    setDiceCurrentTurn(startingTurn);
    setDiceGameState('playing');
    setDiceRolledNumber(null);
    setActivePenaltyTask(null);
    setUsedTasks([]);
    setDiceRoundHistory([]);
  };

  const handleRollDice = () => {
    if (isDiceRolling) return;
    setIsDiceRolling(true);
    setDiceRolledNumber(null);
    setDiceGameState('playing'); // Ensure status
    
    // Simulate dice rolling with rapid random face updates
    let count = 0;
    const interval = setInterval(() => {
      setDiceRolledNumber(Math.floor(Math.random() * 6) + 1);
      if (isMusicOn) playClickSound();
      count++;
      if (count > 12) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceRolledNumber(finalRoll);
        setIsDiceRolling(false);
        setDiceGameState('result');
      }
    }, 100);
  };

  const handleDiceGuessResult = (isRight) => {
    if (isRight) {
      // Record history
      const historyItem = {
        round: diceCurrentRound,
        player: diceCurrentTurn,
        roll: diceRolledNumber,
        result: 'correct'
      };
      setDiceRoundHistory(prev => [historyItem, ...prev]);

      // Move to next turn
      advanceDiceTurn();
    } else {
      // Draw random penalty task
      const pool = diceCurrentTurn === 'wife' ? wifeTasks : husbandTasks;
      const available = pool.filter(task => !usedTasks.includes(task.id));
      
      let selectedTask = null;
      if (available.length > 0) {
        selectedTask = available[Math.floor(Math.random() * available.length)];
      } else if (pool.length > 0) {
        // Fallback if all tasks are used, reset the pool
        selectedTask = pool[Math.floor(Math.random() * pool.length)];
        setUsedTasks([selectedTask.id]); // reset used list with this task
      }

      if (selectedTask) {
        setUsedTasks(prev => [...prev, selectedTask.id]);
        setActivePenaltyTask(selectedTask);
        setDiceGameState('penalty');
      } else {
        // No tasks configured fallback
        alert("অ্যাডমিন প্যানেল থেকে অনুগ্রহ করে ডাইস গেমের টাস্ক তালিকা যুক্ত করুন!");
        advanceDiceTurn();
      }
    }
  };

  const handleCompletePenalty = () => {
    // Record history
    const historyItem = {
      round: diceCurrentRound,
      player: diceCurrentTurn,
      roll: diceRolledNumber,
      result: 'penalty',
      task: activePenaltyTask
    };
    setDiceRoundHistory(prev => [historyItem, ...prev]);

    // Move to next turn
    advanceDiceTurn();
  };

  const advanceDiceTurn = () => {
    // Check if game has ended
    if (diceTotalRounds !== 'unlimited' && diceCurrentRound >= diceTotalRounds) {
      setDiceGameState('ended');
      if (isMusicOn) playCelebrationSound();
    } else {
      setDiceCurrentRound(prev => prev + 1);
      setDiceCurrentTurn(prev => prev === 'wife' ? 'husband' : 'wife');
      setDiceGameState('playing');
      setDiceRolledNumber(null);
      setActivePenaltyTask(null);
    }
  };

  const handleToggleGame = (gameId) => {
    const updated = games.map(g => 
      g.id === gameId ? { ...g, enabled: !g.enabled } : g
    );
    setGames(updated);
    saveConfigToServer(categories, { games: updated });
  };

  const handleDeleteGame = (gameId) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই গেমটি ডিলিট করতে চান?")) {
      const updated = games.filter(g => g.id !== gameId);
      setGames(updated);
      saveConfigToServer(categories, { games: updated });
      if (activeGameId === gameId) {
        setActiveGameId(null);
      }
    }
  };

  const handleCreateGame = (e) => {
    e.preventDefault();
    if (!newGameName.trim()) return;

    const newGame = {
      id: 'game_' + Date.now(),
      name: newGameName.trim(),
      description: newGameDesc.trim(),
      type: newGameType,
      enabled: true
    };

    const updated = [...games, newGame];
    setGames(updated);
    saveConfigToServer(categories, { games: updated });
    
    setNewGameName('');
    setNewGameDesc('');
    alert("নতুন গেম সফলভাবে তৈরি করা হয়েছে!");
  };



  // Enable/Disable category
  const toggleCategoryEnabled = (id) => {
    const updated = categories.map(cat => 
      cat.id === id ? { ...cat, enabled: !cat.enabled } : cat
    );
    setCategories(updated);
    saveConfigToServer(updated);

    // Reset game state on category list change
    setComboResults({});
    setActiveWheelIndex(0);
  };

  // Add a new Category
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const newId = 'category_' + Date.now();
    const newCat = {
      id: newId,
      name: newCategoryName.trim(),
      enabled: true,
      items: []
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    saveConfigToServer(updated);
    setNewCategoryName('');
  };

  // Delete Category
  const handleDeleteCategory = (id) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই ক্যাটেগরি ডিলিট করতে চান? এতে ভেতরের সব ছবি ও লেখা ডিলিট হয়ে যাবে!")) return;

    const updated = categories.filter(cat => cat.id !== id);
    setCategories(updated);
    saveConfigToServer(updated);

    // Reset game state on category deletion
    setComboResults({});
    setActiveWheelIndex(0);
  };

  // Rename Category
  const handleRenameCategory = (catId) => {
    if (!renamingNameValue.trim()) return;
    const updated = categories.map(cat => 
      cat.id === catId ? { ...cat, name: renamingNameValue.trim() } : cat
    );
    setCategories(updated);
    saveConfigToServer(updated);
    setRenamingCatId(null);
  };

  // Add Item to Category (Supports Text only and Text + Image upload)
  const handleAddItem = async (catId) => {
    const itemData = newItemsText[catId] || { name: '', description: '' };
    const title = itemData.name ? itemData.name.trim() : '';
    const description = itemData.description ? itemData.description.trim() : '';

    if (!title) {
      alert("দয়া করে টাইটেল লিখুন!");
      return;
    }

    const file = addItemFile[catId];

    try {
      let newImg = null;
      
      if (file) {
        const dataUrl = await fileToDataURL(file);
        let uploadSuccess = false;

        // Try server upload first
        try {
          const url = isDev ? '/api/upload' : '/api.php?action=upload';
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              categoryId: catId,
              name: title, 
              description,
              dataUrl
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.image) {
              newImg = result.image;
              uploadSuccess = true;
            }
          }
        } catch (e) {
          console.warn("Server image upload failed, falling back to local base64 storage:", e);
        }

        if (!uploadSuccess) {
          newImg = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            name: title,
            description: description,
            url: dataUrl
          };
        }
      } else {
        // Plain text item
        newImg = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: title,
          description: description
        };
      }

      const updated = categories.map(cat => {
        if (cat.id === catId) {
          return {
            ...cat,
            items: [...(cat.items || []), newImg]
          };
        }
        return cat;
      });
      setCategories(updated);
      saveConfigToServer(updated);

      if (newImg.url) {
        setSelectedImageIds(prev => {
          const next = new Set(prev);
          next.add(newImg.id);
          return next;
        });
      }

      // Clear states
      setNewItemsText(prev => ({ ...prev, [catId]: { name: '', description: '' } }));
      setAddItemFile(prev => {
        const next = { ...prev };
        delete next[catId];
        return next;
      });
    } catch (err) {
      console.error(err);
      alert("সংরক্ষণ করা যায়নি!");
    }
  };


  // Upload Images for specific Category
  const handleBatchUpload = async (e, catId) => {
    e.preventDefault();
    const catPending = pendingUploads[catId] || [];
    if (catPending.length === 0) return;

    setUploadingCategory(catId);
    setUploadProgress({ current: 0, total: catPending.length });

    let succeededCount = 0;
    let failedCount = 0;
    const updatedIds = new Set(selectedImageIds);
    const failedItems = [];
    const newUploadedImages = [];

    for (let i = 0; i < catPending.length; i++) {
      const item = catPending[i];
      try {
        const dataUrl = await fileToDataURL(item.file);
        let newImg = null;
        let uploadSuccess = false;

        // Try server upload first
        try {
          const url = isDev ? '/api/upload' : '/api.php?action=upload';
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              categoryId: catId,
              name: item.name, 
              dataUrl, 
              description: item.description 
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.image) {
              newImg = result.image;
              uploadSuccess = true;
            }
          }
        } catch (err) {
          console.warn("Server task upload failed, falling back to local base64 storage:", err);
        }

        if (!uploadSuccess) {
          newImg = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            name: item.name,
            description: item.description,
            url: dataUrl
          };
        }

        newUploadedImages.push(newImg);
        updatedIds.add(newImg.id);
        succeededCount++;
        URL.revokeObjectURL(item.previewUrl);
      } catch (err) {
        console.error(`Failed to upload ${item.name}:`, err);
        failedCount++;
        failedItems.push(item);
      } finally {
        setUploadProgress(prev => ({ ...prev, current: i + 1 }));
      }
    }

    // Update frontend state
    const updatedCategories = categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          items: [...(cat.items || []), ...newUploadedImages]
        };
      }
      return cat;
    });

    setCategories(updatedCategories);
    saveConfigToServer(updatedCategories);
    setSelectedImageIds(updatedIds);
    setPendingUploads(prev => ({ ...prev, [catId]: failedItems }));
    setUploadingCategory(null);

    if (failedCount === 0) {
      alert(`সব ছবি সফলভাবে আপলোড সম্পন্ন হয়েছে! (মোট: ${succeededCount}টি)`);
    } else {
      alert(`আপলোড সম্পন্ন হয়েছে।\nসফল: ${succeededCount}টি\nব্যর্থ: ${failedCount}টি`);
    }
  };


  // Update Image/Text Details inside specific Category
  const handleUpdateImage = async (e) => {
    e.preventDefault();
    if (!editingImage || !editingImage.imageItem || !editingImage.imageItem.name) return;

    const { categoryId, imageItem, newImageDataUrl } = editingImage;

    let updatedItem = null;
    let updateSuccess = false;

    // Try server update first
    try {
      const url = isDev ? '/api/update' : '/api.php?action=update';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          id: imageItem.id,
          name: imageItem.name,
          description: imageItem.description,
          dataUrl: newImageDataUrl || null
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.item) {
          updatedItem = result.item;
          updateSuccess = true;
        }
      }
    } catch (err) {
      console.warn("Server update failed, falling back to local storage:", err);
    }

    if (!updateSuccess) {
      updatedItem = {
        ...imageItem,
        name: imageItem.name,
        description: imageItem.description,
        url: newImageDataUrl || (typeof imageItem === 'object' ? imageItem.url : null)
      };
    }

    const updated = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => {
            const itemId = typeof item === 'object' && item !== null ? item.id : item;
            if (itemId === imageItem.id) {
              return updatedItem;
            }
            return item;
          })
        };
      }
      return cat;
    });

    setCategories(updated);
    saveConfigToServer(updated);

    if (newImageDataUrl) {
      setSelectedImageIds(prev => {
        const next = new Set(prev);
        next.add(imageItem.id);
        return next;
      });
    }

    setEditingImage(null);
  };


  // Delete Image/Item from specific Category
  const handleDeleteImageItem = async (catId, id) => {
    if (!window.confirm("আপনি কি এই ছবিটি ডিলিট করতে চান?")) return;
    
    // Try server delete first
    try {
      const url = isDev ? '/api/delete' : '/api.php?action=delete';
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: catId, id })
      });
    } catch (err) {
      console.warn("Server delete failed, falling back to local storage deletion:", err);
    }

    const updated = categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          items: cat.items.filter(item => {
            const itemId = typeof item === 'object' && item !== null ? item.id : item;
            return itemId !== id;
          })
        };
      }
      return cat;
    });

    setCategories(updated);
    saveConfigToServer(updated);
    
    setSelectedImageIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };


  // Clear/Reset Database
  const handleClearAll = async () => {
    if (!window.confirm("আপনি কি নিশ্চিত যে সব ডেটা রিসেট করতে চান? এটি ডিফল্ট ক্যাটেগরিতে ফিরে যাবে এবং ছবিগুলো ডিলিট হবে।")) return;
    
    try {
      const url = isDev ? '/api/clear' : '/api.php?action=clear';
      await fetch(url, { method: 'POST' });
    } catch (err) {
      console.warn("Server database clear failed:", err);
    }

    localStorage.removeItem('spinner_custom_config');
    window.location.reload();
  };



  // Image checkbox select toggle
  const toggleImageSelection = (id) => {
    setSelectedImageIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllImagesForCat = (catId, select) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat || !cat.items) return;
    
    setSelectedImageIds(prev => {
      const next = new Set(prev);
      cat.items.forEach(item => {
        const isImage = typeof item === 'object' && item !== null && item.url;
        if (isImage) {
          if (select) next.add(item.id);
          else next.delete(item.id);
        }
      });
      return next;
    });
  };

  // Get active items for a category
  const getActiveItems = (cat) => {
    if (!cat || !cat.items) return [];
    return cat.items.filter(item => {
      const isImage = typeof item === 'object' && item !== null && item.url;
      if (isImage) {
        return selectedImageIds.has(item.id);
      }
      return true;
    });
  };

  const activeCategories = categories.filter(c => c.enabled && c.id !== 'husband_tasks' && c.id !== 'wife_tasks');

  // Wheel Complete Callback -> Sets the popup first!
  const handleWheelComplete = (categoryId, winnerItem) => {
    const cat = categories.find(c => c.id === categoryId);
    setActivePopupWinner({
      categoryName: cat ? cat.name : 'চাকা',
      categoryId,
      item: winnerItem
    });
  };

  // Close Popup and add result to Combo Board
  const handleClosePopup = () => {
    if (activePopupWinner) {
      setComboResults(prev => ({
        ...prev,
        [activePopupWinner.categoryId]: activePopupWinner.item
      }));
      setActivePopupWinner(null);
      setActiveWheelIndex(prev => prev + 1);
    }
  };

  const activeImageWinners = activeCategories.filter(cat => {
    const winVal = comboResults[cat.id];
    return winVal && typeof winVal === 'object' && winVal.url;
  });

  // LOGIN SCREEN (Required for all visitors)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center shadow-lg mb-4 p-2 border border-slate-700/60">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(50, 50)">
                  <circle cx="0" cy="0" r="45" fill="none" stroke="#E63946" strokeWidth="2.5" strokeDasharray="8 4" opacity="0.7"/>
                  <circle cx="0" cy="0" r="38" fill="#140817" stroke="#FF758F" strokeWidth="2"/>
                  <path d="M -15,-10 C -25,-25 -5,-30 0,-15 C 5,-30 25,-25 15,-10 C 5,5 0,18 0,22 C 0,18 -5,5 -15,-10 Z" fill="#E63946" opacity="0.9"/>
                  <circle cx="-6" cy="-12" r="3.5" fill="#FFE3E8"/>
                  <circle cx="6" cy="-12" r="3.5" fill="#FFE3E8"/>
                  <circle cx="28" cy="-28" r="2.5" fill="#FF758F"/>
                  <circle cx="-28" cy="28" r="2" fill="#FF758F"/>
                </g>
              </svg>
            </div>
            <h1 className="text-3xl font-black text-white text-center tracking-wide">মায়াবৃত্ত</h1>
            <p className="text-slate-400 text-sm mt-1">প্রবেশ করতে সঠিক পাসওয়ার্ড দিন</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">পাসওয়ার্ড</label>
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full bg-slate-700 text-white border border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                placeholder="পাসওয়ার্ড লিখুন"
                required
                autoFocus
              />
            </div>

            {authError && (
              <p className="text-rose-500 text-sm font-medium mt-1">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white p-3.5 rounded-xl font-bold hover:bg-indigo-500 shadow-lg active:scale-[0.98] transition mt-2"
            >
              প্রবেশ করুন
            </button>
          </form>
        </div>
      </div>
    );
  }

  const husbandCat = categories.find(c => c.id === 'husband_tasks');
  const wifeCat = categories.find(c => c.id === 'wife_tasks');

  // MAIN SYSTEM PANEL
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col relative">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center p-1 border border-slate-700/60 shadow">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(50, 50)">
                <circle cx="0" cy="0" r="45" fill="none" stroke="#E63946" strokeWidth="2.5" strokeDasharray="8 4" opacity="0.7"/>
                <circle cx="0" cy="0" r="38" fill="#140817" stroke="#FF758F" strokeWidth="2"/>
                <path d="M -15,-10 C -25,-25 -5,-30 0,-15 C 5,-30 25,-25 15,-10 C 5,5 0,18 0,22 C 0,18 -5,5 -15,-10 Z" fill="#E63946" opacity="0.9"/>
                <circle cx="-6" cy="-12" r="3.5" fill="#FFE3E8"/>
                <circle cx="6" cy="-12" r="3.5" fill="#FFE3E8"/>
                <circle cx="28" cy="-28" r="2.5" fill="#FF758F"/>
                <circle cx="-28" cy="28" r="2" fill="#FF758F"/>
              </g>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide text-white">মায়াবৃত্ত</h1>
            <p className="text-xs text-indigo-400">
              {isDev ? 'Local Development Mode (আপলোড ও এডিট সচল)' : 'Live Production Mode (মোবাইল ও পিসি এডিট সচল 📱)'}
            </p>
          </div>
        </div>

        {isAdminRoute && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowControlBoard(prev => !prev)}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold transition flex items-center space-x-1 ${
                showControlBoard 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-indigo-300 border border-indigo-500/20'
              }`}
            >
              <span>{showControlBoard ? '📖 গেমপ্লে মোড' : '⚙️ এডিটর মোড'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium text-slate-350 transition flex items-center space-x-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>লগ আউট</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 flex flex-col gap-8 max-w-5xl mx-auto w-full">
        
        {/* GAME SELECTION HOME SCREEN */}
        {activeGameId === null && (
          <div className="max-w-2xl mx-auto w-full text-center space-y-6 py-6 animate-scale-up">
            <div className="w-20 h-20 bg-slate-850 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-rose-500/30 p-3 shadow-xl">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(50, 50)">
                  <circle cx="0" cy="0" r="45" fill="none" stroke="#E63946" strokeWidth="2.5" strokeDasharray="8 4" opacity="0.7"/>
                  <circle cx="0" cy="0" r="38" fill="#140817" stroke="#FF758F" strokeWidth="2"/>
                  <path d="M -15,-10 C -25,-25 -5,-30 0,-15 C 5,-30 25,-25 15,-10 C 5,5 0,18 0,22 C 0,18 -5,5 -15,-10 Z" fill="#E63946" opacity="0.9"/>
                  <circle cx="-6" cy="-12" r="3.5" fill="#FFE3E8"/>
                  <circle cx="6" cy="-12" r="3.5" fill="#FFE3E8"/>
                </g>
              </svg>
            </div>
            
            <h2 className="text-3xl font-black text-white tracking-wide">মায়াবৃত্ত 💖</h2>
            <p className="text-xs text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
              দাম্পত্য ঘনিষ্ঠতা ও রোমান্টিক বন্ধন মধুর করার খেলা। শুরু করার জন্য নিচের যেকোনো একটি সক্রিয় গেম নির্বাচন করুন:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
              {games.filter(g => g.enabled).length === 0 ? (
                <div className="sm:col-span-2 bg-slate-800 p-8 rounded-3xl border border-slate-750 text-center shadow-lg">
                  <span className="text-4xl">⚠️</span>
                  <h2 className="text-lg font-bold text-white mt-4 mb-2">কোনো গেম সক্রিয় নেই</h2>
                  <p className="text-xs text-slate-400 mt-1">অ্যাডমিন প্যানেলে গিয়ে অন্তত একটি গেম সক্রিয় করুন।</p>
                </div>
              ) : (
                games.filter(g => g.enabled).map(g => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setActiveGameId(g.id);
                      if (g.type === 'dice') setDiceGameState('setup');
                    }}
                    className="bg-slate-800 border border-slate-700/60 p-6 rounded-3xl text-left hover:border-rose-500/40 hover:bg-slate-750 transition duration-200 flex flex-col justify-between min-h-[150px] shadow-lg group relative overflow-hidden active:scale-[0.98]"
                  >
                    <div>
                      <span className="text-lg font-black text-white group-hover:text-rose-350 transition duration-150 flex items-center space-x-2">
                        {g.name}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed font-medium">{g.description}</p>
                    </div>
                    <span className="text-xs font-bold text-rose-300 group-hover:translate-x-1 transition flex items-center space-x-1 mt-4">
                      <span>খেলুন</span>
                      <span>➔</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* ACTIVE GAME RENDERER */}
        {activeGameId !== null && (() => {
          const currentGame = games.find(g => g.id === activeGameId);
          if (!currentGame || !currentGame.enabled) {
            setActiveGameId(null);
            return null;
          }

          return (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setActiveGameId(null)}
                className="self-start text-xs font-bold text-slate-400 hover:text-slate-200 transition flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/45 rounded-xl border border-slate-750/30 active:scale-95"
              >
                <span>← গেম নির্বাচন স্ক্রিনে ফিরুন</span>
              </button>

              {/* RENDER GAME 1: SPIN WHEEL */}
              {currentGame.type === 'spin' && (
                <section className="w-full flex flex-col gap-6 animate-fade-in">
                  {/* COMBO RESULTS BOARD (TOP BANNER) */}
                  <div className="w-full bg-gradient-to-r from-slate-800 to-indigo-950/40 border border-indigo-500/20 rounded-3xl p-5 shadow-xl">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="text-center md:text-left">
                        <h2 className="text-lg font-extrabold text-indigo-300 tracking-wide">{currentGame.name} ফলাফল সংমিশ্রণ বোর্ড 🎯</h2>
                        <p className="text-xs text-slate-400 mt-0.5">সবগুলো চাকা ঘুরিয়ে আপনার কাঙ্ক্ষিত সংমিশ্রণটি তৈরি করুন</p>
                      </div>
                      
                      {Object.keys(comboResults).length > 0 && (
                        <button
                          onClick={() => setComboResults({})}
                          className="bg-slate-755 hover:bg-slate-700 text-slate-400 hover:text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
                        >
                          ফলাফল বোর্ড রিসেট
                        </button>
                      )}
                    </div>

                    {/* Winners Grid */}
                    {Object.keys(comboResults).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {activeCategories.map(cat => {
                          const winner = comboResults[cat.id];
                          const hasImage = winner && typeof winner === 'object' && winner.url;
                          
                          return (
                            <div
                              key={cat.id}
                              onClick={() => {
                                if (winner) {
                                  setDetailViewItem({ categoryName: cat.name, item: winner });
                                }
                              }}
                              className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col justify-center items-center gap-1.5 ${
                                winner
                                  ? 'bg-slate-900 border-rose-500/20 hover:border-rose-500/40'
                                  : 'bg-slate-900/30 border-slate-800 opacity-40'
                              }`}
                            >
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{cat.name}</span>
                              {winner ? (
                                <>
                                  {hasImage ? (
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                                      <img src={winner.url} alt={winner.name} className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <span className="text-lg">🎯</span>
                                  )}
                                  <span className="text-xs font-black text-rose-350 truncate max-w-[100px]">{hasImage ? winner.name : winner}</span>
                                </>
                              ) : (
                                <span className="text-xs text-slate-600 font-medium italic">অপেক্ষা...</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Play Area */}
                  {activeCategories.length === 0 ? (
                    <div className="w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center shadow-lg">
                      <span className="text-4xl">🎡</span>
                      <h3 className="text-lg font-bold text-white mt-4">কোনো চাকা সক্রিয় নেই</h3>
                      <p className="text-xs text-slate-450 mt-1">অ্যাডমিন প্যানেল থেকে অন্তত একটি চাকা সক্রিয় করুন।</p>
                    </div>
                  ) : activeWheelIndex < activeCategories.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                      {/* Active category details card */}
                      <div className="bg-slate-800 border border-slate-750 p-6 rounded-3xl shadow flex flex-col justify-between items-center text-center">
                        <div className="w-full">
                          <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider">
                            চাকা {activeWheelIndex + 1} / {activeCategories.length}
                          </span>
                          <h2 className="text-2xl font-black text-white mt-1 mb-2">
                            {activeCategories[activeWheelIndex].name}
                          </h2>
                          <p className="text-xs text-slate-400 px-4 leading-relaxed font-medium">
                            চাকাটি ঘোরান এবং আজকের খেলার {activeCategories[activeWheelIndex].name} সিলেক্ট করুন!
                          </p>
                        </div>
                        
                        <div className="w-16 h-1.5 bg-slate-900 rounded-full my-6 flex overflow-hidden border border-slate-750">
                          {activeCategories.map((cat, idx) => (
                            <div
                              key={cat.id}
                              className={`flex-1 transition-all ${idx <= activeWheelIndex ? 'bg-rose-500' : 'bg-transparent'}`}
                            />
                          ))}
                        </div>

                        <div className="w-full space-y-2">
                          <span className="text-[9px] text-slate-555 font-bold uppercase tracking-wider block">চাকার অপশনসমূহ:</span>
                          <div className="flex flex-wrap justify-center gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                            {getActiveItems(activeCategories[activeWheelIndex]).map((item, idx) => (
                              <span
                                key={idx}
                                className="bg-slate-900 border border-slate-755 text-slate-350 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              >
                                {typeof item === 'object' ? item.name : item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Canvas Spinner Wheel Card */}
                      <div className="md:col-span-2 bg-slate-800 border border-slate-750 p-6 md:p-8 rounded-3xl shadow flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-4 right-4 flex items-center space-x-1.5 z-10">
                          <span className="text-[10px] text-slate-500 font-bold">মিউজিক</span>
                          <button
                            onClick={() => setIsMusicOn(!isMusicOn)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition ${
                              isMusicOn ? 'bg-indigo-950/40 border-indigo-500/20 text-indigo-300' : 'bg-slate-900 border-slate-750 text-slate-500'
                            }`}
                          >
                            {isMusicOn ? '🔊' : '🔇'}
                          </button>
                        </div>

                        <Wheel
                          key={activeCategories[activeWheelIndex].id}
                          category={activeCategories[activeWheelIndex]}
                          items={getActiveItems(activeCategories[activeWheelIndex])}
                          onSpinComplete={(win) => handleWheelComplete(activeCategories[activeWheelIndex].id, win)}
                          isMusicOn={isMusicOn}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full text-center py-10 flex flex-col items-center justify-center animate-scale-up">
                      <div className="w-16 h-16 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shadow-lg mb-5 animate-bounce">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-black text-white">সব চাকা স্পিন করা হয়েছে! 🎉</h3>
                      <p className="text-xs text-slate-400 mt-2 max-w-md">আপনার সংমিশ্রণ ফলাফলটি ওপরে ফলাফল বোর্ডে জমা আছে। আপনি চাইলে আবার শুরু করতে পারেন।</p>
                      <button
                        onClick={() => {
                          setComboResults({});
                          setActiveWheelIndex(0);
                          if (isMusicOn) playCelebrationSound();
                        }}
                        className="mt-6 px-10 py-3.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] transition"
                      >
                        আবার শুরু করুন 🔁
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* RENDER GAME 2: DICE GUESSING */}
              {currentGame.type === 'dice' && (
                <section className="w-full flex flex-col gap-6 animate-fade-in">
                  {/* Setup Screen */}
                  {diceGameState === 'setup' && (
                    <div className="bg-slate-800 border border-slate-750 p-6 md:p-8 rounded-3xl shadow-xl max-w-lg mx-auto w-full text-center">
                      <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700/60 p-2 shadow-lg">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <g transform="translate(50, 50)">
                            <circle cx="0" cy="0" r="45" fill="none" stroke="#E63946" strokeWidth="2.5" strokeDasharray="8 4" opacity="0.7"/>
                            <circle cx="0" cy="0" r="38" fill="#140817" stroke="#FF758F" strokeWidth="2"/>
                            <path d="M -15,-10 C -25,-25 -5,-30 0,-15 C 5,-30 25,-25 15,-10 C 5,5 0,18 0,22 C 0,18 -5,5 -15,-10 Z" fill="#E63946" opacity="0.9"/>
                            <circle cx="-6" cy="-12" r="3.5" fill="#FFE3E8"/>
                            <circle cx="6" cy="-12" r="3.5" fill="#FFE3E8"/>
                          </g>
                        </svg>
                      </div>
                      <h2 className="text-2xl font-black text-white mb-2">{currentGame.name} 🎲</h2>
                      <p className="text-xs text-slate-400 mb-6 font-medium">
                        পর্যায়ক্রমে ডাইস রোল করুন। সঠিক অনুমান করতে পারলে পার্টনারের পালা আসবে, আর ভুল হলে সুন্দর রোমান্টিক পেনাল্টি টাস্ক সম্পূর্ণ করতে হবে!
                      </p>

                      <div className="space-y-5 text-left bg-slate-900/40 p-5 rounded-2xl border border-slate-750 mb-6">
                        {/* Total Rounds */}
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">খেলার রাউন্ড সংখ্যা</label>
                          <div className="grid grid-cols-4 gap-2">
                            {[5, 10, 12, 'unlimited'].map(r => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setDiceTotalRounds(r)}
                                className={`py-2 text-xs font-bold rounded-xl transition border ${
                                  diceTotalRounds === r
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                                    : 'bg-slate-800 border-slate-750 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {r === 'unlimited' ? 'আনলিমিটেড' : `${r} রাউন্ড`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Starting Player */}
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">কে প্রথমে শুরু করবেন?</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setDiceCurrentTurn('wife')}
                              className={`py-2.5 text-xs font-bold rounded-xl transition border flex items-center justify-center space-x-1.5 ${
                                diceCurrentTurn === 'wife'
                                  ? 'bg-rose-900/30 border-rose-500/40 text-rose-300 shadow'
                                  : 'bg-slate-800 border-slate-750 text-slate-400 hover:text-slate-200'
                                }`}
                            >
                              <span>👩 মেয়ে</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDiceCurrentTurn('husband')}
                              className={`py-2.5 text-xs font-bold rounded-xl transition border flex items-center justify-center space-x-1.5 ${
                                diceCurrentTurn === 'husband'
                                  ? 'bg-indigo-900/30 border-indigo-500/40 text-indigo-300 shadow'
                                  : 'bg-slate-800 border-slate-750 text-slate-400 hover:text-slate-200'
                                }`}
                            >
                              <span>👨 ছেলে</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartDiceGame(diceTotalRounds, diceCurrentTurn)}
                        className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg transition active:scale-[0.98]"
                      >
                        খেলা শুরু করুন 🎮
                      </button>
                    </div>
                  )}

                  {/* Play Screen */}
                  {(diceGameState === 'playing' || diceGameState === 'result' || diceGameState === 'penalty') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                      {/* Stats Panel & History */}
                      <div className="bg-slate-800 border border-slate-750 p-5 rounded-3xl shadow flex flex-col gap-4">
                        <div className="border-b border-slate-750 pb-3">
                          <h3 className="text-sm font-bold text-slate-350">খেলার বিবরণী 📊</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-3.5 rounded-2xl border border-slate-750/60">
                          <div className="text-center border-r border-slate-750/60">
                            <span className="block text-[10px] text-slate-555 font-bold uppercase">বর্তমান রাউন্ড</span>
                            <span className="text-lg font-black text-white">
                              {diceTotalRounds === 'unlimited' ? `${diceCurrentRound}` : `${diceCurrentRound}/${diceTotalRounds}`}
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="block text-[10px] text-slate-555 font-bold uppercase">এখন খেলছেন</span>
                            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                              diceCurrentTurn === 'wife' 
                                ? 'bg-rose-950/40 text-rose-300 border border-rose-500/20' 
                                : 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/20'
                            }`}>
                              {diceCurrentTurn === 'wife' ? '👩 মেয়ে' : '👨 ছেলে'}
                            </span>
                          </div>
                        </div>

                        {/* History feed */}
                        <div className="flex-1 flex flex-col min-h-[180px]">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">আগের রাউন্ডগুলোর ফল:</span>
                          <div className="flex-1 overflow-y-auto max-h-[200px] space-y-2 pr-1.5 custom-scrollbar">
                            {diceRoundHistory.length === 0 ? (
                              <p className="text-center text-xs text-slate-600 italic py-6">কোনো রাউন্ড খেলা হয়নি</p>
                            ) : (
                              diceRoundHistory.map((h, i) => (
                                <div key={i} className="bg-slate-900/20 border border-slate-750/40 rounded-xl p-2 flex items-center justify-between text-xs">
                                  <span className="text-slate-500 font-bold">রাউন্ড {h.round}</span>
                                  <span className="font-semibold text-slate-350">{h.player === 'wife' ? 'মেয়ে' : 'ছেলে'}</span>
                                  <span className="font-bold bg-slate-900 px-2 py-0.5 rounded text-indigo-450">ডাইস: {h.roll}</span>
                                  <span className={`font-black ${h.result === 'correct' ? 'text-green-400' : 'text-rose-400'}`}>
                                    {h.result === 'correct' ? 'সঠিক ✅' : 'ভুল ❌'}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("আপনি কি নিশ্চিতভাবে গেমটি বন্ধ করে মেইন সেটআপে ফেরত যেতে চান?")) {
                              setDiceGameState('setup');
                            }
                          }}
                          className="w-full bg-slate-755 hover:bg-slate-700 text-slate-400 hover:text-slate-300 text-xs py-2 rounded-xl transition border border-slate-700"
                        >
                          খেলা রিসেট করুন 🔁
                        </button>
                      </div>

                      {/* Main Dice Rolling Box */}
                      <div className="md:col-span-2 bg-slate-800 border border-slate-750 p-6 md:p-8 rounded-3xl shadow flex flex-col items-center justify-center text-center relative overflow-hidden">
                        
                        {/* Status header */}
                        <div className="mb-6">
                          <span className="text-xs text-slate-400">১ থেকে ৬ এর মধ্যে যেকোনো একটি সংখ্যা মুখে অনুমান করুন!</span>
                          <h3 className="text-lg font-extrabold text-white mt-1">
                            {diceCurrentTurn === 'wife' ? '👩 মেয়ের অনুমান করার পালা' : '👨 ছেলের অনুমান করার পালা'}
                          </h3>
                        </div>

                        {/* SVG Dice Animation Representation */}
                        <div className="relative my-4 select-none">
                          <div className={`w-28 h-28 bg-gradient-to-br from-slate-900 to-slate-955 rounded-3xl border-4 border-slate-750 shadow-2xl flex items-center justify-center p-4 transition-all duration-300 ${
                            isDiceRolling ? 'animate-bounce scale-105 border-indigo-500' : 'border-slate-700'
                          }`}>
                            {diceRolledNumber ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                {/* Stylized Dice Dots Display */}
                                <div className="grid grid-cols-3 gap-3 w-16 h-16">
                                  {diceRolledNumber === 1 && (
                                    <div className="col-start-2 row-start-2 w-3.5 h-3.5 bg-rose-500 rounded-full mx-auto" />
                                  )}
                                  {diceRolledNumber === 2 && (
                                    <>
                                      <div className="col-start-1 row-start-1 w-3.5 h-3.5 bg-white rounded-full mx-auto" />
                                      <div className="col-start-3 row-start-3 w-3.5 h-3.5 bg-white rounded-full mx-auto" />
                                    </>
                                  )}
                                  {diceRolledNumber === 3 && (
                                    <>
                                      <div className="col-start-1 row-start-1 w-3.5 h-3.5 bg-white rounded-full mx-auto" />
                                      <div className="col-start-2 row-start-2 w-3.5 h-3.5 bg-white rounded-full mx-auto" />
                                      <div className="col-start-3 row-start-3 w-3.5 h-3.5 bg-white rounded-full mx-auto" />
                                    </>
                                  )}
                                  {diceRolledNumber === 4 && (
                                    <>
                                      <div className="col-start-1 row-start-1 w-3 h-3 bg-white rounded-full mx-auto" />
                                      <div className="col-start-3 row-start-1 w-3 h-3 bg-white rounded-full mx-auto" />
                                      <div className="col-start-1 row-start-3 w-3 h-3 bg-white rounded-full mx-auto" />
                                      <div className="col-start-3 row-start-3 w-3 h-3 bg-white rounded-full mx-auto" />
                                    </>
                                  )}
                                  {diceRolledNumber === 5 && (
                                    <>
                                      <div className="col-start-1 row-start-1 w-3 h-3 bg-white rounded-full mx-auto" />
                                      <div className="col-start-3 row-start-1 w-3 h-3 bg-white rounded-full mx-auto" />
                                      <div className="col-start-2 row-start-2 w-3 h-3 bg-white rounded-full mx-auto" />
                                      <div className="col-start-1 row-start-3 w-3 h-3 bg-white rounded-full mx-auto" />
                                      <div className="col-start-3 row-start-3 w-3 h-3 bg-white rounded-full mx-auto" />
                                    </>
                                  )}
                                  {diceRolledNumber === 6 && (
                                    <>
                                      <div className="col-start-1 row-start-1 w-3 h-3 bg-white rounded-full mx-auto" />
                                      <div className="col-start-3 row-start-1 w-3 h-3 bg-white rounded-full mx-auto" />
                                      <div className="col-start-1 row-start-2 w-3 h-3 bg-white rounded-full mx-auto" />
                                      <div className="col-start-3 row-start-2 w-3 h-3 bg-white rounded-full mx-auto" />
                                      <div className="col-start-1 row-start-3 w-3 h-3 bg-white rounded-full mx-auto" />
                                      <div className="col-start-3 row-start-3 w-3 h-3 bg-white rounded-full mx-auto" />
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-4xl text-slate-550">🎲</span>
                            )}
                          </div>
                        </div>

                        {/* Actions buttons */}
                        {diceGameState === 'playing' && (
                          <button
                            type="button"
                            disabled={isDiceRolling}
                            onClick={handleRollDice}
                            className="mt-6 px-10 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDiceRolling ? 'ডাইস ঘুরছে...' : '🎲 ডাইস রোল করুন'}
                          </button>
                        )}

                        {/* Did you guess correctly? Buttons */}
                        {diceGameState === 'result' && (
                          <div className="mt-6 w-full max-w-sm animate-scale-up flex flex-col items-center">
                            <p className="text-xs text-slate-400 mb-3">ডাইস রোল হয়েছে! আপনার মুখে করা অনুমানটি কি মিলেছে?</p>
                            <div className="grid grid-cols-2 gap-3 w-full">
                              <button
                                type="button"
                                onClick={() => handleDiceGuessResult(true)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl transition shadow active:scale-[0.98]"
                              >
                                ✅ হ্যাঁ, মিলেছে (Right)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDiceGuessResult(false)}
                                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-3 rounded-xl transition shadow active:scale-[0.98]"
                              >
                                ❌ না, ভুল হয়েছে (Wrong)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Penalty Display Screen */}
                        {diceGameState === 'penalty' && activePenaltyTask && (
                          <div className="mt-6 bg-slate-900/60 p-5 rounded-2xl border border-rose-500/20 w-full max-w-md animate-scale-up flex flex-col items-center text-center">
                            <span className="inline-block bg-rose-900/30 text-rose-300 border border-rose-500/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded mb-3">
                              ভুল অনুমানের পেনাল্টি টাস্ক 🤫
                            </span>
                            
                            <h4 className="text-xs font-bold text-slate-450 mb-1">
                              {diceCurrentTurn === 'wife' ? '👩 মেয়ের জন্য নির্ধারণ করা টাস্ক:' : '👨 ছেলের জন্য নির্ধারণ করা টাস্ক:'}
                            </h4>
                            
                            {/* Task Image (If configured) */}
                            {activePenaltyTask.url && (
                              <div className="w-full max-w-[240px] aspect-[4/3] rounded-2xl overflow-hidden border border-rose-500/20 shadow-md mb-3 bg-slate-950/45 flex items-center justify-center relative group">
                                <img 
                                  src={activePenaltyTask.url} 
                                  alt={activePenaltyTask.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            
                            <h3 className="text-lg font-black text-rose-350 tracking-wide mb-1 leading-snug">
                              {activePenaltyTask.name}
                            </h3>

                            {activePenaltyTask.description && (
                              <p className="text-xs text-slate-400 font-medium px-4 py-2 bg-slate-900/40 rounded-xl border border-slate-750/30 leading-relaxed mb-4 whitespace-pre-wrap max-w-sm">
                                {activePenaltyTask.description}
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={handleCompletePenalty}
                              className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 rounded-xl transition shadow active:scale-[0.98]"
                            >
                              টাস্ক সম্পন্ন হয়েছে এবং মেনে নিলাম ✅
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  )}

                  {/* Ended Screen */}
                  {diceGameState === 'ended' && (
                    <div className="bg-slate-800 border border-slate-750 p-8 rounded-3xl shadow-xl max-w-md mx-auto w-full text-center animate-scale-up">
                      <span className="text-5xl">🏆</span>
                      <h2 className="text-2xl font-black text-white mt-4 mb-2">খেলা সমাপ্ত!</h2>
                      <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                        সবগুলো রাউন্ড সফলভাবে খেলা হয়েছে! দাম্পত্য বন্ধন ও ঘনিষ্ঠতা আরও মধুর হোক। 💖
                      </p>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setDiceGameState('setup')}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-xs shadow transition"
                        >
                          আবার খেলুন 🔁
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveGameId(null)}
                          className="w-full bg-slate-750 hover:bg-slate-700 text-slate-350 py-3 rounded-xl font-bold text-xs transition"
                        >
                          গেম সিলেকশনে ফিরুন 🔙
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          );
        })()}

        {/* SECTION 2 (BOTTOM): CONFIGURATION AND MANAGEMENT */}
        {showControlBoard && (
          <section className="w-full flex flex-col gap-8">
            
            {/* CATEGORIES MANAGEMENT & CONTROL BOARD */}
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-700 pb-3 mb-6 gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-white">চাকা ও ক্যাটেগরি কন্ট্রোল বোর্ড</h2>
                  <p className="text-xs text-slate-400">
                    নতুন চাকা তৈরি করুন ও তাদের অপশন/ছবিগুলো ম্যানেজ করুন
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportConfig}
                    className="bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                    title="আপনার কাস্টম চাকা ও ছবিসমূহ একটি ফাইল আকারে ডাউনলোড করুন"
                  >
                    <span>📥 এক্সপোর্ট ব্যাকআপ</span>
                  </button>
                  <label
                    className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1"
                    title="আগে ডাউনলোড করা ব্যাকআপ ফাইল আপলোড করুন"
                  >
                    <span>📤 ইমপোর্ট ব্যাকআপ</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportConfig}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleClearAll}
                    className="bg-rose-900/30 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    সব ডেটা রিসেট করুন
                  </button>
                </div>
              </div>

            {/* Create New Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-3 mb-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/60">
              <div className="flex-1">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="নতুন হুইল/চাকার নাম লিখুন (যেমন: উপহার, টাস্ক, আকর্ষণ)"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow"
              >
                হুইল তৈরি করুন
              </button>
            </form>

            {/* Categories Management Cards */}
            <div className="space-y-8">
              {categories.filter(c => c.id !== 'husband_tasks' && c.id !== 'wife_tasks').map((cat) => (
                <div key={cat.id} className="bg-slate-900/40 border border-slate-700/50 p-5 rounded-2xl space-y-4">
                  
                  {/* Category Header Controls */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`cat_chk_${cat.id}`}
                        checked={cat.enabled}
                        onChange={() => toggleCategoryEnabled(cat.id)}
                        className="w-5 h-5 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                      />
                      
                      {renamingCatId === cat.id ? (
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            value={renamingNameValue}
                            onChange={(e) => setRenamingNameValue(e.target.value)}
                            className="bg-slate-850 text-white border border-slate-700 px-2 py-1 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-500 w-32"
                            placeholder="হুইলের নাম"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameCategory(cat.id);
                              else if (e.key === 'Escape') setRenamingCatId(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameCategory(cat.id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded transition"
                          >
                            সেভ
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingCatId(null)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold px-2 py-1 rounded transition"
                          >
                            বাতিল
                          </button>
                        </div>
                      ) : (
                        <label htmlFor={`cat_chk_${cat.id}`} className="text-base font-extrabold text-slate-200 cursor-pointer flex items-center space-x-2">
                          <span>{cat.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setRenamingCatId(cat.id);
                              setRenamingNameValue(cat.name);
                            }}
                            className="text-slate-500 hover:text-indigo-400 p-0.5 transition"
                            title="নাম পরিবর্তন করুন"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </label>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>চাকা ডিলিট</span>
                    </button>
                  </div>

                  {/* Category Inputs (Unified Option Form) */}
                  {true && (
                    <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex flex-col space-y-2">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">অপশন যুক্ত করুন (টেক্সট ও ছবি)</label>
                        <input
                          type="text"
                          value={(newItemsText[cat.id] && newItemsText[cat.id].name) || ''}
                          onChange={(e) => setNewItemsText(prev => ({
                            ...prev,
                            [cat.id]: { ...(prev[cat.id] || {}), name: e.target.value }
                          }))}
                          className="w-full bg-slate-800 text-white border border-slate-700 px-3 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="টাইটেল / নাম (যেমন: কফি ডেট)"
                        />
                        <input
                          type="text"
                          value={(newItemsText[cat.id] && newItemsText[cat.id].description) || ''}
                          onChange={(e) => setNewItemsText(prev => ({
                            ...prev,
                            [cat.id]: { ...(prev[cat.id] || {}), description: e.target.value }
                          }))}
                          className="w-full bg-slate-800 text-white border border-slate-700 px-3 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="বিবরণ / ডেসক্রিপশন (ঐচ্ছিক)"
                        />
                        <div className="flex items-center space-x-2 bg-slate-800 p-2 rounded-lg border border-slate-750">
                          <span className="text-[10px] text-slate-400 font-bold shrink-0">ছবি (ঐচ্ছিক):</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setAddItemFile(prev => ({ ...prev, [cat.id]: file }));
                              }
                            }}
                            className="text-xs text-slate-400 cursor-pointer w-full"
                          />
                        </div>
                        {addItemFile[cat.id] && (
                          <div className="flex items-center space-x-2 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                            <span className="text-[10px] text-emerald-400 truncate max-w-[150px]">
                              {addItemFile[cat.id].name}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAddItemFile(prev => {
                                const next = { ...prev };
                                delete next[cat.id];
                                return next;
                              })}
                              className="text-[9px] text-rose-400 hover:underline"
                            >
                              সরান
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAddItem(cat.id)}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-lg transition"
                        >
                          যোগ করুন
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Select All options for images inside category */}
                  {cat.items && cat.items.some(item => typeof item === 'object') && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelectAllImagesForCat(cat.id, true)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded transition"
                      >
                        সব ছবি সিলেক্ট
                      </button>
                      <button
                        onClick={() => handleSelectAllImagesForCat(cat.id, false)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded transition"
                      >
                        সব ছবি ডিসিলেক্ট
                      </button>
                    </div>
                  )}

                  {/* Unified List of Items (Mixed Text and Images) */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-64 custom-scrollbar">
                    {(!cat.items || cat.items.length === 0) ? (
                      <div className="text-xs text-slate-500 italic py-2 text-center">কোনো অপশন বা ছবি যুক্ত করা নেই।</div>
                    ) : (
                      cat.items.map((item, itemIdx) => {
                        const isImage = typeof item === 'object' && item !== null && item.url;
                        
                        if (isImage) {
                          // Render Image Item Card
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-2 rounded-xl border transition ${
                                selectedImageIds.has(item.id)
                                  ? 'bg-slate-950/60 border-indigo-500/40'
                                  : 'bg-slate-950/10 border-slate-800 opacity-60'
                              }`}
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={selectedImageIds.has(item.id)}
                                  onChange={() => toggleImageSelection(item.id)}
                                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className="text-[10px] font-bold text-slate-500">{(itemIdx + 1)}</span>
                                <img
                                  src={item.url}
                                  alt={item.name}
                                  className="w-9 h-9 object-cover rounded-lg border border-slate-800 shadow-sm"
                                  onError={(e) => {
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'/%3E%3C/svg%3E";
                                  }}
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[150px] sm:max-w-[200px]" title={item.name}>
                                    {item.name} <span className="text-[8px] bg-slate-850 border border-slate-800 px-1 py-0.5 rounded text-indigo-300 ml-1 uppercase">ছবি</span>
                                  </span>
                                  {item.description && (
                                    <span className="text-[10px] text-slate-500 truncate max-w-[150px] sm:max-w-[200px]" title={item.description}>
                                      {item.description}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {true && (
                                <div className="flex space-x-1 shrink-0">
                                  <button
                                    onClick={() => setEditingImage({ categoryId: cat.id, imageItem: { id: item.id, name: item.name, description: item.description } })}
                                    className="text-slate-500 hover:text-indigo-400 p-1 rounded transition"
                                  >
                                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteImageItem(cat.id, item.id)}
                                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                                  >
                                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          const textName = typeof item === 'object' && item !== null ? item.name : item;
                          const textDesc = typeof item === 'object' && item !== null ? item.description : '';

                          return (
                            <div
                              key={item.id || itemIdx}
                              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-850 bg-slate-950/20"
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                <span className="text-[10px] font-bold text-slate-500">{(itemIdx + 1)}</span>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]" title={textName}>
                                    {textName} <span className="text-[8px] bg-slate-850 border border-slate-800 px-1 py-0.5 rounded text-emerald-400 ml-1 uppercase">টেক্সট</span>
                                  </span>
                                  {textDesc && (
                                    <span className="text-[10px] text-slate-500 truncate max-w-[200px]" title={textDesc}>
                                      {textDesc}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {true && (
                                <div className="flex space-x-1 shrink-0">
                                  <button
                                    onClick={() => setEditingImage({ 
                                      categoryId: cat.id, 
                                      imageItem: { 
                                        id: item.id || itemIdx, 
                                        name: textName, 
                                        description: textDesc,
                                        url: typeof item === 'object' ? item.url : null 
                                      } 
                                    })}
                                    className="text-slate-500 hover:text-indigo-400 p-1 rounded transition"
                                  >
                                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(cat.id, itemIdx)}
                                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                                  >
                                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        }
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

            {/* GAME ACTIVATION & VISIBILITY CONTROL */}
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-md space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-white mb-1">🎮 গেম ও গেমপ্লে ম্যানেজার</h3>
                <p className="text-xs text-slate-400 font-medium">নতুন গেম তৈরি করুন, সক্রিয়/নিষ্ক্রিয় করুন অথবা ডিলিট করুন</p>
              </div>

              {/* List of games */}
              <div className="space-y-3">
                {games.map(g => (
                  <div key={g.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-slate-750 gap-4 animate-scale-up">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold text-white">{g.name}</span>
                        <span className={`text-[9px] px-2 py-0.5 font-bold rounded-full ${
                          g.type === 'spin' ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-500/20' : 'bg-rose-900/40 text-rose-300 border border-rose-500/20'
                        }`}>
                          {g.type === 'spin' ? '🎡 স্পিন চাকা' : '🎲 ডাইস রোল'}
                        </span>
                      </div>
                      {g.description && <p className="text-[10px] text-slate-450 mt-1">{g.description}</p>}
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <span className="text-[10px] text-slate-400 font-bold">সক্রিয়</span>
                        <input
                          type="checkbox"
                          checked={g.enabled}
                          onChange={() => handleToggleGame(g.id)}
                          className="w-4 h-4 rounded text-indigo-650 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                        />
                      </label>
                      
                      <button
                        onClick={() => handleDeleteGame(g.id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/30 text-slate-400 hover:text-rose-455 rounded-lg transition"
                        title="গেম ডিলিট করুন"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add game form */}
              <form onSubmit={handleCreateGame} className="bg-slate-900/60 p-4 rounded-2xl border border-rose-500/10 space-y-4">
                <span className="text-xs font-extrabold text-rose-350 block border-b border-slate-850 pb-2">➕ নতুন গেম যোগ করুন</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">গেমের নাম</label>
                    <input
                      type="text"
                      value={newGameName}
                      onChange={(e) => setNewGameName(e.target.value)}
                      placeholder="যেমন: রোমান্টিক ডাইস ফাইট"
                      className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">গেমের ধরণ</label>
                    <select
                      value={newGameType}
                      onChange={(e) => setNewGameType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="spin">🎡 স্পিন চাকা (Spin Wheel)</option>
                      <option value="dice">🎲 ডাইস রোল (Dice Guessing)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">গেমের বিবরণ (Description)</label>
                  <input
                    type="text"
                    value={newGameDesc}
                    onChange={(e) => setNewGameDesc(e.target.value)}
                    placeholder="সংক্ষিপ্ত বর্ণনা..."
                    className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow active:scale-[0.98]"
                >
                  গেম তৈরি করুন 🚀
                </button>
              </form>
            </div>

            {/* GITHUB SYNC & GO LIVE DEPLOYMENT PANEL */}
            {!isDev && (
              <div className="bg-slate-800 p-6 rounded-3xl border border-rose-500/20 shadow-md space-y-6 animate-scale-up">
                <div>
                  <h3 className="text-base font-extrabold text-white mb-1">☁️ গিটহাব সিঙ্ক ও ক্লাউড ডেপ্লয়মেন্ট (Go Live)</h3>
                  <p className="text-xs text-slate-400 font-medium">মোবাইল বা যেকোনো ডিভাইস থেকে করা কাস্টমাইজেশন সরাসরি লাইভ সার্ভারে সেভ করুন</p>
                </div>

                <form onSubmit={handleSyncToGitHub} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">GitHub Username</label>
                      <input
                        type="text"
                        value={ghUsername}
                        onChange={(e) => setGhUsername(e.target.value)}
                        placeholder="যেমন: md-sakib"
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Repository Name</label>
                      <input
                        type="text"
                        value={ghRepo}
                        onChange={(e) => setGhRepo(e.target.value)}
                        placeholder="যেমন: mayabritto-app"
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Branch Name</label>
                      <input
                        type="text"
                        value={ghBranch}
                        onChange={(e) => setGhBranch(e.target.value)}
                        placeholder="main বা master"
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">GitHub Personal Access Token (PAT)</label>
                      <input
                        type="password"
                        value={ghToken}
                        onChange={(e) => setGhToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-500/10 text-[11px] text-slate-400 leading-relaxed font-medium">
                    💡 **কিভাবে কাজ করে?** আপনি যখন <strong>"লাইভ করুন ও ডিপ্লয় করুন"</strong> বাটনে চাপবেন, অ্যাপটি গিটহাব এপিআই-এর মাধ্যমে আপনার করা সকল পরিবর্তন সরাসরি আপনার রিপোজিটরির <code>public/uploads/config.json</code>-এ কমিট করে দেবে। এরপর নেটলিফাই স্বয়ংক্রিয়ভাবে প্রজেক্টটি রিবিল্ড করে ৩০ সেকেন্ডের মধ্যে লাইভ করে দেবে!
                  </div>

                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isSyncing ? "সিঙ্ক করা হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন ⏳" : "🚀 লাইভ করুন ও ডিপ্লয় করুন (Sync & Go Live)"}
                  </button>
                </form>
              </div>
            )}


            {/* DICE GAME PENALTY TASKS EDITOR */}
            <div className="space-y-6">
              <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-md">
                <h3 className="text-base font-extrabold text-white mb-1">🎲 ডাইস গেম পেনাল্টি টাস্ক কাস্টমাইজেশন</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  ভুল অনুমানের শাস্তি হিসেবে ছেলে ও মেয়ের জন্য আলাদা রোমান্টিক টাস্ক সেট করুন। এখানেও আপনি টাইটেল, ডেসক্রিপশন এবং ছবি যুক্ত করতে পারবেন!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 👩 WIFE TASKS EDITOR CARD */}
                {wifeCat && (
                  <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-md space-y-4">
                    <div className="border-b border-slate-750 pb-3 flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-rose-350">👩 মেয়ের পেনাল্টি টাস্ক তালিকা</h4>
                      <span className="text-[10px] bg-rose-950/40 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold">
                        মোট: {wifeTasks.length} টি
                      </span>
                    </div>

                    {/* Add Task Form */}
                    <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-750/60 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">নতুন টাস্ক যোগ করুন</span>
                      <input
                        type="text"
                        value={(newItemsText['wife_tasks'] && newItemsText['wife_tasks'].name) || ''}
                        onChange={(e) => setNewItemsText(prev => ({
                          ...prev,
                          ['wife_tasks']: { ...(prev['wife_tasks'] || {}), name: e.target.value }
                        }))}
                        className="w-full bg-slate-850 text-white border border-slate-700 px-3 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-rose-500 transition"
                        placeholder="টাস্কের নাম / টাইটেল"
                      />
                      <input
                        type="text"
                        value={(newItemsText['wife_tasks'] && newItemsText['wife_tasks'].description) || ''}
                        onChange={(e) => setNewItemsText(prev => ({
                          ...prev,
                          ['wife_tasks']: { ...(prev['wife_tasks'] || {}), description: e.target.value }
                        }))}
                        className="w-full bg-slate-850 text-white border border-slate-700 px-3 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-rose-500 transition"
                        placeholder="বিস্তারিত বিবরণ / বর্ণনা (ঐচ্ছিক)"
                      />
                      <div className="flex items-center space-x-2 bg-slate-850 p-2 rounded-xl border border-slate-750">
                        <span className="text-[10px] text-slate-450 font-bold shrink-0">ছবি (ঐচ্ছিক):</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setAddItemFile(prev => ({ ...prev, ['wife_tasks']: file }));
                            }
                          }}
                          className="text-xs text-slate-500 cursor-pointer w-full"
                        />
                      </div>
                      {addItemFile['wife_tasks'] && (
                        <div className="flex items-center justify-between bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-750">
                          <span className="text-[10px] text-emerald-400 truncate max-w-[200px]">
                            {addItemFile['wife_tasks'].name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAddItemFile(prev => {
                              const next = { ...prev };
                              delete next['wife_tasks'];
                              return next;
                            })}
                            className="text-[9px] text-rose-400 hover:underline"
                          >
                            সরান
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAddItem('wife_tasks')}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2 rounded-xl transition shadow active:scale-[0.98]"
                      >
                        টাস্ক যোগ করুন ➕
                      </button>
                    </div>

                    {/* Tasks List */}
                    <div className="overflow-y-auto space-y-2 max-h-[300px] pr-1.5 custom-scrollbar">
                      {wifeTasks.length === 0 ? (
                        <p className="text-center text-xs text-slate-500 italic py-6">কোনো টাস্ক যুক্ত করা নেই</p>
                      ) : (
                        wifeTasks.map((item, itemIdx) => {
                          const isImage = typeof item === 'object' && item !== null && item.url;
                          const nameVal = typeof item === 'object' && item !== null ? item.name : item;
                          const descVal = typeof item === 'object' && item !== null ? item.description : '';
                          
                          return (
                            <div key={item.id || itemIdx} className="bg-slate-900/30 border border-slate-750/50 rounded-xl p-2.5 flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <span className="text-[10px] text-slate-500 font-bold">{(itemIdx + 1)}</span>
                                {isImage && (
                                  <img 
                                    src={item.url} 
                                    alt={nameVal} 
                                    className="w-8 h-8 object-cover rounded-lg border border-slate-750" 
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-slate-200 truncate max-w-[140px] sm:max-w-[180px]">{nameVal}</span>
                                  {descVal && <span className="text-[10px] text-slate-500 truncate max-w-[140px] sm:max-w-[180px]">{descVal}</span>}
                                </div>
                              </div>

                              <div className="flex space-x-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setEditingImage({
                                    categoryId: 'wife_tasks',
                                    imageItem: { id: item.id || itemIdx, name: nameVal, description: descVal, url: isImage ? item.url : null }
                                  })}
                                  className="text-slate-500 hover:text-indigo-400 p-1"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => isImage ? handleDeleteImageItem('wife_tasks', item.id) : handleDeleteItem('wife_tasks', itemIdx)}
                                  className="text-slate-500 hover:text-rose-450 p-1"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* 👨 HUSBAND TASKS EDITOR CARD */}
                {husbandCat && (
                  <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-md space-y-4">
                    <div className="border-b border-slate-750 pb-3 flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-indigo-350">👨 ছেলের পেনাল্টি টাস্ক তালিকা</h4>
                      <span className="text-[10px] bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">
                        মোট: {husbandTasks.length} টি
                      </span>
                    </div>

                    {/* Add Task Form */}
                    <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-750/60 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">নতুন টাস্ক যোগ করুন</span>
                      <input
                        type="text"
                        value={(newItemsText['husband_tasks'] && newItemsText['husband_tasks'].name) || ''}
                        onChange={(e) => setNewItemsText(prev => ({
                          ...prev,
                          ['husband_tasks']: { ...(prev['husband_tasks'] || {}), name: e.target.value }
                        }))}
                        className="w-full bg-slate-850 text-white border border-slate-700 px-3 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition"
                        placeholder="টাস্কের নাম / টাইটেল"
                      />
                      <input
                        type="text"
                        value={(newItemsText['husband_tasks'] && newItemsText['husband_tasks'].description) || ''}
                        onChange={(e) => setNewItemsText(prev => ({
                          ...prev,
                          ['husband_tasks']: { ...(prev['husband_tasks'] || {}), description: e.target.value }
                        }))}
                        className="w-full bg-slate-850 text-white border border-slate-700 px-3 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition"
                        placeholder="বিস্তারিত বিবরণ / বর্ণনা (ঐচ্ছিক)"
                      />
                      <div className="flex items-center space-x-2 bg-slate-850 p-2 rounded-xl border border-slate-750">
                        <span className="text-[10px] text-slate-450 font-bold shrink-0">ছবি (ঐচ্ছিক):</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setAddItemFile(prev => ({ ...prev, ['husband_tasks']: file }));
                            }
                          }}
                          className="text-xs text-slate-500 cursor-pointer w-full"
                        />
                      </div>
                      {addItemFile['husband_tasks'] && (
                        <div className="flex items-center justify-between bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-750">
                          <span className="text-[10px] text-emerald-400 truncate max-w-[200px]">
                            {addItemFile['husband_tasks'].name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAddItemFile(prev => {
                              const next = { ...prev };
                              delete next['husband_tasks'];
                              return next;
                            })}
                            className="text-[9px] text-rose-400 hover:underline"
                          >
                            সরান
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAddItem('husband_tasks')}
                        className="w-full bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-xl transition shadow active:scale-[0.98]"
                      >
                        টাস্ক যোগ করুন ➕
                      </button>
                    </div>

                    {/* Tasks List */}
                    <div className="overflow-y-auto space-y-2 max-h-[300px] pr-1.5 custom-scrollbar">
                      {husbandTasks.length === 0 ? (
                        <p className="text-center text-xs text-slate-500 italic py-6">কোনো টাস্ক যুক্ত করা নেই</p>
                      ) : (
                        husbandTasks.map((item, itemIdx) => {
                          const isImage = typeof item === 'object' && item !== null && item.url;
                          const nameVal = typeof item === 'object' && item !== null ? item.name : item;
                          const descVal = typeof item === 'object' && item !== null ? item.description : '';
                          
                          return (
                            <div key={item.id || itemIdx} className="bg-slate-900/30 border border-slate-750/50 rounded-xl p-2.5 flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <span className="text-[10px] text-slate-500 font-bold">{(itemIdx + 1)}</span>
                                {isImage && (
                                  <img 
                                    src={item.url} 
                                    alt={nameVal} 
                                    className="w-8 h-8 object-cover rounded-lg border border-slate-750" 
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-slate-200 truncate max-w-[140px] sm:max-w-[180px]">{nameVal}</span>
                                  {descVal && <span className="text-[10px] text-slate-500 truncate max-w-[140px] sm:max-w-[180px]">{descVal}</span>}
                                </div>
                              </div>

                              <div className="flex space-x-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setEditingImage({
                                    categoryId: 'husband_tasks',
                                    imageItem: { id: item.id || itemIdx, name: nameVal, description: descVal, url: isImage ? item.url : null }
                                  })}
                                  className="text-slate-500 hover:text-indigo-400 p-1"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => isImage ? handleDeleteImageItem('husband_tasks', item.id) : handleDeleteItem('husband_tasks', itemIdx)}
                                  className="text-slate-500 hover:text-rose-450 p-1"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
      )}
    </main>

      {/* Edit Option Modal Dialog */}
      {editingImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-3xl w-full max-w-md shadow-2xl relative animate-scale-up">
            <h2 className="text-xl font-bold text-white mb-4">অপশন পরিবর্তন করুন</h2>
            
            <form onSubmit={handleUpdateImage} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1">টাইটেল (নাম)</label>
                <input
                  type="text"
                  value={editingImage.imageItem.name}
                  onChange={(e) => setEditingImage(prev => ({ 
                    ...prev, 
                    imageItem: { ...prev.imageItem, name: e.target.value } 
                  }))}
                  className="w-full bg-slate-700 text-white border border-slate-600 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="অপশনের নাম"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1">ডেসক্রিপশন (বিবরণ)</label>
                <textarea
                  value={editingImage.imageItem.description}
                  onChange={(e) => setEditingImage(prev => ({ 
                    ...prev, 
                    imageItem: { ...prev.imageItem, description: e.target.value } 
                  }))}
                  rows="3"
                  className="w-full bg-slate-700 text-white border border-slate-600 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                  placeholder="অপশনের বিবরণ (ঐচ্ছিক)"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1">
                  {editingImage.imageItem.url ? 'ছবি পরিবর্তন করুন' : 'ছবি যোগ করুন (ঐচ্ছিক)'}
                </label>
                <div className="flex items-center space-x-3 bg-slate-700 p-2.5 rounded-xl border border-slate-600">
                  {editingImage.imageItem.url && (
                    <img 
                      src={editingImage.imageItem.url} 
                      alt="preview" 
                      className="w-12 h-12 object-cover rounded border border-slate-500" 
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        try {
                          const dataUrl = await fileToDataURL(file);
                          setEditingImage(prev => ({
                            ...prev,
                            newImageDataUrl: dataUrl,
                            imageItem: { ...prev.imageItem, url: URL.createObjectURL(file) }
                          }));
                        } catch (err) {
                          console.error(err);
                          alert("ছবি লোড করা যায়নি!");
                        }
                      }
                    }}
                    className="text-xs text-slate-300 w-full cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingImage(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold p-2.5 rounded-xl transition"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold p-2.5 rounded-xl transition"
                >
                  আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Spin Result Celebration Modal */}
      {activePopupWinner && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl w-full max-w-md shadow-2xl relative text-center transform scale-100 transition-all duration-300 animate-scale-up">
            
            {/* Confetti decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
              <div className="confetti-piece bg-rose-500 left-[10%] animate-confetti-1"></div>
              <div className="confetti-piece bg-indigo-500 left-[30%] animate-confetti-2"></div>
              <div className="confetti-piece bg-amber-500 left-[50%] animate-confetti-3"></div>
              <div className="confetti-piece bg-emerald-500 left-[70%] animate-confetti-4"></div>
              <div className="confetti-piece bg-pink-500 left-[90%] animate-confetti-5"></div>
            </div>

            <h2 className="text-2xl font-extrabold text-yellow-400 tracking-wide mb-1 uppercase tracking-wide">
              {activePopupWinner.categoryName} বিজয়ী! 🎉
            </h2>
            <p className="text-slate-400 text-xs mb-6">চাকা ঘূর্ণনের সর্বশেষ ফলাফল</p>

            {/* Winner Content display */}
            <div className="flex flex-col items-center justify-center mb-6">
              {typeof activePopupWinner.item === 'object' && activePopupWinner.item !== null && activePopupWinner.item.url ? (
                // Image Winner display
                <div className="flex flex-col items-center">
                  <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-4 border-yellow-400 shadow-xl bg-slate-900 flex items-center justify-center">
                    <img
                      src={activePopupWinner.item.url}
                      alt={activePopupWinner.item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'/%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-3 truncate max-w-[200px]" title={activePopupWinner.item.name}>
                    {activePopupWinner.item.name}
                  </h3>
                  {activePopupWinner.item.description && (
                    <p className="text-xs text-slate-400 mt-1 max-w-[250px] italic truncate" title={activePopupWinner.item.description}>
                      {activePopupWinner.item.description}
                    </p>
                  )}
                </div>
              ) : (
                // Text Winner display
                <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl px-8 py-6 w-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-2xl font-black text-green-400 tracking-wide select-all text-center">
                    {typeof activePopupWinner.item === 'object' && activePopupWinner.item !== null ? activePopupWinner.item.name : activePopupWinner.item}
                  </span>
                  {typeof activePopupWinner.item === 'object' && activePopupWinner.item !== null && activePopupWinner.item.description && (
                    <p className="text-xs text-slate-400 mt-2 max-w-[250px] italic text-center">
                      {activePopupWinner.item.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleClosePopup}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition duration-150 active:scale-[0.98] shadow-md"
            >
              বন্ধ করুন (বোর্ডে যোগ করুন)
            </button>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {detailViewItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl w-full max-w-md shadow-2xl relative text-center transform scale-100 transition-all duration-300 animate-scale-up">
            <h2 className="text-xl font-extrabold text-indigo-300 mb-1 uppercase tracking-wide">
              {detailViewItem.categoryName} ফলাফল বিবরণ 📋
            </h2>
            <p className="text-slate-400 text-xs mb-6">বিস্তারিত বিবরণ ও চিত্র</p>

            <div className="flex flex-col items-center justify-center mb-6">
              {typeof detailViewItem.item === 'object' && detailViewItem.item !== null && detailViewItem.item.url ? (
                // Image Details
                <div className="flex flex-col items-center">
                  <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-3 border-indigo-500 shadow-xl bg-slate-900 flex items-center justify-center">
                    <img
                      src={detailViewItem.item.url}
                      alt={detailViewItem.item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'/%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-3 truncate max-w-[200px]" title={detailViewItem.item.name}>
                    {detailViewItem.item.name}
                  </h3>
                  {detailViewItem.item.description ? (
                    <p className="text-xs text-slate-450 mt-2 max-w-[250px] whitespace-pre-wrap text-left">
                      {detailViewItem.item.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-2 italic">কোনো বিবরণ নেই</p>
                  )}
                </div>
              ) : (
                // Text Details
                <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl px-8 py-6 w-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-xl font-bold text-white tracking-wide text-center">
                    {typeof detailViewItem.item === 'object' && detailViewItem.item !== null ? detailViewItem.item.name : detailViewItem.item}
                  </span>
                  {typeof detailViewItem.item === 'object' && detailViewItem.item !== null && detailViewItem.item.description && (
                    <p className="text-xs text-slate-450 mt-2 max-w-[250px] whitespace-pre-wrap text-center">
                      {detailViewItem.item.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setDetailViewItem(null)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl transition duration-150 active:scale-[0.98]"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
