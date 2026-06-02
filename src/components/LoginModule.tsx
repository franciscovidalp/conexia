import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { dbService } from '../firebase';
import type { Staff } from '../types';
import toast from 'react-hot-toast';

interface LoginModuleProps {
  onLoginSuccess: (schoolName: string, role: string, staffMember: Staff) => void;
  onClose?: () => void;
}

export const LoginModule: React.FC<LoginModuleProps> = ({ onLoginSuccess, onClose }) => {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRut(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rut.trim()) {
      toast.error('Por favor, ingrese su RUT o correo.');
      return;
    }
    if (!password.trim()) {
      toast.error('Por favor, ingrese su contraseña.');
      return;
    }

    setSubmitting(true);
    try {
      const matchedStaff = await dbService.signIn(rut, password);
      onLoginSuccess(matchedStaff.school, matchedStaff.role, matchedStaff);
      toast.success(`Sesión iniciada: Bienvenido(a), ${matchedStaff.firstName} ${matchedStaff.lastName}`);
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      
      {/* Decorative glassmorphic gradient blobs */}
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[130px]"></div>
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[130px]"></div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all cursor-pointer backdrop-blur-md"
        >
          <ArrowLeft size={14} />
          <span>Volver al inicio</span>
        </button>
      )}

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

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-550 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg transition-all focus:ring-2 focus:ring-indigo-500 cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{submitting ? 'Iniciando Sesión...' : 'Iniciar Sesión'}</span>
            {!submitting && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
          </button>

        </form>

        {/* Footer info */}
        <div className="text-[9px] text-center text-slate-500 leading-normal border-t border-slate-800/40 pt-4">
          SISTEMA DE CONTROL DE CONVIVENCIA CONEXIA v1.1.0<br />
          Plataforma de Apoyo Escolar Integral • Mineduc Chile
        </div>

      </div>

    </div>
  );
};
