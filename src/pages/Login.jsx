import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../firebase/firebaseMethods'; 
import { Lock, Mail, ShieldCheck, ChevronRight, Eye, EyeOff } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Password hide/show state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const themeDarkBlue = "bg-[#001D3D]";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginUser(email, password);

    if (result.success) {
      navigate('/dashboard'); 
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-blue-200/40 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white relative z-10">
        
        {/* Header - Simple & Professional */}
        <div className={`${themeDarkBlue} p-10 text-center`}>
          <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-4 backdrop-blur-md border border-white/20">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">
            Sheikh & Khan Traders
          </h1>
          <p className="text-blue-200/70 mt-1 text-sm font-medium italic">Inventory Management System</p>
        </div>

        {/* Form Section */}
        <div className="p-8 md:p-10">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800">Admin Login</h2>
            <p className="text-slate-500 text-sm mt-1">Please enter your credentials to continue.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-600 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#001D3D] transition-colors" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#001D3D] focus:bg-white transition-all outline-none font-medium text-slate-900"
                  placeholder="Enter an Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-600 ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#001D3D] transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#001D3D] focus:bg-white transition-all outline-none font-medium text-slate-900"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {/* Show/Hide Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                loading 
                ? 'bg-slate-400 cursor-not-allowed' 
                : `${themeDarkBlue} hover:bg-blue-900 shadow-blue-900/20`
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Login to Dashboard</span>
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 py-5 border-t border-slate-100 text-center px-10">
          <p className="text-xs text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} Sheikh & Khan Traders. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;