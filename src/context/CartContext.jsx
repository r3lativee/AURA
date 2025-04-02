import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { cartAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Fetch cart data when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart({ items: [], total: 0 });
    }
    setLoading(false);
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      const { data } = await cartAPI.get();
      setCart(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart({ items: [], total: 0 });
    }
  };

  const addToCart = async (productId, quantity = 1, size = null, color = null) => {
    try {
      if (!isAuthenticated) {
        toast.error('Please login to add items to cart');
        return;
      }

      const { data } = await cartAPI.addToCart(productId, quantity, size, color);
      setCart(data);
      toast.success('Item added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
      throw error;
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      if (!isAuthenticated) {
        toast.error('Please login to update cart');
        return;
      }

      const { data } = await cartAPI.updateCartItem(itemId, quantity);
      setCart(data);
      toast.success('Cart updated');
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast.error('Failed to update cart');
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      if (!isAuthenticated) {
        toast.error('Please login to remove items from cart');
        return;
      }

      const { data } = await cartAPI.removeFromCart(itemId);
      setCart(data);
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      if (!isAuthenticated) {
        toast.error('Please login to clear cart');
        return;
      }

      const { data } = await cartAPI.clear();
      setCart(data);
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
      throw error;
    }
  };

  // Calculate total price and item count
  const itemCount = cart.items?.length || 0;
  const total = cart.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;

  const value = {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    total,
    itemCount
  };

  if (loading) {
    return <div>Loading cart...</div>;
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 