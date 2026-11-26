import { createContext, useContext, useEffect, useState } from "react";

const FavoritesContext = createContext(null);
const FAVORITES_KEY = "favorites";

function loadFavorites() {
  const saved = localStorage.getItem(FAVORITES_KEY);

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(loadFavorites);

  // Mỗi lần danh sách đổi thì lưu lại
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  function isFavorite(roomId) {
    for (const item of favorites) {
      if (item._id === roomId) {
        return true;
      }
    }
    return false;
  }

  function removeFavorite(roomId) {
    const newList = [];
    for (const item of favorites) {
      if (item._id !== roomId) {
        newList.push(item);
      }
    }
    setFavorites(newList);
  }

  function toggleFavorite(room) {
    if (isFavorite(room._id)) {
      removeFavorite(room._id);
    } else {
      // Phòng mới thêm nằm đầu danh sách
      const newList = [room];
      for (const item of favorites) {
        newList.push(item);
      }
      setFavorites(newList);
    }
  }

  function clearFavorites() {
    setFavorites([]);
  }

  const value = {
    favorites: favorites,
    count: favorites.length,
    isFavorite: isFavorite,
    toggleFavorite: toggleFavorite,
    removeFavorite: removeFavorite,
    clearFavorites: clearFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
