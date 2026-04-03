'use client';

import { LoginForm } from '@/components/auth/login-form';
import { Heart, Activity, Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 relative overflow-hidden">
      {/* Animated background elements - REMOVA OS ELEMENTOS COM POSIÇÕES ALEATÓRIAS */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Static particles - sem valores aleatórios */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-20 w-1 h-1 bg-white/20 rounded-full" />
        <div className="absolute top-40 right-32 w-1 h-1 bg-white/20 rounded-full" />
        <div className="absolute bottom-20 left-1/4 w-1 h-1 bg-white/20 rounded-full" />
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-white/20 rounded-full" />
        <div className="absolute bottom-1/3 left-10 w-1 h-1 bg-white/20 rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section with animation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {/* <motion.div 
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-2xl mb-5 shadow-2xl relative group"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* <Heart className="w-10 h-10 text-white" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
            <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-yellow-300 animate-pulse" /> 
          </motion.div> */}
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl font-bold bg-gradient-to-r from-blue-200 via-indigo-100 to-purple-200 bg-clip-text text-transparent mb-2"
          >
            ZScan
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-blue-200/80 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Gestão Inteligente de Saúde
          </motion.p>
        </motion.div>

        {/* Login Form Card with animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20 hover:border-white/40 transition-all duration-300"
        >
          <LoginForm />
        </motion.div>

        {/* Security Badge */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            <Shield className="w-3 h-3 text-green-400" />
            <span className="text-xs text-blue-200/70">Plataforma segura e criptografada</span>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}