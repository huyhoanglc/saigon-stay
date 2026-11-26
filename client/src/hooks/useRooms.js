import { useState, useEffect } from "react";
import { getRooms } from "../api/client";

export function useRooms({
  area,
  layout,
  minPrice,
  maxPrice,
  hot,
  newOpening,
  sort,
  page,
  limit,
} = {}) {
  const [data, setData] = useState({ items: [], total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function fetchRooms() {
      setLoading(true);
      setError(null);
      try {
        const result = await getRooms({
          area: area || undefined,
          layout: layout || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          hot: hot || undefined,
          newOpening: newOpening || undefined,
          sort,
          page,
          limit,
        });
        if (!ignore) setData(result);
      } catch (err) {
        if (!ignore) setError(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchRooms();

    return () => {
      ignore = true;
    };
  }, [area, layout, minPrice, maxPrice, hot, newOpening, sort, page, limit]);

  return {
    rooms: data.items,
    total: data.total,
    totalPages: data.totalPages,
    loading,
    error,
  };
}
