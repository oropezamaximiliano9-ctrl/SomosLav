import { useState, useContext, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Lock, UserCircle, Briefcase, Mail, Loader2 } from "lucide-react";
import { RoleContext } from "../App";
import { dismissKeyboard } from "../utils/keyboard";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'associate' | 'admin'>('associate');
  const { setRole } = useContext(RoleContext);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParams = searchParams.get("redirect");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    dismissKeyboard();
    setIsLoading(true);
    setError(false);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // Verify claims or Firestore role
      const tokenResult = await user.getIdTokenResult();
      const isAdminClaim = !!tokenResult.claims.admin;
      
      let isFirestoreAdmin = false;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          isFirestoreAdmin = true;
        }
      } catch (e) {
        console.warn("Could not fetch user role from Firestore", e);
      }
      
      const hasAdminPrivileges = isAdminClaim || isFirestoreAdmin;
      
      if (selectedRole === 'admin' && !hasAdminPrivileges) {
        throw new Error("No tienes permisos de administrador.");
      }

      setRole(selectedRole);
      
      if (redirectParams) {
        navigate(redirectParams);
      } else if (selectedRole === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/scanner');
      }
    } catch (err: any) {
      console.error("Login error", err);
      setError(true);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMessage("Correo o contraseña incorrectos.");
      } else {
        setErrorMessage(err.message || "Error al iniciar sesión.");
      }
      setTimeout(() => setError(false), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col mt-8 animate-in fade-in">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-full mb-6 border border-blue-100">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-medium tracking-widest text-gray-900 uppercase mb-2">Acceso Personal</h1>
        <p className="text-gray-500 text-sm">Inicia sesión con tu cuenta de Firebase.</p>
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

          <div className="space-y-4">
            <div className="form-group space-y-1.5 focus-within:text-blue-600 transition-colors">
              <label className="text-xs uppercase tracking-widest font-semibold ml-1 opacity-70">Correo electrónico</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`w-full text-lg p-4 pl-12 bg-white border ${error ? 'border-red-300 focus:ring-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-50'} rounded-2xl outline-none focus:ring-4 transition-all`}
                  placeholder="admin@ejemplo.com"
                />
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="form-group space-y-1.5 focus-within:text-blue-600 transition-colors">
              <label className="text-xs uppercase tracking-widest font-semibold ml-1 opacity-70">Contraseña de acceso</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full text-lg p-4 pl-12 bg-white border ${error ? 'border-red-300 focus:ring-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-50'} rounded-2xl outline-none focus:ring-4 transition-all`}
                  placeholder="••••••••"
                />
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              {error && <p className="text-red-500 text-xs font-medium ml-1 mt-1">{errorMessage}</p>}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-8 pb-4">
          <button 
            type="submit" 
            disabled={!password || !email || isLoading}
            className="w-full bg-black text-white p-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-gray-900 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Ingresar
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
