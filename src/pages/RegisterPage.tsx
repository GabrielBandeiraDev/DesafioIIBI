import React from 'react';
import { ProductForm } from '../components/ProductForm';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRegister = async (product: any) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('Token JWT:', token); // debug

      if (!token) {
        alert('Você precisa estar logado para cadastrar um produto.');
        return;
      }

      const response = await fetch('http://localhost:8000/products/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: product.description,
          image_url: product.image_url || '',
          quantity: product.quantity,
          suggested_quantity: product.suggestedStock,
          price: product.priceBRL,
          categories: [product.category]
        })
      });

      if (response.ok) {
        const newProduct = await response.json();
        console.log('Novo produto cadastrado:', newProduct);
        navigate('/');
      } else {
        const errorText = await response.text();
        console.error('Erro ao cadastrar produto:', errorText);
        alert(`Erro ao cadastrar: ${errorText}`);
      }
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      alert('Erro na requisição. Verifique sua conexão.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-8">
      <div className="w-full max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Cadastro de Produto</h1>
        <ProductForm onSubmit={handleRegister} />
      </div>
    </div>
  );
};

export default RegisterPage;
