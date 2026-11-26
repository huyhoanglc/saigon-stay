import axios from "axios";

const api = axios.create({ baseURL: "/api" });

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
