import React, { useState, useEffect } from 'react';
import './App.css';
import ProductCard from './components/ProductCard';
import { Product, ApiResponse, Category } from './types/Product';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/products`);
      const data: ApiResponse<Product[]> = await response.json();
      
      if (data.success) {
        setProducts(data.data);
      } else {
        setError(data.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Error connecting to the server. Please make sure the backend is running.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data: ApiResponse<Category[]> = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category.name === selectedCategory);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🐾 Pet Supplies Shop</h1>
        <p>Your one-stop shop for all pet needs!</p>
      </header>

      <main className="main-content">
        <div className="filters">
          <label htmlFor="category-filter">Filter by Category:</label>
          <select 
            id="category-filter"
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="loading">
            <p>Loading products...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <p>{error}</p>
            <button onClick={fetchProducts}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <div className="products-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="no-products">No products found in this category.</p>
            )}
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>© 2024 Pet Supplies Shop - Built with React & Express</p>
      </footer>
    </div>
  );
}

export default App;
