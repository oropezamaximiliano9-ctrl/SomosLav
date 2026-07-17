import { useState, useContext, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Lock, UserCircle, Briefcase } from "lucide-react";
import { RoleContext } from "../App";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'associate' | 'admin'>('associate');
  const { setRole } = useContext(RoleContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParams = searchParams.get("redirect");

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (password === 'somos123') {
      setRole(selectedRole);
      if (redirectParams) {
        navigate(redirectParams);
      } else if (selectedRole === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/scanner');
      }
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col mt-8 animate-in fade-in">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-full mb-6 border border-blue-100">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-medium tracking-widest text-gray-900 uppercase mb-2">Acceso Personal</h1>
        <p className="text-gray-500 text-sm">Escanea, recibe y procesa servicios.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6 flex-1 flex flex-col">
        <div className="space-y-6">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setSelectedRole('associate')}
              className={`flex-1 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                selectedRole === 'associate' 
                  ? 'border-blue-600 bg-blue-50 text-blue-700' 
                  : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <UserCircle className="w-6 h-6" />
              <span className="text-sm font-semibold">Asociado</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`flex-1 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                selectedRole === 'admin' 
                  ? 'border-blue-600 bg-blue-50 text-blue-700' 
                  : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Briefcase className="w-6 h-6" />
              <span className="text-sm font-semibold">Admin</span>
            </button>
          </div>

          <div className="form-group space-y-1.5 focus-within:text-blue-600 transition-colors">
            <label className="text-xs uppercase tracking-widest font-semibold ml-1 opacity-70">Contraseña de acceso</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`w-full text-lg p-4 bg-white border ${error ? 'border-red-300 focus:ring-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-50'} rounded-2xl outline-none focus:ring-4 transition-all`}
              placeholder="••••••••"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs font-medium ml-1 mt-1">Contraseña incorrecta.</p>}
          </div>
        </div>

        <div className="mt-auto pt-8 pb-4">
          <button 
            type="submit" 
            disabled={!password}
            className="w-full bg-black text-white p-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-gray-900 transition-all disabled:opacity-50"
          >
            Ingresar
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
