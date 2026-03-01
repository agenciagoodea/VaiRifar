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
  BarChart3
} from 'lucide-react';
import type { Campaign, User, Order } from './types';
import { supabase } from './lib/supabase';

// --- Helpers ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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

const PublishModal = ({ campaign, onClose, onPublished, settings, globalSettings }: { campaign: Campaign, onClose: () => void, onPublished: () => void, settings: any, globalSettings: any }) => {
  const [calculating, setCalculating] = useState(true);
  const [fee, setFee] = useState(0);
  const potentialRevenue = campaign.total_tickets * campaign.ticket_price;

  useEffect(() => {
    try {
      const table = JSON.parse(settings.tax_table || '[]');
      const collection = (campaign.total_tickets || 0) * (campaign.ticket_price || 0);
      if (Array.isArray(table) && table.length > 0) {
        const sorted = [...table].sort((a, b) => a.max - b.max);
        const match = sorted.find((t: any) => collection <= t.max) || sorted[sorted.length - 1];
        setFee(match.fee);
      }
      setCalculating(false);
    } catch (e) {
      console.error(e);
      setCalculating(false);
    }
  }, [campaign, settings]);

  const handleConfirmPix = () => {
    alert(`Para ativar sua campanha, realize o PIX no valor de ${formatCurrency(fee)} para a chave do administrador e envie o comprovante via suporte.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-emerald-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-10 text-center space-y-8"
      >
        <div className="w-24 h-24 bg-emerald-100 rounded-[32px] flex items-center justify-center mx-auto">
          <Rocket className="w-12 h-12 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-zinc-900">Ativar Campanha</h2>
          <p className="text-zinc-500 mt-2 font-medium">Sua campanha está pronta! Para ativá-la, realize o pagamento da taxa administrativa via PIX.</p>
        </div>

        <div className="bg-zinc-50 rounded-3xl p-8 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400 font-bold uppercase tracking-widest">Arrecadação Estre.</span>
            <span className="font-black text-zinc-900">{formatCurrency(potentialRevenue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Taxa de Publicação</span>
            <span className="text-2xl font-black text-emerald-600">{calculating ? '...' : formatCurrency(fee)}</span>
          </div>
        </div>

        <div className="space-y-4 text-left p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Chave PIX Administrador</p>
          <p className="text-lg font-black text-zinc-900 break-all select-all cursor-pointer hover:text-emerald-600 transition-colors" title="Clique para copiar">
            {globalSettings.support_whatsapp || 'vairifar@contato.com'}
          </p>
          <p className="text-[10px] text-zinc-400 font-bold uppercase">Após o pagamento, envie o comprovante no suporte via Whatsapp.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleConfirmPix}
            className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
          >
            Entendido, vou pagar <ArrowRight className="w-6 h-6" />
          </button>
          <button onClick={onClose} className="text-zinc-400 font-bold hover:text-zinc-600 transition-all">Sair</button>
        </div>
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
    supabase
      .from('payment_configs')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPixType(data.pix_key_type || 'cpf');
          setPixKey(data.pix_key || '');
          setPixName(data.pix_holder_name || '');
        }
        setLoaded(true);
      });
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Manual check to handle missing unique constraint on user_id
      const { data: existing } = await supabase
        .from('payment_configs')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const payload = {
        user_id: user.id,
        pix_key_type: pixType,
        pix_key: pixKey,
        pix_holder_name: pixName,
        updated_at: new Date().toISOString()
      };

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('payment_configs')
          .update(payload)
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('payment_configs')
          .insert(payload);
        error = insertError;
      }

      if (error) throw error;
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
    supabase
      .from('payment_configs')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAccessToken(data.mp_access_token || '');
          setPublicKey(data.mp_public_key || '');
        }
        setLoaded(true);
      });
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Manual check to handle missing unique constraint on user_id
      const { data: existing } = await supabase
        .from('payment_configs')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const payload = {
        user_id: user.id,
        mp_access_token: accessToken,
        mp_public_key: publicKey,
        updated_at: new Date().toISOString()
      };

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('payment_configs')
          .update(payload)
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('payment_configs')
          .insert(payload);
        error = insertError;
      }

      if (error) throw error;
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

  return (
    <nav className="bg-white border-b border-zinc-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            {settings?.site_logo_url ? (
              <img src={settings.site_logo_url} alt="Logo" className="h-9 w-auto object-contain" />
            ) : (
              <div className="bg-emerald-600 p-2 rounded-lg"><Ticket className="text-white w-6 h-6" /></div>
            )}
            <span className="text-xl font-bold tracking-tight text-zinc-900">{settings?.site_name || 'RifaPro'}</span>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => onNavigate('home')} className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">Explorar</button>
            {user ? (
              <>
                <button onClick={() => onNavigate('dashboard')} className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors">Meu Painel</button>
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
              <button onClick={() => onNavigate('login')} className="bg-zinc-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-zinc-800 transition-all">
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
              <button onClick={() => { onNavigate('home'); setIsOpen(false); }} className="block w-full text-left text-lg font-medium text-zinc-900">Explorar</button>
              {user ? (
                <>
                  <button onClick={() => { onNavigate('dashboard'); setIsOpen(false); }} className="block w-full text-left text-lg font-medium text-zinc-900">Meu Painel</button>
                  <button onClick={() => { onLogout(); setIsOpen(false); }} className="block w-full text-left text-lg font-medium text-red-600">Sair</button>
                </>
              ) : (
                <button onClick={() => { onNavigate('login'); setIsOpen(false); }} className="block w-full text-center bg-zinc-900 text-white py-3 rounded-xl font-medium">Entrar</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Sidebar = ({ activeTab, onNavigate, onLogout, user, globalSettings }: { activeTab: string, onNavigate: (tab: string) => void, onLogout: () => void, user: User, globalSettings: any }) => {
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

  return (
    <div className="w-72 bg-white border-r border-zinc-100 h-screen sticky top-0 flex flex-col p-6">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="bg-brand-green p-1.5 rounded-lg">
          <Ticket className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-black tracking-tight text-zinc-900">{globalSettings.site_name || 'RIFA'} <span className="text-brand-orange">{globalSettings.site_name ? '' : '321'}</span></span>
      </div>

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

const ManageCampaign = ({ campaign, onBack, onView, onEdit, globalSettings, onRefresh, setShowOrderDetails }: { campaign: Campaign, onBack: () => void, onView: (c: Campaign) => void, onEdit: (c: Campaign) => void, globalSettings: any, onRefresh: () => void, setShowOrderDetails: (order: any) => void }) => {
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

        const sortedRanking = Array.from(rakingMap.values())
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
          />
        )}
      </AnimatePresence>
    </div >
  );
};

// --- Pages ---

const HomePage = ({ campaigns, onSelectCampaign, settings }: { campaigns: Campaign[], onSelectCampaign: (c: Campaign) => void, settings: any }) => {
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const finishedCampaigns = campaigns.filter(c => c.status === 'finished');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const howItWorks = (() => { try { return JSON.parse(settings?.landing_how_it_works || '[]'); } catch { return []; } })();
  const features = (() => { try { return JSON.parse(settings?.landing_features || '[]'); } catch { return []; } })();
  const faqItems = (() => { try { return JSON.parse(settings?.landing_faq || '[]'); } catch { return []; } })();
  const ctaText = settings?.landing_cta_text || 'Aqui você cria a sua campanha e recebe a arrecadação diretamente em sua conta!';
  const iconMap: Record<string, any> = { Shield, Zap, Star, Globe, Users, CheckCircle2, Rocket, Gift, DollarSign, Ticket, Clock, Eye };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
      {finishedCampaigns.length > 0 && (
        <section className="animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-yellow-400 p-3 rounded-2xl shadow-lg shadow-yellow-100"><Gift className="w-6 h-6 text-white" /></div>
            <div>
              <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Ganhadores Recentes</h2>
              <p className="text-zinc-400 font-medium">Confira quem já levou os prêmios pra casa!</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {finishedCampaigns.slice(0, 4).map((c) => {
              const winners = (c as any).winners || [];
              const firstWinner = winners[0];
              return (
                <div key={c.id} className="glass-card p-6 border-yellow-200/50 bg-gradient-to-br from-white to-yellow-50/30 group hover:scale-[1.02] transition-all cursor-pointer" onClick={() => onSelectCampaign(c)}>
                  <div className="relative mb-6">
                    <img src={c.image_url} alt={c.title} className="w-full h-32 object-cover rounded-2xl grayscale group-hover:grayscale-0 transition-all opacity-40" />
                    <div className="absolute inset-0 flex items-center justify-center"><div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-black text-yellow-500 shadow-xl border-4 border-yellow-400">{firstWinner?.number || '---'}</div></div>
                    <div className="absolute -top-2 -right-2 bg-zinc-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Encerrada</div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">{c.title}</p>
                    <h3 className="text-xl font-black text-zinc-900 truncate">{firstWinner?.customer || 'Sorteado'}</h3>
                    <p className="text-[10px] font-bold text-yellow-600 bg-yellow-100 inline-block px-3 py-1 rounded-lg mt-2 uppercase">{firstWinner?.prize_name || 'Prêmio'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <section>
        <header className="mb-12 text-center max-w-2xl mx-auto">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-4">
            Participe dos Melhores <span className="text-emerald-600">Sorteios Online</span>
          </motion.h1>
          <p className="text-zinc-500 text-lg">Campanhas auditadas, seguras e com premiações incríveis. Escolha sua sorte!</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeCampaigns.map((campaign) => (<CampaignCard key={campaign.id} campaign={campaign} onClick={() => onSelectCampaign(campaign)} />))}
          {activeCampaigns.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6"><Ticket className="w-10 h-10 text-zinc-300" /></div>
              <h3 className="text-xl font-black text-zinc-900 mb-2">Nenhuma campanha ativa no momento</h3>
              <p className="text-zinc-400">Volte em breve para novas oportunidades!</p>
            </div>
          )}
        </div>
      </section>
      {howItWorks.length > 0 && (
        <section>
          <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">Como Funciona</h2><p className="text-zinc-500 mt-2">É simples e rápido participar!</p></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} className="text-center p-8 bg-white rounded-3xl border border-zinc-100 shadow-sm hover:shadow-lg transition-all">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black text-2xl mx-auto mb-6">{i + 1}</div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">{step.title}</h3>
                <p className="text-zinc-500 text-sm">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}
      {features.length > 0 && (
        <section>
          <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">Funcionalidades</h2><p className="text-zinc-500 mt-2">Tudo que você precisa em uma plataforma.</p></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {features.map((feat: any, i: number) => {
              const Ic = iconMap[feat.icon] || Star; return (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="text-center p-6 bg-white rounded-3xl border border-zinc-100 shadow-sm hover:shadow-lg hover:scale-105 transition-all">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600"><Ic className="w-6 h-6" /></div>
                  <p className="font-bold text-zinc-900 text-sm">{feat.title}</p>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-[2.5rem] p-12 md:p-16 text-center text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-black mb-4">{ctaText}</h2>
          <p className="text-emerald-100 mb-8 max-w-lg mx-auto">Crie sua campanha agora e comece a arrecadar de forma segura e transparente.</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-white text-emerald-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all shadow-xl">Criar Minha Campanha</button>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[100px] rounded-full -mr-48 -mt-48"></div>
      </section>
      {faqItems.length > 0 && (
        <section>
          <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">Dúvidas Frequentes</h2><p className="text-zinc-500 mt-2">Tire suas dúvidas sobre a plataforma.</p></div>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqItems.map((faq: any, i: number) => (
              <div key={i} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-8 py-5 text-left flex items-center justify-between hover:bg-zinc-50 transition-all">
                  <span className="font-bold text-zinc-900">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <div className="px-8 pb-6 text-zinc-500 text-sm leading-relaxed border-t border-zinc-50 pt-4">{faq.answer}</div>}
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
                    <div className="flex items-start gap-3">
                      <QrCode className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                      <p className="text-sm text-zinc-500 mb-4">
                        Copie o código Pix abaixo e cole em seu app de pagamento para finalizar a compra.
                      </p>
                    </div>

                    <div className="relative flex items-center bg-zinc-50 border border-zinc-200 rounded-xl p-2">
                      <input
                        type="text"
                        readOnly
                        value={pixConfig.pix_key}
                        className="w-full bg-transparent text-sm font-mono text-zinc-500 px-3 outline-none"
                      />
                      <button onClick={handleCopyPix} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all text-white ${copied ? 'bg-emerald-600' : 'bg-brand-orange'}`}>
                        Copiar
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
    regulation: (initialData as any)?.regulation || ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      // Verificar sessão ativa
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Você precisa estar logado para criar uma campanha. Faça login novamente.');

      const payload = {
        title: formData.title,
        description: formData.description || null,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
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
        status: initialData ? initialData.status : 'pending'
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
    { id: 3, label: 'Modo/Resultado' }
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
                      onChange={e => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
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
                    {step === 3 ? 'Finalizar' : 'Continuar'}
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

const SuperAdminDashboard = ({ user, globalSettings, onRefreshSettings, onLogout }: { user: User, globalSettings: any, onRefreshSettings: () => void, onLogout: () => void }) => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'settings'>('stats');
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'payments' | 'taxes' | 'email' | 'mercadopago'>('general');
  const [localSettings, setLocalSettings] = useState<any>(globalSettings);
  const [selectedTemplate, setSelectedTemplate] = useState('order_paid');
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [campaignPayments, setCampaignPayments] = useState<any[]>([]);
  const [paymentsFilter, setPaymentsFilter] = useState('all');

  useEffect(() => {
    setLocalSettings(globalSettings);
  }, [globalSettings]);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      const { count: totalCampaigns } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true });

      const { count: totalOrganizers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'organizer');

      const { data: paidOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'paid');

      const totalRevenue = paidOrders?.reduce((acc, o) => acc + (o.total_amount || 0), 0) || 0;

      setStats({
        total_campaigns: totalCampaigns || 0,
        total_organizers: totalOrganizers || 0,
        total_revenue: totalRevenue,
        tickets_sold: paidOrders?.length || 0
      });

      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'super_admin')
        .order('created_at', { ascending: false });
      if (usersData) setUsers(usersData);
    } catch (err) {
      console.error('Erro ao buscar dados do super admin:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updates = Object.entries(localSettings).map(([key, value]) => ({
        key,
        value: String(value),
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase
        .from('settings')
        .upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      alert('Configurações atualizadas!');
      onRefreshSettings();
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
                  { id: 'mercadopago', label: 'Mercado Pago', icon: CreditCard }
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

            <form onSubmit={handleUpdateSettings} className="space-y-8">
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
                              try {
                                const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`;
                                const { error: upErr } = await supabase.storage.from('logos').upload(fileName, file);
                                if (upErr) throw upErr;
                                const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
                                setLocalSettings({ ...localSettings, site_logo_url: publicUrl });
                              } catch (err: any) { alert('Erro ao carregar logo: ' + err.message); }
                            }} />
                            <button type="button" onClick={() => document.getElementById('logo-upload-admin')?.click()} className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2">
                              <Upload className="w-4 h-4" /> Enviar Logo
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
                        {howItWorks.length < 3 && (
                          <button type="button" onClick={() => updateJson('landing_how_it_works', [...howItWorks, { title: '', text: '' }])} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Adicionar Passo</button>
                        )}
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
                        {howItWorks.length === 0 && <p className="text-zinc-400 text-sm col-span-full text-center py-6">Adicione até 3 passos para exibir na Landing Page.</p>}
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
                      <button type="button" onClick={() => alert('E-mail de teste enviado para ' + user.email)} className="bg-emerald-50 text-emerald-600 px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all">Enviar Teste</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">SMTP Host</label><input type="text" placeholder="smtp.exemplo.com" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.smtp_host || ''} onChange={e => setLocalSettings({ ...localSettings, smtp_host: e.target.value })} /></div>
                      <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">SMTP Port</label><input type="number" placeholder="587" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.smtp_port || ''} onChange={e => setLocalSettings({ ...localSettings, smtp_port: e.target.value })} /></div>
                      <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">SMTP User</label><input type="text" placeholder="contato@exemplo.com" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.smtp_user || ''} onChange={e => setLocalSettings({ ...localSettings, smtp_user: e.target.value })} /></div>
                      <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">SMTP Password</label><input type="password" placeholder="********" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.smtp_pass || ''} onChange={e => setLocalSettings({ ...localSettings, smtp_pass: e.target.value })} /></div>
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
                        const { data } = await supabase.from('email_logs').select('*').order('sent_at', { ascending: false }).limit(50);
                        if (data) setEmailLogs(data);
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
                <div className="space-y-8">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8">
                    <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3"><CreditCard className="w-5 h-5 text-emerald-600" /> Credenciais Mercado Pago</h3>
                    <p className="text-sm text-zinc-500 font-medium">Configure as credenciais do Mercado Pago para receber os pagamentos de ativação de campanhas. O valor cobrado segue a tabela de taxas configurada na aba "Taxas".</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Access Token (Produção)</label><input type="password" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.mp_access_token || ''} onChange={e => setLocalSettings({ ...localSettings, mp_access_token: e.target.value })} placeholder="APP_USR-..." /></div>
                      <div><label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Public Key</label><input type="text" className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-emerald-500" value={localSettings.mp_public_key || ''} onChange={e => setLocalSettings({ ...localSettings, mp_public_key: e.target.value })} placeholder="APP_USR-..." /></div>
                    </div>
                  </div>

                  <div className="bg-zinc-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                      <div>
                        <h3 className="text-2xl font-black mb-2">Fluxo de Ativação de Campanhas</h3>
                        <p className="text-zinc-400 font-medium max-w-xl">Quando um organizador cria uma campanha, ela fica pendente de pagamento. A taxa é calculada automaticamente pela tabela de taxas. Após o pagamento ser confirmado, a campanha é ativada. Se em 72h o pagamento não for realizado, a campanha é excluída automaticamente.</p>
                      </div>
                      <div className="flex gap-4 flex-wrap">
                        <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Status API</p>
                          <p className="font-bold flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${localSettings.mp_access_token ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {localSettings.mp_access_token ? 'Configurado' : 'Não configurado'}
                          </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Cobrança</p>
                          <p className="font-bold">Ativação de Campanha</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Expiração</p>
                          <p className="font-bold">72 horas</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full -mr-48 -mt-48"></div>
                  </div>

                  <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-4">
                    <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3"><HelpCircle className="w-5 h-5 text-emerald-600" /> Como funciona a cobrança</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { n: '1', t: 'Organizador cria campanha', d: 'A campanha é criada com status "Pendente de Pagamento".' },
                        { n: '2', t: 'Pagamento da taxa', d: 'O organizador paga a taxa definida na tabela de taxas via Mercado Pago.' },
                        { n: '3', t: 'Campanha ativada', d: 'Após confirmação, a campanha é publicada. Sem pagamento em 72h, é excluída.' }
                      ].map(s => (
                        <div key={s.n} className="border border-zinc-100 rounded-2xl p-6 space-y-3">
                          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black text-lg">{s.n}</div>
                          <h4 className="font-bold text-zinc-900">{s.t}</h4>
                          <p className="text-sm text-zinc-500">{s.d}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end p-2">
                <button
                  type="submit"
                  className="w-full md:w-auto px-12 py-5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 text-lg"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
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

const Dashboard = ({ user, onSelectCampaign, globalSettings, onRefreshSettings, onLogout }: { user: User, onSelectCampaign: (c: Campaign) => void, globalSettings: any, onRefreshSettings: () => void, onLogout: () => void }) => {
  const [stats, setStats] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
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

  const handleUpdateProfile = async () => {
    try {
      if (password && password !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
      }

      const updates: any = {
        name: profileName,
        phone: profilePhone,
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
      const updates = Object.entries(localSettings).map(([key, value]) => ({
        key,
        value: String(value),
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase
        .from('settings')
        .upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      alert('Configurações atualizadas!');
      onRefreshSettings();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações');
    }
  };

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      // Buscar campanhas do organizador
      const { data: campaignsData, error: campError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (campError) throw campError;

      if (campaignsData && campaignsData.length > 0) {
        // Buscar contagem real de tickets pagos para todas as campanhas
        const campIds = campaignsData.map((c: any) => c.id);
        const { data: paidOrdersData } = await supabase
          .from('orders')
          .select('campaign_id, reserved_numbers, ticket_count')
          .eq('status', 'paid')
          .in('campaign_id', campIds);

        const countsMap = (paidOrdersData || []).reduce((acc: any, o: any) => {
          const count = o.reserved_numbers?.length || o.ticket_count || 0;
          acc[o.campaign_id] = (acc[o.campaign_id] || 0) + count;
          return acc;
        }, {});

        const updatedCampaigns = campaignsData.map(c => ({
          ...c,
          sold_count: countsMap[c.id] || 0
        }));
        setCampaigns(updatedCampaigns as Campaign[]);
      } else {
        setCampaigns([]);
      }

      // Calcular stats
      if (campaignsData && campaignsData.length > 0) {
        const campIds = campaignsData.map((c: any) => c.id);
        const { data: allOrders } = await supabase
          .from('orders')
          .select('*')
          .in('campaign_id', campIds)
          .order('created_at', { ascending: false });

        if (allOrders) setOrders(allOrders);

        const paidOrders = allOrders?.filter(o => o.status === 'paid') || [];
        const pendingOrders = allOrders?.filter(o => o.status === 'pending' || o.status === 'waiting' || o.status === 'pending_approval') || [];
        const unfulfilledOrders = allOrders?.filter(o => o.status === 'cancelled' || o.status === 'expired') || [];

        const totalRevenue = paidOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
        const pendingRevenue = pendingOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
        const unfulfilledRevenue = unfulfilledOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);

        setStats({
          total_campaigns: campaignsData.length,
          total_revenue: totalRevenue,
          tickets_sold: paidOrders.length,
          pending_revenue: pendingRevenue,
          pending_count: pendingOrders.length,
          unfulfilled_revenue: unfulfilledRevenue,
          unfulfilled_count: unfulfilledOrders.length
        });
      } else {
        setStats({
          total_campaigns: 0,
          total_revenue: 0,
          tickets_sold: 0,
          pending_revenue: 0,
          pending_count: 0,
          unfulfilled_revenue: 0,
          unfulfilled_count: 0
        });
      }
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
        // Agrupar pedidos por campanha
        const campaignsMap = new Map();

        orders.forEach(o => {
          if (!o.campaign_id) return;
          if (!campaignsMap.has(o.campaign_id)) {
            const campaignObj = campaigns.find(c => c.id === o.campaign_id);
            campaignsMap.set(o.campaign_id, {
              title: campaignObj?.title || 'Campanha Desconhecida',
              supporters: new Map()
            });
          }

          const camp = campaignsMap.get(o.campaign_id);
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

            {Array.from(campaignsMap.values()).map((campData, campIdx) => {
              let supportersList = Array.from(campData.supporters.values()) as any[];

              // Filtrar cancelados
              supportersList = supportersList.filter(s =>
                s.transactions.some((t: any) => t.status !== 'cancelled' && t.status !== 'expired')
              );

              // Busca
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
                        <div key={idx} onClick={() => setSelectedSupporter(sup)} className="glass-card p-6 space-y-4 cursor-pointer hover:border-brand-orange/30 transition-colors relative group">
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
                <div className="glass-card p-6 flex items-center justify-between hover:bg-zinc-50 cursor-pointer transition-all group">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  { label: 'Número para suporte', icon: '🇧🇷 + 55', type: 'tel' },
                  { label: 'Link do grupo Whatsapp', icon: UserIcon, placeholder: 'Link do canal ou grupo' },
                  { label: 'Link do grupo Telegram', icon: Play, placeholder: 'Link do canal ou grupo' },
                  { label: 'Instagram', icon: ImageIcon, placeholder: '@seuperfil' },
                  { label: 'Tiktok', icon: RotateCcw, placeholder: 'Link do seu perfil' },
                  { label: 'Youtube', icon: Play, placeholder: 'Link do seu perfil' },
                  { label: 'Facebook', icon: Users, placeholder: 'Link do seu perfil' },
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
                        <input type="text" placeholder={item.placeholder} className={`w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl ${typeof item.icon === 'string' ? 'pl-20' : 'pl-12'} pr-4 font-medium outline-none focus:ring-2 focus:ring-brand-orange`} />
                      </div>
                      <div className="w-12 h-6 bg-zinc-100 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full bg-brand-orange text-white py-5 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all">
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
                      className="w-full h-14 rounded-2xl border border-zinc-200 px-6 font-medium outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-zinc-100">
                <button className="w-full h-14 bg-brand-orange text-white rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all">Continuar</button>
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
                      onClick={() => setLocalSettings({ ...localSettings, site_theme: localSettings.site_theme === 'dark' ? 'light' : 'dark' })}
                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${localSettings.site_theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${localSettings.site_theme === 'dark' ? 'right-1' : 'left-1'}`} />
                    </div>
                    <span className="text-sm font-bold text-zinc-400 capitalize">{localSettings.site_theme || 'Light'}</span>
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
                      value={localSettings.primary_color || '#ff6b00'}
                      onChange={(e) => setLocalSettings({ ...localSettings, primary_color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                    />
                    <span className="text-sm font-mono text-zinc-400 mt-1 uppercase">{localSettings.primary_color || '#ff6b00'}</span>
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
                      <span className="text-2xl font-black text-emerald-500">{localSettings.site_name || 'RIFA'}</span>
                      <div className="bg-brand-orange text-white px-2 py-1 rounded-lg font-black text-xl">{localSettings.site_name ? '' : '321'}</div>
                    </div>

                    <div className="w-32 h-20 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-300 hover:border-brand-orange hover:text-brand-orange transition-all cursor-pointer">
                      <Upload className="w-6 h-6" />
                      <span className="text-[10px] font-bold">Adicionar</span>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full bg-brand-orange text-white py-5 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all">
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
          }
        }}
        onLogout={onLogout}
        user={user}
        globalSettings={globalSettings}
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

const LoginPage = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, role: 'organizer' } }
        });
        if (error) throw error;
        if (data.user) {
          // Aguardar um instante para o trigger criar o profile
          await new Promise(r => setTimeout(r, 800));
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          onLogin({
            id: data.user.id,
            name: profile?.name || name,
            email: data.user.email || email,
            role: profile?.role || 'organizer'
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          onLogin({
            id: data.user.id,
            name: profile?.name || data.user.email?.split('@')[0] || 'Usuário',
            email: data.user.email || email,
            role: profile?.role || 'organizer'
          });
        }
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao autenticar. Verifique seus dados.');
    } finally {
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
            {isRegister ? 'Criar sua conta' : 'Bem-vindo de volta'}
          </h1>
          <p className="text-zinc-500 text-sm">
            {isRegister ? 'Cadastre-se para começar a criar rifas.' : 'Acesse sua conta para gerenciar suas rifas.'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {isRegister && (
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
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full h-12 rounded-xl border border-zinc-200 px-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isRegister ? 'Criar minha conta' : 'Entrar no Painel'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400 mt-6">
          {isRegister ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
          <span
            className="text-emerald-600 font-bold cursor-pointer hover:underline"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Entrar aqui' : 'Crie sua primeira rifa agora.'}
          </span>
        </p>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [settings, setSettings] = useState<any>({});

  const fetchSettings = async () => {
    try {
      const { data: settingsRows } = await supabase
        .from('settings')
        .select('*');
      if (settingsRows) {
        const settingsMap = settingsRows.reduce((acc: any, s: any) => {
          acc[s.key] = s.value;
          return acc;
        }, {});
        setSettings(settingsMap);
      }
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
    }
  };

  useEffect(() => {
    // Restaurar sessão ativa do Supabase
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUser({
            id: session.user.id,
            name: profile.name,
            email: session.user.email || '',
            role: profile.role
          });
          setPage('dashboard');
        }
      }
    });

    // Carregar campanhas públicas (ativas e encerradas para mostrar ganhadores)
    supabase
      .from('campaigns')
      .select('*')
      .in('status', ['active', 'finished'])
      .order('created_at', { ascending: false })
      .then(async ({ data }) => {
        if (data && data.length > 0) {
          const { data: paidOrdersData } = await supabase
            .from('orders')
            .select('campaign_id, reserved_numbers, ticket_count')
            .eq('status', 'paid')
            .in('campaign_id', data.map(c => c.id));

          const countsMap = (paidOrdersData || []).reduce((acc: any, o: any) => {
            const count = o.reserved_numbers?.length || o.ticket_count || 0;
            acc[o.campaign_id] = (acc[o.campaign_id] || 0) + count;
            return acc;
          }, {});

          const updatedCampaigns = data.map(c => ({
            ...c,
            sold_count: countsMap[c.id] || 0
          }));
          setCampaigns(updatedCampaigns as Campaign[]);
        } else if (data) {
          setCampaigns(data as Campaign[]);
        }
      });

    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings.primary_color) {
      document.documentElement.style.setProperty('--brand-orange', settings.primary_color);
      document.documentElement.style.setProperty('--color-primary', settings.primary_color);
    }
    if (settings.secondary_color) {
      document.documentElement.style.setProperty('--color-secondary', settings.secondary_color);
    }
    if (settings.button_color) {
      document.documentElement.style.setProperty('--color-button', settings.button_color);
    }
    if (settings.site_theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
    if (settings.google_analytics_id && !(window as any).__gaLoaded) {
      const script = document.createElement('script'); script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`; script.async = true; document.head.appendChild(script);
      const script2 = document.createElement('script'); script2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.google_analytics_id}');`; document.head.appendChild(script2);
      (window as any).__gaLoaded = true;
    }
  }, [settings]);

  const handleLogin = (u: User) => {
    setUser(u);
    setPage('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage('home');
  };

  const handleSelectCampaign = (c: Campaign) => {
    setSelectedCampaign(c);
    setPage('campaign-details');
  };

  const isDashboard = page === 'dashboard' && user;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {!isDashboard && <Navbar user={user} onLogout={handleLogout} onNavigate={setPage} settings={settings} />}

      <main>
        <AnimatePresence mode="wait">
          {page === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HomePage campaigns={campaigns} onSelectCampaign={handleSelectCampaign} settings={settings} />
            </motion.div>
          )}

          {page === 'campaign-details' && selectedCampaign && (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CampaignDetails campaign={selectedCampaign} onBack={() => setPage('home')} globalSettings={settings} />
            </motion.div>
          )}

          {page === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoginPage onLogin={handleLogin} />
            </motion.div>
          )}
          {page === 'dashboard' && user && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {user.role === 'super_admin' ? (
                <SuperAdminDashboard user={user} globalSettings={settings} onRefreshSettings={fetchSettings} onLogout={handleLogout} />
              ) : (
                <Dashboard user={user} onSelectCampaign={handleSelectCampaign} globalSettings={settings} onRefreshSettings={fetchSettings} onLogout={handleLogout} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!isDashboard && (
        <footer className="bg-white border-t border-zinc-100 py-12 mt-24">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="bg-zinc-900 p-1.5 rounded-lg">
                <Ticket className="text-white w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-zinc-900">{settings.site_name || 'RifaPro SaaS'}</span>
            </div>
            <p className="text-zinc-400 text-sm">© 2024 RifaPro. A plataforma líder em sorteios online auditáveis.</p>
            <div className="flex justify-center gap-6 mt-6">
              <a href="#" className="text-xs font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest">Termos</a>
              <a href="#" className="text-xs font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest">Privacidade</a>
              <a href="#" className="text-xs font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest">Ajuda</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
