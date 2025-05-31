import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Github, Twitter } from 'lucide-react';
import InputField from '../ui/InputField';
import Button from '../ui/Button';
import SocialButton from './SocialButton';

interface LoginFormProps {
  onSubmit: (email: string, password: string, remember: boolean) => void;
  isLoading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    let isValid = true;

    if (!email) {
      newErrors.email = 'E-mail é obrigatório';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'E-mail inválido';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          username: email,  
          password: password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Credenciais inválidas');
      }

      const { access_token } = data;

      // Armazenar o token JWT
      if (remember) {
        localStorage.setItem('token', access_token);
      } else {
        sessionStorage.setItem('token', access_token);
      }

      // Chamar a função de sucesso
      onSubmit(email, password, remember);
    } catch (error: any) {
      console.error('Login error:', error);
      setApiError(error.message || 'Erro ao conectar com o servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          required
        />

        <InputField
          label="Senha"
          icon={Lock}
          showPasswordToggle
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          required
        />

        {apiError && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
            {apiError}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
              Lembrar-me
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
              Esqueceu sua senha?
            </a>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading || isSubmitting}
          icon={ArrowRight}
          iconPosition="right"
          className="mt-6 bg-emerald-600 hover:bg-emerald-700"
        >
          Entrar
        </Button>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Ou continue com</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <SocialButton
            provider="github"
            icon={Github}
            label="Github"
            onClick={() => console.log('Github login')}
          />
          <SocialButton
            provider="twitter"
            icon={Twitter}
            label="Twitter"
            onClick={() => console.log('Twitter login')}
          />
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          Não tem uma conta?{' '}
          <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
            Cadastre-se gratuitamente
          </a>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;