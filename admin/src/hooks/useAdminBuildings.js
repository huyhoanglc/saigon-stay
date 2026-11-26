import { useState, useEffect } from "react";
import { getAdminBuildings } from "../api/client";

// reloadKey: tăng số này lên (ví dụ sau khi xoá) để tải lại danh sách
export function useAdminBuildings(reloadKey) {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function fetchBuildings() {
      setLoading(true);
      setError(null);

      try {
        const items = await getAdminBuildings();
        if (!ignore) {
          setBuildings(items);
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

    fetchBuildings();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  return { buildings: buildings, loading: loading, error: error };
}
