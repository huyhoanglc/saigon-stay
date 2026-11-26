import { useState, useEffect } from "react";
import { getRoom } from "../api/client";

export function useRoom(id) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function fetchRoom() {
      setLoading(true);
      setError(null);
      setRoom(null);

      try {
        const data = await getRoom(id);
        if (!ignore) {
          setRoom(data);
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

    fetchRoom();

    return () => {
      ignore = true;
    };
  }, [id]);

  return {
    room: room,
    loading: loading,
    error: error,
  };
}
