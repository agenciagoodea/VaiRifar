import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Ticket,
  LayoutDashboard,
  ShoppingBag,
  User as UserIcon,
  Plus,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  ChevronRight,
  Search,
  Filter,
  ArrowRight,
  CreditCard,
  QrCode,
  Menu,
  Map,
  X,
  Mail,
  Settings as SettingsIcon,
  Shield,
  DollarSign,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Eye,
  EyeOff,
  Share2,
  Edit3,
  Gift,
  RotateCcw,
  Play,
  Rocket,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Type,
  Baseline,
  Palette,
  Eraser,
  RefreshCcw,
  Banknote,
  Calendar,
  ChevronDown,
  Trash2,
  Copy,
  ExternalLink,
  HelpCircle,
  Globe,
  Star,
  Hash,
  Zap,
  ChevronUp,
  FileText,
  Link2,
  BarChart3,
  Trophy,
  Cookie,
  Code
} from 'lucide-react';
import type { Campaign, User, Order } from './types';
import { supabase } from './lib/supabase';

// --- Helpers ---
const mapProfileToUser = (profile: any, email: string): User => ({
  id: profile.id,
  name: profile.name,
  email: email,
  role: profile.role,
  phone: profile.phone || '',
  social_whatsapp_group: profile.social_whatsapp_group || '',
  social_telegram: profile.social_telegram || '',
  social_instagram: profile.social_instagram || '',
  social_tiktok: profile.social_tiktok || '',
  social_youtube: profile.social_youtube || '',
  social_facebook: profile.social_facebook || '',
  pixel_facebook: profile.pixel_facebook || '',
  pixel_google: profile.pixel_google || '',
  site_theme: profile.site_theme || 'light',
  primary_color: profile.primary_color || '#ff6b00',
  logo_url: profile.logo_url || '',
  document: profile.document || '',
  cep: profile.cep || '',
  address_street: profile.address_street || '',
  address_number: profile.address_number || '',
  address_complement: profile.address_complement || '',
  address_district: profile.address_district || '',
  address_city: profile.address_city || '',
  address_state: profile.address_state || ''
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const loadAnalyticsAndPixels = (consent: any, settings: any) => {
  if (!consent || !settings) return;

  // 1. Google Analytics (Estatísticas)
  const gaId = settings.lgpd_script_ga_id || settings.google_analytics_id;
  if (consent.statistics && gaId && !(window as any).__gaLoaded) {
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.async = true;
    document.head.appendChild(script);
    
    const script2 = document.createElement('script');
    script2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
    document.head.appendChild(script2);
    (window as any).__gaLoaded = true;
  }

  // 2. Microsoft Clarity (Estatísticas)
  const clarityId = settings.lgpd_script_clarity_id;
  if (consent.statistics && clarityId && !(window as any).__clarityLoaded) {
    const clarityScript = document.createElement('script');
    clarityScript.textContent = `
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window,document,"clarity","script","${clarityId}");
    `;
    document.head.appendChild(clarityScript);
    (window as any).__clarityLoaded = true;
  }

  // 3. Meta Pixel (Marketing)
  const metaPixelId = settings.lgpd_script_meta_pixel_id || settings.facebook_pixel_id;
  if (consent.marketing && metaPixelId && !(window as any).__fbPixelLoaded) {
    const fbScript = document.createElement('script');
    fbScript.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${metaPixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(fbScript);
    (window as any).__fbPixelLoaded = true;
  }

  // 4. Google Tag Manager (GTM - Rastreamento/Marketing)
  const gtmId = settings.lgpd_script_gtm_id;
  if (consent.marketing && gtmId && !(window as any).__gtmLoaded) {
    const gtmScript = document.createElement('script');
    gtmScript.textContent = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(gtmScript);
    
    // GTM NoScript fallback
    const gtmNoScript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    gtmNoScript.appendChild(iframe);
    document.body.appendChild(gtmNoScript);

    (window as any).__gtmLoaded = true;
  }

  // 5. Outros Scripts Customizados (Marketing)
  const customScripts = settings.lgpd_custom_scripts;
  if (consent.marketing && customScripts && !(window as any).__customScriptsLoaded) {
    try {
      const container = document.createElement('div');
      container.innerHTML = customScripts;
      const scripts = container.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        if (oldScript.src) {
          newScript.src = oldScript.src;
          newScript.async = true;
        } else {
          newScript.textContent = oldScript.textContent;
        }
        document.head.appendChild(newScript);
      });
      container.querySelectorAll('script').forEach(s => s.remove());
      if (container.innerHTML.trim().length > 0) {
        document.body.appendChild(container);
      }
      (window as any).__customScriptsLoaded = true;
    } catch (err) {
      console.error('Erro ao carregar scripts customizados da LGPD:', err);
    }
  }
};

const formatCpf = (val: string) => {
  const digits = val.replace(/\D/g, '').substring(0, 11);
  if (digits.length > 9) {
    return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9)}`;
  } else if (digits.length > 6) {
    return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6)}`;
  } else if (digits.length > 3) {
    return `${digits.substring(0, 3)}.${digits.substring(3)}`;
  }
  return digits;
};

const calculateCRC16 = (str: string): string => {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  let hex = (crc & 0xFFFF).toString(16).toUpperCase();
  if (hex.length < 4) hex = '0' + hex;
  while (hex.length < 4) hex = '0' + hex;
  return hex;
};

const cleanString = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, "") // remove caracteres especiais
    .substring(0, 25);
};

const cleanSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const generateStaticPix = ({ key, name, city, amount, txid }: { key: string, name: string, city?: string, amount: number, txid?: string }): string => {
  let cleanKey = key.trim();
  if (cleanKey.match(/^\+?\d+$/) || cleanKey.includes('(') || cleanKey.includes('-')) {
    cleanKey = cleanKey.replace(/\D/g, '');
    if (cleanKey.length === 11 && !cleanKey.startsWith('55')) {
      cleanKey = '55' + cleanKey;
    }
  }

  const cleanName = cleanString(name || 'ORGANIZADOR').trim().substring(0, 25);
  const cleanCity = cleanString(city || 'SAO PAULO').trim().substring(0, 15);
  
  const payloadFormat = "000201";
  
  // Merchant Account Info
  const gui = "0014br.gov.bcb.pix";
  const keyTag = "01" + String(cleanKey.length).padStart(2, '0') + cleanKey;
  const merchantAccountInfo = "26" + String(gui.length + keyTag.length).padStart(2, '0') + gui + keyTag;
  
  const merchantCategory = "52040000";
  const transactionCurrency = "5303986";
  
  const amountStr = amount.toFixed(2);
  const transactionAmount = "54" + String(amountStr.length).padStart(2, '0') + amountStr;
  
  const countryCode = "5802BR";
  
  const merchantNameTag = "59" + String(cleanName.length).padStart(2, '0') + cleanName;
  const merchantCityTag = "60" + String(cleanCity.length).padStart(2, '0') + cleanCity;
  
  const cleanTxid = cleanString(txid || '***').substring(0, 25);
  const txidTag = "05" + String(cleanTxid.length).padStart(2, '0') + cleanTxid;
  const additionalData = "62" + String(txidTag.length).padStart(2, '0') + txidTag;
  
  let pixCode = payloadFormat + merchantAccountInfo + merchantCategory + transactionCurrency + transactionAmount + countryCode + merchantNameTag + merchantCityTag + additionalData + "6304";
  const crc = calculateCRC16(pixCode);
  return pixCode + crc;
};

const SETTINGS_CACHE_KEY = 'vairifar-global-settings-v1';

const normalizeSettingsRows = (settingsRows: any[] = []) => (
  settingsRows.reduce((acc: Record<string, any>, setting: any) => {
    if (setting?.key) acc[setting.key] = setting.value;
    return acc;
  }, {})
);

const readCachedSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    localStorage.removeItem(SETTINGS_CACHE_KEY);
    return null;
  }
};

const persistSettingsCache = (settings: Record<string, any>) => {
  localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
};

const applySiteTheme = (settings: Record<string, any>) => {
  const primaryColor = settings.primary_color || '#00d18e';
  const secondaryColor = settings.secondary_color || '#ff6321';
  const buttonColor = settings.button_color || secondaryColor;
  const backgroundColor = settings.background_color || '#fafafa';
  const textColor = settings.text_color || '#18181b';

  document.documentElement.style.setProperty('--primary-color', primaryColor);
  document.documentElement.style.setProperty('--secondary-color', secondaryColor);
  document.documentElement.style.setProperty('--accent-color', buttonColor);
  document.documentElement.style.setProperty('--background-color', backgroundColor);
  document.documentElement.style.setProperty('--text-color', textColor);
  document.documentElement.style.setProperty('--color-brand-green', primaryColor);
  document.documentElement.style.setProperty('--color-brand-orange', buttonColor);
  document.documentElement.style.setProperty('--color-primary', primaryColor);
  document.documentElement.style.setProperty('--color-secondary', secondaryColor);
  document.documentElement.style.setProperty('--color-button', buttonColor);

  if (settings.site_theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const preloadSiteLogo = (settings: Record<string, any>) => {
  const logoUrl = settings.site_logo_url || settings.logo_url;
  if (!logoUrl || document.querySelector(`link[rel="preload"][href="${logoUrl}"]`)) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = logoUrl;
  document.head.appendChild(link);
};

const clearLocalAuthState = async () => {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // Local cleanup below is the source of truth for stale browser sessions.
  }

  localStorage.removeItem('rifapro-user');
  Object.keys(localStorage)
    .filter((key) => key.startsWith('sb-') && key.includes('auth-token'))
    .forEach((key) => localStorage.removeItem(key));
};

const getAccessTokenOrThrow = async (refresh = false) => {
  const { data, error } = refresh
    ? await supabase.auth.refreshSession()
    : await supabase.auth.getSession();

  if (error || !data.session) {
    await clearLocalAuthState();
    throw new Error('Sessao invalida ou expirada. Faca login novamente.');
  }

  const { session } = data;
  return session.access_token;
};

const fetchJsonWithAuth = async (url: string, options: RequestInit = {}) => {
  const request = async (refresh = false) => {
    const accessToken = await getAccessTokenOrThrow(refresh);
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);

    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    let response: Response;
    let data: any;
    try {
      response = await fetch(url, { ...options, headers, signal: controller.signal });
      data = await response.json().catch(() => ({}));
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error('Tempo limite excedido. Verifique a conexao e tente novamente.');
      }
      throw err;
    } finally {
      window.clearTimeout(timeoutId);
    }

    return { response, data };
  };

  let { response, data } = await request(false);

  if (response.status === 401) {
    ({ response, data } = await request(true));
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Erro HTTP ${response.status}`);
  }

  return data;
};

const formatExpiry = (expiryValue: string | number) => {
  const hours = parseFloat(String(expiryValue));
  if (isNaN(hours)) return '24 horas';

  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    let result = `${days} ${days === 1 ? 'dia' : 'dias'}`;
    if (remainingHours > 0) {
      result += ` e ${remainingHours} ${remainingHours === 1 ? 'hora' : 'horas'}`;
    }
    return result;
  }

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes > 0) {
    return `${wholeHours} ${wholeHours === 1 ? 'hora' : 'horas'} e ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  return `${wholeHours} ${wholeHours === 1 ? 'hora' : 'horas'}`;
};

const TaxTableModal = ({ onClose, settings }: { onClose: () => void, settings: any }) => {
  const taxTable = JSON.parse(settings.tax_table || '[]');
  const normalizedValue = Array.isArray(taxTable) ? [...taxTable].sort((a, b) => a.max - b.max) : [];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-orange/10 rounded-xl">
              <Ticket className="w-5 h-5 text-brand-orange" />
            </div>
            <h2 className="text-xl font-black text-zinc-900">Tabela de Taxas</h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-100 rounded-2xl transition-all">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Arrecadação Total</th>
                <th className="pb-4 text-right text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Taxa de Ativação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {normalizedValue.length > 0 ? (
                normalizedValue.map((item: any, i: number) => (
                  <tr key={item.id || i} className="group hover:bg-zinc-50/50 transition-colors">
                    <td className="py-4 font-bold text-zinc-600">
                      {item.max >= 999999999 ? 'Acima de ' + formatCurrency(normalizedValue[i - 1]?.max || 0) : 'Até ' + formatCurrency(item.max)}
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                        {formatCurrency(item.fee)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-zinc-400 italic">Nenhum valor configurado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-8 bg-zinc-50 border-t border-zinc-100">
          <p className="text-xs text-zinc-400 font-medium text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-brand-orange" />
            A taxa é cobrada uma única vez para ativar sua campanha.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const PublishModal = ({ campaign, onClose, onPublished, settings, globalSettings, user }: { campaign: Campaign, onClose: () => void, onPublished: () => void, settings: any, globalSettings: any, user: User }) => {
  const [calculating, setCalculating] = useState(true);
  const [fee, setFee] = useState(0);
  const potentialRevenue = campaign.total_tickets * campaign.ticket_price;

  // Checkout states
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [checkoutStep, setCheckoutStep] = useState<'init' | 'generating' | 'pix_generated' | 'card_processing' | 'success' | 'error'>('init');
  const [errorMessage, setErrorMessage] = useState('');
  const [publicKey, setPublicKey] = useState<string | null>(null);

  // General Customer Info
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.name || '');
  const [cpf, setCpf] = useState(user?.document ? formatCpf(user.document) : '');

  // Credit Card Info
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [installments, setInstallments] = useState('1');
  const [cardFocused, setCardFocused] = useState(false); // flips visual card when true (CVV focused)

  // Payment result states
  const [pixData, setPixData] = useState<any>(null);
  const [cardResult, setCardResult] = useState<any>(null);
  const [checkingPix, setCheckingPix] = useState(false);
  const [pixCountdown, setPixCountdown] = useState(5);
  const pixPollRef = React.useRef<any>(null);
  const pixCountdownRef = React.useRef<any>(null);

  // Polling automático: inicia quando o PIX é gerado
  useEffect(() => {
    if (checkoutStep !== 'pix_generated' || !pixData) return;

    let countdown = 5;
    setPixCountdown(5);

    // Countdown visual a cada 1 segundo
    pixCountdownRef.current = setInterval(() => {
      countdown -= 1;
      setPixCountdown(countdown);
      if (countdown <= 0) {
        countdown = 5;
        setPixCountdown(5);
      }
    }, 1000);

    // Verificação real a cada 5 segundos
    const doPoll = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`/api/payments/status/${pixData.id}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        if (data.success && (data.status === 'paid' || data.status === 'approved')) {
          clearInterval(pixPollRef.current);
          clearInterval(pixCountdownRef.current);
          setCheckoutStep('success');
          onPublished();
        }
      } catch (err) {
        console.error('Erro no polling PIX:', err);
      }
    };

    // Primeira verificação após 5s
    pixPollRef.current = setInterval(doPoll, 5000);

    return () => {
      clearInterval(pixPollRef.current);
      clearInterval(pixCountdownRef.current);
    };
  }, [checkoutStep, pixData]);

  useEffect(() => {
    try {
      const table = JSON.parse(settings.tax_table || '[]');
      const collection = (campaign.total_tickets || 0) * (campaign.ticket_price || 0);
      if (Array.isArray(table) && table.length > 0) {
        const sorted = [...table].sort((a: any, b: any) => a.max - b.max);
        const match = sorted.find((t: any) => collection <= t.max) || sorted[sorted.length - 1];
        setFee(match.fee);
      }
      setCalculating(false);
    } catch (e) {
      console.error(e);
      setCalculating(false);
    }
  }, [campaign, settings]);

  // Load public key
  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const res = await fetch('/api/mercado-pago/public-key');
        const data = await res.json();
        if (data.success) {
          setPublicKey(data.publicKey);
        }
      } catch (err) {
        console.error("Erro ao buscar chave pública:", err);
      }
    };
    fetchPublicKey();
  }, []);

  // Load MP.js v2 Script dynamically when 'card' is selected
  useEffect(() => {
    if (paymentMethod !== 'card') return;
    if ((window as any).MercadoPago) return;

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Keep script for potential reuse
    };
  }, [paymentMethod]);

  // Format inputs helpers
  const handleCpfChange = (val: string) => {
    const digits = val.replace(/\D/g, '').substring(0, 11);
    let formatted = digits;
    if (digits.length > 9) {
      formatted = `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9)}`;
    } else if (digits.length > 6) {
      formatted = `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.substring(0, 3)}.${digits.substring(3)}`;
    }
    setCpf(formatted);
  };

  const handleCardNumberChange = (val: string) => {
    const digits = val.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !cpf || cpf.length < 14) {
      alert("Preencha seus dados cadastrais e CPF corretamente.");
      return;
    }
    setCheckoutStep('generating');
    setErrorMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");

      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          payment_method: 'pix',
          campaign_id: campaign.id,
          email,
          name,
          cpf
        })
      });
      const data = await res.json();
      if (data.success && data.payment) {
        setPixData(data.payment);
        setCheckoutStep('pix_generated');
      } else {
        throw new Error(data.message || 'Erro ao gerar PIX.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao gerar Pix. Contate o suporte.');
      setCheckoutStep('error');
    }
  };

  const handleProcessCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !cpf || !cardNumber || !cardholderName || !expiryMonth || !expiryYear || !cvv) {
      alert("Por favor, preencha todos os dados do cartão.");
      return;
    }
    setCheckoutStep('card_processing');
    setErrorMessage('');
    try {
      if (!(window as any).MercadoPago) {
        throw new Error("O script do Mercado Pago ainda está sendo carregado. Aguarde.");
      }
      if (!publicKey) {
        throw new Error("Gateway inativo: Chave pública ausente.");
      }

      // Instantiate MercadoPago
      const mp = new (window as any).MercadoPago(publicKey);

      let fullYear = expiryYear;
      if (expiryYear.length === 2) {
        fullYear = "20" + expiryYear;
      }

      // Tokenize card securely on frontend
      const cardTokenResult = await mp.createCardToken({
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName: cardholderName,
        cardExpirationMonth: expiryMonth,
        cardExpirationYear: fullYear,
        securityCode: cvv,
        identificationType: 'CPF',
        identificationNumber: cpf.replace(/\D/g, '')
      });

      if (cardTokenResult.error || !cardTokenResult.id) {
        console.error("Tokenização falhou:", cardTokenResult);
        throw new Error(cardTokenResult.error?.message || cardTokenResult.cause?.[0]?.description || "Dados do cartão recusados pelo Mercado Pago.");
      }

      const cardToken = cardTokenResult.id;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada.");

      // Post token to backend to create payment
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          payment_method: 'credit_card',
          campaign_id: campaign.id,
          email,
          name,
          cpf,
          token: cardToken,
          payment_method_id: cardTokenResult.payment_method_id || 'visa',
          installments: parseInt(installments)
        })
      });

      const data = await res.json();
      if (data.success && data.payment) {
        setCardResult(data.payment);
        if (data.payment.status === 'approved' || data.payment.status === 'paid') {
          setCheckoutStep('success');
          onPublished();
        } else if (data.payment.status === 'in_process' || data.payment.status === 'pending') {
          setCheckoutStep('success');
          onPublished();
        } else {
          throw new Error(`Pagamento recusado. Status: ${data.payment.status_detail || data.payment.status}`);
        }
      } else {
        throw new Error(data.message || 'Erro ao processar transação de cartão.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Pagamento com cartão recusado.');
      setCheckoutStep('error');
    }
  };

  const handleCheckPixStatus = async () => {
    if (!pixData) return;
    setCheckingPix(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada.");

      const res = await fetch(`/api/payments/status/${pixData.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      if (data.success && (data.status === 'paid' || data.status === 'approved')) {
        setCheckoutStep('success');
        onPublished();
      } else {
        alert("O pagamento PIX ainda não foi confirmado pelo Mercado Pago. Aguarde alguns segundos e clique novamente.");
      }
    } catch (err: any) {
      alert(err.message || "Erro ao validar pagamento.");
    } finally {
      setCheckingPix(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-2xl">
              <Rocket className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900">Ativar Campanha</h2>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Checkout Transparente seguro</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-100 rounded-2xl transition-all">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* STEP: INIT */}
        {checkoutStep === 'init' && (
          <div className="p-8 space-y-6">
            {/* Info Summary */}
            <div className="bg-zinc-50 rounded-3xl p-6 space-y-3 border border-zinc-100">
              <div className="flex justify-between items-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <span>Campanha</span>
                <span className="text-zinc-950 font-black normal-case text-right truncate max-w-[200px]">{campaign.title}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <span>Arrecadação Est.</span>
                <span className="text-zinc-950 font-black">{formatCurrency(potentialRevenue)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-zinc-100">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Taxa de Publicação</span>
                <span className="text-2xl font-black text-emerald-600">
                  {calculating ? 'Calculando...' : formatCurrency(fee)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${paymentMethod === 'pix' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}
              >
                <QrCode className="w-4 h-4" />
                PIX Imediato
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${paymentMethod === 'card' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}
              >
                <CreditCard className="w-4 h-4" />
                Cartão de Crédito
              </button>
            </div>

            {/* Pix Form */}
            {paymentMethod === 'pix' && (
              <form onSubmit={handleGeneratePix} className="space-y-4">
                <h4 className="font-bold text-zinc-800 text-sm">Dados do Pagador</h4>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Nome Completo</label>
                  <input
                    type="text"
                    required
                    className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    placeholder="Nome como no CPF"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">E-mail</label>
                    <input
                      type="email"
                      required
                      className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">CPF</label>
                    <input
                      type="text"
                      required
                      className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={e => handleCpfChange(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={calculating}
                  className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  Confirmar e Gerar PIX <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Card Form */}
            {paymentMethod === 'card' && (
              <form onSubmit={handleProcessCard} className="space-y-4">
                {/* 3D Animated Card Preview */}
                <div className="perspective-1000 w-full h-44 mb-6">
                  <div className={`relative w-full h-full duration-500 transform-style-3d ${cardFocused ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <div className="absolute w-full h-full rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 p-6 text-white flex flex-col justify-between backface-hidden shadow-lg border border-zinc-800">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400">ATIVAR RIFAPRO</span>
                        <CreditCard className="w-8 h-8 text-zinc-300" />
                      </div>
                      <div className="font-mono text-lg tracking-[0.18em] my-2">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>
                      <div className="flex justify-between items-end font-mono">
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-zinc-500 uppercase block">TITULAR</span>
                          <span className="text-xs tracking-wider uppercase block truncate max-w-[200px]">
                            {cardholderName || 'NOME DO TITULAR'}
                          </span>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <span className="text-[8px] text-zinc-500 uppercase block">VALIDADE</span>
                          <span className="text-xs block">
                            {expiryMonth || 'MM'}/{expiryYear || 'AA'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Back */}
                    <div className="absolute w-full h-full rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 py-6 text-white flex flex-col justify-between backface-hidden rotate-y-180 shadow-lg border border-zinc-800">
                      <div className="w-full h-10 bg-zinc-800"></div>
                      <div className="px-6 flex justify-end">
                        <div className="space-y-1 text-right">
                          <span className="text-[7px] text-zinc-500 uppercase block">CVC / CVV</span>
                          <div className="bg-white text-zinc-950 font-mono text-sm font-black px-4 py-1.5 rounded text-right min-w-[60px] italic">
                            {cvv || '•••'}
                          </div>
                        </div>
                      </div>
                      <div className="px-6 flex justify-between items-center text-[7px] text-zinc-600 font-bold uppercase tracking-wider">
                        <span>Checkout Transparente</span>
                        <span>MERCADO PAGO</span>
                      </div>
                    </div>
                  </div>
                </div>

                <h4 className="font-bold text-zinc-800 text-xs uppercase tracking-wider border-b border-zinc-50 pb-2">Informações de Cobrança</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">E-mail do Comprador</label>
                    <input
                      type="email"
                      required
                      className="w-full h-11 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-xs"
                      placeholder="comprador@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">CPF do Titular</label>
                    <input
                      type="text"
                      required
                      className="w-full h-11 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-xs"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={e => handleCpfChange(e.target.value)}
                    />
                  </div>
                </div>

                <h4 className="font-bold text-zinc-800 text-xs uppercase tracking-wider border-b border-zinc-50 pb-2 pt-2">Dados do Cartão</h4>
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Número do Cartão</label>
                  <input
                    type="text"
                    required
                    className="w-full h-11 rounded-xl border border-zinc-200 px-4 font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-xs tracking-widest"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={e => handleCardNumberChange(e.target.value)}
                    onFocus={() => setCardFocused(false)}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Nome impresso no Cartão</label>
                  <input
                    type="text"
                    required
                    className="w-full h-11 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-xs uppercase"
                    placeholder="JOÃO DE SOUZA"
                    value={cardholderName}
                    onChange={e => setCardholderName(e.target.value)}
                    onFocus={() => setCardFocused(false)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Mês Venc.</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      className="w-full h-11 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-xs text-center"
                      placeholder="MM (ex: 08)"
                      value={expiryMonth}
                      onChange={e => setExpiryMonth(e.target.value.replace(/\D/g, ''))}
                      onFocus={() => setCardFocused(false)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Ano Venc.</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      className="w-full h-11 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-xs text-center"
                      placeholder="AA (ex: 28)"
                      value={expiryYear}
                      onChange={e => setExpiryYear(e.target.value.replace(/\D/g, ''))}
                      onFocus={() => setCardFocused(false)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Código CVV</label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      className="w-full h-11 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-xs text-center font-mono"
                      placeholder="123"
                      value={cvv}
                      onChange={e => setCvv(e.target.value.replace(/\D/g, ''))}
                      onFocus={() => setCardFocused(true)}
                      onBlur={() => setCardFocused(false)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Opções de Parcelamento</label>
                  <select
                    className="w-full h-11 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-xs"
                    value={installments}
                    onChange={e => setInstallments(e.target.value)}
                  >
                    <option value="1">1x de {formatCurrency(fee)} (Sem Juros)</option>
                    <option value="2">2x de {formatCurrency(fee / 2)} (Sem Juros)</option>
                    <option value="3">3x de {formatCurrency(fee / 3)} (Sem Juros)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={calculating}
                  className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  Pagar {formatCurrency(fee)} Agora <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* STEP: GENERATING OR PROCESSING CARD */}
        {(checkoutStep === 'generating' || checkoutStep === 'card_processing') && (
          <div className="p-16 flex flex-col items-center justify-center space-y-6 text-center animate-pulse">
            <RefreshCcw className="w-16 h-16 text-emerald-600 animate-spin" />
            <div>
              <h3 className="text-xl font-black text-zinc-900">
                {checkoutStep === 'generating' ? 'Gerando Código PIX...' : 'Processando Transação...'}
              </h3>
              <p className="text-sm text-zinc-500 mt-2 font-medium">Por favor, não feche esta página ou recarregue.</p>
            </div>
          </div>
        )}

        {checkoutStep === 'pix_generated' && pixData && (
          <div className="p-8 space-y-5 text-center">
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" /> PIX Gerado com sucesso!
            </div>

            {/* QR Code */}
            {pixData.qr_code_base64 && (
              <div className="w-48 h-48 bg-white border border-zinc-100 rounded-3xl flex items-center justify-center mx-auto shadow-md p-3">
                <img
                  src={`data:image/png;base64,${pixData.qr_code_base64}`}
                  alt="QR Code PIX"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Value */}
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Valor a pagar</p>
              <p className="text-3xl font-black text-emerald-600 mt-1">{formatCurrency(pixData.amount)}</p>
            </div>

            {/* Copy-Paste Code */}
            {pixData.qr_code && (
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Código Copia e Cola</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    className="flex-1 h-12 rounded-xl border border-zinc-200 px-4 font-mono text-xs text-zinc-500 bg-zinc-50 outline-none"
                    value={pixData.qr_code}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(pixData.qr_code);
                      alert('Código PIX copiado!');
                    }}
                    className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-emerald-50"
                  >
                    <Copy className="w-4 h-4" /> Copiar
                  </button>
                </div>
              </div>
            )}

            {/* Auto-polling indicator */}
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-center gap-3">
                <div className="relative w-10 h-10 flex-shrink-0">
                  {/* Spinning ring */}
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="#e4e4e7" strokeWidth="3" />
                    <circle
                      cx="20" cy="20" r="16" fill="none"
                      stroke="#059669" strokeWidth="3"
                      strokeDasharray={`${(5 - pixCountdown) / 5 * 100.53} 100.53`}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-emerald-700">
                    {pixCountdown}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-zinc-900">Verificando pagamento automaticamente</p>
                  <p className="text-[10px] text-zinc-400 font-medium">Próxima verificação em {pixCountdown}s — pague o PIX acima e aguarde</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-1 border-t border-zinc-100">
              <button
                type="button"
                onClick={handleCheckPixStatus}
                disabled={checkingPix}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCcw className={`w-4 h-4 ${checkingPix ? 'animate-spin' : ''}`} />
                {checkingPix ? 'Verificando...' : 'Verificar agora'}
              </button>
              <button
                type="button"
                onClick={() => setCheckoutStep('init')}
                className="text-zinc-400 font-bold hover:text-zinc-600 transition-all text-xs"
              >
                Voltar e alterar método
              </button>
            </div>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {checkoutStep === 'success' && (
          <div className="p-10 text-center space-y-6 relative overflow-hidden">
            {/* Confete CSS animado */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
              {[...Array(18)].map((_, i) => (
                <span
                  key={i}
                  className="absolute w-2.5 h-2.5 rounded-sm opacity-0"
                  style={{
                    left: `${5 + (i % 9) * 11}%`,
                    top: '-10px',
                    backgroundColor: ['#059669','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#10b981'][i % 6],
                    animation: `confettiFall ${1.2 + (i % 4) * 0.3}s ease-in ${(i % 5) * 0.15}s forwards`,
                    transform: `rotate(${(i * 37) % 360}deg)`,
                  }}
                />
              ))}
            </div>
            <style>{`
              @keyframes confettiFall {
                0%   { opacity: 0; top: -10px; transform: translateX(0) rotate(0deg); }
                10%  { opacity: 1; }
                100% { opacity: 0; top: 100%; transform: translateX(${Math.random() > 0.5 ? '' : '-'}40px) rotate(540deg); }
              }
            `}</style>

            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-zinc-900">🎉 Parabéns!</h3>
              <p className="text-xl font-black text-emerald-600">Campanha Ativada!</p>
              <p className="text-zinc-500 font-medium max-w-sm mx-auto mt-1">
                Seu pagamento foi confirmado. Sua campanha já está ao vivo e pronta para receber compras!
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 font-mono text-xs text-zinc-600 space-y-1 text-left max-w-xs mx-auto">
              <p><strong>Identificador:</strong> {pixData?.id || cardResult?.id || 'Audit-MP'}</p>
              <p><strong>Método:</strong> {paymentMethod === 'pix' ? 'PIX' : 'Cartão'}</p>
              <p><strong>Status:</strong> <span className="text-emerald-600 font-black">approved ✔</span></p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <Rocket className="w-5 h-5" />
              Ir para minha Campanha
            </button>
          </div>
        )}

        {/* STEP: ERROR */}
        {checkoutStep === 'error' && (
          <div className="p-10 text-center space-y-6">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 shadow-inner">
              <X className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-zinc-900">Falha no Pagamento</h3>
              <p className="text-red-600 font-bold text-sm bg-red-50 border border-red-100 p-4 rounded-xl max-w-md mx-auto mt-2">
                {errorMessage}
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setCheckoutStep('init')}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Tentar Outro Método
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// --- Componentes de Configuração de Pagamento ---
const PixConfigPanel = ({ user, onBack }: { user: User, onBack: () => void }) => {
  const [pixType, setPixType] = useState('cpf');
  const [pixKey, setPixKey] = useState('');
  const [pixName, setPixName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    fetchJsonWithAuth('/api/payment-configs/me')
      .then(({ config }) => {
        if (!active) return;
        if (config) {
          setPixType(config.pix_key_type || 'cpf');
          setPixKey(config.pix_key || '');
          setPixName(config.pix_holder_name || '');
        }
      })
      .catch((err) => alert(err.message || 'Erro ao carregar configuracao PIX'))
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchJsonWithAuth('/api/payment-configs/me', {
        method: 'POST',
        body: JSON.stringify({
          pix_key_type: pixType,
          pix_key: pixKey,
          pix_holder_name: pixName
        })
      });
      alert('Configuração PIX salva com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const pixTypes = [
    { value: 'cpf', label: 'CPF/CNPJ' },
    { value: 'email', label: 'E-mail' },
    { value: 'phone', label: 'Telefone' },
    { value: 'random', label: 'Chave Aleatória' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900">Configurar PIX</h1>
            <p className="text-zinc-400 font-medium">Configure sua chave PIX para recebimentos</p>
          </div>
        </div>
        <button onClick={onBack} className="bg-white border border-zinc-100 px-6 py-3 rounded-2xl text-zinc-400 font-bold text-sm flex items-center gap-2 hover:border-zinc-300 transition-all">
          <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
        </button>
      </header>

      {!loaded ? (
        <div className="glass-card p-12 text-center">
          <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="glass-card p-8 space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Tipo de Chave</label>
            <div className="flex bg-zinc-100 p-1 rounded-2xl">
              {pixTypes.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setPixType(t.value)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${pixType === t.value ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Chave PIX</label>
            <input
              type="text"
              placeholder={pixType === 'cpf' ? '000.000.000-00' : pixType === 'email' ? 'seu@email.com' : pixType === 'phone' ? '(11) 99999-9999' : 'Cole sua chave aleatória'}
              className="w-full h-14 rounded-2xl border border-zinc-200 px-5 font-medium outline-none focus:ring-2 focus:ring-emerald-500 text-lg"
              value={pixKey}
              onChange={e => setPixKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Nome do Titular</label>
            <input
              type="text"
              placeholder="Nome completo do titular da conta"
              className="w-full h-14 rounded-2xl border border-zinc-200 px-5 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              value={pixName}
              onChange={e => setPixName(e.target.value)}
            />
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-emerald-800 text-sm">Pagamento manual</p>
              <p className="text-xs text-emerald-700 mt-1">Ao usar PIX, os compradores verão sua chave e farão a transferência. Você precisará confirmar o pagamento manualmente no painel.</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !pixKey || !pixName}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Salvar Configuração PIX'}
          </button>
        </div>
      )}
    </div>
  );
};

const MpConfigPanel = ({ user, onBack }: { user: User, onBack: () => void }) => {
  const [accessToken, setAccessToken] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    let active = true;

    fetchJsonWithAuth('/api/payment-configs/me')
      .then(({ config }) => {
        if (!active) return;
        if (config) {
          setAccessToken(config.mp_access_token || '');
          setPublicKey(config.mp_public_key || '');
        }
      })
      .catch((err) => alert(err.message || 'Erro ao carregar configuracao Mercado Pago'))
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchJsonWithAuth('/api/payment-configs/me', {
        method: 'POST',
        body: JSON.stringify({
          mp_access_token: accessToken,
          mp_public_key: publicKey
        })
      });
      alert('Configuração Mercado Pago salva com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900">Configurar Mercado Pago</h1>
            <p className="text-zinc-400 font-medium">Integração automática de pagamentos</p>
          </div>
        </div>
        <button onClick={onBack} className="bg-white border border-zinc-100 px-6 py-3 rounded-2xl text-zinc-400 font-bold text-sm flex items-center gap-2 hover:border-zinc-300 transition-all">
          <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
        </button>
      </header>

      {!loaded ? (
        <div className="glass-card p-12 text-center">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="glass-card p-8 space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Public Key</label>
            <input
              type="text"
              placeholder="APP_USR-..."
              className="w-full h-14 rounded-2xl border border-zinc-200 px-5 font-medium outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              value={publicKey}
              onChange={e => setPublicKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Access Token</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                placeholder="APP_USR-..."
                className="w-full h-14 rounded-2xl border border-zinc-200 px-5 pr-14 font-medium outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-all"
              >
                {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-blue-800 text-sm">Pagamento automático</p>
              <p className="text-xs text-blue-700 mt-1">Com Mercado Pago, os pagamentos são confirmados automaticamente. A campanha é ativada assim que o pagamento for detectado.</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Onde encontrar suas credenciais?</p>
              <p className="text-xs text-amber-700 mt-1">Acesse <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener noreferrer" className="underline font-bold">Mercado Pago Developers</a> → Suas integrações → Credenciais de produção.</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !accessToken || !publicKey}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Salvar Configuração Mercado Pago'}
          </button>
        </div>
      )}
    </div>
  );
};

// --- Components ---

const Navbar = ({ user, onLogout, onNavigate, settings }: { user: User | null, onLogout: () => void, onNavigate: (page: string) => void, settings: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleScrollToSection = (sectionId: string) => {
    onNavigate('home');
    setIsOpen(false);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <nav className="bg-white border-b border-zinc-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center cursor-pointer" onClick={() => handleScrollToSection('home')}>
            {settings?.site_logo_url ? (
              <img src={settings.site_logo_url} alt="Logo" className="h-14 w-auto object-contain" />
            ) : (
              <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-100"><Ticket className="text-white w-8 h-8" /></div>
            )}
          </div>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => handleScrollToSection('home')} className="text-sm font-medium text-zinc-600 hover:text-[var(--primary-color)] transition-colors">Início</button>
            <button onClick={() => handleScrollToSection('campanhas')} className="text-sm font-medium text-zinc-600 hover:text-[var(--primary-color)] transition-colors">Sorteios</button>
            <button onClick={() => handleScrollToSection('como-funciona')} className="text-sm font-medium text-zinc-600 hover:text-[var(--primary-color)] transition-colors">Como Funciona</button>
            <button onClick={() => handleScrollToSection('vantagens')} className="text-sm font-medium text-zinc-600 hover:text-[var(--primary-color)] transition-colors">Vantagens</button>
            <button onClick={() => handleScrollToSection('duvidas')} className="text-sm font-medium text-zinc-600 hover:text-[var(--primary-color)] transition-colors">Dúvidas</button>
            
            {user ? (
              <>
                <button onClick={() => onNavigate('dashboard')} className="text-sm font-medium text-zinc-600 hover:text-[var(--primary-color)] pr-2 pl-4 border-l border-zinc-100 transition-colors">Meu Painel</button>
                <div className="flex items-center gap-3 pl-4 border-l border-zinc-100">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-zinc-900">{user.name}</p>
                    <button onClick={onLogout} className="text-[10px] text-zinc-400 hover:text-red-500 uppercase tracking-wider font-bold">Sair</button>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                </div>
              </>
            ) : (
              <button 
                onClick={() => onNavigate('login')} 
                style={{ backgroundColor: settings?.primary_color || '#00d18e' }}
                className="text-white px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
              >
                Entrar / Criar Rifa
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-zinc-600">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-zinc-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <button onClick={() => handleScrollToSection('home')} className="block w-full text-left text-lg font-medium text-zinc-900">Início</button>
              <button onClick={() => handleScrollToSection('campanhas')} className="block w-full text-left text-lg font-medium text-zinc-900">Sorteios</button>
              <button onClick={() => handleScrollToSection('como-funciona')} className="block w-full text-left text-lg font-medium text-zinc-900">Como Funciona</button>
              <button onClick={() => handleScrollToSection('vantagens')} className="block w-full text-left text-lg font-medium text-zinc-900">Vantagens</button>
              <button onClick={() => handleScrollToSection('duvidas')} className="block w-full text-left text-lg font-medium text-zinc-900">Dúvidas</button>
              {user ? (
                <>
                  <button onClick={() => { onNavigate('dashboard'); setIsOpen(false); }} className="block w-full text-left text-lg font-medium text-zinc-900 border-t border-zinc-100 pt-4">Meu Painel</button>
                  <button onClick={() => { onLogout(); setIsOpen(false); }} className="block w-full text-left text-lg font-medium text-red-600">Sair</button>
                </>
              ) : (
                <button 
                  onClick={() => { onNavigate('login'); setIsOpen(false); }} 
                  style={{ backgroundColor: settings?.primary_color || '#00d18e' }}
                  className="block w-full text-center text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all"
                >
                  Entrar / Criar Rifa
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Sidebar = ({ activeTab, onNavigate, onLogout, user, globalSettings, onNavigateRoot }: { activeTab: string, onNavigate: (tab: string) => void, onLogout: () => void, user: User, globalSettings: any, onNavigateRoot?: (page: string) => void }) => {
  const organizerItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'my-campaigns', label: 'Minhas campanhas', icon: Ticket },
    { id: 'supporters', label: 'Meus apoiadores', icon: Users },
    { id: 'settings', label: 'Configuração', icon: SettingsIcon },
    { id: 'support', label: 'Suporte', icon: Shield },
  ];

  const adminItems = [
    { id: 'stats', label: 'Financeiro', icon: DollarSign },
    { id: 'users', label: 'Organizadores', icon: Users },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
  ];

  const menuItems = user.role === 'super_admin' ? adminItems : organizerItems;
  const logoUrl = globalSettings?.site_logo_url || globalSettings?.logo_url;
  const sidebarBrandName = 'Vai Rifar?';

  return (
    <div className="w-72 bg-white border-r border-zinc-100 h-screen sticky top-0 flex flex-col p-6">
      <button
        type="button"
        onClick={() => onNavigateRoot?.('home')}
        className="mb-10 px-2 flex items-center gap-3 text-left transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl"
        aria-label="Ir para a home publica"
      >
        {logoUrl ? (
          <img src={logoUrl} alt={sidebarBrandName} className="h-14 max-w-[190px] w-auto object-contain" />
        ) : (
          <>
            <div className="bg-brand-green p-1.5 rounded-lg shrink-0">
              <Ticket className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-zinc-900">{sidebarBrandName}</span>
          </>
        )}
      </button>

      {user.role !== 'super_admin' && (
        <button
          onClick={() => onNavigate('create-campaign')}
          className="w-full btn-primary mb-8 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Criar campanha
        </button>
      )}

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full sidebar-item ${activeTab === item.id ? 'active' : ''}`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-zinc-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 truncate">{user.name}</p>
            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full py-2 text-xs font-bold text-red-500 hover:bg-red-50 uppercase tracking-widest rounded-xl transition-all">
          Sair da conta
        </button>
      </div>

      <div className="pt-4 mt-auto border-t border-zinc-100 text-[10px] text-zinc-400 flex flex-wrap gap-x-2 gap-y-1 justify-center shrink-0">
        <a href="#" onClick={(e) => { e.preventDefault(); onNavigateRoot?.('terms-of-use'); }} className="hover:text-zinc-600 transition-colors">Termos</a>
        <span>•</span>
        <a href="#" onClick={(e) => { e.preventDefault(); onNavigateRoot?.('privacy-policy'); }} className="hover:text-zinc-600 transition-colors">Privacidade</a>
        <span>•</span>
        <a href="#" onClick={(e) => { e.preventDefault(); onNavigateRoot?.('cookies-policy'); }} className="hover:text-zinc-600 transition-colors">Cookies</a>
        <span>•</span>
        <a href="#" onClick={(e) => { e.preventDefault(); onNavigateRoot?.('lgpd-form'); }} className="hover:text-zinc-600 transition-colors">LGPD</a>
      </div>
    </div>
  );
};

const DashboardCard = ({ title, value, subValue, icon: Icon, colorClass }: { title: string, value: string, subValue?: string, icon: any, colorClass: string }) => (
  <div className={`glass-card p-8 flex items-center gap-6 flex-1 min-w-[280px] border-l-8 ${colorClass}`}>
    <div className="p-4 bg-zinc-50 rounded-2xl shrink-0">
      <Icon className="w-8 h-8 text-zinc-400" />
    </div>
    <div>
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 leading-tight">{title}</p>
      <p className="text-3xl font-black text-zinc-900">{value}</p>
      {subValue && <p className="text-xs font-medium text-zinc-400 mt-1">{subValue}</p>}
    </div>
  </div>
);

const CampaignCard: React.FC<{ campaign: Campaign, onClick: () => void, onDelete?: (e: React.MouseEvent) => void }> = ({ campaign, onClick, onDelete }) => {
  const progress = campaign.total_tickets > 0 ? ((campaign.sold_count || 0) / campaign.total_tickets) * 100 : 0;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="aspect-video relative overflow-hidden">
        <img
          src={campaign.image_url || `https://picsum.photos/seed/${campaign.id}/600/400`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        {onDelete && (
          <button
            onClick={onDelete}
            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
            title="Excluir Campanha"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-black text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors">{campaign.title}</h3>
        <p className="text-zinc-500 text-sm line-clamp-2 mb-6 h-10">{campaign.description || 'Participe deste sorteio incrível e concorra a prêmios sensacionais!'}</p>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Por apenas</p>
              <p className="text-2xl font-black text-emerald-600">R$ {campaign.ticket_price.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Sorteio em</p>
              <p className="text-sm font-bold text-zinc-900">{new Date(campaign.draw_date).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-emerald-600">{progress.toFixed(0)}% Vendido</span>
              <span className="text-zinc-400">{campaign.sold_count} / {campaign.total_tickets}</span>
            </div>
            <div className="progress-bar-premium">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="progress-fill-premium"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div >
  );
};

const CampaignRow: React.FC<{ campaign: Campaign, onSelect: (c: Campaign) => void, isDashboard?: boolean }> = ({ campaign, onSelect, isDashboard }) => {
  const progress = campaign.total_tickets > 0 ? ((campaign.sold_count || 0) / campaign.total_tickets) * 100 : 0;

  return (
    <div className="glass-card p-6 flex items-center gap-6 hover:shadow-md transition-all group">
      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-100 shrink-0">
        <img src={campaign.image_url || `https://picsum.photos/seed/${campaign.id}/200/200`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-zinc-900 text-lg truncate">{campaign.title}</h3>
          <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${campaign.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
            }`}>
            {campaign.status === 'active' ? 'Ativa' : 'Pendente'}
          </span>
        </div>

        <p className="text-xs text-zinc-400 mb-4">Em andamento</p>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="progress-fill-premium"
            />
          </div>
          <span className="text-xs font-bold text-zinc-400">{progress.toFixed(2)}% vendido</span>
          <span className="text-xs font-bold text-zinc-900">{campaign.sold_count} de {campaign.total_tickets}</span>
        </div>
      </div>

      <button
        onClick={() => onSelect(campaign)}
        className="px-6 py-2 text-brand-green font-bold text-xs uppercase tracking-widest hover:bg-emerald-50 rounded-xl transition-all"
      >
        {isDashboard ? 'EDITAR CAMPANHA' : 'Ver Página'}
      </button>
    </div>
  );
};

const ManageCampaign = ({ campaign, onBack, onView, onEdit, globalSettings, onRefresh, setShowOrderDetails, user }: { campaign: Campaign, onBack: () => void, onView: (c: Campaign) => void, onEdit: (c: Campaign) => void, globalSettings: any, onRefresh: () => void, setShowOrderDetails: (order: any) => void, user: User }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showValue, setShowValue] = useState(false);
  const [realSoldCount, setRealSoldCount] = useState<number>(campaign.sold_count || 0);
  const [realRevenue, setRealRevenue] = useState<number>(0);
  const [sales, setSales] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [winningTickets, setWinningTickets] = useState<any[]>([]);
  const [minMaxResult, setMinMaxResult] = useState<any>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawWinner, setDrawWinner] = useState<any>(null);
  const [drawResultNumbers, setDrawResultNumbers] = useState<number[]>([]);
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [winnersList, setWinnersList] = useState<any[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const fetchRealStats = async () => {
      // Pedidos pagos para a barra de progresso e receita
      const { data: paidOrders } = await supabase
        .from('orders')
        .select('reserved_numbers, total_amount, ticket_count')
        .eq('campaign_id', campaign.id)
        .eq('status', 'paid');

      if (paidOrders) {
        const soldCount = paidOrders.reduce((acc, o) =>
          acc + (o.reserved_numbers?.length || o.ticket_count || 0), 0);
        const revenue = paidOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
        setRealSoldCount(soldCount);
        setRealRevenue(revenue);
      }

      // Todos os pedidos para o modal de vendas
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false });

      if (allOrders) {
        setSales(allOrders);

        // Calcular ranking
        const rakingMap = new Map();
        allOrders.filter(o => o.status === 'paid').forEach(o => {
          const key = o.customer_email || o.customer_phone || o.customer_name;
          if (!rakingMap.has(key)) {
            rakingMap.set(key, { name: o.customer_name, tickets: 0 });
          }
          const current = rakingMap.get(key);
          current.tickets += (o.reserved_numbers?.length || o.ticket_count || 0);
        });

        const sortedRanking = Array.from(rakingMap.values() as Iterable<{ name: string; tickets: number }>)
          .sort((a, b) => b.tickets - a.tickets)
          .map((item, index) => ({ ...item, rank: index + 1 }));

        setRanking(sortedRanking);
      }

      // Buscar títulos premiados
      const { data: winTickets } = await supabase
        .from('winning_tickets')
        .select('*')
        .eq('campaign_id', campaign.id);

      if (winTickets) {
        // Verificar se os títulos já foram encontrados nos pedidos pagos
        const paidNumbers = new Set();
        allOrders?.filter(o => o.status === 'paid').forEach(o => {
          if (o.reserved_numbers) o.reserved_numbers.forEach((n: number) => paidNumbers.add(n));
        });

        const updatedWinTickets = winTickets.map(t => ({
          ...t,
          found: paidNumbers.has(parseInt(t.ticket_number))
        }));
        setWinningTickets(updatedWinTickets);
      }
    };
    fetchRealStats();
  }, [campaign.id]);

  const handleAddWinningTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const ticket_number = (form.elements.namedItem('ticket_number') as HTMLInputElement).value;
    const prize_name = (form.elements.namedItem('prize_name') as HTMLInputElement).value;

    if (!ticket_number || !prize_name) return;

    const { error } = await supabase.from('winning_tickets').insert({
      campaign_id: campaign.id,
      ticket_number,
      prize_name,
      status: 'available'
    });

    if (error) {
      alert('Erro ao cadastrar título: ' + error.message);
    } else {
      setActiveModal('winning-tickets');
      // Recarregar stats para atualizar lista
      const { data: winTickets } = await supabase
        .from('winning_tickets')
        .select('*')
        .eq('campaign_id', campaign.id);
      if (winTickets) setWinningTickets(winTickets);
    }
  };

  const handleDeleteWinningTicket = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este título premiado?')) return;
    const { error } = await supabase.from('winning_tickets').delete().eq('id', id);
    if (!error) {
      setWinningTickets(prev => prev.filter(t => t.id !== id));
    }
  };

  const campaignUrl = `${window.location.origin}/?rifa=${campaign.slug || campaign.id}`;
  const shareMessage = `Confira essa rifa: ${campaign.title}. Participe agora! ${campaignUrl}`;

  const progress = campaign.total_tickets > 0 ? (realSoldCount / campaign.total_tickets) * 100 : 0;

  const ActionButton = ({ icon: Icon, label, onClick, color = "text-zinc-600" }: any) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 p-6 glass-card hover:border-brand-orange transition-all group"
    >
      <div className={`p-3 rounded-2xl bg-zinc-50 group-hover:bg-orange-50 transition-all ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-bold text-zinc-900">{label}</span>
    </button>
  );

  const Modal = ({ title, children, onClose }: any) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden"
      >
        <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-zinc-50 rounded-xl transition-all">
              <ChevronRight className="rotate-180 w-5 h-5 text-zinc-400" />
            </button>
            <h2 className="text-2xl font-black text-zinc-900">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-50 rounded-xl transition-all">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-50 rounded-2xl text-brand-orange">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-zinc-900">Gerenciar campanha</h1>
        </div>
        <button
          onClick={onBack}
          className="bg-white border border-zinc-100 px-6 py-3 rounded-2xl text-zinc-400 font-bold text-sm flex items-center gap-2 hover:border-zinc-300 transition-all"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
        </button>
      </header>

      <div className="flex gap-4">
        <button
          onClick={() => onView(campaign)}
          className="p-4 glass-card hover:border-brand-orange transition-all text-zinc-400 hover:text-brand-orange"
        >
          <Eye className="w-5 h-5" />
        </button>
        <button onClick={() => setActiveModal('share')} className="p-4 glass-card hover:border-brand-orange transition-all text-zinc-400 hover:text-brand-orange">
          <Share2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => onEdit(campaign)}
          className="p-4 glass-card hover:border-brand-orange transition-all text-zinc-400 hover:text-brand-orange"
        >
          <Edit3 className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveModal('tax-table')}
          className="px-6 py-3 glass-card hover:border-brand-orange transition-all text-zinc-400 font-bold text-xs flex items-center gap-2 hover:text-brand-orange"
        >
          <Eye className="w-4 h-4" /> Ver Tabela de Taxas
        </button>
      </div>

      <div className="glass-card p-10">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="w-full lg:w-72 h-72 rounded-[2.5rem] overflow-hidden bg-zinc-100 shrink-0">
            <img src={campaign.image_url || `https://picsum.photos/seed/${campaign.id}/400/400`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>

          <div className="flex-1 space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-black text-zinc-900 mb-2">{campaign.title}</h2>
                <p className="text-zinc-400 font-bold">Em andamento</p>
              </div>
              <select className={`font-bold text-xs px-4 py-2 rounded-xl border-none outline-none cursor-pointer ${campaign.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                <option value="active" disabled={campaign.status !== 'active'}>Ativa</option>
                <option value="paused" disabled={campaign.status !== 'active'}>Pausada</option>
                <option value="pending" disabled={campaign.status === 'active'}>Pendente</option>
                <option value="finished">Finalizada</option>
              </select>
            </div>

            {campaign.status === 'pending' && (
              <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl space-y-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-amber-800 text-sm font-bold">Publique essa ação em até 72h ou ela vai expirar.</p>
                </div>
                <button
                  onClick={() => setActiveModal('publish')}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <Rocket className="w-5 h-5" /> Publicar Campanha
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div className="h-3 progress-bar-premium">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="progress-fill-premium"
                />
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-brand-green">{progress.toFixed(2)} % vendido</span>
                <span className="text-zinc-400">{realSoldCount} de {campaign.total_tickets}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-brand-green">
                {showValue ? `R$ ${realRevenue.toFixed(2)}` : 'R$ ****'}
              </span>
              <button onClick={() => setShowValue(!showValue)} className="text-zinc-300 hover:text-zinc-500 transition-all">
                {showValue ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12">
        <ActionButton
          icon={TrendingUp}
          label="Minhas vendas"
          onClick={() => setActiveModal('sales')}
        />
        <ActionButton
          icon={Ticket}
          label="Título premiado"
          onClick={() => setActiveModal('winning-tickets')}
        />
        <ActionButton
          icon={TrendingUp}
          label="Ranking"
          onClick={() => setActiveModal('ranking')}
        />
        <ActionButton
          icon={Search}
          label="Maior e Menor título"
          onClick={() => setActiveModal('min-max-tickets')}
        />
        <ActionButton
          icon={RotateCcw}
          label={campaign.status === 'finished' ? "Sorteio Realizado" : "Realizar sorteio"}
          onClick={() => {
            if (campaign.status === 'finished') {
              alert('Esta campanha já foi finalizada e o sorteio já foi realizado.');
              return;
            }
            setActiveModal('perform-draw');
          }}
          color={campaign.status === 'finished' ? "text-zinc-400 cursor-not-allowed" : "text-brand-orange"}
        />
      </div>

      <AnimatePresence>
        {activeModal === 'sales' && (
          <Modal title="Minhas vendas" onClose={() => setActiveModal(null)}>
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input type="text" placeholder="Buscar..." className="w-full h-12 bg-zinc-50 border border-zinc-100 rounded-xl pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-orange" />
                </div>
                <button className="px-6 h-12 glass-card flex items-center gap-2 text-sm font-bold text-zinc-600"><Filter className="w-4 h-4" /> Filtro</button>
                <button className="px-6 h-12 glass-card flex items-center gap-2 text-sm font-bold text-zinc-600"><TrendingUp className="w-4 h-4" /> Relatório</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 text-white text-[10px] uppercase tracking-widest font-bold">
                      <th className="p-4 rounded-l-xl">Apoiador</th>
                      <th className="p-4">Data</th>
                      <th className="p-4">Origem</th>
                      <th className="p-4">Valor</th>
                      <th className="p-4">Títulos</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 rounded-r-xl">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium text-zinc-600">
                    {sales.map(sale => (
                      <tr key={sale.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-all">
                        <td className="p-4 text-zinc-900 font-bold">{sale.customer_name || 'Sem nome'}</td>
                        <td className="p-4 text-xs">{new Date(sale.created_at).toLocaleString()}</td>
                        <td className="p-4 text-xs">Direto</td>
                        <td className="p-4 text-zinc-900 font-bold">R$ {(sale.total_amount || 0).toFixed(2)}</td>
                        <td className="p-4">{sale.reserved_numbers?.length || sale.ticket_count || 0}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${sale.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                            sale.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                            }`}>
                            {sale.status === 'paid' ? 'Aprovado' :
                              sale.status === 'pending' ? 'Pendente' :
                                sale.status === 'cancelled' ? 'Cancelado' : sale.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setShowOrderDetails(sale)}
                            className="p-2 hover:bg-zinc-100 rounded-lg transition-all text-brand-orange"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'winning-tickets' && (
          <Modal title="Título premiado" onClose={() => setActiveModal(null)}>
            <div className="space-y-8">
              <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-6 bg-zinc-200 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                  <span className="text-sm font-bold text-zinc-600">Deixar o bilhete premiado visível para os participantes</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex bg-zinc-100 p-1 rounded-2xl">
                  <button className="px-8 py-3 rounded-xl text-sm font-bold bg-white text-brand-orange shadow-sm">Todos</button>
                  <button className="px-8 py-3 rounded-xl text-sm font-bold text-zinc-400">Disponível</button>
                  <button className="px-8 py-3 rounded-xl text-sm font-bold text-zinc-400">Encontrado</button>
                </div>
                <button onClick={() => setActiveModal('add-winning-ticket')} className="bg-brand-orange text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all">
                  Cadastrar título
                </button>
              </div>
              <div className="space-y-4">
                {winningTickets.length > 0 ? (
                  winningTickets.map(ticket => (
                    <div key={ticket.id} className="p-6 glass-card flex items-center justify-between group hover:border-brand-orange transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-xl font-black text-brand-orange">
                          {ticket.ticket_number}
                        </div>
                        <div>
                          <p className="font-black text-zinc-900">{ticket.prize_name}</p>
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                            {ticket.found ? '🏆 Encontrado' : '⏳ Disponível'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteWinningTicket(ticket.id)}
                        className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-20 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                      <Ticket className="w-10 h-10 text-zinc-200" />
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 mb-2">Nenhum título encontrado</h3>
                    <p className="text-zinc-400 font-medium mb-8">Clique em cadastrar título</p>
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'add-winning-ticket' && (
          <Modal title="Cadastrar título premiado" onClose={() => setActiveModal('winning-tickets')}>
            <form onSubmit={handleAddWinningTicket} className="space-y-6 max-w-md mx-auto py-8">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Número do Título</label>
                <input name="ticket_number" type="text" placeholder="Ex: 123" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange" required />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Prêmio Especial</label>
                <input name="prize_name" type="text" placeholder="Ex: iPhone 15 Pro" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange" required />
              </div>
              <button type="submit" className="w-full bg-brand-orange text-white py-5 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all">
                CADASTRAR E SALVAR
              </button>
            </form>
          </Modal>
        )}

        {activeModal === 'ranking' && (
          <Modal title="Ranking" onClose={() => setActiveModal(null)}>
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="relative w-72">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input type="text" placeholder="Filtro de data" className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-orange" />
                </div>
                <button onClick={() => setActiveModal('add-ranking-prize')} className="bg-brand-orange text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all">
                  Cadastrar prêmio
                </button>
              </div>
              <div className="flex items-center gap-4 p-6 bg-zinc-50 rounded-3xl">
                <div className="w-12 h-6 bg-brand-orange rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
                <span className="text-sm font-bold text-zinc-600">Deixar o ranking visível para os participantes</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ranking.map((item, i) => (
                  <div key={i} className="p-6 glass-card flex items-center justify-between group hover:border-brand-orange transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${item.rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                        item.rank === 2 ? 'bg-zinc-100 text-zinc-400' :
                          item.rank === 3 ? 'bg-orange-100 text-orange-600' : 'text-zinc-900'
                        }`}>
                        {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `${item.rank}º`}
                      </div>
                      <span className="font-bold text-zinc-900 text-sm truncate max-w-[180px]">{item.name || 'Apoiador'}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Ticket className="w-4 h-4" />
                      <span className="text-xs font-black">{item.tickets}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'add-ranking-prize' && (
          <Modal title="Prêmio top apoiador" onClose={() => setActiveModal('ranking')}>
            <form className="space-y-6 max-w-md mx-auto py-8">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Prêmio</label>
                <input type="text" placeholder="Nome do prêmio" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange" />
              </div>
              <button className="w-full bg-brand-orange text-white py-5 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all">
                Adicionar prêmio
              </button>
            </form>
          </Modal>
        )}

        {activeModal === 'min-max-tickets' && (
          <Modal title="Maior e Menor título" onClose={() => setActiveModal(null)}>
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="font-bold text-zinc-900">Buscar por:</p>
                  <button
                    onClick={async () => {
                      const paidOrders = sales.filter(o => o.status === 'paid');
                      let allNumbers: number[] = [];
                      paidOrders.forEach(o => {
                        if (o.reserved_numbers) allNumbers.push(...o.reserved_numbers);
                      });
                      if (allNumbers.length > 0) {
                        const min = Math.min(...allNumbers);
                        const order = paidOrders.find(o => o.reserved_numbers?.includes(min));
                        setMinMaxResult({ type: 'Menor', number: min, customer: order?.customer_name });
                      }
                    }}
                    className="w-full bg-zinc-50 hover:bg-zinc-100 p-4 rounded-2xl flex items-center justify-between transition-all"
                  >
                    <span className="font-bold text-zinc-600">Menor título vendido</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>
                  <button
                    onClick={async () => {
                      const paidOrders = sales.filter(o => o.status === 'paid');
                      let allNumbers: number[] = [];
                      paidOrders.forEach(o => {
                        if (o.reserved_numbers) allNumbers.push(...o.reserved_numbers);
                      });
                      if (allNumbers.length > 0) {
                        const max = Math.max(...allNumbers);
                        const order = paidOrders.find(o => o.reserved_numbers?.includes(max));
                        setMinMaxResult({ type: 'Maior', number: max, customer: order?.customer_name });
                      }
                    }}
                    className="w-full bg-zinc-50 hover:bg-zinc-100 p-4 rounded-2xl flex items-center justify-between transition-all"
                  >
                    <span className="font-bold text-zinc-600">Maior título vendido</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              </div>
              {minMaxResult && (
                <div className="pt-8 border-t border-zinc-100 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="font-bold text-zinc-900 mb-6">Resultado ({minMaxResult.type})</h3>
                  <div className="p-8 bg-emerald-50 rounded-[2rem] flex items-center gap-6">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-3xl font-black text-emerald-600 shadow-sm">
                      {minMaxResult.number}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Comprador</p>
                      <p className="text-xl font-black text-zinc-900">{minMaxResult.customer || 'Anônimo'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}


        {activeModal === 'add-winning-ticket' && (
          <Modal title="Cadastrar título premiado" onClose={() => setActiveModal('winning-tickets')}>
            <form onSubmit={handleAddWinningTicket} className="space-y-6 max-w-md mx-auto py-8">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Número do Título</label>
                <input name="ticket_number" type="text" placeholder="Ex: 123" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange" required />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Prêmio Especial</label>
                <input name="prize_name" type="text" placeholder="Ex: iPhone 15 Pro" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange" required />
              </div>
              <button type="submit" className="w-full bg-brand-orange text-white py-5 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all">
                CADASTRAR E SALVAR
              </button>
            </form>
          </Modal>
        )}

        {activeModal === 'ranking' && (
          <Modal title="Ranking" onClose={() => setActiveModal(null)}>
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="relative w-72">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input type="text" placeholder="Filtro de data" className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-orange" />
                </div>
                <button onClick={() => setActiveModal('add-ranking-prize')} className="bg-brand-orange text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all">
                  Cadastrar prêmio
                </button>
              </div>
              <div className="flex items-center gap-4 p-6 bg-zinc-50 rounded-3xl">
                <div className="w-12 h-6 bg-brand-orange rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
                <span className="text-sm font-bold text-zinc-600">Deixar o ranking visível para os participantes</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ranking.map((item, i) => (
                  <div key={i} className="p-6 glass-card flex items-center justify-between group hover:border-brand-orange transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${item.rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                        item.rank === 2 ? 'bg-zinc-100 text-zinc-400' :
                          item.rank === 3 ? 'bg-orange-100 text-orange-600' : 'text-zinc-900'
                        }`}>
                        {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `${item.rank}º`}
                      </div>
                      <span className="font-bold text-zinc-900 text-sm truncate max-w-[180px]">{item.name || 'Apoiador'}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Ticket className="w-4 h-4" />
                      <span className="text-xs font-black">{item.tickets}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'add-ranking-prize' && (
          <Modal title="Prêmio top apoiador" onClose={() => setActiveModal('ranking')}>
            <form className="space-y-6 max-w-md mx-auto py-8">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Prêmio</label>
                <input type="text" placeholder="Nome do prêmio" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange" />
              </div>
              <button className="w-full bg-brand-orange text-white py-5 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all">
                Adicionar prêmio
              </button>
            </form>
          </Modal>
        )}

        {activeModal === 'min-max-tickets' && (
          <Modal title="Maior e Menor título" onClose={() => setActiveModal(null)}>
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="font-bold text-zinc-900">Buscar por:</p>
                  <button
                    onClick={async () => {
                      const paidOrders = sales.filter(o => o.status === 'paid');
                      let allNumbers: number[] = [];
                      paidOrders.forEach(o => {
                        if (o.reserved_numbers) allNumbers.push(...o.reserved_numbers);
                      });
                      if (allNumbers.length > 0) {
                        const min = Math.min(...allNumbers);
                        const order = paidOrders.find(o => o.reserved_numbers?.includes(min));
                        setMinMaxResult({ type: 'Menor', number: min, customer: order?.customer_name });
                      }
                    }}
                    className="w-full bg-zinc-50 hover:bg-zinc-100 p-4 rounded-2xl flex items-center justify-between transition-all"
                  >
                    <span className="font-bold text-zinc-600">Menor título vendido</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>
                  <button
                    onClick={async () => {
                      const paidOrders = sales.filter(o => o.status === 'paid');
                      let allNumbers: number[] = [];
                      paidOrders.forEach(o => {
                        if (o.reserved_numbers) allNumbers.push(...o.reserved_numbers);
                      });
                      if (allNumbers.length > 0) {
                        const max = Math.max(...allNumbers);
                        const order = paidOrders.find(o => o.reserved_numbers?.includes(max));
                        setMinMaxResult({ type: 'Maior', number: max, customer: order?.customer_name });
                      }
                    }}
                    className="w-full bg-zinc-50 hover:bg-zinc-100 p-4 rounded-2xl flex items-center justify-between transition-all"
                  >
                    <span className="font-bold text-zinc-600">Maior título vendido</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              </div>
              {minMaxResult && (
                <div className="pt-8 border-t border-zinc-100 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="font-bold text-zinc-900 mb-6">Resultado ({minMaxResult.type})</h3>
                  <div className="p-8 bg-emerald-50 rounded-[2rem] flex items-center gap-6">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-3xl font-black text-emerald-600 shadow-sm">
                      {minMaxResult.number}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Comprador</p>
                      <p className="text-xl font-black text-zinc-900">{minMaxResult.customer || 'Anônimo'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}

        {activeModal === 'perform-draw' && (
          <Modal title="Realizar sorteio" onClose={() => {
            if (!drawing) {
              setActiveModal(null);
              setDrawWinner(null);
              setWinnersList([]);
              setCurrentPrizeIndex(0);
            }
          }}>
            <div className="space-y-8 py-8 flex flex-col items-center min-h-[400px]">
              {!drawWinner && !showCelebration ? (
                <>
                  <div className="w-32 h-32 bg-orange-50 rounded-[40px] flex items-center justify-center mb-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-brand-orange/10 animate-pulse group-hover:scale-110 transition-transform" />
                    <Gift className="w-12 h-12 text-brand-orange relative z-10" />
                  </div>
                  <div className="text-center max-w-sm">
                    <h3 className="text-3xl font-black text-zinc-900 mb-2">Sorteio de Prêmios</h3>
                    <p className="text-zinc-500 font-medium leading-relaxed">
                      Esta campanha possui <span className="text-brand-orange font-bold">{(campaign as any).prizes?.length || 1} prêmio(s)</span>.
                      {campaign.draw_type === 'federal'
                        ? 'Informe o número sorteado na Loteria Federal para cada posição.'
                        : 'O sorteio será realizado individualmente para cada posição.'}
                    </p>
                  </div>

                  <div className="w-full max-w-md bg-zinc-50 rounded-3xl p-6 border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Prêmio Atual</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-brand-orange shadow-sm border border-orange-100">
                        {currentPrizeIndex + 1}º
                      </div>
                      <p className="text-xl font-black text-zinc-900">
                        {(campaign as any).prizes?.[currentPrizeIndex]?.description || 'Prêmio Único'}
                      </p>
                    </div>
                  </div>

                  {campaign.draw_type === 'federal' ? (
                    <div className="w-full max-w-md space-y-4">
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Número Ganhador (Federal)</label>
                        <input
                          type="number"
                          id="manual-winner-number"
                          placeholder="Ex: 12345"
                          className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          const numInput = document.getElementById('manual-winner-number') as HTMLInputElement;
                          const winnerNum = parseInt(numInput?.value);
                          if (isNaN(winnerNum)) {
                            alert('Informe um número válido!');
                            return;
                          }

                          const paidOrders = sales.filter(o => o.status === 'paid');
                          const winnerOrder = paidOrders.find(o => o.reserved_numbers?.includes(winnerNum));

                          if (!winnerOrder) {
                            alert('Este número não foi vendido ou ainda não foi pago!');
                            return;
                          }

                          const prize = (campaign as any).prizes?.[currentPrizeIndex] || { description: 'Prêmio Único', position: 1 };
                          const newWinner = {
                            number: winnerNum,
                            customer: winnerOrder.customer_name || 'Anônimo',
                            prize_name: prize.description,
                            position: prize.position
                          };

                          setDrawWinner(newWinner);
                          setWinnersList(prev => [...prev, newWinner]);
                        }}
                        className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-bold shadow-xl hover:bg-zinc-800 transition-all"
                      >
                        CONFIRMAR GANHADOR
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={drawing}
                      onClick={async () => {
                        setDrawing(true);
                        const paidOrders = sales.filter(o => o.status === 'paid');
                        let allNumbers: number[] = [];
                        paidOrders.forEach(o => {
                          if (o.reserved_numbers) allNumbers.push(...o.reserved_numbers);
                        });

                        if (allNumbers.length === 0) {
                          alert('Nenhum título pago para sortear!');
                          setDrawing(false);
                          return;
                        }

                        const interval = setInterval(() => {
                          setDrawResultNumbers([
                            Math.floor(Math.random() * (campaign.total_tickets || 1000)),
                            Math.floor(Math.random() * (campaign.total_tickets || 1000)),
                            Math.floor(Math.random() * (campaign.total_tickets || 1000))
                          ]);
                        }, 80);

                        setTimeout(() => {
                          clearInterval(interval);
                          const winnerNum = allNumbers[Math.floor(Math.random() * allNumbers.length)];
                          const winnerOrder = paidOrders.find(o => o.reserved_numbers?.includes(winnerNum));
                          const prize = (campaign as any).prizes?.[currentPrizeIndex] || { description: 'Prêmio Único', position: 1 };

                          const newWinner = {
                            number: winnerNum,
                            customer: winnerOrder?.customer_name || 'Anônimo',
                            prize_name: prize.description,
                            position: prize.position
                          };

                          setDrawWinner(newWinner);
                          setWinnersList(prev => [...prev, newWinner]);
                          setDrawing(false);
                        }, 4000);
                      }}
                      className={`w-full max-w-xs py-6 rounded-3xl font-black text-lg transition-all shadow-xl hover:scale-[1.02] active:scale-95 ${drawing ? 'bg-zinc-100 text-zinc-400' : 'bg-brand-orange text-white shadow-orange-100/50 hover:bg-orange-600'
                        }`}
                    >
                      {drawing ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                          SORTEANDO...
                        </div>
                      ) : 'INICIAR SORTEIO AGORA'}
                    </button>
                  )}
                  {drawing && (
                    <div className="flex gap-4">
                      {drawResultNumbers.map((n, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-20 h-24 bg-white border-2 border-brand-orange/20 rounded-3xl flex items-center justify-center text-3xl font-black text-brand-orange shadow-inner"
                        >
                          {n}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              ) : drawWinner ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-10 py-4 w-full"
                >
                  <div className="relative inline-block">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-brand-green/30 blur-3xl rounded-full"
                    />
                    <div className="relative w-56 h-56 bg-white rounded-[60px] flex flex-col items-center justify-center text-8xl font-black text-brand-green border-8 border-brand-green shadow-[0_32px_64px_-16px_rgba(16,185,129,0.3)]">
                      <span className="text-zinc-900/10 absolute top-4 text-sm tracking-[0.4em] font-black uppercase">Vencedor</span>
                      {drawWinner.number}
                    </div>
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="absolute -top-6 -right-6 bg-yellow-400 text-white w-20 h-20 rounded-[28px] shadow-2xl flex items-center justify-center border-4 border-white rotate-12"
                    >
                      <Gift className="w-10 h-10" />
                    </motion.div>
                  </div>
                  <div>
                    <h4 className="text-emerald-600 font-black text-xl mb-4 flex items-center justify-center gap-2">
                      🏆 PARABÉNS! 🏆
                    </h4>
                    <h2 className="text-5xl font-black text-zinc-900 mb-2 leading-tight">{drawWinner.customer}</h2>
                    <div className="inline-flex items-center gap-3 bg-zinc-100 px-6 py-2 rounded-2xl">
                      <div className="w-2 h-2 bg-brand-orange rounded-full animate-ping" />
                      <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm">{drawWinner.prize_name}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 max-w-sm mx-auto">
                    {currentPrizeIndex < ((campaign as any).prizes?.length || 1) - 1 ? (
                      <button
                        onClick={() => {
                          setDrawWinner(null);
                          setCurrentPrizeIndex(prev => prev + 1);
                        }}
                        className="flex-1 bg-brand-orange text-white h-16 rounded-3xl font-black shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                      >
                        PRÓXIMO PRÊMIO <ArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          // Finalizar campanha e salvar ganhadores
                          const { error } = await supabase
                            .from('campaigns')
                            .update({
                              status: 'finished',
                              winners: winnersList
                            })
                            .eq('id', campaign.id);

                          if (error) {
                            alert('Erro ao finalizar: ' + error.message);
                          } else {
                            setShowCelebration(true);
                            setDrawWinner(null);
                            onRefresh();
                          }
                        }}
                        className="flex-1 bg-zinc-900 text-white h-16 rounded-3xl font-black shadow-xl hover:bg-zinc-800 transition-all"
                      >
                        ENCERRAR E PUBLICAR GANHADORES
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-8"
                >
                  <div className="text-8xl">🎉</div>
                  <h2 className="text-4xl font-black text-zinc-900">Sorteio Finalizado!</h2>
                  <p className="text-zinc-500 font-medium">Todos os prêmios foram sorteados e a campanha está encerrada.</p>
                  <div className="space-y-4 text-left bg-zinc-50 p-8 rounded-[40px] border border-zinc-100">
                    {winnersList.map((w, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-zinc-100 last:border-0 pb-4 last:pb-0 pt-4 first:pt-0">
                        <div className="w-8 h-8 bg-brand-orange/10 text-brand-orange rounded-lg flex items-center justify-center font-bold text-xs">
                          {idx + 1}º
                        </div>
                        <div>
                          <p className="font-black text-zinc-900">{w.customer}</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{w.prize_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setShowCelebration(false);
                      setWinnersList([]);
                      setCurrentPrizeIndex(0);
                      setActiveModal(null);
                    }}
                    className="w-full bg-zinc-900 text-white py-5 rounded-3xl font-black hover:bg-zinc-800 transition-all shadow-xl"
                  >
                    FECHAR PAINEL
                  </button>
                </motion.div>
              )}
            </div>
          </Modal>
        )}

        {activeModal === 'share' && (
          <Modal title="Compartilhar campanha" onClose={() => setActiveModal(null)}>
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank')}
                  className="h-20 glass-card flex flex-col items-center justify-center gap-2 text-emerald-500 hover:bg-emerald-50 transition-all"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase">Whatsapp</span>
                </button>
                <button
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}`, '_blank')}
                  className="h-20 glass-card flex flex-col items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase">Facebook</span>
                </button>
                <button
                  onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(campaignUrl)}&text=${encodeURIComponent(shareMessage)}`, '_blank')}
                  className="h-20 glass-card flex flex-col items-center justify-center gap-2 text-sky-500 hover:bg-sky-50 transition-all"
                >
                  <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase">Telegram</span>
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Link da rifa</label>
                  <div className="relative group">
                    <input
                      type="text"
                      readOnly
                      value={campaignUrl}
                      className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 pr-12 text-sm outline-none font-bold text-brand-orange"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(campaignUrl);
                        alert('Link copiado!');
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-orange hover:bg-orange-50 p-2 rounded-lg transition-all"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'tax-table' && (
          <TaxTableModal onClose={() => setActiveModal(null)} settings={globalSettings} />
        )}

        {activeModal === 'publish' && (
          <PublishModal
            campaign={campaign}
            onClose={() => setActiveModal(null)}
            onPublished={onRefresh}
            settings={globalSettings}
            globalSettings={globalSettings}
            user={user!}
          />
        )}
      </AnimatePresence>
    </div >
  );
};

// --- Pages ---

const HomePage = ({ campaigns, onSelectCampaign, settings, onNavigate, user }: { campaigns: Campaign[], onSelectCampaign: (c: Campaign) => void, settings: any, onNavigate: (page: string) => void, user: any }) => {
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const finishedCampaigns = campaigns.filter(c => c.status === 'finished');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const howItWorks = (() => { try { return JSON.parse(settings?.landing_how_it_works || '[]'); } catch { return []; } })();
  const features = (() => { try { return JSON.parse(settings?.landing_features || '[]'); } catch { return []; } })();
  const faqItems = (() => { try { return JSON.parse(settings?.landing_faq || '[]'); } catch { return []; } })();
  const ctaText = settings?.landing_cta_text || 'Aqui você cria a sua campanha e recebe a arrecadação diretamente em sua conta!';
  const iconMap: Record<string, any> = { Shield, Zap, Star, Globe, Users, CheckCircle2, Rocket, Gift, DollarSign, Ticket, Clock, Eye, Trophy };

  return (
    <div className="w-full min-h-screen bg-[#fafbfe] relative overflow-hidden pb-12">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[400px] right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-20 px-4 max-w-7xl mx-auto text-center space-y-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none -z-10" />
        
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/80 text-xs font-bold shadow-sm tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Sorteios Rápidos & 100% Seguros
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-zinc-900 tracking-tight leading-tight">
            Sua sorte está a <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">um clique de distância</span>
          </h1>
          
          <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Participe de campanhas auditadas, transparentes e concorra a prêmios incríveis. Compre suas cotas em segundos via Pix.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-4">
          <a
            href="#campanhas"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl shadow-emerald-600/10 hover:shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
          >
            Explorar Sorteios
          </a>
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="w-full sm:w-auto bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-600 px-8 py-4 rounded-2xl font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
          >
            Como Funciona?
          </button>
        </div>

        {/* HERO TRUST RIBBON */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-5xl mx-auto text-left">
          <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-zinc-100 flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 text-base">Compra Garantida</h4>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">Seus bilhetes são vinculados diretamente ao seu CPF e confirmados automaticamente.</p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-zinc-100 flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 text-base">PIX Instantâneo</h4>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">Sem burocracia. O pagamento e a emissão das cotas acontecem no mesmo minuto.</p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-zinc-100 flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 text-base">Resultados Auditados</h4>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">Sorteios transparentes com extração auditável e divulgação pública de ganhadores.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINISHED CAMPAIGNS (RECENT WINNERS) */}
      {finishedCampaigns.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-amber-400 p-3 rounded-2xl shadow-lg shadow-amber-400/10 text-white">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Ganhadores Recentes</h2>
              <p className="text-zinc-400 font-medium">Confira quem já levou os prêmios para casa!</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {finishedCampaigns.slice(0, 4).map((c) => {
              const winners = (c as any).winners || [];
              const firstWinner = winners[0];
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCampaign(c)}
                  className="bg-white rounded-[2rem] border border-amber-100/60 p-6 bg-gradient-to-br from-white to-amber-50/10 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-bl-[4rem] pointer-events-none" />
                  
                  <div className="relative mb-6">
                    <img
                      src={c.image_url || `https://picsum.photos/seed/${c.id}/600/400`}
                      alt={c.title}
                      className="w-full h-32 object-cover rounded-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center text-zinc-900 shadow-xl border-4 border-amber-400">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none">Cota</span>
                        <span className="text-2xl font-black mt-0.5 leading-none">{firstWinner?.number || '---'}</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-zinc-900 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Sorteado
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] truncate">{c.title}</p>
                    <h3 className="text-xl font-black text-zinc-900 truncate leading-tight">{firstWinner?.customer || 'Ganhador'}</h3>
                    <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wide">
                      <Gift className="w-3.5 h-3.5 shrink-0" /> {firstWinner?.prize_name || 'Prêmio'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ACTIVE CAMPAIGNS */}
      <section id="campanhas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-wider mb-3">
              ⚡ Sorteios Ativos
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">Campanhas em Destaque</h2>
            <p className="text-zinc-400 font-medium mt-1">Garanta sua participação antes que as cotas esgotem!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} onClick={() => onSelectCampaign(campaign)} />
          ))}
          
          {activeCampaigns.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm max-w-xl mx-auto px-6">
              <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-100/50">
                <Ticket className="w-8 h-8 text-zinc-300" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 mb-2">Nenhuma campanha ativa no momento</h3>
              <p className="text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed">Novas campanhas estão sendo preparadas pelos organizadores. Volte em breve para participar!</p>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      {howItWorks.length > 0 && (
        <section id="como-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-24">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">Como Funciona</h2>
            <p className="text-zinc-500 font-medium">É muito simples e rápido participar dos nossos sorteios!</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[2rem] border border-zinc-100 p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[5rem] pointer-events-none" />
                <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-sm border border-emerald-100/50 group-hover:scale-110 transition-transform">
                  {i + 1}
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* FEATURES */}
      {features.length > 0 && (
        <section id="vantagens" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-24">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">Tudo que Você Precisa</h2>
            <p className="text-zinc-500 font-medium">Oferecemos recursos premium para dar total segurança aos participantes.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {features.map((feat: any, i: number) => {
              const Ic = iconMap[feat.icon] || Star;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-3xl border border-zinc-100 p-6 text-center shadow-sm hover:shadow-lg hover:scale-105 transition-all group"
                >
                  <div className="w-14 h-14 bg-emerald-50/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 border border-emerald-100/20 group-hover:scale-110 transition-transform">
                    <Ic className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-zinc-900 text-sm tracking-tight">{feat.title}</p>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-zinc-950 rounded-[3rem] p-10 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(16,185,129,0.15),transparent_100%)] pointer-events-none" />
          <div className="absolute -top-48 -left-48 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">{ctaText}</h2>
            <p className="text-emerald-100/70 text-base md:text-lg font-medium leading-relaxed">
              Inicie agora mesmo sua campanha na plataforma de rifas mais segura e automatizada do mercado.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  if (user) {
                    onNavigate('dashboard');
                  } else {
                    onNavigate('login');
                  }
                }}
                className="bg-white text-emerald-800 hover:bg-emerald-50 px-10 py-5 rounded-2xl font-black text-base md:text-lg hover:scale-105 active:scale-[0.98] transition-all shadow-xl shadow-zinc-950/20"
              >
                Criar Minha Campanha
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      {faqItems.length > 0 && (
        <section id="duvidas" className="max-w-3xl mx-auto px-4 py-12 scroll-mt-24">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Dúvidas Frequentes</h2>
            <p className="text-zinc-500 font-medium">Tudo o que você precisa saber sobre como participar ou organizar sorteios.</p>
          </div>
          
          <div className="space-y-4">
            {faqItems.map((faq: any, i: number) => (
              <div key={i} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden transition-all">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-zinc-50/50 transition-all focus:outline-none"
                >
                  <span className="font-bold text-zinc-800 text-sm md:text-base leading-snug">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-emerald-600' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 text-zinc-500 text-xs md:text-sm leading-relaxed border-t border-zinc-50 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const CampaignDetails = ({ campaign, onBack, globalSettings }: { campaign: Campaign, onBack: () => void, globalSettings?: any }) => {
  const [quantity, setQuantity] = useState(campaign.min_tickets || 1);
  const [step, setStep] = useState<'details' | 'checkout' | 'payment'>('details');
  const [orderData, setOrderData] = useState({ name: '', email: '', phone: '' });
  const [pixConfig, setPixConfig] = useState<any>(null);
  const [loadingPix, setLoadingPix] = useState(false);
  const [copied, setCopied] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [reservedNumbers, setReservedNumbers] = useState<number[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [occupiedNumbers, setOccupiedNumbers] = useState<number[]>([]);
  const [paidNums, setPaidNums] = useState<number[]>([]);
  const [reservedByOthers, setReservedByOthers] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState<'random' | 'manual'>(campaign.display_mode === 'exposed' ? 'manual' : 'random');
  const [numberFilter, setNumberFilter] = useState<'available' | 'paid' | 'reserved'>('available');

  const [hasSchemaError, setHasSchemaError] = useState(false);

  // Estados para Envio de Comprovante e UI de Accordions
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(true);
  const [showAccountDetails, setShowAccountDetails] = useState(false);

  useEffect(() => {
    if (hasSchemaError) return;
    const fetchOccupied = async () => {
      try {
        const { data: paidData, error: paidError } = await supabase
          .from('orders')
          .select('reserved_numbers')
          .eq('campaign_id', campaign.id)
          .eq('status', 'paid');

        const { data: reservedData, error: reservedError } = await supabase
          .from('orders')
          .select('reserved_numbers')
          .eq('campaign_id', campaign.id)
          .in('status', ['pending', 'waiting', 'pending_approval']);

        // Silenciamos erros de coluna não encontrada (PGRST204 ou 42703)
        const isMissingColumn = (err: any) => err && (err.code === 'PGRST204' || err.code === '42703' || err.message?.includes('reserved_numbers'));

        if (paidError || reservedError) {
          if (isMissingColumn(paidError) || isMissingColumn(reservedError)) {
            setHasSchemaError(true);
            return;
          }
          if (paidError) console.error('Erro ao buscar números pagos:', paidError);
          if (reservedError) console.error('Erro ao buscar números reservados:', reservedError);
        }

        const paid = (paidData || []).flatMap((o: any) => o.reserved_numbers || []);
        const reserved = (reservedData || []).flatMap((o: any) => o.reserved_numbers || []);

        setPaidNums(paid);
        setReservedByOthers(reserved);
        setOccupiedNumbers([...paid, ...reserved]);
      } catch (err) {
        // Silenciamos erros inesperados para evitar poluição visual
      }
    };
    fetchOccupied();
  }, [campaign.id, hasSchemaError]);

  const allNumbers = Array.from({ length: campaign.total_tickets }, (_, i) => i + 1);

  const filteredNumbers = allNumbers.filter(num => {
    if (numberFilter === 'available') return !occupiedNumbers.includes(num);
    if (numberFilter === 'paid') return paidNums.includes(num);
    if (numberFilter === 'reserved') return reservedByOthers.includes(num);
    return true;
  });

  const progress = Math.min(100, (occupiedNumbers.length / campaign.total_tickets) * 100);

  const toggleNumber = (num: number) => {
    if (campaign.status === 'finished') return; // Bloquear seleção se encerrada
    if (occupiedNumbers.includes(num)) return;

    setSelectionMode('manual');
    setSelectedNumbers(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const handlePurchase = async () => {
    try {
      setLoadingPix(true);
      const finalQty = selectionMode === 'manual' ? selectedNumbers.length : quantity;
      if (finalQty === 0) throw new Error('Selecione ao menos um número');
      let numbers: number[] = [];
      if (selectionMode === 'manual') {
        numbers = [...selectedNumbers];
      } else {
        while (numbers.length < quantity) {
          const n = Math.floor(Math.random() * campaign.total_tickets) + 1;
          if (!numbers.includes(n) && !occupiedNumbers.includes(n)) numbers.push(n);
        }
      }
      const sortedNumbers = numbers.sort((a, b) => a - b);
      setReservedNumbers(sortedNumbers);
      const totalAmt = campaign.ticket_price * finalQty;

      console.log('Dados para INSERT:', {
        campaign_id: campaign.id,
        customer_name: orderData.name,
        customer_email: orderData.email,
        customer_phone: orderData.phone,
        total_amount: totalAmt,
        ticket_count: selectionMode === 'manual' ? selectedNumbers.length : quantity,
        status: 'pending',
        payment_method: 'pix'
      });

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          campaign_id: campaign.id,
          customer_name: orderData.name,
          customer_email: orderData.email,
          customer_phone: orderData.phone,
          total_amount: totalAmt,
          ticket_count: selectedNumbers.length > 0 ? selectedNumbers.length : quantity,
          status: 'pending',
          payment_method: 'pix',
          reserved_numbers: selectedNumbers.length > 0 ? selectedNumbers : []
        })
        .select()
        .single();

      if (orderError) throw orderError;
      setOrderId(order.id);

      const { data: pixData } = await supabase
        .from('payment_configs')
        .select('pix_key, pix_key_type, pix_holder_name')
        .eq('user_id', campaign.organizer_id)
        .maybeSingle();
      if (pixData?.pix_key) {
        setPixConfig({ pix_key: pixData.pix_key, pix_type: pixData.pix_key_type, pix_name: pixData.pix_holder_name });
      }
      setStep('payment');
      setLoadingPix(false);
    } catch (err: any) {
      console.error('Erro ao processar handlePurchase:', err);
      setLoadingPix(false);
      alert(err.message || 'Erro ao processar pedido');
    }
  };

  const finalQuantity = selectionMode === 'manual' ? selectedNumbers.length : quantity;
  const totalAmount = campaign.ticket_price * finalQuantity;

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendReceipt = async () => {
    if (!receiptFile || !orderId) return;
    setIsUploadingReceipt(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ receipt_url: receiptFile, status: 'pending' }) // Manteremos como pending ou novo status se desejar
        .eq('id', orderId);

      if (error) throw error;
      alert('Comprovante enviado com sucesso! Redirecionando...');
      onBack();
    } catch (err: any) {
      console.error('Erro ao enviar comprovante:', err);
      alert(err.message || 'Erro ao enviar comprovante');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleCopyPix = () => {
    if (pixConfig?.pix_key) {
      navigator.clipboard.writeText(pixConfig.pix_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const pixTypeLabel = (type: string) => {
    switch (type) {
      case 'cpf': return 'CPF/CNPJ';
      case 'email': return 'E-mail';
      case 'phone': return 'Telefone';
      case 'random': return 'Chave Aleatória';
      default: return 'Chave PIX';
    }
  };

  const prizes: any[] = (campaign as any).prizes || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4 select-none">
          <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} className="hover:text-zinc-950 transition-colors">Home</a>
          <ChevronRight className="w-3 h-3 text-zinc-300" />
          <span className="text-zinc-400">Rifas</span>
          <ChevronRight className="w-3 h-3 text-zinc-300" />
          <span className="text-zinc-800 font-black truncate max-w-[200px]" title={campaign.title}>{campaign.title}</span>
        </nav>
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-4">
          <ChevronRight className="rotate-180 w-4 h-4" />
          <span className="text-sm font-semibold">Voltar</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl mx-auto px-4 pb-32 space-y-4"
          >
            {/* Seção de Ganhadores se a campanha estiver encerrada */}
            {campaign.status === 'finished' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6"
              >
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white border border-white/10">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Gift className="w-24 h-24" />
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-400 p-2 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-zinc-900" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black">Sorteio Realizado! 🏆</h2>
                        <p className="text-xs text-zinc-400 font-medium">Confira os ganhadores oficiais abaixo:</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {((campaign as any).winners || []).map((w: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-zinc-900 font-black text-xs">
                              {idx + 1}º
                            </div>
                            <div>
                              <p className="font-black text-sm">{w.customer}</p>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{w.prize_name}</p>
                            </div>
                          </div>
                          <div className="text-xl font-black text-yellow-400">{w.number}</div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-[0.2em]">Vendas Encerradas</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {/* 1. Foto quadrada 4:4 */}
            <div className="rounded-3xl overflow-hidden shadow-2xl aspect-square w-full">
              <img
                src={campaign.image_url || `https://picsum.photos/seed/${campaign.id}/800/800`}
                alt={campaign.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* 2. Título */}
            <div className="pt-1">
              <h1 className="text-2xl font-black text-zinc-900 leading-tight">{campaign.title}</h1>
            </div>

            {/* 3. Nome do Organizador */}
            <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Organizado por</p>
                <p className="text-sm font-bold text-zinc-700">{(campaign as any).organizer_name || 'Organizador'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Valor unitário</p>
                <p className="text-lg font-black text-emerald-600">R$ {campaign.ticket_price.toFixed(2)}</p>
              </div>
            </div>

            {/* 4. Descrição */}
            {campaign.description && (
              <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Sobre a campanha</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">{campaign.description}</p>
              </div>
            )}

            {/* 5. Regulamento */}
            {campaign.regulation && (
              <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" /> Regulamento
                </h3>
                <div
                  className="text-sm text-zinc-600 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: campaign.regulation }}
                />
              </div>
            )}

            {/* 6. Prêmios */}
            {prizes.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Gift className="w-3.5 h-3.5 text-amber-500" /> Prêmios
                </h3>
                <div className="space-y-3">
                  {prizes.map((prize: any, i: number) => (
                    <div key={prize.id || i} className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center font-black text-amber-600 text-sm shrink-0">
                        {prize.position === 1 ? '🥇' : prize.position === 2 ? '🥈' : prize.position === 3 ? '🥉' : `${prize.position}º`}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-zinc-800">{prize.description}</p>
                        {prize.value && <p className="text-xs font-bold text-emerald-600 mt-0.5">R$ {prize.value}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Compra aleatória (condicional) */}
            {campaign.status !== 'finished' && (campaign.display_mode === 'random' || campaign.display_mode === 'both') && (
              <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 bg-emerald-50 rounded-xl shrink-0">
                    <Rocket className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-900">Compra Aleatória</p>
                    <p className="text-xs text-zinc-400">O sistema sorteia os números automaticamente</p>
                    <p className="text-[10px] text-amber-600 mt-1 font-bold inline-block px-2 py-1 bg-amber-50 rounded-lg">
                      ⏳ Pagamento em até {formatExpiry(globalSettings?.reservation_expiry || campaign.reservation_expiry || 24)}!
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[5, 10, 20, 50].map(n => (
                    <button
                      key={n}
                      onClick={() => {
                        let toSelect = [...selectedNumbers];
                        if (selectionMode === 'random') {
                          toSelect = [];
                        }
                        let available = allNumbers.filter(num => !occupiedNumbers.includes(num) && !toSelect.includes(num));
                        if (available.length < n) {
                          alert(`Apenas ${available.length} números disponíveis para escolha.`);
                          return;
                        }
                        const newPicks = [];
                        while (newPicks.length < n && available.length > 0) {
                          const idx = Math.floor(Math.random() * available.length);
                          newPicks.push(available[idx]);
                          available.splice(idx, 1);
                        }
                        const finalPicks = [...toSelect, ...newPicks].sort((a, b) => a - b);
                        setSelectionMode('manual');
                        setSelectedNumbers(finalPicks);
                      }}
                      className={`py-3 rounded-xl text-sm font-black transition-all border-2 bg-zinc-50 border-zinc-100 text-zinc-500 hover:border-emerald-200 hover:bg-emerald-50`}
                    >+{n}</button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => {
                    if (selectedNumbers.length > 0) {
                      setSelectionMode('manual');
                      const newPicks = [...selectedNumbers];
                      newPicks.pop();
                      setSelectedNumbers(newPicks);
                    }
                  }} className="w-12 h-12 rounded-2xl border-2 border-zinc-100 bg-zinc-50 flex items-center justify-center text-xl font-black text-zinc-400 hover:border-emerald-200 hover:text-emerald-600 transition-all">-</button>
                  <input
                    type="number"
                    value={selectedNumbers.length}
                    readOnly
                    className="flex-1 h-12 rounded-2xl border-2 border-zinc-100 bg-zinc-50 text-center font-black text-lg focus:border-emerald-500 outline-none transition-all cursor-default"
                  />
                  <button onClick={() => {
                    let available = allNumbers.filter(num => !occupiedNumbers.includes(num) && !selectedNumbers.includes(num));
                    if (available.length < 1) {
                      alert(`Não há mais números disponíveis.`);
                      return;
                    }
                    const idx = Math.floor(Math.random() * available.length);
                    const newPick = available[idx];
                    setSelectionMode('manual');
                    setSelectedNumbers(prev => [...prev, newPick].sort((a, b) => a - b));
                  }} className="w-12 h-12 rounded-2xl border-2 border-zinc-100 bg-zinc-50 flex items-center justify-center text-xl font-black text-zinc-400 hover:border-emerald-200 hover:text-emerald-600 transition-all">+</button>
                </div>
              </div>
            )}

            {/* 8. Filtros + 9. Barra de progresso */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Status dos Números</h3>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { key: 'available' as const, label: 'Disponíveis', count: allNumbers.filter(n => !occupiedNumbers.includes(n)).length, activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' },
                  { key: 'paid' as const, label: 'Pagos', count: paidNums.length, activeClass: 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' },
                  { key: 'reserved' as const, label: 'Reservados', count: reservedByOthers.length, activeClass: 'bg-zinc-500 border-zinc-500 text-white shadow-lg shadow-zinc-100' },
                ].map(({ key, label, count, activeClass }) => (
                  <button
                    key={key}
                    onClick={() => setNumberFilter(key)}
                    className={`flex flex-col items-center py-3 px-2 rounded-xl text-center transition-all border-2 ${numberFilter === key ? activeClass : 'bg-zinc-50 border-zinc-100 text-zinc-500 hover:border-zinc-300'}`}
                  >
                    <span className="text-lg font-black leading-none">{count}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{label}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <span>{occupiedNumbers.length} comprados</span>
                  <span>{progress.toFixed(0)}% vendido</span>
                </div>
                <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 text-center font-medium">
                  {campaign.total_tickets - occupiedNumbers.length} disponíveis de {campaign.total_tickets} números
                </p>
              </div>
            </div>

            {/* 10. Grade de números manuais SEM scroll */}
            {campaign.status !== 'finished' && (campaign.display_mode === 'exposed' || campaign.display_mode === 'both') && (
              <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm">
                {campaign.display_mode === 'both' && (
                  <div className="relative py-3 mb-4">
                    <div className="absolute inset-0 flex items-center px-4"><div className="w-full border-t border-zinc-100" /></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em] text-zinc-400 bg-white px-4 mx-auto w-fit">OU ESCOLHA MANUAL</div>
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-black text-zinc-900">Escolha seus Números</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Filtre e toque para selecionar</p>
                  </div>
                  {selectedNumbers.length > 0 && (
                    <span className="bg-brand-orange/10 text-brand-orange text-xs font-black px-3 py-1.5 rounded-full">{selectedNumbers.length} selecionados</span>
                  )}
                </div>
                <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border-2 border-zinc-200 inline-block" /> Livre</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-200 inline-block" /> Pago</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-300 inline-block" /> Reservado</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-orange inline-block" /> Selecionado</span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
                  {filteredNumbers.map(num => {
                    const isOccupied = occupiedNumbers.includes(num);
                    const isSelected = selectedNumbers.includes(num);
                    const isPaid = paidNums.includes(num);
                    const isReserved = reservedByOthers.includes(num);
                    return (
                      <button
                        key={num}
                        disabled={isOccupied}
                        onClick={() => toggleNumber(num)}
                        className={`aspect-square rounded-xl text-[9px] font-bold transition-all border-2 ${isSelected ? 'bg-brand-orange border-brand-orange text-white shadow-md shadow-orange-100' :
                          isPaid ? 'bg-blue-50 border-blue-200 text-blue-400 cursor-not-allowed' :
                            isReserved ? 'bg-zinc-100 border-zinc-300 text-zinc-400 cursor-not-allowed' :
                              'bg-white border-zinc-200 text-zinc-600 hover:border-brand-orange hover:text-brand-orange'
                          }`}
                      >{String(num).padStart(3, '0')}</button>
                    );
                  })}
                  {filteredNumbers.length === 0 && (
                    <div className="col-span-5 sm:col-span-8 md:col-span-10 py-8 text-center text-zinc-400 text-sm font-medium">
                      Nenhum número {numberFilter === 'available' ? 'disponível' : numberFilter === 'paid' ? 'pago' : 'reservado'}.
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {step === 'checkout' && (
          <motion.div key="checkout" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto px-4 pb-16">
            <div className="bg-white rounded-3xl border border-zinc-100 p-7 shadow-xl space-y-6">
              <h2 className="text-2xl font-black text-zinc-900">Seus Dados</h2>
              <div className="space-y-4">
                <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Nome Completo</label><input type="text" placeholder="Ex: João Silva" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium focus:ring-2 focus:ring-emerald-500 outline-none" value={orderData.name} onChange={e => setOrderData({ ...orderData, name: e.target.value })} /></div>
                <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">E-mail</label><input type="email" placeholder="joao@email.com" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium focus:ring-2 focus:ring-emerald-500 outline-none" value={orderData.email} onChange={e => setOrderData({ ...orderData, email: e.target.value })} /></div>
                <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">WhatsApp</label><input type="tel" placeholder="(11) 99999-9999" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium focus:ring-2 focus:ring-emerald-500 outline-none" value={orderData.phone} onChange={e => setOrderData({ ...orderData, phone: e.target.value })} /></div>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-zinc-500">Total</span>
                  <span className="text-xl font-black text-emerald-600">R$ {totalAmount.toFixed(2)}</span>
                </div>
                {selectionMode === 'manual' && selectedNumbers.length > 0 && (
                  <div className="pt-2 border-t border-zinc-200">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex justify-between">
                      <span>Seus números gerados</span>
                      <span>({selectedNumbers.length} quotas)</span>
                    </p>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
                      {selectedNumbers.map(n => (
                        <span key={n} className="bg-brand-orange/10 text-brand-orange text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {String(n).padStart(3, '0')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-blue-50/50 rounded-2xl p-4 flex flex-col justify-center items-start border border-blue-100/50 mb-2 mt-4">
                <p className="text-xs font-bold text-blue-800 flex flex-wrap gap-1 leading-relaxed">
                  <Clock className="w-4 h-4 shrink-0 inline-block text-blue-600" />
                  <span>Fique atento! Você terá <strong>{formatExpiry(globalSettings?.reservation_expiry || campaign.reservation_expiry || 24)}</strong> para realizar o pagamento antes que seus números voltem a ficar disponíveis!</span>
                </p>
              </div>

              <div className="space-y-3">
                <button onClick={handlePurchase} disabled={!orderData.name || !orderData.email || !orderData.phone || loadingPix} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                  {loadingPix ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirmar e Pagar'}
                </button>
                <button onClick={() => setStep('details')} className="w-full text-zinc-400 font-bold text-sm py-2">Voltar</button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div key="payment" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto px-4 pb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-brand-orange w-6 h-6" />
                <h2 className="text-2xl font-black text-zinc-900">Finalizar compra</h2>
              </div>

              {/* Box Principal de Comprovante e PIX */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">

                {/* Abas - Aqui teremos apenas a representação visual conforme modelo */}
                <div className="mb-6 flex">
                  <button className="flex-1 border-brand-orange border-2 text-brand-orange font-bold rounded-xl py-3 flex items-center justify-center gap-2">
                    <RefreshCcw className="w-5 h-5" /> Outras
                  </button>
                </div>

                {/* Box Cinza Valor e Expiração */}
                <div className="bg-zinc-50 rounded-xl p-5 mb-6 flex justify-between items-center border border-zinc-100">
                  <div>
                    <span className="text-sm font-bold text-zinc-500 block mb-1">Valor</span>
                    <span className="text-xl font-black text-brand-orange">R$ {totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-zinc-500 block mb-1">Expira em</span>
                    <span className="text-lg font-black text-zinc-900">{formatExpiry(globalSettings?.reservation_expiry || campaign.reservation_expiry || 24)}</span>
                  </div>
                </div>

                {pixConfig ? (
                  <div className="space-y-4">
                    {/* Exibição do QR Code Dinâmico/Estático escaneável */}
                    <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 rounded-2xl border border-zinc-100 mb-4">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateStaticPix({
                          key: pixConfig.pix_key,
                          name: pixConfig.pix_name || 'ORGANIZADOR',
                          amount: totalAmount,
                          txid: orderId ? String(orderId) : '***'
                        }))}`}
                        alt="QR Code PIX"
                        className="w-44 h-44 mb-3 border-4 border-white shadow-sm"
                      />
                      <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Escaneie com o app do seu Banco</span>
                    </div>

                    <div className="flex items-start gap-3">
                      <QrCode className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                      <p className="text-sm text-zinc-500 mb-4">
                        Copie o código Pix Copia e Cola abaixo e cole em seu app de pagamento para finalizar a compra.
                      </p>
                    </div>

                    <div className="relative flex items-center bg-zinc-50 border border-zinc-200 rounded-xl p-2">
                      <input
                        type="text"
                        readOnly
                        value={generateStaticPix({
                          key: pixConfig.pix_key,
                          name: pixConfig.pix_name || 'ORGANIZADOR',
                          amount: totalAmount,
                          txid: orderId ? String(orderId) : '***'
                        })}
                        className="w-full bg-transparent text-sm font-mono text-zinc-500 px-3 outline-none"
                      />
                      <button
                        onClick={() => {
                          const pixPayload = generateStaticPix({
                            key: pixConfig.pix_key,
                            name: pixConfig.pix_name || 'ORGANIZADOR',
                            amount: totalAmount,
                            txid: orderId ? String(orderId) : '***'
                          });
                          navigator.clipboard.writeText(pixPayload);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 3000);
                        }}
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all text-white shrink-0 ${copied ? 'bg-emerald-600' : 'bg-brand-orange'}`}
                      >
                        {copied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>

                    <div className="pt-6 mt-6 border-t border-zinc-100">
                      <p className="text-sm text-zinc-500 mb-4">Envie o comprovante após o pagamento</p>

                      {receiptFile ? (
                        <div className="border-2 border-emerald-500 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-emerald-50 mb-4">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          <span className="text-sm font-bold text-emerald-700">{receiptName} anexado!</span>
                          <button onClick={() => { setReceiptFile(null); setReceiptName(null); }} className="text-xs text-emerald-600 font-bold underline">Remover arquivo</button>
                        </div>
                      ) : (
                        <label className="border-2 border-purple-300 border-dashed rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-purple-50 transition-colors mb-4">
                          <Upload className="w-5 h-5 text-purple-400" />
                          <span className="text-sm font-bold text-purple-400">Anexar comprovante</span>
                          <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleReceiptUpload} />
                        </label>
                      )}

                      <button
                        onClick={handleSendReceipt}
                        disabled={!receiptFile || isUploadingReceipt}
                        className="w-full bg-[#9DEBB3] text-[#2e5d3c] py-4 rounded-xl font-bold text-base hover:bg-[#86dd9e] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isUploadingReceipt ? <div className="w-5 h-5 border-2 border-[#2e5d3c]/30 border-t-[#2e5d3c] rounded-full animate-spin" /> : 'Enviar comprovante'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div><p className="font-bold text-amber-800 text-sm">PIX não configurado</p><p className="text-xs text-amber-700 mt-1">O organizador ainda não configurou o PIX da campanha.</p></div>
                  </div>
                )}
              </div>

              {/* Accordions Detalhe Compra */}
              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                <button
                  onClick={() => setShowPurchaseDetails(!showPurchaseDetails)}
                  className="w-full flex items-center justify-between p-5 bg-white text-zinc-900 font-bold hover:bg-zinc-50 transition-colors"
                >
                  Detalhes da minha compra
                  <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${showPurchaseDetails ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showPurchaseDetails && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-5 border-t border-zinc-100 bg-zinc-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-zinc-500 text-sm"><span className="w-5 h-5 rounded-md bg-brand-orange-50 text-brand-orange flex items-center justify-center"><Banknote className="w-4 h-4" /></span> Forma de pagamento</div>
                          <span className="font-bold text-sm text-zinc-900">{pixConfig?.pix_type ? pixTypeLabel(pixConfig.pix_type) : 'PIX'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-zinc-500 text-sm"><span className="w-5 h-5 rounded-md bg-brand-orange-50 text-brand-orange flex items-center justify-center"><Calendar className="w-4 h-4" /></span> Data da compra</div>
                          <span className="font-bold text-sm text-zinc-900">{new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-zinc-500 text-sm"><span className="w-5 h-5 rounded-md bg-brand-orange-50 text-brand-orange flex items-center justify-center"><DollarSign className="w-4 h-4" /></span> Valor total da compra</div>
                          <span className="font-bold text-sm text-zinc-900">R$ {totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordions Detalhe Conta */}
              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                <button
                  onClick={() => setShowAccountDetails(!showAccountDetails)}
                  className="w-full flex items-center justify-between p-5 bg-white text-zinc-900 font-bold hover:bg-zinc-50 transition-colors"
                >
                  Detalhes da minha conta
                  <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${showAccountDetails ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showAccountDetails && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-5 border-t border-zinc-100 bg-zinc-50/50 space-y-4">
                        <h3 className="font-black text-zinc-900 text-lg">{orderData.name}</h3>
                        <p className="text-zinc-500 text-sm">{orderData.email}</p>
                        <p className="text-zinc-500 text-sm">{orderData.phone}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-center pt-4">
                <button onClick={onBack} className="text-zinc-400 font-bold text-sm hover:text-zinc-600 transition-all underline">Voltar para a campanha</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 11. Rodapé CTA fixo */}
      {step === 'details' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-zinc-100 px-4 py-4 z-50">
          <div className="max-w-2xl mx-auto">
            {campaign.status !== 'finished' && (
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total a pagar</p>
                  <span className="text-2xl font-black text-zinc-900">R$ {totalAmount.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    {selectionMode === 'manual' ? 'Números escolhidos' : 'Qtd. de números'}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    {selectionMode === 'manual' ? (
                      <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                        {selectedNumbers.slice(0, 5).map(n => (
                          <span key={n} className="bg-brand-orange/10 text-brand-orange text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {String(n).padStart(3, '0')}
                          </span>
                        ))}
                        {selectedNumbers.length > 5 && <span className="text-[10px] text-zinc-400 font-bold ml-1">+{selectedNumbers.length - 5}</span>}
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-zinc-900">{finalQuantity} {finalQuantity === 1 ? 'número' : 'números'}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                if (campaign.status === 'finished') {
                  onBack();
                  return;
                }
                if (selectionMode === 'random' && quantity > 0) {
                  let available = allNumbers.filter(num => !occupiedNumbers.includes(num));
                  if (available.length < quantity) {
                    alert(`Apenas ${available.length} números disponíveis para escolha.`);
                    return;
                  }
                  const newPicks = [];
                  while (newPicks.length < quantity && available.length > 0) {
                    const idx = Math.floor(Math.random() * available.length);
                    newPicks.push(available[idx]);
                    available.splice(idx, 1);
                  }
                  setSelectionMode('manual');
                  setSelectedNumbers(newPicks.sort((a, b) => a - b));
                }
                setStep('checkout');
              }}
              disabled={campaign.status !== 'finished' && finalQuantity === 0}
              className={`w-full py-4 rounded-2xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-2 ${campaign.status === 'finished'
                ? 'bg-zinc-900 text-white shadow-zinc-200 hover:bg-zinc-800'
                : 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
            >
              {campaign.status === 'finished' ? 'Sorteio Finalizado - Voltar' : 'Participar Agora'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const RichTextEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
  const editorRef = React.useRef<HTMLDivElement>(null);

  const execCommand = (command: string, uiValue: string = '') => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, uiValue);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const colorInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-orange transition-all">
      <div className="bg-zinc-50 border-b border-zinc-100 p-2 flex flex-wrap gap-1">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('bold')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-zinc-600" title="Negrito"><Bold className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('italic')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-zinc-600" title="Itálico"><Italic className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('underline')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-zinc-600" title="Sublinhado"><Underline className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-zinc-200 self-center mx-1" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-zinc-600" title="Marcadores"><List className="w-4 h-4" /></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-zinc-600" title="Lista Numerada"><ListOrdered className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-zinc-200 self-center mx-1" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('formatBlock', 'h3')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-zinc-600 flex items-center gap-1" title="Título"><Type className="w-4 h-4" /><span className="text-[10px] font-bold">H</span></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('fontSize', '4')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-zinc-600 flex items-center gap-1" title="Tamanho"><Baseline className="w-4 h-4" /><span className="text-[10px] font-bold">A</span></button>
        <div className="relative flex items-center">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => colorInputRef.current?.click()}
            className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-orange-500"
            title="Escolher Cor (Aquarela)"
          >
            <Palette className="w-4 h-4" />
          </button>
          <input
            ref={colorInputRef}
            type="color"
            className="absolute opacity-0 w-0 h-0"
            onChange={(e) => execCommand('foreColor', e.target.value)}
          />
        </div>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('removeFormat')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-zinc-400" title="Limpar Formatação"><Eraser className="w-4 h-4" /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="p-6 min-h-[200px] outline-none text-zinc-600 font-medium prose prose-sm max-w-none"
        placeholder={placeholder}
      />
    </div>
  );
};

const CreateCampaignModal = ({ user, onClose, onCreated, initialData, globalSettings }: { user: User, onClose: () => void, onCreated: () => void, initialData?: Campaign, globalSettings: any }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTaxTable, setShowTaxTable] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    slug: initialData?.slug || '',
    image_url: initialData?.image_url || '',
    ticket_price: initialData?.ticket_price || 10,
    total_tickets: initialData?.total_tickets || 100,
    draw_date: initialData?.draw_date || '',
    draw_type: initialData?.draw_type || 'federal',
    display_mode: initialData?.display_mode || 'random',
    prizes: (initialData as any)?.prizes || [],
    promotions: (initialData as any)?.promotions || [],
    min_tickets: (initialData as any)?.min_tickets || 1,
    max_tickets: (initialData as any)?.max_tickets || null,
    reservation_expiry: (initialData as any)?.reservation_expiry || '24',
    regulation: (initialData as any)?.regulation || '',
    seo_settings: (initialData as any)?.seo_settings || {
      title_seo: '',
      description_seo: '',
      slug: initialData?.slug || '',
      keyword_main: '',
      keywords_related: '',
      image_seo: '',
      image_alt: '',
      canonical_url: '',
      index_status: 'index'
    }
  });

  const generateSeoSuggestions = () => {
    const premios = formData.prizes.length > 0 ? formData.prizes.map((p: any) => p.description).join(', ') : 'prêmios incríveis';
    const preco = formatCurrency(formData.ticket_price);
    const suggestedTitle = `${formData.title} | Adquira por ${preco}`;
    const suggestedDesc = `Participe do sorteio online "${formData.title}". Prêmios: ${premios}. Adquira sua cota por apenas ${preco} no Vai Rifar!`;
    const suggestedSlug = cleanSlug(formData.title);

    setFormData({
      ...formData,
      seo_settings: {
        ...formData.seo_settings,
        title_seo: suggestedTitle.substring(0, 60),
        description_seo: suggestedDesc.substring(0, 160),
        slug: suggestedSlug,
        keyword_main: formData.title.toLowerCase(),
        keywords_related: 'sorteio online, rifas online, cota premiada, bilhete da sorte',
        image_seo: formData.image_url,
        image_alt: `Imagem de divulgação do sorteio ${formData.title}`,
        canonical_url: globalSettings?.seo_site_url ? `${globalSettings.seo_site_url}/rifa/${suggestedSlug}` : ''
      }
    });
  };

  const calculateTax = () => {
    try {
      const taxTable = JSON.parse(globalSettings?.tax_table || '[]');
      if (!Array.isArray(taxTable)) return 0;

      const collection = (formData.total_tickets || 0) * (formData.ticket_price || 0);
      // Find the first range where collection <= item.max
      const range = taxTable
        .sort((a: any, b: any) => a.max - b.max)
        .find((item: any) => collection <= item.max);

      if (range) return range.fee;

      // If no range found, use the last range's fee or a default if empty
      if (taxTable.length > 0) return taxTable[taxTable.length - 1].fee;
      return 0;
    } catch (e) {
      console.error('Error calculating tax:', e);
      return 0;
    }
  };

  // Estados para prêmios
  const [showPrizeForm, setShowPrizeForm] = useState(false);
  const [newPrize, setNewPrize] = useState({ position: 1, description: '', value: '' });

  // Estados para promoção
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [newPromo, setNewPromo] = useState({ quantity: 5, price: '', description: '' });

  // Estado para data do sorteio
  const [hasDrawDate, setHasDrawDate] = useState(!!initialData?.draw_date);

  const addPrize = () => {
    if (!newPrize.description) return;
    const updated = [...formData.prizes, { ...newPrize, id: Date.now() }];
    setFormData({ ...formData, prizes: updated });
    setNewPrize({ position: updated.length + 1, description: '', value: '' });
    setShowPrizeForm(false);
  };

  const removePrize = (id: number) => {
    setFormData({ ...formData, prizes: formData.prizes.filter((p: any) => p.id !== id) });
  };

  const addPromo = () => {
    if (!newPromo.quantity || !newPromo.price) return;
    const updated = [...formData.promotions, { ...newPromo, id: Date.now() }];
    setFormData({ ...formData, promotions: updated });
    setNewPromo({ quantity: 5, price: '', description: '' });
    setShowPromoForm(false);
  };

  const removePromo = (id: number) => {
    setFormData({ ...formData, promotions: formData.promotions.filter((p: any) => p.id !== id) });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData({ ...formData, image_url: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateUniqueSlug = async (title: string, currentCampaignId?: number) => {
    let baseSlug = title
      .toLowerCase()
      .normalize('NFD') // remove accents
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!baseSlug) {
      baseSlug = 'campanha';
    }

    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const query = supabase
        .from('campaigns')
        .select('id')
        .eq('slug', slug);
      
      if (currentCampaignId) {
        query.neq('id', currentCampaignId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        break;
      }

      if (!data) {
        isUnique = true;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    return slug;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      // Verificar sessão ativa
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Você precisa estar logado para criar uma campanha. Faça login novamente.');

      // Usar o slug de SEO do usuário ou gerar
      const requestedSlug = formData.seo_settings?.slug || formData.slug || formData.title;
      const resolvedSlug = await generateUniqueSlug(requestedSlug, initialData?.id);

      const payload = {
        title: formData.title,
        description: formData.description || null,
        slug: resolvedSlug,
        image_url: formData.image_url || null,
        ticket_price: formData.ticket_price,
        total_tickets: formData.total_tickets,
        draw_date: formData.draw_date || null,
        draw_type: formData.draw_type,
        display_mode: formData.display_mode,
        prizes: formData.prizes,
        promotions: formData.promotions,
        min_tickets: formData.min_tickets,
        max_tickets: formData.max_tickets,
        reservation_expiry: formData.reservation_expiry,
        regulation: formData.regulation || null,
        status: initialData ? initialData.status : 'pending',
        seo_settings: {
          ...formData.seo_settings,
          slug: resolvedSlug
        }
      };

      if (initialData) {
        const { error } = await supabase
          .from('campaigns')
          .update(payload)
          .eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('campaigns')
          .insert([{ ...payload, organizer_id: session.user.id }]);
        if (error) throw error;
      }
      onCreated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar campanha');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, label: 'Informações' },
    { id: 2, label: 'Regulamento' },
    { id: 3, label: 'Modo/Resultado' },
    { id: 4, label: 'SEO e Divulgação' }
  ];

  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange">
              {initialData ? <Edit3 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </div>
            <h2 className="text-2xl font-black text-zinc-900">{initialData ? 'Editar campanha' : 'Criar campanha'}</h2>
          </div>
          <button onClick={onClose} className="bg-zinc-50 p-3 rounded-2xl text-zinc-400 hover:text-zinc-600 transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
            <ArrowRight className="w-4 h-4 rotate-180" /> Voltar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {/* Steps Indicator */}
          <div className="flex items-center justify-center gap-12 mb-12">
            {steps.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step === s.id ? 'bg-brand-orange text-white shadow-lg shadow-orange-100' :
                  step > s.id ? 'bg-brand-green text-white' : 'bg-zinc-100 text-zinc-400'
                  }`}>
                  {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : s.id}
                </div>
                <span className={`font-bold text-sm ${step === s.id ? 'text-zinc-900' : 'text-zinc-400'}`}>{s.label}</span>
                {s.id < 3 && <div className="w-24 h-1 bg-zinc-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-brand-orange transition-all duration-500 ${step > s.id ? 'w-full' : 'w-0'}`} />
                </div>}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Nome da campanha</label>
                    <input
                      required
                      type="text"
                      className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value, slug: cleanSlug(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Quantidade de títulos</label>
                    <div className="relative">
                      <input
                        required
                        type="number"
                        min="1"
                        max="10000000"
                        placeholder="Ex: 100000"
                        className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                        value={isNaN(formData.total_tickets) ? '' : formData.total_tickets}
                        onChange={e => setFormData({ ...formData, total_tickets: parseInt(e.target.value) || 0 })}
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                        {formData.total_tickets >= 1000000 ? 'Milhões' : 'Títulos'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Por onde será extraído o resultado?</label>
                    <select
                      className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange bg-white"
                      value={formData.draw_type}
                      onChange={e => setFormData({ ...formData, draw_type: e.target.value })}
                    >
                      <option value="federal">Loteria Federal</option>
                      <option value="internal">Sorteio Interno</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Valor de cada título</label>
                    <div className="flex">
                      <div className="h-14 px-6 bg-brand-orange text-white flex items-center font-bold rounded-l-2xl">R$</div>
                      <input
                        required
                        type="number"
                        step="0.01"
                        className="flex-1 h-14 rounded-r-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                        value={isNaN(formData.ticket_price) ? '' : formData.ticket_price}
                        onChange={e => setFormData({ ...formData, ticket_price: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/30 p-6 rounded-[2rem] border border-emerald-100/50 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Arrecadação Estimada</p>
                      <p className="text-2xl font-black text-emerald-700">R$ {(formData.total_tickets * formData.ticket_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="bg-orange-50/30 p-6 rounded-[2rem] border border-orange-100/50 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em] mb-1">Taxa de Ativação</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-black text-orange-700">R$ {calculateTax().toFixed(2).replace('.', ',')}</p>
                        <button
                          type="button"
                          onClick={() => setShowTaxTable(true)}
                          className="text-[10px] font-bold text-brand-orange hover:underline underline-offset-2"
                        >
                          Ver tabela de taxa →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 block">Adicione uma foto</label>
                  <label className="w-full h-48 rounded-[2rem] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-orange hover:bg-orange-50 transition-all overflow-hidden relative">
                    {imagePreview ? (
                      <img src={imagePreview} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 mb-3">
                          <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-brand-orange">Adicione uma imagem</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Prazo para uma reserva expirar</label>
                  <select
                    value={formData.reservation_expiry}
                    onChange={(e) => setFormData({ ...formData, reservation_expiry: e.target.value })}
                    className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange bg-white"
                  >
                    <option value="0.166">10 minutos</option>
                    <option value="0.5">30 minutos</option>
                    <option value="1">1 hora</option>
                    <option value="3">3 horas</option>
                    <option value="12">12 horas</option>
                    <option value="24">01 dia</option>
                    <option value="48">02 dias</option>
                    <option value="72">03 dias</option>
                    <option value="96">4 dias</option>
                    <option value="168">01 semana</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Quantidade mínima de títulos</label>
                    <input
                      type="number"
                      value={formData.min_tickets}
                      onChange={(e) => setFormData({ ...formData, min_tickets: parseInt(e.target.value) || 0 })}
                      className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Quantidade máxima de títulos</label>
                    <input
                      type="number"
                      value={formData.max_tickets || ''}
                      onChange={(e) => setFormData({ ...formData, max_tickets: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                      placeholder="Sem limite"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Regulamento da Campanha (Não é obrigatório)</label>
                  <RichTextEditor
                    value={formData.regulation}
                    onChange={(val) => setFormData({ ...formData, regulation: val })}
                    placeholder="Descreva as regras da sua campanha..."
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                {/* Coluna Esquerda: Modo */}
                <div className="glass-card p-8 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutDashboard className="text-brand-orange w-5 h-5" />
                    <h3 className="font-bold text-zinc-900">Modo de exibição</h3>
                  </div>
                  <div className="flex bg-zinc-100 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, display_mode: 'random' })}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${formData.display_mode === 'random'
                        ? 'bg-white text-brand-orange shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                    >
                      Aleatório
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, display_mode: 'exposed' })}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${formData.display_mode === 'exposed'
                        ? 'bg-white text-brand-orange shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                    >
                      Expostos
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, display_mode: 'both' })}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${formData.display_mode === 'both'
                        ? 'bg-white text-brand-orange shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                    >
                      Ambos
                    </button>
                  </div>

                  {formData.display_mode === 'random' && (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-400 text-center">O sistema escolhe a quantidade e o sistema sorteia os números aleatoriamente</p>
                      <div className="grid grid-cols-5 gap-2 opacity-40 mt-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                          <div key={i} className="aspect-square border border-zinc-200 rounded-lg flex items-center justify-center text-[10px] font-bold text-zinc-400">
                            {String(i).padStart(3, '0')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.display_mode === 'exposed' && (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-400 text-center">O cliente escolhe os números que deseja comprar clicando em cada um</p>
                      <div className="grid grid-cols-5 gap-2 mt-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                          <div key={i} className={`aspect-square border rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${i === 3 ? 'bg-brand-orange border-brand-orange text-white' : 'border-zinc-200 text-zinc-400'
                            }`}>
                            {String(i).padStart(3, '0')}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 text-xs text-zinc-400 mt-2 justify-center">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-zinc-200 inline-block" /> Disponível</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-500 inline-block" /> Vendido</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-zinc-50 border border-zinc-100 inline-block" /> Reservado</span>
                      </div>
                    </div>
                  )}

                  {formData.display_mode === 'both' && (
                    <div className="space-y-4">
                      <p className="text-xs text-zinc-400 text-center font-medium leading-relaxed italic">O comprador poderá escolher entre a seleção manual ou o sorteio automático.</p>
                      <div className="grid grid-cols-1 gap-3 mt-4">
                        <div className="h-12 bg-white border border-zinc-200 rounded-[1.25rem] flex items-center px-5 gap-3 shadow-sm">
                          <Rocket className="w-4 h-4 text-brand-orange" />
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Sorteio Automático</span>
                        </div>
                        <div className="h-12 bg-white border border-brand-orange/30 rounded-[1.25rem] flex items-center px-5 gap-3 shadow-sm shadow-orange-50">
                          <Users className="w-4 h-4 text-brand-orange" />
                          <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Seleção Manual</span>
                          <CheckCircle2 className="w-4 h-4 text-brand-green ml-auto" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Coluna Direita: Prêmios, Promoção, Data */}
                <div className="space-y-4">
                  {/* Prêmios */}
                  <div className="glass-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowPrizeForm(!showPrizeForm)}
                      className="w-full p-6 flex items-center gap-4 hover:bg-zinc-50 transition-all"
                    >
                      <div className="p-3 bg-orange-50 rounded-xl text-brand-orange"><Gift className="w-5 h-5" /></div>
                      <span className="font-bold text-zinc-700 flex-1 text-left">Adicionar prêmios</span>
                      {formData.prizes.length > 0 && (
                        <span className="text-xs font-bold bg-brand-orange/10 text-brand-orange px-2.5 py-1 rounded-full">{formData.prizes.length}</span>
                      )}
                      <Plus className={`w-4 h-4 text-zinc-400 transition-transform ${showPrizeForm ? 'rotate-45' : ''}`} />
                    </button>

                    {showPrizeForm && (
                      <div className="px-6 pb-6 space-y-3 border-t border-zinc-100">
                        {formData.prizes.map((prize: any) => (
                          <div key={prize.id} className="flex items-center gap-2 bg-zinc-50 rounded-xl px-4 py-3">
                            <span className="text-xs font-bold text-brand-orange w-6">{prize.position}º</span>
                            <span className="text-sm font-medium text-zinc-700 flex-1">{prize.description}</span>
                            {prize.value && <span className="text-xs text-emerald-600 font-bold">R$ {prize.value}</span>}
                            <button type="button" onClick={() => removePrize(prize.id)} className="text-zinc-300 hover:text-red-400 transition-all"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Posição"
                              min={1}
                              className="w-20 h-10 rounded-xl border border-zinc-200 px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-orange"
                              value={newPrize.position}
                              onChange={e => setNewPrize({ ...newPrize, position: parseInt(e.target.value) || 1 })}
                            />
                            <input
                              type="text"
                              placeholder="Descrição do prêmio"
                              className="flex-1 h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:ring-2 focus:ring-brand-orange"
                              value={newPrize.description}
                              onChange={e => setNewPrize({ ...newPrize, description: e.target.value })}
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Valor (R$) — opcional"
                              className="flex-1 h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:ring-2 focus:ring-brand-orange"
                              value={newPrize.value}
                              onChange={e => setNewPrize({ ...newPrize, value: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={addPrize}
                              className="h-10 px-4 bg-brand-orange text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all"
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Promoção */}
                  <div className="glass-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowPromoForm(!showPromoForm)}
                      className="w-full p-6 flex items-center gap-4 hover:bg-zinc-50 transition-all"
                    >
                      <div className="p-3 bg-orange-50 rounded-xl text-brand-orange"><TrendingUp className="w-5 h-5" /></div>
                      <span className="font-bold text-zinc-700 flex-1 text-left">Adicionar promoção</span>
                      {formData.promotions.length > 0 && (
                        <span className="text-xs font-bold bg-brand-orange/10 text-brand-orange px-2.5 py-1 rounded-full">{formData.promotions.length}</span>
                      )}
                      <Plus className={`w-4 h-4 text-zinc-400 transition-transform ${showPromoForm ? 'rotate-45' : ''}`} />
                    </button>

                    {showPromoForm && (
                      <div className="px-6 pb-6 space-y-3 border-t border-zinc-100">
                        {formData.promotions.map((promo: any) => (
                          <div key={promo.id} className="flex items-center gap-2 bg-zinc-50 rounded-xl px-4 py-3">
                            <span className="text-sm font-bold text-zinc-700 flex-1">{promo.quantity} por R$ {promo.price}</span>
                            {promo.description && <span className="text-xs text-zinc-400">{promo.description}</span>}
                            <button type="button" onClick={() => removePromo(promo.id)} className="text-zinc-300 hover:text-red-400 transition-all"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Qtd. títulos"
                              className="w-28 h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:ring-2 focus:ring-brand-orange"
                              value={newPromo.quantity}
                              onChange={e => setNewPromo({ ...newPromo, quantity: parseInt(e.target.value) || 1 })}
                            />
                            <input
                              type="number"
                              placeholder="Preço (R$)"
                              className="flex-1 h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:ring-2 focus:ring-brand-orange"
                              value={newPromo.price}
                              onChange={e => setNewPromo({ ...newPromo, price: e.target.value })}
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Descrição (ex: Promoção Relâmpago)"
                              className="flex-1 h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:ring-2 focus:ring-brand-orange"
                              value={newPromo.description}
                              onChange={e => setNewPromo({ ...newPromo, description: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={addPromo}
                              className="h-10 px-4 bg-brand-orange text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all"
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Data do sorteio */}
                  <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="text-brand-orange w-5 h-5" />
                      <h3 className="font-bold text-zinc-900">Data do sorteio</h3>
                    </div>
                    <div className="flex bg-zinc-100 p-1 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setHasDrawDate(true)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${hasDrawDate ? 'bg-white text-brand-orange shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                          }`}
                      >
                        Já tenho data
                      </button>
                      <button
                        type="button"
                        onClick={() => { setHasDrawDate(false); setFormData({ ...formData, draw_date: '' }); }}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!hasDrawDate ? 'bg-white text-brand-orange shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                          }`}
                      >
                        Não tenho data
                      </button>
                    </div>
                    {hasDrawDate && (
                      <input
                        type="datetime-local"
                        className="w-full h-12 rounded-2xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-brand-orange text-sm"
                        value={formData.draw_date}
                        onChange={e => setFormData({ ...formData, draw_date: e.target.value })}
                      />
                    )}
                    {!hasDrawDate && (
                      <p className="text-xs text-zinc-400 text-center">A data do sorteio poderá ser definida depois.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 text-left">
                {/* Edição de SEO */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-zinc-900 text-base">Configuração de Rastreamento</h3>
                    <button
                      type="button"
                      onClick={generateSeoSuggestions}
                      className="px-3 py-1.5 bg-brand-orange/15 text-brand-orange hover:bg-brand-orange/20 rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
                    >
                      Sugerir Metadados
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Título SEO (Title Tag)</label>
                      <input
                        type="text"
                        className="w-full h-11 rounded-xl border border-zinc-200 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-orange bg-white"
                        placeholder="Título exibido no Google"
                        value={formData.seo_settings?.title_seo || ''}
                        onChange={e => setFormData({
                          ...formData,
                          seo_settings: { ...formData.seo_settings, title_seo: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Slug da URL amigável</label>
                      <input
                        type="text"
                        className="w-full h-11 rounded-xl border border-zinc-200 px-4 text-xs font-mono outline-none focus:ring-2 focus:ring-brand-orange bg-white"
                        placeholder="Ex: fusca-azul-1972"
                        value={formData.seo_settings?.slug || ''}
                        onChange={e => setFormData({
                          ...formData,
                          seo_settings: { ...formData.seo_settings, slug: cleanSlug(e.target.value) }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Descrição de Compartilhamento (Meta Description)</label>
                      <textarea
                        rows={3}
                        className="w-full rounded-xl border border-zinc-200 p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-orange bg-white resize-none"
                        placeholder="Descrição exibida na busca do Google"
                        value={formData.seo_settings?.description_seo || ''}
                        onChange={e => setFormData({
                          ...formData,
                          seo_settings: { ...formData.seo_settings, description_seo: e.target.value }
                        })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Palavra-chave Principal</label>
                        <input
                          type="text"
                          className="w-full h-11 rounded-xl border border-zinc-200 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-orange bg-white"
                          placeholder="Ex: fusca azul"
                          value={formData.seo_settings?.keyword_main || ''}
                          onChange={e => setFormData({
                            ...formData,
                            seo_settings: { ...formData.seo_settings, keyword_main: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Palavras Relacionadas</label>
                        <input
                          type="text"
                          className="w-full h-11 rounded-xl border border-zinc-200 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-orange bg-white"
                          placeholder="Ex: rifa, carro, antigo"
                          value={formData.seo_settings?.keywords_related || ''}
                          onChange={e => setFormData({
                            ...formData,
                            seo_settings: { ...formData.seo_settings, keywords_related: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">URL da Imagem Social</label>
                        <input
                          type="text"
                          className="w-full h-11 rounded-xl border border-zinc-200 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-orange bg-white"
                          placeholder="URL da imagem (1200x630)"
                          value={formData.seo_settings?.image_seo || ''}
                          onChange={e => setFormData({
                            ...formData,
                            seo_settings: { ...formData.seo_settings, image_seo: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Texto Alt da Imagem</label>
                        <input
                          type="text"
                          className="w-full h-11 rounded-xl border border-zinc-200 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-orange bg-white"
                          placeholder="Descrição para Google Imagens"
                          value={formData.seo_settings?.image_alt || ''}
                          onChange={e => setFormData({
                            ...formData,
                            seo_settings: { ...formData.seo_settings, image_alt: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">URL Canônica</label>
                        <input
                          type="text"
                          className="w-full h-11 rounded-xl border border-zinc-200 px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-orange bg-white"
                          placeholder="Deixe vazio para autodetectar"
                          value={formData.seo_settings?.canonical_url || ''}
                          onChange={e => setFormData({
                            ...formData,
                            seo_settings: { ...formData.seo_settings, canonical_url: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Rastreamento Google</label>
                        <select
                          className="w-full h-11 rounded-xl border border-zinc-200 px-3 text-xs bg-white outline-none focus:ring-2 focus:ring-brand-orange"
                          value={formData.seo_settings?.index_status || 'index'}
                          onChange={e => setFormData({
                            ...formData,
                            seo_settings: { ...formData.seo_settings, index_status: e.target.value }
                          })}
                        >
                          <option value="index">Permitir indexar (Recomendado)</option>
                          <option value="noindex">Bloquear indexação (noindex)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Previews Visuais */}
                <div className="space-y-6">
                  <h3 className="font-bold text-zinc-900 text-base">Visualização no Google & Redes Sociais</h3>

                  {/* Google Search Preview */}
                  <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm space-y-2">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Prévia da Busca Google</span>
                    <div className="font-sans text-left">
                      <span className="text-zinc-500 text-xs block truncate max-w-full font-mono">
                        {globalSettings?.seo_site_url || 'https://www.vairifar.com.br'}/rifa/{formData.seo_settings?.slug || cleanSlug(formData.title)}
                      </span>
                      <a href="#" className="text-blue-800 text-lg hover:underline font-medium block leading-snug mt-1 max-w-full truncate">
                        {formData.seo_settings?.title_seo || formData.title || 'Título do sorteio no Google'}
                      </a>
                      <p className="text-zinc-600 text-xs mt-1 leading-normal break-all">
                        {formData.seo_settings?.description_seo || formData.description || 'Preencha a descrição SEO para simular a visualização de snippet de pesquisa no Google.'}
                      </p>
                    </div>
                  </div>

                  {/* WhatsApp / Social Card Preview */}
                  <div className="bg-[#e7f3ef] border border-zinc-200/50 rounded-2xl p-6 shadow-sm space-y-3">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Prévia de Compartilhamento (Card Social)</span>
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden text-left flex flex-col">
                      {formData.image_url && (
                        <img src={formData.image_url} alt="Share" className="w-full h-36 object-cover" />
                      )}
                      <div className="p-4 bg-zinc-50 border-t border-zinc-100 space-y-1">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">VAIRIFAR.COM.BR</span>
                        <span className="font-bold text-zinc-900 text-sm block truncate">
                          {formData.seo_settings?.title_seo || formData.title || 'Título do Compartilhamento'}
                        </span>
                        <span className="text-zinc-500 text-xs block truncate">
                          {formData.seo_settings?.description_seo || formData.description || 'Descrição do sorteio no card social.'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-8 flex gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-8 py-4 rounded-2xl font-bold text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-all flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Voltar
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-brand-green text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {step === 4 ? 'Finalizar' : 'Continuar'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {showTaxTable && (
          <TaxTableModal onClose={() => setShowTaxTable(false)} settings={globalSettings} />
        )}
      </motion.div>
    </div>
  );
};

const MercadoPagoSettingsPanel = () => {
  const [activeEnv, setActiveEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [publicKeyTest, setPublicKeyTest] = useState('');
  const [accessTokenTest, setAccessTokenTest] = useState('');
  const [publicKeyProd, setPublicKeyProd] = useState('');
  const [accessTokenProd, setAccessTokenProd] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Testing and simulation states
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [testActionLoading, setTestActionLoading] = useState(false);
  const [testActionResponse, setTestActionResponse] = useState<any>(null);

  // Webhook and simulation states
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [simulatePayId, setSimulatePayId] = useState('');
  const [simulateStatus, setSimulateStatus] = useState('approved');
  const [simulating, setSimulating] = useState(false);
  
  // Manual confirmation states
  const [manualPayId, setManualPayId] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [confirmingManual, setConfirmingManual] = useState(false);

  // Active Tab inside Mercado Pago (creds, testing, webhooks, guide)
  const [mpTab, setMpTab] = useState<'creds' | 'testing' | 'webhooks' | 'guide'>('creds');

  // Load settings on mount
  const loadSettings = async () => {
    try {
      const data = await fetchJsonWithAuth('/api/admin/mercado-pago/settings');
      if (data.success && data.settings) {
        setActiveEnv(data.settings.active_environment || 'sandbox');
        setPublicKeyTest(data.settings.public_key_test || '');
        setAccessTokenTest(data.settings.access_token_test_masked || '');
        setPublicKeyProd(data.settings.public_key_production || '');
        setAccessTokenProd(data.settings.access_token_production_masked || '');
      }
    } catch (err) {
      console.error('Erro ao carregar configurações do Mercado Pago:', err);
    }
  };

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, title, status, payment_status, ticket_price, total_tickets')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        setCampaigns(data);
        if (data.length > 0) {
          setSelectedCampaignId(data[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Erro ao buscar campanhas:', err);
    }
  };

  const saveSettings = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const data = await fetchJsonWithAuth('/api/admin/mercado-pago/settings', {
        method: 'POST',
        body: JSON.stringify({
          active_environment: activeEnv,
          public_key_test: publicKeyTest,
          access_token_test: accessTokenTest.includes('*') ? '' : accessTokenTest,
          public_key_production: publicKeyProd,
          access_token_production: accessTokenProd.includes('*') ? '' : accessTokenProd
        })
      });
      if (data.success) {
        alert('Configura??es salvas com sucesso!');
        loadSettings();
      } else {
        alert(data.message || 'Erro ao salvar configura??es.');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const data = await fetchJsonWithAuth('/api/admin/mercado-pago/test-connection', {
        method: 'POST'
      });
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Conex?o estabelecida com sucesso!' : 'Falha na conex?o.')
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Erro ao testar conex?o.'
      });
    } finally {
      setTesting(false);
    }
  };

  const loadWebhookLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await fetchJsonWithAuth('/api/admin/mercado-pago/webhooks/logs');
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatePayId) {
      alert('Por favor, informe o ID do pagamento para simular.');
      return;
    }
    setSimulating(true);
    try {
      const data = await fetchJsonWithAuth('/api/admin/mercado-pago/simulate-webhook', {
        method: 'POST',
        body: JSON.stringify({
          payment_id: simulatePayId,
          status: simulateStatus
        })
      });
      alert(data.message || 'Simula??o conclu?da.');
      loadWebhookLogs();
    } catch (err: any) {
      alert(err.message || 'Erro ao simular webhook.');
    } finally {
      setSimulating(false);
    }
  };

  const handleManualConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPayId) {
      alert('Informe o ID do pagamento para confirmar.');
      return;
    }
    if (!manualNotes.trim()) {
      alert('Informe uma justificativa/nota de auditoria.');
      return;
    }
    setConfirmingManual(true);
    try {
      const data = await fetchJsonWithAuth('/api/admin/mercado-pago/manual-confirm', {
        method: 'POST',
        body: JSON.stringify({
          payment_id: manualPayId,
          notes: manualNotes
        })
      });
      alert(data.message || 'Pagamento confirmado manualmente.');
      setManualPayId('');
      setManualNotes('');
      loadWebhookLogs();
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar pagamento manualmente.');
    } finally {
      setConfirmingManual(false);
    }
  };

  // Helper to generate a test payment
  const handleGenerateTestPayment = async (type: 'pix' | 'card_approved' | 'card_declined') => {
    if (!selectedCampaignId) {
      alert('Por favor, crie ou selecione uma campanha primeiro.');
      return;
    }
    setTestActionLoading(true);
    setTestActionResponse(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      let body: any = {
        payment_method: type === 'pix' ? 'pix' : 'credit_card',
        campaign_id: parseInt(selectedCampaignId),
        email: 'test_admin@rifapro.com',
        name: 'Test Admin MercadoPago',
        cpf: '12345678909'
      };

      if (type === 'card_approved') {
        body.token = 'mock_approved_token';
        body.payment_method_id = 'visa';
        body.installments = 1;
      } else if (type === 'card_declined') {
        body.token = 'mock_declined_token';
        body.payment_method_id = 'visa';
        body.installments = 1;
      }

      // To make the actual call to Mercado Pago API fail/succeed accordingly or mock,
      // wait, the server uses the real access token. If mock token is sent, the server will call MP API which might error out.
      // So we can intercept mock tokens in our server or handle them.
      // Wait, let's look at what our server expects in `/api/payments/create`. It calls the Mercado Pago API with token.
      // If we pass a mock_approved_token, Mercado Pago API will return 400 Bad Request because it's not a real token!
      // Ah! For sandbox tests, Mercado Pago has "test cards" that we tokenize via SDK.
      // But in the settings panel "Ambiente de Testes", we want to simulate payment quickly.
      // Let's check: can we just insert a record in `campaign_payments` directly via Supabase client, and bypass Mercado Pago API?
      // Yes! Since we are the Super Admin, we have full database permissions and can insert a simulated test payment directly!
      // This is extremely smart because it doesn't require hitting the real Mercado Pago endpoint with mock card data (which would fail)!
      // Let's check: we can create the campaign_payment record manually in Supabase.
      
      const campaign = campaigns.find(c => c.id.toString() === selectedCampaignId);
      const testPaymentId = `test-${Date.now()}`;
      
      const insertData = {
        campaign_id: parseInt(selectedCampaignId),
        user_id: session.user.id,
        amount: 47.00,
        status: type === 'card_declined' ? 'rejected' : 'pending',
        provider: 'mercado_pago',
        payment_id: testPaymentId,
        external_reference: selectedCampaignId,
        payment_method: type === 'pix' ? 'pix' : 'credit_card',
        qr_code: type === 'pix' ? '00020101021226870014br.gov.bcb.pix2565qr.mercadopago.com/transfer/...' : null,
        qr_code_base64: type === 'pix' ? 'iVBORw0KGgoAAAANSUhEUgAAAJYAAACW...' : null,
        expires_at: new Date(Date.now() + 72 * 3600000).toISOString(),
        paid_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newPay, error } = await supabase
        .from('campaign_payments')
        .insert([insertData])
        .select('*')
        .single();

      if (error) throw error;

      // Automatically fill simulation input with the newly generated payment ID
      setSimulatePayId(testPaymentId);

      setTestActionResponse({
        success: true,
        type: type,
        payment: newPay,
        message: type === 'pix' 
          ? 'PIX de teste gerado com sucesso! Use o ID abaixo para simular a aprovação via Webhook.' 
          : `Pagamento via Cartão (${type === 'card_approved' ? 'Aprovado' : 'Recusado'}) inserido com status inicial '${insertData.status}'.`
      });

      loadWebhookLogs();
    } catch (err: any) {
      setTestActionResponse({
        success: false,
        message: err.message || 'Erro ao gerar pagamento de teste.'
      });
    } finally {
      setTestActionLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadCampaigns();
    loadWebhookLogs();
  }, []);

  const webhookUrl = `${window.location.protocol}//${window.location.host}/api/webhooks/mercado-pago`;

  return (
    <div className="space-y-8">
      {/* MP Navigation Tabs */}
      <div className="flex gap-2 p-1.5 bg-zinc-100 w-fit rounded-[20px]">
        {[
          { id: 'creds', label: 'Credenciais', icon: Shield },
          { id: 'testing', label: 'Ambiente de Testes', icon: Play },
          { id: 'webhooks', label: 'Webhook & Auditoria', icon: FileText },
          { id: 'guide', label: 'Passo a Passo', icon: HelpCircle }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMpTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mpTab === tab.id
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-600'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: CREDENTIALS */}
      {mpTab === 'creds' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3"><Shield className="w-5 h-5 text-emerald-600" /> Credenciais Mercado Pago</h3>
                <p className="text-sm text-zinc-500 font-medium mt-1">Configure o ambiente ativo e as respectivas chaves públicas e privadas.</p>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-2 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setActiveEnv('sandbox')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeEnv === 'sandbox' ? 'bg-amber-500 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  Modo Teste / Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEnv('production')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeEnv === 'production' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  Modo Produção
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-zinc-50">
              {/* Sandbox Creds */}
              <div className="bg-amber-50/40 border border-amber-100 rounded-[2rem] p-8 space-y-6">
                <h4 className="font-black text-amber-800 text-xs uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Credenciais de Teste / Sandbox
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Public Key (Teste)</label>
                    <input
                      type="text"
                      className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      value={publicKeyTest}
                      onChange={e => setPublicKeyTest(e.target.value)}
                      placeholder="TEST-..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Access Token (Teste)</label>
                    <input
                      type="password"
                      className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      value={accessTokenTest}
                      onChange={e => setAccessTokenTest(e.target.value)}
                      placeholder="TEST-..."
                    />
                  </div>
                </div>
              </div>

              {/* Production Creds */}
              <div className="bg-emerald-50/30 border border-emerald-100 rounded-[2rem] p-8 space-y-6">
                <h4 className="font-black text-emerald-800 text-xs uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Credenciais de Produção
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Public Key (Produção)</label>
                    <input
                      type="text"
                      className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      value={publicKeyProd}
                      onChange={e => setPublicKeyProd(e.target.value)}
                      placeholder="APP_USR-..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Access Token (Produção)</label>
                    <input
                      type="password"
                      className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      value={accessTokenProd}
                      onChange={e => setAccessTokenProd(e.target.value)}
                      placeholder="APP_USR-..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Test connection results */}
            {testResult && (
              <div className={`p-6 rounded-2xl border flex gap-3 ${testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                <AlertCircle className={`w-5 h-5 shrink-0 ${testResult.success ? 'text-emerald-600' : 'text-red-600'}`} />
                <div>
                  <p className="font-bold text-sm">{testResult.success ? 'Status: Conectado' : 'Erro de Credencial'}</p>
                  <p className="text-xs font-medium mt-1">{testResult.message}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-between items-center pt-4 border-t border-zinc-50 flex-wrap">
              <button
                type="button"
                onClick={testConnection}
                disabled={testing}
                className="px-6 py-4 bg-zinc-950 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCcw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Testando Conexão...' : 'Testar Conexão com Mercado Pago'}
              </button>

              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                {saving ? 'Salvando...' : 'Salvar Credenciais'}
              </button>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-zinc-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div>
                <h3 className="text-2xl font-black mb-2">Segurança em Primeiro Lugar</h3>
                <p className="text-zinc-400 font-medium max-w-xl">Todos os Access Tokens são salvos criptografados com criptografia simétrica AES-256-CBC no backend e nunca são transmitidos em texto limpo para o cliente. Apenas a chave pública correspondente ao ambiente ativo é exposta ao frontend.</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full -mr-48 -mt-48"></div>
          </div>
        </div>
      )}

      {/* Tab: TESTING */}
      {mpTab === 'testing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Simulation setup */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3"><Play className="w-5 h-5 text-amber-500" /> Simulação de Pagamentos</h3>
              <p className="text-sm text-zinc-500 font-medium">Selecione uma campanha cadastrada e crie um pagamento fictício localmente para validar o fluxo de ativação e webhooks.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Selecione a Campanha</label>
                  <select
                    className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    value={selectedCampaignId}
                    onChange={e => setSelectedCampaignId(e.target.value)}
                  >
                    {campaigns.length > 0 ? (
                      campaigns.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title} (Status: {c.status} | Pagamento: {c.payment_status || 'pendente'})
                        </option>
                      ))
                    ) : (
                      <option value="">Nenhuma campanha cadastrada</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => handleGenerateTestPayment('pix')}
                    disabled={testActionLoading}
                    className="py-4 px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border border-emerald-100 flex flex-col items-center justify-center gap-2"
                  >
                    <QrCode className="w-5 h-5" />
                    Gerar PIX de Teste
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateTestPayment('card_approved')}
                    disabled={testActionLoading}
                    className="py-4 px-4 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex flex-col items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Gerar Cartão Aprovado
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateTestPayment('card_declined')}
                    disabled={testActionLoading}
                    className="py-4 px-4 bg-red-50 text-red-700 hover:bg-red-100 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border border-red-100 flex flex-col items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Gerar Cartão Recusado
                  </button>
                </div>
              </div>
            </div>

            {/* Test result details */}
            {testActionResponse && (
              <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-wider">Resultado da Geração de Teste</h4>
                  <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${testActionResponse.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {testActionResponse.success ? 'Sucesso' : 'Erro'}
                  </span>
                </div>
                
                <p className="text-sm font-medium text-zinc-600">{testActionResponse.message}</p>
                
                {testActionResponse.payment && (
                  <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 space-y-3 font-mono text-xs text-zinc-700">
                    <p><strong>Payment ID:</strong> {testActionResponse.payment.payment_id}</p>
                    <p><strong>Status:</strong> {testActionResponse.payment.status}</p>
                    <p><strong>Método:</strong> {testActionResponse.payment.payment_method}</p>
                    <p><strong>Campanha ID:</strong> {testActionResponse.payment.campaign_id}</p>
                    {testActionResponse.payment.qr_code && (
                      <p className="break-all"><strong>Copia e Cola:</strong> {testActionResponse.payment.qr_code}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Webhook simulator */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-zinc-900">Simulador de Webhook</h3>
              <p className="text-xs text-zinc-500 font-medium">Dispara um evento simulado para o endpoint de webhook local para atualizar o pagamento fictício acima.</p>

              <form onSubmit={handleSimulateWebhook} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Payment ID</label>
                  <input
                    type="text"
                    required
                    className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Cole o ID gerado ao lado"
                    value={simulatePayId}
                    onChange={e => setSimulatePayId(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Simular Status</label>
                  <select
                    className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    value={simulateStatus}
                    onChange={e => setSimulateStatus(e.target.value)}
                  >
                    <option value="approved">approved (Aprovado / Ativar Campanha)</option>
                    <option value="pending">pending (Pendente)</option>
                    <option value="rejected">rejected (Recusado)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={simulating || !simulatePayId}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                >
                  <RefreshCcw className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
                  {simulating ? 'Disparando...' : 'Simular Webhook'}
                </button>
              </form>
            </div>

            <div className="bg-zinc-50 border border-zinc-100 rounded-[2rem] p-8 space-y-3">
              <h4 className="font-bold text-zinc-800 text-xs uppercase tracking-wider">Como Homologar?</h4>
              <ol className="text-xs text-zinc-500 space-y-2 list-decimal list-inside font-medium leading-relaxed">
                <li>Selecione uma campanha pendente de pagamento.</li>
                <li>Clique em "Gerar PIX de Teste" para criar um pagamento fictício.</li>
                <li>Note que o ID do pagamento é preenchido no simulador.</li>
                <li>Clique em "Simular Webhook" com status "approved".</li>
                <li>A campanha será ativada e o status mudará para "paid" na tabela de logs!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Tab: WEBHOOKS */}
      {mpTab === 'webhooks' && (
        <div className="space-y-8 animate-fadeIn">
          {/* URL Public and Action bar */}
          <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Webhook do Mercado Pago</h3>
                <p className="text-sm text-zinc-500 font-medium mt-1">Configure o endereço abaixo no painel de desenvolvedores do Mercado Pago.</p>
              </div>
              <button
                type="button"
                onClick={loadWebhookLogs}
                disabled={loadingLogs}
                className="px-6 py-3 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                Atualizar Logs
              </button>
            </div>

            {/* Webhook endpoint URL display */}
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 flex justify-between items-center gap-4 flex-wrap">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">URL de Notificação Oficial (Webhook)</span>
                <p className="font-mono text-zinc-800 text-sm break-all select-all font-bold">{webhookUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  alert('URL copiada para a área de transferência!');
                }}
                className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-100 transition-all flex items-center gap-2 border border-emerald-100"
              >
                <Copy className="w-4 h-4" /> Copiar URL
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Logs Table */}
            <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6 overflow-hidden">
              <h3 className="text-lg font-bold text-zinc-900">Histórico de Eventos Recebidos</h3>
              <div className="overflow-x-auto -mx-10 px-10">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="pb-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Data / Hora</th>
                      <th className="pb-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Tipo</th>
                      <th className="pb-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">ID Pagamento</th>
                      <th className="pb-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Status De &gt; Para</th>
                      <th className="pb-4 text-right text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Processado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 text-xs">
                    {logs.length > 0 ? (
                      logs.map((log: any) => (
                        <tr key={log.id} className="group hover:bg-zinc-50/50 transition-colors">
                          <td className="py-4 text-zinc-500 font-medium">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-4 font-bold text-zinc-700">
                            {log.type}
                          </td>
                          <td className="py-4 font-mono font-bold text-zinc-600 select-all cursor-pointer hover:text-emerald-600" title="Clique para copiar" onClick={() => {
                            navigator.clipboard.writeText(log.payment_id);
                            alert('ID copiado!');
                          }}>
                            {log.payment_id}
                          </td>
                          <td className="py-4 font-medium">
                            <span className="text-zinc-400">{log.status_before || 'unknown'}</span>
                            <span className="text-zinc-400 mx-1.5 font-bold">→</span>
                            <span className={`font-bold uppercase ${log.status_after === 'paid' ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded' : 'text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded'}`}>{log.status_after || 'unknown'}</span>
                          </td>
                          <td className="py-4 text-right">
                            {log.processed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Sim
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded-full" title={log.error_message}>
                                <X className="w-3 h-3" /> Não
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-zinc-400 italic">
                          Nenhuma notificação recebida ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Manual override / audit */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2"><SettingsIcon className="w-4 h-4 text-emerald-600" /> Confirmação Manual</h3>
                <p className="text-xs text-zinc-500 font-medium">Fallback emergencial. Permite que um administrador marque um pagamento como pago e ative a campanha, gerando um registro no log de auditoria.</p>
              </div>

              <form onSubmit={handleManualConfirm} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">ID do Pagamento (Mercado Pago)</label>
                  <input
                    type="text"
                    required
                    className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: test-171732912 ou 1234567"
                    value={manualPayId}
                    onChange={e => setManualPayId(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Justificativa / Notas</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full rounded-xl border border-zinc-200 p-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                    placeholder="Justifique a confirmação manual..."
                    value={manualNotes}
                    onChange={e => setManualNotes(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={confirmingManual || !manualPayId || !manualNotes.trim()}
                  className="w-full py-4 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  {confirmingManual ? 'Confirmando...' : 'Confirmar Pagamento'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab: GUIDE */}
      {mpTab === 'guide' && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8 animate-fadeIn">
          <div>
            <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3"><HelpCircle className="w-5 h-5 text-emerald-600" /> Passo a Passo de Configuração</h3>
            <p className="text-sm text-zinc-500 font-medium mt-1">Siga este guia simples para integrar sua conta Mercado Pago de ponta a ponta.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: 'Painel de Desenvolvedores', desc: 'Acesse o Painel de Desenvolvedores do Mercado Pago no link do suporte.' },
                { step: 2, title: 'Criação da Aplicação', desc: 'Crie ou selecione uma aplicação de checkout na plataforma.' },
                { step: 3, title: 'Obtenção de Credenciais de Teste', desc: 'Copie a Public Key e o Access Token de teste/sandbox.' },
                { step: 4, title: 'Configuração no Sistema', desc: 'Cole no sistema no modo de Teste e salve as alterações.' },
                { step: 5, title: 'Testar Conexão', desc: 'Clique em "Testar conexão" para validar as chaves no sandbox.' },
                { step: 6, title: 'Gerar Pagamento Teste', desc: 'Gere um pagamento teste PIX ou cartão no painel "Ambiente de Testes".' }
              ].map(item => (
                <div key={item.step} className="flex gap-4 border border-zinc-100 rounded-2xl p-5 hover:bg-zinc-50/50 transition-colors">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-700 font-black rounded-full flex items-center justify-center shrink-0 text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm">{item.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {[
                { step: 7, title: 'Configurar Webhook', desc: `Configure a URL oficial no Mercado Pago: ${webhookUrl}` },
                { step: 8, title: 'Validar Webhooks', desc: 'Use o painel "Simular Webhook" para validar a atualização automática de campanhas.' },
                { step: 9, title: 'Confirmação Manual', desc: 'Verifique nos logs do webhook se os logs e as transações de auditoria estão sendo gravados.' },
                { step: 10, title: 'Homologação e Homologar Produção', desc: 'Altere para o ambiente de Produção e cole as credenciais reais.' },
                { step: 11, title: 'Criar webhook de Produção', desc: 'Crie o webhook da aplicação no modo Produção com os eventos payment.created e payment.updated.' },
                { step: 12, title: 'Homologação Final', desc: 'Faça um pagamento real de baixo valor (ex: R$ 1,00) via PIX no checkout transparente para validação final.' }
              ].map(item => (
                <div key={item.step} className="flex gap-4 border border-zinc-100 rounded-2xl p-5 hover:bg-zinc-50/50 transition-colors">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-700 font-black rounded-full flex items-center justify-center shrink-0 text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm">{item.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SeoSettingsPanel = ({ globalSettings, onRefreshSettings, user }: { globalSettings: any, onRefreshSettings: () => void | Promise<any>, user: User }) => {
  const [seoTab, setSeoTab] = useState<'settings' | 'redirects' | 'notfound' | 'audit'>('settings');
  const [localSettings, setLocalSettings] = useState<any>(globalSettings || {});
  const [saving, setSaving] = useState(false);

  // Estados de Redirecionamentos
  const [redirects, setRedirects] = useState<any[]>([]);
  const [loadingRedirects, setLoadingRedirects] = useState(false);
  const [showRedirectForm, setShowRedirectForm] = useState(false);
  const [redirectFormData, setRedirectFormData] = useState({
    id: undefined as number | undefined,
    old_url: '',
    new_url: '',
    redirect_type: 301,
    active: true
  });

  // Estados de Logs 404
  const [notfoundLogs, setNotfoundLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Estados de Campanhas para Auditoria de Alt Text
  const [auditCampaigns, setAuditCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    setLocalSettings(globalSettings || {});
  }, [globalSettings]);

  const loadRedirects = async () => {
    setLoadingRedirects(true);
    try {
      const data = await fetchJsonWithAuth('/api/admin/seo/redirects');
      if (data.success) {
        setRedirects(data.redirects || []);
      }
    } catch (err) {
      console.error('Erro ao carregar redirecionamentos:', err);
    } finally {
      setLoadingRedirects(false);
    }
  };

  const loadNotfoundLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await fetchJsonWithAuth('/api/admin/seo/notfound-logs');
      if (data.success) {
        setNotfoundLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Erro ao carregar logs de 404:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadAuditCampaigns = async () => {
    try {
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .in('status', ['active', 'finished']);
      if (data) setAuditCampaigns(data as Campaign[]);
    } catch (err) {
      console.error('Erro ao carregar campanhas para auditoria:', err);
    }
  };

  useEffect(() => {
    if (seoTab === 'redirects') loadRedirects();
    if (seoTab === 'notfound') loadNotfoundLogs();
    if (seoTab === 'audit') {
      loadNotfoundLogs();
      loadAuditCampaigns();
    }
  }, [seoTab]);

  const handleSaveGlobalSeo = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await fetchJsonWithAuth('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: localSettings })
      });
      alert('Configurações globais de SEO atualizadas com sucesso!');
      await onRefreshSettings();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações de SEO.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchJsonWithAuth('/api/admin/seo/redirects', {
        method: 'POST',
        body: JSON.stringify(redirectFormData)
      });
      alert(res.message || 'Redirecionamento salvo com sucesso.');
      setShowRedirectForm(false);
      setRedirectFormData({ id: undefined, old_url: '', new_url: '', redirect_type: 301, active: true });
      loadRedirects();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar redirecionamento.');
    }
  };

  const handleDeleteRedirect = async (id: number) => {
    if (!confirm('Deseja realmente excluir este redirecionamento?')) return;
    try {
      const res = await fetchJsonWithAuth(`/api/admin/seo/redirects/${id}`, {
        method: 'DELETE'
      });
      alert(res.message || 'Redirecionamento excluído.');
      loadRedirects();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir redirecionamento.');
    }
  };

  const handleDeleteNotFoundLog = async (id: number) => {
    try {
      const res = await fetchJsonWithAuth(`/api/admin/seo/notfound-logs/${id}`, {
        method: 'DELETE'
      });
      loadNotfoundLogs();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir log 404.');
    }
  };

  const handleClearNotFoundLogs = async () => {
    if (!confirm('Deseja realmente limpar todos os logs de erro 404?')) return;
    try {
      const res = await fetchJsonWithAuth('/api/admin/seo/notfound-logs', {
        method: 'DELETE'
      });
      alert(res.message || 'Todos os logs foram excluídos.');
      loadNotfoundLogs();
    } catch (err: any) {
      alert(err.message || 'Erro ao limpar logs.');
    }
  };

  // Funções de Auditoria
  const getAuditStatus = () => {
    const siteUrl = localSettings.seo_site_url;
    const siteTitle = localSettings.seo_title_default;
    const siteDesc = localSettings.seo_description_default;
    const companyName = localSettings.seo_company_name;
    const companyCnpj = localSettings.seo_company_cnpj;
    const verificationTag = localSettings.google_search_console_tag;
    const gaId = localSettings.google_analytics_id || localSettings.lgpd_script_ga_id;

    const items = [
      {
        id: 'sitemap',
        name: 'Sitemap XML Automático',
        status: siteUrl ? 'OK' : 'Atenção',
        desc: siteUrl ? `Indexador ativo. Sitemap em: ${siteUrl}/sitemap.xml` : 'Configure a URL oficial do site para habilitar o sitemap com URLs corretas.',
        link: siteUrl ? `${siteUrl}/sitemap.xml` : undefined
      },
      {
        id: 'robots',
        name: 'Robots.txt Dinâmico',
        status: 'OK',
        desc: 'Arquivo robots.txt configurado dinamicamente no servidor, liberando caminhos públicos e bloqueando checkout e painéis privados.',
        link: siteUrl ? `${siteUrl}/robots.txt` : '/robots.txt'
      },
      {
        id: 'google_verification',
        name: 'Google Search Console',
        status: verificationTag ? 'OK' : 'Pendente',
        desc: verificationTag ? 'Meta tag de verificação configurada com sucesso.' : 'Tag de verificação do Search Console não cadastrada.',
      },
      {
        id: 'google_analytics',
        name: 'Google Analytics 4',
        status: gaId ? 'OK' : 'Pendente',
        desc: gaId ? 'GA4 configurado com carregamento condicional pela LGPD.' : 'ID do Google Analytics não configurado.',
      },
      {
        id: 'global_seo',
        name: 'Título e Descrição SEO Padrão',
        status: (siteTitle && siteDesc) ? 'OK' : 'Erro',
        desc: (siteTitle && siteDesc) ? 'Título e descrição de compartilhamento global configurados.' : 'Por favor, preencha o Título padrão e a Descrição padrão para evitar tags vazias no Google.',
      },
      {
        id: 'structured_data',
        name: 'Dados Estruturados JSON-LD',
        status: (companyName && companyCnpj) ? 'OK' : 'Atenção',
        desc: (companyName && companyCnpj) ? 'Schemas Organization e WebSite configurados com CNPJ e detalhes corporativos.' : 'Cadastre o Nome da Empresa e o CNPJ nas Configurações Globais de SEO para ativar os dados estruturados de Organization completos no Google.',
      },
      {
        id: 'image_alt',
        name: 'Imagens de Campanhas com Alt Text',
        status: auditCampaigns.length === 0 ? 'OK' : (auditCampaigns.filter(c => !(c.seo_settings as any)?.image_alt).length === 0 ? 'OK' : 'Atenção'),
        desc: (() => {
          if (auditCampaigns.length === 0) return 'Nenhuma campanha cadastrada.';
          const missing = auditCampaigns.filter(c => !(c.seo_settings as any)?.image_alt);
          if (missing.length === 0) return 'Todas as imagens de campanhas ativas possuem texto alternativo (Alt text). Excelente!';
          return `Existem ${missing.length} campanhas de rifas ativas que não possuem o campo 'Alt Text' da imagem de SEO configurado. Isso prejudica o ranqueamento no Google Imagens.`;
        })()
      },
      {
        id: 'notfound_monitored',
        name: 'Monitoramento de Páginas 404',
        status: notfoundLogs.length > 5 ? 'Atenção' : 'OK',
        desc: notfoundLogs.length > 0 ? `Foram registrados ${notfoundLogs.reduce((acc, log) => acc + (log.occurrences || 1), 0)} acessos à páginas não encontradas. Verifique e crie redirecionamentos para preservar a autoridade do site.` : 'Nenhum erro de página 404 recente registrado. Fantástico!',
      }
    ];

    const counts = items.reduce((acc, it) => {
      acc[it.status] = (acc[it.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { items, counts };
  };

  const audit = getAuditStatus();

  return (
    <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden text-left">
      {/* Header */}
      <div className="p-8 border-b border-zinc-100 flex flex-wrap justify-between items-center bg-zinc-50/50 gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 flex items-center gap-3">
            <Globe className="w-5 h-5 text-emerald-600 animate-pulse" /> SEO e Google
          </h2>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Configurações globais, Sitemap, Robots, Redirecionamentos e Auditoria</p>
        </div>
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-2xl">
          {[
            { id: 'settings', label: 'Globais & Scripts', icon: SettingsIcon },
            { id: 'redirects', label: 'Redirecionamentos', icon: Link2 },
            { id: 'notfound', label: 'Erros 404', icon: AlertCircle },
            { id: 'audit', label: 'Auditoria SEO', icon: CheckCircle2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSeoTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${seoTab === tab.id
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-600'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-8">
        {/* TAB 1: SETTINGS */}
        {seoTab === 'settings' && (
          <form onSubmit={handleSaveGlobalSeo} className="space-y-8 animate-fadeIn">
            {/* Sitemap & Robots.txt Links */}
            <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-8 space-y-4">
              <div>
                <h4 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                  <Map className="w-4 h-4 text-emerald-600 animate-bounce" /> Sitemaps e Indexação
                </h4>
                <p className="text-xs text-zinc-500 font-medium mt-1">O sistema gera automaticamente arquivos XML e robots.txt dinâmicos. Envie os links abaixo no seu Google Search Console para acelerar a indexação das suas páginas e rifas.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { name: "Sitemap Principal", url: localSettings.seo_site_url ? `${localSettings.seo_site_url}/sitemap.xml` : "/sitemap.xml", desc: "Indexa todos os outros sitemaps." },
                  { name: "Sitemap de Rifas", url: localSettings.seo_site_url ? `${localSettings.seo_site_url}/sitemap-rifas.xml` : "/sitemap-rifas.xml", desc: "Contém todas as campanhas ativas." },
                  { name: "Sitemap de Páginas", url: localSettings.seo_site_url ? `${localSettings.seo_site_url}/sitemap-pages.xml` : "/sitemap-pages.xml", desc: "Páginas institucionais e LGPD." },
                  { name: "Sitemap de Categorias", url: localSettings.seo_site_url ? `${localSettings.seo_site_url}/sitemap-categorias.xml` : "/sitemap-categorias.xml", desc: "Categorias gerais de sorteios." },
                  { name: "Arquivo Robots.txt", url: localSettings.seo_site_url ? `${localSettings.seo_site_url}/robots.txt` : "/robots.txt", desc: "Instruções para os robôs de busca." }
                ].map((item, index) => (
                  <div key={index} className="bg-white border border-zinc-100 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.name}</span>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-50">
                      <a href={localSettings.seo_site_url ? item.url : "#"} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] font-bold text-emerald-600 truncate hover:underline" title="Clique para abrir">
                        {localSettings.seo_site_url ? item.url : "URL pendente"}
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          const fullUrl = localSettings.seo_site_url ? item.url : `${window.location.origin}${item.url}`;
                          navigator.clipboard.writeText(fullUrl);
                          alert('Link copiado!');
                        }}
                        className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-600"
                        title="Copiar Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEO Base */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-zinc-800 border-b border-zinc-50 pb-2">Metadados Globais Padrão (Fallback)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Título Padrão do Site</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_title_default || ''} onChange={e => setLocalSettings({ ...localSettings, seo_title_default: e.target.value })} placeholder="Ex: VaiRifar - Sorteios e Campanhas Online" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">URL Oficial do Site</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_site_url || ''} onChange={e => setLocalSettings({ ...localSettings, seo_site_url: e.target.value })} placeholder="Ex: https://www.vairifar.com.br" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Descrição Padrão (Meta Description)</label>
                  <textarea rows={3} className="w-full rounded-xl border border-zinc-200 p-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm" value={localSettings.seo_description_default || ''} onChange={e => setLocalSettings({ ...localSettings, seo_description_default: e.target.value })} placeholder="Descrição para o Google (recomendado até 160 caracteres)" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Palavras-chave Padrão</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_keywords_default || ''} onChange={e => setLocalSettings({ ...localSettings, seo_keywords_default: e.target.value })} placeholder="rifas online, sorteios online, cota premiada" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Nome da Marca</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_site_name || ''} onChange={e => setLocalSettings({ ...localSettings, seo_site_name: e.target.value })} placeholder="Ex: VaiRifar" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">URL da Imagem Social de Compartilhamento (1200x630)</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_share_image || ''} onChange={e => setLocalSettings({ ...localSettings, seo_share_image: e.target.value })} placeholder="Ex: https://dominio.com/assets/og-default.jpg" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Favicon (URL do ícone do navegador)</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_favicon_url || ''} onChange={e => setLocalSettings({ ...localSettings, seo_favicon_url: e.target.value, site_favicon_url: e.target.value })} placeholder="Ex: https://dominio.com/favicon.ico" />
                </div>
              </div>
            </div>

            {/* Local Business / Dados Estruturados */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-bold text-zinc-800 border-b border-zinc-50 pb-2">Informações da Empresa e SEO Local (Schema Organization)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Razão Social / Nome da Empresa</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_company_name || ''} onChange={e => setLocalSettings({ ...localSettings, seo_company_name: e.target.value })} placeholder="Ex: Vai Rifar Soluções Digitais LTDA" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">CNPJ</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_company_cnpj || ''} onChange={e => setLocalSettings({ ...localSettings, seo_company_cnpj: e.target.value })} placeholder="Ex: 00.000.000/0001-00" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Telefone Principal</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_company_phone || ''} onChange={e => setLocalSettings({ ...localSettings, seo_company_phone: e.target.value })} placeholder="Ex: (11) 4002-8922" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">WhatsApp Oficial</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_company_whatsapp || ''} onChange={e => setLocalSettings({ ...localSettings, seo_company_whatsapp: e.target.value })} placeholder="Ex: 5511999999999" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">E-mail Corporativo</label>
                  <input type="email" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_company_email || ''} onChange={e => setLocalSettings({ ...localSettings, seo_company_email: e.target.value })} placeholder="Ex: contato@vairifar.com.br" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Endereço Completo</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_company_address || ''} onChange={e => setLocalSettings({ ...localSettings, seo_company_address: e.target.value })} placeholder="Av. Paulista, 1000, Bela Vista, São Paulo - SP" />
                </div>
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-bold text-zinc-800 border-b border-zinc-50 pb-2">Redes Sociais Oficiais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Instagram Link</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_social_instagram || ''} onChange={e => setLocalSettings({ ...localSettings, seo_social_instagram: e.target.value })} placeholder="https://instagram.com/perfil" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Facebook Link</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_social_facebook || ''} onChange={e => setLocalSettings({ ...localSettings, seo_social_facebook: e.target.value })} placeholder="https://facebook.com/pagina" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">YouTube Link</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_social_youtube || ''} onChange={e => setLocalSettings({ ...localSettings, seo_social_youtube: e.target.value })} placeholder="https://youtube.com/canal" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Twitter/X Link</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_social_twitter || ''} onChange={e => setLocalSettings({ ...localSettings, seo_social_twitter: e.target.value })} placeholder="https://twitter.com/usuario" />
                </div>
              </div>
            </div>

            {/* Integração Google */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-bold text-zinc-800 border-b border-zinc-50 pb-2">Verificação Google & Tags de Rastreamento (LGPD-safe)</h3>
              <p className="text-xs text-zinc-400 font-medium">Os scripts de Marketing e Estatísticas só serão inicializados no navegador caso o usuário concorde no banner de cookies.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Google Search Console Verification Tag</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.google_search_console_tag || ''} onChange={e => setLocalSettings({ ...localSettings, google_search_console_tag: e.target.value })} placeholder='Ex: <meta name="google-site-verification" content="XYZ..." /> ou código do Search Console' />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Google Analytics 4 ID (GA4)</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.google_analytics_id || ''} onChange={e => {
                    const val = e.target.value;
                    setLocalSettings({ ...localSettings, google_analytics_id: val, lgpd_script_ga_id: val });
                  }} placeholder="G-XXXXXXXXXX" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Google Tag Manager ID (GTM)</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_script_gtm_id || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_script_gtm_id: e.target.value })} placeholder="GTM-XXXXXXX" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Google Ads Conversion ID</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.google_ads_conversion_id || ''} onChange={e => setLocalSettings({ ...localSettings, google_ads_conversion_id: e.target.value })} placeholder="AW-XXXXXXXXX" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Meta Pixel ID (Facebook)</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.facebook_pixel_id || ''} onChange={e => {
                    const val = e.target.value;
                    setLocalSettings({ ...localSettings, facebook_pixel_id: val, lgpd_script_meta_pixel_id: val });
                  }} placeholder="Ex: 123456789012" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Microsoft Clarity ID</label>
                  <input type="text" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_script_clarity_id || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_script_clarity_id: e.target.value })} placeholder="Ex: abcde123" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Configuração de Rastreamento Adicional (Robots.txt Customizado)</label>
                  <textarea rows={4} className="w-full rounded-xl border border-zinc-200 p-4 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500 resize-none" value={localSettings.seo_robots_txt || ''} onChange={e => setLocalSettings({ ...localSettings, seo_robots_txt: e.target.value })} placeholder="Deixe em branco para usar o robots.txt padrão gerado automaticamente pelo sistema." />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={saving} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-sm shadow-md">
                {saving ? 'Salvando...' : 'Salvar Alterações de SEO'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: REDIRECTS */}
        {seoTab === 'redirects' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-800">Redirecionamentos de URLs (301/302)</h3>
                <p className="text-xs text-zinc-400 font-medium">Mapeie links antigos ou quebrados para novas páginas preservando o pagerank.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRedirectFormData({ id: undefined, old_url: '', new_url: '', redirect_type: 301, active: true });
                  setShowRedirectForm(true);
                }}
                className="px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Novo Redirecionamento
              </button>
            </div>

            {showRedirectForm && (
              <form onSubmit={handleSaveRedirect} className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 space-y-4 animate-in fade-in duration-200 text-left">
                <h4 className="font-bold text-zinc-800 text-sm">{redirectFormData.id ? 'Editar Redirecionamento' : 'Criar Novo Redirecionamento'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Origem (URL Antiga)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: /sorteio-fusca"
                      className="w-full h-11 rounded-lg border border-zinc-200 px-4 text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                      value={redirectFormData.old_url}
                      onChange={e => setRedirectFormData({ ...redirectFormData, old_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Destino (URL Nova)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: /rifa/fusca-azul-1972"
                      className="w-full h-11 rounded-lg border border-zinc-200 px-4 text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                      value={redirectFormData.new_url}
                      onChange={e => setRedirectFormData({ ...redirectFormData, new_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Tipo do Redirecionamento</label>
                    <select
                      className="w-full h-11 rounded-lg border border-zinc-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                      value={redirectFormData.redirect_type}
                      onChange={e => setRedirectFormData({ ...redirectFormData, redirect_type: parseInt(e.target.value) })}
                    >
                      <option value={301}>301 (Permanente - Mantém SEO)</option>
                      <option value={302}>302 (Temporário)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6 pl-1">
                    <input
                      type="checkbox"
                      id="redirect-active"
                      className="w-5 h-5 rounded text-emerald-600 border-zinc-300 focus:ring-emerald-500 cursor-pointer"
                      checked={redirectFormData.active}
                      onChange={e => setRedirectFormData({ ...redirectFormData, active: e.target.checked })}
                    />
                    <label htmlFor="redirect-active" className="text-xs font-bold text-zinc-600 cursor-pointer uppercase tracking-wider">Habilitar Redirecionamento</label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowRedirectForm(false)} className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all">Salvar</button>
                </div>
              </form>
            )}

            <div className="overflow-hidden border border-zinc-100 rounded-2xl">
              <table className="w-full text-left bg-zinc-50/50">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <th className="px-6 py-4">URL Origem</th>
                    <th className="px-6 py-4">URL Destino</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Cliques</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm bg-white">
                  {loadingRedirects ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-400">Buscando redirecionamentos...</td></tr>
                  ) : redirects.length > 0 ? (
                    redirects.map((r: any) => (
                      <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-zinc-600 font-bold select-all">{r.old_url}</td>
                        <td className="px-6 py-4 font-mono text-xs text-emerald-600 font-bold select-all">{r.new_url}</td>
                        <td className="px-6 py-4 font-bold text-zinc-500">HTTP {r.redirect_type}</td>
                        <td className="px-6 py-4 font-black text-zinc-700">{r.clicks || 0}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${r.active ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>
                            {r.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setRedirectFormData({ id: r.id, old_url: r.old_url, new_url: r.new_url, redirect_type: r.redirect_type, active: r.active });
                                setShowRedirectForm(true);
                              }}
                              className="text-zinc-400 hover:text-emerald-600 text-xs font-bold uppercase tracking-widest"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRedirect(r.id)}
                              className="text-red-400 hover:text-red-600 text-xs font-bold uppercase tracking-widest"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-400 text-sm font-medium">Nenhum redirecionamento configurado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: NOT FOUND (404) LOGS */}
        {seoTab === 'notfound' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-800">Monitoramento de Erros 404 (Página Não Encontrada)</h3>
                <p className="text-xs text-zinc-400 font-medium">Lista de caminhos inválidos acessados por usuários ou rastreadores.</p>
              </div>
              {notfoundLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearNotFoundLogs}
                  className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2 border border-red-100"
                >
                  <Trash2 className="w-4 h-4" /> Limpar Todos os Logs
                </button>
              )}
            </div>

            <div className="overflow-hidden border border-zinc-100 rounded-2xl">
              <table className="w-full text-left bg-zinc-50/50">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <th className="px-6 py-4">URL Inválida</th>
                    <th className="px-6 py-4">Origem / Referrer</th>
                    <th className="px-6 py-4">Ocorrências</th>
                    <th className="px-6 py-4">Última Tentativa</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm bg-white">
                  {loadingLogs ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-400">Buscando logs...</td></tr>
                  ) : notfoundLogs.length > 0 ? (
                    notfoundLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-red-500 font-bold select-all">{log.url}</td>
                        <td className="px-6 py-4 text-xs text-zinc-500 max-w-xs truncate font-mono" title={log.referrer || 'Acesso Direto'}>
                          {log.referrer || <span className="text-zinc-300 italic">Acesso Direto</span>}
                        </td>
                        <td className="px-6 py-4 font-black text-zinc-700">{log.occurrences || 1}</td>
                        <td className="px-6 py-4 text-zinc-400">{new Date(log.updated_at || log.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setRedirectFormData({ id: undefined, old_url: log.url, new_url: '', redirect_type: 301, active: true });
                                setSeoTab('redirects');
                                setShowRedirectForm(true);
                              }}
                              className="text-emerald-600 hover:text-emerald-700 text-xs font-bold uppercase tracking-widest flex items-center gap-1"
                            >
                              <Link2 className="w-3.5 h-3.5" /> Criar Redirect
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNotFoundLog(log.id)}
                              className="text-zinc-400 hover:text-red-600 text-xs font-bold uppercase tracking-widest"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-400 text-sm font-medium">Nenhum log de erro 404 registrado. Tudo funcionando perfeitamente!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: AUDITORIA E CHECKLIST */}
        {seoTab === 'audit' && (
          <div className="space-y-8 animate-fadeIn text-left">
            {/* Audit Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Ítens Conformidade</span>
                <span className="text-3xl font-black text-emerald-700 mt-1 block">{audit.counts['OK'] || 0} / {audit.items.length}</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">Melhorias / Sugestões</span>
                <span className="text-3xl font-black text-amber-700 mt-1 block">{audit.counts['Atenção'] || 0}</span>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block">Ações Críticas Pendentes</span>
                <span className="text-3xl font-black text-red-700 mt-1 block">{audit.counts['Erro'] || 0}</span>
              </div>
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 text-center">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Pendentes de Terceiros</span>
                <span className="text-3xl font-black text-zinc-600 mt-1 block">{audit.counts['Pendente'] || 0}</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-zinc-50 rounded-[2rem] border border-zinc-100 p-8 space-y-4">
              <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-2">Checklist de Rastreamento e Indexação Google</h3>
              <div className="divide-y divide-zinc-200/60">
                {audit.items.map((item) => (
                  <div key={item.id} className="py-4 flex justify-between items-start gap-4 flex-wrap first:pt-0 last:pb-0">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-800 text-sm">{item.name}</span>
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-1 text-zinc-400 hover:text-zinc-600 inline-block">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-2xl">{item.desc}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      item.status === 'OK' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'Atenção' ? 'bg-amber-100 text-amber-700' :
                      item.status === 'Erro' ? 'bg-red-100 text-red-700' :
                      'bg-zinc-100 text-zinc-500'
                    }`}>
                      {item.status === 'OK' && 'Concluído'}
                      {item.status === 'Atenção' && 'Melhoria'}
                      {item.status === 'Erro' && 'Ação Crítica'}
                      {item.status === 'Pendente' && 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guia Técnico */}
            <div className="bg-zinc-950 p-8 rounded-[2rem] text-zinc-300 space-y-4 font-medium text-xs leading-relaxed">
              <h4 className="text-white font-bold text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400" /> Relatório SEO Profissional e Rastreamento Local</h4>
              <p>O Vai Rifar foi otimizado com base na documentação do <b>Google Search Central</b> para maximizar o ranqueamento orgânico:</p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li><b>Prerendering Dinâmico (SEO Server-Side):</b> O servidor Express agora intercepta crawlers (Googlebot, Bingbot, card do WhatsApp) e injeta tags Meta Open Graph, Twitter Cards e scripts JSON-LD antes de servir o HTML para o cliente SPA.</li>
                <li><b>Dados Estruturados Schema.org:</b> Ativação de tags <code className="text-zinc-200">Organization</code> e <code className="text-zinc-200">WebSite</code> na Home e <code className="text-zinc-200">Product</code> / <code className="text-zinc-200">Offer</code> na página de rifas, facilitando a exibição de Rich Snippets de produtos e preços nos resultados do Google.</li>
                <li><b>URLs Amigáveis e Breadcrumbs:</b> Substituição das URLs antigas baseadas em parâmetros pelo formato limpo <code className="text-emerald-400">/rifa/nome-do-sorteio</code> e injeção automática de Breadcrumbs com marcação JSON-LD.</li>
                <li><b>Sitemaps XML Automatizados:</b> Divididos por sitemap principal e submódulos específicos para rifas, páginas institucionais e categorias, atualizando em tempo real com lastmod de alteração.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SuperAdminDashboard = ({ user, globalSettings, onRefreshSettings, onLogout, onNavigateRoot }: { user: User, globalSettings: any, onRefreshSettings: () => void | Promise<any>, onLogout: () => void, onNavigateRoot?: (page: string) => void }) => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'settings'>('stats');
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'payments' | 'taxes' | 'email' | 'mercadopago' | 'lgpd' | 'seo'>('general');
  const [localSettings, setLocalSettings] = useState<any>(globalSettings);
  const [selectedTemplate, setSelectedTemplate] = useState('order_paid');
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [campaignPayments, setCampaignPayments] = useState<any[]>([]);
  const [paymentsFilter, setPaymentsFilter] = useState('all');

  // Estados de LGPD
  const [consents, setConsents] = useState<any[]>([]);
  const [lgpdRequests, setLgpdRequests] = useState<any[]>([]);
  const [loadingConsents, setLoadingConsents] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    setLocalSettings(globalSettings);
  }, [globalSettings]);

  const fetchLgpdData = async () => {
    setLoadingConsents(true);
    setLoadingRequests(true);
    try {
      const [consentsRes, requestsRes] = await Promise.all([
        supabase
          .from('user_consents')
          .select('*, profiles:user_id(name, email)')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('lgpd_requests')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (consentsRes.data) setConsents(consentsRes.data);
      if (requestsRes.data) setLgpdRequests(requestsRes.data);
    } catch (err) {
      console.error('Erro ao buscar dados de LGPD:', err);
    } finally {
      setLoadingConsents(false);
      setLoadingRequests(false);
    }
  };

  const handleUpdateLgpdRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('lgpd_requests')
        .update({ status: newStatus })
        .eq('id', requestId);
      if (error) throw error;
      
      setLgpdRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req)
      );
      alert('Status da solicitação atualizado com sucesso!');
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  useEffect(() => {
    if (settingsSubTab === 'lgpd') {
      fetchLgpdData();
    }
  }, [settingsSubTab]);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      const [campaignsResult, organizersResult, paidOrdersResult, usersResult] = await Promise.all([
        supabase.from('campaigns').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'organizer'),
        supabase.from('orders').select('total_amount').eq('status', 'paid'),
        supabase.from('profiles').select('*').neq('role', 'super_admin').order('created_at', { ascending: false })
      ]);

      const totalRevenue = paidOrdersResult.data?.reduce((acc, o) => acc + (o.total_amount || 0), 0) || 0;

      setStats({
        total_campaigns: campaignsResult.count || 0,
        total_organizers: organizersResult.count || 0,
        total_revenue: totalRevenue,
        tickets_sold: paidOrdersResult.data?.length || 0
      });

      if (usersResult.data) setUsers(usersResult.data);
    } catch (err) {
      console.error('Erro ao buscar dados do super admin:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleUpdateSettings = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await fetchJsonWithAuth('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: localSettings })
      });
      persistSettingsCache(localSettings);
      applySiteTheme(localSettings);
      preloadSiteLogo(localSettings);
      alert('Configura??es atualizadas!');
      await onRefreshSettings();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Deseja realmente deletar este organizador? Esta ação é irreversível e removerá todos os dados vinculados.')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert('Usuário deletado com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao deletar usuário');
    }
  };

  const parseJson = (key: string) => { try { return JSON.parse(localSettings[key] || '[]'); } catch { return []; } };
  const updateJson = (key: string, val: any) => setLocalSettings({ ...localSettings, [key]: JSON.stringify(val) });
  const ICON_OPTIONS = ['Shield', 'Zap', 'Star', 'Globe', 'Users', 'CheckCircle2', 'Rocket', 'Gift', 'DollarSign', 'Ticket', 'Clock', 'Eye'];
  const renderIconByName = (name: string) => {
    const icons: Record<string, any> = { Shield, Zap, Star, Globe, Users, CheckCircle2, Rocket, Gift, DollarSign, Ticket, Clock, Eye };
    const Ic = icons[name] || Star;
    return <Ic className="w-5 h-5" />;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <div className="space-y-8">
            <header>
              <h1 className="text-3xl font-black text-zinc-900 mb-2">Financeiro</h1>
              <p className="text-zinc-500">Acompanhe o desempenho global e os pagamentos de ativação de campanhas.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm border-l-8 border-emerald-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl"><DollarSign className="text-emerald-600 w-6 h-6" /></div>
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Volume Total (Campanhas)</p>
                </div>
                <p className="text-3xl font-black text-zinc-900">R$ {(stats?.total_revenue || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm border-l-8 border-blue-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-50 rounded-2xl"><Users className="text-blue-600 w-6 h-6" /></div>
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Organizadores</p>
                </div>
                <p className="text-3xl font-black text-zinc-900">{stats?.total_organizers || 0}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm border-l-8 border-purple-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-purple-50 rounded-2xl"><Ticket className="text-purple-600 w-6 h-6" /></div>
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Rifas Criadas</p>
                </div>
                <p className="text-3xl font-black text-zinc-900">{stats?.total_campaigns || 0}</p>
              </div>
            </div>

            {/* Pagamentos de Ativação */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3"><Banknote className="w-5 h-5 text-emerald-600" /> Pagamentos de Ativação</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={async () => {
                    const { data } = await supabase.from('campaign_payments').select('*, campaigns(title), profiles(name, email)').order('created_at', { ascending: false });
                    if (data) setCampaignPayments(data);
                  }} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2"><RefreshCcw className="w-3 h-3" /> Atualizar</button>
                  <select className="h-10 rounded-xl border border-zinc-200 px-3 text-xs font-bold bg-white outline-none" value={paymentsFilter} onChange={e => setPaymentsFilter(e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="paid">Pagos</option>
                    <option value="pending">Pendentes</option>
                    <option value="expired">Expirados</option>
                  </select>
                </div>
              </div>
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Campanha</th>
                    <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Organizador</th>
                    <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valor</th>
                    <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Data</th>
                    <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {(paymentsFilter === 'all' ? campaignPayments : campaignPayments.filter(p => p.status === paymentsFilter)).map((p: any) => (
                    <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-zinc-900 text-sm">{p.campaigns?.title || 'Campanha'}</td>
                      <td className="px-8 py-5 text-sm text-zinc-500">{p.profiles?.name || p.profiles?.email || '-'}</td>
                      <td className="px-8 py-5 text-sm font-bold text-zinc-900">R$ {(p.amount || 0).toFixed(2)}</td>
                      <td className="px-8 py-5 text-sm text-zinc-400">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {p.status === 'paid' ? 'Pago' : p.status === 'pending' ? 'Pendente' : 'Expirado'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        {p.status === 'pending' && (
                          <button onClick={async () => {
                            if (!confirm('Confirmar pagamento desta campanha?')) return;
                            await supabase.from('campaign_payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', p.id);
                            await supabase.from('campaigns').update({ status: 'active', payment_status: 'paid' }).eq('id', p.campaign_id);
                            setCampaignPayments(prev => prev.map(pp => pp.id === p.id ? { ...pp, status: 'paid' } : pp));
                            alert('Pagamento confirmado e campanha ativada!');
                          }} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest">Aprovar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {campaignPayments.length === 0 && (
                    <tr><td colSpan={6} className="px-8 py-12 text-center text-zinc-400 text-sm">Clique em "Atualizar" para buscar pagamentos. Se a tabela campaign_payments não existir, crie-a no Supabase.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-8">
            <header>
              <h1 className="text-3xl font-black text-zinc-900 mb-2">Organizadores</h1>
              <p className="text-zinc-500">Gerencie os usuários que criam campanhas na plataforma.</p>
            </header>

            <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Organizador</th>
                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">E-mail</th>
                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900">{u.name}</p>
                            <p className="text-xs text-zinc-400">{new Date(u.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium text-zinc-500">{u.email}</td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {u.status === 'active' ? 'Ativo' : 'Suspenso'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex gap-4">
                          <button
                            onClick={() => toggleUserStatus(u.id, u.status)}
                            className={`text-xs font-bold uppercase tracking-widest transition-colors ${u.status === 'active' ? 'text-amber-500 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                          >
                            {u.status === 'active' ? 'Suspender' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
                          >
                            Deletar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-8">
            <header className="flex flex-col gap-6">
              <div>
                <h1 className="text-3xl font-black text-zinc-900 mb-2">Configurações</h1>
                <p className="text-zinc-500">Ajustes da Landing Page, Pagamentos, Taxas e Comunicação.</p>
              </div>

              <div className="flex gap-2 p-1 bg-zinc-100 w-fit rounded-2xl">
                {[
                  { id: 'general', label: 'Geral', icon: LayoutDashboard },
                  { id: 'taxes', label: 'Taxas', icon: Ticket },
                  { id: 'email', label: 'E-mail', icon: Mail },
                  { id: 'mercadopago', label: 'Mercado Pago', icon: CreditCard },
                  { id: 'lgpd', label: 'LGPD e Privacidade', icon: Shield },
                  { id: 'seo', label: 'SEO e Google', icon: Globe }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSettingsSubTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${settingsSubTab === tab.id
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-600'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </header>

            <div className="space-y-8">
              {settingsSubTab === 'general' && (() => {
                const howItWorks = parseJson('landing_how_it_works');
                const features = parseJson('landing_features');
                const faqItems = parseJson('landing_faq');
                return (
                  <div className="space-y-8">
                    {/* Informações Gerais + Logo */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8">
                      <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3">
                        <LayoutDashboard className="w-5 h-5 text-emerald-600" /> Informações Gerais
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Nome do Site</label>
                          <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.site_name || ''} onChange={e => setLocalSettings({ ...localSettings, site_name: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Logo do Site</label>
                          <div className="flex items-center gap-4">
                            {localSettings.site_logo_url ? (
                              <img src={localSettings.site_logo_url} alt="Logo" className="h-14 max-w-[200px] object-contain rounded-xl border border-zinc-100 p-2" />
                            ) : (
                              <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center"><ImageIcon className="w-6 h-6 text-zinc-300" /></div>
                            )}
                            <input type="file" id="logo-upload-admin" className="hidden" accept="image/*" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 500000) { alert('A imagem deve ter no máximo 500KB.'); return; }
                              const reader = new FileReader();
                              reader.onload = () => {
                                setLocalSettings({ ...localSettings, site_logo_url: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }} />
                            <button type="button" onClick={() => document.getElementById('logo-upload-admin')?.click()} className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2">
                              <Upload className="w-4 h-4" /> Enviar Logo
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Favicon do Site</label>
                          <div className="flex items-center gap-4">
                            {localSettings.site_favicon_url || localSettings.seo_favicon_url ? (
                              <img src={localSettings.site_favicon_url || localSettings.seo_favicon_url} alt="Favicon" className="w-14 h-14 object-contain rounded-xl border border-zinc-100 p-2" />
                            ) : (
                              <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center"><ImageIcon className="w-6 h-6 text-zinc-300" /></div>
                            )}
                            <input type="file" id="favicon-upload-admin" className="hidden" accept="image/*" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 200000) { alert('A imagem do favicon deve ter no máximo 200KB.'); return; }
                              const reader = new FileReader();
                              reader.onload = () => {
                                setLocalSettings({
                                  ...localSettings,
                                  site_favicon_url: reader.result as string,
                                  seo_favicon_url: reader.result as string
                                });
                              };
                              reader.readAsDataURL(file);
                            }} />
                            <button type="button" onClick={() => document.getElementById('favicon-upload-admin')?.click()} className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2">
                              <Upload className="w-4 h-4" /> Enviar Favicon
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Descrição do Site</label>
                          <textarea className="w-full h-24 rounded-2xl border border-zinc-200 p-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none" value={localSettings.site_description || ''} onChange={e => setLocalSettings({ ...localSettings, site_description: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">WhatsApp de Suporte</label>
                          <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.support_whatsapp || ''} onChange={e => setLocalSettings({ ...localSettings, support_whatsapp: e.target.value })} placeholder="55119999999999" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Cores do Sistema</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            { key: 'primary_color', label: 'Cor Primária', def: '#059669' },
                            { key: 'secondary_color', label: 'Cor Secundária', def: '#f97316' },
                            { key: 'button_color', label: 'Cor dos Botões', def: '#059669' }
                          ].map(c => (
                            <div key={c.key}>
                              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">{c.label}</label>
                              <div className="flex gap-3 items-center">
                                <input type="color" className="w-14 h-14 rounded-2xl border border-zinc-200 p-1 outline-none cursor-pointer" value={localSettings[c.key] || c.def} onChange={e => setLocalSettings({ ...localSettings, [c.key]: e.target.value })} />
                                <span className="text-sm font-mono font-bold text-zinc-500 uppercase">{localSettings[c.key] || c.def}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Como Funciona */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3"><Hash className="w-5 h-5 text-emerald-600" /> Como Funciona</h3>
                        <button type="button" onClick={() => updateJson('landing_how_it_works', [...howItWorks, { title: '', text: '' }])} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Adicionar Passo</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {howItWorks.map((step: any, i: number) => (
                          <div key={i} className="border border-zinc-100 rounded-2xl p-6 space-y-4 relative">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black text-lg">{i + 1}</div>
                            <input type="text" placeholder="Título do passo" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={step.title || ''} onChange={e => { const items = [...howItWorks]; items[i] = { ...items[i], title: e.target.value }; updateJson('landing_how_it_works', items); }} />
                            <textarea placeholder="Descrição" className="w-full h-20 rounded-xl border border-zinc-200 p-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm" value={step.text || ''} onChange={e => { const items = [...howItWorks]; items[i] = { ...items[i], text: e.target.value }; updateJson('landing_how_it_works', items); }} />
                            <button type="button" onClick={() => updateJson('landing_how_it_works', howItWorks.filter((_: any, j: number) => j !== i))} className="absolute top-4 right-4 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                        {howItWorks.length === 0 && <p className="text-zinc-400 text-sm col-span-full text-center py-6">Adicione passos para exibir na Landing Page.</p>}
                      </div>
                    </div>

                    {/* Funcionalidades */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3"><Star className="w-5 h-5 text-emerald-600" /> Funcionalidades</h3>
                        {features.length < 5 && (
                          <button type="button" onClick={() => updateJson('landing_features', [...features, { icon: 'Star', title: '' }])} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Adicionar</button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {features.map((feat: any, i: number) => (
                          <div key={i} className="border border-zinc-100 rounded-2xl p-5 space-y-3 relative text-center">
                            <select className="w-full h-10 rounded-xl border border-zinc-200 px-3 font-medium outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white" value={feat.icon || 'Star'} onChange={e => { const items = [...features]; items[i] = { ...items[i], icon: e.target.value }; updateJson('landing_features', items); }}>
                              {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                            </select>
                            <div className="flex justify-center text-emerald-600">{renderIconByName(feat.icon)}</div>
                            <input type="text" placeholder="Título" className="w-full h-10 rounded-xl border border-zinc-200 px-3 font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-center" value={feat.title || ''} onChange={e => { const items = [...features]; items[i] = { ...items[i], title: e.target.value }; updateJson('landing_features', items); }} />
                            <button type="button" onClick={() => updateJson('landing_features', features.filter((_: any, j: number) => j !== i))} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                        {features.length === 0 && <p className="text-zinc-400 text-sm col-span-full text-center py-6">Adicione até 5 funcionalidades para exibir na Landing Page.</p>}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
                      <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3"><Rocket className="w-5 h-5 text-emerald-600" /> Chamada para Ação (CTA)</h3>
                      <textarea className="w-full h-24 rounded-2xl border border-zinc-200 p-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none" value={localSettings.landing_cta_text || 'Aqui você cria a sua campanha e recebe a arrecadação diretamente em sua conta!'} onChange={e => setLocalSettings({ ...localSettings, landing_cta_text: e.target.value })} placeholder="Texto do CTA na Landing Page" />
                    </div>

                    {/* FAQ */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3"><HelpCircle className="w-5 h-5 text-emerald-600" /> Dúvidas Frequentes (FAQ)</h3>
                        <button type="button" onClick={() => updateJson('landing_faq', [...faqItems, { question: '', answer: '' }])} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Pergunta</button>
                      </div>
                      <div className="space-y-4">
                        {faqItems.map((faq: any, i: number) => (
                          <div key={i} className="border border-zinc-100 rounded-2xl p-6 space-y-3 relative">
                            <input type="text" placeholder="Pergunta" className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={faq.question || ''} onChange={e => { const items = [...faqItems]; items[i] = { ...items[i], question: e.target.value }; updateJson('landing_faq', items); }} />
                            <textarea placeholder="Resposta" className="w-full h-20 rounded-xl border border-zinc-200 p-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm" value={faq.answer || ''} onChange={e => { const items = [...faqItems]; items[i] = { ...items[i], answer: e.target.value }; updateJson('landing_faq', items); }} />
                            <button type="button" onClick={() => updateJson('landing_faq', faqItems.filter((_: any, j: number) => j !== i))} className="absolute top-4 right-4 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                        {faqItems.length === 0 && <p className="text-zinc-400 text-center py-6 font-medium">Nenhuma pergunta cadastrada.</p>}
                      </div>
                    </div>

                    {/* SEO & Analytics */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
                      <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3"><Globe className="w-5 h-5 text-emerald-600" /> SEO & Analytics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Título SEO (Title Tag)</label>
                          <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_title || ''} onChange={e => setLocalSettings({ ...localSettings, seo_title: e.target.value })} placeholder="Ex: VaiRifar - Rifas Online" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">URL Canônica</label>
                          <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_canonical_url || ''} onChange={e => setLocalSettings({ ...localSettings, seo_canonical_url: e.target.value })} placeholder="https://www.vairifar.com.br" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Meta Description</label>
                          <textarea className="w-full h-24 rounded-2xl border border-zinc-200 p-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none" value={localSettings.seo_description || ''} onChange={e => setLocalSettings({ ...localSettings, seo_description: e.target.value })} placeholder="Descrição para o Google (até 160 caracteres)" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Palavras-chave</label>
                          <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_keywords || ''} onChange={e => setLocalSettings({ ...localSettings, seo_keywords: e.target.value })} placeholder="rifa, sorteio, online, prêmios" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Google Analytics ID</label>
                          <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.google_analytics_id || ''} onChange={e => setLocalSettings({ ...localSettings, google_analytics_id: e.target.value })} placeholder="G-XXXXXXXXXX" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Imagem OG (Open Graph)</label>
                          <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.seo_og_image || ''} onChange={e => setLocalSettings({ ...localSettings, seo_og_image: e.target.value })} placeholder="URL da imagem para redes sociais" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Robots (Indexação)</label>
                          <select className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white" value={localSettings.seo_robots || 'index, follow'} onChange={e => setLocalSettings({ ...localSettings, seo_robots: e.target.value })}>
                            <option value="index, follow">index, follow (Recomendado)</option>
                            <option value="noindex, follow">noindex, follow</option>
                            <option value="index, nofollow">index, nofollow</option>
                            <option value="noindex, nofollow">noindex, nofollow</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}


              {settingsSubTab === 'taxes' && (
                <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3">
                      <SettingsIcon className="w-5 h-5 text-emerald-600" /> Tabela de Taxas de Publicação
                    </h3>
                  </div>
                  <div className="space-y-6">
                    <p className="text-sm text-zinc-500 font-medium">Defina as taxas fixas cobradas dos organizadores com base no valor total de arrecadação da campanha.</p>
                    <TaxTableEditor
                      value={localSettings.tax_table || '[]'}
                      onChange={(v) => setLocalSettings({ ...localSettings, tax_table: v })}
                    />
                  </div>
                </div>
              )}

              {settingsSubTab === 'email' && (
                <div className="space-y-8">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3"><Mail className="w-5 h-5 text-emerald-600" /> Configuração SMTP</h3>
                      <button type="button" onClick={async () => {
                        try {
                          const recipient = user?.email || 'admin@vairifar.com.br';
                          const response = await fetchJsonWithAuth('/api/admin/email/test', {
                            method: 'POST',
                            body: JSON.stringify({
                              recipient,
                              subject: 'E-mail de Teste do Sistema',
                              html: '<p>Este e-mail confirma que o SMTP do Vai Rifar? esta funcionando em producao.</p>'
                            })
                          });

                          alert(response.message || `E-mail de teste enviado para ${recipient}.`);
                          const logsResponse = await fetchJsonWithAuth('/api/admin/email/logs');
                          setEmailLogs(logsResponse.logs || []);
                        } catch (err: any) {
                          alert('Erro ao enviar e-mail de teste: ' + err.message);
                        }
                      }} className="bg-emerald-50 text-emerald-600 px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Testar envio de e-mail
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">SMTP Host</label><input type="text" placeholder="smtp.exemplo.com" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.smtp_host || ''} onChange={e => setLocalSettings({ ...localSettings, smtp_host: e.target.value })} /></div>
                      <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">SMTP Port</label><input type="number" placeholder="587" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.smtp_port || ''} onChange={e => setLocalSettings({ ...localSettings, smtp_port: e.target.value })} /></div>
                      <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">SMTP User</label><input type="text" placeholder="contato@exemplo.com" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.smtp_user || ''} onChange={e => setLocalSettings({ ...localSettings, smtp_user: e.target.value })} /></div>
                      <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">SMTP Password</label><input type="password" placeholder="********" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.smtp_pass || ''} onChange={e => setLocalSettings({ ...localSettings, smtp_pass: e.target.value })} /></div>
                      <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Usar SSL/TLS</label><select className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white" value={localSettings.smtp_secure || 'sim'} onChange={e => setLocalSettings({ ...localSettings, smtp_secure: e.target.value })}><option value="sim">Sim</option><option value="nao">Não</option></select></div>
                      <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Nome do Remetente Padrão</label><input type="text" placeholder="Equipe RifaPro" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.smtp_from_name || ''} onChange={e => setLocalSettings({ ...localSettings, smtp_from_name: e.target.value })} /></div>
                      <div className="md:col-span-2"><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">E-mail do Remetente Padrão</label><input type="email" placeholder="no-reply@exemplo.com" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.smtp_from_email || ''} onChange={e => setLocalSettings({ ...localSettings, smtp_from_email: e.target.value })} /></div>
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8">
                    <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3"><ImageIcon className="w-5 h-5 text-emerald-600" /> Templates de E-mail</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-4">
                        {[
                          { id: 'order_paid', label: 'Pagamento Aprovado' },
                          { id: 'order_pending', label: 'Novo Pedido' },
                          { id: 'user_created', label: 'Boas-vindas' }
                        ].map(t => (
                          <button key={t.id} type="button" onClick={() => setSelectedTemplate(t.id)} className={`w-full p-4 rounded-2xl text-left border transition-all ${selectedTemplate === t.id ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Evento</p>
                            <p className="font-bold text-sm">{t.label}</p>
                          </button>
                        ))}
                      </div>
                      <div className="md:col-span-3 space-y-6">
                        <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Assunto do E-mail</label><input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings[`email_subject_${selectedTemplate}`] || ''} onChange={e => setLocalSettings({ ...localSettings, [`email_subject_${selectedTemplate}`]: e.target.value })} placeholder="Assunto..." /></div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Conteúdo HTML</label>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">Variáveis disponíveis ↓</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['{{customer_name}}', '{{campaign_title}}', '{{order_id}}', '{{ticket_numbers}}', '{{total_amount}}', '{{payment_method}}', '{{site_name}}', '{{support_whatsapp}}'].map(v => (
                              <button key={v} type="button" onClick={() => {
                                const key = `email_body_${selectedTemplate}`;
                                setLocalSettings({ ...localSettings, [key]: (localSettings[key] || '') + v });
                              }} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-[11px] font-mono font-bold hover:bg-emerald-50 hover:text-emerald-700 transition-all">{v}</button>
                            ))}
                          </div>
                          <textarea className="w-full h-[350px] rounded-2xl border border-zinc-200 p-6 font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none" value={localSettings[`email_body_${selectedTemplate}`] || ''} onChange={e => setLocalSettings({ ...localSettings, [`email_body_${selectedTemplate}`]: e.target.value })} placeholder="<html>...</html>" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3"><Clock className="w-5 h-5 text-emerald-600" /> Logs de Envio</h3>
                      <button type="button" onClick={async () => {
                        const response = await fetchJsonWithAuth('/api/admin/email/logs');
                        setEmailLogs(response.logs || []);
                      }} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2"><RefreshCcw className="w-3 h-3" /> Atualizar</button>
                    </div>
                    <div className="overflow-hidden border border-zinc-100 rounded-2xl">
                      <table className="w-full text-left bg-zinc-50/50">
                        <thead>
                          <tr className="border-b border-zinc-100 bg-zinc-50">
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Destinatário</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Assunto</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Data</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {emailLogs.length > 0 ? emailLogs.map((log: any, i: number) => (
                            <tr key={log.id || i} className="bg-white hover:bg-zinc-50 transition-colors">
                              <td className="px-6 py-4 text-sm font-bold text-zinc-600">{log.recipient}</td>
                              <td className="px-6 py-4 text-sm text-zinc-500">{log.subject}</td>
                              <td className="px-6 py-4 text-sm text-zinc-400">{new Date(log.sent_at).toLocaleString()}</td>
                              <td className="px-6 py-4 text-right">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${log.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{log.status === 'sent' ? 'Enviado' : 'Erro'}</span>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-400 text-sm">Nenhum log encontrado. Clique em "Atualizar" para buscar ou crie a tabela email_logs no Supabase.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {settingsSubTab === 'mercadopago' && (
                <MercadoPagoSettingsPanel />
              )}

              {settingsSubTab === 'lgpd' && (
                <div className="space-y-8 animate-fadeIn text-left">
                  {/* 1. Status da Implementação */}
                  <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3">
                        <Shield className="w-5 h-5 text-emerald-600" /> Status da Implementação LGPD
                      </h3>
                      <p className="text-sm text-zinc-500 font-medium mt-1">Verifique o checklist de conformidade legal e técnica do seu site.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { name: 'Banner de cookies', status: 'Ativo', desc: 'Exibido para novos visitantes salvarem preferências de privacidade.' },
                        { name: 'Política de Privacidade', status: localSettings.lgpd_privacy_policy ? 'Ativo' : 'Pendente', desc: localSettings.lgpd_privacy_policy ? 'Texto customizado ativo e dinâmico.' : 'Usando texto padrão do sistema.' },
                        { name: 'Termos de Uso', status: localSettings.lgpd_terms_of_use ? 'Ativo' : 'Pendente', desc: localSettings.lgpd_terms_of_use ? 'Texto customizado ativo e dinâmico.' : 'Usando texto padrão do sistema.' },
                        { name: 'Política de Cookies', status: localSettings.lgpd_cookies_policy ? 'Ativo' : 'Pendente', desc: localSettings.lgpd_cookies_policy ? 'Texto customizado ativo e dinâmico.' : 'Usando texto padrão do sistema.' },
                        { name: 'Central de Preferências', status: 'Ativo', desc: 'Modal público para o usuário ajustar consentimento de cookies a qualquer hora.' },
                        { name: 'Registro de consentimentos', status: 'Ativo', desc: 'Gravação em banco de dados das escolhas do titular para fins de auditoria.' },
                        { name: 'Formulário LGPD', status: 'Ativo', desc: 'Canal de comunicação público para abertura de requisições de titulares.' },
                        { name: 'Exclusão de conta', status: 'Ativo', desc: 'Exclusão de perfil pelo próprio usuário com exclusão e anonimização de dados.' },
                        { name: 'Bloqueio de scripts', status: 'Ativo', desc: 'GTM, Clarity, Pixel e Analytics bloqueados antes do aceite correto.' }
                      ].map((item, i) => (
                        <div key={i} className="border border-zinc-100 rounded-2xl p-5 space-y-2 hover:border-zinc-200 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-800 text-sm">{item.name}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {item.status === 'Ativo' ? 'Implementado' : 'Pendente (Padrão)'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Configurações editáveis */}
                  <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8">
                    <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3">
                      <FileText className="w-5 h-5 text-emerald-600" /> Documentos Legais & Controlador
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Nome da Empresa/Controlador</label>
                        <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_controller_name || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_controller_name: e.target.value })} placeholder="Ex: Vai Rifar LTDA" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">CNPJ / CPF do Controlador</label>
                        <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_controller_document || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_controller_document: e.target.value })} placeholder="Ex: 00.000.000/0001-00" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">E-mail de Contato LGPD</label>
                        <input type="email" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_contact_email || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_contact_email: e.target.value })} placeholder="Ex: dpo@vairifar.com.br" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Nome do Encarregado (DPO)</label>
                        <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_dpo_name || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_dpo_name: e.target.value })} placeholder="Ex: João da Silva" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Versão Atual dos Documentos</label>
                        <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_documents_version || '1.0.0'} onChange={e => setLocalSettings({ ...localSettings, lgpd_documents_version: e.target.value })} placeholder="Ex: 1.0.2" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Data de Vigência</label>
                        <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_vigency_date || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_vigency_date: e.target.value })} placeholder="Ex: 16 de Junho de 2026" />
                      </div>
                    </div>

                    <div className="space-y-6 text-left">
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Texto dos Termos de Uso (Suporta Markdown simples como ### e -)</label>
                        <textarea className="w-full h-64 rounded-2xl border border-zinc-200 p-6 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_terms_of_use || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_terms_of_use: e.target.value })} placeholder="Cole aqui os Termos de Uso..." />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Texto da Política de Privacidade (Suporta Markdown simples)</label>
                        <textarea className="w-full h-64 rounded-2xl border border-zinc-200 p-6 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_privacy_policy || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_privacy_policy: e.target.value })} placeholder="Cole aqui a Política de Privacidade..." />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Texto da Política de Cookies (Suporta Markdown simples)</label>
                        <textarea className="w-full h-64 rounded-2xl border border-zinc-200 p-6 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_cookies_policy || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_cookies_policy: e.target.value })} placeholder="Cole aqui a Política de Cookies..." />
                      </div>
                    </div>
                  </div>

                  {/* 3. Gestão de cookies */}
                  <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
                    <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3">
                      <Cookie className="w-5 h-5 text-emerald-600" /> Categorias de Cookies Ativas
                    </h3>
                    <p className="text-sm text-zinc-500 font-medium">Ative ou desative as categorias de cookies opcionais no Banner e na Central de Preferências.</p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
                      {/* Necessários */}
                      <div className="border border-zinc-100 rounded-2xl p-5 flex flex-col justify-between h-40 bg-zinc-50/50">
                        <div className="space-y-1">
                          <span className="font-bold text-zinc-800 text-sm block">Necessários</span>
                          <span className="text-xs text-zinc-400 font-medium leading-relaxed block">Fundamentais para o login e segurança do site.</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Sempre Ativo</span>
                          <input type="checkbox" checked disabled className="w-5 h-5 rounded text-emerald-600 border-zinc-300" />
                        </div>
                      </div>

                      {/* Estatísticas */}
                      <div className="border border-zinc-100 rounded-2xl p-5 flex flex-col justify-between h-40 hover:border-zinc-200 transition-all">
                        <div className="space-y-1">
                          <span className="font-bold text-zinc-800 text-sm block">Estatísticas</span>
                          <span className="text-xs text-zinc-400 font-medium leading-relaxed block">Analytics para melhorar o desempenho técnico.</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Habilitar</span>
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded text-emerald-600 border-zinc-300 focus:ring-emerald-500 cursor-pointer" 
                            checked={localSettings.lgpd_cookie_statistics_active !== 'false'} 
                            onChange={e => setLocalSettings({ ...localSettings, lgpd_cookie_statistics_active: e.target.checked ? 'true' : 'false' })} 
                          />
                        </div>
                      </div>

                      {/* Marketing */}
                      <div className="border border-zinc-100 rounded-2xl p-5 flex flex-col justify-between h-40 hover:border-zinc-200 transition-all">
                        <div className="space-y-1">
                          <span className="font-bold text-zinc-800 text-sm block">Marketing</span>
                          <span className="text-xs text-zinc-400 font-medium leading-relaxed block">Scripts para medir anúncios e tráfego pago.</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Habilitar</span>
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded text-emerald-600 border-zinc-300 focus:ring-emerald-500 cursor-pointer" 
                            checked={localSettings.lgpd_cookie_marketing_active !== 'false'} 
                            onChange={e => setLocalSettings({ ...localSettings, lgpd_cookie_marketing_active: e.target.checked ? 'true' : 'false' })} 
                          />
                        </div>
                      </div>

                      {/* Personalização */}
                      <div className="border border-zinc-100 rounded-2xl p-5 flex flex-col justify-between h-40 hover:border-zinc-200 transition-all">
                        <div className="space-y-1">
                          <span className="font-bold text-zinc-800 text-sm block">Personalização</span>
                          <span className="text-xs text-zinc-400 font-medium leading-relaxed block">Guarda preferências de layout, temas e filtros.</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Habilitar</span>
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded text-emerald-600 border-zinc-300 focus:ring-emerald-500 cursor-pointer" 
                            checked={localSettings.lgpd_cookie_personalization_active !== 'false'} 
                            onChange={e => setLocalSettings({ ...localSettings, lgpd_cookie_personalization_active: e.target.checked ? 'true' : 'false' })} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Scripts condicionais */}
                  <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
                    <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3">
                      <Code className="w-5 h-5 text-emerald-600" /> Scripts Rastreamento Condicional
                    </h3>
                    <p className="text-sm text-zinc-500 font-medium">Os scripts abaixo só serão executados no site após o respectivo consentimento do visitante.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Google Analytics ID</label>
                        <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_script_ga_id || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_script_ga_id: e.target.value })} placeholder="Ex: G-XXXXXXXXXX" />
                        <span className="text-[10px] text-zinc-400 font-medium mt-1 block">Condicionado a: <b>Estatísticas</b>. Se vazio, usa o Analytics ID global.</span>
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Google Tag Manager (GTM) ID</label>
                        <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_script_gtm_id || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_script_gtm_id: e.target.value })} placeholder="Ex: GTM-XXXXXXX" />
                        <span className="text-[10px] text-zinc-400 font-medium mt-1 block">Condicionado a: <b>Marketing</b>.</span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Meta Pixel (Facebook Pixel) ID</label>
                        <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_script_meta_pixel_id || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_script_meta_pixel_id: e.target.value })} placeholder="Ex: 123456789012345" />
                        <span className="text-[10px] text-zinc-400 font-medium mt-1 block">Condicionado a: <b>Marketing</b>. Se vazio, usa o Pixel ID global.</span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Microsoft Clarity ID</label>
                        <input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_script_clarity_id || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_script_clarity_id: e.target.value })} placeholder="Ex: abcde12345" />
                        <span className="text-[10px] text-zinc-400 font-medium mt-1 block">Condicionado a: <b>Estatísticas</b>.</span>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Outros Scripts Customizados (HTML completo com tag &lt;script&gt;)</label>
                        <textarea className="w-full h-40 rounded-2xl border border-zinc-200 p-6 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.lgpd_custom_scripts || ''} onChange={e => setLocalSettings({ ...localSettings, lgpd_custom_scripts: e.target.value })} placeholder="Ex: <!-- Clarity --> <script>...</script>" />
                        <span className="text-[10px] text-zinc-400 font-medium mt-1 block">Condicionado a: <b>Marketing</b>. Carrega scripts e tags HTML arbitrárias após aceite.</span>
                      </div>
                    </div>
                  </div>

                  {/* 5. Registro de consentimentos (Tabela) */}
                  <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3">
                          <Eye className="w-5 h-5 text-emerald-600" /> Registro de Consentimentos (Auditoria)
                        </h3>
                        <p className="text-sm text-zinc-500 font-medium mt-1">Exibindo os últimos 50 consentimentos de usuários e visitantes registrados no Supabase.</p>
                      </div>
                      <button type="button" onClick={fetchLgpdData} disabled={loadingConsents} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2">
                        <RefreshCcw className={`w-3 h-3 ${loadingConsents ? 'animate-spin' : ''}`} /> {loadingConsents ? 'Carregando...' : 'Atualizar'}
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-zinc-100 rounded-2xl">
                      <table className="w-full text-left bg-zinc-50/50">
                        <thead>
                          <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            <th className="px-6 py-4">Usuário</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4">Versão</th>
                            <th className="px-6 py-4">IP</th>
                            <th className="px-6 py-4">Navegador / Agent</th>
                            <th className="px-6 py-4">Data e Hora</th>
                            <th className="px-6 py-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-sm">
                          {consents.length > 0 ? consents.map((c: any) => (
                            <tr key={c.id} className="bg-white hover:bg-zinc-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-zinc-700">
                                {c.profiles ? `${c.profiles.name || ''} (${c.profiles.email || ''})` : 'Visitante Anônimo'}
                              </td>
                              <td className="px-6 py-4 font-mono text-xs text-zinc-500">{c.consent_type}</td>
                              <td className="px-6 py-4 text-zinc-500">{c.version || '-'}</td>
                              <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{c.ip_address || '-'}</td>
                              <td className="px-6 py-4 text-zinc-400 text-xs max-w-xs truncate" title={c.user_agent}>
                                {c.user_agent || '-'}
                              </td>
                              <td className="px-6 py-4 text-zinc-400">{new Date(c.created_at).toLocaleString()}</td>
                              <td className="px-6 py-4 text-right">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${c.accepted ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                  {c.accepted ? 'Aceito' : 'Recusado'}
                                </span>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-zinc-400 text-sm font-medium">Nenhum consentimento registrado.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 6. Solicitações LGPD */}
                  <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3">
                          <Users className="w-5 h-5 text-emerald-600" /> Solicitações dos Titulares (LGPD)
                        </h3>
                        <p className="text-sm text-zinc-500 font-medium mt-1">Acompanhe e atenda as requisições de privacidade enviadas pelos usuários.</p>
                      </div>
                      <button type="button" onClick={fetchLgpdData} disabled={loadingRequests} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2">
                        <RefreshCcw className={`w-3 h-3 ${loadingRequests ? 'animate-spin' : ''}`} /> {loadingRequests ? 'Carregando...' : 'Atualizar'}
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-zinc-100 rounded-2xl">
                      <table className="w-full text-left bg-zinc-50/50">
                        <thead>
                          <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            <th className="px-6 py-4">Titular</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4">Detalhes / Justificativa</th>
                            <th className="px-6 py-4">Abertura</th>
                            <th className="px-6 py-4 text-right">Status da Solicitação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-sm">
                          {lgpdRequests.length > 0 ? lgpdRequests.map((req: any) => (
                            <tr key={req.id} className="bg-white hover:bg-zinc-50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-bold text-zinc-700 block">{req.name}</span>
                                <span className="text-xs text-zinc-400 block">{req.email}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-zinc-100 text-zinc-600">
                                  {req.request_type === 'access' && 'Acessar dados'}
                                  {req.request_type === 'rectify' && 'Corrigir dados'}
                                  {req.request_type === 'delete' && 'Excluir conta'}
                                  {req.request_type === 'revoke' && 'Revogar consentimento'}
                                  {!['access','rectify','delete','revoke'].includes(req.request_type) && req.request_type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-zinc-500 font-medium max-w-sm whitespace-pre-wrap">{req.details || '-'}</td>
                              <td className="px-6 py-4 text-zinc-400">{new Date(req.created_at).toLocaleString()}</td>
                              <td className="px-6 py-4 text-right text-zinc-900">
                                <select 
                                  value={req.status || 'pending'} 
                                  onChange={e => handleUpdateLgpdRequestStatus(req.id, e.target.value)}
                                  className={`h-9 rounded-lg border text-xs font-bold px-2.5 bg-white outline-none cursor-pointer ${
                                    req.status === 'pending' ? 'border-amber-200 text-amber-600 focus:ring-amber-500' :
                                    req.status === 'in_analysis' ? 'border-blue-200 text-blue-600 focus:ring-blue-500' :
                                    req.status === 'completed' ? 'border-emerald-200 text-emerald-600 focus:ring-emerald-500' :
                                    'border-red-200 text-red-600 focus:ring-red-500'
                                  }`}
                                >
                                  <option value="pending">Pendente</option>
                                  <option value="in_analysis">Em análise</option>
                                  <option value="completed">Concluído</option>
                                  <option value="rejected">Recusado justificadamente</option>
                                </select>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 text-sm font-medium">Nenhuma solicitação aberta.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 7. Validação técnica */}
                  <div className="bg-zinc-950 p-10 rounded-[2.5rem] shadow-xl text-white space-y-6 text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-xl"><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>
                      <h3 className="text-xl font-bold">Relatório de Validação Técnica</h3>
                    </div>
                    <p className="text-sm text-zinc-400 font-medium leading-relaxed">Auditoria geral da implementação técnica e dos fluxos do portal sob a LGPD.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left">
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-3">
                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest block">Já Estava Implementado</span>
                        <ul className="text-xs text-zinc-300 space-y-2 list-disc pl-4 font-medium">
                          <li>Segurança e RLS no banco Supabase</li>
                          <li>Fluxo de exclusão de conta via painel de perfil</li>
                          <li>Páginas de políticas estáticas padrão</li>
                          <li>Gravação local de cookies de consentimento</li>
                        </ul>
                      </div>

                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-3">
                        <span className="text-sky-400 text-[10px] font-black uppercase tracking-widest block">Criado / Corrigido Agora</span>
                        <ul className="text-xs text-zinc-300 space-y-2 list-disc pl-4 font-medium">
                          <li>Aba administrativa centralizada LGPD</li>
                          <li>Tabela de Auditoria de Consentimentos ativa</li>
                          <li>Central de Triagem de solicitações LGPD</li>
                          <li>Bloqueador condicional de scripts de terceiros antes do aceite</li>
                          <li>Textos dinâmicos versionados com data e controlador</li>
                        </ul>
                      </div>

                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-3">
                        <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest block">Depende de Ação Manual</span>
                        <ul className="text-xs text-zinc-300 space-y-2 list-disc pl-4 font-medium">
                          <li>Preencher Nome e CNPJ do controlador</li>
                          <li>Preencher o DPO de contato no formulário</li>
                          <li>Personalizar os termos e políticas customizadas</li>
                          <li>Informar os IDs corretos nas integrações</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsSubTab === 'seo' && (
                <SeoSettingsPanel 
                  globalSettings={globalSettings} 
                  onRefreshSettings={onRefreshSettings} 
                  user={user} 
                />
              )}

              {settingsSubTab !== 'mercadopago' && settingsSubTab !== 'seo' && (
                <div className="flex justify-end p-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateSettings()}
                    className="w-full md:w-auto px-12 py-5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 text-lg"
                  >
                    Salvar Alterações
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <Sidebar
        activeTab={activeTab}
        onNavigate={(tab: any) => setActiveTab(tab)}
        onLogout={onLogout}
        user={user}
        globalSettings={globalSettings}
        onNavigateRoot={onNavigateRoot}
      />
      <main className="flex-1 p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const DEFAULT_TAX_TABLE = [
  { id: 't1', max: 100, fee: 7 },
  { id: 't2', max: 250, fee: 17 },
  { id: 't3', max: 450, fee: 27 },
  { id: 't4', max: 750, fee: 37 },
  { id: 't5', max: 1000, fee: 47 },
  { id: 't6', max: 2000, fee: 67 },
  { id: 't7', max: 4000, fee: 77 },
  { id: 't8', max: 7000, fee: 97 },
  { id: 't9', max: 10000, fee: 147 },
  { id: 't10', max: 15000, fee: 197 },
  { id: 't11', max: 20000, fee: 247 },
  { id: 't12', max: 30000, fee: 347 },
  { id: 't13', max: 50000, fee: 697 },
  { id: 't14', max: 70000, fee: 797 },
  { id: 't15', max: 100000, fee: 997 },
  { id: 't16', max: 999999999, fee: 1497 }
];

const TaxTableEditor = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // Robustness fix: Ensure all items have an ID and numerical values
        const normalized = parsed.map((item: any) => ({
          ...item,
          id: item.id || Math.random().toString(36).substr(2, 9),
          max: parseInt(item.max) || 0,
          fee: parseFloat(item.fee) || 0
        })).sort((a, b) => a.max - b.max);
        setItems(normalized);
      }
    } catch (e) {
      setItems([]);
    }
  }, [value]);

  const updateItems = (newItems: any[]) => {
    setItems(newItems);
    onChange(JSON.stringify(newItems, null, 2));
  };

  const addItem = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    updateItems([...items, { id: newId, max: 1000, fee: 10 }]);
  };

  const handleReset = () => {
    updateItems(DEFAULT_TAX_TABLE);
  };

  const removeItem = (id: string) => {
    updateItems(items.filter((item) => item.id !== id));
  };

  const handleChange = (id: string, key: string, val: number) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, [key]: val } : item
    );
    updateItems(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-zinc-400 italic">
          Configure as faixas de títulos e suas respectivas taxas fixas.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="text-[10px] font-black uppercase tracking-widest text-brand-orange hover:opacity-70 transition-all flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Carregar Tabela Padrão (16 faixas)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 items-end bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100 group relative">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                {item.max >= 999999999 ? 'Acima de' : 'Até (Arrecadação R$)'}
              </label>
              <input
                type="number"
                value={item.max}
                onChange={(e) => handleChange(item.id, 'max', parseInt(e.target.value) || 0)}
                className="w-full h-12 bg-white border border-zinc-200 rounded-xl px-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Taxa R$</label>
              <input
                type="number"
                value={item.fee}
                onChange={(e) => handleChange(item.id, 'fee', parseFloat(e.target.value))}
                className="w-full h-12 bg-white border border-zinc-200 rounded-xl px-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="w-full py-5 border-2 border-dashed border-zinc-200 rounded-[2rem] text-zinc-400 font-bold hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 bg-white/50"
      >
        <Plus className="w-5 h-5" />
        Adicionar Nova Faixa de Taxa
      </button>
    </div>
  );
};

// ─── Componente extraído para evitar erro de minificação (new Map em switch/case) ───
const SupportersView = ({
  orders,
  campaigns,
  supporterSearch,
  setSupporterSearch,
  setSelectedSupporter,
}: {
  orders: any[];
  campaigns: any[];
  supporterSearch: string;
  setSupporterSearch: (v: string) => void;
  setSelectedSupporter: (s: any) => void;
}) => {
  // Agrupar pedidos por campanha
  const campaignsMap = new Map<string, { title: string; supporters: Map<string, any> }>();

  orders.forEach(o => {
    if (!o.campaign_id) return;
    if (!campaignsMap.has(o.campaign_id)) {
      const campaignObj = campaigns.find((c: any) => c.id === o.campaign_id);
      campaignsMap.set(o.campaign_id, {
        title: campaignObj?.title || 'Campanha Desconhecida',
        supporters: new Map<string, any>()
      });
    }
    const camp = campaignsMap.get(o.campaign_id)!;
    const supKey = o.customer_email || o.customer_phone || o.customer_name;
    if (!supKey) return;
    if (!camp.supporters.has(supKey)) {
      camp.supporters.set(supKey, {
        name: o.customer_name || 'Sem Nome',
        email: o.customer_email,
        phone: o.customer_phone,
        created_at: o.created_at,
        transactions: []
      });
    }
    camp.supporters.get(supKey).transactions.push(o);
  });

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Meus apoiadores</h1>
          <p className="text-zinc-500 font-medium tracking-tight">Organizados por campanha</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar apoiador..."
              value={supporterSearch}
              onChange={e => setSupporterSearch(e.target.value)}
              className="bg-white border border-zinc-100 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-orange w-64"
            />
          </div>
        </div>
      </header>

      {(Array.from(campaignsMap.values()) as any[]).map((campData: any, campIdx: number) => {
        const supportersArr = Array.from(campData.supporters.values()) as any[];
        let supportersList: any[] = supportersArr;

        supportersList = supportersList.filter(s =>
          s.transactions.some((t: any) => t.status !== 'cancelled' && t.status !== 'expired')
        );

        if (supporterSearch) {
          const lowerSearch = supporterSearch.toLowerCase();
          supportersList = supportersList.filter(s =>
            (s.name && s.name.toLowerCase().includes(lowerSearch)) ||
            (s.email && s.email.toLowerCase().includes(lowerSearch)) ||
            (s.phone && s.phone.includes(lowerSearch))
          );
        }

        if (supportersList.length === 0) return null;

        return (
          <section key={campIdx} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-zinc-100"></div>
              <h2 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] px-4 bg-zinc-50/50 py-1 rounded-full border border-zinc-100">
                {campData.title}
              </h2>
              <div className="h-px flex-1 bg-zinc-100"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supportersList.map((sup, idx) => {
                const pendingOrders = sup.transactions.filter((t: any) => t.status === 'pending' || t.status === 'waiting' || t.status === 'pending_approval');
                const hasPending = pendingOrders.length > 0;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedSupporter(sup)}
                    className="glass-card p-6 space-y-4 cursor-pointer hover:border-brand-orange/30 transition-colors relative group"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-zinc-900 line-clamp-1">{sup.name}</h3>
                      <div className="flex items-center gap-2">
                        {hasPending ? (
                          <span className="text-[10px] px-2 py-1 bg-amber-50 text-amber-600 font-bold border border-amber-100 rounded-md">Pendente</span>
                        ) : (
                          <span className="text-[10px] px-2 py-1 bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 rounded-md">Aprovado</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <div className="bg-brand-orange/10 p-1.5 rounded-lg text-brand-orange"><TrendingUp className="w-4 h-4" /></div>
                        {sup.phone || 'Sem Telefone'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600"><Users className="w-4 h-4" /></div>
                        {sup.email || 'Sem E-mail'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {campaignsMap.size === 0 && (
        <div className="py-24 text-center text-zinc-400 bg-white rounded-[2.5rem] border border-zinc-100 border-dashed">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">Nenhum apoiador encontrado nas suas campanhas.</p>
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ user, onSelectCampaign, globalSettings, onRefreshSettings, onLogout, onNavigateRoot }: { user: User, onSelectCampaign: (c: Campaign) => void, globalSettings: any, onRefreshSettings: () => void, onLogout: () => void, onNavigateRoot?: (page: string) => void }) => {
  const [stats, setStats] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('rifapro-dashboard-tab') || 'dashboard';
    } catch { return 'dashboard'; }
  });
  const [settingsTab, setSettingsTab] = useState<string | null>(null);
  const [selectedCampaignForManagement, setSelectedCampaignForManagement] = useState<Campaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [localSettings, setLocalSettings] = useState<any>(globalSettings);

  // States para Supporters
  const [selectedSupporter, setSelectedSupporter] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState<string | null>(null);
  const [supporterSearch, setSupporterSearch] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState<any>(null);

  // States para Edição de Perfil
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [profileDocument, setProfileDocument] = useState((user as any).document || '');
  const [profileCep, setProfileCep] = useState((user as any).cep || '');
  const [profileStreet, setProfileStreet] = useState((user as any).address_street || '');
  const [profileNumber, setProfileNumber] = useState((user as any).address_number || '');
  const [profileComplement, setProfileComplement] = useState((user as any).address_complement || '');
  const [profileDistrict, setProfileDistrict] = useState((user as any).address_district || '');
  const [profileCity, setProfileCity] = useState((user as any).address_city || '');
  const [profileState, setProfileState] = useState((user as any).address_state || '');
  const [loadingCep, setLoadingCep] = useState(false);

  const handleCepLookup = async (cepVal: string) => {
    const cleaned = cepVal.replace(/\D/g, '');
    if (cleaned.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setProfileStreet(data.logradouro || '');
          setProfileDistrict(data.bairro || '');
          setProfileCity(data.localidade || '');
          setProfileState(data.uf || '');
        } else {
          alert('CEP não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  // States para Redes Sociais
  const [socialWhatsappGroup, setSocialWhatsappGroup] = useState(user.social_whatsapp_group || '');
  const [socialTelegram, setSocialTelegram] = useState(user.social_telegram || '');
  const [socialInstagram, setSocialInstagram] = useState(user.social_instagram || '');
  const [socialTiktok, setSocialTiktok] = useState(user.social_tiktok || '');
  const [socialYoutube, setSocialYoutube] = useState(user.social_youtube || '');
  const [socialFacebook, setSocialFacebook] = useState(user.social_facebook || '');

  // States para Integrações
  const [pixelFacebook, setPixelFacebook] = useState(user.pixel_facebook || '');
  const [pixelGoogle, setPixelGoogle] = useState(user.pixel_google || '');

  // States para Personalização do Organizador
  const [siteTheme, setSiteTheme] = useState<'light' | 'dark'>(user.site_theme || 'light');
  const [primaryColor, setPrimaryColor] = useState(user.primary_color || '#ff6b00');
  const [logoUrl, setLogoUrl] = useState(user.logo_url || '');
  const [logoPreview, setLogoPreview] = useState(user.logo_url || '');

  const handleUpdateSocial = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: profilePhone,
          social_whatsapp_group: socialWhatsappGroup,
          social_telegram: socialTelegram,
          social_instagram: socialInstagram,
          social_tiktok: socialTiktok,
          social_youtube: socialYoutube,
          social_facebook: socialFacebook,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      alert('Redes sociais atualizadas com sucesso!');
      onRefreshSettings();
      setSettingsTab(null);
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    }
  };

  const handleUpdateIntegrations = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          pixel_facebook: pixelFacebook,
          pixel_google: pixelGoogle,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      alert('Integrações atualizadas com sucesso!');
      onRefreshSettings();
      setSettingsTab('integrations');
    } catch (err: any) {
      alert('Erro ao salvar integrações: ' + err.message);
    }
  };

  const handleUpdatePersonalize = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          site_theme: siteTheme,
          primary_color: primaryColor,
          logo_url: logoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      alert('Personalização salva com sucesso!');
      onRefreshSettings();
      setSettingsTab(null);
    } catch (err: any) {
      alert('Erro ao salvar personalização: ' + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Deseja realmente excluir sua conta? Esta ação é permanente e removerá todos os seus dados e campanhas!')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await fetch('/api/users/delete-me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao excluir conta.');
      }

      alert('Sua conta foi excluída com sucesso e seus dados pessoais foram anonimizados conforme a LGPD.');
      onLogout();
    } catch (err: any) {
      alert('Erro ao excluir conta: ' + err.message);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (password && password !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
      }

      const updates: any = {
        name: profileName,
        phone: profilePhone,
        document: profileDocument,
        cep: profileCep,
        address_street: profileStreet,
        address_number: profileNumber,
        address_complement: profileComplement,
        address_district: profileDistrict,
        address_city: profileCity,
        address_state: profileState,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (profileError) throw profileError;

      if (password) {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
      }

      alert('Perfil atualizado com sucesso!');
      onRefreshSettings();
    } catch (err: any) {
      alert('Erro ao atualizar perfil: ' + err.message);
    }
  };

  useEffect(() => {
    setLocalSettings(globalSettings);
  }, [globalSettings]);

  const handleUpdateSettings = async () => {
    try {
      await fetchJsonWithAuth('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: localSettings })
      });
      alert('Configurações atualizadas!');
      onRefreshSettings();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações');
    }
  };

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      // 1. Buscar campanhas do organizador
      const { data: campaignsData, error: campError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (campError) throw campError;
      if (!campaignsData || campaignsData.length === 0) {
        setCampaigns([]);
        setStats({ total_campaigns: 0, total_revenue: 0, tickets_sold: 0, pending_revenue: 0, pending_count: 0, unfulfilled_revenue: 0, unfulfilled_count: 0 });
        setOrders([]);
        return;
      }

      // 2. Buscar TODOS os pedidos de uma só vez para estas campanhas
      const campIds = campaignsData.map((c: any) => c.id);
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('campaign_id', campIds)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      
      const ordersList = allOrders || [];
      setOrders(ordersList);

      // 3. Processar sold_count e estatísticas a partir da lista única de pedidos
      const countsMap: Record<number, number> = {};
      let totalRevenue = 0;
      let totalPaidOrders = 0;
      let pendingRevenue = 0;
      let pendingCount = 0;
      let unfulfilledRevenue = 0;
      let unfulfilledCount = 0;

      ordersList.forEach(o => {
        const count = o.reserved_numbers?.length || o.ticket_count || 0;
        
        if (o.status === 'paid') {
          countsMap[o.campaign_id] = (countsMap[o.campaign_id] || 0) + count;
          totalRevenue += (o.total_amount || 0);
          totalPaidOrders += 1;
        } else if (o.status === 'pending' || o.status === 'waiting' || o.status === 'pending_approval') {
          pendingRevenue += (o.total_amount || 0);
          pendingCount += 1;
        } else if (o.status === 'cancelled' || o.status === 'expired') {
          unfulfilledRevenue += (o.total_amount || 0);
          unfulfilledCount += 1;
        }
      });

      // Atualizar campanhas com sold_count
      const updatedCampaigns = campaignsData.map(c => ({
        ...c,
        sold_count: countsMap[c.id] || 0
      }));
      setCampaigns(updatedCampaigns as Campaign[]);

      // Atualizar stats
      setStats({
        total_campaigns: campaignsData.length,
        total_revenue: totalRevenue,
        tickets_sold: totalPaidOrders,
        pending_revenue: pendingRevenue,
        pending_count: pendingCount,
        unfulfilled_revenue: unfulfilledRevenue,
        unfulfilled_count: unfulfilledCount
      });

    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleApproveOrder = async (orderId: number) => {
    try {
      // Buscar a order para saber a campaign e a quantidade de números
      const orderToApprove = orders.find(o => o.id === orderId);

      const { error } = await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);
      if (error) throw error;

      // Atualizar sold_count na campanha
      if (orderToApprove) {
        const ticketCount = (orderToApprove as any).reserved_numbers?.length || (orderToApprove as any).ticket_count || 0;
        const campaignId = orderToApprove.campaign_id;
        // Buscar sold_count atual
        const { data: campData } = await supabase
          .from('campaigns')
          .select('sold_count')
          .eq('id', campaignId)
          .single();
        const currentSoldCount = campData?.sold_count || 0;
        await supabase
          .from('campaigns')
          .update({ sold_count: currentSoldCount + ticketCount })
          .eq('id', campaignId);

        // Atualizar campanha no estado local
        setCampaigns(prev => prev.map(c =>
          c.id === campaignId ? { ...c, sold_count: currentSoldCount + ticketCount } : c
        ));
      }

      alert('Pedido aprovado com sucesso!');

      // Atualizar lista master de orders
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'paid' } : o));

      // Atualizar no selectedSupporter atual
      if (selectedSupporter) {
        setSelectedSupporter((prev: any) => ({
          ...prev,
          transactions: prev.transactions.map((t: any) => t.id === orderId ? { ...t, status: 'paid' } : t)
        }));
      }

      // Se o modal de detalhes já estiver aberto daquele order, atualiza a view tbm
      if (showOrderDetails && showOrderDetails.id === orderId) {
        setShowOrderDetails((prev: any) => ({ ...prev, status: 'paid' }));
      }

      fetchData();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao aprovar: ' + err.message);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta reserva/compra? Os números voltarão a ficar disponíveis na campanha!')) return;
    try {
      const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
      if (error) throw error;
      alert('Compra cancelada com sucesso!');

      // Atualizar no selectedSupporter atual
      if (selectedSupporter) {
        setSelectedSupporter((prev: any) => ({
          ...prev,
          transactions: prev.transactions.map((t: any) => t.id === orderId ? { ...t, status: 'cancelled' } : t)
        }));
      }
      setShowOrderDetails(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao cancelar: ' + err.message);
    }
  };

  const handleDeleteSupporter = async (supporter: any) => {
    if (!window.confirm('Tem certeza que deseja excluir este apoiador? Todos os pedidos serão removidos permanentemente do banco de dados.')) return;
    try {
      const orderIds: number[] = (supporter.transactions || [])
        .map((t: any) => t.id || t.order_id)
        .filter((id: any) => id !== undefined && id !== null);

      if (orderIds.length > 0) {
        const { error } = await supabase
          .from('orders')
          .delete()
          .in('id', orderIds);
        if (error) throw error;
      } else if (supporter.email) {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('customer_email', supporter.email);
        if (error) throw error;
      } else if (supporter.phone) {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('customer_phone', supporter.phone);
        if (error) throw error;
      }

      // Remover do estado local imediatamente
      if (orderIds.length > 0) {
        setOrders(prev => prev.filter(o => !orderIds.includes(o.id)));
      } else {
        setOrders(prev => prev.filter(o => {
          if (supporter.email) return o.customer_email !== supporter.email;
          if (supporter.phone) return o.customer_phone !== supporter.phone;
          return true;
        }));
      }

      setSelectedSupporter(null);
      alert('Apoiador e seus pedidos foram excluídos permanentemente!');
    } catch (err: any) {
      console.error('Falha ao excluir apoiador:', err);
      alert('Erro ao excluir: ' + (err.message || JSON.stringify(err)));
    }
  };

  const handleManageCampaign = (c: Campaign) => {
    setSelectedCampaignForManagement(c);
    setActiveTab('manage-campaign');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'manage-campaign':
        return selectedCampaignForManagement ? (
          <ManageCampaign
            campaign={selectedCampaignForManagement}
            onBack={() => setActiveTab('dashboard')}
            onView={onSelectCampaign}
            onEdit={(c) => { setEditingCampaign(c); setShowCreate(true); }}
            globalSettings={globalSettings}
            onRefresh={fetchData}
            setShowOrderDetails={setShowOrderDetails}
            user={user}
          />
        ) : null;
      case 'dashboard':
        return (
          <div className="space-y-12">
            <header>
              <h1 className="text-3xl font-black text-zinc-900 mb-2">Olá, {user.name}</h1>
              <p className="text-zinc-400 font-medium">Gerencie suas campanhas e acompanhe suas vendas.</p>
            </header>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                  <TrendingUp className="text-brand-orange w-6 h-6" />
                  Relatório
                </h2>
                <div className="bg-white border border-zinc-100 rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-bold text-zinc-400">
                  <Clock className="w-4 h-4" />
                  Filtro de data
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <DashboardCard
                  title="Visitas no site"
                  value="0"
                  icon={LayoutDashboard}
                  colorClass="border-blue-500"
                />
                <DashboardCard
                  title="Vendas realizadas"
                  value={`R$ ${(stats?.total_revenue || 0).toFixed(2)}`}
                  subValue={`${stats?.tickets_sold || 0} Pedidos`}
                  icon={DollarSign}
                  colorClass="border-emerald-500"
                />
                <DashboardCard
                  title="Reservas"
                  value={`R$ ${(stats?.pending_revenue || 0).toFixed(2)}`}
                  subValue={`${stats?.pending_count || 0} Pedidos`}
                  icon={Clock}
                  colorClass="border-amber-400"
                />
                <DashboardCard
                  title="Reservou e não pagou"
                  value={`R$ ${(stats?.unfulfilled_revenue || 0).toFixed(2)}`}
                  subValue={`${stats?.unfulfilled_count || 0} Pedidos`}
                  icon={AlertCircle}
                  colorClass="border-red-500"
                />
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2 mb-6">
                <Ticket className="text-brand-orange w-6 h-6" />
                Campanhas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.length > 0 ? (
                  campaigns.map(c => (
                    <CampaignCard
                      key={c.id}
                      campaign={c}
                      onClick={() => handleManageCampaign(c)}
                      onDelete={async (e) => {
                        e.stopPropagation();
                        if (!confirm('Tem certeza que deseja excluir esta campanha? Todos os dados vinculados serão perdidos.')) return;

                        try {
                          console.log('Iniciando exclusão da campanha:', c.id);

                          // Clean up related data first to avoid FK constraints (silenciando erros caso a tabela não exista)
                          await supabase.from('winning_tickets').delete().eq('campaign_id', c.id).then(({ error }) => {
                            if (error && error.code !== 'PGRST116') console.warn('Aviso ao excluir winning_tickets:', error);
                          });

                          await supabase.from('orders').delete().eq('campaign_id', c.id).then(({ error }) => {
                            if (error && error.code !== 'PGRST116') console.warn('Aviso ao excluir orders:', error);
                          });

                          // Tentar deletar tickets antigos, ignorando 404 se a tabela não existir
                          await supabase.from('tickets').delete().eq('campaign_id', c.id).then(({ error }) => {
                            if (error) console.log('Aviso tickets:', error.message);
                          });

                          // Tentar deletar pagamentos antigos
                          await supabase.from('campaign_payments').delete().eq('campaign_id', c.id).then(({ error }) => {
                            if (error) console.log('Aviso payments:', error.message);
                          });

                          const { error: deleteCampaignError } = await supabase
                            .from('campaigns')
                            .delete()
                            .eq('id', c.id);

                          if (deleteCampaignError) {
                            console.error('Erro REAL ao excluir campanha no banco:', deleteCampaignError);
                            throw new Error(`Falha no Supabase: ${deleteCampaignError.message}. Detalhes: ${deleteCampaignError.details}`);
                          }

                          // Verifica se a exclusão foi realmente efetivada (pois o RLS pode bloquear silenciosamente)
                          const { data: stillExists } = await supabase.from('campaigns').select('id').eq('id', c.id).single();
                          if (stillExists) {
                            throw new Error('Campanha não pôde ser excluída. Verifique restrições de permissão RLS no banco.');
                          }

                          alert('Campanha excluída com sucesso!');
                          window.location.reload();
                        } catch (err: any) {
                          console.error('Catch disparado:', err);
                          alert('Erro ao excluir campanha: ' + (err.message || 'Erro desconhecido. Consulte o console.'));
                        }
                      }}
                    />
                  ))
                ) : (
                  <div className="glass-card p-12 text-center col-span-full">
                    <p className="text-zinc-400 font-medium">Você ainda não possui campanhas.</p>
                    <button onClick={() => setShowCreate(true)} className="text-brand-orange font-bold mt-2">Criar minha primeira rifa</button>
                  </div>
                )}
              </div>
            </section>
          </div>
        );
      case 'my-campaigns':
        return (
          <div className="space-y-8">
            <header className="flex justify-between items-center">
              <h1 className="text-3xl font-black text-zinc-900">Minhas campanhas</h1>
              <div className="flex gap-4">
                <button className="bg-white border border-zinc-100 px-4 py-2 rounded-xl text-zinc-400 font-bold text-xs flex items-center gap-2"><Filter className="w-4 h-4" /> Filtros</button>
                <button onClick={() => setActiveTab('dashboard')} className="bg-white border border-zinc-100 px-4 py-2 rounded-xl text-zinc-400 font-bold text-xs flex items-center gap-2"><ArrowRight className="w-4 h-4 rotate-180" /> Voltar</button>
              </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map(c => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  onClick={() => handleManageCampaign(c)}
                  onDelete={async (e) => {
                    e.stopPropagation();
                    if (!confirm('Tem certeza que deseja excluir esta campanha? Todos os dados vinculados serão perdidos.')) return;

                    try {
                      console.log('Iniciando exclusão da campanha:', c.id);

                      // Clean up related data first to avoid FK constraints (silenciando erros caso a tabela não exista)
                      await supabase.from('winning_tickets').delete().eq('campaign_id', c.id).then(({ error }) => {
                        if (error && error.code !== 'PGRST116') console.warn('Aviso ao excluir winning_tickets:', error);
                      });

                      await supabase.from('orders').delete().eq('campaign_id', c.id).then(({ error }) => {
                        if (error && error.code !== 'PGRST116') console.warn('Aviso ao excluir orders:', error);
                      });

                      // Tentar deletar tickets antigos, ignorando 404 se a tabela não existir
                      await supabase.from('tickets').delete().eq('campaign_id', c.id).then(({ error }) => {
                        if (error) console.log('Aviso tickets:', error.message);
                      });

                      // Tentar deletar pagamentos antigos
                      await supabase.from('campaign_payments').delete().eq('campaign_id', c.id).then(({ error }) => {
                        if (error) console.log('Aviso payments:', error.message);
                      });

                      const { error: deleteCampaignError } = await supabase
                        .from('campaigns')
                        .delete()
                        .eq('id', c.id);

                      if (deleteCampaignError) {
                        console.error('Erro REAL ao excluir campanha no banco:', deleteCampaignError);
                        throw new Error(`Falha no Supabase: ${deleteCampaignError.message}. Detalhes: ${deleteCampaignError.details}`);
                      }

                      // Verifica se a exclusão foi realmente efetivada (pois o RLS pode bloquear silenciosamente)
                      const { data: stillExists } = await supabase.from('campaigns').select('id').eq('id', c.id).single();
                      if (stillExists) {
                        throw new Error('Campanha não pôde ser excluída. Verifique restrições de permissão RLS no banco.');
                      }

                      alert('Campanha excluída com sucesso!');
                      window.location.reload();
                    } catch (err: any) {
                      console.error('Catch disparado:', err);
                      alert('Erro ao excluir campanha: ' + (err.message || 'Erro desconhecido. Consulte o console.'));
                    }
                  }}
                />
              ))}
            </div>
          </div>
        );
      case 'supporters':
        return (
          <SupportersView
            orders={orders}
            campaigns={campaigns}
            supporterSearch={supporterSearch}
            setSupporterSearch={setSupporterSearch}
            setSelectedSupporter={setSelectedSupporter}
          />
        );
      case 'settings':
        if (settingsTab === 'profile') return (
          <div className="space-y-8">
            <header className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-2xl text-brand-orange">
                  <SettingsIcon className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-black text-zinc-900">Configuração / <span className="text-zinc-400">Minha conta</span></h1>
              </div>
              <button onClick={() => setSettingsTab(null)} className="bg-white border border-zinc-100 px-6 py-3 rounded-2xl text-zinc-400 font-bold text-sm flex items-center gap-2 hover:border-zinc-300 transition-all">
                <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
              </button>
            </header>

            <div className="glass-card p-10 space-y-10">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
                        const filePath = `${fileName}`;

                        const { error: uploadError } = await supabase.storage
                          .from('avatars')
                          .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                          .from('avatars')
                          .getPublicUrl(filePath);

                        const { error: updateError } = await supabase
                          .from('profiles')
                          .update({ avatar_url: publicUrl })
                          .eq('id', user.id);

                        if (updateError) throw updateError;

                        // Atualizar localmente se necessário ou disparar refresh
                        alert('Foto de perfil atualizada com sucesso!');
                        onRefreshSettings();
                      } catch (err: any) {
                        alert('Erro ao carregar imagem: ' + err.message);
                      }
                    }}
                  />
                  <div className="w-32 h-32 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-300 overflow-hidden border-2 border-zinc-100">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-16 h-16" />
                    )}
                  </div>
                  <button
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full border-4 border-white hover:bg-emerald-700 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange w-5 h-5" />
                    <input
                      type="text"
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-4 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Endereço de email</label>
                  <div className="relative opacity-60">
                    <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange w-5 h-5" />
                    <input
                      type="email"
                      value={user.email}
                      readOnly
                      className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-12 font-medium outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Celular com DDD</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-xl">🇧🇷</span>
                      <span className="text-zinc-400 font-bold">+ 55</span>
                    </div>
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={profilePhone}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 11) val = val.slice(0, 11);
                        if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
                        if (val.length > 10) val = `${val.slice(0, 10)}-${val.slice(10)}`;
                        setProfilePhone(val);
                      }}
                      className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl pl-24 pr-4 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">CPF</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange w-5 h-5" />
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={profileDocument}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 11) val = val.slice(0, 11);
                        if (val.length > 9) {
                          val = `${val.slice(0, 3)}.${val.slice(3, 6)}.${val.slice(6, 9)}-${val.slice(9)}`;
                        } else if (val.length > 6) {
                          val = `${val.slice(0, 3)}.${val.slice(3, 6)}.${val.slice(6)}`;
                        } else if (val.length > 3) {
                          val = `${val.slice(0, 3)}.${val.slice(3)}`;
                        }
                        setProfileDocument(val);
                      }}
                      className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-4 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">CEP</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange w-5 h-5" />
                    <input
                      type="text"
                      placeholder="00000-000"
                      value={profileCep}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 8) val = val.slice(0, 8);
                        const displayVal = val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val;
                        setProfileCep(displayVal);
                        if (val.length === 8) {
                          handleCepLookup(val);
                        }
                      }}
                      className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-4 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                    {loadingCep && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Endereço (Rua, Av, etc.)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileStreet}
                      onChange={e => setProfileStreet(e.target.value)}
                      className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Número</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileNumber}
                      onChange={e => setProfileNumber(e.target.value)}
                      className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Complemento (Opcional)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileComplement}
                      onChange={e => setProfileComplement(e.target.value)}
                      className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Bairro</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileDistrict}
                      onChange={e => setProfileDistrict(e.target.value)}
                      className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Cidade</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileCity}
                      onChange={e => setProfileCity(e.target.value)}
                      className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Estado (UF)</label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="SP"
                      value={profileState}
                      onChange={e => setProfileState(e.target.value.toUpperCase())}
                      className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nova Senha (opcional)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <div className="w-2 h-2 bg-brand-orange rounded-full" />
                      <div className="w-2 h-2 bg-brand-orange rounded-full" />
                    </div>
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="********"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-12 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                    <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-orange hover:bg-orange-50 p-1.5 rounded-lg transition-all">
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Confirmar nova senha</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <div className="w-2 h-2 bg-brand-orange rounded-full" />
                      <div className="w-2 h-2 bg-brand-orange rounded-full" />
                    </div>
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="********"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-12 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpdateProfile}
                className="w-full bg-brand-orange text-white py-5 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
              >
                Salvar alterações
              </button>

              <div className="pt-10 border-t border-zinc-100">
                <div
                  onClick={handleDeleteAccount}
                  className="glass-card p-6 flex items-center justify-between hover:bg-zinc-50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                      <X className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900">Excluir conta</h3>
                      <p className="text-sm text-zinc-400">Exclua seus dados cadastrais por completo</p>
                    </div>
                  </div>
                  <ChevronRight className="text-zinc-300 group-hover:text-zinc-500 transition-all" />
                </div>
              </div>
            </div>
          </div>
        );

        if (settingsTab === 'payments') return (
          <div className="space-y-8">
            <header className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-2xl text-brand-orange">
                  <SettingsIcon className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-black text-zinc-900">Configuração / <span className="text-zinc-400">Meio de pagamento</span></h1>
              </div>
              <button onClick={() => setSettingsTab(null)} className="bg-white border border-zinc-100 px-6 py-3 rounded-2xl text-zinc-400 font-bold text-sm flex items-center gap-2 hover:border-zinc-300 transition-all">
                <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
              </button>
            </header>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 mb-2">Formas de recebimento</h2>
                <p className="text-zinc-400 font-medium">Configure como você deseja receber pelos títulos vendidos</p>
              </div>

              <div className="grid grid-cols-1 gap-6 max-w-xl">
                {/* PIX */}
                <div
                  onClick={() => setSettingsTab('pix-config')}
                  className="glass-card p-8 space-y-4 hover:border-emerald-500 transition-all cursor-pointer group border-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-24 flex items-center justify-center font-black text-2xl rounded-lg text-emerald-500">
                      PIX
                    </div>
                    <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">Recomendado</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-zinc-600 leading-tight">Receba via PIX. Configure sua chave e o comprador verá na hora de pagar.</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );

        if (settingsTab === 'pix-config') return (
          <PixConfigPanel user={user} onBack={() => setSettingsTab('payments')} />
        );


        if (settingsTab === 'social') return (
          <div className="space-y-8">
            <header className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-2xl text-brand-orange">
                  <SettingsIcon className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-black text-zinc-900">Configuração / <span className="text-zinc-400">Adicionar redes sociais</span></h1>
              </div>
              <button onClick={() => setSettingsTab(null)} className="bg-white border border-zinc-100 px-6 py-3 rounded-2xl text-zinc-400 font-bold text-sm flex items-center gap-2 hover:border-zinc-300 transition-all">
                <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
              </button>
            </header>

            <div className="glass-card p-10 space-y-10">
              <h2 className="text-2xl font-black text-zinc-900">Atendimento e redes sociais</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { label: 'Número para suporte', icon: '🇧🇷 + 55', type: 'tel', value: profilePhone, onChange: setProfilePhone },
                  { label: 'Link do grupo Whatsapp', icon: UserIcon, placeholder: 'Link do canal ou grupo', value: socialWhatsappGroup, onChange: setSocialWhatsappGroup },
                  { label: 'Link do grupo Telegram', icon: Play, placeholder: 'Link do canal ou grupo', value: socialTelegram, onChange: setSocialTelegram },
                  { label: 'Instagram', icon: ImageIcon, placeholder: '@seuperfil', value: socialInstagram, onChange: setSocialInstagram },
                  { label: 'Tiktok', icon: RotateCcw, placeholder: 'Link do seu perfil', value: socialTiktok, onChange: setSocialTiktok },
                  { label: 'Youtube', icon: Play, placeholder: 'Link do seu perfil', value: socialYoutube, onChange: setSocialYoutube },
                  { label: 'Facebook', icon: Users, placeholder: 'Link do seu perfil', value: socialFacebook, onChange: setSocialFacebook },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{item.label}</label>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        {typeof item.icon === 'string' ? (
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">{item.icon}</div>
                        ) : (
                          <item.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange w-5 h-5" />
                        )}
                        <input
                          type={item.type || "text"}
                          placeholder={item.placeholder}
                          value={item.value}
                          onChange={(e) => item.onChange(e.target.value)}
                          className={`w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl ${typeof item.icon === 'string' ? 'pl-20' : 'pl-12'} pr-4 font-medium outline-none focus:ring-2 focus:ring-brand-orange`}
                        />
                      </div>
                      <div className="w-12 h-6 bg-zinc-100 rounded-full relative cursor-pointer opacity-50">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpdateSocial}
                className="w-full bg-brand-orange text-white py-5 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        );

        if (settingsTab === 'integrations') return (
          <div className="space-y-8">
            <header className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-2xl text-brand-orange">
                  <SettingsIcon className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-black text-zinc-900">Configuração / <span className="text-zinc-400">Integrações</span></h1>
              </div>
              <button onClick={() => setSettingsTab(null)} className="bg-white border border-zinc-100 px-6 py-3 rounded-2xl text-zinc-400 font-bold text-sm flex items-center gap-2 hover:border-zinc-300 transition-all">
                <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
              </button>
            </header>

            <div className="space-y-8">
              <h2 className="text-2xl font-black text-zinc-900">Anúncios e monitoramento</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  onClick={() => setSettingsTab('pixel-config')}
                  className="glass-card p-12 flex items-center justify-center gap-4 hover:border-brand-orange transition-all cursor-pointer group"
                >
                  <span className="text-2xl font-black text-blue-600">facebook</span>
                  <Plus className="text-zinc-300" />
                  <span className="text-2xl font-black text-zinc-900 italic">Instagram</span>
                </div>
                <div
                  onClick={() => setSettingsTab('analytics-config')}
                  className="glass-card p-12 flex items-center justify-center gap-4 hover:border-brand-orange transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-white font-black">G</div>
                    <span className="text-2xl font-black text-zinc-900">Google Analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

        if (settingsTab === 'pixel-config' || settingsTab === 'analytics-config') return (
          <div className="fixed inset-0 z-[100] flex items-center justify-end p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              className="bg-white h-full w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                <h2 className="text-2xl font-black text-zinc-900">
                  {settingsTab === 'pixel-config' ? 'Configuração do pixel' : 'Configuração do Analytics'}
                </h2>
                <button onClick={() => setSettingsTab('integrations')} className="bg-white border border-zinc-100 px-6 py-3 rounded-2xl text-zinc-400 font-bold text-sm flex items-center gap-2 hover:border-zinc-300 transition-all">
                  <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
                </button>
              </div>

              <div className="p-8 flex-1 space-y-8">

                <div className="flex flex-col items-center gap-6 py-10">
                  {settingsTab === 'pixel-config' ? (
                    <div className="flex items-center gap-4">
                      <span className="text-4xl font-black text-blue-600">facebook</span>
                      <Plus className="text-zinc-300 w-8 h-8" />
                      <span className="text-4xl font-black text-zinc-900 italic">Instagram</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-white font-black text-3xl">G</div>
                      <span className="text-4xl font-black text-zinc-900">Google Analytics</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">
                      {settingsTab === 'pixel-config' ? 'ID do Pixel do Facebook' : 'ID da métrica'}
                    </label>
                    <input
                      type="text"
                      placeholder={settingsTab === 'pixel-config' ? 'Ex: 1234567890' : 'G-DXHERPQHBX'}
                      value={settingsTab === 'pixel-config' ? pixelFacebook : pixelGoogle}
                      onChange={(e) => settingsTab === 'pixel-config' ? setPixelFacebook(e.target.value) : setPixelGoogle(e.target.value)}
                      className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-zinc-100">
                <button
                  onClick={handleUpdateIntegrations}
                  className="w-full h-14 bg-brand-orange text-white rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        );

        if (settingsTab === 'personalize') return (
          <div className="space-y-8">
            <header className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-2xl text-brand-orange">
                  <SettingsIcon className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-black text-zinc-900">Personalizar</h1>
              </div>
              <button onClick={() => setSettingsTab(null)} className="bg-white border border-zinc-100 px-6 py-3 rounded-2xl text-zinc-400 font-bold text-sm flex items-center gap-2 hover:border-zinc-300 transition-all">
                <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
              </button>
            </header>

            <div className="space-y-6">

              <div className="glass-card divide-y divide-zinc-100">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-50 rounded-xl text-brand-orange">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-zinc-900">Tema do site</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => setSiteTheme(siteTheme === 'dark' ? 'light' : 'dark')}
                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${siteTheme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${siteTheme === 'dark' ? 'right-1' : 'left-1'}`} />
                    </div>
                    <span className="text-sm font-bold text-zinc-400 capitalize">{siteTheme}</span>
                  </div>
                </div>

                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-50 rounded-xl text-brand-orange">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-zinc-900">Cor principal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                    />
                    <span className="text-sm font-mono text-zinc-400 mt-1 uppercase">{primaryColor}</span>
                  </div>
                </div>

                <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-50 rounded-xl text-brand-orange">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-zinc-900">Adicionar um domínio</span>
                  </div>
                  <ChevronRight className="text-zinc-300 group-hover:text-zinc-500 transition-all" />
                </div>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="flex border-b border-zinc-100">
                  <button className="flex-1 py-4 text-sm font-bold text-brand-orange border-b-2 border-brand-orange">Logotipo</button>
                  <button className="flex-1 py-4 text-sm font-bold text-zinc-400">Ícone da página</button>
                </div>
                <div className="p-10 space-y-8">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="text-brand-orange w-5 h-5" />
                    <span className="text-sm font-bold text-zinc-900">Adicione a sua logo</span>
                  </div>

                  <div className="flex items-center justify-between gap-10">
                    <div className="flex items-center gap-2">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="h-14 max-w-[200px] object-contain rounded-xl border p-2" />
                      ) : (
                        <span className="text-2xl font-black text-emerald-500">{user.name}</span>
                      )}
                    </div>

                    <input type="file" id="logo-upload-organizer" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 500000) { alert('A imagem deve ter no máximo 500KB.'); return; }
                      const reader = new FileReader();
                      reader.onload = () => {
                        setLogoPreview(reader.result as string);
                        setLogoUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }} />

                    <div
                      onClick={() => document.getElementById('logo-upload-organizer')?.click()}
                      className="w-32 h-20 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-300 hover:border-brand-orange hover:text-brand-orange transition-all cursor-pointer"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-[10px] font-bold">{logoPreview ? 'Alterar' : 'Adicionar'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpdatePersonalize}
                className="w-full bg-brand-orange text-white py-5 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
              >
                Salvar
              </button>
            </div>
          </div>
        );

        return (
          <div className="space-y-12">
            <h1 className="text-3xl font-black text-zinc-900">Configuração</h1>

            <div
              onClick={() => setSettingsTab('profile')}
              className="glass-card p-6 flex items-center justify-between hover:bg-zinc-50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900">{user.name}</h3>
                  <p className="text-sm text-zinc-400">Gerencie informações e segurança da sua conta</p>
                </div>
              </div>
              <ChevronRight className="text-zinc-300 group-hover:text-zinc-500 transition-all" />
            </div>

            <section>
              <h2 className="text-xl font-black text-zinc-900 mb-6">Recursos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Adicionar conta bancária', icon: DollarSign, tab: 'payments' },
                  { label: 'Personalize do seu jeito', icon: SettingsIcon, tab: 'personalize' },
                  { label: 'Adicionar redes sociais', icon: Users, tab: 'social' },
                  { label: 'Integrações avançadas', icon: QrCode, tab: 'integrations' },
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={() => setSettingsTab(item.tab)}
                    className="glass-card p-8 flex flex-col items-center text-center gap-4 hover:border-brand-orange transition-all cursor-pointer group"
                  >
                    <div className="p-4 bg-zinc-50 rounded-2xl group-hover:bg-orange-50 transition-all">
                      <item.icon className="w-8 h-8 text-brand-orange" />
                    </div>
                    <p className="text-sm font-bold text-zinc-900 leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );
      case 'support':
        return (
          <div className="space-y-12">
            <h1 className="text-3xl font-black text-zinc-900">Ajuda</h1>
            <p className="text-xl font-bold text-zinc-600">Em que podemos ajuda-lo hoje?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div
                onClick={() => {
                  const phone = globalSettings.support_whatsapp?.replace(/\D/g, '') || '5511999999999';
                  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=Olá, preciso de suporte com o sistema VaiRifar.`, '_blank');
                }}
                className="glass-card p-10 flex items-center gap-8 hover:border-emerald-500 transition-all cursor-pointer group"
              >
                <div className="p-5 bg-emerald-50 rounded-3xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Users className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-zinc-900 mb-2">Whatsapp</h3>
                  <p className="text-zinc-400 font-medium">Atendimento de Segunda a Sábado das 9:00 às 22:00</p>
                </div>
              </div>
              <div className="glass-card p-10 flex items-center gap-8 hover:border-brand-orange transition-all cursor-pointer group">
                <div className="p-5 bg-orange-50 rounded-3xl text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-all">
                  <Shield className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-zinc-900 mb-2">Central de ajuda</h3>
                  <p className="text-zinc-400 font-medium">Tire todas as suas dúvidas Atendimento 24h 7 dias por semana</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div className="p-12 text-center text-zinc-400">Em breve...</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <AnimatePresence>
        {showCreate && (
          <CreateCampaignModal
            user={user}
            onClose={() => { setShowCreate(false); setEditingCampaign(null); }}
            onCreated={fetchData}
            initialData={editingCampaign || undefined}
            globalSettings={globalSettings}
          />
        )}
      </AnimatePresence>
      <Sidebar
        activeTab={activeTab}
        onNavigate={(tab) => {
          if (tab === 'create-campaign') {
            setShowCreate(true);
          } else {
            setActiveTab(tab);
            try { localStorage.setItem('rifapro-dashboard-tab', tab); } catch { /* ignorar */ }
          }
        }}
        onLogout={onLogout}
        user={user}
        globalSettings={globalSettings}
        onNavigateRoot={onNavigateRoot}
      />
      <main className="flex-1 p-12 overflow-y-auto">
        {renderContent()}

        {/* Modais Globais do Dashboard */}
        <AnimatePresence>
          {selectedSupporter && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center sticky top-0 bg-white z-10">
                  <h2 className="text-xl font-black text-zinc-900">Detalhes do apoiador</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSupporter(selectedSupporter); }}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-full transition-colors flex items-center gap-1"
                      title="Excluir Apoiador e Pedidos"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold hidden sm:inline">Excluir</span>
                    </button>
                    <button onClick={() => setSelectedSupporter(null)} className="p-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto">
                  <h3 className="font-bold text-zinc-900 mb-4">{selectedSupporter.name}</h3>
                  <div className="space-y-3 mb-6 bg-zinc-50 p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-zinc-500"><TrendingUp className="w-4 h-4 text-brand-orange" /> {selectedSupporter.phone}</div>
                      <button className="bg-brand-orange text-white px-3 py-1 rounded-lg text-xs font-bold">Contatar</button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500"><Users className="w-4 h-4 text-brand-orange" /> {selectedSupporter.email}</div>
                    <div className="flex items-center justify-between border-t border-zinc-200/50 pt-2 mt-2">
                      <span className="text-xs text-zinc-400">Data de cadastro</span>
                      <span className="text-xs font-medium text-zinc-600">{new Date(selectedSupporter.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <h4 className="font-bold text-zinc-900 mb-3 text-sm">Histórico de transações ({selectedSupporter.transactions.length})</h4>
                  <div className="space-y-3">
                    {selectedSupporter.transactions.map((t: any) => (
                      <div key={t.id} className="border border-zinc-100 p-4 rounded-xl flex items-start gap-3">
                        {t.status === 'paid' ? <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-full"><DollarSign className="w-4 h-4" /></div> :
                          (t.status === 'pending_approval' || t.status === 'waiting' || t.status === 'pending') ? <div className="p-1.5 bg-amber-50 text-amber-600 rounded-full"><Clock className="w-4 h-4" /></div> :
                            <div className="p-1.5 bg-zinc-100 text-zinc-500 rounded-full"><AlertCircle className="w-4 h-4" /></div>}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className={`font-bold text-sm ${t.status === 'paid' ? 'text-emerald-700' : 'text-zinc-700'}`}>
                                {t.status === 'paid' ? 'Compra aprovada' : (t.status === 'cancelled' || t.status === 'expired' ? 'Compra Cancelada' : 'Aguardando Aprovação')}
                              </p>
                              <p className="text-xs text-zinc-500 mt-0.5">Pedido #{t.id}</p>
                            </div>
                            <span className="text-xs text-zinc-400">{new Date(t.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-emerald-600 text-sm">R$ {t.total_amount?.toFixed(2)}</p>
                              <p className="text-xs text-zinc-500">{t.ticket_count || t.reserved_numbers?.length || 0} números</p>
                            </div>
                            <button onClick={() => setShowOrderDetails(t)} className="text-[10px] font-bold px-4 py-2 uppercase tracking-wider bg-zinc-100 text-zinc-600 rounded-lg border border-zinc-200 hover:bg-zinc-200 transition-colors">
                              Ver Detalhes
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showReceipt && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-sm" onClick={() => setShowReceipt(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center justify-center">
                <button onClick={() => setShowReceipt(null)} className="absolute -top-12 right-0 p-2 text-white hover:text-zinc-300"><X className="w-8 h-8" /></button>
                <img src={showReceipt} alt="Comprovante" className="max-w-full max-h-[85vh] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showOrderDetails && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center sticky top-0 bg-white z-10">
                  <h2 className={`text-xl font-black ${showOrderDetails.status === 'paid' ? 'text-zinc-900' : (showOrderDetails.status === 'cancelled' || showOrderDetails.status === 'expired' ? 'text-red-600' : 'text-amber-600')}`}>
                    {showOrderDetails.status === 'paid' ? 'Compra aprovada' : (showOrderDetails.status === 'cancelled' || showOrderDetails.status === 'expired' ? 'Compra Cancelada' : 'Compra Pendente')}
                  </h2>
                  <button onClick={() => setShowOrderDetails(null)} className="p-2 text-brand-orange hover:bg-brand-orange/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">

                  {/* Resumo Campanha puxando do State Master campaigns */}
                  {(() => {
                    const c = campaigns.find(camp => camp.id === showOrderDetails.campaign_id);
                    return c ? (
                      <div className="border border-zinc-200 rounded-xl p-3 flex gap-3 items-center">
                        <div className="w-16 h-16 bg-zinc-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {c.image_url ? <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" /> : <Ticket className="w-6 h-6 text-zinc-300" />}
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-sm text-zinc-800 line-clamp-2">{c.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 mt-1 inline-block rounded-md font-bold border ${c.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            {c.status === 'active' ? 'Ativa' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-zinc-200 rounded-xl p-3 flex gap-3 items-center">
                        <div className="w-16 h-16 bg-zinc-100 rounded-lg flex items-center justify-center"><Ticket className="w-6 h-6 text-zinc-300" /></div>
                        <div>
                          <span className="font-bold text-sm text-zinc-800 line-clamp-2">Campanha Removida ou Indisponível</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-3">
                    <h4 className="font-bold text-zinc-800 text-sm">Detalhes da compra</h4>
                    <div className="flex items-center justify-between"><span className="text-zinc-500 text-sm">Forma de pagamento</span><span className="font-bold text-sm text-zinc-800">PIX (ou outro)</span></div>
                    <div className="flex items-center justify-between"><span className="text-zinc-500 text-sm">Data da reserva</span><span className="font-bold text-sm text-zinc-800">{new Date(showOrderDetails.created_at).toLocaleString('pt-BR')}</span></div>
                    <div className="flex items-center justify-between"><span className="text-zinc-500 text-sm">Valor total da compra</span><span className="font-bold text-sm text-zinc-800">R$ {showOrderDetails.total_amount?.toFixed(2)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-zinc-500 text-sm">Títulos quantidade</span><span className="font-bold text-sm text-zinc-800">{showOrderDetails.reserved_numbers?.length || showOrderDetails.ticket_count || 0}</span></div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-bold text-zinc-800 text-sm">Títulos/Números</h4>
                      <Search className="w-3 h-3 text-brand-orange ml-auto" />
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
                      {showOrderDetails.reserved_numbers && showOrderDetails.reserved_numbers.length > 0 ? (
                        showOrderDetails.reserved_numbers.map((n: number) => (
                          <span key={n} className="border border-[#78E3A1] text-[#28C76F] font-mono text-xs font-bold px-2 py-1 rounded-md">{String(n).padStart(6, '0')}</span>
                        ))
                      ) : (
                        <div className="w-full text-xs text-zinc-400 bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-center">
                          *(Transação antiga ou números não alocados no ato dessa compra)*
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex flex-col gap-3">

                  {/* Comprovante inline */}
                  <div>
                    <h4 className="font-bold text-zinc-800 text-sm mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-500" /> Comprovante de Pagamento
                    </h4>
                    {showOrderDetails.receipt_url ? (
                      <div className="space-y-3">
                        <div
                          className="relative w-full rounded-xl overflow-hidden border border-blue-100 bg-zinc-100 min-h-[200px] flex items-center justify-center"
                        >
                          {showOrderDetails.receipt_url.startsWith('data:application/pdf') || showOrderDetails.receipt_url.includes('.pdf') ? (
                            <embed
                              src={showOrderDetails.receipt_url}
                              type="application/pdf"
                              className="w-full h-64 rounded-xl"
                            />
                          ) : (
                            <img
                              src={showOrderDetails.receipt_url}
                              alt="Comprovante de pagamento"
                              className="w-full max-h-64 object-contain cursor-zoom-in"
                              onClick={() => setShowReceipt(showOrderDetails.receipt_url)}
                            />
                          )}
                          {!showOrderDetails.receipt_url.startsWith('data:application/pdf') && !showOrderDetails.receipt_url.includes('.pdf') && (
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-3 text-white text-[10px] font-bold text-center pointer-events-none">
                              🔍 Clique para ampliar
                            </div>
                          )}
                        </div>
                        <a
                          href={showOrderDetails.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-xs font-bold transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Abrir comprovante em nova aba
                        </a>
                      </div>
                    ) : (
                      <div className="w-full bg-amber-50 border border-amber-100 rounded-xl p-4 text-center text-amber-600 text-sm font-medium">
                        ⏳ Aguardando envio do comprovante pelo comprador
                      </div>
                    )}
                  </div>

                  {(showOrderDetails.status === 'pending' || showOrderDetails.status === 'waiting' || showOrderDetails.status === 'pending_approval') && (
                    <button onClick={() => handleApproveOrder(showOrderDetails.id)} className="w-full bg-[#28C76F] hover:bg-[#20A65B] text-white py-4 rounded-xl font-bold text-base transition-colors shadow-sm shadow-emerald-200 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Aprovar Pagamento do Pedido
                    </button>
                  )}

                  {(showOrderDetails.status !== 'cancelled' && showOrderDetails.status !== 'expired') && (
                    <button onClick={() => handleCancelOrder(showOrderDetails.id)} className="w-full bg-white hover:bg-red-50 text-[#FA6E65] border border-red-100 py-4 mt-2 rounded-xl font-bold text-base transition-colors">
                      Cancelar compra
                    </button>
                  )}
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const NotFoundPage = ({ campaigns, onSelectCampaign, onNavigate }: { campaigns: Campaign[], onSelectCampaign: (c: Campaign) => void, onNavigate: (page: string) => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const activeCampaigns = campaigns.filter(c => c.status === 'active').slice(0, 3);

  const filteredCampaigns = campaigns.filter(c => 
    c.status === 'active' && 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-zinc-50 to-white flex flex-col justify-center items-center py-16 px-4">
      <div className="max-w-xl w-full text-center space-y-8">
        {/* Ilustração Premium 404 */}
        <div className="relative">
          <h1 className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-orange to-brand-green leading-none select-none">404</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">Página Não Encontrada</p>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black text-zinc-900">Ops! Esse link não existe ou foi removido.</h2>
          <p className="text-zinc-500 font-medium max-w-md mx-auto">
            Não se preocupe, você pode pesquisar pelo sorteio desejado abaixo ou dar uma olhada nas nossas campanhas ativas em destaque!
          </p>
        </div>

        {/* Campo de Busca Inteligente */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input
            type="text"
            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-zinc-200 font-medium outline-none focus:ring-2 focus:ring-brand-orange shadow-sm bg-white text-zinc-900"
            placeholder="Buscar sorteio por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Resultados de Busca ou Campanhas em Destaque */}
        <div className="space-y-4 pt-4 text-left">
          {searchQuery ? (
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Resultados da Pesquisa ({filteredCampaigns.length})</p>
              <div className="space-y-3">
                {filteredCampaigns.length > 0 ? (
                  filteredCampaigns.map(c => (
                    <div
                      key={c.id}
                      onClick={() => onSelectCampaign(c)}
                      className="flex items-center gap-4 bg-white border border-zinc-100 p-4 rounded-2xl hover:shadow-md cursor-pointer transition-all hover:border-brand-orange"
                    >
                      <img src={c.image_url || 'https://picsum.photos/seed/default/100/100'} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-zinc-900 text-sm truncate">{c.title}</h4>
                        <p className="text-xs text-zinc-400 font-medium">Cota por apenas R$ {c.ticket_price.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-400" />
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-400 italic text-sm text-center py-4">Nenhum sorteio ativo encontrado.</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 text-center">Campanhas Recomendadas em Destaque</p>
              <div className="space-y-3">
                {activeCampaigns.length > 0 ? (
                  activeCampaigns.map(c => (
                    <div
                      key={c.id}
                      onClick={() => onSelectCampaign(c)}
                      className="flex items-center gap-4 bg-white border border-zinc-100 p-4 rounded-2xl hover:shadow-md cursor-pointer transition-all hover:border-brand-orange"
                    >
                      <img src={c.image_url || 'https://picsum.photos/seed/default/100/100'} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-zinc-900 text-sm truncate">{c.title}</h4>
                        <p className="text-xs text-zinc-400 font-medium">Cota por apenas R$ {c.ticket_price.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-400 animate-pulse" />
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-400 italic text-sm text-center py-4">Nenhuma campanha em destaque ativa no momento.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => onNavigate('home')}
            className="px-8 py-4 bg-brand-orange text-white rounded-2xl font-bold shadow-lg shadow-orange-100 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
          >
            Ir para a Home do Site
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="px-8 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-2xl font-bold transition-all text-sm"
          >
            Ver Todos os Sorteios
          </button>
        </div>
      </div>
    </div>
  );
};

const ResetPasswordPage = ({ onResetComplete }: { onResetComplete: () => void }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      alert("Senha redefinida com sucesso! Faça login com a sua nova senha.");
      onResetComplete();
    } catch (err: any) {
      alert(err.message || "Erro ao redefinir a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900">Nova Senha</h1>
          <p className="text-zinc-500 text-sm">Digite sua nova senha abaixo para acessar sua conta.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Nova Senha</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Confirmar Nova Senha</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Salvar Nova Senha
          </button>
        </form>
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin, onNavigate }: { onLogin: (u: User) => void, onNavigate?: (page: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!acceptTerms || !acceptPrivacy) {
          alert('Você precisa aceitar os Termos de Uso e a Política de Privacidade para prosseguir.');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, role: 'organizer' } }
        });
        if (error) throw error;
        if (data.user) {
          try {
            await Promise.all([
              fetch('/api/lgpd/consent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: data.user.id,
                  consent_type: 'terms_of_use',
                  version: '1.0.0',
                  accepted: true
                })
              }),
              fetch('/api/lgpd/consent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: data.user.id,
                  consent_type: 'privacy_policy',
                  version: '1.0.0',
                  accepted: true
                })
              })
            ]);
          } catch (errConsent) {
            console.error('Erro ao registrar consentimento LGPD no cadastro:', errConsent);
          }

          onLogin({
            id: data.user.id,
            name: name,
            email: data.user.email || email,
            role: 'organizer'
          });
        }
      } else if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (profile) {
            onLogin(mapProfileToUser(profile, data.user.email || email));
          } else {
            onLogin({
              id: data.user.id,
              name: data.user.email?.split('@')[0] || 'Usuário',
              email: data.user.email || email,
              role: 'organizer'
            });
          }
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/?recovery=true`
        });
        if (error) throw error;
        alert("E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.");
        setMode('login');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao processar autenticação. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Sempre usa o domínio de produção para evitar redirect para localhost
      const prodOrigin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'https://www.vairifar.com.br'
        : window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${prodOrigin}/`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message || 'Erro ao iniciar login com o Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-2xl w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ticket className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900">
            {mode === 'register' ? 'Criar sua conta' : mode === 'forgot' ? 'Recuperar senha' : 'Bem-vindo de volta'}
          </h1>
          <p className="text-zinc-500 text-sm">
            {mode === 'register' 
              ? 'Cadastre-se para começar a criar rifas.' 
              : mode === 'forgot' 
                ? 'Digite seu e-mail para receber o link de redefinição.' 
                : 'Acesse sua conta para gerenciar suas rifas.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Nome Completo</label>
              <input
                type="text"
                required
                className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">E-mail</label>
            <input
              type="email"
              required
              className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Senha</label>
                {mode === 'login' && (
                  <span
                    onClick={() => setMode('forgot')}
                    className="text-xs font-bold text-emerald-600 cursor-pointer hover:underline"
                  >
                    Esqueceu sua senha?
                  </span>
                )}
              </div>
              <input
                type="password"
                required
                minLength={6}
                className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-3 pt-2 text-left">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="mt-1 accent-emerald-600 rounded border-zinc-300"
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                />
                <span className="text-xs text-zinc-500 font-medium leading-relaxed">
                  Li e concordo com os{' '}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); onNavigate?.('terms-of-use'); }}
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    Termos de Uso
                  </a>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="mt-1 accent-emerald-600 rounded border-zinc-300"
                  checked={acceptPrivacy}
                  onChange={e => setAcceptPrivacy(e.target.checked)}
                />
                <span className="text-xs text-zinc-500 font-medium leading-relaxed">
                  Li e concordo com a{' '}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); onNavigate?.('privacy-policy'); }}
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    Política de Privacidade
                  </a>
                </span>
              </label>
            </div>
          )}

          <button
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {mode === 'register' ? 'Criar minha conta' : mode === 'forgot' ? 'Enviar Link de Recuperação' : 'Entrar no Painel'}
          </button>
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-zinc-400 font-bold tracking-wider">Ou continue com</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border border-zinc-200 text-zinc-700 py-3.5 rounded-2xl font-bold hover:bg-zinc-50 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-sm"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {mode === 'register' ? 'Cadastrar com o Google' : 'Entrar com o Google'}
            </button>
          </>
        )}

        <p className="text-center text-xs text-zinc-400 mt-6">
          {mode === 'forgot' ? (
            <span
              className="text-emerald-600 font-bold cursor-pointer hover:underline"
              onClick={() => setMode('login')}
            >
              Voltar para o login
            </span>
          ) : (
            <>
              {mode === 'register' ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
              <span
                className="text-emerald-600 font-bold cursor-pointer hover:underline"
                onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
              >
                {mode === 'register' ? 'Entrar aqui' : 'Crie sua primeira rifa agora.'}
              </span>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
};

const CookieConsentBanner = ({
  onAcceptAll,
  onRejectOptional,
  onCustomize
}: {
  onAcceptAll: () => void;
  onRejectOptional: () => void;
  onCustomize: () => void;
}) => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-6 right-6 z-50 max-w-5xl mx-auto bg-white/95 backdrop-blur-lg border border-zinc-200/80 p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col md:flex-row items-center justify-between gap-6 font-sans"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
          <Shield className="w-6 h-6" />
        </div>
        <div className="space-y-1 text-left">
          <h4 className="text-base font-black text-zinc-900 leading-snug">Sua privacidade importa</h4>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            Utilizamos cookies para melhorar a sua experiência no nosso site. Cookies necessários garantem o funcionamento correto. Cookies de estatísticas, marketing e personalização nos ajudam a entender como você interage com o site. Você pode aceitar todos, recusar opcionais ou personalizar suas opções.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto shrink-0">
        <button
          onClick={onCustomize}
          className="flex-1 sm:flex-initial text-xs font-bold text-zinc-600 hover:text-zinc-900 border border-zinc-200 px-5 py-3.5 rounded-2xl hover:bg-zinc-50 transition-all uppercase tracking-widest whitespace-nowrap"
        >
          Personalizar
        </button>
        <button
          onClick={onRejectOptional}
          className="flex-1 sm:flex-initial text-xs font-bold text-zinc-500 hover:text-zinc-700 px-5 py-3.5 rounded-2xl hover:bg-zinc-100 transition-all uppercase tracking-widest whitespace-nowrap"
        >
          Recusar Opcionais
        </button>
        <button
          onClick={onAcceptAll}
          className="flex-1 sm:flex-initial text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-100 uppercase tracking-widest whitespace-nowrap"
        >
          Aceitar Todos
        </button>
      </div>
    </motion.div>
  );
};

const CookiePreferencesModal = ({
  onClose,
  onSave,
  initialPreferences
}: {
  onClose: () => void;
  onSave: (preferences: any) => void;
  initialPreferences: any;
}) => {
  const [stats, setStats] = useState(initialPreferences?.statistics ?? false);
  const [marketing, setMarketing] = useState(initialPreferences?.marketing ?? false);
  const [personalization, setPersonalization] = useState(initialPreferences?.personalization ?? false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-xl rounded-3xl border border-zinc-100 shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-hidden font-sans"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-900 leading-none">Preferências de Cookies</h3>
              <p className="text-xs text-zinc-400 font-medium mt-1">Personalize o uso dos cookies do site</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:bg-zinc-50 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6">
          <div className="flex items-start justify-between gap-4 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-zinc-900">Necessários</h4>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full uppercase">Obrigatório</span>
              </div>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Essenciais para o funcionamento básico e segurança do site. Não podem ser desativados.
              </p>
            </div>
            <div className="relative cursor-not-allowed opacity-60">
              <div className="w-12 h-6 rounded-full bg-emerald-600 relative">
                <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 p-4 border border-zinc-100 rounded-2xl hover:bg-zinc-50/50 transition-all">
            <div className="space-y-1 text-left">
              <h4 className="text-sm font-bold text-zinc-900">Estatísticas</h4>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Coletam dados anônimos para entendermos como o site está sendo utilizado (ex: páginas mais acessadas) e identificarmos pontos de melhoria.
              </p>
            </div>
            <div
              onClick={() => setStats(!stats)}
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${stats ? 'bg-emerald-600' : 'bg-zinc-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${stats ? 'right-1' : 'left-1'}`} />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 p-4 border border-zinc-100 rounded-2xl hover:bg-zinc-50/50 transition-all">
            <div className="space-y-1 text-left">
              <h4 className="text-sm font-bold text-zinc-900">Marketing</h4>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Usados para veicular anúncios e campanhas mais relevantes para você de acordo com o seu perfil de navegação.
              </p>
            </div>
            <div
              onClick={() => setMarketing(!marketing)}
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${marketing ? 'bg-emerald-600' : 'bg-zinc-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${marketing ? 'right-1' : 'left-1'}`} />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 p-4 border border-zinc-100 rounded-2xl hover:bg-zinc-50/50 transition-all">
            <div className="space-y-1 text-left">
              <h4 className="text-sm font-bold text-zinc-900">Personalização</h4>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Permitem que o site lembre de suas escolhas e preferências de navegação (como temas e visualizações).
              </p>
            </div>
            <div
              onClick={() => setPersonalization(!personalization)}
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${personalization ? 'bg-emerald-600' : 'bg-zinc-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${personalization ? 'right-1' : 'left-1'}`} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-zinc-100 pt-5 w-full shrink-0">
          <button
            onClick={onClose}
            className="flex-1 text-xs font-bold text-zinc-500 hover:text-zinc-700 border border-zinc-200 py-3.5 rounded-2xl hover:bg-zinc-50 transition-all uppercase tracking-widest"
          >
            Voltar
          </button>
          <button
            onClick={() => onSave({ necessary: true, statistics: stats, marketing: marketing, personalization: personalization })}
            className="flex-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-100 uppercase tracking-widest"
          >
            Salvar Preferências
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const LGPDPolicyPage = ({ page, onNavigate, settings }: { page: string, onNavigate: (page: string) => void, settings: any }) => {
  const getPageInfo = () => {
    const docVersion = settings?.lgpd_documents_version || '1.0.0';
    const docVigency = settings?.lgpd_vigency_date || 'Junho de 2026';
    const controllerName = settings?.lgpd_controller_name || 'Vai Rifar';
    const controllerDoc = settings?.lgpd_controller_document || '';

    const formattedVigency = `Versão ${docVersion} (Vigência a partir de ${docVigency})`;

    switch (page) {
      case 'terms-of-use':
        return {
          title: 'Termos de Uso',
          subtitle: 'Termos e Condições Gerais de Uso da Plataforma',
          version: formattedVigency,
          content: settings?.lgpd_terms_of_use || `
### 1. Aceitação dos Termos
Ao acessar e utilizar a plataforma ${controllerName}${controllerDoc ? ` (CNPJ/CPF: ${controllerDoc})` : ''}, você declara ter pelo menos 18 anos de idade e concorda expressamente com as disposições contidas nestes Termos de Uso. Se você não concorda com qualquer parte destes termos, não deve utilizar nossos serviços.

### 2. Natureza da Plataforma
A plataforma é uma ferramenta tecnológica SaaS (Software as a Service) que fornece recursos para criação, gerenciamento e divulgação de campanhas de sorteios online por organizadores independentes. O controlador não é organizador, intermediário ou promotor de nenhuma campanha. A responsabilidade por toda e qualquer campanha cadastrada, sua legalidade, prestação de contas, entrega de prêmios e conformidade com as legislações vigentes recai exclusivamente sobre o organizador criador da campanha.

### 3. Cadastro do Organizador
Para criar campanhas, o organizador deve realizar um cadastro fornecendo dados completos e verdadeiros (Nome, CPF, E-mail, Celular e Endereço). O organizador é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorram sob sua conta.

### 4. Responsabilidades do Organizador
- Garantir que as campanhas criadas estejam em conformidade com as leis locais relativas à distribuição de prêmios e sorteios.
- Realizar a entrega dos prêmios descritos de forma idônea aos vencedores.
- Tratar os dados dos apoiadores/compradores com total sigilo e em estrita conformidade com a LGPD.
- Não utilizar a plataforma para sorteios enganosos, ilegais ou abusivos.

### 5. Responsabilidades do Apoiador/Comprador
- Fornecer informações corretas (Nome, E-mail e WhatsApp) ao reservar números em campanhas.
- Realizar o pagamento diretamente ao organizador da campanha conforme os dados informados.
- Compreender que qualquer reclamação sobre a entrega do prêmio ou o sorteio deve ser direcionada unicamente ao organizador responsável.

### 6. Limitação de Responsabilidade
Não nos responsabilizamos por perdas financeiras, danos morais, cancelamentos, descumprimento de entrega de prêmios ou desvios de conduta de qualquer organizador ou participante. A plataforma apenas fornece o meio tecnológico de gerenciamento.

### 7. Versionamento e Atualizações
Estes termos podem ser atualizados periodicamente para refletir mudanças legislativas ou melhorias na plataforma. A versão atualizada entrará em vigor imediatamente após sua publicação no site.
          `
        };
      case 'cookies-policy':
        return {
          title: 'Política de Cookies',
          subtitle: 'Transparência sobre o uso de cookies em nossa plataforma',
          version: formattedVigency,
          content: settings?.lgpd_cookies_policy || `
### 1. O que são Cookies?
Cookies são pequenos arquivos de texto enviados e armazenados no seu navegador de internet quando você visita sites. Eles servem para lembrar de suas ações, preferências e configurações, de modo a proporcionar uma experiência de navegação mais rápida, segura e personalizada.

### 2. Como Utilizamos Cookies?
A plataforma ${controllerName} utiliza cookies de diferentes categorias. Você tem total controle sobre os cookies não essenciais e pode alterar seus consentimentos a qualquer momento em nosso Banner ou na Central de Preferências.

### 3. Categorias de Cookies Utilizados
- **Cookies Necessários (Essenciais):** São imprescindíveis para a navegação básica, segurança e login seguro na plataforma. Sem eles, o site não funcionaria corretamente.
- **Cookies de Estatísticas (Analíticos):** Ajudam-nos a coletar dados anônimos sobre como as páginas do site são acessadas. Usamos ferramentas analíticas para identificar fluxos de navegação e melhorar o desempenho técnico do sistema.
- **Cookies de Marketing:** Permitem o carregamento de scripts para rastreamento de conversões (como o Facebook Pixel) com o objetivo de otimizar campanhas de atração de novos usuários.
- **Cookies de Personalização:** Permitem que o sistema salve configurações visuais e preferências escolhidas por você (como o tema escuro/claro e layouts personalizados).

### 4. Gerenciamento e Controle de Cookies
Você pode revogar ou ajustar seu consentimento a qualquer momento no nosso site acessando a nossa Central de Preferências (clicando em "Política de Cookies" ou no link respectivo no rodapé). Alternativamente, você pode bloquear ou limpar os cookies diretamente nas configurações do seu navegador de internet.

### 5. Cookies de Terceiros
Eventualmente, provedores de serviços terceiros (como gateways de pagamentos e provedores de autenticação) podem instalar cookies essenciais adicionais para concluir ações solicitadas por você (como login ou pagamento).
          `
        };
      case 'privacy-policy':
      default:
        return {
          title: 'Política de Privacidade',
          subtitle: 'Como protegemos seus dados pessoais de acordo com a LGPD',
          version: formattedVigency,
          content: settings?.lgpd_privacy_policy || `
### 1. Compromisso com a Privacidade
A privacidade dos seus dados pessoais é uma prioridade absoluta para a ${controllerName}. Esta Política de Privacidade descreve de forma clara e objetiva como coletamos, tratamos, armazenamos e protegemos os seus dados, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).

### 2. Dados Coletados
- **Para Organizadores:** Coletamos dados cadastrais completos necessários para faturamento e integridade da plataforma (Nome, CPF, E-mail, Celular, Endereço completo e informações de customização do painel).
- **Para Apoiadores/Compradores:** Coletamos dados essenciais fornecidos por você ao reservar quotas (Nome, E-mail e Celular).
- **Dados Técnicos (Navegação):** Registramos o seu endereço IP, data/hora dos consentimentos, navegador e informações básicas do dispositivo para auditorias e segurança.

### 3. Finalidades do Tratamento
Tratamos os dados para:
- Viabilizar a criação e o controle das campanhas de sorteios.
- Permitir que os organizadores entrem em contato com os ganhadores e apoiadores.
- Processar transações e integrações de pagamento de forma segura.
- Atender a obrigações legais de auditoria e registro de logs de consentimento previstos na LGPD.
- Aperfeiçoar o design e as funcionalidades da plataforma.

### 4. Compartilhamento de Dados
Os seus dados pessoais **nunca** serão vendidos ou comercializados. O compartilhamento ocorre estritamente nas seguintes situações:
- Com os organizadores das campanhas nas quais você participa, para viabilizar a identificação e entrega de prêmios.
- Com prestadores de serviço necessários para a operação (ex: gateways de pagamento e provedores de autenticação).
- Mediante obrigação legal ou ordem judicial de autoridade competente.

### 5. Seus Direitos sob a LGPD
Como titular dos dados, você pode exercer a qualquer momento seus direitos através do nosso **Canal LGPD** (?page=lgpd), solicitando:
- Confirmação da existência de tratamento e acesso aos dados.
- Correção de dados incompletos ou inexatos.
- Exclusão e anonimização de sua conta e dados pessoais.
- Revogação de consentimentos concedidos anteriormente.

### 6. Armazenamento e Segurança
Os dados são armazenados em servidores de nuvem altamente seguros com criptografia em trânsito e em repouso. Implementamos rígidos controles de segurança contra acessos não autorizados.

### 7. Alterações nesta Política
Esta política pode ser atualizada periodicamente. Sempre que houver uma alteração significativa, a data da versão no topo do documento será atualizada.
          `
        };
    }
  };

  const info = getPageInfo();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 font-sans text-left">
      <div className="bg-white rounded-3xl border border-zinc-100 p-8 sm:p-12 shadow-2xl space-y-8">
        <div className="border-b border-zinc-100 pb-8 text-center space-y-3">
          <button onClick={() => onNavigate('home')} className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-all uppercase tracking-widest mb-4">
            Voltar para a Home
          </button>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 leading-tight">{info.title}</h1>
          <p className="text-sm text-zinc-500 font-medium">{info.subtitle}</p>
          <span className="inline-block text-[11px] font-bold text-zinc-400 bg-zinc-50 px-3 py-1 rounded-full uppercase tracking-wider mt-4">
            {info.version}
          </span>
        </div>

        <div className="prose max-w-none text-left">
          {info.content.split('\n\n').map((para, i) => {
            const trimmed = para.trim();
            if (!trimmed) return null;
            if (trimmed.startsWith('###')) {
              return <h3 key={i} className="text-lg font-black text-zinc-900 mt-8 mb-4">{trimmed.replace('###', '').trim()}</h3>;
            }
            if (trimmed.startsWith('-')) {
              return (
                <ul key={i} className="list-disc pl-6 space-y-2 text-sm text-zinc-600 font-medium mb-4">
                  {trimmed.split('\n').map((li, idx) => (
                    <li key={idx}>{li.replace(/^-/, '').trim()}</li>
                  ))}
                </ul>
              );
            }
            return <p key={i} className="text-sm text-zinc-600 font-medium leading-relaxed mb-4">{trimmed}</p>;
          })}
        </div>

        {/* Card do Controlador e DPO */}
        {settings && (settings.lgpd_controller_name || settings.lgpd_contact_email || settings.lgpd_dpo_name || settings.lgpd_vigency_date) && (
          <div className="mt-8 p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-4 text-left">
            <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Informações de Contato & Controle de Dados</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-zinc-500">
              {settings.lgpd_controller_name && (
                <p><b>Controlador:</b> {settings.lgpd_controller_name} {settings.lgpd_controller_document ? `(CNPJ/CPF: ${settings.lgpd_controller_document})` : ''}</p>
              )}
              {settings.lgpd_contact_email && (
                <p><b>E-mail de Contato:</b> {settings.lgpd_contact_email}</p>
              )}
              {settings.lgpd_dpo_name && (
                <p><b>Encarregado de Proteção de Dados (DPO):</b> {settings.lgpd_dpo_name}</p>
              )}
              {settings.lgpd_vigency_date && (
                <p><b>Vigência dos Termos:</b> A partir de {settings.lgpd_vigency_date}</p>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-zinc-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-400 font-medium text-center sm:text-left">
            Dúvidas sobre nossas políticas? Entre em contato pelo nosso Canal LGPD.
          </p>
          <button
            onClick={() => onNavigate('lgpd-form')}
            className="w-full sm:w-auto bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 uppercase tracking-widest text-center animate-pulse"
          >
            Falar no Canal LGPD
          </button>
        </div>
      </div>
    </div>
  );
};

const LGPDFormPage = ({ onNavigate, settings }: { onNavigate: (page: string) => void, settings: any }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [requestType, setRequestType] = useState('access');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/lgpd/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          request_type: requestType,
          details
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao registrar solicitação.');
      }
      setSuccess(true);
      setName('');
      setEmail('');
      setDetails('');
    } catch (err: any) {
      alert(err.message || 'Houve um erro ao enviar sua solicitação. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 font-sans">
      <div className="bg-white rounded-3xl border border-zinc-100 p-8 sm:p-12 shadow-2xl space-y-8">
        <div className="text-center space-y-3">
          <button onClick={() => onNavigate('home')} className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-all uppercase tracking-widest mb-4">
            Voltar para a Home
          </button>
          <h1 className="text-3xl font-black text-zinc-900 leading-tight">Canal LGPD</h1>
          <p className="text-sm text-zinc-500 font-medium">
            Exerça seus direitos de privacidade de forma rápida e segura.
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center space-y-4"
          >
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-zinc-900">Solicitação Enviada!</h3>
            <p className="text-sm text-zinc-600 font-medium leading-relaxed text-left">
              Recebemos seu pedido de privacidade. Conforme previsto em lei, analisaremos sua solicitação e responderemos no e-mail informado em até 15 dias.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest inline-block pt-2"
            >
              Fazer outra solicitação
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block text-left">Nome Completo</label>
              <input
                type="text"
                required
                placeholder="Ex: Maria Silva"
                className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block text-left">Endereço de E-mail</label>
              <input
                type="email"
                required
                placeholder="maria@exemplo.com"
                className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block text-left">Tipo de Solicitação</label>
              <select
                className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-zinc-700"
                value={requestType}
                onChange={e => setRequestType(e.target.value)}
              >
                <option value="access">Solicitar acesso completo aos meus dados</option>
                <option value="correction">Solicitar correção de dados inexatos/incompletos</option>
                <option value="deletion">Solicitar exclusão da minha conta e anonimização de dados</option>
                <option value="revocation">Revogar consentimentos concedidos anteriormente</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block text-left">Detalhes adicionais (opcional)</label>
              <textarea
                rows={4}
                placeholder="Descreva detalhadamente sua solicitação para agilizar o atendimento..."
                className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                value={details}
                onChange={e => setDetails(e.target.value)}
              />
            </div>

            <button
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
            >
              {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Enviar Solicitação
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  // Inicializa page do localStorage para evitar flash home→dashboard ao atualizar
  const [page, setPage] = useState(() => {
    try {
      // Se há usuário em cache, começa no dashboard para evitar flash
      const cachedUser = localStorage.getItem('rifapro-user');
      if (cachedUser) {
        // Verifica se a URL atual é especial (rifa, política, etc.)
        const pathname = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('recovery') || pathname === '/reset-password') return 'reset-password';
        if (pathname.startsWith('/rifa/')) return 'campaign-details';
        if (urlParams.get('rifa')) return 'campaign-details';
        if (pathname === '/politica-de-privacidade') return 'privacy-policy';
        if (pathname === '/termos-de-uso') return 'terms-of-use';
        if (pathname === '/politica-de-cookies') return 'cookies-policy';
        if (pathname === '/lgpd') return 'lgpd-form';
        if (pathname === '/login') return 'login';
        // Usuário logado e sem URL especial → vai direto pro dashboard
        return 'dashboard';
      }
    } catch (e) { /* ignorar */ }
    return 'home';
  });
  const [user, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  
  const [cookieConsent, setCookieConsent] = useState<{
    necessary: boolean;
    statistics: boolean;
    marketing: boolean;
    personalization: boolean;
  } | null>(() => {
    try {
      const cached = localStorage.getItem('vairifar-cookie-consent');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [showCookieBanner, setShowCookieBanner] = useState(cookieConsent === null);
  const [showCookiePreferences, setShowCookiePreferences] = useState(false);
  const [settings, setSettings] = useState<any>(() => {
    const cached = readCachedSettings();
    if (cached) {
      applySiteTheme(cached);
      preloadSiteLogo(cached);
      return cached;
    }
    return null;
  });
  const [settingsReady, setSettingsReady] = useState(() => Boolean(readCachedSettings()));

  const userRef = React.useRef<User | null>(null);
  const pageRef = React.useRef(page);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // Inicializa o estado do histórico do navegador
  useEffect(() => {
    const pathname = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const rifaParam = urlParams.get('rifa');
    const recoveryParam = urlParams.get('recovery');
    const pageParam = urlParams.get('page');

    if (recoveryParam || pathname === '/reset-password') {
      window.history.replaceState({ page: 'reset-password' }, '', window.location.href);
    } else if (pathname.startsWith('/rifa/')) {
      const slug = pathname.substring(6);
      window.history.replaceState({ page: 'campaign-details', rifaSlug: slug }, '', window.location.href);
    } else if (pathname === '/politica-de-privacidade' || pageParam === 'politica-de-privacidade') {
      window.history.replaceState({ page: 'privacy-policy' }, '', window.location.href);
    } else if (pathname === '/termos-de-uso' || pageParam === 'termos-de-uso') {
      window.history.replaceState({ page: 'terms-of-use' }, '', window.location.href);
    } else if (pathname === '/politica-de-cookies' || pageParam === 'politica-de-cookies') {
      window.history.replaceState({ page: 'cookies-policy' }, '', window.location.href);
    } else if (pathname === '/lgpd' || pageParam === 'lgpd') {
      window.history.replaceState({ page: 'lgpd-form' }, '', window.location.href);
    } else if (rifaParam) {
      window.history.replaceState({ page: 'campaign-details', rifaSlug: rifaParam }, '', `${window.location.origin}/rifa/${rifaParam}`);
    } else {
      window.history.replaceState({ page: 'home' }, '', window.location.href);
    }
  }, []);

  // Sincroniza estado do React -> URL do navegador
  useEffect(() => {
    if (page === 'campaign-details' && selectedCampaign) {
      const newUrl = `${window.location.origin}/rifa/${selectedCampaign.slug || selectedCampaign.id}`;
      if (window.location.pathname !== `/rifa/${selectedCampaign.slug || selectedCampaign.id}`) {
        window.history.pushState({ page, campaignId: selectedCampaign.id, rifaSlug: selectedCampaign.slug }, '', newUrl);
      }
    } else if (page === 'home') {
      if (window.location.pathname !== '/') {
        window.history.pushState({ page }, '', window.location.origin + '/');
      }
    } else if (page === 'login') {
      if (window.location.pathname !== '/login') {
        window.history.pushState({ page }, '', window.location.origin + '/login');
      }
    } else if (page === 'reset-password') {
      if (window.location.pathname !== '/reset-password') {
        window.history.pushState({ page }, '', window.location.origin + '/reset-password');
      }
    } else if (page === 'dashboard') {
      if (window.location.pathname !== '/dashboard') {
        window.history.pushState({ page }, '', window.location.origin + '/dashboard');
      }
    } else if (page === 'privacy-policy') {
      if (window.location.pathname !== '/politica-de-privacidade') {
        window.history.pushState({ page }, '', window.location.origin + '/politica-de-privacidade');
      }
    } else if (page === 'terms-of-use') {
      if (window.location.pathname !== '/termos-de-uso') {
        window.history.pushState({ page }, '', window.location.origin + '/termos-de-uso');
      }
    } else if (page === 'cookies-policy') {
      if (window.location.pathname !== '/politica-de-cookies') {
        window.history.pushState({ page }, '', window.location.origin + '/politica-de-cookies');
      }
    } else if (page === 'lgpd-form') {
      if (window.location.pathname !== '/lgpd') {
        window.history.pushState({ page }, '', window.location.origin + '/lgpd');
      }
    } else if (page === 'not-found') {
      if (window.location.pathname !== '/404') {
        window.history.pushState({ page }, '', window.location.origin + '/404');
      }
    }
  }, [page, selectedCampaign]);

  // Escuta navegações do botão voltar/avançar (popstate)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state) {
        if (state.page) {
          setPage(state.page);
        }
        if (state.page === 'campaign-details') {
          if (state.campaignId && campaigns.length > 0) {
            const found = campaigns.find(c => c.id === state.campaignId);
            if (found) setSelectedCampaign(found);
          } else if (state.rifaSlug && campaigns.length > 0) {
            const found = campaigns.find(c => String(c.slug) === state.rifaSlug || String(c.id) === state.rifaSlug);
            if (found) setSelectedCampaign(found);
          }
        } else {
          setSelectedCampaign(null);
        }
      } else {
        const pathname = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        const rifaParam = urlParams.get('rifa');
        const recoveryParam = urlParams.get('recovery');
        const pageParam = urlParams.get('page');
        
        if (recoveryParam || pathname === '/reset-password') {
          setPage('reset-password');
          return;
        }
        if (pathname.startsWith('/rifa/') && campaigns.length > 0) {
          const slug = pathname.substring(6);
          const found = campaigns.find(c => String(c.slug) === slug || String(c.id) === slug);
          if (found) {
            setSelectedCampaign(found);
            setPage('campaign-details');
            return;
          }
        }
        if (rifaParam && campaigns.length > 0) {
          const found = campaigns.find(c => String(c.slug) === rifaParam || String(c.id) === rifaParam);
          if (found) {
            setSelectedCampaign(found);
            setPage('campaign-details');
            return;
          }
        }
        if (pathname === '/politica-de-privacidade' || pageParam === 'politica-de-privacidade') { setPage('privacy-policy'); return; }
        if (pathname === '/termos-de-uso' || pageParam === 'termos-de-uso') { setPage('terms-of-use'); return; }
        if (pathname === '/politica-de-cookies' || pageParam === 'politica-de-cookies') { setPage('cookies-policy'); return; }
        if (pathname === '/lgpd' || pageParam === 'lgpd') { setPage('lgpd-form'); return; }
        if (pathname === '/login') { setPage('login'); return; }
        if (pathname === '/dashboard') { setPage('dashboard'); return; }

        setPage('home');
        setSelectedCampaign(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [campaigns]);

  const fetchSettings = async () => {
    try {
      const { data: settingsRows, error } = await supabase
        .from('settings')
        .select('*');
      if (error) throw error;

      const settingsMap = normalizeSettingsRows(settingsRows || []);
      persistSettingsCache(settingsMap);
      applySiteTheme(settingsMap);
      preloadSiteLogo(settingsMap);
      setSettings(settingsMap);
      setSettingsReady(true);
      return settingsMap;
    } catch (err) {
      console.error('Erro ao buscar configura??es:', err);
      setSettingsReady(Boolean(settings));
      return settings;
    }
  };

  useEffect(() => {
    // 1. Tentar restaurar do cache local imediatamente para "perceived performance"
    // 2. Ouvir mudanças de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth Change:', event);
      setTimeout(async () => {
        if (session?.user) {
          const currentUser = userRef.current;
          // Se já temos o cache e o ID bate, não precisamos buscar perfil de novo 
          // a menos que seja uma mudança de estado crítica (como SIGNED_IN)
          if (currentUser?.id === session.user.id && event !== 'SIGNED_IN') {
             return;
          }

          let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // Se não encontrou o perfil (novo usuário OAuth como Google), tenta criar
          if (!profile) {
            const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário';
            await supabase.from('profiles').upsert({
              id: session.user.id,
              name: googleName,
              role: 'organizer'
            }, { onConflict: 'id' });
            // Busca novamente após criar
            const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            profile = newProfile;
          }

          if (profile) {
            const userData = mapProfileToUser(profile, session.user.email || '');
            setUser(userData);
            localStorage.setItem('rifapro-user', JSON.stringify(userData));
            const currentPage = pageRef.current;
            // Só redireciona pro dashboard se estiver em páginas de entrada (login/home)
            // NUNCA redireciona se já está no dashboard ou em outra seção
            if (currentPage === 'login' || currentPage === 'home') {
              setPage('dashboard');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('rifapro-user');
          setPage('home');
        }
      }, 0);
    });

    const init = async () => {
      try {
        // Buscar tudo em paralelo
        const [sessionResult, _settingsMap, campaignsResult] = await Promise.all([
          supabase.auth.getSession(),
          fetchSettings(),
          supabase.from('campaigns').select('*').in('status', ['active', 'finished']).order('created_at', { ascending: false })
        ]);

        // Processar Campanhas
        let updatedCampaigns: Campaign[] = [];
        if (campaignsResult.data) {
          const camps = campaignsResult.data;
          // Buscar quantidades vendidas em paralelo
          const { data: paidOrdersData } = await supabase
            .from('orders')
            .select('campaign_id, reserved_numbers, ticket_count')
            .eq('status', 'paid')
            .in('campaign_id', camps.map(c => c.id));

          const countsMap = (paidOrdersData || []).reduce((acc: any, o: any) => {
            const count = o.reserved_numbers?.length || o.ticket_count || 0;
            acc[o.campaign_id] = (acc[o.campaign_id] || 0) + count;
            return acc;
          }, {});

          updatedCampaigns = camps.map(c => ({
            ...c,
            sold_count: countsMap[c.id] || 0
          })) as Campaign[];
          setCampaigns(updatedCampaigns);
        }

        // Verificar parâmetro ou caminho de URL na inicialização
        const pathname = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        const rifaParam = urlParams.get('rifa');
        const recoveryParam = urlParams.get('recovery');
        const pageParam = urlParams.get('page');
        let selected: Campaign | undefined;
        
        if (recoveryParam || pathname === '/reset-password') {
          setPage('reset-password');
        } else if (pathname.startsWith('/rifa/')) {
          const slug = pathname.substring(6);
          selected = updatedCampaigns.find(c => String(c.slug) === slug || String(c.id) === slug);
          if (selected) {
            setSelectedCampaign(selected);
            setPage('campaign-details');
          } else {
            setPage('not-found');
          }
        } else if (rifaParam && updatedCampaigns.length > 0) {
          selected = updatedCampaigns.find(c => String(c.slug) === rifaParam || String(c.id) === rifaParam);
          if (selected) {
            setSelectedCampaign(selected);
            setPage('campaign-details');
          } else {
            setPage('not-found');
          }
        } else if (pathname === '/politica-de-privacidade' || pageParam === 'politica-de-privacidade') {
          setPage('privacy-policy');
        } else if (pathname === '/termos-de-uso' || pageParam === 'termos-de-uso') {
          setPage('terms-of-use');
        } else if (pathname === '/politica-de-cookies' || pageParam === 'politica-de-cookies') {
          setPage('cookies-policy');
        } else if (pathname === '/lgpd' || pageParam === 'lgpd') {
          setPage('lgpd-form');
        } else if (pathname === '/login') {
          setPage('login');
        } else if (pathname === '/dashboard') {
          setPage('dashboard');
        } else if (pathname !== '/' && pathname !== '') {
          setPage('not-found');
        }

        // Processar Sessão
        if (sessionResult.error) {
          await clearLocalAuthState();
          setUser(null);
          return;
        }

        const session = sessionResult.data.session;
        if (session?.user) {
          // Buscar perfil apenas se não tivermos ou se houver mudança
          let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // Fallback para novos usuários OAuth (Google): cria o perfil se não existir
          if (!profile) {
            const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário';
            await supabase.from('profiles').upsert({
              id: session.user.id,
              name: googleName,
              role: 'organizer'
            }, { onConflict: 'id' });
            const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            profile = newProfile;
          }

          if (profile) {
            const userData = mapProfileToUser(profile, session.user.email || '');
            setUser(userData);
            localStorage.setItem('rifapro-user', JSON.stringify(userData));
            
            // Só redireciona pro dashboard se estiver em home ou login
            // (não redireciona se já está no dashboard ou em outra página)
            if (!selected && !recoveryParam) {
              const currentPage = pageRef.current;
              if (currentPage === 'home' || currentPage === 'login') {
                setPage('dashboard');
              }
            }
          }
        } else {
          setUser(null);
          await clearLocalAuthState();
        }
      } catch (err) {
        console.error('Erro na inicialização:', err);
      } finally {
      }
    };

    init();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!settings) return;

    applySiteTheme(settings);
    preloadSiteLogo(settings);

    // SEO
    if (settings.seo_title) document.title = settings.seo_title;
    const setMeta = (name: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) { el = document.createElement('meta'); name.startsWith('og:') ? el.setAttribute('property', name) : el.setAttribute('name', name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('description', settings.seo_description || settings.site_description || '');
    setMeta('keywords', settings.seo_keywords || '');
    setMeta('robots', settings.seo_robots || 'index, follow');
    setMeta('og:title', settings.seo_title || settings.site_name || '');
    setMeta('og:description', settings.seo_description || '');
    setMeta('og:image', settings.seo_og_image || '');
    if (settings.seo_canonical_url) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
      link.href = settings.seo_canonical_url;
    }
    // Favicon
    const faviconUrl = settings.site_favicon_url || settings.seo_favicon_url;
    if (faviconUrl) {
      let link = document.querySelector('link[rel*="icon"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
    // Carregar Analytics e Pixel de acordo com os consentimentos de cookies
    try {
      const rawConsent = localStorage.getItem('vairifar-cookie-consent');
      if (rawConsent) {
        const consent = JSON.parse(rawConsent);
        loadAnalyticsAndPixels(consent, settings);
      }
    } catch (e) {
      console.error('Erro ao ler consentimento de cookies:', e);
    }
  }, [settings]);

  useEffect(() => {
    if (cookieConsent && settings) {
      loadAnalyticsAndPixels(cookieConsent, settings);
    }
  }, [cookieConsent, settings]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('rifapro-user', JSON.stringify(u));
    setPage('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('rifapro-user');
    setPage('home');
  };

  const handleSelectCampaign = (c: Campaign) => {
    setSelectedCampaign(c);
    setPage('campaign-details');
  };

  const isDashboard = page === 'dashboard' && user;

  if (!settingsReady || !settings) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-zinc-500">
          <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center">
            <Ticket className="w-6 h-6 text-zinc-300" />
          </div>
          <div className="w-36 h-2 rounded-full bg-zinc-200 overflow-hidden">
            <div className="h-full w-1/2 bg-zinc-300 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-emerald-100 selection:text-emerald-900" style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)' }}>
      {!isDashboard && <Navbar user={user} onLogout={handleLogout} onNavigate={setPage} settings={settings} />}

      <main>
        <AnimatePresence mode="wait">
          {page === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HomePage campaigns={campaigns} onSelectCampaign={handleSelectCampaign} settings={settings} onNavigate={setPage} user={user} />
            </motion.div>
          )}

          {page === 'campaign-details' && selectedCampaign && (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CampaignDetails campaign={selectedCampaign} onBack={() => setPage('home')} globalSettings={settings} />
            </motion.div>
          )}

          {page === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoginPage onLogin={handleLogin} onNavigate={setPage} />
            </motion.div>
          )}
          {page === 'reset-password' && (
            <motion.div key="reset-password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResetPasswordPage onResetComplete={() => setPage('login')} />
            </motion.div>
          )}
          {page === 'dashboard' && user && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {user.role === 'super_admin' ? (
                <SuperAdminDashboard user={user} globalSettings={settings} onRefreshSettings={fetchSettings} onLogout={handleLogout} onNavigateRoot={setPage} />
              ) : (
                <Dashboard user={user} onSelectCampaign={handleSelectCampaign} globalSettings={settings} onRefreshSettings={fetchSettings} onLogout={handleLogout} onNavigateRoot={setPage} />
              )}
            </motion.div>
          )}
          {['privacy-policy', 'terms-of-use', 'cookies-policy'].includes(page) && (
            <motion.div key="lgpd-policy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LGPDPolicyPage page={page} onNavigate={setPage} settings={settings} />
            </motion.div>
          )}
          {page === 'lgpd-form' && (
            <motion.div key="lgpd-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LGPDFormPage onNavigate={setPage} settings={settings} />
            </motion.div>
          )}
          {page === 'not-found' && (
            <motion.div key="not-found" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <NotFoundPage campaigns={campaigns} onSelectCampaign={handleSelectCampaign} onNavigate={setPage} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!isDashboard && (
        <footer className="bg-white border-t border-zinc-100 py-12 mt-24">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              {settings?.site_logo_url ? (
                <img src={settings.site_logo_url} alt="Logo" className="h-10 w-auto object-contain" />
              ) : (
                <>
                  <div className="bg-zinc-900 p-1.5 rounded-lg">
                    <Ticket className="text-white w-4 h-4" />
                  </div>
                  <span className="text-lg font-bold tracking-tight text-zinc-900">{settings.site_name || 'RifaPro SaaS'}</span>
                </>
              )}
            </div>
            <p className="text-zinc-400 text-sm">© 2024 RifaPro. A plataforma líder em sorteios online auditáveis.</p>
            <div className="flex justify-center gap-6 mt-6">
              <a href="#" onClick={(e) => { e.preventDefault(); setPage('terms-of-use'); }} className="text-xs font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest">Termos</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setPage('privacy-policy'); }} className="text-xs font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest">Privacidade</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setPage('cookies-policy'); }} className="text-xs font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest">Cookies</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setPage('lgpd-form'); }} className="text-xs font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest">Canal LGPD</a>
            </div>
          </div>
        </footer>
      )}

      <AnimatePresence>
        {showCookieBanner && (
          <CookieConsentBanner
            onAcceptAll={async () => {
              const consent = { necessary: true, statistics: true, marketing: true, personalization: true };
              localStorage.setItem('vairifar-cookie-consent', JSON.stringify(consent));
              setCookieConsent(consent);
              setShowCookieBanner(false);
              try {
                await fetch('/api/lgpd/consent', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    user_id: user?.id || null,
                    consent_type: 'cookies_all',
                    version: '1.0.0',
                    accepted: true
                  })
                });
              } catch (err) {
                console.error(err);
              }
            }}
            onRejectOptional={async () => {
              const consent = { necessary: true, statistics: false, marketing: false, personalization: false };
              localStorage.setItem('vairifar-cookie-consent', JSON.stringify(consent));
              setCookieConsent(consent);
              setShowCookieBanner(false);
              try {
                await fetch('/api/lgpd/consent', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    user_id: user?.id || null,
                    consent_type: 'cookies_necessary_only',
                    version: '1.0.0',
                    accepted: true
                  })
                });
              } catch (err) {
                console.error(err);
              }
            }}
            onCustomize={() => setShowCookiePreferences(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCookiePreferences && (
          <CookiePreferencesModal
            initialPreferences={cookieConsent}
            onClose={() => setShowCookiePreferences(false)}
            onSave={async (prefs) => {
              localStorage.setItem('vairifar-cookie-consent', JSON.stringify(prefs));
              setCookieConsent(prefs);
              setShowCookiePreferences(false);
              setShowCookieBanner(false);
              try {
                await fetch('/api/lgpd/consent', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    user_id: user?.id || null,
                    consent_type: 'cookies_custom',
                    version: '1.0.0',
                    accepted: true
                  })
                });
              } catch (err) {
                console.error(err);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
