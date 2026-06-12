import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { Shield, User, Key, Check, Sprout } from 'lucide-react';
import { synth } from '../utils/audio';

interface LoginProps {
  onLoginSuccess: (user: UserProfile) => void;
  currentUser: UserProfile | null;
}

export const SIMULATED_USERS: UserProfile[] = [
  {
    email: 'mauricioesilva2018@gmail.com',
    name: 'Maurício Silva',
    role: 'ADMIN',
    avatar: '👨‍🌾'
  },
  {
    email: 'clara.santos@ubsdigital.com.br',
    name: 'Clara Santos',
    role: 'SUPERVISOR',
    avatar: '👩‍🔬'
  },
  {
    email: 'joao.silveira@ubsdigital.com.br',
    name: 'João Silveira',
    role: 'OPERADOR',
    avatar: '⚙️'
  }
];

export default function Login({ onLoginSuccess, currentUser }: LoginProps) {
  const [selectedEmail, setSelectedEmail] = useState<string>(SIMULATED_USERS[0].email);
  const [typedPassword, setTypedPassword] = useState<string>('******');
  const [loginAlert, setLoginAlert] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = SIMULATED_USERS.find(u => u.email === selectedEmail);
    if (foundUser) {
      synth.playSuccess();
      onLoginSuccess(foundUser);
      setLoginAlert(`Acesso concedido: Bem-vindo(a), ${foundUser.name}!`);
      setTimeout(() => setLoginAlert(null), 3000);
    }
  };

  return (
    <div id="login-section" className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-6 shadow-xl max-w-md mx-auto my-6 text-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
          <Shield className="w-6 h-6" id="shield-icon" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight">Portal de Acesso UBS</h2>
          <p className="text-xs text-slate-400">Selecione um colaborador simulado</p>
        </div>
      </div>

      {loginAlert && (
        <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{loginAlert}</span>
        </div>
      )}

      {currentUser ? (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentUser.avatar || '👤'}</span>
            <div>
              <div className="font-semibold text-white">{currentUser.name}</div>
              <div className="text-xs text-slate-400">{currentUser.email}</div>
              <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {currentUser.role}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/60 flex justify-between items-center">
            <span className="text-xs text-slate-400">Sessão operacional ativa</span>
            <button
              onClick={() => {
                const dummyNoUser: any = null;
                onLoginSuccess(dummyNoUser);
                synth.playWarning();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline font-medium focus:outline-none"
              id="btn-logout"
            >
              Desconectar
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Colaborador / Perfil de Acesso</label>
            <div className="space-y-2">
              {SIMULATED_USERS.map((user) => {
                const isSelected = selectedEmail === user.email;
                return (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => setSelectedEmail(user.email)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left border transition-all duration-200 ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl shrink-0">{user.avatar}</span>
                      <div>
                        <div className="text-sm font-semibold">{user.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md ${
                        user.role === 'ADMIN'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : user.role === 'SUPERVISOR'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {user.role}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Senha de Verificação</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                disabled
                value={typedPassword}
                onChange={(e) => setTypedPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800/40 border border-slate-700/60 text-slate-400 rounded-lg text-sm cursor-not-allowed focus:outline-none"
                placeholder="Introduza a senha"
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold uppercase">
                Mock Simulado
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 rounded-xl font-medium shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 transform active:scale-[0.99] focus:outline-none hover:shadow-emerald-500/10 text-sm flex justify-center items-center gap-2"
            id="btn-login-submit"
          >
            <Sprout className="w-4 h-4" />
            Entrar no Sistema UBS Digital
          </button>
        </form>
      )}

      <div className="mt-4 pt-3 border-t border-slate-700/40 text-center">
        <p className="text-[10px] text-slate-400">
          🔒 Sessão isolada Sandbox. Conectado ao LocalStorage do Navegador.
        </p>
      </div>
    </div>
  );
}
