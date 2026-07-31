import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  deleteUser,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import {
  Home,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Heart,
  Target,
  RefreshCw,
  Palette,
  Search,
  Camera,
  Eye,
  EyeOff,
  Clock,
  BarChart2,
  Lightbulb,
  Settings,
  Plus,
  X,
  Wallet,
  PiggyBank,
  TrendingUp,
  Calendar,
  Check,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Sparkles,
  AlertCircle,
  Banknote,
  Gift,
  Repeat,
  Edit3,
  Landmark
} from "lucide-react";
const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
  isNaN(v) ? 0 : v
);
const uid = () => Math.random().toString(36).slice(2, 10);
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Mar\xE7o",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];
const monthKey = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;
const todayISO = () => {
  const dt = /* @__PURE__ */ new Date();
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};
const addMonthsToKey = (y, m, n) => {
  const d = new Date(y, m + n, 1);
  return { y: d.getFullYear(), m: d.getMonth(), key: monthKey(d.getFullYear(), d.getMonth()) };
};
const dateInMonth = (isoDate, y, m) => {
  const d = /* @__PURE__ */ new Date(isoDate + "T00:00:00");
  return d.getFullYear() === y && d.getMonth() === m;
};
function storageKey(uid2) {
  return `lumen-financeiro-${uid2}`;
}
function loadStorage(uid2) {
  try {
    const raw = window.localStorage.getItem(storageKey(uid2));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("N\xE3o foi poss\xEDvel ler dados salvos, usando dados de exemplo.", e);
    return null;
  }
}
function saveStorage(uid2, data) {
  try {
    window.localStorage.setItem(storageKey(uid2), JSON.stringify(data));
  } catch (e) {
    console.warn("N\xE3o foi poss\xEDvel salvar os dados localmente.", e);
  }
}
function useStoredState(uid2, key, seed) {
  const [value, setValue] = useState(() => {
    const stored = loadStorage(uid2);
    return stored && stored[key] !== void 0 ? stored[key] : seed;
  });
  return [value, setValue];
}
const SEED_EXPENSE_CATEGORIES = [
  "Alimenta\xE7\xE3o",
  "Transporte",
  "Moradia",
  "Sa\xFAde",
  "Lazer",
  "Educa\xE7\xE3o",
  "Assinaturas",
  "Compras",
  "Pets",
  "Outros"
];
const SEED_INCOME_CATEGORIES = ["Sal\xE1rio", "Freelance", "Rendimentos", "Presente", "Outros"];
const SEED_PAYMENT_METHODS = ["Dinheiro", "Pix", "D\xE9bito", "Cr\xE9dito", "Boleto"];
const BANKS = ["Nubank", "Ita\xFA", "Bradesco", "Banco do Brasil", "Inter", "Caixa", "Santander", "C6 Bank"];
const CARD_COLORS = ["#8657C9", "#D6669E", "#5B8BD6", "#D69A56", "#56B08A", "#4A3D63"];
const SEED_DEBT_TYPES = ["Empr\xE9stimo pessoal", "Financiamento", "Cons\xF3rcio", "Cheque especial", "Cart\xE3o rotativo", "Outro"];
const CAT_ICON_COLOR = {
  Alimenta\u00E7\u00E3o: "#D6669E",
  Transporte: "#5B8BD6",
  Moradia: "#8657C9",
  Sa\u00FAde: "#56B08A",
  Lazer: "#D69A56",
  Educa\u00E7\u00E3o: "#6E7FD1",
  Assinaturas: "#B26AD6",
  Compras: "#D65C6E",
  Pets: "#4FAE9C",
  Outros: "#85789C",
  Sal\u00E1rio: "#56B08A",
  Freelance: "#5B8BD6",
  Rendimentos: "#8657C9",
  Presente: "#D6669E"
};
const CAT_COLOR_PALETTE = ["#8657C9", "#D6669E", "#5B8BD6", "#D69A56", "#56B08A", "#6E7FD1", "#B26AD6", "#D65C6E", "#4FAE9C", "#C9739E"];
const THEME_PALETTES = {
  lavanda: { c1: "#6B5B95", c2: "#8C6B7D" },
  grafite: { c1: "#2C3E50", c2: "#3F6B7D" },
  escuro: { c1: "#A6ABB2", c2: "#7C8188" }
};
const THEME_COLORS = { lavanda: "#6B5B95", grafite: "#2C3E50", escuro: "#131417" };
function getStoredTheme() {
  try {
    const t = localStorage.getItem("plamily-theme");
    return t === "grafite" || t === "escuro" ? t : "lavanda";
  } catch (e) {
    return "lavanda";
  }
}
function applyThemeToDocument(t) {
  try {
    if (t === "lavanda") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("plamily-theme", t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLORS[t] || THEME_COLORS.lavanda);
  } catch (e) {}
}
const ThemeContext = /* @__PURE__ */ createContext({ theme: "lavanda", c1: "#6B5B95", c2: "#8C6B7D", setTheme: () => {} });
function useTheme() {
  return useContext(ThemeContext);
}
function catColor(name, allCats, overrides) {
  if (overrides && overrides[name]) return overrides[name];
  if (CAT_ICON_COLOR[name]) return CAT_ICON_COLOR[name];
  const idx = Math.max(0, allCats.indexOf(name));
  return CAT_COLOR_PALETTE[idx % CAT_COLOR_PALETTE.length];
}
const now = /* @__PURE__ */ new Date();
const Y = now.getFullYear(), M = now.getMonth(), TODAY_DAY = now.getDate();
const pad2 = (n) => String(n).padStart(2, "0");
const iso = (y, m, d) => {
  const dt = new Date(y, m, d);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};
const seedEntries = [];
const seedCards = [];
function buildInstallments(totalValue, count, startY, startM, dueDay = null) {
  const base = Math.floor(totalValue / count * 100) / 100;
  const list = [];
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const val = i === count - 1 ? Math.round((totalValue - sum) * 100) / 100 : base;
    sum += base;
    const { y, m, key } = addMonthsToKey(startY, startM, i);
    const dueDate = dueDay ? iso(y, m, dueDay) : null;
    list.push({ n: i + 1, value: val, dueKey: key, dueY: y, dueM: m, dueDate, status: "pendente" });
  }
  return list;
}
const seedPurchases = [];
const seedDebts = [];
const seedWishlist = [];
const seedGoals = [];
const seedSavings = [];
const seedInvestments = [];
const seedBudgets = {};
function ProgressBar({ value, max, colorVar = "var(--accent-purple)", height = 8 }) {
  const pct = Math.min(100, Math.max(0, max > 0 ? value / max * 100 : 0));
  return /* @__PURE__ */ React.createElement("div", { className: "pbar-track", style: { height } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "pbar-fill",
      style: { width: `${pct}%`, background: colorVar }
    }
  ));
}
function Badge({ children, tone = "neutral" }) {
  return /* @__PURE__ */ React.createElement("span", { className: `badge badge-${tone}` }, children);
}
function Modal({ title, onClose, children, wide }) {
  return /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: `modal-panel ${wide ? "modal-wide" : ""}`, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("h3", null, title), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(X, { size: 18 }))), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, children)));
}
function Field({ label, children }) {
  return /* @__PURE__ */ React.createElement("label", { className: "field" }, /* @__PURE__ */ React.createElement("span", { className: "field-label" }, label), children);
}
function EmptyState({ icon, text }) {
  return /* @__PURE__ */ React.createElement("div", { className: "empty-state" }, icon, /* @__PURE__ */ React.createElement("p", null, text));
}
function SignedBarChartSVG({ data, height = 180 }) {
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  const VB_W = 600;
  const zeroY = 100;
  return /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${VB_W} 200`, width: "100%", height, preserveAspectRatio: "xMidYMid meet" }, /* @__PURE__ */ React.createElement("line", { x1: 0, y1: zeroY, x2: VB_W, y2: zeroY, style: { stroke: "var(--border)" }, strokeWidth: "1" }), data.map((d, i) => {
    const x = i * (VB_W / data.length);
    const barW = VB_W / data.length * 0.5;
    const h = Math.abs(d.value) / max * 80;
    const y = d.value >= 0 ? zeroY - h : zeroY;
    const color = d.value >= 0 ? "#56B08A" : "#D65C6E";
    return /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("rect", { x: x + barW * 0.25, y, width: barW * 0.5, height: h, rx: "3", fill: color, opacity: "0.85" }), /* @__PURE__ */ React.createElement("text", { x: x + barW * 0.5, y: "180", fontSize: "13", fill: "#85789C", textAnchor: "middle" }, d.label));
  }));
}
function BarChartSVG({ data, height = 180 }) {
  const { c1, c2 } = useTheme();
  const max = Math.max(1, ...data.map((d) => Math.max(d.entrada, d.saida)));
  const VB_W = 600;
  return /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${VB_W} 200`, width: "100%", height, preserveAspectRatio: "xMidYMid meet" }, data.map((d, i) => {
    const x = i * (VB_W / data.length);
    const barW = VB_W / data.length * 0.32;
    const hE = d.entrada / max * 150;
    const hS = d.saida / max * 150;
    return /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("rect", { x: x + barW * 0.15, y: 160 - hE, width: barW, height: hE, rx: "3", fill: c1, opacity: "0.85" }), /* @__PURE__ */ React.createElement("rect", { x: x + barW * 1.15, y: 160 - hS, width: barW, height: hS, rx: "3", fill: c2, opacity: "0.85" }), /* @__PURE__ */ React.createElement("text", { x: x + barW * 1.15, y: "180", fontSize: "13", fill: "#85789C", textAnchor: "middle" }, d.label));
  }));
}
function DonutChartSVG({ data, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -90;
  const r = 60, cx = 80, cy = 80, strokeW = 22;
  const arcs = data.map((d) => {
    const frac = d.value / total;
    const start = angle;
    const end = angle + frac * 360;
    angle = end;
    const large = end - start > 180 ? 1 : 0;
    const toXY = (a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
    const [x1, y1] = toXY(start);
    const [x2, y2] = toXY(end);
    return { d, path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}` };
  });
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 160 160", width: size, height: size }, arcs.map((a, i) => /* @__PURE__ */ React.createElement("path", { key: i, d: a.path, fill: "none", stroke: a.d.color, strokeWidth: strokeW, strokeLinecap: "round" })), /* @__PURE__ */ React.createElement("text", { x: "80", y: "76", textAnchor: "middle", fontSize: "13", fontWeight: "700", fill: "#362B49" }, fmt(total)), /* @__PURE__ */ React.createElement("text", { x: "80", y: "92", textAnchor: "middle", fontSize: "9", fill: "#85789C" }, "total"));
}
function LineChartSVG({ points, height = 150, color }) {
  const { c1 } = useTheme();
  const lineColor = color || c1;
  if (points.length < 2) return /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(TrendingUp, { size: 28 }), text: "Dados insuficientes para o gr\xE1fico." });
  const max = Math.max(...points, 0);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const stepX = 300 / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = 140 - (p - min) / range * 120;
    return [x, y];
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const areaPath = `${path} L ${coords[coords.length - 1][0]} 150 L 0 150 Z`;
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 300 160", width: "100%", height, preserveAspectRatio: "xMidYMid meet" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "lineFill", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: lineColor, stopOpacity: "0.28" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: lineColor, stopOpacity: "0" }))), /* @__PURE__ */ React.createElement("path", { d: areaPath, fill: "url(#lineFill)" }), /* @__PURE__ */ React.createElement("path", { d: path, fill: "none", stroke: lineColor, strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }), coords.map(([x, y], i) => /* @__PURE__ */ React.createElement("circle", { key: i, cx: x, cy: y, r: "3", fill: lineColor })));
}
function CommitmentRing({ pct, size = 132 }) {
  const { c1, c2 } = useTheme();
  const r = 54, c = 2 * Math.PI * r;
  const dash = Math.min(100, pct) / 100 * c;
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 132 132", width: size, height: size }, /* @__PURE__ */ React.createElement("circle", { cx: "66", cy: "66", r, fill: "none", style: { stroke: "var(--accent-purple-tint)" }, strokeWidth: "14" }), /* @__PURE__ */ React.createElement(
    "circle",
    {
      cx: "66",
      cy: "66",
      r,
      fill: "none",
      stroke: "url(#ringGrad)",
      strokeWidth: "14",
      strokeDasharray: `${dash} ${c}`,
      strokeLinecap: "round",
      transform: "rotate(-90 66 66)"
    }
  ), /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "ringGrad", x1: "0", y1: "0", x2: "1", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: c1 }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: c2 }))), /* @__PURE__ */ React.createElement("text", { x: "66", y: "62", textAnchor: "middle", fontSize: "22", fontWeight: "700", style: { fill: "var(--text-dark)" } }, Math.round(pct), "%"), /* @__PURE__ */ React.createElement("text", { x: "66", y: "80", textAnchor: "middle", fontSize: "9", style: { fill: "var(--text-muted)" } }, "comprometido"));
}
function FinancePlanner({ accountId, db: db2, userEmail, userName, onSignOut, onUpdateName }) {
  var _a;
  const [view, setView] = useState("overview");
  const [selY, setSelY] = useState(Y);
  const [selM, setSelM] = useState(M);
  const [selDay, setSelDay] = useState(TODAY_DAY);
  const [resetTick, setResetTick] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    const resetToToday = () => {
      const now2 = /* @__PURE__ */ new Date();
      setSelY(now2.getFullYear());
      setSelM(now2.getMonth());
      setSelDay(now2.getDate());
      setResetTick((t) => t + 1);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") resetToToday();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", resetToToday);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", resetToToday);
    };
  }, []);
  const [syncState, setSyncState] = useState("synced");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    const primeiraConfirmacao = window.confirm(
      "Tem certeza que quer excluir sua conta? Todos os seus dados (lançamentos, cartões, dívidas, metas etc.) serão apagados permanentemente e não podem ser recuperados.\n\n" +
      "Se quiser voltar a usar depois, você pode criar uma conta nova (não precisa comprar de novo), mas vai precisar confirmar o e-mail outra vez, como da primeira vez."
    );
    if (!primeiraConfirmacao) return;
    const segundaConfirmacao = window.prompt(
      'Para confirmar de vez, digite EXCLUIR (em maiúsculas) na caixa abaixo:'
    );
    if (segundaConfirmacao !== "EXCLUIR") return;

    setDeletingAccount(true);
    try {
      if (db2 && accountId) {
        try { await deleteDoc(doc(db2, "users", accountId)); } catch (e) {
          console.warn("N\xE3o foi poss\xEDvel apagar os dados da nuvem:", e);
        }
      }
      try { window.localStorage.removeItem(storageKey(accountId)); } catch (e) {}
      await deleteUser(auth.currentUser);
    } catch (e) {
      setDeletingAccount(false);
      if (e && e.code === "auth/requires-recent-login") {
        alert(
          "Por segurança, o Firebase exige um login recente para excluir a conta. " +
          "Saia e entre novamente, depois tente excluir de novo logo em seguida."
        );
      } else {
        alert("N\xE3o foi poss\xEDvel excluir sua conta agora. Tente novamente em instantes.");
        console.warn("Erro ao excluir conta:", e);
      }
    }
  };

  const [resettingAccount, setResettingAccount] = useState(false);
  const handleResetAccount = () => {
    const conf1 = window.confirm(
      "Tem certeza que quer reiniciar sua conta? Todos os seus dados (lan\xE7amentos, cart\xF5es, d\xEDvidas, metas, categorias, or\xE7amento etc.) ser\xE3o apagados e o Plamily volta a ficar como uma conta nova, do zero.\n\n" +
      "Sua conta e seu login continuam os mesmos \u2014 s\xF3 os dados dentro dela s\xE3o zerados. Essa a\xE7\xE3o n\xE3o pode ser desfeita."
    );
    if (!conf1) return;
    const conf2 = window.prompt('Para confirmar, digite REINICIAR (em mai\xFAsculas) na caixa abaixo:');
    if (conf2 !== "REINICIAR") return;
    setResettingAccount(true);
    setEntries([]);
    setCards([]);
    setPurchases([]);
    setDebts([]);
    setWishlist([]);
    setGoals([]);
    setSavings([]);
    setInvestments([]);
    setBudgets({});
    setExpenseCategories(SEED_EXPENSE_CATEGORIES);
    setIncomeCategories(SEED_INCOME_CATEGORIES);
    setPaymentMethods(SEED_PAYMENT_METHODS);
    setDebtTypes(SEED_DEBT_TYPES);
    setCategoryColors({});
    showToast("Conta reiniciada! Tudo voltou ao zero.");
    setTimeout(() => setResettingAccount(false), 600);
  };

  const handleUpdateApp = () => {
    const url = window.location.pathname + "?_att=" + Date.now();
    window.location.href = url;
  };

  const handlePhotoUpload = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Escolha um arquivo de imagem");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast("Imagem muito grande (m\xE1x. 8MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const size = 320;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        setProfilePhoto(dataUrl);
        showToast("Foto de perfil atualizada");
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    showToast("Foto de perfil removida");
  };

  const [entries, setEntries] = useStoredState(accountId, "entries", seedEntries);
  const [cards, setCards] = useStoredState(accountId, "cards", seedCards);
  const [purchases, setPurchases] = useStoredState(accountId, "purchases", seedPurchases);
  const [debts, setDebts] = useStoredState(accountId, "debts", seedDebts);
  const [wishlist, setWishlist] = useStoredState(accountId, "wishlist", seedWishlist);
  const [goals, setGoals] = useStoredState(accountId, "goals", seedGoals);
  const [savings, setSavings] = useStoredState(accountId, "savings", seedSavings);
  const [investments, setInvestments] = useStoredState(accountId, "investments", seedInvestments);
  const [budgets, setBudgets] = useStoredState(accountId, "budgets", seedBudgets);
  const [expenseCategories, setExpenseCategories] = useStoredState(accountId, "expenseCategories", SEED_EXPENSE_CATEGORIES);
  const [profilePhoto, setProfilePhoto] = useStoredState(accountId, "profilePhoto", null);
  const [categoryColors, setCategoryColors] = useStoredState(accountId, "categoryColors", {});
  const [incomeCategories, setIncomeCategories] = useStoredState(accountId, "incomeCategories", SEED_INCOME_CATEGORIES);
  const [paymentMethods, setPaymentMethods] = useStoredState(accountId, "paymentMethods", SEED_PAYMENT_METHODS);
  const [debtTypes, setDebtTypes] = useStoredState(accountId, "debtTypes", SEED_DEBT_TYPES);
  const saveTimer = useRef(null);
  const firstRun = useRef(true);
  useEffect(() => {
    const data = { entries, cards, purchases, debts, wishlist, goals, savings, investments, budgets, expenseCategories, incomeCategories, paymentMethods, debtTypes, categoryColors, profilePhoto };
    saveStorage(accountId, data);
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!db2 || !accountId) return;
    setSyncState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setDoc(doc(db2, "users", accountId), { ...data, updatedAt: Date.now() }).then(() => setSyncState("synced")).catch((e) => {
        console.warn("Erro ao sincronizar com a nuvem:", e);
        setSyncState("error");
      });
    }, 900);
  }, [entries, cards, purchases, debts, wishlist, goals, savings, investments, budgets, expenseCategories, incomeCategories, paymentMethods, debtTypes, categoryColors, profilePhoto]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };
  const selKey = monthKey(selY, selM);
  const changeMonth = (delta) => {
    const d = new Date(selY, selM + delta, 1);
    const newY = d.getFullYear();
    const newM = d.getMonth();
    const maxDay = new Date(newY, newM + 1, 0).getDate();
    setSelY(newY);
    setSelM(newM);
    setSelDay((day) => Math.min(day, maxDay));
  };
  const goToToday = () => {
    const now = /* @__PURE__ */ new Date();
    setSelY(now.getFullYear());
    setSelM(now.getMonth());
    setSelDay(now.getDate());
    setResetTick((t) => t + 1);
  };
  const selDateKey = `${selY}-${String(selM + 1).padStart(2, "0")}-${String(selDay).padStart(2, "0")}`;
  const daySummary = useMemo(() => {
    const dayEntries = entries.filter((e) => e.date === selDateKey);
    const dIn = dayEntries.filter((e) => e.type === "entrada").reduce((s, e) => s + e.value, 0);
    const dOut = dayEntries.filter((e) => e.type === "saida").reduce((s, e) => s + e.value, 0);
    return { in: dIn, out: dOut, count: dayEntries.length };
  }, [entries, selDateKey]);
  const allInstallmentsFlat = useMemo(() => {
    const list = [];
    purchases.forEach((p) => {
      p.installments.forEach((inst) => {
        list.push({ ...inst, purchaseId: p.id, desc: p.desc, category: p.category, cardId: p.cardId });
      });
    });
    return list;
  }, [purchases]);
  const debtInstallmentsFlat = useMemo(() => {
    const list = [];
    debts.forEach((d) => {
      d.installments.forEach((inst) => {
        list.push({ ...inst, debtId: d.id, desc: d.name, category: "D\xEDvidas" });
      });
    });
    return list;
  }, [debts]);
  const totals = useMemo(() => {
    const paidIn = entries.filter((e) => e.type === "entrada" && e.status === "pago").reduce((s, e) => s + e.value, 0);
    const paidOut = entries.filter((e) => e.type === "saida" && e.status === "pago").reduce((s, e) => s + e.value, 0);
    const paidInstallments = allInstallmentsFlat.filter((i) => i.status === "pago").reduce((s, i) => s + i.value, 0);
    const paidDebtInstallments = debtInstallmentsFlat.filter((i) => i.status === "pago").reduce((s, i) => s + i.value, 0);
    const savingsDiscount = savings.filter((s) => s.discount).reduce((s, x) => s + x.value, 0);
    const investDiscount = investments.filter((s) => s.discount).reduce((s, x) => s + x.value, 0);
    const saldo = paidIn - paidOut - paidInstallments - paidDebtInstallments - savingsDiscount - investDiscount;
    const monthIn = entries.filter((e) => e.type === "entrada" && e.status === "pago" && dateInMonth(e.date, selY, selM)).reduce((s, e) => s + e.value, 0);
    const monthInPending = entries.filter((e) => e.type === "entrada" && e.status === "pendente" && dateInMonth(e.date, selY, selM)).reduce((s, e) => s + e.value, 0);
    const monthOutEntries = entries.filter((e) => e.type === "saida" && e.status === "pago" && dateInMonth(e.date, selY, selM)).reduce((s, e) => s + e.value, 0);
    const monthOutInstallments = allInstallmentsFlat.filter((i) => i.dueKey === selKey && i.status === "pago").reduce((s, i) => s + i.value, 0);
    const monthOutDebt = debtInstallmentsFlat.filter((i) => i.dueKey === selKey && i.status === "pago").reduce((s, i) => s + i.value, 0);
    const monthOut = monthOutEntries + monthOutInstallments + monthOutDebt;
    const monthOutPendingEntries = entries.filter((e) => e.type === "saida" && e.status === "pendente" && dateInMonth(e.date, selY, selM)).reduce((s, e) => s + e.value, 0);
    const monthOutPendingInstallments = allInstallmentsFlat.filter((i) => i.dueKey === selKey && i.status === "pendente").reduce((s, i) => s + i.value, 0);
    const monthOutPendingDebt = debtInstallmentsFlat.filter((i) => i.dueKey === selKey && i.status === "pendente").reduce((s, i) => s + i.value, 0);
    const totalSavings = savings.reduce((s, x) => s + x.value, 0);
    const totalInvest = investments.reduce((s, x) => s + x.value, 0);
    const monthSavingsDiscount = savings.filter((s) => s.discount && dateInMonth(s.date, selY, selM)).reduce((s, x) => s + x.value, 0);
    const monthInvestDiscount = investments.filter((s) => s.discount && dateInMonth(s.date, selY, selM)).reduce((s, x) => s + x.value, 0);
    const totalDebtRemaining = debtInstallmentsFlat.filter((i) => i.status === "pendente").reduce((s, i) => s + i.value, 0);
    const futurePending = allInstallmentsFlat.filter((i) => {
      const d = new Date(i.dueY, i.dueM, 1);
      const ref = new Date(Y, M, 1);
      return i.status === "pendente" && d >= ref;
    });
    const futurePendingDebt = debtInstallmentsFlat.filter((i) => {
      const d = new Date(i.dueY, i.dueM, 1);
      const ref = new Date(Y, M, 1);
      return i.status === "pendente" && d >= ref;
    });
    const committedTotal = futurePending.reduce((s, i) => s + i.value, 0) + futurePendingDebt.reduce((s, i) => s + i.value, 0);
    const saldoMes = monthIn - monthOut - monthSavingsDiscount - monthInvestDiscount;
    return {
      saldo,
      saldoMes,
      monthIn,
      monthInPending,
      monthOut,
      monthOutPendingEntries: monthOutPendingEntries + monthOutPendingInstallments + monthOutPendingDebt,
      totalSavings,
      totalInvest,
      totalDebtRemaining,
      committedTotal,
      futurePending: [...futurePending, ...futurePendingDebt]
    };
  }, [entries, allInstallmentsFlat, debtInstallmentsFlat, savings, investments, selY, selM, selKey]);
  const fixedVsVariable = useMemo(() => {
    const monthSaidas = entries.filter((e) => e.type === "saida" && dateInMonth(e.date, selY, selM));
    const fixedTotal = monthSaidas.filter((e) => e.fixed).reduce((s, e) => s + e.value, 0);
    const variableTotal = monthSaidas.filter((e) => !e.fixed).reduce((s, e) => s + e.value, 0);
    return { fixedTotal, variableTotal };
  }, [entries, selY, selM]);
  const totalMonthlyGoalSavings = useMemo(() => {
    return goals.reduce((sum, g) => {
      const monthsLeft = Math.max(1, Math.round((new Date(g.deadline) - /* @__PURE__ */ new Date()) / (1e3 * 60 * 60 * 24 * 30)));
      return sum + Math.max(0, (g.target - g.current) / monthsLeft);
    }, 0);
  }, [goals]);
  const monthProjection = useMemo(() => {
    const previstoTotal = totals.monthIn + totals.monthInPending;
    const comprometidoTotal = totals.monthOut + totals.monthOutPendingEntries;
    return {
      previstoTotal,
      recebido: totals.monthIn,
      aReceber: totals.monthInPending,
      comprometidoTotal,
      pago: totals.monthOut,
      projecao: previstoTotal - comprometidoTotal
    };
  }, [totals]);
  const safeLimit = useMemo(() => {
    if (entries.length === 0) return null;
    return {
      value: totals.saldoMes - totals.committedTotal - totalMonthlyGoalSavings,
      committed: totals.committedTotal,
      goalSavings: totalMonthlyGoalSavings
    };
  }, [totals, totalMonthlyGoalSavings, entries]);
  const previousMonthCategorySpend = useMemo(() => {
    const d = new Date(selY, selM - 1, 1);
    const y = d.getFullYear(), m = d.getMonth();
    const map = {};
    entries.filter((e) => e.type === "saida" && dateInMonth(e.date, y, m)).forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.value;
    });
    return map;
  }, [entries, selY, selM]);
  // smartInsights calculado logo abaixo, depois de categorySpendMonth estar pronto
  const paymentMethodSpend = useMemo(() => {
    const map = {};
    entries.filter((e) => e.type === "saida" && dateInMonth(e.date, selY, selM)).forEach((e) => {
      map[e.method] = (map[e.method] || 0) + e.value;
    });
    const palette = ["#8657C9", "#D6669E", "#5B8BD6", "#D69A56", "#56B08A"];
    return Object.entries(map).map(([label, value], idx) => ({ label, value, color: palette[idx % palette.length] }));
  }, [entries, selY, selM]);
  const debtsSummary = useMemo(() => {
    const palette = ["#4A3D63", "#8657C9", "#D6669E", "#5B8BD6", "#D69A56", "#56B08A"];
    const today = todayISO();
    return debts.map((d, idx) => {
      const installmentsWithStatus = d.installments.map((i) => ({
        ...i,
        overdue: i.status === "pendente" && !!i.dueDate && i.dueDate < today
      }));
      const remaining = installmentsWithStatus.filter((i) => i.status === "pendente").reduce((s, i) => s + i.value, 0);
      const paidCount = installmentsWithStatus.filter((i) => i.status === "pago").length;
      const overdueInstallments = installmentsWithStatus.filter((i) => i.overdue);
      const overdueTotal = overdueInstallments.reduce((s, i) => s + i.value, 0);
      const next = installmentsWithStatus.find((i) => i.status === "pendente");
      return {
        ...d,
        installments: installmentsWithStatus,
        remaining,
        paidCount,
        next,
        overdueCount: overdueInstallments.length,
        overdueTotal,
        color: palette[idx % palette.length]
      };
    });
  }, [debts]);
  const categorySpendMonth = useMemo(() => {
    const map = {};
    entries.filter((e) => e.type === "saida" && dateInMonth(e.date, selY, selM)).forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.value;
    });
    allInstallmentsFlat.filter((i) => i.dueKey === selKey).forEach((i) => {
      map[i.category] = (map[i.category] || 0) + i.value;
    });
    debtInstallmentsFlat.filter((i) => i.dueKey === selKey).forEach((i) => {
      map[i.category] = (map[i.category] || 0) + i.value;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value, color: label === "D\xEDvidas" ? "#4A3D63" : catColor(label, expenseCategories, categoryColors) })).sort((a, b) => b.value - a.value);
  }, [entries, allInstallmentsFlat, debtInstallmentsFlat, selY, selM, selKey, expenseCategories, categoryColors]);
  const top5Saidas = useMemo(() => {
    return entries.filter((e) => e.type === "saida" && dateInMonth(e.date, selY, selM)).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [entries, selY, selM]);
  const incomeByCategory = useMemo(() => {
    const map = {};
    entries.filter((e) => e.type === "entrada" && dateInMonth(e.date, selY, selM)).forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.value;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value, color: catColor(label, incomeCategories, categoryColors) })).sort((a, b) => b.value - a.value);
  }, [entries, selY, selM, incomeCategories, categoryColors]);
  const monthComparison = useMemo(() => {
    const d = new Date(selY, selM - 1, 1);
    const py = d.getFullYear(), pm = d.getMonth();
    const prevEntries = entries.filter((e) => dateInMonth(e.date, py, pm));
    const prevIn = prevEntries.filter((e) => e.type === "entrada").reduce((s, e) => s + e.value, 0);
    const prevOut = prevEntries.filter((e) => e.type === "saida").reduce((s, e) => s + e.value, 0);
    const curIn = totals.monthIn;
    const curOut = totals.monthOut;
    if (prevEntries.length === 0 || (curIn === 0 && curOut === 0)) {
      return { hasData: false };
    }
    const msgs = [];
    if (prevOut > 0) {
      const pct = Math.round((curOut - prevOut) / prevOut * 100);
      if (pct > 5) msgs.push(`Voc\xEA gastou ${pct}% a mais este m\xEAs em compara\xE7\xE3o ao m\xEAs anterior.`);
      else if (pct < -5) msgs.push(`Voc\xEA gastou ${Math.abs(pct)}% a menos este m\xEAs em compara\xE7\xE3o ao m\xEAs anterior.`);
      else msgs.push("Suas sa\xEDdas ficaram bem parecidas com as do m\xEAs anterior.");
    } else if (curOut > 0) {
      msgs.push("Este m\xEAs voc\xEA teve sa\xEDdas, mas o m\xEAs anterior n\xE3o teve nenhuma registrada.");
    }
    if (prevIn > 0) {
      const pctIn = Math.round((curIn - prevIn) / prevIn * 100);
      if (pctIn > 5) msgs.push(`Suas entradas aumentaram ${pctIn}% em rela\xE7\xE3o ao m\xEAs passado.`);
      else if (pctIn < -5) msgs.push(`Suas entradas diminu\xEDram ${Math.abs(pctIn)}% em rela\xE7\xE3o ao m\xEAs passado.`);
    }
    let biggestChangeCat = null;
    categorySpendMonth.forEach((c) => {
      const prev = previousMonthCategorySpend[c.label] || 0;
      if (prev > 0) {
        const diff = c.value - prev;
        if (!biggestChangeCat || Math.abs(diff) > Math.abs(biggestChangeCat.diff)) {
          biggestChangeCat = { label: c.label, diff };
        }
      }
    });
    if (biggestChangeCat && Math.abs(biggestChangeCat.diff) > 0) {
      msgs.push(biggestChangeCat.diff > 0 ? `Voc\xEA gastou mais com ${biggestChangeCat.label} este m\xEAs.` : `Voc\xEA gastou menos com ${biggestChangeCat.label} este m\xEAs.`);
    }
    const curNet = curIn - curOut, prevNet = prevIn - prevOut;
    if (curNet > prevNet && curNet > 0) msgs.push("Voc\xEA conseguiu economizar mais este m\xEAs. \u{1F389}");
    if (msgs.length === 0) msgs.push("Ainda n\xE3o h\xE1 dados suficientes para comparar este per\xEDodo.");
    return { hasData: true, msgs: msgs.slice(0, 3) };
  }, [entries, selY, selM, totals, categorySpendMonth, previousMonthCategorySpend]);
  const smartInsights = useMemo(() => {
    const tips = [];
    let biggestGrowth = null;
    categorySpendMonth.forEach((c) => {
      const prev = previousMonthCategorySpend[c.label] || 0;
      if (prev > 0) {
        const pctChange = (c.value - prev) / prev * 100;
        if (!biggestGrowth || Math.abs(pctChange) > Math.abs(biggestGrowth.pctChange)) {
          biggestGrowth = { label: c.label, pctChange, value: c.value };
        }
      }
    });
    if (biggestGrowth) {
      if (biggestGrowth.pctChange > 0) {
        tips.push(`Voc\xEA gastou ${fmt(biggestGrowth.value)} com ${biggestGrowth.label} este m\xEAs, ${Math.round(biggestGrowth.pctChange)}% a mais que no m\xEAs anterior.`);
      } else {
        tips.push(`Seus gastos com ${biggestGrowth.label} diminu\xEDram ${Math.round(Math.abs(biggestGrowth.pctChange))}% em compara\xE7\xE3o com o m\xEAs passado.`);
      }
    }
    const spentSumForInsights = categorySpendMonth.reduce((s, c) => s + c.value, 0);
    if (categorySpendMonth[0] && spentSumForInsights > 0) {
      const top = categorySpendMonth[0];
      tips.push(`${top.label} representa ${Math.round(top.value / spentSumForInsights * 100)}% das suas sa\xEDdas neste m\xEAs.`);
    }
    const biggestSingle = entries.filter((e) => e.type === "saida" && dateInMonth(e.date, selY, selM)).sort((a, b) => b.value - a.value)[0];
    if (biggestSingle) {
      tips.push(`Sua maior sa\xEDda do m\xEAs foi "${biggestSingle.desc}", de ${fmt(biggestSingle.value)}.`);
    }
    categorySpendMonth.forEach((c) => {
      const limit = budgets[c.label];
      if (limit && c.value > limit) {
        tips.push(`Voc\xEA ultrapassou o or\xE7amento de ${c.label} em ${fmt(c.value - limit)}.`);
      }
    });
    return tips;
  }, [categorySpendMonth, previousMonthCategorySpend, entries, selY, selM, budgets]);
  const last6MonthsBars = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selY, selM - i, 1);
      const y = d.getFullYear(), m = d.getMonth(), key = monthKey(y, m);
      const inn = entries.filter((e) => e.type === "entrada" && e.status === "pago" && dateInMonth(e.date, y, m)).reduce((s, e) => s + e.value, 0);
      const out = entries.filter((e) => e.type === "saida" && e.status === "pago" && dateInMonth(e.date, y, m)).reduce((s, e) => s + e.value, 0) + allInstallmentsFlat.filter((ins) => ins.dueKey === key && ins.status === "pago").reduce((s, e) => s + e.value, 0) + debtInstallmentsFlat.filter((ins) => ins.dueKey === key && ins.status === "pago").reduce((s, e) => s + e.value, 0);
      arr.push({ label: MONTHS[m].slice(0, 3), entrada: inn, saida: out });
    }
    return arr;
  }, [entries, allInstallmentsFlat, debtInstallmentsFlat, selY, selM]);
  const balanceEvolution = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selY, selM - i, 1);
      const cutoff = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const inn = entries.filter((e) => e.type === "entrada" && e.status === "pago" && new Date(e.date) <= cutoff).reduce((s, e) => s + e.value, 0);
      const out = entries.filter((e) => e.type === "saida" && e.status === "pago" && new Date(e.date) <= cutoff).reduce((s, e) => s + e.value, 0);
      const inst = allInstallmentsFlat.filter((ins) => ins.status === "pago" && new Date(ins.dueY, ins.dueM, 28) <= cutoff).reduce((s, e) => s + e.value, 0);
      const debtInst = debtInstallmentsFlat.filter((ins) => ins.status === "pago" && new Date(ins.dueY, ins.dueM, 28) <= cutoff).reduce((s, e) => s + e.value, 0);
      arr.push(inn - out - inst - debtInst);
    }
    return arr;
  }, [entries, allInstallmentsFlat, debtInstallmentsFlat, selY, selM]);
  const upcoming = useMemo(() => {
    const list = [];
    entries.filter((e) => e.status === "pendente").forEach((e) => list.push({ id: e.id, desc: e.desc, value: e.value, date: e.date, type: e.type, kind: "Conta" }));
    allInstallmentsFlat.filter((i) => i.status === "pendente").forEach(
      (i) => list.push({ id: i.purchaseId + i.n, desc: `${i.desc} (parcela ${i.n})`, value: i.value, date: `${i.dueY}-${String(i.dueM + 1).padStart(2, "0")}-01`, type: "saida", kind: "Cart\xE3o" })
    );
    debtInstallmentsFlat.filter((i) => i.status === "pendente").forEach(
      (i) => list.push({ id: i.debtId + i.n, desc: `${i.desc} (parcela ${i.n})`, value: i.value, date: `${i.dueY}-${String(i.dueM + 1).padStart(2, "0")}-01`, type: "saida", kind: "D\xEDvida" })
    );
    return list.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 6);
  }, [entries, allInstallmentsFlat, debtInstallmentsFlat]);
  const dueSoon = useMemo(() => {
    const now2 = /* @__PURE__ */ new Date();
    const todayZero = new Date(now2.getFullYear(), now2.getMonth(), now2.getDate());
    const in7 = new Date(todayZero);
    in7.setDate(in7.getDate() + 7);
    const inWindow = (dateStr) => {
      const d = new Date(dateStr + "T00:00:00");
      return d >= todayZero && d <= in7;
    };
    const list = [];
    entries.filter((e) => e.status === "pendente" && inWindow(e.date)).forEach((e) => list.push({ id: e.id, desc: e.desc, value: e.value, date: e.date, kind: "Conta" }));
    allInstallmentsFlat.filter((i) => i.status === "pendente").forEach((i) => {
      const d = `${i.dueY}-${String(i.dueM + 1).padStart(2, "0")}-01`;
      if (inWindow(d)) list.push({ id: i.purchaseId + i.n, desc: i.desc, parcel: `(parcela ${i.n})`, value: i.value, date: d, kind: "Cart\xE3o" });
    });
    debtInstallmentsFlat.filter((i) => i.status === "pendente").forEach((i) => {
      const d = `${i.dueY}-${String(i.dueM + 1).padStart(2, "0")}-01`;
      if (inWindow(d)) list.push({ id: i.debtId + i.n, desc: i.desc, parcel: `(parcela ${i.n})`, value: i.value, date: d, kind: "D\xEDvida" });
    });
    return list.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [entries, allInstallmentsFlat, debtInstallmentsFlat]);
  const recentMovements = useMemo(() => {
    const list = entries.filter((e) => dateInMonth(e.date, selY, selM)).map((e) => ({ ...e, kind: "entry" }));
    return list.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  }, [entries, selY, selM]);
  const addEntry = (entry) => {
    const { fixed, recurrence, destino, ...rest } = entry;
    if (destino === "guardado") {
      setSavings((prev) => [{ id: uid(), desc: rest.desc, value: rest.value, bank: rest.bank, yieldRate: null, date: rest.date, discount: false, viaEntry: true }, ...prev]);
    } else if (destino === "investimento") {
      setInvestments((prev) => [{ id: uid(), desc: rest.desc, value: rest.value, bank: rest.bank, yieldRate: null, date: rest.date, discount: false, viaEntry: true }, ...prev]);
    }
    if (fixed) {
      const monthsCount = recurrence === "infinite" ? 60 : Number(recurrence) || 1;
      const groupId = uid();
      const [y, m, d] = entry.date.split("-").map(Number);
      const generated = [];
      for (let i = 0; i < monthsCount; i++) {
        const dt = new Date(y, m - 1 + i, d);
        const dateISO = iso(dt.getFullYear(), dt.getMonth(), dt.getDate());
        generated.push({
          id: uid(),
          ...rest,
          date: dateISO,
          status: i === 0 ? rest.status : "pendente",
          fixed: true,
          groupId,
          unlimited: recurrence === "infinite"
        });
      }
      setEntries((prev) => [...generated, ...prev]);
      showToast(recurrence === "infinite" ? "Lan\xE7amento fixo criado sem data de t\xE9rmino" : `Lan\xE7amento fixo criado para ${monthsCount} meses`);
    } else {
      setEntries((prev) => [{ id: uid(), ...rest, fixed: false }, ...prev]);
      showToast(entry.type === "entrada" ? "Entrada adicionada" : "Sa\xEDda adicionada");
    }
  };
  const editEntry = (id, updated) => {
    const { fixed, ...rest } = updated;
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...rest } : e));
    showToast("Lan\xE7amento atualizado");
  };
  const toggleEntryStatus = (id) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, status: e.status === "pago" ? "pendente" : "pago" } : e));
  };
  const deleteEntry = (id) => setEntries((prev) => prev.filter((e) => e.id !== id));
  const addCard = (card) => {
    setCards((prev) => [...prev, { id: uid(), ...card }]);
    showToast("Cart\xE3o adicionado");
  };
  const editCard = (cardId, updates) => {
    setCards((prev) => prev.map((c) => c.id === cardId ? { ...c, ...updates } : c));
    showToast("Cart\xE3o atualizado");
  };
  const deleteCard = (cardId) => {
    if (purchases.some((p) => p.cardId === cardId)) {
      showToast("Esse cart\xE3o tem compras registradas e n\xE3o pode ser exclu\xEDdo");
      return;
    }
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    showToast("Cart\xE3o removido");
  };
  const addPurchase = (p) => {
    const [y, m] = p.purchaseDate.split("-").map(Number);
    const installments = buildInstallments(p.total, p.count, y, m - 1);
    setPurchases((prev) => [...prev, { id: uid(), ...p, installments }]);
    showToast("Compra no cart\xE3o registrada");
  };
  const editPurchase = (purchaseId, updates) => {
    setPurchases((prev) => prev.map((p) => p.id === purchaseId ? { ...p, ...updates } : p));
    showToast("Compra atualizada");
  };
  const addInterestToPurchaseInstallment = (purchaseId, n, amount) => {
    setPurchases(
      (prev) => prev.map(
        (p) => p.id === purchaseId ? {
          ...p,
          installments: p.installments.map(
            (i) => i.n === n ? { ...i, value: Math.round((i.value + amount) * 100) / 100, interestAdded: (i.interestAdded || 0) + amount } : i
          )
        } : p
      )
    );
    showToast("Juros adicionado \xE0 parcela");
  };
  const toggleInstallmentStatus = (purchaseId, n) => {
    setPurchases(
      (prev) => prev.map(
        (p) => p.id === purchaseId ? { ...p, installments: p.installments.map((i) => i.n === n ? { ...i, status: i.status === "pago" ? "pendente" : "pago" } : i) } : p
      )
    );
  };
  const addDebt = (d) => {
    const [y, m] = d.startDate.split("-").map(Number);
    const installments = buildInstallments(d.total, d.count, y, m - 1, d.dueDay);
    setDebts((prev) => [...prev, { id: uid(), ...d, installments }]);
    showToast("D\xEDvida cadastrada");
  };
  const editDebt = (debtId, updates) => {
    setDebts((prev) => prev.map((d) => d.id === debtId ? { ...d, ...updates } : d));
    showToast("D\xEDvida atualizada");
  };
  const addInterestToInstallment = (debtId, n, amount) => {
    setDebts(
      (prev) => prev.map(
        (d) => d.id === debtId ? {
          ...d,
          installments: d.installments.map(
            (i) => i.n === n ? { ...i, value: Math.round((i.value + amount) * 100) / 100, interestAdded: (i.interestAdded || 0) + amount } : i
          )
        } : d
      )
    );
    showToast("Juros adicionado \xE0 parcela");
  };
  const toggleDebtInstallmentStatus = (debtId, n) => {
    setDebts(
      (prev) => prev.map(
        (d) => d.id === debtId ? { ...d, installments: d.installments.map((i) => i.n === n ? { ...i, status: i.status === "pago" ? "pendente" : "pago" } : i) } : d
      )
    );
  };
  const deleteDebt = (id) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
    showToast("D\xEDvida removida");
  };
  const addWish = (w) => {
    setWishlist((prev) => [{ id: uid(), bought: false, ...w }, ...prev]);
    showToast("Desejo adicionado \xE0 lista");
  };
  const confirmBuyWish = (wishId, details) => {
    const wish = wishlist.find((w) => w.id === wishId);
    if (!wish) return;
    if (details.registerExpense === false) {
      setWishlist((prev) => prev.map((w) => w.id === wishId ? { ...w, bought: true, boughtDate: todayISO(), discounted: false } : w));
      showToast("Desejo marcado como conquistado \u{1F389}");
      return;
    }
    if (details.installments > 1 && details.cardId) {
      addPurchase({
        cardId: details.cardId,
        desc: wish.name,
        category: wish.category,
        total: wish.value,
        count: details.installments,
        purchaseDate: todayISO()
      });
    } else {
      addEntry({
        type: "saida",
        desc: wish.name,
        category: wish.category,
        value: wish.value,
        date: todayISO(),
        method: details.method,
        bank: details.bank,
        status: "pago"
      });
    }
    setWishlist((prev) => prev.map((w) => w.id === wishId ? { ...w, bought: true, boughtDate: todayISO(), discounted: true } : w));
    showToast("Desejo marcado como comprado \u{1F389}");
  };
  const deleteWish = (id) => setWishlist((prev) => prev.filter((w) => w.id !== id));
  const addGoal = (g) => {
    setGoals((prev) => [...prev, { id: uid(), current: 0, ...g }]);
    showToast("Meta criada");
  };
  const addToGoal = (id, amount) => {
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, current: g.current + amount } : g));
    showToast("Valor adicionado \xE0 meta");
  };
  const addSaving = (s) => {
    setSavings((prev) => [{ id: uid(), ...s }, ...prev]);
    showToast("Dinheiro guardado registrado");
  };
  const editSaving = (id, updates) => {
    setSavings((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
    showToast("Guardado atualizado");
  };
  const deleteSaving = (id) => {
    setSavings((prev) => prev.filter((s) => s.id !== id));
    showToast("Guardado removido");
  };
  const addInvestment = (inv) => {
    setInvestments((prev) => [{ id: uid(), ...inv }, ...prev]);
    showToast("Dinheiro investido registrado");
  };
  const editInvestment = (id, updates) => {
    setInvestments((prev) => prev.map((i) => i.id === id ? { ...i, ...updates } : i));
    showToast("Investido atualizado");
  };
  const deleteInvestment = (id) => {
    setInvestments((prev) => prev.filter((i) => i.id !== id));
    showToast("Investido removido");
  };
  const updateBudget = (cat, limit) => setBudgets((prev) => ({ ...prev, [cat]: limit }));
  const LIST_SETTERS = {
    expense: [expenseCategories, setExpenseCategories, "Categoria"],
    income: [incomeCategories, setIncomeCategories, "Categoria"],
    payment: [paymentMethods, setPaymentMethods, "Forma de pagamento"],
    debtType: [debtTypes, setDebtTypes, "Tipo de d\xEDvida"]
  };
  const addCategory = (kind, name) => {
    const clean = name.trim();
    if (!clean) return;
    const [list, setter, label] = LIST_SETTERS[kind];
    if (list.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      showToast(`${label} j\xE1 existe`);
      return;
    }
    setter((prev) => [...prev, clean]);
    showToast(`${label} adicionada`);
  };
  const deleteCategory = (kind, name) => {
    const [, setter] = LIST_SETTERS[kind];
    setter((prev) => prev.filter((c) => c !== name));
    showToast("Item removido");
  };
  const renameCategory = (kind, oldName, newName) => {
    const clean = newName.trim();
    if (!clean || clean === oldName) return;
    const [list, setter, label] = LIST_SETTERS[kind];
    if (list.some((c) => c.toLowerCase() === clean.toLowerCase() && c !== oldName)) {
      showToast(`${label} j\xE1 existe`);
      return;
    }
    setter((prev) => prev.map((c) => c === oldName ? clean : c));
    if (kind === "expense" || kind === "income") {
      setEntries((prev) => prev.map((e) => e.category === oldName ? { ...e, category: clean } : e));
      setPurchases((prev) => prev.map((p) => p.category === oldName ? { ...p, category: clean } : p));
      setBudgets((prev) => {
        if (prev[oldName] === void 0) return prev;
        const rest = { ...prev };
        rest[clean] = rest[oldName];
        delete rest[oldName];
        return rest;
      });
      setCategoryColors((prev) => {
        if (prev[oldName] === void 0) return prev;
        const rest = { ...prev };
        rest[clean] = rest[oldName];
        delete rest[oldName];
        return rest;
      });
    }
    if (kind === "payment") {
      setEntries((prev) => prev.map((e) => e.method === oldName ? { ...e, method: clean } : e));
    }
    if (kind === "debtType") {
      setDebts((prev) => prev.map((d) => d.type === oldName ? { ...d, type: clean } : d));
    }
    showToast(`${label} atualizada`);
  };
  const setCategoryColor = (name, color) => {
    setCategoryColors((prev) => ({ ...prev, [name]: color }));
  };
  const NAV = [
    { id: "overview", label: "Vis\xE3o Geral", icon: Home },
    { id: "annual", label: "Anual", icon: BarChart2 },
    { id: "entries", label: "Lan\xE7amentos", icon: Repeat },
    { id: "calendar", label: "Calend\xE1rio", icon: Calendar },
    { id: "budget", label: "Or\xE7amento", icon: Wallet },
    { id: "savingsinvest", label: "Guardados e Investidos", icon: PiggyBank },
    { id: "cards", label: "Cart\xF5es de Cr\xE9dito", icon: CreditCard },
    { id: "debts", label: "D\xEDvidas", icon: Landmark },
    { id: "wishlist", label: "Desejos", icon: Heart },
    { id: "goals", label: "Metas", icon: Target },
    { id: "history", label: "Hist\xF3rico", icon: Clock },
    { id: "categories", label: "Categorias", icon: Palette },
    { id: "tips", label: "Dicas", icon: Lightbulb },
    { id: "settings", label: "Configura\xE7\xF5es", icon: Settings }
  ];
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const out = [];
    NAV.forEach((n) => {
      if (n.label.toLowerCase().includes(q)) out.push({ kind: "Aba", label: n.label, sub: "ir para esta se\xE7\xE3o", view: n.id });
    });
    entries.forEach((e) => {
      if ((e.desc || "").toLowerCase().includes(q) || (e.category || "").toLowerCase().includes(q)) {
        out.push({ kind: e.type === "entrada" ? "Entrada" : "Sa\xEDda", label: e.desc, sub: `${e.category} \xB7 ${fmt(e.value)}`, view: "entries" });
      }
    });
    [...expenseCategories, ...incomeCategories].forEach((c) => {
      if (c.toLowerCase().includes(q)) out.push({ kind: "Categoria", label: c, sub: "gerenciar em Categorias", view: "categories" });
    });
    cards.forEach((c) => {
      if ((c.name || "").toLowerCase().includes(q) || (c.bank || "").toLowerCase().includes(q)) {
        out.push({ kind: "Cart\xE3o", label: c.name, sub: c.bank, view: "cards" });
      }
    });
    purchases.forEach((p) => {
      if ((p.desc || "").toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q)) {
        out.push({ kind: "Compra parcelada", label: p.desc, sub: `${p.count}x \xB7 ${fmt(p.total)}`, view: "cards" });
      }
    });
    debts.forEach((d) => {
      if ((d.name || "").toLowerCase().includes(q) || (d.lender || "").toLowerCase().includes(q)) {
        out.push({ kind: "D\xEDvida", label: d.name, sub: d.lender, view: "debts" });
      }
    });
    goals.forEach((g) => {
      if ((g.name || "").toLowerCase().includes(q)) out.push({ kind: "Meta", label: g.name, sub: fmt(g.target), view: "goals" });
    });
    wishlist.forEach((w) => {
      if ((w.name || "").toLowerCase().includes(q)) out.push({ kind: "Desejo", label: w.name, sub: fmt(w.value), view: "wishlist" });
    });
    return out.slice(0, 24);
  }, [searchQuery, entries, expenseCategories, incomeCategories, cards, purchases, debts, goals, wishlist, NAV]);
  const goToSearchResult = (r) => {
    setView(r.view);
    setSearchOpen(false);
    setSearchQuery("");
  };
  return /* @__PURE__ */ React.createElement("div", { className: "app-root" }, /* @__PURE__ */ React.createElement("style", null, CSS), /* @__PURE__ */ React.createElement("aside", { className: "sidebar" }, /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("div", { className: "brand-mark" }, /* @__PURE__ */ React.createElement("img", { src: "./icon-192.png", alt: "Plamily", className: "brand-mark-img" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "brand-title" }, "Plamily"), /* @__PURE__ */ React.createElement("div", { className: "brand-sub" }, "painel financeiro"))), /* @__PURE__ */ React.createElement("nav", { className: "side-nav" }, NAV.map((n) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: n.id,
      className: `side-item ${view === n.id ? "active" : ""}`,
      onClick: () => setView(n.id)
    },
    /* @__PURE__ */ React.createElement(n.icon, { size: 17 }),
    /* @__PURE__ */ React.createElement("span", null, n.label)
  ))), /* @__PURE__ */ React.createElement("div", { className: "side-footer" }, /* @__PURE__ */ React.createElement("div", { className: "side-footer-card" }, /* @__PURE__ */ React.createElement(PiggyBank, { size: 16 }), /* @__PURE__ */ React.createElement("span", null, "Saldo do m\xEAs"), /* @__PURE__ */ React.createElement("strong", { className: totals.saldoMes <= 0 ? "value-negative" : "value-positive" }, fmt(totals.saldoMes))), /* @__PURE__ */ React.createElement("div", { className: "account-card" }, /* @__PURE__ */ React.createElement("div", { className: "account-info" }, /* @__PURE__ */ React.createElement("div", { className: "account-avatar" }, profilePhoto ? /* @__PURE__ */ React.createElement("img", { src: profilePhoto, alt: "", className: "account-avatar-img" }) : (userName || userEmail || "?").slice(0, 1).toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "account-text" }, /* @__PURE__ */ React.createElement("strong", null, userName || "Minha conta"), /* @__PURE__ */ React.createElement("span", null, userEmail))), /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "account-sync-row" }, /* @__PURE__ */ React.createElement("span", { className: `sync-dot sync-${syncState}` }), /* @__PURE__ */ React.createElement("span", { className: "sync-label" }, syncState === "saving" ? "salvando\u2026" : syncState === "error" ? "erro ao salvar" : "sincronizado")), /* @__PURE__ */ React.createElement("div", { className: "account-actions-row" }, /* @__PURE__ */ React.createElement("button", { className: "account-logout", onClick: onSignOut }, "Sair"), /* @__PURE__ */ React.createElement("button", { className: "account-reset", onClick: handleResetAccount, disabled: resettingAccount }, resettingAccount ? "Reiniciando\u2026" : "Reiniciar"), /* @__PURE__ */ React.createElement("button", { className: "account-delete", onClick: handleDeleteAccount, disabled: deletingAccount }, deletingAccount ? "Excluindo\u2026" : "Excluir")))))), /* @__PURE__ */ React.createElement("main", { className: "main-area" }, /* @__PURE__ */ React.createElement("header", { className: "topbar" }, /* @__PURE__ */ React.createElement("div", { className: "date-nav" }, /* @__PURE__ */ React.createElement("div", { className: "date-nav-row" }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => changeMonth(-1) }, /* @__PURE__ */ React.createElement(ChevronLeft, { size: 18 })), /* @__PURE__ */ React.createElement("select", { className: "day-select", value: selDay, onChange: (e) => setSelDay(Number(e.target.value)) }, Array.from({ length: new Date(selY, selM + 1, 0).getDate() }, (_, i) => i + 1).map((d) => /* @__PURE__ */ React.createElement("option", { key: d, value: d }, d))), /* @__PURE__ */ React.createElement("span", { className: "month-label" }, MONTHS[selM]), /* @__PURE__ */ React.createElement("select", { className: "year-select", value: selY, onChange: (e) => setSelY(Number(e.target.value)) }, Array.from({ length: 2050 - (Y - 6) + 1 }, (_, i) => Y - 6 + i).map((yr) => /* @__PURE__ */ React.createElement("option", { key: yr, value: yr }, yr))), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => changeMonth(1) }, /* @__PURE__ */ React.createElement(ChevronRight, { size: 18 }))), /* @__PURE__ */ React.createElement("button", { className: "today-btn", onClick: goToToday }, /* @__PURE__ */ React.createElement(RefreshCw, { size: 11 }), "Data atual")), /* @__PURE__ */ React.createElement("div", { className: "topbar-title-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "topbar-title-row" }, /* @__PURE__ */ React.createElement("div", { className: "topbar-title" }, (_a = NAV.find((n) => n.id === view)) == null ? void 0 : _a.label), /* @__PURE__ */ React.createElement("button", { className: "icon-btn search-btn", title: "Pesquisar", onClick: () => setSearchOpen(true) }, /* @__PURE__ */ React.createElement(Search, { size: 17 })))), /* @__PURE__ */ React.createElement("div", { className: "topbar-balance mobile-hide" }, /* @__PURE__ */ React.createElement("span", null, "Saldo do m\xEAs"), /* @__PURE__ */ React.createElement("strong", { className: totals.saldoMes <= 0 ? "value-negative" : "value-positive" }, fmt(totals.saldoMes)))), /* @__PURE__ */ React.createElement("div", { className: "view-content" }, view === "overview" && /* @__PURE__ */ React.createElement(
    OverviewView,
    {
      totals,
      categorySpendMonth,
      bars: last6MonthsBars,
      balanceEvo: balanceEvolution,
      paymentMethodSpend,
      debtsSummary,
      upcoming,
      recent: recentMovements,
      goals,
      fixedVsVariable,
      openModal: setModal,
      userName,
      selY,
      selM,
      selDay,
      daySummary,
      budgets,
      monthProjection,
      safeLimit,
      smartInsights,
      top5Saidas,
      incomeByCategory,
      monthComparison,
      dueSoon
    }
  ), view === "annual" && /* @__PURE__ */ React.createElement(AnnualView, { entries, selY }), view === "entries" && /* @__PURE__ */ React.createElement(
    EntriesView,
    {
      entries: entries.filter((e) => dateInMonth(e.date, selY, selM)),
      onToggle: toggleEntryStatus,
      onDelete: deleteEntry,
      openModal: setModal
    }
  ), view === "calendar" && /* @__PURE__ */ React.createElement(CalendarView, { key: resetTick, entries, expenseCategories, incomeCategories, categoryColors }), view === "budget" && /* @__PURE__ */ React.createElement(BudgetView, { budgets, spend: categorySpendMonth, onUpdate: updateBudget, categories: expenseCategories, categoryColors }), view === "savingsinvest" && /* @__PURE__ */ React.createElement(SavingsInvestView, { savings, investments, onEditSaving: editSaving, onDeleteSaving: deleteSaving, onEditInvestment: editInvestment, onDeleteInvestment: deleteInvestment, openModal: setModal }), view === "cards" && /* @__PURE__ */ React.createElement(CardsView, { cards, purchases, onToggleInstallment: toggleInstallmentStatus, openModal: setModal }), view === "debts" && /* @__PURE__ */ React.createElement(DebtsView, { debtsSummary, onToggleInstallment: toggleDebtInstallmentStatus, onDelete: deleteDebt, openModal: setModal, debtTypes }), view === "wishlist" && /* @__PURE__ */ React.createElement(WishlistView, { wishlist, onDelete: deleteWish, openModal: setModal, setModal }), view === "goals" && /* @__PURE__ */ React.createElement(GoalsView, { goals, onAdd: addToGoal, openModal: setModal }), view === "history" && /* @__PURE__ */ React.createElement(HistoryView, { entries, purchases, debts, savings, investments, expenseCategories, incomeCategories, categoryColors }), view === "categories" && /* @__PURE__ */ React.createElement(CategoriesAndCardsView, { cards, expenseCategories, incomeCategories, categoryColors, paymentMethods, debtTypes, onAddCategory: addCategory, onDeleteCategory: deleteCategory, onRenameCategory: renameCategory, onSetCategoryColor: setCategoryColor, onEditCard: editCard, onDeleteCard: deleteCard, openModal: setModal }), view === "tips" && /* @__PURE__ */ React.createElement(TipsView, { totals, categorySpendMonth, budgets }), view === "settings" && /* @__PURE__ */ React.createElement(
    SettingsView,
    {
      onUpdateApp: handleUpdateApp,
      userName,
      onUpdateName,
      profilePhoto,
      onPhotoUpload: handlePhotoUpload,
      onPhotoRemove: handleRemovePhoto
    }
  ))), /* @__PURE__ */ React.createElement("nav", { className: "bottom-nav" }, NAV.slice(0, 5).map((n) => /* @__PURE__ */ React.createElement("button", { key: n.id, className: `bottom-item ${view === n.id ? "active" : ""}`, onClick: () => setView(n.id) }, /* @__PURE__ */ React.createElement(n.icon, { size: 19 }))), /* @__PURE__ */ React.createElement("button", { className: "bottom-item bottom-more", onClick: () => setModal("moreNav") }, /* @__PURE__ */ React.createElement("span", null, "\u2022\u2022\u2022"))), /* @__PURE__ */ React.createElement("button", { className: "fab", onClick: () => setModal("quickActions") }, /* @__PURE__ */ React.createElement(Plus, { size: 22 })), toast && /* @__PURE__ */ React.createElement("div", { className: "toast" }, toast), modal === "moreNav" && /* @__PURE__ */ React.createElement(Modal, { title: "Mais op\xE7\xF5es", onClose: () => setModal(null) }, /* @__PURE__ */ React.createElement("div", { className: "more-nav-grid" }, NAV.slice(5).map((n) => /* @__PURE__ */ React.createElement("button", { key: n.id, className: "more-nav-item", onClick: () => {
    setView(n.id);
    setModal(null);
  } }, /* @__PURE__ */ React.createElement(n.icon, { size: 18 }), /* @__PURE__ */ React.createElement("span", null, n.label)))), /* @__PURE__ */ React.createElement("div", { className: "account-card", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "account-info" }, /* @__PURE__ */ React.createElement("div", { className: "account-avatar" }, profilePhoto ? /* @__PURE__ */ React.createElement("img", { src: profilePhoto, alt: "", className: "account-avatar-img" }) : (userName || userEmail || "?").slice(0, 1).toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "account-text" }, /* @__PURE__ */ React.createElement("strong", null, userName || "Minha conta"), /* @__PURE__ */ React.createElement("span", null, userEmail))), /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "account-sync-row" }, /* @__PURE__ */ React.createElement("span", { className: `sync-dot sync-${syncState}` }), /* @__PURE__ */ React.createElement("span", { className: "sync-label" }, syncState === "saving" ? "salvando\u2026" : syncState === "error" ? "erro ao salvar" : "sincronizado")), /* @__PURE__ */ React.createElement("div", { className: "account-actions-row" }, /* @__PURE__ */ React.createElement("button", { className: "account-logout", onClick: onSignOut }, "Sair"), /* @__PURE__ */ React.createElement("button", { className: "account-reset", onClick: handleResetAccount, disabled: resettingAccount }, resettingAccount ? "Reiniciando\u2026" : "Reiniciar"), /* @__PURE__ */ React.createElement("button", { className: "account-delete", onClick: handleDeleteAccount, disabled: deletingAccount }, deletingAccount ? "Excluindo\u2026" : "Excluir"))))), modal === "quickActions" && /* @__PURE__ */ React.createElement(Modal, { title: "A\xE7\xE3o r\xE1pida", onClose: () => setModal(null) }, /* @__PURE__ */ React.createElement("div", { className: "quick-grid" }, /* @__PURE__ */ React.createElement("button", { className: "quick-item", onClick: () => setModal("addEntrada") }, /* @__PURE__ */ React.createElement(ArrowUpRight, { size: 18 }), "Entrada"), /* @__PURE__ */ React.createElement("button", { className: "quick-item", onClick: () => setModal("addSaida") }, /* @__PURE__ */ React.createElement(ArrowDownRight, { size: 18 }), "Sa\xEDda"), /* @__PURE__ */ React.createElement("button", { className: "quick-item", onClick: () => setModal("addPurchase") }, /* @__PURE__ */ React.createElement(CreditCard, { size: 18 }), "Compra no cart\xE3o"), /* @__PURE__ */ React.createElement("button", { className: "quick-item", onClick: () => setModal("addDebt") }, /* @__PURE__ */ React.createElement(Landmark, { size: 18 }), "Nova d\xEDvida"), /* @__PURE__ */ React.createElement("button", { className: "quick-item", onClick: () => setModal("addSaving") }, /* @__PURE__ */ React.createElement(PiggyBank, { size: 18 }), "Guardar dinheiro"), /* @__PURE__ */ React.createElement("button", { className: "quick-item", onClick: () => setModal("addInvestment") }, /* @__PURE__ */ React.createElement(TrendingUp, { size: 18 }), "Investir"), /* @__PURE__ */ React.createElement("button", { className: "quick-item", onClick: () => setModal("addWish") }, /* @__PURE__ */ React.createElement(Heart, { size: 18 }), "Desejo"), /* @__PURE__ */ React.createElement("button", { className: "quick-item", onClick: () => setModal("addGoal") }, /* @__PURE__ */ React.createElement(Target, { size: 18 }), "Meta"))), (modal === "addEntrada" || modal === "addSaida") && /* @__PURE__ */ React.createElement(
    EntryModal,
    {
      type: modal === "addEntrada" ? "entrada" : "saida",
      expenseCategories,
      incomeCategories,
      paymentMethods,
      onClose: () => setModal(null),
      onSave: (e) => {
        addEntry(e);
        setModal(null);
      }
    }
  ), modal === "addPurchase" && /* @__PURE__ */ React.createElement(PurchaseModal, { cards, categories: expenseCategories, onClose: () => setModal(null), onSave: (p) => {
    addPurchase(p);
    setModal(null);
  } }), modal === "addCard" && /* @__PURE__ */ React.createElement(CardModal, { onClose: () => setModal(null), onSave: (c) => {
    addCard(c);
    setModal(null);
  } }), typeof modal === "object" && (modal == null ? void 0 : modal.kind) === "editCard" && /* @__PURE__ */ React.createElement(CardModal, { card: modal.card, onClose: () => setModal(null), onSave: (updates) => {
    editCard(modal.card.id, updates);
    setModal(null);
  } }), searchOpen && /* @__PURE__ */ React.createElement("div", { className: "search-overlay", onClick: () => setSearchOpen(false) }, /* @__PURE__ */ React.createElement("div", { className: "search-panel", onClick: (ev) => ev.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "search-input-row" }, /* @__PURE__ */ React.createElement(Search, { size: 18 }), /* @__PURE__ */ React.createElement("input", { autoFocus: true, value: searchQuery, onChange: (ev) => setSearchQuery(ev.target.value), placeholder: "Pesquisar categoria, lan\xE7amento, cart\xE3o, meta..." }), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => setSearchOpen(false) }, /* @__PURE__ */ React.createElement(X, { size: 16 }))), searchQuery.trim().length < 2 ? /* @__PURE__ */ React.createElement("p", { className: "search-hint" }, "Digite ao menos 2 letras para pesquisar em todo o app.") : searchResults.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "search-hint" }, "Nada encontrado para \"", searchQuery, "\".") : /* @__PURE__ */ React.createElement("div", { className: "search-results" }, searchResults.map((r, ri) => /* @__PURE__ */ React.createElement("button", { key: ri, className: "search-result", onClick: () => goToSearchResult(r) }, /* @__PURE__ */ React.createElement("span", { className: "search-kind" }, r.kind), /* @__PURE__ */ React.createElement("span", { className: "search-label" }, r.label), /* @__PURE__ */ React.createElement("span", { className: "search-sub" }, r.sub)))))), modal === "quickCategory" && /* @__PURE__ */ React.createElement(QuickCategoryModal, { onClose: () => setModal(null), onSave: (kind, name) => {
    addCategory(kind, name);
    setModal(null);
  } }), modal === "addDebt" && /* @__PURE__ */ React.createElement(DebtModal, { debtTypes, onClose: () => setModal(null), onSave: (d) => {
    addDebt(d);
    setModal(null);
  } }), typeof modal === "object" && (modal == null ? void 0 : modal.kind) === "addInterest" && /* @__PURE__ */ React.createElement(
    AddInterestModal,
    {
      debtName: modal.debtName,
      installmentValue: modal.installmentValue,
      onClose: () => setModal(null),
      onConfirm: (amount) => {
        addInterestToInstallment(modal.debtId, modal.n, amount);
        setModal(null);
      }
    }
  ), typeof modal === "object" && (modal == null ? void 0 : modal.kind) === "addInterestPurchase" && /* @__PURE__ */ React.createElement(
    AddInterestModal,
    {
      debtName: modal.purchaseName,
      installmentValue: modal.installmentValue,
      onClose: () => setModal(null),
      onConfirm: (amount) => {
        addInterestToPurchaseInstallment(modal.purchaseId, modal.n, amount);
        setModal(null);
      }
    }
  ), typeof modal === "object" && (modal == null ? void 0 : modal.kind) === "editPurchase" && /* @__PURE__ */ React.createElement(EditPurchaseModal, { purchase: modal.purchase, categories: expenseCategories, onClose: () => setModal(null), onSave: (updates) => {
    editPurchase(modal.purchase.id, updates);
    setModal(null);
  } }), typeof modal === "object" && (modal == null ? void 0 : modal.kind) === "editDebt" && /* @__PURE__ */ React.createElement(EditDebtModal, { debt: modal.debt, debtTypes, onClose: () => setModal(null), onSave: (updates) => {
    editDebt(modal.debt.id, updates);
    setModal(null);
  } }), modal === "addWish" && /* @__PURE__ */ React.createElement(WishModal, { categories: expenseCategories, onClose: () => setModal(null), onSave: (w) => {
    addWish(w);
    setModal(null);
  } }), modal === "addGoal" && /* @__PURE__ */ React.createElement(GoalModal, { onClose: () => setModal(null), onSave: (g) => {
    addGoal(g);
    setModal(null);
  } }), modal === "addSaving" && /* @__PURE__ */ React.createElement(SavingModal, { onClose: () => setModal(null), onSave: (s) => {
    addSaving(s);
    setModal(null);
  } }), typeof modal === "object" && (modal == null ? void 0 : modal.kind) === "editSaving" && /* @__PURE__ */ React.createElement(SavingModal, { initial: modal.item, onClose: () => setModal(null), onSave: (s) => {
    editSaving(modal.item.id, s);
    setModal(null);
  } }), modal === "addInvestment" && /* @__PURE__ */ React.createElement(InvestmentModal, { onClose: () => setModal(null), onSave: (i) => {
    addInvestment(i);
    setModal(null);
  } }), typeof modal === "object" && (modal == null ? void 0 : modal.kind) === "editInvestment" && /* @__PURE__ */ React.createElement(InvestmentModal, { initial: modal.item, onClose: () => setModal(null), onSave: (i) => {
    editInvestment(modal.item.id, i);
    setModal(null);
  } }), typeof modal === "object" && (modal == null ? void 0 : modal.kind) === "buyWish" && /* @__PURE__ */ React.createElement(
    BuyWishModal,
    {
      wish: modal.wish,
      cards,
      paymentMethods,
      onClose: () => setModal(null),
      onConfirm: (details) => {
        confirmBuyWish(modal.wish.id, details);
        setModal(null);
      }
    }
  ), typeof modal === "object" && (modal == null ? void 0 : modal.kind) === "editEntry" && /* @__PURE__ */ React.createElement(
    EntryModal,
    {
      type: modal.entry.type,
      expenseCategories,
      incomeCategories,
      paymentMethods,
      initial: modal.entry,
      onClose: () => setModal(null),
      onSave: (e) => {
        editEntry(modal.entry.id, e);
        setModal(null);
      }
    }
  ));
}
function OverviewView({ totals, categorySpendMonth, bars, balanceEvo, paymentMethodSpend, debtsSummary, upcoming, recent, goals, fixedVsVariable, openModal, userName, selY, selM, selDay, daySummary, budgets, monthProjection, safeLimit, smartInsights, top5Saidas, incomeByCategory, monthComparison, dueSoon }) {
  const spentSum = categorySpendMonth.reduce((s, c) => s + c.value, 0) || 1;
  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
  const committedThisMonth = totals.monthOut + totals.monthOutPendingEntries;
  const committedPct = totalBudget > 0 ? Math.round(committedThisMonth / totalBudget * 100) : null;
  const fvTotal = fixedVsVariable.fixedTotal + fixedVsVariable.variableTotal || 1;
  const fixedPct = Math.round(fixedVsVariable.fixedTotal / fvTotal * 100);
  const todayObj = /* @__PURE__ */ new Date();
  const firstName = (userName || "").trim();
  const hourNow = todayObj.getHours();
  const timeGreeting = hourNow >= 4 && hourNow < 12 ? "bom dia" : hourNow >= 12 && hourNow < 18 ? "boa tarde" : "boa noite";
  const capitalizedGreeting = timeGreeting.charAt(0).toUpperCase() + timeGreeting.slice(1);
  const greeting = firstName ? `Ol\xE1 ${firstName}. ${capitalizedGreeting}!` : `Ol\xE1. ${capitalizedGreeting}!`;
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("p", { className: "greeting-line" }, greeting), daySummary && /* @__PURE__ */ React.createElement("p", { className: "day-summary-line" }, (() => {
    const today2 = /* @__PURE__ */ new Date();
    const isToday2 = selY === today2.getFullYear() && selM === today2.getMonth() && selDay === today2.getDate();
    if (daySummary.count === 0) {
      return isToday2 ? "Nenhum lan\xE7amento registrado hoje." : `Nenhum lan\xE7amento registrado no dia ${selDay}.`;
    }
    const label = isToday2 ? "Hoje" : `Dia ${selDay}`;
    return `${label}: ${daySummary.count} lan\xE7amento${daySummary.count > 1 ? "s" : ""} \u2014 entradas ${fmt(daySummary.in)}, sa\xEDdas ${fmt(daySummary.out)}.`;
  })()), monthComparison.hasData && /* @__PURE__ */ React.createElement("div", { className: "card month-comparison-card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Comparado ao m\xEAs passado")), /* @__PURE__ */ React.createElement("ul", { className: "tips-list" }, monthComparison.msgs.map((t, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement(TrendingUp, { size: 16 }), /* @__PURE__ */ React.createElement("span", null, t))))), dueSoon.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Vencimentos"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, dueSoon.length, " item", dueSoon.length > 1 ? "s" : "")), /* @__PURE__ */ React.createElement("ul", { className: "due-soon-list" }, dueSoon.map((u) => {
    const dObj = new Date(u.date + "T00:00:00");
    const t0 = /* @__PURE__ */ new Date();
    t0.setHours(0, 0, 0, 0);
    const isToday = dObj.getTime() <= t0.getTime();
    const fullDesc = u.desc + (u.parcel ? " " + u.parcel : "");
    return /* @__PURE__ */ React.createElement("li", { key: u.id }, /* @__PURE__ */ React.createElement("div", { className: "due-item-info" }, /* @__PURE__ */ React.createElement("span", { className: "due-item-kind" }, u.kind), /* @__PURE__ */ React.createElement("span", { className: "due-item-desc" }, fullDesc, " ", /* @__PURE__ */ React.createElement("span", { className: "due-item-paren" }, "(", dObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), ")"))), /* @__PURE__ */ React.createElement("div", { className: "due-item-right" }, /* @__PURE__ */ React.createElement("strong", null, fmt(u.value)), /* @__PURE__ */ React.createElement("span", { className: `due-item-badge ${isToday ? "overdue" : "soon"}` }, isToday ? "Venceu" : dObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }))));
  }))), /* @__PURE__ */ React.createElement("div", { className: "quick-actions-row" }, /* @__PURE__ */ React.createElement("div", { className: "qa-title-row" }, /* @__PURE__ */ React.createElement("h4", null, "A\xE7\xF5es r\xE1pidas"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "toque para registrar")), /* @__PURE__ */ React.createElement("div", { className: "qa-scroll" }, /* @__PURE__ */ React.createElement("button", { className: "qa-btn", onClick: () => openModal("addEntrada") }, /* @__PURE__ */ React.createElement(ArrowUpRight, { size: 16 }), "Entrada"), /* @__PURE__ */ React.createElement("button", { className: "qa-btn", onClick: () => openModal("addSaida") }, /* @__PURE__ */ React.createElement(ArrowDownRight, { size: 16 }), "Sa\xEDda"), /* @__PURE__ */ React.createElement("button", { className: "qa-btn", onClick: () => openModal("addPurchase") }, /* @__PURE__ */ React.createElement(CreditCard, { size: 16 }), "Cart\xE3o"), /* @__PURE__ */ React.createElement("button", { className: "qa-btn", onClick: () => openModal("addSaving") }, /* @__PURE__ */ React.createElement(PiggyBank, { size: 16 }), "Guardar"), /* @__PURE__ */ React.createElement("button", { className: "qa-btn", onClick: () => openModal("addInvestment") }, /* @__PURE__ */ React.createElement(TrendingUp, { size: 16 }), "Investir"), /* @__PURE__ */ React.createElement("button", { className: "qa-btn", onClick: () => openModal("addWish") }, /* @__PURE__ */ React.createElement(Heart, { size: 16 }), "Desejo"), /* @__PURE__ */ React.createElement("button", { className: "qa-btn", onClick: () => openModal("addGoal") }, /* @__PURE__ */ React.createElement(Target, { size: 16 }), "Meta"), /* @__PURE__ */ React.createElement("button", { className: "qa-btn", onClick: () => openModal("addCard") }, /* @__PURE__ */ React.createElement(CreditCard, { size: 16 }), "Novo cart\xE3o"), /* @__PURE__ */ React.createElement("button", { className: "qa-btn", onClick: () => openModal("quickCategory") }, /* @__PURE__ */ React.createElement(Plus, { size: 16 }), "Categoria"))), React.createElement("div", { className: "summary-grid" }, /* @__PURE__ */ React.createElement(SummaryCard, { icon: /* @__PURE__ */ React.createElement(Wallet, { size: 17 }), label: "Saldo do m\xEAs", value: fmt(totals.saldoMes), tone: "purple", valueClass: totals.saldoMes <= 0 ? "negative" : "positive" }), /* @__PURE__ */ React.createElement(SummaryCard, { icon: /* @__PURE__ */ React.createElement(ArrowUpRight, { size: 17 }), label: "Entradas do m\xEAs", value: fmt(totals.monthIn), sub: totals.monthInPending > 0 ? `+ ${fmt(totals.monthInPending)} a receber` : null, tone: "green" }), /* @__PURE__ */ React.createElement(SummaryCard, { icon: /* @__PURE__ */ React.createElement(ArrowDownRight, { size: 17 }), label: "Sa\xEDdas do m\xEAs", value: fmt(totals.monthOut), sub: totals.monthOutPendingEntries > 0 ? `+ ${fmt(totals.monthOutPendingEntries)} pendente` : null, tone: "red" }), /* @__PURE__ */ React.createElement(SummaryCard, { icon: /* @__PURE__ */ React.createElement(PiggyBank, { size: 17 }), label: "Dinheiro guardado", value: fmt(totals.totalSavings), tone: "lavender" }), /* @__PURE__ */ React.createElement(SummaryCard, { icon: /* @__PURE__ */ React.createElement(TrendingUp, { size: 17 }), label: "Dinheiro investido", value: fmt(totals.totalInvest), tone: "blue" }), /* @__PURE__ */ React.createElement(SummaryCard, { icon: /* @__PURE__ */ React.createElement(Calendar, { size: 17 }), label: "Compromissos futuros", value: fmt(totals.committedTotal), tone: "orange" }), /* @__PURE__ */ React.createElement(SummaryCard, { icon: /* @__PURE__ */ React.createElement(Landmark, { size: 17 }), label: "D\xEDvidas ativas", value: fmt(totals.totalDebtRemaining), tone: "dark" })), /* @__PURE__ */ React.createElement("div", { className: "two-col" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Como ser\xE1 meu m\xEAs?")), /* @__PURE__ */ React.createElement("div", { className: "month-projection-grid" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Previsto para entrar"), /* @__PURE__ */ React.createElement("strong", { className: "value-positive" }, fmt(monthProjection.previstoTotal))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Previsto para sair"), /* @__PURE__ */ React.createElement("strong", { className: "value-negative" }, fmt(monthProjection.comprometidoTotal))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Previsto para sobrar no m\xEAs"), /* @__PURE__ */ React.createElement("strong", { className: monthProjection.projecao >= 0 ? "value-positive" : "value-negative" }, fmt(monthProjection.projecao))))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Insights")), smartInsights.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(Lightbulb, { size: 24 }), text: "Continue registrando para desbloquear an\xE1lises personalizadas." }) : /* @__PURE__ */ React.createElement("ul", { className: "tips-list" }, smartInsights.map((t, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement(Lightbulb, { size: 16 }), /* @__PURE__ */ React.createElement("span", null, t)))))), /* @__PURE__ */ React.createElement("div", { className: "two-col" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Entradas por categoria"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "m\xEAs selecionado")), incomeByCategory.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(ArrowUpRight, { size: 24 }), text: "Sem entradas neste m\xEAs." }) : /* @__PURE__ */ React.createElement("div", { className: "donut-row" }, /* @__PURE__ */ React.createElement(DonutChartSVG, { data: incomeByCategory.slice(0, 6), size: 130 }), /* @__PURE__ */ React.createElement("div", { className: "donut-legend" }, incomeByCategory.slice(0, 6).map((c) => /* @__PURE__ */ React.createElement("div", { key: c.label, className: "donut-legend-item" }, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: c.color } }), /* @__PURE__ */ React.createElement("span", null, c.label), /* @__PURE__ */ React.createElement("strong", null, fmt(c.value))))))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Sa\xEDdas por categoria"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "m\xEAs selecionado")), categorySpendMonth.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(BarChart2, { size: 26 }), text: "Nenhum gasto registrado neste m\xEAs." }) : /* @__PURE__ */ React.createElement("div", { className: "donut-row" }, /* @__PURE__ */ React.createElement(DonutChartSVG, { data: categorySpendMonth.slice(0, 6) }), /* @__PURE__ */ React.createElement("div", { className: "donut-legend" }, categorySpendMonth.slice(0, 6).map((c) => /* @__PURE__ */ React.createElement("div", { key: c.label, className: "donut-legend-item" }, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: c.color } }), /* @__PURE__ */ React.createElement("span", null, c.label), /* @__PURE__ */ React.createElement("strong", null, Math.round(c.value / spentSum * 100), "%"))))))), /* @__PURE__ */ React.createElement("div", { className: "two-col" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Entradas x Sa\xEDdas"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "\xFAltimos 6 meses")), /* @__PURE__ */ React.createElement(BarChartSVG, { data: bars }), /* @__PURE__ */ React.createElement("div", { className: "legend-row" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: "var(--accent-purple)" } }), "Entradas"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: "var(--accent-pink)" } }), "Sa\xEDdas"))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Fixo x Vari\xE1vel"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "sa\xEDdas do m\xEAs")), /* @__PURE__ */ React.createElement("div", { className: "fv-split-bar" }, /* @__PURE__ */ React.createElement("div", { style: { width: `${fixedPct}%` } })), /* @__PURE__ */ React.createElement("div", { className: "fv-rows" }, /* @__PURE__ */ React.createElement("div", { className: "fv-row" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: "var(--accent-purple)" } }), "Fixo"), /* @__PURE__ */ React.createElement("strong", null, fmt(fixedVsVariable.fixedTotal))), /* @__PURE__ */ React.createElement("div", { className: "fv-row" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: "var(--pink)" } }), "Vari\xE1vel"), /* @__PURE__ */ React.createElement("strong", null, fmt(fixedVsVariable.variableTotal)))), /* @__PURE__ */ React.createElement("p", { className: "muted-sm" }, fixedPct, "% dos seus gastos s\xE3o fixos este m\xEAs."))), /* @__PURE__ */ React.createElement("div", { className: "three-col" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Evolu\xE7\xE3o do saldo"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "\xFAltimos 6 meses")), /* @__PURE__ */ React.createElement(LineChartSVG, { points: balanceEvo })), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Sa\xEDdas por pagamento"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "m\xEAs selecionado")), paymentMethodSpend.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(Banknote, { size: 24 }), text: "Sem sa\xEDdas neste m\xEAs." }) : /* @__PURE__ */ React.createElement("div", { className: "donut-row" }, /* @__PURE__ */ React.createElement(DonutChartSVG, { data: paymentMethodSpend, size: 130 }), /* @__PURE__ */ React.createElement("div", { className: "donut-legend" }, paymentMethodSpend.map((c) => /* @__PURE__ */ React.createElement("div", { key: c.label, className: "donut-legend-item" }, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: c.color } }), /* @__PURE__ */ React.createElement("span", null, c.label), /* @__PURE__ */ React.createElement("strong", null, fmt(c.value))))))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "D\xEDvidas por credor"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "saldo pendente")), debtsSummary.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(Landmark, { size: 24 }), text: "Nenhuma d\xEDvida cadastrada." }) : /* @__PURE__ */ React.createElement("div", { className: "debt-mini-list" }, debtsSummary.map((d) => {
    const firstOverdue = d.installments.find((i) => i.overdue);
    return /* @__PURE__ */ React.createElement("div", { key: d.id, className: `debt-mini ${d.overdueCount > 0 ? "debt-mini-overdue" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "debt-mini-head" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: d.overdueCount > 0 ? "#D65C6E" : d.color } }), d.name, d.overdueCount > 0 && /* @__PURE__ */ React.createElement(Badge, { tone: "danger" }, "atrasada")), /* @__PURE__ */ React.createElement("strong", { className: d.overdueCount > 0 ? "overdue-text" : "" }, fmt(d.remaining))), /* @__PURE__ */ React.createElement(ProgressBar, { value: d.paidCount, max: d.count, colorVar: d.overdueCount > 0 ? "#D65C6E" : d.color }), /* @__PURE__ */ React.createElement("div", { className: "debt-mini-footer" }, d.overdueCount > 0 && (firstOverdue == null ? void 0 : firstOverdue.dueDate) && /* @__PURE__ */ React.createElement("span", { className: "overdue-text" }, "Em atraso desde ", (/* @__PURE__ */ new Date(firstOverdue.dueDate + "T00:00:00")).toLocaleDateString("pt-BR")), d.interestRate > 0 && /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "Juros: ", d.interestRate, "% a.m.")));
  })))), /* @__PURE__ */ React.createElement("div", { className: "two-col" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "5 maiores sa\xEDdas"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "m\xEAs selecionado")), top5Saidas.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(ArrowDownRight, { size: 24 }), text: "Sem sa\xEDdas neste m\xEAs." }) : /* @__PURE__ */ React.createElement("div", { className: "top5-list" }, top5Saidas.map((e) => /* @__PURE__ */ React.createElement("div", { key: e.id, className: "top5-row" }, /* @__PURE__ */ React.createElement("div", { className: "top5-info" }, /* @__PURE__ */ React.createElement("span", { className: "top5-desc" }, e.desc), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, e.category)), /* @__PURE__ */ React.createElement("div", { className: "top5-bar-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "top5-bar", style: { width: `${e.value / Math.max(1, ...top5Saidas.map((x) => x.value)) * 100}%` } })), /* @__PURE__ */ React.createElement("strong", null, fmt(e.value)))) ) ), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "\xDAltimas movimenta\xE7\xF5es")), recent.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(Repeat, { size: 26 }), text: "Sem movimenta\xE7\xF5es neste m\xEAs." }) : /* @__PURE__ */ React.createElement("ul", { className: "movement-list" }, recent.map((e) => /* @__PURE__ */ React.createElement("li", { key: e.id }, /* @__PURE__ */ React.createElement("div", { className: `mv-icon ${e.type}` }, e.type === "entrada" ? /* @__PURE__ */ React.createElement(ArrowUpRight, { size: 14 }) : /* @__PURE__ */ React.createElement(ArrowDownRight, { size: 14 })), /* @__PURE__ */ React.createElement("div", { className: "mv-info" }, /* @__PURE__ */ React.createElement("span", { className: "mv-desc" }, e.desc), /* @__PURE__ */ React.createElement("span", { className: "mv-cat" }, e.category)), /* @__PURE__ */ React.createElement("div", { className: "mv-right" }, /* @__PURE__ */ React.createElement("span", { className: `mv-value ${e.type}` }, e.type === "entrada" ? "+" : "-", fmt(e.value)), /* @__PURE__ */ React.createElement(Badge, { tone: e.status === "pago" ? "green" : "orange" }, e.status))))))), /* @__PURE__ */ React.createElement("div", { className: "two-col" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Pr\xF3ximos compromissos")), upcoming.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(Calendar, { size: 26 }), text: "Nenhum compromisso pendente." }) : /* @__PURE__ */ React.createElement("ul", { className: "timeline" }, upcoming.map((u) => /* @__PURE__ */ React.createElement("li", { key: u.id }, /* @__PURE__ */ React.createElement("div", { className: "tl-dot" }), /* @__PURE__ */ React.createElement("div", { className: "tl-body" }, /* @__PURE__ */ React.createElement("span", { className: "tl-desc" }, u.desc), /* @__PURE__ */ React.createElement("span", { className: "tl-date" }, new Date(u.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }))), /* @__PURE__ */ React.createElement("strong", { className: "tl-value" }, fmt(u.value)))))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Metas em progresso")), goals.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(Target, { size: 26 }), text: "Nenhuma meta criada ainda." }) : /* @__PURE__ */ React.createElement("div", { className: "goal-mini-list" }, goals.slice(0, 3).map((g) => /* @__PURE__ */ React.createElement("div", { key: g.id, className: "goal-mini" }, /* @__PURE__ */ React.createElement("div", { className: "goal-mini-head" }, /* @__PURE__ */ React.createElement("span", null, g.name), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, Math.round(g.current / g.target * 100), "%")), /* @__PURE__ */ React.createElement(ProgressBar, { value: g.current, max: g.target, colorVar: "linear-gradient(90deg,var(--accent-purple),var(--accent-pink))" })))))));
}
function SummaryCard({ icon, label, value, sub, tone, valueClass }) {
  return /* @__PURE__ */ React.createElement("div", { className: `sum-card tone-${tone}` }, /* @__PURE__ */ React.createElement("div", { className: "sum-icon" }, icon), /* @__PURE__ */ React.createElement("div", { className: "sum-label" }, label), /* @__PURE__ */ React.createElement("div", { className: `sum-value${valueClass ? " " + valueClass : ""}` }, value), sub && /* @__PURE__ */ React.createElement("div", { className: "sum-sub" }, sub));
}
function buildCalendarInsights({ bestDay, worstDay, bestMonth, worstMonth, currentMonthAgg, selM, selY }) {
  const tips = [];
  if (currentMonthAgg) {
    const { in: cin, out: cout } = currentMonthAgg;
    const net = cin - cout;
    if (cin === 0 && cout > 0) {
      tips.push(`${MONTHS[selM]} tem sa\xEDdas registradas (${fmt(cout)}), mas ainda nenhuma entrada lan\xE7ada para o per\xEDodo.`);
    } else if (cin === 0 && cout === 0) {
      tips.push(`Ainda n\xE3o h\xE1 movimenta\xE7\xF5es suficientes em ${MONTHS[selM]} para uma an\xE1lise.`);
    } else if (net < 0) {
      tips.push(`${MONTHS[selM]} est\xE1 negativo: as sa\xEDdas (${fmt(cout)}) est\xE3o acima das entradas (${fmt(cin)}).`);
    } else if (net > 0) {
      tips.push(`${MONTHS[selM]} est\xE1 positivo: entradas de ${fmt(cin)} contra sa\xEDdas de ${fmt(cout)}.`);
    } else {
      tips.push(`${MONTHS[selM]} est\xE1 exatamente equilibrado: entradas e sa\xEDdas se igualam em ${fmt(cin)}.`);
    }
  } else {
    tips.push(`Ainda n\xE3o h\xE1 movimenta\xE7\xF5es suficientes em ${MONTHS[selM]} para uma an\xE1lise.`);
  }
  if (bestDay && worstDay) {
    const bd = new Date(bestDay.date + "T00:00:00");
    if (bestDay.net >= 0) {
      tips.push(`O dia ${bd.getDate()} foi o melhor do m\xEAs, fechando em ${fmt(bestDay.net)}.`);
    } else {
      tips.push(`Mesmo o melhor dia do m\xEAs (dia ${bd.getDate()}) fechou negativo, em ${fmt(bestDay.net)}.`);
    }
    if (worstDay.date !== bestDay.date && worstDay.net < 0) {
      const wd = new Date(worstDay.date + "T00:00:00");
      tips.push(`J\xE1 o dia ${wd.getDate()} foi o mais pesado, fechando em ${fmt(worstDay.net)}.`);
    }
  }
  if (bestMonth && worstMonth) {
    if (bestMonth.v >= 0) {
      tips.push(`${MONTHS[bestMonth.m]} foi o melhor m\xEAs de ${selY} at\xE9 agora, com saldo de ${fmt(bestMonth.v)}.`);
    } else {
      tips.push(`Nenhum m\xEAs de ${selY} fechou positivo at\xE9 agora \u2014 o menos dif\xEDcil foi ${MONTHS[bestMonth.m]}, com ${fmt(bestMonth.v)}.`);
    }
    if (worstMonth.m !== bestMonth.m && worstMonth.v < 0) {
      tips.push(`${MONTHS[worstMonth.m]} foi o mais dif\xEDcil do ano, fechando em ${fmt(worstMonth.v)}.`);
    }
  }
  return tips;
}
function AnnualView({ entries, selY }) {
  const monthData = useMemo(() => {
    const arr = [];
    for (let m = 0; m < 12; m++) {
      const prefix = `${selY}-${pad2(m + 1)}`;
      const monthEntries = entries.filter((e) => e.date && e.date.startsWith(prefix));
      const totalIn = monthEntries.filter((e) => e.type === "entrada").reduce((s, e) => s + e.value, 0);
      const totalOut = monthEntries.filter((e) => e.type === "saida").reduce((s, e) => s + e.value, 0);
      arr.push({ m, totalIn, totalOut, net: totalIn - totalOut, hasData: monthEntries.length > 0 });
    }
    return arr;
  }, [entries, selY]);
  const withData = monthData.filter((d) => d.hasData);
  const pick = (cmp) => withData.length ? withData.reduce((a, b) => cmp(b, a) ? b : a) : null;
  const mostSpent = pick((b, a) => b.totalOut > a.totalOut);
  const leastSpent = pick((b, a) => b.totalOut < a.totalOut);
  const mostIncome = pick((b, a) => b.totalIn > a.totalIn);
  const bestNet = pick((b, a) => b.net > a.net);
  const worstNet = pick((b, a) => b.net < a.net);
  const totalYearIn = withData.reduce((s, d) => s + d.totalIn, 0);
  const totalYearOut = withData.reduce((s, d) => s + d.totalOut, 0);
  if (withData.length === 0) {
    return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(BarChart2, { size: 28 }), text: `Ainda n\xE3o h\xE1 lan\xE7amentos suficientes em ${selY} para uma an\xE1lise anual. Continue registrando ao longo dos meses!` })));
  }
  const highlights = [];
  if (mostSpent) highlights.push(`${MONTHS[mostSpent.m]} foi o m\xEAs com mais sa\xEDdas, somando ${fmt(mostSpent.totalOut)}.`);
  if (leastSpent && (!mostSpent || leastSpent.m !== mostSpent.m)) highlights.push(`${MONTHS[leastSpent.m]} teve as menores sa\xEDdas, com ${fmt(leastSpent.totalOut)}.`);
  if (mostIncome) highlights.push(`${MONTHS[mostIncome.m]} teve as maiores entradas, com ${fmt(mostIncome.totalIn)}.`);
  if (bestNet) highlights.push(bestNet.net >= 0 ? `${MONTHS[bestNet.m]} foi o melhor m\xEAs do ano, fechando em ${fmt(bestNet.net)}.` : `Nenhum m\xEAs fechou positivo ainda \u2014 o menos dif\xEDcil foi ${MONTHS[bestNet.m]}, com ${fmt(bestNet.net)}.`);
  if (worstNet && (!bestNet || worstNet.m !== bestNet.m) && worstNet.net < 0) highlights.push(`${MONTHS[worstNet.m]} foi o m\xEAs mais apertado, fechando em ${fmt(worstNet.net)}.`);
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Resumo de ", selY), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, withData.length, "/12 meses com dados")), /* @__PURE__ */ React.createElement("div", { className: "month-projection-grid" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Total de entradas"), /* @__PURE__ */ React.createElement("strong", { className: "value-positive" }, fmt(totalYearIn))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Total de sa\xEDdas"), /* @__PURE__ */ React.createElement("strong", { className: "value-negative" }, fmt(totalYearOut))))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Entradas e sa\xEDdas por m\xEAs")), /* @__PURE__ */ React.createElement(BarChartSVG, { data: monthData.map((d) => ({ label: MONTHS[d.m].slice(0, 3), entrada: d.totalIn, saida: d.totalOut })) }), /* @__PURE__ */ React.createElement("div", { className: "legend-row" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: "var(--accent-purple)" } }), "Entradas"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: "var(--accent-pink)" } }), "Sa\xEDdas"))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Destaques do ano")), /* @__PURE__ */ React.createElement("ul", { className: "tips-list" }, highlights.map((t, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement(Lightbulb, { size: 16 }), /* @__PURE__ */ React.createElement("span", null, t))))));
}
function CalendarView({ entries, expenseCategories, incomeCategories, categoryColors }) {
  const allCatsForColor = [...expenseCategories, ...incomeCategories];
  const [selY, setSelY] = useState(() => (/* @__PURE__ */ new Date()).getFullYear());
  const [selM, setSelM] = useState(() => (/* @__PURE__ */ new Date()).getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const daysInMonth = new Date(selY, selM + 1, 0).getDate();
  const firstWeekday = new Date(selY, selM, 1).getDay();
  const dayMap = {};
  entries.forEach((e) => {
    if (!e.date) return;
    const d = e.date.slice(0, 10);
    if (!dayMap[d]) dayMap[d] = { in: 0, out: 0, cats: [] };
    if (e.type === "entrada") dayMap[d].in += e.value;
    else dayMap[d].out += e.value;
    if (e.category && !dayMap[d].cats.includes(e.category)) dayMap[d].cats.push(e.category);
  });
  const monthPrefix = `${selY}-${String(selM + 1).padStart(2, "0")}`;
  const monthDays = Object.keys(dayMap).filter((d) => d.startsWith(monthPrefix));
  let bestDay = null, worstDay = null;
  monthDays.forEach((d) => {
    const { in: din, out: dout } = dayMap[d];
    const net = din - dout;
    if (!bestDay || net > bestDay.net) bestDay = { date: d, net, in: din, out: dout };
    if (!worstDay || net < worstDay.net) worstDay = { date: d, net, in: din, out: dout };
  });
  const monthAgg = {};
  entries.forEach((e) => {
    if (!e.date || !e.date.startsWith(String(selY))) return;
    const mIdx = Number(e.date.slice(5, 7)) - 1;
    if (!monthAgg[mIdx]) monthAgg[mIdx] = { in: 0, out: 0 };
    if (e.type === "entrada") monthAgg[mIdx].in += e.value;
    else monthAgg[mIdx].out += e.value;
  });
  let bestMonth = null, worstMonth = null;
  Object.keys(monthAgg).forEach((mi) => {
    const m = Number(mi);
    const { in: min_, out: mout } = monthAgg[mi];
    const v = min_ - mout;
    if (!bestMonth || v > bestMonth.v) bestMonth = { m, v, in: min_, out: mout };
    if (!worstMonth || v < worstMonth.v) worstMonth = { m, v, in: min_, out: mout };
  });
  const currentMonthAgg = monthAgg[selM] || null;
  const selectedEntries = selectedDate ? entries.filter((e) => e.date === selectedDate) : [];
  const selectedIn = selectedEntries.filter((e) => e.type === "entrada").reduce((s, e) => s + e.value, 0);
  const selectedOut = selectedEntries.filter((e) => e.type === "saida").reduce((s, e) => s + e.value, 0);
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const fmtDateKey = (d) => `${selY}-${String(selM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const changeMonthLocal = (delta) => {
    const d = new Date(selY, selM + delta, 1);
    setSelY(d.getFullYear());
    setSelM(d.getMonth());
    setSelectedDate(null);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Calend\xE1rio financeiro"), /* @__PURE__ */ React.createElement("div", { className: "month-switch" }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => changeMonthLocal(-1) }, /* @__PURE__ */ React.createElement(ChevronLeft, { size: 16 })), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, MONTHS[selM], " ", selY), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => changeMonthLocal(1) }, /* @__PURE__ */ React.createElement(ChevronRight, { size: 16 })))), /* @__PURE__ */ React.createElement("div", { className: "calendar-grid" }, ["D", "S", "T", "Q", "Q", "S", "S"].map((wd, i) => /* @__PURE__ */ React.createElement("div", { key: "wd" + i, className: "cal-weekday" }, wd)), cells.map((d, i) => {
    if (d === null) return /* @__PURE__ */ React.createElement("div", { key: "empty" + i, className: "cal-cell empty" });
    const key = fmtDateKey(d);
    const info = dayMap[key];
    const isSelected = selectedDate === key;
    const isToday = key === todayISO();
    return /* @__PURE__ */ React.createElement("button", { key, className: `cal-cell ${isSelected ? "sel" : ""} ${isToday ? "today" : ""}`, onClick: () => setSelectedDate(isSelected ? null : key) }, /* @__PURE__ */ React.createElement("span", { className: "cal-day-num" }, d), info && info.cats.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "cal-dots" }, info.cats.slice(0, 4).map((cat, ci) => /* @__PURE__ */ React.createElement("i", { key: ci, className: "cal-dot", style: { background: catColor(cat, allCatsForColor, categoryColors) } }))));
  }))), selectedDate && /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }))), selectedEntries.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(Calendar, { size: 24 }), text: "Nada registrado neste dia." }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "cal-day-summary" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Entradas"), /* @__PURE__ */ React.createElement("strong", { className: "value-positive" }, fmt(selectedIn))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Sa\xEDdas"), /* @__PURE__ */ React.createElement("strong", { className: "value-negative" }, fmt(selectedOut))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Saldo do dia"), /* @__PURE__ */ React.createElement("strong", { className: selectedIn - selectedOut >= 0 ? "value-positive" : "value-negative" }, fmt(selectedIn - selectedOut)))), /* @__PURE__ */ React.createElement("ul", { className: "movement-list" }, selectedEntries.map((e) => /* @__PURE__ */ React.createElement("li", { key: e.id }, /* @__PURE__ */ React.createElement("div", { className: `mv-icon ${e.type}` }, e.type === "entrada" ? /* @__PURE__ */ React.createElement(ArrowUpRight, { size: 14 }) : /* @__PURE__ */ React.createElement(ArrowDownRight, { size: 14 })), /* @__PURE__ */ React.createElement("div", { className: "mv-info" }, /* @__PURE__ */ React.createElement("span", { className: "mv-desc" }, e.desc), /* @__PURE__ */ React.createElement("span", { className: "mv-cat" }, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: catColor(e.category, e.type === "entrada" ? incomeCategories : expenseCategories, categoryColors) } }), e.category)), /* @__PURE__ */ React.createElement("div", { className: "mv-right" }, /* @__PURE__ */ React.createElement("span", { className: `mv-value ${e.type}` }, e.type === "entrada" ? "+" : "-", fmt(e.value)))))))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Resumo geral do m\xEAs")), /* @__PURE__ */ React.createElement("ul", { className: "tips-list" }, buildCalendarInsights({ bestDay, worstDay, bestMonth, worstMonth, currentMonthAgg, selM, selY }).map((t, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement(Lightbulb, { size: 16 }), /* @__PURE__ */ React.createElement("span", null, t))))));
}
function EntriesView({ entries, onToggle, onDelete, openModal }) {
  const [filter, setFilter] = useState("todos");
  const [nature, setNature] = useState("todos");
  const [search, setSearch] = useState("");
  const [bankFilter, setBankFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const banksInUse = [...new Set(entries.map((e) => e.bank))].sort();
  const filtered = entries.filter((e) => {
    if (filter !== "todos" && e.type !== filter) return false;
    if (nature === "fixo" && !e.fixed) return false;
    if (nature === "variavel" && e.fixed) return false;
    if (search && !e.desc.toLowerCase().includes(search.toLowerCase())) return false;
    if (bankFilter !== "todos" && e.bank !== bankFilter) return false;
    if (dateFrom && e.date < dateFrom) return false;
    if (dateTo && e.date > dateTo) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
  const hasActiveFilters = search || bankFilter !== "todos" || dateFrom || dateTo || nature !== "todos";
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("div", { className: "filter-row" }, /* @__PURE__ */ React.createElement("button", { className: `chip ${filter === "todos" ? "chip-active" : ""}`, onClick: () => setFilter("todos") }, "Todos"), /* @__PURE__ */ React.createElement("button", { className: `chip ${filter === "entrada" ? "chip-active" : ""}`, onClick: () => setFilter("entrada") }, "Entradas"), /* @__PURE__ */ React.createElement("button", { className: `chip ${filter === "saida" ? "chip-active" : ""}`, onClick: () => setFilter("saida") }, "Sa\xEDdas"), /* @__PURE__ */ React.createElement("span", { className: "filter-divider" }), /* @__PURE__ */ React.createElement("button", { className: `chip ${nature === "todos" ? "chip-active" : ""}`, onClick: () => setNature("todos") }, "Fixo + Vari\xE1vel"), /* @__PURE__ */ React.createElement("button", { className: `chip ${nature === "fixo" ? "chip-active" : ""}`, onClick: () => setNature("fixo") }, "Fixo"), /* @__PURE__ */ React.createElement("button", { className: `chip ${nature === "variavel" ? "chip-active" : ""}`, onClick: () => setNature("variavel") }, "Vari\xE1vel"), /* @__PURE__ */ React.createElement("div", { className: "spacer" }), /* @__PURE__ */ React.createElement("button", { className: "btn-primary sm", onClick: () => openModal("addEntrada") }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), "Entrada"), /* @__PURE__ */ React.createElement("button", { className: "btn-secondary sm", onClick: () => openModal("addSaida") }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), "Sa\xEDda")), /* @__PURE__ */ React.createElement("div", { className: "card filter-panel" }, /* @__PURE__ */ React.createElement("div", { className: "filter-panel-grid" }, /* @__PURE__ */ React.createElement(Field, { label: "Buscar por nome" }, /* @__PURE__ */ React.createElement("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Ex: Mercado, Sal\xE1rio..." })), /* @__PURE__ */ React.createElement(Field, { label: "Banco" }, /* @__PURE__ */ React.createElement("select", { value: bankFilter, onChange: (e) => setBankFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "todos" }, "Todos os bancos"), banksInUse.map((b) => /* @__PURE__ */ React.createElement("option", { key: b, value: b }, b)))), /* @__PURE__ */ React.createElement(Field, { label: "De" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "At\xE9" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value) }))), hasActiveFilters && /* @__PURE__ */ React.createElement("button", { className: "chip static clear-filters", onClick: () => {
    setNature("todos");
    setSearch("");
    setBankFilter("todos");
    setDateFrom("");
    setDateTo("");
  } }, /* @__PURE__ */ React.createElement(X, { size: 12 }), " Limpar filtros")), /* @__PURE__ */ React.createElement("div", { className: "card table-card" }, sorted.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(Repeat, { size: 26 }), text: "Nenhum lan\xE7amento encontrado com esses filtros." }) : /* @__PURE__ */ React.createElement("div", { className: "table-scroll" }, /* @__PURE__ */ React.createElement("table", { className: "data-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Descri\xE7\xE3o"), /* @__PURE__ */ React.createElement("th", null, "Categoria"), /* @__PURE__ */ React.createElement("th", null, "Data"), /* @__PURE__ */ React.createElement("th", null, "Banco"), /* @__PURE__ */ React.createElement("th", null, "Tipo"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", null, "Valor"), /* @__PURE__ */ React.createElement("th", null))), /* @__PURE__ */ React.createElement("tbody", null, sorted.map((e) => /* @__PURE__ */ React.createElement("tr", { key: e.id }, /* @__PURE__ */ React.createElement("td", null, e.desc), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Badge, { tone: "neutral" }, e.category)), /* @__PURE__ */ React.createElement("td", null, new Date(e.date).toLocaleDateString("pt-BR")), /* @__PURE__ */ React.createElement("td", null, e.bank), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Badge, { tone: e.fixed ? "purple" : "neutral" }, e.fixed ? "fixo" : "vari\xE1vel")), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("button", { className: `status-toggle ${e.status}`, onClick: () => onToggle(e.id) }, e.status === "pago" ? /* @__PURE__ */ React.createElement(Check, { size: 12 }) : /* @__PURE__ */ React.createElement(Clock, { size: 12 }), " ", e.status)), /* @__PURE__ */ React.createElement("td", { className: e.type === "entrada" ? "value-pos" : "value-neg" }, e.type === "entrada" ? "+" : "-", fmt(e.value)), /* @__PURE__ */ React.createElement("td", { className: "row-actions" }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => openModal({ kind: "editEntry", entry: e }) }, /* @__PURE__ */ React.createElement(Edit3, { size: 14 })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn danger", onClick: () => onDelete(e.id) }, /* @__PURE__ */ React.createElement(Trash2, { size: 14 }))))))))));
}
function BudgetView({ budgets, spend, onUpdate, categories, categoryColors }) {
  const spendMap = Object.fromEntries(spend.map((s) => [s.label, s.value]));
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("p", { className: "section-intro" }, "Defina limites por categoria para planejar seus gastos. O or\xE7amento n\xE3o gera sa\xEDdas \u2014 serve apenas para acompanhamento."), /* @__PURE__ */ React.createElement("div", { className: "budget-grid" }, categories.map((cat) => {
    const limit = budgets[cat] || 0;
    const used = spendMap[cat] || 0;
    const pct = limit > 0 ? used / limit * 100 : 0;
    const tone = pct >= 100 ? "danger" : pct >= 75 ? "warning" : "green";
    return /* @__PURE__ */ React.createElement("div", { key: cat, className: "budget-card" }, /* @__PURE__ */ React.createElement("div", { className: "budget-card-head" }, /* @__PURE__ */ React.createElement("span", { className: "budget-cat" }, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: catColor(cat, categories, categoryColors) } }), cat), editing === cat ? /* @__PURE__ */ React.createElement("div", { className: "budget-edit" }, /* @__PURE__ */ React.createElement("input", { autoFocus: true, type: "number", value: draft, onChange: (e) => setDraft(e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => {
      onUpdate(cat, Number(draft) || 0);
      setEditing(null);
    } }, /* @__PURE__ */ React.createElement(Check, { size: 14 }))) : /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => {
      setEditing(cat);
      setDraft(String(limit));
    } }, /* @__PURE__ */ React.createElement(Edit3, { size: 13 }))), /* @__PURE__ */ React.createElement(ProgressBar, { value: used, max: limit || 1, colorVar: tone === "danger" ? "#D65C6E" : tone === "warning" ? "#D99A2B" : "#56B08A" }), /* @__PURE__ */ React.createElement("div", { className: "budget-numbers" }, /* @__PURE__ */ React.createElement("span", null, fmt(used), " de ", fmt(limit)), /* @__PURE__ */ React.createElement(Badge, { tone }, limit > 0 ? `${Math.round(pct)}%` : "sem limite")));
  })));
}
function CardsView({ cards, purchases, onToggleInstallment, openModal }) {
  const [selectedCard, setSelectedCard] = useState(null);
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("div", { className: "filter-row" }, /* @__PURE__ */ React.createElement("div", { className: "spacer" }), /* @__PURE__ */ React.createElement("button", { className: "btn-secondary sm", onClick: () => openModal("addCard") }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), "Novo cart\xE3o"), /* @__PURE__ */ React.createElement("button", { className: "btn-primary sm", onClick: () => openModal("addPurchase") }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), "Compra")), /* @__PURE__ */ React.createElement("div", { className: "cards-row" }, cards.map((c) => {
    const cardPurchases = purchases.filter((p) => p.cardId === c.id);
    const pending = cardPurchases.flatMap((p) => p.installments).filter((i) => i.status === "pendente");
    const used = pending.reduce((s, i) => s + i.value, 0);
    const pct = Math.min(100, used / c.limit * 100);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: c.id,
        className: `credit-card ${selectedCard === c.id ? "credit-card-active" : ""}`,
        style: { background: `linear-gradient(135deg, ${c.color}, ${c.color}CC)` },
        onClick: () => setSelectedCard(selectedCard === c.id ? null : c.id)
      },
      /* @__PURE__ */ React.createElement("div", { className: "credit-card-top" }, /* @__PURE__ */ React.createElement("span", null, c.name), /* @__PURE__ */ React.createElement(CreditCard, { size: 20 })),
      /* @__PURE__ */ React.createElement("div", { className: "credit-card-bank" }, c.bank),
      /* @__PURE__ */ React.createElement("div", { className: "credit-card-bottom" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "cc-label" }, "fatura estimada"), /* @__PURE__ */ React.createElement("strong", null, fmt(used))), /* @__PURE__ */ React.createElement("div", { className: "cc-dates" }, /* @__PURE__ */ React.createElement("span", null, "fecha ", c.closing), /* @__PURE__ */ React.createElement("span", null, "vence ", c.due))),
      /* @__PURE__ */ React.createElement("div", { className: "cc-limit-bar" }, /* @__PURE__ */ React.createElement("div", { style: { width: `${pct}%` } }))
    );
  })), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Parcelamentos"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "timeline de compromissos")), purchases.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(CreditCard, { size: 26 }), text: "Nenhuma compra parcelada registrada." }) : /* @__PURE__ */ React.createElement("div", { className: "installment-list" }, purchases.filter((p) => !selectedCard || p.cardId === selectedCard).map((p) => {
    const paidCount = p.installments.filter((i) => i.status === "pago").length;
    const next = p.installments.find((i) => i.status === "pendente");
    const remaining = p.installments.filter((i) => i.status === "pendente").reduce((s, i) => s + i.value, 0);
    const card = cards.find((c) => c.id === p.cardId);
    return /* @__PURE__ */ React.createElement("div", { key: p.id, className: "installment-block" }, /* @__PURE__ */ React.createElement("div", { className: "installment-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, p.desc), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, " \xB7 ", card == null ? void 0 : card.name, " \xB7 ", fmt(p.total)), /* @__PURE__ */ React.createElement("span", { className: "installment-bank-tag" }, card == null ? void 0 : card.bank)), /* @__PURE__ */ React.createElement("div", { className: "installment-head-actions" }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "Editar", onClick: () => openModal({ kind: "editPurchase", purchase: p }) }, /* @__PURE__ */ React.createElement(Edit3, { size: 13 })), /* @__PURE__ */ React.createElement(Badge, { tone: "neutral" }, paidCount, "/", p.count, " pagas"))), /* @__PURE__ */ React.createElement(ProgressBar, { value: paidCount, max: p.count, colorVar: "var(--accent-purple)" }), /* @__PURE__ */ React.createElement("div", { className: "installment-chips" }, p.installments.map((i) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: i.n,
        className: `inst-chip ${i.status}`,
        onClick: () => onToggleInstallment(p.id, i.n),
        title: `${MONTHS[i.dueM]} ${i.dueY} \xB7 ${fmt(i.value)}`
      },
      i.n
    ))), /* @__PURE__ */ React.createElement("div", { className: "installment-footer" }, /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, next ? `Pr\xF3xima parcela: ${MONTHS[next.dueM]}/${next.dueY} \xB7 ${fmt(next.value)}` : "Todas as parcelas pagas"), /* @__PURE__ */ React.createElement("div", { className: "installment-footer-right" }, next && /* @__PURE__ */ React.createElement("button", { className: "chip static add-interest-btn", onClick: () => openModal({ kind: "addInterestPurchase", purchaseId: p.id, n: next.n, purchaseName: p.desc, installmentValue: next.value }) }, "Registrar juros"), /* @__PURE__ */ React.createElement("span", { className: "installment-remaining" }, "Restante: ", /* @__PURE__ */ React.createElement("strong", null, fmt(remaining))))));
  }))));
}
function SavingsInvestView({ savings, investments, onEditSaving, onDeleteSaving, onEditInvestment, onDeleteInvestment, openModal }) {
  const totalS = savings.reduce((s, x) => s + x.value, 0);
  const totalI = investments.reduce((s, x) => s + x.value, 0);
  const renderRow = (item, onEdit, onDelete) => /* @__PURE__ */ React.createElement("div", { key: item.id, className: "sav-inv-row" }, /* @__PURE__ */ React.createElement("div", { className: "sav-inv-info" }, /* @__PURE__ */ React.createElement("strong", null, item.desc), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, item.bank || "\u2014", item.yieldRate ? ` \xB7 ${item.yieldRate}% a.m.` : "", " \xB7 ", new Date(item.date + "T00:00:00").toLocaleDateString("pt-BR"), item.viaEntry ? " \xB7 via Lan\xE7amentos" : item.discount === false ? " \xB7 n\xE3o descontado do saldo" : "")), /* @__PURE__ */ React.createElement("div", { className: "sav-inv-actions" }, /* @__PURE__ */ React.createElement("strong", null, fmt(item.value)), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "Editar", onClick: () => onEdit(item) }, /* @__PURE__ */ React.createElement(Edit3, { size: 13 })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn danger", title: "Excluir", onClick: () => onDelete(item.id) }, /* @__PURE__ */ React.createElement(Trash2, { size: 13 }))));
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Guardado"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, fmt(totalS), " no total")), /* @__PURE__ */ React.createElement("button", { className: "btn-secondary sm", style: { marginBottom: 14 }, onClick: () => openModal("addSaving") }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), "Novo guardado"), savings.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(PiggyBank, { size: 24 }), text: "Nenhum valor guardado ainda." }) : /* @__PURE__ */ React.createElement("div", { className: "sav-inv-list" }, savings.map((s) => renderRow(s, (it) => openModal({ kind: "editSaving", item: it }), onDeleteSaving)))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Investido"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, fmt(totalI), " no total")), /* @__PURE__ */ React.createElement("button", { className: "btn-secondary sm", style: { marginBottom: 14 }, onClick: () => openModal("addInvestment") }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), "Novo investimento"), investments.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(TrendingUp, { size: 24 }), text: "Nenhum investimento registrado ainda." }) : /* @__PURE__ */ React.createElement("div", { className: "sav-inv-list" }, investments.map((i) => renderRow(i, (it) => openModal({ kind: "editInvestment", item: it }), onDeleteInvestment)))));
}
function DebtsView({ debtsSummary, onToggleInstallment, onDelete, openModal, debtTypes }) {
  const totalRemaining = debtsSummary.reduce((s, d) => s + d.remaining, 0);
  const totalOriginal = debtsSummary.reduce((s, d) => s + d.total, 0);
  const totalOverdue = debtsSummary.reduce((s, d) => s + d.overdueTotal, 0);
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("p", { className: "section-intro" }, "Acompanhe empr\xE9stimos, financiamentos e outras d\xEDvidas em um s\xF3 lugar, separado das compras no cart\xE3o. Parcelas vencidas e n\xE3o pagas ficam marcadas automaticamente como ", /* @__PURE__ */ React.createElement("strong", null, "em atraso"), "."), /* @__PURE__ */ React.createElement("div", { className: "filter-row" }, /* @__PURE__ */ React.createElement("div", { className: "spacer" }), /* @__PURE__ */ React.createElement("button", { className: "btn-primary sm", onClick: () => openModal("addDebt") }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), "Nova d\xEDvida")), debtsSummary.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(Landmark, { size: 26 }), text: "Nenhuma d\xEDvida cadastrada. Adicione empr\xE9stimos ou financiamentos para acompanhar aqui." })) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "summary-grid" }, /* @__PURE__ */ React.createElement(SummaryCard, { icon: /* @__PURE__ */ React.createElement(Landmark, { size: 17 }), label: "Total em d\xEDvidas", value: fmt(totalOriginal), tone: "dark" }), /* @__PURE__ */ React.createElement(SummaryCard, { icon: /* @__PURE__ */ React.createElement(Clock, { size: 17 }), label: "Saldo pendente", value: fmt(totalRemaining), tone: "orange" }), /* @__PURE__ */ React.createElement(SummaryCard, { icon: /* @__PURE__ */ React.createElement(AlertCircle, { size: 17 }), label: "Em atraso", value: fmt(totalOverdue), tone: "pink" }), /* @__PURE__ */ React.createElement(SummaryCard, { icon: /* @__PURE__ */ React.createElement(Check, { size: 17 }), label: "J\xE1 quitado", value: fmt(totalOriginal - totalRemaining), tone: "green" })), /* @__PURE__ */ React.createElement("div", { className: "debt-grid" }, debtsSummary.map((d) => /* @__PURE__ */ React.createElement("div", { key: d.id, className: `debt-card ${d.overdueCount > 0 ? "debt-card-overdue" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "debt-card-top" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, d.name), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, " \xB7 ", d.type)), /* @__PURE__ */ React.createElement("div", { className: "debt-card-actions" }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "Editar", onClick: () => openModal({ kind: "editDebt", debt: d }) }, /* @__PURE__ */ React.createElement(Edit3, { size: 13 })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn danger", onClick: () => onDelete(d.id) }, /* @__PURE__ */ React.createElement(Trash2, { size: 14 })))), /* @__PURE__ */ React.createElement("div", { className: "debt-card-meta" }, /* @__PURE__ */ React.createElement(Badge, { tone: "neutral" }, d.lender), d.interestRate > 0 && /* @__PURE__ */ React.createElement(Badge, { tone: "orange" }, d.interestRate, "% a.m."), /* @__PURE__ */ React.createElement(Badge, { tone: d.remaining > 0 ? "purple" : "green" }, d.paidCount, "/", d.count, " pagas"), d.overdueCount > 0 && /* @__PURE__ */ React.createElement(Badge, { tone: "danger" }, d.overdueCount, " em atraso")), /* @__PURE__ */ React.createElement(ProgressBar, { value: d.paidCount, max: d.count, colorVar: d.overdueCount > 0 ? "#D65C6E" : d.color, height: 10 }), /* @__PURE__ */ React.createElement("div", { className: "debt-card-numbers" }, /* @__PURE__ */ React.createElement("span", null, "Total: ", fmt(d.total)), /* @__PURE__ */ React.createElement("span", null, "Restante: ", /* @__PURE__ */ React.createElement("strong", null, fmt(d.remaining)))), /* @__PURE__ */ React.createElement("div", { className: "installment-chips" }, d.installments.map((i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: i.n,
      className: `inst-chip ${i.overdue ? "atrasada" : i.status}`,
      onClick: () => onToggleInstallment(d.id, i.n),
      title: `${i.dueDate ? (/* @__PURE__ */ new Date(i.dueDate + "T00:00:00")).toLocaleDateString("pt-BR") : `${MONTHS[i.dueM]} ${i.dueY}`} \xB7 ${fmt(i.value)}${i.overdue ? " \xB7 EM ATRASO" : ""}`
    },
    i.n
  ))), d.next ? /* @__PURE__ */ React.createElement("div", { className: "installment-footer" }, /* @__PURE__ */ React.createElement("span", { className: `muted-sm ${d.next.overdue ? "overdue-text" : ""}` }, d.next.overdue ? "Em atraso desde " : "Pr\xF3xima parcela: ", d.next.dueDate ? (/* @__PURE__ */ new Date(d.next.dueDate + "T00:00:00")).toLocaleDateString("pt-BR") : `${MONTHS[d.next.dueM]}/${d.next.dueY}`, " \xB7 ", fmt(d.next.value)), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "chip static add-interest-btn",
      onClick: () => openModal({ kind: "addInterest", debtId: d.id, n: d.next.n, debtName: d.name, installmentValue: d.next.value })
    },
    "+ juros"
  )) : /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "D\xEDvida totalmente quitada \u{1F389}"))))));
}
function WishlistView({ wishlist, onDelete, setModal }) {
  const pending = wishlist.filter((w) => !w.bought);
  const bought = wishlist.filter((w) => w.bought);
  const nowD = /* @__PURE__ */ new Date();
  const monthPrefix = `${nowD.getFullYear()}-${pad2(nowD.getMonth() + 1)}`;
  const conquistasMes = bought.filter((w) => w.boughtDate && w.boughtDate.startsWith(monthPrefix));
  const totalConquistas = conquistasMes.reduce((s, w) => s + w.value, 0);
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, conquistasMes.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "card conquest-card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "\u{1F3C6} Conquistas deste m\xEAs"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, conquistasMes.length, " item", conquistasMes.length > 1 ? "s" : "", " \xB7 ", fmt(totalConquistas))), /* @__PURE__ */ React.createElement("div", { className: "conquest-list" }, conquistasMes.map((w) => /* @__PURE__ */ React.createElement("div", { key: w.id, className: "conquest-item" }, /* @__PURE__ */ React.createElement(Check, { size: 14 }), /* @__PURE__ */ React.createElement("span", null, w.name), /* @__PURE__ */ React.createElement("strong", null, fmt(w.value))))), /* @__PURE__ */ React.createElement("p", { className: "muted-sm", style: { marginTop: 10 } }, "Parab\xE9ns! Voc\xEA realizou ", conquistasMes.length === 1 ? "um desejo" : `${conquistasMes.length} desejos`, " neste m\xEAs.")), /* @__PURE__ */ React.createElement("div", { className: "filter-row" }, /* @__PURE__ */ React.createElement("p", { className: "section-intro", style: { margin: 0 } }, "Itens aqui n\xE3o afetam seu saldo at\xE9 voc\xEA marcar como comprado."), /* @__PURE__ */ React.createElement("div", { className: "spacer" }), /* @__PURE__ */ React.createElement("button", { className: "btn-primary sm", onClick: () => setModal("addWish") }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), "Desejo")), /* @__PURE__ */ React.createElement("div", { className: "wish-grid" }, pending.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(Heart, { size: 26 }), text: "Sua lista de desejos est\xE1 vazia." }) : pending.map((w) => /* @__PURE__ */ React.createElement("div", { key: w.id, className: "wish-card" }, /* @__PURE__ */ React.createElement("div", { className: "wish-top" }, /* @__PURE__ */ React.createElement(Gift, { size: 18 }), /* @__PURE__ */ React.createElement(Badge, { tone: w.priority === "alta" ? "pink" : w.priority === "m\xE9dia" ? "orange" : "neutral" }, w.priority)), /* @__PURE__ */ React.createElement("strong", { className: "wish-name" }, w.name), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, w.category), /* @__PURE__ */ React.createElement("div", { className: "wish-value" }, fmt(w.value)), /* @__PURE__ */ React.createElement("div", { className: "wish-actions" }, /* @__PURE__ */ React.createElement("button", { className: "btn-primary sm", onClick: () => setModal({ kind: "buyWish", wish: w }) }, "Comprei"), /* @__PURE__ */ React.createElement("button", { className: "icon-btn danger", onClick: () => onDelete(w.id) }, /* @__PURE__ */ React.createElement(Trash2, { size: 14 })))))), bought.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "J\xE1 comprados")), /* @__PURE__ */ React.createElement("ul", { className: "movement-list" }, bought.map((w) => /* @__PURE__ */ React.createElement("li", { key: w.id }, /* @__PURE__ */ React.createElement("div", { className: "mv-icon saida" }, /* @__PURE__ */ React.createElement(Check, { size: 14 })), /* @__PURE__ */ React.createElement("div", { className: "mv-info" }, /* @__PURE__ */ React.createElement("span", { className: "mv-desc" }, w.name), /* @__PURE__ */ React.createElement("span", { className: "mv-cat" }, w.category)), /* @__PURE__ */ React.createElement("span", { className: "mv-value saida" }, fmt(w.value)))))));
}
function GoalsView({ goals, onAdd, openModal }) {
  const [addingTo, setAddingTo] = useState(null);
  const [amount, setAmount] = useState("");
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("div", { className: "filter-row" }, /* @__PURE__ */ React.createElement("div", { className: "spacer" }), /* @__PURE__ */ React.createElement("button", { className: "btn-primary sm", onClick: () => openModal("addGoal") }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), "Nova meta")), /* @__PURE__ */ React.createElement("div", { className: "goal-grid" }, goals.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(Target, { size: 26 }), text: "Crie sua primeira meta financeira." }) : goals.map((g) => {
    const pct = Math.min(100, g.current / g.target * 100);
    const monthsLeft = Math.max(1, Math.round((new Date(g.deadline) - /* @__PURE__ */ new Date()) / (1e3 * 60 * 60 * 24 * 30)));
    const monthly = Math.max(0, (g.target - g.current) / monthsLeft);
    return /* @__PURE__ */ React.createElement("div", { key: g.id, className: "goal-card" }, /* @__PURE__ */ React.createElement("div", { className: "goal-card-head" }, /* @__PURE__ */ React.createElement("strong", null, g.name), /* @__PURE__ */ React.createElement(Badge, { tone: "purple" }, Math.round(pct), "%")), /* @__PURE__ */ React.createElement(ProgressBar, { value: g.current, max: g.target, colorVar: "linear-gradient(90deg,var(--accent-purple),var(--accent-pink))", height: 10 }), /* @__PURE__ */ React.createElement("div", { className: "goal-numbers" }, /* @__PURE__ */ React.createElement("span", null, fmt(g.current), " de ", fmt(g.target)), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "at\xE9 ", new Date(g.deadline).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }))), /* @__PURE__ */ React.createElement("div", { className: "goal-suggestion" }, "Guarde ", /* @__PURE__ */ React.createElement("strong", null, fmt(monthly)), "/m\xEAs para atingir no prazo."), addingTo === g.id ? /* @__PURE__ */ React.createElement("div", { className: "budget-edit" }, /* @__PURE__ */ React.createElement("input", { autoFocus: true, type: "number", placeholder: "Valor", value: amount, onChange: (e) => setAmount(e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", onClick: () => {
      onAdd(g.id, Number(amount) || 0);
      setAmount("");
      setAddingTo(null);
    } }, /* @__PURE__ */ React.createElement(Check, { size: 14 }))) : /* @__PURE__ */ React.createElement("button", { className: "btn-secondary sm", onClick: () => setAddingTo(g.id) }, /* @__PURE__ */ React.createElement(Plus, { size: 13 }), "Adicionar valor"));
  })));
}
function HistoryView({ entries, purchases, debts, savings, investments, expenseCategories, incomeCategories, categoryColors }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [catFilter, setCatFilter] = useState("todas");
  const all = [
    ...entries.map((e) => ({ date: e.date, desc: e.desc, category: e.category, value: e.value, type: e.type, status: e.status })),
    ...purchases.flatMap((p) => p.installments.map((i) => ({ date: `${i.dueY}-${String(i.dueM + 1).padStart(2, "0")}-01`, desc: `${p.desc} (parcela ${i.n}/${p.count})`, category: p.category, value: i.value, type: "saida", status: i.status }))),
    ...debts.flatMap((d) => d.installments.map((i) => ({ date: i.dueDate || `${i.dueY}-${String(i.dueM + 1).padStart(2, "0")}-01`, desc: `${d.name} (parcela ${i.n}/${d.count})`, category: "D\xEDvidas", value: i.value, type: "saida", status: i.status }))),
    ...savings.map((s) => ({ date: s.date, desc: `Guardado: ${s.desc}`, category: "Dinheiro guardado", value: s.value, type: "guardado", status: "pago" })),
    ...investments.map((i) => ({ date: i.date, desc: `Investido: ${i.desc}`, category: "Dinheiro investido", value: i.value, type: "investimento", status: "pago" }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  const filtered = all.filter((h) => {
    if (dateFrom && h.date < dateFrom) return false;
    if (dateTo && h.date > dateTo) return false;
    if (statusFilter !== "todos" && h.status !== statusFilter) return false;
    if (catFilter !== "todas" && h.category !== catFilter) return false;
    return true;
  });
  const hasDateFilter = dateFrom || dateTo || statusFilter !== "todos" || catFilter !== "todas";
  const allCategoryOptions = Array.from(new Set(all.map((h) => h.category))).sort();
  const totalPago = filtered.filter((h) => h.type === "saida" && h.status === "pago").reduce((s, h) => s + h.value, 0);
  const totalPendente = filtered.filter((h) => h.type === "saida" && h.status !== "pago").reduce((s, h) => s + h.value, 0);
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("div", { className: "filter-row" }, /* @__PURE__ */ React.createElement(Field, { label: "De" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "At\xE9" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value) })), /* @__PURE__ */ React.createElement(Field, { label: "Situa\xE7\xE3o" }, /* @__PURE__ */ React.createElement("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "todos" }, "Todas"), /* @__PURE__ */ React.createElement("option", { value: "pago" }, "Pago"), /* @__PURE__ */ React.createElement("option", { value: "pendente" }, "Pendente"))), /* @__PURE__ */ React.createElement(Field, { label: "Categoria" }, /* @__PURE__ */ React.createElement("select", { value: catFilter, onChange: (e) => setCatFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "todas" }, "Todas"), allCategoryOptions.map((c) => /* @__PURE__ */ React.createElement("option", { key: c, value: c }, c)))), /* @__PURE__ */ React.createElement("div", { className: "spacer" }), hasDateFilter && /* @__PURE__ */ React.createElement("button", { className: "chip static clear-filters", onClick: () => {
    setDateFrom("");
    setDateTo("");
    setStatusFilter("todos");
    setCatFilter("todas");
  } }, "Limpar filtros")), /* @__PURE__ */ React.createElement("div", { className: "card hist-summary" }, /* @__PURE__ */ React.createElement("div", { className: "hist-summary-item" }, /* @__PURE__ */ React.createElement("span", null, "Sa\xEDdas j\xE1 pagas"), /* @__PURE__ */ React.createElement("strong", { className: "value-negative" }, fmt(totalPago))), /* @__PURE__ */ React.createElement("div", { className: "hist-summary-item" }, /* @__PURE__ */ React.createElement("span", null, "Sa\xEDdas ainda pendentes"), /* @__PURE__ */ React.createElement("strong", { className: "value-warning" }, fmt(totalPendente))), /* @__PURE__ */ React.createElement("div", { className: "hist-summary-item" }, /* @__PURE__ */ React.createElement("span", null, "Total no filtro"), /* @__PURE__ */ React.createElement("strong", null, fmt(totalPago + totalPendente)))), /* @__PURE__ */ React.createElement("div", { className: "card" }, filtered.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(Clock, { size: 26 }), text: hasDateFilter ? "Nenhum registro no per\xEDodo selecionado." : "Nenhum hist\xF3rico dispon\xEDvel." }) : /* @__PURE__ */ React.createElement("div", { className: "table-scroll" }, /* @__PURE__ */ React.createElement("table", { className: "data-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Data"), /* @__PURE__ */ React.createElement("th", null, "Descri\xE7\xE3o"), /* @__PURE__ */ React.createElement("th", null, "Categoria"), /* @__PURE__ */ React.createElement("th", null, "Tipo"), /* @__PURE__ */ React.createElement("th", null, "Status"), /* @__PURE__ */ React.createElement("th", null, "Valor"))), /* @__PURE__ */ React.createElement("tbody", null, filtered.map((h, i) => /* @__PURE__ */ React.createElement("tr", { key: i }, /* @__PURE__ */ React.createElement("td", null, new Date(h.date).toLocaleDateString("pt-BR")), /* @__PURE__ */ React.createElement("td", null, h.desc), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { className: "hist-cat-cell" }, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: catColor(h.category, h.type === "entrada" ? incomeCategories : expenseCategories, categoryColors) } }), /* @__PURE__ */ React.createElement(Badge, { tone: "neutral" }, h.category))), /* @__PURE__ */ React.createElement("td", { className: "capitalize" }, h.type), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(Badge, { tone: h.status === "pago" ? "green" : "orange" }, h.status)), /* @__PURE__ */ React.createElement("td", { className: h.type === "entrada" ? "value-pos" : "value-neg" }, h.type === "entrada" ? "+" : "-", fmt(h.value)))))))));
}
function AnalyticsView({ entries, bars, selY, selM, incomeCategories, categoryColors }) {
  const saldoMensal = bars.map((b) => ({ label: b.label, value: b.entrada - b.saida }));
  const fixedVarHistory = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selY, selM - i, 1);
      const y = d.getFullYear(), m = d.getMonth();
      const monthSaidas = entries.filter((e) => e.type === "saida" && dateInMonth(e.date, y, m));
      const fixedTotal = monthSaidas.filter((e) => e.fixed).reduce((s, e) => s + e.value, 0);
      const variableTotal = monthSaidas.filter((e) => !e.fixed).reduce((s, e) => s + e.value, 0);
      arr.push({ label: MONTHS[m].slice(0, 3), entrada: fixedTotal, saida: variableTotal });
    }
    return arr;
  }, [entries, selY, selM]);
  const incomeByCategory = useMemo(() => {
    const map = {};
    entries.filter((e) => e.type === "entrada" && dateInMonth(e.date, selY, selM)).forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.value;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value, color: catColor(label, incomeCategories, categoryColors) })).sort((a, b) => b.value - a.value);
  }, [entries, selY, selM, incomeCategories, categoryColors]);
  const top5Saidas = useMemo(() => {
    return entries.filter((e) => e.type === "saida" && dateInMonth(e.date, selY, selM)).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [entries, selY, selM]);
  const maxTop5 = Math.max(1, ...top5Saidas.map((e) => e.value));
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("div", { className: "analytics-grid" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Saldo mensal"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "\xFAltimos 6 meses")), /* @__PURE__ */ React.createElement(SignedBarChartSVG, { data: saldoMensal }), /* @__PURE__ */ React.createElement("p", { className: "muted-sm" }, "Barras verdes = meses positivos. Barras vermelhas = meses negativos.")), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Entradas por categoria"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "m\xEAs selecionado")), incomeByCategory.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(ArrowUpRight, { size: 26 }), text: "Sem entradas neste m\xEAs." }) : /* @__PURE__ */ React.createElement("div", { className: "donut-row" }, /* @__PURE__ */ React.createElement(DonutChartSVG, { data: incomeByCategory.slice(0, 6) }), /* @__PURE__ */ React.createElement("div", { className: "donut-legend" }, incomeByCategory.slice(0, 6).map((c) => /* @__PURE__ */ React.createElement("div", { key: c.label, className: "donut-legend-item" }, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: c.color } }), /* @__PURE__ */ React.createElement("span", null, c.label), /* @__PURE__ */ React.createElement("strong", null, fmt(c.value))))))), /* @__PURE__ */ React.createElement("div", { className: "analytics-grid" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Fixo x Vari\xE1vel"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "\xFAltimos 6 meses")), /* @__PURE__ */ React.createElement(BarChartSVG, { data: fixedVarHistory }), /* @__PURE__ */ React.createElement("div", { className: "legend-row" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: "var(--accent-purple)" } }), "Fixo"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: "var(--accent-pink)" } }), "Vari\xE1vel"))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "5 maiores sa\xEDdas"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "m\xEAs selecionado")), top5Saidas.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(ArrowDownRight, { size: 26 }), text: "Sem sa\xEDdas neste m\xEAs." }) : /* @__PURE__ */ React.createElement("div", { className: "top5-list" }, top5Saidas.map((e) => /* @__PURE__ */ React.createElement("div", { key: e.id, className: "top5-row" }, /* @__PURE__ */ React.createElement("div", { className: "top5-info" }, /* @__PURE__ */ React.createElement("span", { className: "top5-desc" }, e.desc), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, e.category)), /* @__PURE__ */ React.createElement("div", { className: "top5-bar-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "top5-bar", style: { width: `${e.value / maxTop5 * 100}%` } })), /* @__PURE__ */ React.createElement("strong", null, fmt(e.value)))))))));
}
function TipsView({ totals, categorySpendMonth, budgets }) {
  const tips = [];
  const topCat = categorySpendMonth[0];
  if (topCat) tips.push(`Sua maior categoria de gastos este m\xEAs \xE9 ${topCat.label}, somando ${fmt(topCat.value)}. Vale revisar se h\xE1 espa\xE7o para cortar.`);
  if (totals.saldoMes < 0) tips.push("Seu saldo deste m\xEAs est\xE1 negativo. Priorize quitar pend\xEAncias antes de assumir novos compromissos.");
  if (totals.committedTotal > totals.monthIn) tips.push("Seus compromissos futuros somados j\xE1 superam sua renda mensal atual \u2014 considere renegociar parcelas.");
  categorySpendMonth.forEach((c) => {
    const limit = budgets[c.label];
    if (limit && c.value > limit) tips.push(`Voc\xEA ultrapassou o or\xE7amento de ${c.label} em ${fmt(c.value - limit)}.`);
  });
  if (tips.length === 0) tips.push("Suas finan\xE7as est\xE3o equilibradas este m\xEAs. Continue registrando tudo para manter esse controle!");
  tips.push("Reserve um percentual fixo da sua renda todo m\xEAs para investimentos, mesmo que pequeno.");
  const generalTips = [
    "Defina um or\xE7amento mensal por categoria na aba Or\xE7amento para acompanhar o comprometimento de perto.",
    "Use o Planejamento mensal para comparar o que voc\xEA previu receber com o que j\xE1 recebeu de verdade.",
    'O indicador "Comprometido" na tela inicial mostra quanto do seu or\xE7amento j\xE1 est\xE1 reservado para saldas deste m\xEAs.',
    'O "Saldo projetado" ajuda a entender como o m\xEAs deve terminar, considerando entradas previstas e compromissos futuros.',
    "Adicione itens na Lista de Desejos antes de comprar \u2014 eles s\xF3 afetam seu saldo quando voc\xEA marcar como comprado.",
    "Acompanhe seus parcelamentos na aba Cart\xF5es de Cr\xE9dito para nunca perder o controle das parcelas futuras.",
    "Use os Cart\xF5es de Cr\xE9dito para registrar compras parceladas e ver o quanto ainda falta pagar de cada uma.",
    "No Calend\xE1rio, clique em qualquer dia para ver um resumo r\xE1pido das suas movimenta\xE7\xF5es daquele dia.",
    'O card "Meu limite seguro" mostra quanto voc\xEA ainda pode gastar com tranquilidade: ele pega o saldo do m\xEAs, desconta os compromissos futuros j\xE1 cadastrados (parcelas de cart\xE3o e d\xEDvidas) e tamb\xE9m o valor que voc\xEA precisa guardar por m\xEAs para atingir suas metas. O que sobra \xE9 o seu limite seguro \u2014 uma estimativa, n\xE3o uma regra.'
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Dicas para voc\xEA")), /* @__PURE__ */ React.createElement("ul", { className: "tips-list" }, tips.map((t, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement(Lightbulb, { size: 16 }), /* @__PURE__ */ React.createElement("span", null, t))))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Dicas do Dashboard"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "como aproveitar melhor o Plamily")), /* @__PURE__ */ React.createElement("ul", { className: "tips-list" }, generalTips.map((t, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement(Lightbulb, { size: 16 }), /* @__PURE__ */ React.createElement("span", null, t))))));
}
function CategoriesAndCardsView({ cards, expenseCategories, incomeCategories, categoryColors, paymentMethods, debtTypes, onAddCategory, onDeleteCategory, onRenameCategory, onSetCategoryColor, onEditCard, onDeleteCard, openModal }) {
  const [editingCat, setEditingCat] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [newExpense, setNewExpense] = useState("");
  const [newIncome, setNewIncome] = useState("");
  const [newPayment, setNewPayment] = useState("");
  const [newDebtType, setNewDebtType] = useState("");
  const renderSimpleChip = (kind, c) => {
    const isEditing = editingCat && editingCat.kind === kind && editingCat.name === c;
    return /* @__PURE__ */ React.createElement("span", { key: c, className: "chip static removable" }, isEditing ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("input", { className: "cat-rename-input", value: draftName, autoFocus: true, onChange: (e) => setDraftName(e.target.value), onKeyDown: (e) => {
      if (e.key === "Enter") confirmRename(kind, c);
      if (e.key === "Escape") setEditingCat(null);
    } }), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "Salvar", onClick: () => confirmRename(kind, c) }, /* @__PURE__ */ React.createElement(Check, { size: 12 }))) : /* @__PURE__ */ React.createElement(React.Fragment, null, c, /* @__PURE__ */ React.createElement("button", { className: "chip-edit", title: "Renomear", onClick: () => {
      setEditingCat({ kind, name: c });
      setDraftName(c);
    } }, /* @__PURE__ */ React.createElement(Edit3, { size: 11 })), /* @__PURE__ */ React.createElement("button", { className: "chip-remove", onClick: () => onDeleteCategory(kind, c), title: "Remover" }, /* @__PURE__ */ React.createElement(X, { size: 11 }))));
  };
  const confirmRename = (kind, oldName) => {
    onRenameCategory(kind, oldName, draftName);
    setEditingCat(null);
  };
  const renderCategoryChip = (kind, list, c) => {
    const isEditing = editingCat && editingCat.kind === kind && editingCat.name === c;
    return /* @__PURE__ */ React.createElement("span", { key: c, className: "chip static removable cat-chip-lg" }, /* @__PURE__ */ React.createElement("label", { className: "cat-color-label lg", title: "Escolher cor" }, /* @__PURE__ */ React.createElement("input", { type: "color", value: catColor(c, list, categoryColors), onChange: (e) => onSetCategoryColor(c, e.target.value), className: "cat-color-input" }), /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: catColor(c, list, categoryColors) } })), isEditing ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("input", { className: "cat-rename-input", value: draftName, autoFocus: true, onChange: (e) => setDraftName(e.target.value), onKeyDown: (e) => {
      if (e.key === "Enter") confirmRename(kind, c);
      if (e.key === "Escape") setEditingCat(null);
    } }), /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "Salvar", onClick: () => confirmRename(kind, c) }, /* @__PURE__ */ React.createElement(Check, { size: 12 }))) : /* @__PURE__ */ React.createElement(React.Fragment, null, c, /* @__PURE__ */ React.createElement("button", { className: "chip-edit", title: "Renomear categoria", onClick: () => {
      setEditingCat({ kind, name: c });
      setDraftName(c);
    } }, /* @__PURE__ */ React.createElement(Edit3, { size: 11 })), /* @__PURE__ */ React.createElement("button", { className: "chip-remove", onClick: () => onDeleteCategory(kind, c), title: "Remover categoria" }, /* @__PURE__ */ React.createElement(X, { size: 11 }))));
  };
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("p", { className: "section-intro" }, "Toque na bolinha colorida para escolher a cor da categoria, ou no l\xE1pis para renomear \u2014 seu hist\xF3rico de lan\xE7amentos \xE9 mantido normalmente."), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Categorias de sa\xEDda"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "usadas em sa\xEDdas, or\xE7amento e cart\xF5es")), /* @__PURE__ */ React.createElement("div", { className: "chip-wrap" }, expenseCategories.map((c) => renderCategoryChip("expense", expenseCategories, c))), /* @__PURE__ */ React.createElement("div", { className: "cat-add-row" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Nova categoria de sa\xEDda", value: newExpense, onChange: (e) => setNewExpense(e.target.value), onKeyDown: (e) => {
    if (e.key === "Enter") {
      onAddCategory("expense", newExpense);
      setNewExpense("");
    }
  } }), /* @__PURE__ */ React.createElement("button", { className: "btn-primary sm", onClick: () => {
    onAddCategory("expense", newExpense);
    setNewExpense("");
  } }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), "Adicionar"))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Categorias de entrada"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "usadas em entradas")), /* @__PURE__ */ React.createElement("div", { className: "chip-wrap" }, incomeCategories.map((c) => renderCategoryChip("income", incomeCategories, c))), /* @__PURE__ */ React.createElement("div", { className: "cat-add-row" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Nova categoria de entrada", value: newIncome, onChange: (e) => setNewIncome(e.target.value), onKeyDown: (e) => {
    if (e.key === "Enter") {
      onAddCategory("income", newIncome);
      setNewIncome("");
    }
  } }), /* @__PURE__ */ React.createElement("button", { className: "btn-primary sm", onClick: () => {
    onAddCategory("income", newIncome);
    setNewIncome("");
  } }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), "Adicionar"))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Formas de pagamento"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "usadas em lan\xE7amentos e compra da lista de desejos")), /* @__PURE__ */ React.createElement("div", { className: "chip-wrap" }, paymentMethods.map((m) => renderSimpleChip("payment", m))), /* @__PURE__ */ React.createElement("div", { className: "cat-add-row" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Nova forma de pagamento", value: newPayment, onChange: (e) => setNewPayment(e.target.value), onKeyDown: (e) => {
    if (e.key === "Enter") {
      onAddCategory("payment", newPayment);
      setNewPayment("");
    }
  } }), /* @__PURE__ */ React.createElement("button", { className: "btn-primary sm", onClick: () => {
    onAddCategory("payment", newPayment);
    setNewPayment("");
  } }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), "Adicionar"))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Tipos de d\xEDvida"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "usados ao cadastrar uma nova d\xEDvida")), /* @__PURE__ */ React.createElement("div", { className: "chip-wrap" }, debtTypes.map((t) => renderSimpleChip("debtType", t))), /* @__PURE__ */ React.createElement("div", { className: "cat-add-row" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Novo tipo de d\xEDvida", value: newDebtType, onChange: (e) => setNewDebtType(e.target.value), onKeyDown: (e) => {
    if (e.key === "Enter") {
      onAddCategory("debtType", newDebtType);
      setNewDebtType("");
    }
  } }), /* @__PURE__ */ React.createElement("button", { className: "btn-primary sm", onClick: () => {
    onAddCategory("debtType", newDebtType);
    setNewDebtType("");
  } }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), "Adicionar"))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Cart\xF5es cadastrados"), /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "toque no l\xE1pis para editar ou trocar a cor")), cards.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: /* @__PURE__ */ React.createElement(CreditCard, { size: 24 }), text: "Nenhum cart\xE3o cadastrado ainda." }) : /* @__PURE__ */ React.createElement("ul", { className: "settings-list" }, cards.map((c) => /* @__PURE__ */ React.createElement("li", { key: c.id, className: "settings-list-item" }, /* @__PURE__ */ React.createElement("i", { className: "dot", style: { background: c.color } }), /* @__PURE__ */ React.createElement("span", { className: "settings-list-text" }, c.name, " \u2014 ", c.bank), /* @__PURE__ */ React.createElement("div", { className: "settings-list-actions" }, /* @__PURE__ */ React.createElement("button", { className: "icon-btn", title: "Editar", onClick: () => openModal({ kind: "editCard", card: c }) }, /* @__PURE__ */ React.createElement(Edit3, { size: 12 })), /* @__PURE__ */ React.createElement("button", { className: "icon-btn danger", title: "Excluir", onClick: () => onDeleteCard(c.id) }, /* @__PURE__ */ React.createElement(Trash2, { size: 12 })))))), /* @__PURE__ */ React.createElement("button", { className: "btn-secondary sm", style: { marginTop: 12 }, onClick: () => openModal("addCard") }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), "Novo cart\xE3o")));
}
function SettingsView({ onUpdateApp, userName, onUpdateName, profilePhoto, onPhotoUpload, onPhotoRemove }) {
  const { theme, setTheme } = useTheme();
  const [nameInput, setNameInput] = useState(userName || "");
  const [editingName, setEditingName] = useState(false);
  return /* @__PURE__ */ React.createElement("div", { className: "stack-lg" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Perfil")), /* @__PURE__ */ React.createElement("div", { className: "photo-upload-row" }, /* @__PURE__ */ React.createElement("label", { className: "photo-upload-circle" }, profilePhoto ? /* @__PURE__ */ React.createElement("img", { src: profilePhoto, alt: "" }) : /* @__PURE__ */ React.createElement(Camera, { size: 22 }), /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*", style: { display: "none" }, onChange: (e) => { if (e.target.files[0]) onPhotoUpload(e.target.files[0]); e.target.value = ""; } })), /* @__PURE__ */ React.createElement("div", { className: "photo-upload-text" }, /* @__PURE__ */ React.createElement("span", { className: "muted-sm" }, "Toque no círculo para escolher uma foto"), profilePhoto && /* @__PURE__ */ React.createElement("button", { className: "link-btn-danger", onClick: onPhotoRemove }, "Remover foto"))), /* @__PURE__ */ React.createElement(Field, { label: "Seu nome" }, /* @__PURE__ */ React.createElement("div", { className: "name-edit-row" }, /* @__PURE__ */ React.createElement("input", { value: nameInput, onChange: (e) => { setNameInput(e.target.value); setEditingName(true); }, placeholder: "Como devemos te chamar?" }), editingName && /* @__PURE__ */ React.createElement("button", { className: "btn-primary sm", disabled: !nameInput.trim(), onClick: () => { onUpdateName(nameInput); setEditingName(false); } }, "Salvar"))), /* @__PURE__ */ React.createElement("p", { className: "muted-sm" }, "Esse nome aparece na saudação da tela inicial.")), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Sobre os dados")), /* @__PURE__ */ React.createElement("p", { className: "section-intro" }, "Seus dados ficam salvos com seguran\xE7a na sua conta e sincronizados automaticamente \u2014 voc\xEA pode acessar de qualquer aparelho fazendo login com o mesmo e-mail. S\xF3 voc\xEA tem acesso aos seus pr\xF3prios dados.")), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Seguran\xE7a e privacidade")), /* @__PURE__ */ React.createElement("p", { className: "section-intro" }, "Seus dados trafegam sempre por conex\xE3o criptografada (HTTPS) e ficam guardados na infraestrutura do Google (Firebase). Sua senha nunca \xE9 armazenada por n\xF3s \u2014 quem cuida disso \xE9 o pr\xF3prio sistema de login do Google."), /* @__PURE__ */ React.createElement("p", { className: "section-intro" }, "Existem regras de seguran\xE7a no banco de dados que garantem que cada pessoa s\xF3 consegue ler e gravar os pr\xF3prios dados: mesmo que algu\xE9m descubra o endere\xE7o do banco, n\xE3o consegue acessar informa\xE7\xF5es de outra conta. O acesso tamb\xE9m exige e-mail confirmado e libera\xE7\xE3o manual."), /* @__PURE__ */ React.createElement("p", { className: "section-intro" }, "Recomenda\xE7\xF5es: use uma senha forte e exclusiva, n\xE3o compartilhe seu login e evite acessar em computadores p\xFAblicos.")), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Garantia e suporte")), /* @__PURE__ */ React.createElement("p", { className: "section-intro" }, "Voc\xEA tem ", /* @__PURE__ */ React.createElement("strong", null, "garantia de 7 dias"), " a partir da compra, caso queira desistir \u2014 nesse caso, entre em contato pelo suporte (n\xE3o h\xE1 reembolso automático, o pedido \xE9 avaliado diretamente). Ap\xF3s esse prazo, n\xE3o h\xE1 mais garantia nem reembolso."), /* @__PURE__ */ React.createElement("p", { className: "section-intro" }, "D\xFAvidas, problemas ou pedidos de suporte: ", /* @__PURE__ */ React.createElement("a", { href: "mailto:" + SUPPORT_EMAIL, className: "support-link" }, SUPPORT_EMAIL))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Atualiza\xE7\xF5es do app")), /* @__PURE__ */ React.createElement("p", { className: "section-intro" }, "Se alguma novidade n\xE3o aparecer, toque no bot\xE3o abaixo para buscar a vers\xE3o mais recente do Plamily."), /* @__PURE__ */ React.createElement("button", { className: "btn-secondary sm", onClick: onUpdateApp }, /* @__PURE__ */ React.createElement(RefreshCw, { size: 14 }), "Atualizar app")), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("h4", null, "Apar\xEAncia")), /* @__PURE__ */ React.createElement("p", { className: "section-intro" }, "Escolha o visual do Plamily. A mudan\xE7a \xE9 s\xF3 est\xE9tica \u2014 seus dados e c\xE1lculos continuam os mesmos."), /* @__PURE__ */ React.createElement("div", { className: "theme-pick-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: `theme-pick ${theme === "lavanda" ? "sel" : ""}`, onClick: () => setTheme("lavanda") }, /* @__PURE__ */ React.createElement("span", { className: "theme-swatch theme-swatch-lavanda" }), "Lavanda"), /* @__PURE__ */ React.createElement("button", { type: "button", className: `theme-pick ${theme === "grafite" ? "sel" : ""}`, onClick: () => setTheme("grafite") }, /* @__PURE__ */ React.createElement("span", { className: "theme-swatch theme-swatch-grafite" }), "Grafite"), /* @__PURE__ */ React.createElement("button", { type: "button", className: `theme-pick ${theme === "escuro" ? "sel" : ""}`, onClick: () => setTheme("escuro") }, /* @__PURE__ */ React.createElement("span", { className: "theme-swatch theme-swatch-escuro" }), "Escuro"))));
}

function EntryModal({ type, expenseCategories, incomeCategories, paymentMethods, initial, onClose, onSave }) {
  const categories = type === "entrada" ? incomeCategories : expenseCategories;
  const isEditing = !!initial;
  const [desc, setDesc] = useState((initial && initial.desc) || "");
  const [category, setCategory] = useState((initial && initial.category) || categories[0] || "");
  const [value, setValue] = useState((initial && initial.value) || "");
  const [date, setDate] = useState((initial && initial.date) || todayISO());
  const [method, setMethod] = useState((initial && initial.method) || paymentMethods[0] || "");
  const [bank, setBank] = useState((initial && initial.bank) || BANKS[0]);
  const [status, setStatus] = useState((initial && initial.status) || "pago");
  const [fixed, setFixed] = useState((initial && initial.fixed) || false);
  const [recurrence, setRecurrence] = useState("infinite");
  const [destino, setDestino] = useState("nenhum");
  const canSave = desc.trim() && value && Number(value) > 0;
  const handleSave = () => {
    onSave({ type, desc: desc.trim(), category, value: Number(value), date, method, bank, status, fixed, recurrence, destino: type === "saida" && !isEditing ? destino : "nenhum" });
  };
  return /* @__PURE__ */ React.createElement(Modal, { title: isEditing ? "Editar lan\xE7amento" : type === "entrada" ? "Nova entrada" : "Nova sa\xEDda", onClose }, /* @__PURE__ */ React.createElement(Field, { label: "Descri\xE7\xE3o" }, /* @__PURE__ */ React.createElement("input", { value: desc, onChange: (e) => setDesc(e.target.value), placeholder: type === "entrada" ? "Ex: Sal\xE1rio, Freelance..." : "Ex: Supermercado, Uber...", autoFocus: true })), /* @__PURE__ */ React.createElement(Field, { label: "Categoria" }, /* @__PURE__ */ React.createElement("select", { value: category, onChange: (e) => setCategory(e.target.value) }, categories.map((c) => /* @__PURE__ */ React.createElement("option", { key: c }, c)))), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement(Field, { label: "Valor" }, /* @__PURE__ */ React.createElement("input", { type: "number", value: value, onChange: (e) => setValue(e.target.value), placeholder: "0,00" })), /* @__PURE__ */ React.createElement(Field, { label: "Data" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: date, onChange: (e) => setDate(e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement(Field, { label: "Forma de pagamento" }, /* @__PURE__ */ React.createElement("select", { value: method, onChange: (e) => setMethod(e.target.value) }, paymentMethods.map((m) => /* @__PURE__ */ React.createElement("option", { key: m }, m)))), /* @__PURE__ */ React.createElement(Field, { label: "Banco / Conta" }, /* @__PURE__ */ React.createElement("select", { value: bank, onChange: (e) => setBank(e.target.value) }, BANKS.map((b) => /* @__PURE__ */ React.createElement("option", { key: b }, b))))), /* @__PURE__ */ React.createElement(Field, { label: "Status" }, /* @__PURE__ */ React.createElement("div", { className: "seg-toggle" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: `seg-btn ${status === "pago" ? "sel" : ""}`, onClick: () => setStatus("pago") }, "Pago"), /* @__PURE__ */ React.createElement("button", { type: "button", className: `seg-btn ${status === "pendente" ? "sel" : ""}`, onClick: () => setStatus("pendente") }, "Pendente"))), type === "saida" && !isEditing && /* @__PURE__ */ React.createElement(Field, { label: "Destinar para (opcional)" }, /* @__PURE__ */ React.createElement("select", { value: destino, onChange: (e) => setDestino(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "nenhum" }, "Nenhum — só registrar saída"), /* @__PURE__ */ React.createElement("option", { value: "guardado" }, "Guardado"), /* @__PURE__ */ React.createElement("option", { value: "investimento" }, "Investido"))), destino !== "nenhum" && /* @__PURE__ */ React.createElement("p", { className: "muted-sm" }, "Esse valor já será descontado do saldo como saída, e também vai aparecer em Guardados e Investidos."), !isEditing && /* @__PURE__ */ React.createElement("div", { className: "fixed-recurrence-block" }, /* @__PURE__ */ React.createElement("label", { className: "checkbox-row" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: fixed, onChange: (e) => setFixed(e.target.checked) }), /* @__PURE__ */ React.createElement("span", null, "\xC9 um lan\xE7amento fixo (repete todo m\xEAs)")), fixed && /* @__PURE__ */ React.createElement(Field, { label: "Repetir por" }, /* @__PURE__ */ React.createElement("select", { value: recurrence, onChange: (e) => setRecurrence(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "infinite" }, "Sem data de t\xE9rmino"), /* @__PURE__ */ React.createElement("option", { value: "3" }, "3 meses"), /* @__PURE__ */ React.createElement("option", { value: "6" }, "6 meses"), /* @__PURE__ */ React.createElement("option", { value: "12" }, "12 meses")))), isEditing && /* @__PURE__ */ React.createElement("label", { className: "checkbox-row" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: fixed, onChange: (e) => setFixed(e.target.checked) }), /* @__PURE__ */ React.createElement("span", null, "Lan\xE7amento fixo")), /* @__PURE__ */ React.createElement("button", { className: "btn-primary full", disabled: !canSave, onClick: handleSave }, isEditing ? "Salvar altera\xE7\xF5es" : "Adicionar"));
}
function CardModal({ card, onClose, onSave }) {
  const [name, setName] = useState((card == null ? void 0 : card.name) || "");
  const [bank, setBank] = useState((card == null ? void 0 : card.bank) || BANKS[0]);
  const [limit, setLimit] = useState((card == null ? void 0 : card.limit) || "");
  const [color, setColor] = useState((card == null ? void 0 : card.color) || CARD_COLORS[0]);
  const [closing, setClosing] = useState((card == null ? void 0 : card.closing) || 10);
  const [due, setDue] = useState((card == null ? void 0 : card.due) || 17);
  return /* @__PURE__ */ React.createElement(Modal, { title: card ? "Editar cart\xE3o" : "Novo cart\xE3o", onClose }, /* @__PURE__ */ React.createElement(Field, { label: "Nome do cart\xE3o (opcional)" }, /* @__PURE__ */ React.createElement("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Ex: Nubank Roxinho" })), /* @__PURE__ */ React.createElement(Field, { label: "Banco" }, /* @__PURE__ */ React.createElement("select", { value: bank, onChange: (e) => setBank(e.target.value) }, BANKS.map((b) => /* @__PURE__ */ React.createElement("option", { key: b }, b)))), /* @__PURE__ */ React.createElement(Field, { label: "Limite" }, /* @__PURE__ */ React.createElement("input", { type: "number", value: limit, onChange: (e) => setLimit(e.target.value), placeholder: "0,00" })), /* @__PURE__ */ React.createElement(Field, { label: "Cor" }, /* @__PURE__ */ React.createElement("div", { className: "color-pick" }, CARD_COLORS.map((c) => /* @__PURE__ */ React.createElement("button", { key: c, className: `color-dot ${color === c ? "sel" : ""}`, style: { background: c }, onClick: () => setColor(c) })), /* @__PURE__ */ React.createElement("label", { className: "cat-color-label lg", title: "Escolher outra cor", style: { width: 26, height: 26 } }, /* @__PURE__ */ React.createElement("input", { type: "color", value: color, onChange: (e) => setColor(e.target.value), className: "cat-color-input" }), /* @__PURE__ */ React.createElement("span", { className: "color-dot custom-color-dot", style: { background: color } }, /* @__PURE__ */ React.createElement(Plus, { size: 12 }))))), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement(Field, { label: "Fechamento (dia)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 1, max: 31, value: closing, onChange: (e) => setClosing(Number(e.target.value)) })), /* @__PURE__ */ React.createElement(Field, { label: "Vencimento (dia)" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 1, max: 31, value: due, onChange: (e) => setDue(Number(e.target.value)) }))), /* @__PURE__ */ React.createElement("button", { className: "btn-primary full", disabled: !limit, onClick: () => onSave({ name: name.trim() || bank, bank, limit: Number(limit), color, closing, due }) }, card ? "Salvar altera\xE7\xF5es" : "Adicionar cart\xE3o"));
}
function DebtModal({ debtTypes, onClose, onSave }) {
  const [name, setName] = useState("");
  const [type, setType] = useState(debtTypes[0]);
  const [lender, setLender] = useState(BANKS[0]);
  const [total, setTotal] = useState("");
  const [count, setCount] = useState(12);
  const [interestRate, setInterestRate] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [dueDay, setDueDay] = useState(10);
  return /* @__PURE__ */ React.createElement(Modal, { title: "Nova d\xEDvida", onClose }, /* @__PURE__ */ React.createElement(Field, { label: "Nome" }, /* @__PURE__ */ React.createElement("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Ex: Empr\xE9stimo reforma" })), /* @__PURE__ */ React.createElement(Field, { label: "Tipo" }, /* @__PURE__ */ React.createElement("select", { value: type, onChange: (e) => setType(e.target.value) }, debtTypes.map((t) => /* @__PURE__ */ React.createElement("option", { key: t }, t)))), /* @__PURE__ */ React.createElement(Field, { label: "Credor / Institui\xE7\xE3o" }, /* @__PURE__ */ React.createElement("select", { value: lender, onChange: (e) => setLender(e.target.value) }, BANKS.map((b) => /* @__PURE__ */ React.createElement("option", { key: b }, b)))), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement(Field, { label: "Valor total" }, /* @__PURE__ */ React.createElement("input", { type: "number", value: total, onChange: (e) => setTotal(e.target.value), placeholder: "0,00" })), /* @__PURE__ */ React.createElement(Field, { label: "Parcelas" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 1, max: 120, value: count, onChange: (e) => setCount(Number(e.target.value)) }))), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement(Field, { label: "Juros (% a.m., opcional)" }, /* @__PURE__ */ React.createElement("input", { type: "number", step: "0.1", value: interestRate, onChange: (e) => setInterestRate(e.target.value), placeholder: "Ex: 1,8" })), /* @__PURE__ */ React.createElement(Field, { label: "In\xEDcio" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value) }))), /* @__PURE__ */ React.createElement(Field, { label: "Dia do vencimento da parcela" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 1, max: 31, value: dueDay, onChange: (e) => setDueDay(Number(e.target.value)) })), total > 0 && count > 0 && /* @__PURE__ */ React.createElement("p", { className: "muted-sm" }, count, "x de ", fmt(Number(total) / Number(count))), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn-primary full",
      disabled: !name || !total || !count,
      onClick: () => onSave({ name, type, lender, total: Number(total), count: Number(count), interestRate: Number(interestRate) || 0, startDate, dueDay: Number(dueDay) || 10 })
    },
    "Cadastrar d\xEDvida"
  ));
}
function PurchaseModal({ cards, categories, onClose, onSave }) {
  var _a;
  const [cardId, setCardId] = useState(((_a = cards[0]) == null ? void 0 : _a.id) || "");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState(categories[0] || "");
  const [total, setTotal] = useState("");
  const [count, setCount] = useState(1);
  const [purchaseDate, setPurchaseDate] = useState(todayISO());
  const canSave = desc.trim() && total && Number(total) > 0 && cardId;
  return /* @__PURE__ */ React.createElement(Modal, { title: "Compra no cart\xE3o", onClose }, cards.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "muted-sm" }, "Cadastre um cart\xE3o primeiro na aba Categorias.") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "Cart\xE3o" }, /* @__PURE__ */ React.createElement("select", { value: cardId, onChange: (e) => setCardId(e.target.value) }, cards.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name)))), /* @__PURE__ */ React.createElement(Field, { label: "Descri\xE7\xE3o" }, /* @__PURE__ */ React.createElement("input", { value: desc, onChange: (e) => setDesc(e.target.value), placeholder: "Ex: Notebook novo", autoFocus: true })), /* @__PURE__ */ React.createElement(Field, { label: "Categoria" }, /* @__PURE__ */ React.createElement("select", { value: category, onChange: (e) => setCategory(e.target.value) }, categories.map((c) => /* @__PURE__ */ React.createElement("option", { key: c }, c)))), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement(Field, { label: "Valor total" }, /* @__PURE__ */ React.createElement("input", { type: "number", value: total, onChange: (e) => setTotal(e.target.value), placeholder: "0,00" })), /* @__PURE__ */ React.createElement(Field, { label: "Parcelas" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 1, max: 60, value: count, onChange: (e) => setCount(Number(e.target.value)) }))), /* @__PURE__ */ React.createElement(Field, { label: "Data da compra" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: purchaseDate, onChange: (e) => setPurchaseDate(e.target.value) })), /* @__PURE__ */ React.createElement("button", { className: "btn-primary full", disabled: !canSave, onClick: () => onSave({ cardId, desc: desc.trim(), category, total: Number(total), count, purchaseDate }) }, "Registrar compra")));
}
function QuickCategoryModal({ onClose, onSave }) {
  const [kind, setKind] = useState("expense");
  const [name, setName] = useState("");
  return /* @__PURE__ */ React.createElement(Modal, { title: "Nova categoria", onClose }, /* @__PURE__ */ React.createElement(Field, { label: "Tipo de categoria" }, /* @__PURE__ */ React.createElement("div", { className: "seg-toggle" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: `seg-btn ${kind === "expense" ? "sel" : ""}`, onClick: () => setKind("expense") }, "Sa\xEDda"), /* @__PURE__ */ React.createElement("button", { type: "button", className: `seg-btn ${kind === "income" ? "sel" : ""}`, onClick: () => setKind("income") }, "Entrada"))), /* @__PURE__ */ React.createElement(Field, { label: "Nome da categoria" }, /* @__PURE__ */ React.createElement("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Ex: Pets, Cursos, Presentes...", autoFocus: true })), /* @__PURE__ */ React.createElement("button", { className: "btn-primary full", disabled: !name.trim(), onClick: () => onSave(kind, name) }, "Adicionar categoria"));
}
function EditPurchaseModal({ purchase, categories, onClose, onSave }) {
  const [desc, setDesc] = useState(purchase.desc);
  const [category, setCategory] = useState(purchase.category);
  return /* @__PURE__ */ React.createElement(Modal, { title: "Editar compra", onClose }, /* @__PURE__ */ React.createElement(Field, { label: "Descri\xE7\xE3o" }, /* @__PURE__ */ React.createElement("input", { value: desc, onChange: (e) => setDesc(e.target.value), autoFocus: true })), /* @__PURE__ */ React.createElement(Field, { label: "Categoria" }, /* @__PURE__ */ React.createElement("select", { value: category, onChange: (e) => setCategory(e.target.value) }, (categories || []).map((c) => /* @__PURE__ */ React.createElement("option", { key: c }, c)))), /* @__PURE__ */ React.createElement("p", { className: "muted-sm" }, "O valor total, n\xFAmero de parcelas e hist\xF3rico de pagamentos n\xE3o s\xE3o alterados aqui \u2014 use \"Registrar juros\" numa parcela espec\xEDfica se precisar ajustar um valor."), /* @__PURE__ */ React.createElement("button", { className: "btn-primary full", disabled: !desc.trim(), onClick: () => onSave({ desc, category }) }, "Salvar altera\xE7\xF5es"));
}
function EditDebtModal({ debt, debtTypes, onClose, onSave }) {
  const [name, setName] = useState(debt.name);
  const [type, setType] = useState(debt.type);
  const [lender, setLender] = useState(debt.lender);
  return /* @__PURE__ */ React.createElement(Modal, { title: "Editar d\xEDvida", onClose }, /* @__PURE__ */ React.createElement(Field, { label: "Nome" }, /* @__PURE__ */ React.createElement("input", { value: name, onChange: (e) => setName(e.target.value), autoFocus: true })), /* @__PURE__ */ React.createElement(Field, { label: "Tipo" }, /* @__PURE__ */ React.createElement("select", { value: type, onChange: (e) => setType(e.target.value) }, debtTypes.map((t) => /* @__PURE__ */ React.createElement("option", { key: t }, t)))), /* @__PURE__ */ React.createElement(Field, { label: "Credor" }, /* @__PURE__ */ React.createElement("input", { value: lender, onChange: (e) => setLender(e.target.value) })), /* @__PURE__ */ React.createElement("p", { className: "muted-sm" }, "O valor total, n\xFAmero de parcelas e hist\xF3rico de pagamentos n\xE3o s\xE3o alterados aqui \u2014 use \"Registrar juros\" numa parcela espec\xEDfica se precisar ajustar um valor."), /* @__PURE__ */ React.createElement("button", { className: "btn-primary full", disabled: !name.trim(), onClick: () => onSave({ name, type, lender }) }, "Salvar altera\xE7\xF5es"));
}
function AddInterestModal({ debtName, installmentValue, onClose, onConfirm }) {
  const [amount, setAmount] = useState("");
  return /* @__PURE__ */ React.createElement(Modal, { title: `Adicionar juros \u2014 ${debtName}`, onClose }, /* @__PURE__ */ React.createElement("p", { className: "muted-sm" }, "Valor atual da parcela: ", fmt(installmentValue)), /* @__PURE__ */ React.createElement(Field, { label: "Valor de juros/multa a adicionar" }, /* @__PURE__ */ React.createElement("input", { type: "number", value: amount, onChange: (e) => setAmount(e.target.value), placeholder: "0,00", autoFocus: true })), amount > 0 && /* @__PURE__ */ React.createElement("p", { className: "muted-sm" }, "Novo valor da parcela: ", /* @__PURE__ */ React.createElement("strong", null, fmt(installmentValue + Number(amount)))), /* @__PURE__ */ React.createElement("button", { className: "btn-primary full", disabled: !amount || Number(amount) <= 0, onClick: () => onConfirm(Number(amount)) }, "Adicionar"));
}
function WishModal({ categories, onClose, onSave }) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [priority, setPriority] = useState("m\xE9dia");
  return /* @__PURE__ */ React.createElement(Modal, { title: "Adicionar \xE0 lista de desejos", onClose }, /* @__PURE__ */ React.createElement(Field, { label: "Item" }, /* @__PURE__ */ React.createElement("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Ex: Fone bluetooth" })), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement(Field, { label: "Valor estimado" }, /* @__PURE__ */ React.createElement("input", { type: "number", value, onChange: (e) => setValue(e.target.value), placeholder: "0,00" })), /* @__PURE__ */ React.createElement(Field, { label: "Categoria" }, /* @__PURE__ */ React.createElement("select", { value: category, onChange: (e) => setCategory(e.target.value) }, categories.map((c) => /* @__PURE__ */ React.createElement("option", { key: c }, c))))), /* @__PURE__ */ React.createElement(Field, { label: "Prioridade" }, /* @__PURE__ */ React.createElement("div", { className: "status-pick" }, ["baixa", "m\xE9dia", "alta"].map((p) => /* @__PURE__ */ React.createElement("button", { key: p, className: priority === p ? "sel" : "", onClick: () => setPriority(p) }, p)))), /* @__PURE__ */ React.createElement("button", { className: "btn-primary full", disabled: !name || !value, onClick: () => onSave({ name, value: Number(value), category, priority }) }, "Adicionar desejo"));
}
function BuyWishModal({ wish, cards, paymentMethods, onClose, onConfirm }) {
  var _a;
  const [method, setMethod] = useState(paymentMethods[0]);
  const [bank, setBank] = useState(BANKS[0]);
  const [cardId, setCardId] = useState(((_a = cards[0]) == null ? void 0 : _a.id) || "");
  const [installments, setInstallments] = useState(1);
  const [registerExpense, setRegisterExpense] = useState(true);
  const isCard = method === "Cr\xE9dito";
  return /* @__PURE__ */ React.createElement(Modal, { title: `Confirmar compra: ${wish.name}`, onClose }, /* @__PURE__ */ React.createElement("p", { className: "muted-sm" }, "Valor: ", fmt(wish.value)), /* @__PURE__ */ React.createElement("label", { className: "checkbox-row" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: registerExpense, onChange: (e) => setRegisterExpense(e.target.checked) }), /* @__PURE__ */ React.createElement("span", null, "Registrar como sa\xEDda e descontar do saldo")), !registerExpense && /* @__PURE__ */ React.createElement("p", { className: "muted-sm" }, "O item ser\xE1 marcado como conquistado, mas n\xE3o afetar\xE1 seu saldo (use quando foi presente, j\xE1 lan\xE7ado antes, etc.)."), registerExpense && /* @__PURE__ */ React.createElement(Field, { label: "Forma de pagamento" }, /* @__PURE__ */ React.createElement("select", { value: method, onChange: (e) => setMethod(e.target.value) }, paymentMethods.map((m) => /* @__PURE__ */ React.createElement("option", { key: m }, m)))), registerExpense && (isCard ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Field, { label: "Cart\xE3o" }, /* @__PURE__ */ React.createElement("select", { value: cardId, onChange: (e) => setCardId(e.target.value) }, cards.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name)))), /* @__PURE__ */ React.createElement(Field, { label: "Parcelas" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: 1, max: 24, value: installments, onChange: (e) => setInstallments(Number(e.target.value)) }))) : /* @__PURE__ */ React.createElement(Field, { label: "Banco / Conta" }, /* @__PURE__ */ React.createElement("select", { value: bank, onChange: (e) => setBank(e.target.value) }, BANKS.map((b) => /* @__PURE__ */ React.createElement("option", { key: b }, b))))), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn-primary full",
      onClick: () => onConfirm({ method, bank, cardId: isCard ? cardId : null, installments: isCard ? installments : 1, registerExpense })
    },
    "Confirmar compra"
  ));
}
function GoalModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  return /* @__PURE__ */ React.createElement(Modal, { title: "Nova meta financeira", onClose }, /* @__PURE__ */ React.createElement(Field, { label: "Nome da meta" }, /* @__PURE__ */ React.createElement("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Ex: Viagem, Reserva..." })), /* @__PURE__ */ React.createElement(Field, { label: "Valor objetivo" }, /* @__PURE__ */ React.createElement("input", { type: "number", value: target, onChange: (e) => setTarget(e.target.value), placeholder: "0,00" })), /* @__PURE__ */ React.createElement(Field, { label: "Prazo" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: deadline, onChange: (e) => setDeadline(e.target.value) })), /* @__PURE__ */ React.createElement("button", { className: "btn-primary full", disabled: !name || !target || !deadline, onClick: () => onSave({ name, target: Number(target), deadline }) }, "Criar meta"));
}
function SavingModal({ initial, onClose, onSave }) {
  const [desc, setDesc] = useState((initial && initial.desc) || "");
  const [value, setValue] = useState((initial && initial.value) || "");
  const [bank, setBank] = useState((initial && initial.bank) || BANKS[0]);
  const [yieldRate, setYieldRate] = useState((initial && initial.yieldRate) || "");
  const [discount, setDiscount] = useState(initial ? initial.discount !== false : true);
  const isEditing = !!initial;
  return /* @__PURE__ */ React.createElement(Modal, { title: isEditing ? "Editar guardado" : "Guardar dinheiro", onClose }, /* @__PURE__ */ React.createElement(Field, { label: "Descri\xE7\xE3o" }, /* @__PURE__ */ React.createElement("input", { value: desc, onChange: (e) => setDesc(e.target.value), placeholder: "Ex: Reserva de emerg\xEAncia", autoFocus: true })), /* @__PURE__ */ React.createElement(Field, { label: "Valor" }, /* @__PURE__ */ React.createElement("input", { type: "number", value, onChange: (e) => setValue(e.target.value), placeholder: "0,00" })), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement(Field, { label: "Banco / institui\xE7\xE3o" }, /* @__PURE__ */ React.createElement("select", { value: bank, onChange: (e) => setBank(e.target.value) }, BANKS.map((b) => /* @__PURE__ */ React.createElement("option", { key: b }, b)))), /* @__PURE__ */ React.createElement(Field, { label: "Rendimento (% a.m., opcional)" }, /* @__PURE__ */ React.createElement("input", { type: "number", step: "0.01", value: yieldRate, onChange: (e) => setYieldRate(e.target.value), placeholder: "Ex: 0,85" }))), !isEditing && /* @__PURE__ */ React.createElement(Field, { label: "Descontar do saldo dispon\xEDvel?" }, /* @__PURE__ */ React.createElement("div", { className: "status-pick" }, /* @__PURE__ */ React.createElement("button", { className: discount ? "sel" : "", onClick: () => setDiscount(true) }, "Sim"), /* @__PURE__ */ React.createElement("button", { className: !discount ? "sel" : "", onClick: () => setDiscount(false) }, "N\xE3o"))), isEditing && /* @__PURE__ */ React.createElement("p", { className: "muted-sm" }, "Para mudar se este valor desconta do saldo, exclua e registre novamente."), /* @__PURE__ */ React.createElement("button", { className: "btn-primary full", disabled: !desc || !value, onClick: () => onSave({ desc, value: Number(value), bank, yieldRate: yieldRate ? Number(yieldRate) : null, date: (initial && initial.date) || todayISO(), discount }) }, isEditing ? "Salvar altera\xE7\xF5es" : "Guardar"));
}
function InvestmentModal({ initial, onClose, onSave }) {
  const [desc, setDesc] = useState((initial && initial.desc) || "");
  const [value, setValue] = useState((initial && initial.value) || "");
  const [bank, setBank] = useState((initial && initial.bank) || BANKS[0]);
  const [yieldRate, setYieldRate] = useState((initial && initial.yieldRate) || "");
  const [discount, setDiscount] = useState(initial ? initial.discount !== false : true);
  const isEditing = !!initial;
  return /* @__PURE__ */ React.createElement(Modal, { title: isEditing ? "Editar investimento" : "Registrar investimento", onClose }, /* @__PURE__ */ React.createElement(Field, { label: "Descri\xE7\xE3o" }, /* @__PURE__ */ React.createElement("input", { value: desc, onChange: (e) => setDesc(e.target.value), placeholder: "Ex: Tesouro Selic", autoFocus: true })), /* @__PURE__ */ React.createElement(Field, { label: "Valor" }, /* @__PURE__ */ React.createElement("input", { type: "number", value, onChange: (e) => setValue(e.target.value), placeholder: "0,00" })), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement(Field, { label: "Banco / institui\xE7\xE3o" }, /* @__PURE__ */ React.createElement("select", { value: bank, onChange: (e) => setBank(e.target.value) }, BANKS.map((b) => /* @__PURE__ */ React.createElement("option", { key: b }, b)))), /* @__PURE__ */ React.createElement(Field, { label: "Rendimento (% a.m., opcional)" }, /* @__PURE__ */ React.createElement("input", { type: "number", step: "0.01", value: yieldRate, onChange: (e) => setYieldRate(e.target.value), placeholder: "Ex: 1,05" }))), !isEditing && /* @__PURE__ */ React.createElement(Field, { label: "Descontar do saldo dispon\xEDvel?" }, /* @__PURE__ */ React.createElement("div", { className: "status-pick" }, /* @__PURE__ */ React.createElement("button", { className: discount ? "sel" : "", onClick: () => setDiscount(true) }, "Sim"), /* @__PURE__ */ React.createElement("button", { className: !discount ? "sel" : "", onClick: () => setDiscount(false) }, "N\xE3o"))), isEditing && /* @__PURE__ */ React.createElement("p", { className: "muted-sm" }, "Para mudar se este valor desconta do saldo, exclua e registre novamente."), /* @__PURE__ */ React.createElement("button", { className: "btn-primary full", disabled: !desc || !value, onClick: () => onSave({ desc, value: Number(value), bank, yieldRate: yieldRate ? Number(yieldRate) : null, date: (initial && initial.date) || todayISO(), discount }) }, isEditing ? "Salvar altera\xE7\xF5es" : "Registrar"));
}
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap');

:root {
  --bg: #F7F6FA;
  --surface: #FFFFFF;
  --surface-alt: #EFEDF4;
  --lavender: #DCD9E8;
  --purple: #B8AED0;
  --pink: #D9CFDB;
  --pink-light: #F1EEF2;
  --accent-purple: #6B5B95;
  --accent-pink: #8C6B7D;
  --accent-purple-tint: #E6E2EF;
  --accent-pink-tint: #EDE6E9;
  --text-dark: #332F3D;
  --text-muted: #7A7488;
  --border: #E2DFEA;
  --green: #56B08A;
  --orange: #D99A2B;
  --danger: #D65C6E;
  --blue: #5B8BD6;
  --green-tint: #E1F5EC;
  --red-tint: #FBE9EA;
  --blue-tint: #E4EDFB;
  --orange-tint: #FBEDD8;
  --dark-tint: #E7E3EE;
}
html[data-theme="grafite"] {
  --bg: #EEF1F4;
  --surface: #FFFFFF;
  --surface-alt: #E3E8EC;
  --lavender: #D8E0E6;
  --purple: #AAB9C4;
  --pink: #C9D6DC;
  --pink-light: #EEF3F5;
  --accent-purple: #2C3E50;
  --accent-pink: #3F6B7D;
  --accent-purple-tint: #E1E6EA;
  --accent-pink-tint: #E2EBEE;
  --text-dark: #1F2933;
  --text-muted: #64748B;
  --border: #DCE3E8;
  --green: #4C9A73;
  --orange: #C68A2E;
  --danger: #C1495A;
  --blue: #4A7A9D;
}
html[data-theme="escuro"] {
  --bg: #131417;
  --surface: #232427;
  --surface-alt: #2E3136;
  --lavender: #3D4046;
  --purple: #9AA0A8;
  --pink: #6E7278;
  --pink-light: #2E3136;
  --accent-purple: #A6ABB2;
  --accent-pink: #7C8188;
  --accent-purple-tint: #2E3136;
  --accent-pink-tint: #2A2C30;
  --text-dark: #F6F7F8;
  --text-muted: #9BA1A8;
  --border: #3D4046;
  --green: #7FD9A8;
  --orange: #E8B563;
  --danger: #EA8E96;
  --blue: #8FBEEA;
  --green-tint: #1E3A2D;
  --red-tint: #3D2429;
  --blue-tint: #1E2E3D;
  --orange-tint: #3D3120;
  --dark-tint: #2D2F33;
}

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
button, a, select, input, label, [role="button"] { -webkit-tap-highlight-color: transparent; }
button:focus, button:focus-visible { outline: none; }
button:focus-visible { box-shadow: 0 0 0 2px var(--accent-purple); }

.app-root {
  font-family: 'Manrope', sans-serif;
  background: var(--bg);
  color: var(--text-dark);
  min-height: 100vh;
  display: flex;
  width: 100%;
}

h1,h2,h3,h4 { font-family: 'Fraunces', serif; margin: 0; color: var(--text-dark); }

/* Sidebar */
.sidebar {
  width: 232px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  position: sticky;
  top: 0;
  height: 100vh;
  flex-shrink: 0;
}
.brand { display: flex; align-items: center; gap: 10px; padding: 0 6px; }
.brand-mark {
  width: 36px; height: 36px; border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
  display: flex; align-items: center; justify-content: center; color: white;
  overflow: hidden; flex-shrink: 0;
}
.brand-mark-img { width: 100%; height: 100%; object-fit: cover; }
.brand-title { font-family: 'Fraunces', serif; font-weight: 700; font-size: 18px; line-height: 1.1; }
.brand-sub { font-size: 11px; color: var(--text-muted); }
.side-nav { display: flex; flex-direction: column; gap: 3px; flex: 1; overflow-y: auto; }
.side-item {
  display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 12px;
  border: none; background: transparent; color: var(--text-muted); font-size: 13.5px;
  font-weight: 600; cursor: pointer; text-align: left; font-family: inherit;
  transition: background .15s, color .15s;
}
.side-item:hover { background: var(--surface-alt); color: var(--text-dark); }
.side-item.active { background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink)); color: white; }
.side-footer-card {
  background: var(--surface-alt); border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 4px;
  font-size: 12px; color: var(--text-muted);
}
.side-footer-card strong { font-family: 'Fraunces', serif; font-size: 18px; color: var(--text-dark); }
.side-footer-card svg { color: var(--accent-purple); margin-bottom: 2px; }

.account-card { margin-top: 10px; padding-top: 12px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; }
.account-info { display: flex; align-items: center; gap: 9px; }
.account-avatar {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink)); color: white;
  display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;
  overflow: hidden;
}
.account-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.account-text { display: flex; flex-direction: column; min-width: 0; }
.account-text strong { font-family: 'Manrope', sans-serif; font-size: 12.5px; color: var(--text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.account-text span { font-size: 10.5px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
.account-sync-row { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.sync-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); flex-shrink: 0; }
.sync-dot.sync-saving { background: var(--orange); animation: pulse 1s infinite; }
.sync-dot.sync-error { background: var(--danger); }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
.sync-label { font-size: 10px; color: var(--text-muted); }
.account-actions-row { display: flex; align-items: center; justify-content: space-between; gap: 4px; flex-wrap: wrap; }
.account-logout {
  border: none; background: var(--surface-alt); color: var(--accent-pink); font-weight: 700; font-size: 10px;
  padding: 4px 10px; border-radius: 100px; cursor: pointer; font-family: inherit; flex-shrink: 0;
}
.account-logout:hover { background: var(--pink-light); }
.account-reset {
  border: none; background: transparent; color: var(--text-muted); font-weight: 600; font-size: 9.5px;
  padding: 4px 2px; cursor: pointer; font-family: inherit; text-decoration: underline; flex-shrink: 0; white-space: nowrap;
}
.account-reset:hover { color: var(--orange); }
.account-delete {
  border: none; background: transparent; color: var(--text-muted); font-weight: 600; font-size: 9.5px;
  padding: 4px 2px; cursor: pointer; font-family: inherit; text-decoration: underline; flex-shrink: 0; white-space: nowrap;
}
.account-delete:hover { color: var(--danger); }
.account-delete:disabled { opacity: .6; cursor: not-allowed; }
.account-reset:disabled { opacity: .6; cursor: not-allowed; }

/* Main */
.main-area { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.topbar {
  display: flex; align-items: center; justify-content: space-between; padding: 22px 28px 20px;
  background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 5;
  gap: 12px; flex-wrap: wrap;
}
.date-nav { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.date-nav-row {
  display: flex; align-items: center; gap: 4px; background: var(--surface-alt);
  border: 1px solid var(--border); border-radius: 14px; padding: 5px 6px;
}
.date-nav-row .icon-btn { background: var(--surface); }
.month-switch { display: flex; align-items: center; gap: 8px; }
.day-select {
  font-family: 'Fraunces', serif; font-weight: 600; font-size: 14px; color: var(--text-dark);
  background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
  padding: 5px 4px; cursor: pointer; min-width: 40px; text-align: center; text-align-last: center;
}
.month-label { font-family: 'Fraunces', serif; font-weight: 600; font-size: 15px; min-width: 74px; text-align: center; padding: 0 2px; }
.year-select {
  font-family: 'Fraunces', serif; font-weight: 600; font-size: 14px; color: var(--text-dark);
  background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
  padding: 5px 6px; cursor: pointer; min-width: 64px; text-align: center; text-align-last: center;
}
.today-btn {
  display: flex; align-items: center; gap: 4px; border: none; background: transparent;
  color: var(--accent-purple); font-weight: 700; font-size: 10.5px; cursor: pointer;
  font-family: inherit; padding: 2px 4px;
}
.today-btn:hover { text-decoration: underline; }
.topbar-title-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; text-align: right; }
.topbar-title {
  font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; color: var(--accent-purple);
  background: var(--accent-purple-tint); padding: 5px 18px; border-radius: 100px; display: inline-block;
}
.topbar-credit { font-size: 10px; font-style: italic; color: var(--text-muted); letter-spacing: .02em; }
.topbar-balance { display: flex; flex-direction: column; align-items: flex-end; font-size: 11px; color: var(--text-muted); }
.topbar-balance strong { font-family: 'Fraunces', serif; font-size: 16px; color: var(--text-dark); }

.view-content { padding: 22px 28px 100px; max-width: 1280px; width: 100%; margin: 0 auto; }

.stack-lg { display: flex; flex-direction: column; gap: 20px; }

/* Summary cards */
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; }
.sum-card {
  background: var(--surface); border-radius: 20px; padding: 16px 16px 14px; border: 1px solid var(--border);
  box-shadow: 0 2px 14px rgba(134, 87, 201, 0.05);
  display: flex; flex-direction: column; gap: 6px;
}
.sum-icon {
  width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center;
  background: var(--surface-alt); color: var(--accent-purple);
}
.tone-purple .sum-icon { background: var(--accent-purple-tint); color: var(--accent-purple); }
.tone-green .sum-icon { background: var(--green-tint); color: var(--green); }
.tone-pink .sum-icon { background: var(--accent-pink-tint); color: var(--accent-pink); }
.tone-red .sum-icon { background: var(--red-tint); color: var(--danger); }
.tone-lavender .sum-icon { background: var(--accent-purple-tint); color: var(--accent-purple); }
.tone-blue .sum-icon { background: var(--blue-tint); color: var(--blue); }
.tone-orange .sum-icon { background: var(--orange-tint); color: var(--orange); }
.tone-dark .sum-icon { background: var(--dark-tint); color: var(--text-dark); }
.sum-label { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.sum-value { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; }
.sum-value.positive { color: var(--green); }
.sum-value.negative { color: var(--danger); }
.value-positive { color: var(--green) !important; }
.value-negative { color: var(--danger) !important; }
.sum-sub { font-size: 11px; color: var(--orange); font-weight: 600; }

.two-col { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; }
@media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }

.three-col { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 16px; }
@media (max-width: 1150px) { .three-col { grid-template-columns: 1fr 1fr; } }
@media (max-width: 760px) { .three-col { grid-template-columns: 1fr; } }
.analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
@media (max-width: 1000px) { .analytics-grid { grid-template-columns: 1fr; } }

.fv-split-bar { height: 14px; border-radius: 8px; background: var(--pink); overflow: hidden; margin: 4px 0 14px; }
.fv-split-bar div { height: 100%; background: var(--accent-purple); }
.fv-rows { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.fv-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
.fv-row span { display: flex; align-items: center; gap: 7px; color: var(--text-muted); }

.card {
  background: var(--surface); border-radius: 20px; padding: 18px 20px; border: 1px solid var(--border);
  box-shadow: 0 2px 14px rgba(134, 87, 201, 0.05);
}
.card-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; gap: 8px; }
.card-head h4 { font-size: 15px; }
.muted-sm { font-size: 11.5px; color: var(--text-muted); }
.center-col { display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: flex-start; gap: 8px; }
.center-col .card-head { align-items: center; }
.ring-caption { font-size: 12.5px; color: var(--text-muted); max-width: 220px; }
.ring-caption strong { color: var(--text-dark); }

.legend-row { display: flex; gap: 16px; margin-top: 8px; font-size: 12px; color: var(--text-muted); }
.legend-row span { display: flex; align-items: center; gap: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

.qa-title-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; gap: 8px; }
.qa-title-row h4 { font-size: 14px; margin: 0; }
.qa-scroll { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
.qa-btn {
  display: flex; align-items: center; gap: 7px; white-space: nowrap; padding: 10px 16px; border-radius: 14px;
  border: 1px solid var(--border); background: var(--surface); color: var(--text-dark); font-weight: 600;
  font-size: 12.5px; cursor: pointer; font-family: inherit; transition: transform .1s, box-shadow .1s;
}
.qa-btn:hover { box-shadow: 0 4px 14px rgba(0,0,0,.12); transform: translateY(-1px); }
.qa-btn svg { color: var(--accent-purple); }

.donut-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.donut-legend { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 140px; }
.donut-legend-item { display: flex; align-items: center; gap: 8px; font-size: 12.5px; }
.donut-legend-item span { flex: 1; color: var(--text-muted); }
.donut-legend-item strong { font-size: 12.5px; }

.movement-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.movement-list li { display: flex; align-items: center; gap: 10px; }
.mv-icon { width: 30px; height: 30px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mv-icon.entrada { background: var(--green-tint); color: var(--green); }
.mv-icon.saida { background: var(--accent-pink-tint); color: var(--accent-pink); }
.mv-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.mv-desc { font-size: 13px; font-weight: 600; }
.mv-cat { font-size: 11px; color: var(--text-muted); display: inline-flex; align-items: center; gap: 5px; }
.mv-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.mv-value { font-size: 13px; font-weight: 700; }
.mv-value.entrada { color: #56B08A; }
.mv-value.saida { color: var(--accent-pink); }

.timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.timeline li { display: flex; align-items: center; gap: 10px; position: relative; }
.tl-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--accent-purple); flex-shrink: 0; }
.tl-body { display: flex; flex-direction: column; flex: 1; }
.tl-desc { font-size: 13px; font-weight: 600; }
.tl-date { font-size: 11px; color: var(--text-muted); }
.tl-value { font-size: 13px; color: var(--accent-pink); }

.goal-mini-list { display: flex; flex-direction: column; gap: 14px; }
.goal-mini-head { display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600; margin-bottom: 6px; }

.debt-mini-list { display: flex; flex-direction: column; gap: 14px; }
.top5-list { display: flex; flex-direction: column; gap: 12px; }
.top5-row { display: grid; grid-template-columns: 1fr 90px auto; align-items: center; gap: 10px; }
.top5-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.top5-desc { font-size: 12.5px; font-weight: 600; color: var(--text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.top5-bar-wrap { height: 8px; background: var(--surface-alt); border-radius: 100px; overflow: hidden; }
.top5-bar { height: 100%; background: linear-gradient(90deg, var(--accent-purple), var(--accent-pink)); border-radius: 100px; }
.debt-mini-head { display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; font-weight: 600; margin-bottom: 6px; }
.debt-mini-head span { display: flex; align-items: center; gap: 7px; color: var(--text-dark); }
.debt-mini-head strong { font-family: 'Fraunces', serif; color: var(--accent-pink); }
.debt-mini-head span { flex-wrap: wrap; row-gap: 4px; }
.debt-mini-overdue .debt-mini-head strong { color: #C94456; }
.debt-mini-footer { display: flex; justify-content: space-between; gap: 8px; margin-top: 5px; flex-wrap: wrap; }

/* Progress */
.pbar-track { width: 100%; background: var(--surface-alt); border-radius: 10px; overflow: hidden; }
.pbar-fill { height: 100%; border-radius: 10px; transition: width .3s; }

/* Badges */
.badge { padding: 3px 9px; border-radius: 8px; font-size: 10.5px; font-weight: 700; text-transform: capitalize; white-space: nowrap; }
.badge-neutral { background: var(--surface-alt); color: var(--text-muted); }
.badge-green { background: var(--green-tint); color: var(--green); }
.badge-orange { background: var(--orange-tint); color: var(--orange); }
.badge-pink { background: var(--accent-pink-tint); color: var(--accent-pink); }
.badge-purple { background: var(--accent-purple-tint); color: var(--accent-purple); }
.badge-danger { background: var(--red-tint); color: var(--danger); }
.badge-warning { background: var(--orange-tint); color: var(--orange); }

/* Buttons / inputs */
.btn-primary, .btn-secondary {
  border: none; border-radius: 12px; padding: 10px 16px; font-weight: 700; font-size: 13px; cursor: pointer;
  font-family: inherit; display: inline-flex; align-items: center; gap: 6px; justify-content: center;
}
.btn-primary { background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink)); color: white; }
.btn-secondary { background: var(--surface-alt); color: var(--text-dark); border: 1px solid var(--border); }
.btn-primary.sm, .btn-secondary.sm { padding: 8px 12px; font-size: 12px; }
.btn-primary.full { width: 100%; padding: 12px; margin-top: 8px; }
.btn-primary:disabled { opacity: .5; cursor: not-allowed; }

.icon-btn {
  border: none; background: var(--surface-alt); width: 30px; height: 30px; border-radius: 9px; display: flex;
  align-items: center; justify-content: center; cursor: pointer; color: var(--text-dark);
}
.icon-btn.danger { color: var(--danger); background: var(--red-tint); }

input, select {
  width: 100%; padding: 10px 12px; border-radius: 11px; border: 1px solid var(--border); background: var(--surface-alt);
  font-family: inherit; font-size: 13px; color: var(--text-dark);
}
input:focus, select:focus { outline: 2px solid var(--accent-purple); outline-offset: 1px; }

/* remove o "quadrado" feio do spinner nativo de campos num\xE9ricos */
input[type="number"] { -moz-appearance: textfield; appearance: textfield; }
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none; appearance: none; margin: 0;
}

select {
  appearance: none; -webkit-appearance: none; -moz-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2385789C'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.1l3.71-3.87a.75.75 0 111.08 1.04l-4.25 4.43a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center; background-size: 14px; padding-right: 34px;
}

.field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.field-label { font-size: 11.5px; font-weight: 700; color: var(--text-muted); }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.status-pick { display: flex; gap: 8px; }
.status-pick button {
  flex: 1; padding: 9px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface-alt);
  cursor: pointer; font-weight: 700; font-size: 12px; text-transform: capitalize; color: var(--text-muted); font-family: inherit;
}
.status-pick button.sel { background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink)); color: white; border-color: transparent; }

.checkbox-row {
  display: flex; align-items: flex-start; gap: 9px; font-size: 12.5px; color: var(--text-dark); font-weight: 600;
  background: var(--surface-alt); padding: 11px 12px; border-radius: 12px; cursor: pointer; margin-bottom: 4px;
}
.checkbox-row input { width: auto; height: 16px; margin-top: 2px; accent-color: var(--accent-purple); cursor: pointer; }
.fixed-recurrence-block { display: flex; flex-direction: column; gap: 8px; }

.row-actions { display: flex; gap: 6px; }

.color-pick { display: flex; gap: 8px; }
.seg-toggle { display: flex; background: var(--surface-alt); border-radius: 10px; padding: 3px; gap: 3px; }
.seg-btn {
  flex: 1; border: none; background: transparent; color: var(--text-muted); font-weight: 700; font-size: 12.5px;
  padding: 8px; border-radius: 8px; cursor: pointer; font-family: inherit;
}
.seg-btn.sel { background: var(--surface); color: var(--accent-purple); box-shadow: 0 2px 6px rgba(0,0,0,.15); }
.auth-support { text-align: center; font-size: 10.5px; color: var(--text-muted); margin-top: 20px; }
.auth-support a { color: var(--accent-purple); font-weight: 600; text-decoration: none; }
.auth-support a:hover { text-decoration: underline; }
.support-link { color: var(--accent-purple); font-weight: 700; text-decoration: none; }
.support-link:hover { text-decoration: underline; }
.theme-pick-row { display: flex; gap: 12px; margin-top: 4px; }
.theme-pick {
  display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 20px;
  border: 2px solid var(--border); background: var(--surface); border-radius: 14px; cursor: pointer;
  font-family: inherit; font-weight: 700; font-size: 12.5px; color: var(--text-dark);
}
.theme-pick.sel { border-color: var(--accent-purple); background: var(--accent-purple-tint); }
.theme-swatch { width: 40px; height: 24px; border-radius: 8px; display: block; }
.theme-swatch-lavanda { background: linear-gradient(135deg, #6B5B95, #8C6B7D); }
.theme-swatch-grafite { background: linear-gradient(135deg, #2C3E50, #3F6B7D); }
.theme-swatch-escuro { background: linear-gradient(135deg, #131417, #A6ABB2); }
.name-edit-row { display: flex; gap: 8px; align-items: center; }
.name-edit-row input { flex: 1; }
.name-edit-row .btn-primary { flex-shrink: 0; }
.photo-upload-row { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.photo-upload-circle {
  width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0; cursor: pointer; overflow: hidden;
  background: var(--surface-alt); border: 2px dashed var(--border);
  display: flex; align-items: center; justify-content: center; color: var(--text-muted);
}
.photo-upload-circle:hover { border-color: var(--accent-purple); color: var(--accent-purple); }
.photo-upload-circle img { width: 100%; height: 100%; object-fit: cover; }
.photo-upload-text { display: flex; flex-direction: column; gap: 4px; }
.link-btn-danger { border: none; background: transparent; color: var(--danger); font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit; text-align: left; padding: 0; text-decoration: underline; }
.password-field-wrap {
  position: relative; display: block; width: 100%; box-sizing: border-box;
}
.password-field-wrap input {
  width: 100%; box-sizing: border-box; padding-right: 40px !important;
}
.password-eye-btn {
  position: absolute; right: 2px; top: 0; bottom: 0; margin: auto 0;
  height: 30px; width: 30px;
  border: none !important; outline: none !important; background: transparent !important;
  color: var(--text-muted); cursor: pointer; box-shadow: none !important;
  display: flex; align-items: center; justify-content: center; padding: 0;
}
.password-eye-btn:hover, .password-eye-btn:focus, .password-eye-btn:focus-visible { color: var(--accent-purple); outline: none !important; box-shadow: none !important; }
.month-projection-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 10px; margin: 10px 0 4px; }
.month-projection-grid > div { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2px; }
.month-projection-grid span { font-size: 10.5px; color: var(--text-muted); font-weight: 600; display: block; min-height: 26px; line-height: 1.3; width: 100%; }
.month-projection-grid strong { font-family: 'Fraunces', serif; font-size: 15px; color: var(--text-dark); white-space: nowrap; }
.safe-limit-value { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 700; margin: 6px 0 4px; }
.safe-limit-value.positive { color: var(--green); }
.safe-limit-value.negative { color: var(--danger); }
.greeting-line { font-family: 'Fraunces', serif; font-size: 17px; color: var(--text-dark); margin: 0 0 -6px; }
.day-summary-line { font-size: 12px; color: var(--text-muted); margin: 0 0 4px; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 12px; }
.cal-weekday { text-align: center; font-size: 10.5px; font-weight: 700; color: var(--text-muted); padding-bottom: 4px; }
.cal-cell {
  aspect-ratio: 1; border: 1px solid var(--border); background: var(--surface); border-radius: 10px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
  cursor: pointer; font-family: inherit; position: relative;
}
.cal-cell.empty { border: none; background: transparent; cursor: default; }
.cal-cell:hover:not(.empty) { border-color: var(--accent-purple); }
.cal-cell.today { border-color: var(--accent-purple); border-width: 2px; }
.cal-cell.sel { background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink)); border-color: transparent; }
.cal-cell.sel .cal-day-num { color: white; }
.cal-day-num { font-size: 12.5px; font-weight: 700; color: var(--text-dark); }
.cal-dots { display: flex; gap: 3px; }
.cal-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; }
.cal-dot.in { background: var(--green); }
.cal-dot.out { background: var(--danger); }
.cal-day-summary { display: flex; gap: 18px; margin-bottom: 14px; flex-wrap: wrap; }
.cal-day-summary > div { display: flex; flex-direction: column; gap: 2px; }
.cal-day-summary span { font-size: 10.5px; color: var(--text-muted); font-weight: 600; }
.cal-day-summary strong { font-family: 'Fraunces', serif; font-size: 16px; }
.color-dot { width: 26px; height: 26px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
.custom-color-dot {
  display: flex; align-items: center; justify-content: center; border: 2px dashed var(--border); color: white;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.08);
}
.color-dot.sel { border-color: var(--text-dark); }

/* Filter row / chips */
.filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.spacer { flex: 1; }
.chip {
  padding: 7px 14px; border-radius: 100px; border: 1px solid var(--border); background: var(--surface);
  font-size: 12px; font-weight: 700; color: var(--text-muted); cursor: pointer; font-family: inherit;
}
.chip.chip-active { background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink)); color: white; border-color: transparent; }
.chip.static { cursor: default; background: var(--surface-alt); }
.filter-divider { width: 1px; height: 20px; background: var(--border); margin: 0 2px; }
.filter-panel { padding: 16px 20px; }
.filter-panel-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.filter-panel .field { margin-bottom: 0; }
.clear-filters { margin-top: 12px; display: inline-flex; align-items: center; gap: 5px; color: var(--danger); }
.chip.removable { display: inline-flex; align-items: center; gap: 6px; padding-right: 6px; }
.chip-remove {
  border: none; background: rgba(214,92,110,.12); color: var(--danger); width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; flex-shrink: 0;
}
.cat-add-row { display: flex; gap: 8px; margin-top: 12px; }
.cat-add-row input { flex: 1; }
.chip-wrap { display: flex; gap: 8px; flex-wrap: wrap; }
.cat-color-label { position: relative; display: inline-flex; cursor: pointer; width: 12px; height: 12px; }
.cat-color-input { position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer; border: none; padding: 0; }

/* Table */
.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 -4px; padding: 0 4px; }
.data-table { width: 100%; min-width: 680px; border-collapse: collapse; font-size: 12.5px; }
.hist-cat-cell { display: flex; align-items: center; gap: 6px; }
.hist-summary { display: flex; gap: 26px; flex-wrap: wrap; }
.sav-inv-list { display: flex; flex-direction: column; gap: 10px; }
.sav-inv-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; background: var(--surface-alt); border-radius: 12px; flex-wrap: wrap; }
.sav-inv-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.sav-inv-info strong { font-size: 13px; color: var(--text-dark); }
.sav-inv-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.sav-inv-actions strong { font-family: "Fraunces", serif; font-size: 14px; }
.topbar-title-row { display: flex; align-items: center; gap: 10px; }
.search-btn { background: var(--surface-alt); }
.search-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 200;
  display: flex; align-items: flex-start; justify-content: center; padding: 70px 16px 16px; backdrop-filter: blur(2px);
}
.search-panel {
  background: var(--surface); border-radius: 18px; width: 100%; max-width: 520px;
  box-shadow: 0 18px 50px rgba(0,0,0,.3); overflow: hidden;
}
.search-input-row { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.search-input-row svg { color: var(--accent-purple); flex-shrink: 0; }
.search-input-row input { border: none; background: transparent; font-size: 14px; padding: 4px 0; }
.search-input-row input:focus { outline: none; }
.search-hint { padding: 22px 18px; font-size: 12.5px; color: var(--text-muted); text-align: center; margin: 0; }
.search-results { max-height: 55vh; overflow-y: auto; padding: 6px; }
.search-result {
  display: grid; grid-template-columns: 92px 1fr auto; align-items: center; gap: 10px; width: 100%;
  border: none; background: transparent; text-align: left; padding: 10px 12px; border-radius: 10px;
  cursor: pointer; font-family: inherit;
}
.search-result:hover { background: var(--surface-alt); }
.search-kind {
  font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
  color: var(--accent-purple); background: var(--accent-purple-tint); padding: 3px 8px; border-radius: 100px; text-align: center;
}
.search-label { font-size: 13px; font-weight: 600; color: var(--text-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.search-sub { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
@media (max-width: 560px) {
  .search-result { grid-template-columns: 1fr; gap: 2px; }
  .search-kind { justify-self: start; }
}
.conquest-card { border-left: 4px solid var(--green); }
.conquest-list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.conquest-item { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-dark); }
.conquest-item svg { color: var(--green); flex-shrink: 0; }
.conquest-item span { flex: 1; }
.conquest-item strong { font-family: 'Fraunces', serif; }
.hist-summary-item { display: flex; flex-direction: column; gap: 2px; }
.hist-summary-item span { font-size: 10.5px; color: var(--text-muted); font-weight: 600; }
.hist-summary-item strong { font-family: 'Fraunces', serif; font-size: 17px; }
.value-warning { color: var(--orange); }
.value-lightblue { color: #6FA8D6; }
.month-comparison-card { border-left: 4px solid var(--accent-purple); }
.due-soon-list {
  display: flex; flex-direction: column; gap: 4px; max-height: 220px; overflow-y: auto; padding-right: 4px;
  scrollbar-width: thin; scrollbar-color: var(--border) transparent;
}
.due-soon-list::-webkit-scrollbar { width: 5px; }
.due-soon-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
.due-soon-list::-webkit-scrollbar-track { background: transparent; }
.due-soon-list li {
  display: flex; align-items: center; justify-content: space-between; gap: 14px; text-align: left;
  padding: 9px 0; border-bottom: 1px solid var(--border);
}
.due-soon-list li:last-child { border-bottom: none; }
.due-item-info { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; min-width: 0; }
.due-item-kind { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); }
.due-item-desc { color: var(--text-dark); font-weight: 600; font-size: 12.5px; }
.due-item-paren { color: var(--text-muted); font-weight: 500; }
.due-item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.due-item-right strong { font-family: 'Fraunces', serif; font-size: 13px; }
.due-item-badge { font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: 100px; white-space: nowrap; }
.due-item-badge.soon { color: #A6791E; background: #FBEFD2; }
.due-item-badge.overdue { color: #B23A46; background: #FBE1E3; }
.data-table th { text-align: left; padding: 8px 10px; color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: .03em; border-bottom: 1px solid var(--border); white-space: nowrap; }
.data-table td { padding: 10px; border-bottom: 1px solid var(--border); white-space: nowrap; }
.data-table td:first-child { white-space: normal; min-width: 140px; }
.data-table tr:last-child td { border-bottom: none; }
.value-pos { color: #4FAE7E; font-weight: 700; }
.value-neg { color: #C24B85; font-weight: 700; }
.capitalize { text-transform: capitalize; }

.status-toggle {
  border: none; border-radius: 8px; padding: 4px 9px; font-size: 10.5px; font-weight: 700; cursor: pointer;
  display: inline-flex; align-items: center; gap: 4px; text-transform: capitalize; font-family: inherit;
}
.status-toggle.pago { background: var(--green-tint); color: var(--green); }
.status-toggle.pendente { background: var(--orange-tint); color: var(--orange); }

/* Budget */
.budget-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
.budget-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.budget-card-head { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 700; }
.budget-cat { display: flex; align-items: center; gap: 7px; }
.budget-numbers { display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: var(--text-muted); }
.budget-edit { display: flex; gap: 6px; align-items: center; }
.budget-edit input { width: 80px; padding: 5px 8px; }
.section-intro { font-size: 13px; color: var(--text-muted); max-width: 640px; }

/* Cards */
.cards-row { display: flex; gap: 16px; flex-wrap: wrap; }
.credit-card {
  width: 260px; border-radius: 20px; padding: 18px; color: white; cursor: pointer; position: relative;
  box-shadow: 0 8px 24px rgba(0,0,0,.18); transition: transform .15s;
}
.credit-card:hover { transform: translateY(-3px); }
.credit-card-active { outline: 3px solid var(--accent-pink); outline-offset: 2px; }
.credit-card-top { display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 14px; }
.credit-card-bank { font-size: 11px; opacity: .85; margin-top: 3px; }
.credit-card-bottom { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; }
.cc-label { font-size: 9.5px; opacity: .8; display: block; }
.credit-card-bottom strong { font-family: 'Fraunces', serif; font-size: 16px; }
.cc-dates { font-size: 10px; opacity: .85; display: flex; flex-direction: column; gap: 2px; text-align: right; }
.cc-limit-bar { height: 4px; background: rgba(255,255,255,.3); border-radius: 4px; margin-top: 12px; overflow: hidden; }
.cc-limit-bar div { height: 100%; background: white; }

.installment-list { display: flex; flex-direction: column; gap: 18px; }

.debt-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
.debt-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
.debt-card-overdue { border-color: #F2C4CD; box-shadow: 0 2px 14px rgba(214,92,110,.12); }
.debt-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.debt-card-top strong { font-family: 'Fraunces', serif; font-size: 15px; }
.debt-card-meta { display: flex; gap: 6px; flex-wrap: wrap; }
.debt-card-numbers { display: flex; justify-content: space-between; font-size: 12.5px; color: var(--text-muted); }
.debt-card-numbers strong { color: var(--accent-pink); font-family: 'Fraunces', serif; }
.installment-block { border-top: 1px solid var(--border); padding-top: 14px; display: flex; flex-direction: column; gap: 8px; }
.installment-block:first-child { border-top: none; padding-top: 0; }
.installment-head { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.installment-bank-tag { display: block; font-size: 9.5px; color: var(--text-muted); opacity: .8; margin-top: 1px; }
.installment-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.installment-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.installment-head-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.installment-footer-right { display: flex; align-items: center; gap: 8px; }
.debt-card-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.installment-remaining { font-size: 12.5px; color: var(--text-muted); }
.installment-remaining strong { color: var(--accent-pink); font-family: 'Fraunces', serif; font-size: 14px; }
.inst-chip {
  width: 26px; height: 26px; border-radius: 8px; border: none; font-size: 10.5px; font-weight: 700; cursor: pointer; font-family: inherit;
}
.inst-chip.pago { background: #56B08A; color: white; }
.inst-chip.pendente { background: var(--surface-alt); color: var(--text-muted); }
.inst-chip.atrasada { background: var(--red-tint); color: var(--danger); box-shadow: inset 0 0 0 1.5px var(--danger); }
.overdue-text { color: #C94456 !important; font-weight: 700; }
.add-interest-btn { padding: 5px 10px; font-size: 10.5px; font-weight: 700; color: var(--accent-pink); border: 1px dashed var(--accent-pink); background: transparent; }

/* Wishlist */
.wish-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
.wish-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.wish-top { display: flex; justify-content: space-between; align-items: center; color: var(--accent-pink); }
.wish-name { font-size: 14px; }
.wish-value { font-family: 'Fraunces', serif; font-size: 18px; margin-top: 4px; }
.wish-actions { display: flex; gap: 8px; margin-top: 6px; }

/* Goals */
.goal-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.goal-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.goal-card-head { display: flex; justify-content: space-between; align-items: center; }
.goal-numbers { display: flex; justify-content: space-between; font-size: 11.5px; color: var(--text-muted); }
.goal-suggestion { font-size: 11.5px; background: var(--surface-alt); padding: 8px 10px; border-radius: 10px; color: var(--text-muted); }
.goal-suggestion strong { color: var(--accent-purple); }

/* Tips */
.tips-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.tips-list li { display: flex; gap: 10px; font-size: 13px; color: var(--text-dark); background: var(--surface-alt); padding: 12px; border-radius: 12px; }
.tips-list svg { color: var(--accent-purple); flex-shrink: 0; margin-top: 1px; }

.settings-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; font-size: 13px; }
.settings-list li { display: flex; align-items: center; gap: 8px; }
.settings-list-item { justify-content: space-between; }
.settings-list-text { flex: 1; }
.settings-list-actions { display: flex; gap: 6px; flex-shrink: 0; }
.cat-chip-lg { padding-right: 6px; }
.cat-color-label.lg { width: 16px; height: 16px; }
.chip-edit {
  border: none; background: transparent; color: var(--text-muted); width: 16px; height: 16px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; flex-shrink: 0;
}
.chip-edit:hover { color: var(--accent-purple); }
.cat-rename-input {
  border: 1px solid var(--accent-purple); border-radius: 6px; padding: 2px 6px; font-size: 12.5px;
  font-family: inherit; width: 110px; background: var(--surface);
}

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 30px 10px; color: var(--text-muted); text-align: center; }
.empty-state svg { color: var(--purple); }
.empty-state p { font-size: 12.5px; margin: 0; max-width: 220px; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, .5); display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 16px; backdrop-filter: blur(2px);
}
.modal-panel {
  background: var(--surface); border-radius: 22px; padding: 20px 22px; width: 100%; max-width: 400px;
  max-height: 88vh; overflow-y: auto;
}
.modal-wide { max-width: 560px; }
.modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.modal-head h3 { font-size: 16px; }

.more-nav-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.more-nav-item {
  display: flex; align-items: center; gap: 8px; padding: 12px; border-radius: 14px; border: 1px solid var(--border);
  background: var(--surface-alt); cursor: pointer; font-weight: 700; font-size: 12.5px; color: var(--text-dark); font-family: inherit;
}
.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.quick-item {
  display: flex; align-items: center; gap: 8px; padding: 14px; border-radius: 14px; border: 1px solid var(--border);
  background: var(--surface-alt); cursor: pointer; font-weight: 700; font-size: 12.5px; color: var(--text-dark); font-family: inherit;
}
.quick-item svg { color: var(--accent-purple); }

/* Bottom nav / FAB (mobile) */
.bottom-nav { display: none; }
.fab { display: none; }

.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #2E2740; color: #FFFFFF;
  padding: 11px 20px; border-radius: 100px; font-size: 12.5px; font-weight: 600; z-index: 200; box-shadow: 0 8px 24px rgba(0,0,0,.2);
}

.mobile-hide { display: flex; }

@media (max-width: 860px) {
  .sidebar { display: none; }
  .mobile-hide { display: none; }
  .view-content { padding: 16px 16px 100px; }
  .topbar { padding: 14px 16px; }
  .bottom-nav {
    display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: var(--surface);
    border-top: 1px solid var(--border); padding: 8px 10px; justify-content: space-around; z-index: 50;
  }
  .bottom-item {
    border: none; background: transparent; color: var(--text-muted); width: 42px; height: 42px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
  }
  .bottom-item.active { background: var(--surface-alt); color: var(--accent-purple); }
  .bottom-more { font-weight: 900; font-size: 16px; letter-spacing: -1px; }
  .fab {
    display: flex; position: fixed; bottom: 74px; right: 18px; width: 54px; height: 54px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink)); color: white; border: none;
    align-items: center; justify-content: center; z-index: 60; cursor: pointer;
  }
  .field-row { grid-template-columns: 1fr; }
}
`;

// INTERRUPTOR: enquanto estiver testando o app, deixe "false" — qualquer
// e-mail cadastrado consegue criar conta e entrar normalmente.
// Quando for vender de verdade, mude para "true": aí só e-mails
// cadastrados na coleção "licenses" do Firestore (com active: true)
// conseguem acessar.
const REQUIRE_LICENSE = true;

// E-mail de contato exibido no app para quem precisar falar com o suporte
// (ex: liberação de acesso, dúvidas, garantia). Troque pelo seu e-mail real.
const SUPPORT_EMAIL = "plamilypainelfinanceiro@gmail.com";

const firebaseConfig = {
  apiKey: "AIzaSyCRge_m1D3-KfthfCI8_Bek8S6h2swGUOM",
  authDomain: "plamily-7ff6a.firebaseapp.com",
  projectId: "plamily-7ff6a",
  storageBucket: "plamily-7ff6a.firebasestorage.app",
  messagingSenderId: "326704172992",
  appId: "1:326704172992:web:de16d3983ac4d32f3d4225"
};
function isFirebaseConfigured() {
  return !!(firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("COLE_AQUI") && !firebaseInitError);
}
let firebaseApp, auth, db, googleProvider;
let firebaseInitError = null;
try {
  if (isFirebaseConfigured()) {
    try {
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      e.message = "[initializeApp] " + e.message;
      throw e;
    }
    try {
      auth = getAuth(firebaseApp);
      setPersistence(auth, browserLocalPersistence).catch((e) => {
        console.warn("N\xE3o foi poss\xEDvel garantir a persist\xEAncia de login:", e);
      });
    } catch (e) {
      e.message = "[getAuth] " + e.message;
      throw e;
    }
    try {
      db = getFirestore(firebaseApp);
    } catch (e) {
      e.message = "[getFirestore] " + e.message;
      throw e;
    }
    googleProvider = new GoogleAuthProvider();
  }
} catch (e) {
  console.warn("Falha ao iniciar o Firebase:", e);
  firebaseInitError = e;
}
function friendlyAuthError(code) {
  const map = {
    "auth/invalid-email": "E-mail inv\xE1lido.",
    "auth/user-not-found": "N\xE3o existe conta com esse e-mail.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "J\xE1 existe uma conta com esse e-mail. Tente entrar.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/popup-closed-by-user": "Login com Google cancelado.",
    "auth/network-request-failed": "Falha de conex\xE3o. Verifique sua internet.",
    "auth/too-many-requests": "Muitas tentativas seguidas. Aguarde alguns minutos antes de tentar de novo."
  };
  return map[code] || "N\xE3o foi poss\xEDvel concluir. Tente novamente.";
}
function ConfigWarning() {
  const looksConfigured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("COLE_AQUI");
  if (looksConfigured && firebaseInitError) {
    const msg = firebaseInitError && firebaseInitError.message ? firebaseInitError.message : String(firebaseInitError);
    const code = firebaseInitError && firebaseInitError.code ? " (" + firebaseInitError.code + ")" : "";
    return /* @__PURE__ */ React.createElement("div", { className: "auth-config-warning" }, /* @__PURE__ */ React.createElement(AlertCircle, { size: 16 }), /* @__PURE__ */ React.createElement("span", null, "As chaves do Firebase parecem certas, mas deu um erro ao iniciar. Tire um print e envie: ", /* @__PURE__ */ React.createElement("code", null, msg + code)));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "auth-config-warning" }, /* @__PURE__ */ React.createElement(AlertCircle, { size: 16 }), /* @__PURE__ */ React.createElement("span", null, "O login ainda n\xE3o foi configurado: edite o objeto ", /* @__PURE__ */ React.createElement("code", null, "firebaseConfig"), " no in\xEDcio deste arquivo com os dados do seu projeto Firebase."));
}
function AuthScreen({ licenseError }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const withTimeout = (promise, ms = 15000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject({ code: "timeout" }), ms))
    ]);
  };
  const handleGoogle = async () => {
    if (loading) return;
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await withTimeout(signInWithPopup(auth, googleProvider));
    } catch (e) {
      setError(e.code === "timeout" ? "Demorou demais para responder. Feche esta janela do Google, se estiver aberta, e tente de novo." : friendlyAuthError(e.code));
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (loading) return;
    if (!email || mode !== "reset" && !password) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await withTimeout(createUserWithEmailAndPassword(auth, email, password));
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
        try {
          await sendEmailVerification(cred.user);
        } catch (e) {}
      } else if (mode === "login") {
        await withTimeout(signInWithEmailAndPassword(auth, email, password));
      } else if (mode === "reset") {
        await withTimeout(sendPasswordResetEmail(auth, email));
        setInfo("Enviamos um link de redefini\xE7\xE3o de senha para o seu e-mail.");
      }
    } catch (e2) {
      setError(e2.code === "timeout" ? "Demorou demais para responder. Verifique sua internet e tente de novo." : friendlyAuthError(e2.code));
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "auth-screen" }, /* @__PURE__ */ React.createElement("div", { className: "auth-card" }, /* @__PURE__ */ React.createElement("div", { className: "auth-brand" }, /* @__PURE__ */ React.createElement("div", { className: "brand-mark" }, /* @__PURE__ */ React.createElement("img", { src: "./icon-192.png", alt: "Plamily", className: "brand-mark-img" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "brand-title" }, "Plamily"), /* @__PURE__ */ React.createElement("div", { className: "brand-sub" }, "painel financeiro"))), /* @__PURE__ */ React.createElement("h2", { className: "auth-title" }, mode === "login" && "Entrar na sua conta", mode === "signup" && "Criar uma conta", mode === "reset" && "Recuperar senha"), /* @__PURE__ */ React.createElement("p", { className: "auth-subtitle" }, mode === "reset" ? "Informe seu e-mail para receber o link de redefini\xE7\xE3o." : "Seus dados ficam salvos com seguran\xE7a e te acompanham em qualquer aparelho."), !isFirebaseConfigured() && /* @__PURE__ */ React.createElement(ConfigWarning, null), licenseError && /* @__PURE__ */ React.createElement("div", { className: "auth-error", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement(AlertCircle, { size: 14 }), licenseError), /* @__PURE__ */ React.createElement("button", { className: "google-btn", onClick: handleGoogle, disabled: loading || !isFirebaseConfigured() }, /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 48 48" }, /* @__PURE__ */ React.createElement("path", { fill: "#FFC107", d: "M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" }), /* @__PURE__ */ React.createElement("path", { fill: "#FF3D00", d: "M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 7 29.6 5 24 5c-7.5 0-14 4.2-17.7 10.4z" }), /* @__PURE__ */ React.createElement("path", { fill: "#4CAF50", d: "M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.7 35.4 27 36.3 24 36.3c-5.3 0-9.7-3.6-11.3-8.4l-6.6 5.1C9.9 39.6 16.4 44 24 44z" }), /* @__PURE__ */ React.createElement("path", { fill: "#1976D2", d: "M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.6 5.4C39.9 37.1 44 31.5 44 24c0-1.3-.1-2.7-.4-3.5z" })), "Continuar com Google"), /* @__PURE__ */ React.createElement("div", { className: "auth-divider" }, /* @__PURE__ */ React.createElement("span", null, "ou com e-mail")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "auth-form" }, mode === "signup" && /* @__PURE__ */ React.createElement(Field, { label: "Nome" }, /* @__PURE__ */ React.createElement("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Como podemos te chamar" })), /* @__PURE__ */ React.createElement(Field, { label: "E-mail" }, /* @__PURE__ */ React.createElement("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "voce@email.com", required: true })), mode !== "reset" && /* @__PURE__ */ React.createElement(Field, { label: "Senha" }, /* @__PURE__ */ React.createElement("div", { className: "password-field-wrap" }, /* @__PURE__ */ React.createElement("input", { type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "M\xEDnimo 6 caracteres", required: true, minLength: 6 }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "password-eye-btn", onClick: () => setShowPassword((v) => !v), "aria-label": showPassword ? "Ocultar senha" : "Mostrar senha" }, showPassword ? /* @__PURE__ */ React.createElement(EyeOff, { size: 16 }) : /* @__PURE__ */ React.createElement(Eye, { size: 16 })))), error && /* @__PURE__ */ React.createElement("div", { className: "auth-error" }, /* @__PURE__ */ React.createElement(AlertCircle, { size: 14 }), error), info && /* @__PURE__ */ React.createElement("div", { className: "auth-info" }, /* @__PURE__ */ React.createElement(Check, { size: 14 }), info), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn-primary auth-submit", disabled: loading || !isFirebaseConfigured() }, loading ? "Aguarde\u2026" : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link")), /* @__PURE__ */ React.createElement("div", { className: "auth-links" }, mode === "login" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setMode("signup");
    setError("");
    setInfo("");
  } }, "Criar uma conta"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setMode("reset");
    setError("");
    setInfo("");
  } }, "Esqueci minha senha")), mode === "signup" && /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setMode("login");
    setError("");
    setInfo("");
  } }, "J\xE1 tenho conta \u2014 entrar"), mode === "reset" && /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setMode("login");
    setError("");
    setInfo("");
  } }, "Voltar para o login")), /* @__PURE__ */ React.createElement("p", { className: "auth-support" }, "Precisa de ajuda? Fale com o suporte: ", /* @__PURE__ */ React.createElement("a", { href: "mailto:" + SUPPORT_EMAIL }, SUPPORT_EMAIL)), /* @__PURE__ */ React.createElement("p", { className: "auth-credit" }, "by Milena Rietz")));
}
function LoadingScreen({ text }) {
  return /* @__PURE__ */ React.createElement("div", { id: "boot-loader" }, /* @__PURE__ */ React.createElement("div", { className: "pf-spinner" }));
}
function VerifyEmailScreen({ user, onSignOut }) {
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const resend = async () => {
    setSending(true);
    setMsg("");
    setErr("");
    try {
      await sendEmailVerification(auth.currentUser);
      setMsg("Reenviamos o e-mail de confirma\xE7\xE3o. Se n\xE3o aparecer em 1-2 minutos, olhe tamb\xE9m a caixa de spam/lixo eletr\xF4nico.");
    } catch (e) {
      setErr(friendlyAuthError(e && e.code));
    } finally {
      setSending(false);
    }
  };

  const checkVerified = async () => {
    setChecking(true);
    setMsg("");
    setErr("");
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        window.location.reload();
      } else {
        setErr("Ainda n\xE3o encontramos a confirma\xE7\xE3o. Verifique sua caixa de entrada (e o spam).");
      }
    } catch (e) {
      setErr("N\xE3o foi poss\xEDvel verificar agora. Tente novamente.");
    } finally {
      setChecking(false);
    }
  };

  return /* @__PURE__ */ React.createElement("div", { className: "auth-screen" }, /* @__PURE__ */ React.createElement("div", { className: "auth-card" }, /* @__PURE__ */ React.createElement("div", { className: "auth-brand" }, /* @__PURE__ */ React.createElement("div", { className: "brand-mark" }, /* @__PURE__ */ React.createElement("img", { src: "./icon-192.png", alt: "Plamily", className: "brand-mark-img" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "brand-title" }, "Plamily"), /* @__PURE__ */ React.createElement("div", { className: "brand-sub" }, "painel financeiro"))), /* @__PURE__ */ React.createElement("h2", { className: "auth-title" }, "Confirme seu e-mail"), /* @__PURE__ */ React.createElement("p", { className: "auth-subtitle" }, "Enviamos um link de confirma\xE7\xE3o para ", /* @__PURE__ */ React.createElement("strong", null, user.email), ". Clique nele e depois volte aqui. N\xE3o esque\xE7a de checar a caixa de spam/lixo eletr\xF4nico, s\xF3 por garantia."), msg && /* @__PURE__ */ React.createElement("div", { className: "auth-info" }, /* @__PURE__ */ React.createElement(Check, { size: 14 }), msg), err && /* @__PURE__ */ React.createElement("div", { className: "auth-error" }, /* @__PURE__ */ React.createElement(AlertCircle, { size: 14 }), err), /* @__PURE__ */ React.createElement("button", { className: "btn-primary auth-submit", onClick: checkVerified, disabled: checking }, checking ? "Verificando\u2026" : "J\xE1 confirmei, continuar"), /* @__PURE__ */ React.createElement("div", { className: "auth-links" }, /* @__PURE__ */ React.createElement("button", { onClick: resend, disabled: sending }, sending ? "Enviando\u2026" : "Reenviar e-mail"), /* @__PURE__ */ React.createElement("button", { onClick: onSignOut }, "Sair"))));
}
function InstallBanner({ variant, onInstall, onDismiss }) {
  return /* @__PURE__ */ React.createElement("div", { className: "install-banner" }, /* @__PURE__ */ React.createElement("img", { src: "./icon-192.png", alt: "", className: "install-banner-icon" }), /* @__PURE__ */ React.createElement("div", { className: "install-banner-text" }, /* @__PURE__ */ React.createElement("strong", null, "Instalar Plamily"), /* @__PURE__ */ React.createElement("span", null, variant === "ios" ? 'Toque em compartilhar e depois em "Adicionar \xE0 Tela de In\xEDcio".' : "Adicione um atalho na tela inicial pra abrir como um app.")), variant === "android" && /* @__PURE__ */ React.createElement("button", { className: "install-banner-btn", onClick: onInstall }, "Instalar"), /* @__PURE__ */ React.createElement("button", { className: "install-banner-close", onClick: onDismiss, "aria-label": "Fechar" }, /* @__PURE__ */ React.createElement(X, { size: 16 })));
}
function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [licenseError, setLicenseError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installVariant, setInstallVariant] = useState(null);
  const [theme, setTheme] = useState(() => getStoredTheme());
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);
  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    const dismissedAt = Number(window.localStorage.getItem("plamily-install-dismissed-at") || 0);
    const dismissedRecently = dismissedAt && (Date.now() - dismissedAt) < 14 * 24 * 60 * 60 * 1e3;
    if (isStandalone || dismissedRecently) return;
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallVariant("android");
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (isIos) setInstallVariant("ios");
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);
  const dismissInstall = () => {
    window.localStorage.setItem("plamily-install-dismissed-at", String(Date.now()));
    setInstallVariant(null);
  };
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallVariant(null);
  };
  const handleUpdateName = async (newName) => {
    const clean = newName.trim();
    if (!clean || !auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, { displayName: clean });
      setUser({ ...auth.currentUser });
    } catch (e) {
      console.warn("Não foi possível atualizar o nome:", e);
    }
  };
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setAuthChecked(true);
      return;
    }
    const failSafe = setTimeout(() => setAuthChecked(true), 8e3);
    let unsub = () => {
    };
    try {
      unsub = onAuthStateChanged(auth, async (u) => {
        clearTimeout(failSafe);
        if (u) {
          setDataLoading(true);
          const email = (u.email || "").trim().toLowerCase();

          const isPasswordAccount = (u.providerData || []).some((p) => p.providerId === "password");
          if (isPasswordAccount && !u.emailVerified) {
            setNeedsVerification(true);
            setLicenseError("");
            setDataLoading(false);
            setUser(u);
            setAuthChecked(true);
            return;
          }
          setNeedsVerification(false);

          let licensed = !REQUIRE_LICENSE;
          if (REQUIRE_LICENSE) {
            try {
              const licenseSnap = await getDoc(doc(db, "licenses", email));
              licensed = licenseSnap.exists() && licenseSnap.data().active === true;
            } catch (e) {
              console.warn("N\xE3o foi poss\xEDvel confirmar a licen\xE7a deste e-mail.", e);
              licensed = false;
            }
          }
          if (!licensed) {
            try { await signOut(auth); } catch (e) {}
            setLicenseError(
              "E-mail confirmado! Falta só a liberação do acesso, que pode levar até 8h após a compra — tente novamente dentro desse prazo. " +
              "Ainda não comprou? Fale com o suporte: " + SUPPORT_EMAIL + " (resposta em até 8h)."
            );
            setDataLoading(false);
            setUser(null);
            setAuthChecked(true);
            return;
          }
          setLicenseError("");
          try {
            const snap = await getDoc(doc(db, "users", u.uid));
            if (snap.exists()) {
              saveStorage(u.uid, snap.data());
            }
          } catch (e) {
            console.warn("N\xE3o foi poss\xEDvel carregar os dados da nuvem, usando cache local.", e);
          }
          setDataLoading(false);
        }
        setUser(u);
        setAuthChecked(true);
      }, (err) => {
        console.warn("Erro ao observar autentica\xE7\xE3o:", err);
        clearTimeout(failSafe);
        setAuthChecked(true);
      });
    } catch (e) {
      console.warn("Erro ao iniciar observador de autentica\xE7\xE3o:", e);
    }
    return () => {
      clearTimeout(failSafe);
      unsub();
    };
  }, []);
  if (!authChecked) return /* @__PURE__ */ React.createElement(LoadingScreen, null);
  const themeCtxValue = { theme, c1: THEME_PALETTES[theme].c1, c2: THEME_PALETTES[theme].c2, setTheme };
  return /* @__PURE__ */ React.createElement(ThemeContext.Provider, { value: themeCtxValue }, /* @__PURE__ */ React.createElement(React.Fragment, null, installVariant && /* @__PURE__ */ React.createElement(InstallBanner, { variant: installVariant, onInstall: handleInstall, onDismiss: dismissInstall }), !user ? /* @__PURE__ */ React.createElement(AuthScreen, { licenseError }) : needsVerification ? /* @__PURE__ */ React.createElement(VerifyEmailScreen, { user, onSignOut: () => signOut(auth) }) : dataLoading ? /* @__PURE__ */ React.createElement(LoadingScreen, { text: "Carregando seus dados\u2026" }) : /* @__PURE__ */ React.createElement(
    FinancePlanner,
    {
      accountId: user.uid,
      db,
      userEmail: user.email,
      userName: user.displayName,
      onSignOut: () => signOut(auth),
      onUpdateName: handleUpdateName
    }
  )));
}
if (window.__lumenBootTimeout) clearTimeout(window.__lumenBootTimeout);
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ React.createElement(App, null));
