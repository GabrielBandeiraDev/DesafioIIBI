import React, { useState } from 'react';
import { ShoppingBag, MinusCircle, PlusCircle } from 'lucide-react';
import { Product } from '../types/Product';

interface ProductCardProps {
  product: Product;
  dollarRate: number;
  onBuy: (productId: number, quantity: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, dollarRate, onBuy }) => {
  const [quantityToBuy, setQuantityToBuy] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  // Função para determinar a cor do status com base nas quantidades
  const getStatusColor = (quantity: number, suggestedStock: number) => {
    if (quantity < suggestedStock) return 'bg-red-500'; // Vermelho se a quantidade em estoque for menor que a sugerida
    if (quantity <= suggestedStock + 5) return 'bg-yellow-500'; // Amarelo se a diferença for <= 5
    return 'bg-green-500'; // Verde caso contrário
  };

  // Função para determinar o texto do status com base nas quantidades
  const getStatusText = (quantity: number, suggestedStock: number) => {
    if (quantity < suggestedStock) return 'Vermelho'; 
    if (quantity <= suggestedStock + 5) return 'Amarelo';
    return 'Verde'; 
  };

  const handleBuy = () => {
    if (quantityToBuy <= 0 || quantityToBuy > product.quantity) return;
    onBuy(product.id, quantityToBuy);
  };

  const incrementQuantity = () => {
    if (quantityToBuy < product.quantity) {
      setQuantityToBuy(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantityToBuy > 1) {
      setQuantityToBuy(prev => prev - 1);
    }
  };

  return (
    <div 
      className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-100/50 transform hover:-translate-y-1 hover:border-teal-600"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden h-56">
        <img 
          src={product.image_url} 
          alt={product.description} 
          className={`w-full h-full object-cover transition-transform duration-700 ease-in-out ${isHovered ? 'scale-110' : 'scale-100'}`} 
        />
        <div className={`absolute top-3 right-3 ${getStatusColor(product.quantity, product.suggested_quantity)} bg-opacity-80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white shadow-md`}>
          {product.quantity} em estoque
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 h-14">{product.description}</h3>
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs text-gray-500 block">Preço</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">R${product.price.toFixed(2)}</span>
              <span className="text-sm text-gray-500">${(product.price / dollarRate).toFixed(2)}</span>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-xs text-gray-500 block">Status</span>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(product.quantity, product.suggested_quantity)}`}>
              {getStatusText(product.quantity, product.suggested_quantity)}
            </span>
          </div>
        </div>
        
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between border border-gray-200 rounded-lg p-1">
            <button 
              onClick={decrementQuantity}
              disabled={quantityToBuy <= 1}
              className="p-1 text-gray-400 hover:text-teal-600 disabled:text-gray-200 transition-colors duration-300"
            >
              <MinusCircle size={20} />
            </button>
            
            <span className="font-semibold text-lg text-gray-900">{quantityToBuy}</span>
            
            <button 
              onClick={incrementQuantity}
              disabled={quantityToBuy >= product.quantity}
              className="p-1 text-gray-400 hover:text-teal-600 disabled:text-gray-200 transition-colors duration-300"
            >
              <PlusCircle size={20} />
            </button>
          </div>
          
          <button
            onClick={handleBuy}
            disabled={product.quantity <= 0}
            className={`w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300 ease-in-out
              ${product.quantity <= 0 
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-teal-500 to-green-500 hover:brightness-110 hover:scale-[1.02] active:scale-95'}`}
          >
            <ShoppingBag size={18} />
            <span>Comprar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
