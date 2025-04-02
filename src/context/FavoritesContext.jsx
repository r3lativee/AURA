import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { favoritesAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Load favorites when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
    setLoading(false);
  }, [isAuthenticated]);

  const fetchFavorites = async () => {
    try {
      const { data } = await favoritesAPI.getAll();
      setFavorites(data.products || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    }
  };

  const addToFavorites = async (productId) => {
    try {
      if (!isAuthenticated) {
        toast.error('Please login to add to favorites');
        return;
      }

      await favoritesAPI.add(productId);
      await fetchFavorites(); // Refresh the list
      toast.success('Added to favorites');
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast.error('Failed to add to favorites');
    }
  };

  const removeFromFavorites = async (productId) => {
    try {
      if (!isAuthenticated) {
        toast.error('Please login to remove from favorites');
        return;
      }

      await favoritesAPI.remove(productId);
      await fetchFavorites(); // Refresh the list
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  const isFavorite = (productId) => {
    return favorites.some(fav => fav._id === productId || fav.product?._id === productId);
  };

  const value = {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    favoritesCount: favorites.length
  };

  if (loading) {
    return <div>Loading favorites...</div>;
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}; 