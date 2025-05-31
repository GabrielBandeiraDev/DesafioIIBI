import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductFilter from '../components/ProductFilter';

type Product = {
  id: number;
  description: string;
  image_url: string;
  quantity: number;
  suggested_quantity: number;
  price_brl: number;
  price_usd: number;
  status: 'red' | 'yellow' | 'green';
  categories: string[];
  owner: string;
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [dollarRate, setDollarRate] = useState(5.0);
  const [loading, setLoading] = useState(true);

  // Obter taxa de dólar
  const getDollarRate = async () => {
    try {
      const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
      const data = await response.json();
      return parseFloat(data.USDBRL.bid);
    } catch (error) {
      console.error('Error fetching dollar rate:', error);
      return 5.0; // Default value
    }
  };

  // Obter dados da API
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch('http://localhost:8000/products/', { headers }),
        fetch('http://localhost:8000/categories/', { headers })
      ]);

      if (productsResponse.status === 401 || categoriesResponse.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();

      setProducts(productsData);
      setCategories(categoriesData);

      const rate = await getDollarRate();
      setDollarRate(rate);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  // Lidar com a compra do produto
  const handleBuy = async (productId: number, quantity: number) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/products/purchase/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId, quantity })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Purchase successful:', result);
        fetchData(); 
      } else {
        console.error('Error purchasing product');
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error purchasing product:', error);
    }
  };

//  Filtrar produtos com base na pesquisa e categoria
  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || 
      (product.categories && product.categories.includes(selectedCategory));
    const matchesSearch = product.description.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch && product.quantity > 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl font-semibold text-gray-700">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-8">
      <div className="w-full max-w-6xl mx-auto p-8 bg-white rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Produtos Disponíveis</h1>
        
        <ProductFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchText={searchText}
          onSearchChange={setSearchText}
          dollarRate={dollarRate}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              dollarRate={dollarRate}
              onBuy={handleBuy}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhum produto encontrado com os filtros atuais.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;