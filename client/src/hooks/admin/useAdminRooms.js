import { useState, useEffect } from "react";
import { getAdminRooms } from "../../api/client";

export function useAdminRooms(options) {
  // Tách ra từng giá trị đơn để bỏ vào mảng phụ thuộc (không bỏ cả object options)
  const building = options.building;
  const status = options.status;
  const q = options.q;
  const hot = options.hot;
  const page = options.page;
  const reloadKey = options.reloadKey;

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

      const params = { page: page };
      if (building) {
        params.building = building;
      }
      if (status) {
        params.status = status;
      }
      if (q) {
        params.q = q;
      }
      if (hot) {
        params.hot = true;
      }

      try {
        const result = await getAdminRooms(params);
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
  }, [building, status, q, hot, page, reloadKey]);

  return {
    rooms: rooms,
    total: total,
    totalPages: totalPages,
    loading: loading,
    error: error,
  };
}
