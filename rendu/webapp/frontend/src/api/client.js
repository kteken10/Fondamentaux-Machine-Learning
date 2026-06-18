import axios from "axios";

// Le proxy Vite redirige /api vers le backend FastAPI (port 8000).
const http = axios.create({ baseURL: "/api", timeout: 30000 });

export const fraudApi = {
  meta: () => http.get("/meta").then((r) => r.data),
  overview: () => http.get("/overview").then((r) => r.data),
  score: (payload) => http.post("/score", payload).then((r) => r.data),
  batch: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return http.post("/batch", fd).then((r) => r.data);
  },
};
