import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  Info
} from 'lucide-react';
import { dbService } from '../firebase';
import type { Staff } from '../types';
import toast from 'react-hot-toast';

interface LoginModuleProps {
  onLoginSuccess: (schoolName: string, role: string, staffMember: Staff) => void;
}

export const LoginModule: React.FC<LoginModuleProps> = ({ onLoginSuccess }) => {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoList, setShowDemoList] = useState(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const list = await dbService.getAllStaff();
        setStaffList(list);
      } catch (e) {
        toast.error('Error al cargar base de datos de personal.');
      } finally {
        setLoading(false);
      }
    };
    loadStaff();
  }, []);

  const handleAutofill = (selectedStaff: Staff) => {
    if (selectedStaff.email === 'admin@colegiobiobiola.cl') {
      setRut(selectedStaff.email);
      setPassword('04121988');
    } else {
      setRut(selectedStaff.rut);
      setPassword('conexia123');
    }
    toast.success(`Datos cargados para: ${selectedStaff.firstName}`);
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRut(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rut.trim()) {
      toast.error('Por favor, ingrese su RUT o correo.');
      return;
    }
    if (!password.trim()) {
      toast.error('Por favor, ingrese su contraseña.');
      return;
    }

    const inputCleaned = rut.trim().toLowerCase();
    const isEmailInput = inputCleaned.includes('@');
    const cleanInputRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();

    // Look for user
    const matchedStaff = staffList.find(st => {
      if (isEmailInput) {
        return st.email.toLowerCase().trim() === inputCleaned;
      } else {
        const cleanStaffRut = st.rut.replace(/[^0-9kK]/g, '').toUpperCase();
        return cleanStaffRut === cleanInputRut;
      }
    });

    if (!matchedStaff) {
      toast.error('El usuario ingresado no está registrado.');
      return;
    }

    // Secure password check
    const normalizedPassword = password.trim();
    let isPassValid = false;

    // Admin account validation
    const isAdminEmail = matchedStaff.email.toLowerCase().trim() === 'admin@colegiobiobiola.cl' || 
                         matchedStaff.email.toLowerCase().trim() === 'admin@colegiobiobio.cl';

    if (isAdminEmail) {
      isPassValid = normalizedPassword === '04121988';
    } else {
      isPassValid = normalizedPassword === 'conexia123' || 
                    normalizedPassword === matchedStaff.rut.replace(/[^0-9kK]/g, '');
    }

    if (!isPassValid) {
      toast.error('Contraseña incorrecta.');
      return;
    }

    onLoginSuccess(matchedStaff.school, matchedStaff.role, matchedStaff);
    toast.success(`Sesión iniciada: Bienvenido(a), ${matchedStaff.firstName} ${matchedStaff.lastName}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Conexia Logo" className="w-16 h-16 object-contain bg-white rounded-xl p-1 animate-pulse" />
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Iniciando Portal de Seguridad...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      
      {/* Decorative glassmorphic gradient blobs */}
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[130px]"></div>
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[130px]"></div>

      {/* Main Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6 flex flex-col justify-between">
        
        {/* Branding header */}
        <div className="flex flex-col items-center text-center gap-3">
          <img src="/logo.png" alt="Conexia Logo" className="w-32 h-32 object-contain bg-white rounded-3xl p-2 shadow-2xl shadow-indigo-500/15 border border-slate-800" />
          <div>
            <h1 className="font-black text-2xl text-white tracking-tight">CONEXIA</h1>
            <p className="text-xs text-slate-400 mt-1">Convivencia Escolar y Apoyo Psicosocial</p>
          </div>
        </div>

        {/* Security badge and subtitle */}
        <div className="bg-indigo-950/40 border border-indigo-900/60 rounded-2xl p-4 flex gap-3 text-xs text-indigo-200">
          <ShieldCheck className="text-indigo-400 shrink-0 mt-0.5" size={18} />
          <div>
            <span className="font-bold text-slate-200">Acceso Seguro Conexia</span>
            <p className="text-indigo-300/80 mt-1">
              Ingrese su RUT o Correo y contraseña asignada para acceder al portal de su respectivo establecimiento.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* RUT or Email Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User size={12} className="text-indigo-400" />
              <span>RUT o Correo Electrónico</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej: 12.345.678-K o admin@colegiobiobiola.cl"
                value={rut}
                onChange={handleRutChange}
                className="w-full bg-slate-850 text-white rounded-xl border border-slate-700 p-3 pl-3 pr-10 text-sm focus:border-indigo-500 placeholder:text-slate-655 focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock size={12} className="text-indigo-400" />
              <span>Contraseña</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-850 text-white rounded-xl border border-slate-700 p-3 pr-10 text-sm focus:border-indigo-500 placeholder:text-slate-600 focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-550 hover:text-slate-350 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-550 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg transition-all focus:ring-2 focus:ring-indigo-500 cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>Iniciar Sesión</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>

        </form>

        {/* Demo profiles disclosure */}
        <div className="border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setShowDemoList(!showDemoList)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 font-semibold cursor-pointer py-1"
          >
            <span className="flex items-center gap-1.5">
              <Key size={14} className="text-indigo-400" />
              <span>Credenciales de Demostración</span>
            </span>
            {showDemoList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showDemoList && (
            <div className="mt-3 bg-slate-850/60 border border-slate-800 rounded-2xl p-3.5 max-h-56 overflow-y-auto space-y-3.5 divide-y divide-slate-800/50">
              <div className="flex gap-2 items-start text-[10px] text-slate-400 leading-normal pb-2">
                <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Haz clic en <span className="font-bold text-indigo-400">Autocompletar</span> en cualquiera de las cuentas de prueba. La contraseña de prueba general es <code className="bg-slate-900 text-slate-200 px-1 py-0.5 rounded font-mono font-bold">conexia123</code> (excepto la de Administrador, que usa <code className="bg-slate-900 text-slate-200 px-1 py-0.5 rounded font-mono font-bold">04121988</code>).
                </span>
              </div>

              {staffList.map((st) => (
                <div key={st.rut} className="pt-3 first:pt-0 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-200 truncate">{st.firstName} {st.lastName}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {st.role} • <span className="text-indigo-400/80">{st.school}</span>
                    </p>
                    <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                      {st.email === 'admin@colegiobiobiola.cl' ? `Email: ${st.email}` : `RUT: ${st.rut}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutofill(st)}
                    className="shrink-0 bg-indigo-600/10 hover:bg-indigo-650 hover:text-white text-indigo-400 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Autocompletar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-[9px] text-center text-slate-500 leading-normal border-t border-slate-800/40 pt-4">
          SISTEMA DE CONTROL DE CONVIVENCIA CONEXIA v1.1.0<br />
          Plataforma de Apoyo Escolar Integral • Mineduc Chile
        </div>

      </div>

    </div>
  );
};
