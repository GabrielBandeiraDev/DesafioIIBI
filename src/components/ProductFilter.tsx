import React from 'react';

interface ProductFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
}

const ProductFilter: React.FC<ProductFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  searchText,
  onSearchChange,
}) => {
  const handleCategoryClick = (category: string) => {
    onCategoryChange(category === selectedCategory ? '' : category);
  };

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col w-full sm:max-w-md">
        <label htmlFor="search" className="text-gray-700 font-semibold mb-2">
          Buscar produto
        </label>
        <input
          id="search"
          type="text"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Digite uma palavra-chave..."
          className="border border-gray-300 px-4 py-3 rounded-md text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
        />
      </div>

      <div className="flex flex-col w-full">
        <span className="text-gray-700 font-semibold mb-2">Categorias</span>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition duration-200 shadow-sm
                ${selectedCategory === category
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-teal-100'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductFilter;
