import { useState, useEffect } from "react";
import { getAdminUsers } from "../api/client";

export function useAdminUsers(options) {
  const role = options.role;
  const q = options.q;
  const page = options.page;
  const reloadKey = options.reloadKey;

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function fetchUsers() {
      setLoading(true);
      setError(null);

      const params = { page: page };
      if (role) {
        params.role = role;
      }
      if (q) {
        params.q = q;
      }

      try {
        const result = await getAdminUsers(params);
        if (!ignore) {
          setUsers(result.items);
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

    fetchUsers();

    return () => {
      ignore = true;
    };
  }, [role, q, page, reloadKey]);

  return {
    users: users,
    total: total,
    totalPages: totalPages,
    loading: loading,
    error: error,
  };
}
