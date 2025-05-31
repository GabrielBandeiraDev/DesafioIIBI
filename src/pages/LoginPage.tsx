import React, { useState } from 'react';
import { BoxesIcon } from 'lucide-react';
import LoginForm from '../components/login/LoginForm';
import { useNavigate } from 'react-router-dom'; 

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); 

  const handleLogin = (email: string, password: string, remember: boolean) => {
    setIsLoading(true);

    // ✅ Após login bem-sucedido, redireciona para a página de produtos
    setTimeout(() => {
      setIsLoading(false);
      navigate('/produtos'); 
    }, 150); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="relative w-full max-w-4xl flex overflow-hidden rounded-xl bg-white shadow-xl">
        {/*side */}
        <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-600 p-12 text-white">
          <div className="flex items-center space-x-2">
            <BoxesIcon className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Controle de Vendas</h1>
          </div>
          <div className="mt-20">
            <h2 className="text-4xl font-bold mb-6">Sistema de Controle de Estoque</h2>
            <p className="text-emerald-100 mb-8">
              Desafio IATECAM - Vaga Desenvolvedor PL 
              Avaliador :  Marcelo.souza@ibbi.org.br 
              Participante : Gabriel Bandeira Macedo - Software Eng. PL (SVI)
            </p>
          </div>
        </div>

        {/* login form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12">
          <div className="w-full max-w-md mx-auto">
            <div className="lg:hidden flex items-center space-x-2 mb-8">
              <BoxesIcon className="h-7 w-7 text-emerald-600" />
              <h1 className="text-xl font-bold text-gray-900">StockMaster</h1>
            </div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
              <p className="text-gray-600 mt-2">
                Entre para gerenciar seu estoque
              </p>
            </div>
            <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
