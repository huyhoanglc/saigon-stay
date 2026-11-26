import { useState, useEffect } from "react";
import { getAdminInquiries } from "../../api/client";

export function useAdminInquiries(options) {
  const status = options.status;
  const page = options.page;
  const reloadKey = options.reloadKey;

  const [inquiries, setInquiries] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function fetchInquiries() {
      setLoading(true);
      setError(null);

      const params = { page: page };
      if (status) {
        params.status = status;
      }

      try {
        const result = await getAdminInquiries(params);
        if (!ignore) {
          setInquiries(result.items);
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

    fetchInquiries();

    return () => {
      ignore = true;
    };
  }, [status, page, reloadKey]);

  return {
    inquiries: inquiries,
    total: total,
    totalPages: totalPages,
    loading: loading,
    error: error,
  };
}
