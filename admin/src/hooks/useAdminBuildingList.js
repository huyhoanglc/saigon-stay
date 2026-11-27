import { useState, useEffect } from "react";
import { getAdminBuildingPage } from "../api/client";

// Danh sách tòa nhà có lọc + phân trang (trang Tòa nhà).
// Ô chọn tòa nhà ở trang Phòng vẫn dùng useAdminBuildings (lấy tất cả).
export function useAdminBuildingList(options) {
  // Tách ra từng giá trị đơn để bỏ vào mảng phụ thuộc (không bỏ cả object options)
  const q = options.q;
  const area = options.area;
  const roadType = options.roadType;
  const needsInfo = options.needsInfo;
  const page = options.page;
  const reloadKey = options.reloadKey;

  const [buildings, setBuildings] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function fetchBuildings() {
      setLoading(true);
      setError(null);

      const params = { page: page };
      if (q) {
        params.q = q;
      }
      if (area) {
        params.area = area;
      }
      if (roadType) {
        params.roadType = roadType;
      }
      if (needsInfo) {
        params.needsInfo = true;
      }

      try {
        const result = await getAdminBuildingPage(params);
        if (!ignore) {
          setBuildings(result.items);
          setTotal(result.total);
          setTotalPages(result.totalPages);
          setAreas(result.areas);
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
  }, [q, area, roadType, needsInfo, page, reloadKey]);

  return {
    buildings: buildings,
    total: total,
    totalPages: totalPages,
    areas: areas,
    loading: loading,
    error: error,
  };
}
