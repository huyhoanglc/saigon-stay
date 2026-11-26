import { useState, useEffect } from "react";
import { getRooms } from "../api/client";

export function useRooms(options = {}) {
  const area = options.area;
  const layout = options.layout;
  const minPrice = options.minPrice;
  const maxPrice = options.maxPrice;
  const hot = options.hot;
  const newOpening = options.newOpening;
  const sort = options.sort;
  const page = options.page;
  const limit = options.limit;
  const building = options.building;
  const exclude = options.exclude;

  const [rooms, setRooms] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function fetchRooms() {
      setLoading(true);
      setError(null);

      const params = {};
      if (area) {
        params.area = area;
      }
      if (layout) {
        params.layout = layout;
      }
      if (minPrice) {
        params.minPrice = minPrice;
      }
      if (maxPrice) {
        params.maxPrice = maxPrice;
      }
      if (hot) {
        params.hot = true;
      }
      if (newOpening) {
        params.newOpening = true;
      }
      if (sort) {
        params.sort = sort;
      }
      if (page) {
        params.page = page;
      }
      if (limit) {
        params.limit = limit;
      }
      if (building) {
        params.building = building;
      }
      if (exclude) {
        params.exclude = exclude;
      }

      try {
        const result = await getRooms(params);

        if (!ignore) {
          setRooms(result.items);
          setTotal(result.total);
          setTotalPages(result.totalPages);
        }
      } catch (err) {
        if (!ignore) {
          setError(err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchRooms();

    return () => {
      ignore = true;
    };
  }, [
    area,
    layout,
    minPrice,
    maxPrice,
    hot,
    newOpening,
    sort,
    page,
    limit,
    building,
    exclude,
  ]);

  return {
    rooms: rooms,
    total: total,
    totalPages: totalPages,
    loading: loading,
    error: error,
  };
}
