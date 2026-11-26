import axios from "axios";

let baseURL = "/api";
if (import.meta.env.VITE_API_URL) {
  baseURL = import.meta.env.VITE_API_URL;
}

const api = axios.create({
  baseURL: baseURL,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const code =
      err.response?.data?.code || (err.response ? "UNKNOWN" : "NETWORK_ERROR");
    return Promise.reject({ code, status: err.response?.status });
  },
);

export const getRooms = (params) =>
  api.get("/rooms", { params }).then((res) => res.data);

export const getRoom = (id) => api.get(`/rooms/${id}`).then((res) => res.data);

export async function createInquiry(data) {
  const response = await api.post("/inquiries", data);
  return response.data;
}
