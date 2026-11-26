import { useState, useEffect } from "react";
import { getAdminBuilding, getAdminRoom } from "../../api/client";

// Lấy 1 tòa nhà hoặc 1 phòng để đổ vào form sửa.
// type: "building" | "room". id rỗng (form thêm mới) thì không gọi API.
export function useAdminItem(type, id) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    let ignore = false;

    async function fetchItem() {
      setLoading(true);
      setError(null);

      try {
        let data;
        if (type === "building") {
          data = await getAdminBuilding(id);
        } else {
          data = await getAdminRoom(id);
        }
        if (!ignore) {
          setItem(data);
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

    fetchItem();

    return () => {
      ignore = true;
    };
  }, [type, id]);

  return { item: item, loading: loading, error: error };
}
