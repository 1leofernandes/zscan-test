'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/use-auth';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LoginForm() {
  const router = useRouter();
  const { loginAsync, isLoggingIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const result = await loginAsync({ email, password });
      router.push('/schedule');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao conectar ao servidor');
    }
  };

  return (
    
    <Card className="w-[420px] bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Bem-vindo
        </CardTitle>
        <p className="text-center text-gray-500 text-sm">
          Acesse sua conta para continuar
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              E-mail
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-11 border-gray-200 focus:ring-2 focus:ring-blue-500/20 transition-all"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              Senha
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 pr-10 border-gray-200 focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button 
            type="submit" 
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Entrar
              </span>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <button className="text-gray-500 hover:text-blue-600 transition-colors">
              Esqueceu a senha?
            </button>
            <button className="text-gray-500 hover:text-blue-600 transition-colors">
              Criar conta
            </button>
          </div>
        </div>
        {/* <div className="bg-green-500 text-white p-4 rounded-lg mb-4">
          Se esta caixa estiver verde, o Tailwind está funcionando!
        </div> */}
      </CardContent>
    </Card>
  );
}