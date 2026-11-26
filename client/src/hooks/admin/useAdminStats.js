import { useState, useEffect } from "react";
import { getAdminStats } from "../../api/client";

export function useAdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function fetchStats() {
      setLoading(true);
      setError(null);

      try {
        const data = await getAdminStats();
        if (!ignore) {
          setStats(data);
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

    fetchStats();

    return () => {
      ignore = true;
    };
  }, []);

  return { stats: stats, loading: loading, error: error };
}
