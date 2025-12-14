export function createRestConnector(app) {
  return {
    register(method, path, handler) {
      const m = method.toUpperCase();
      if (m === "GET") app.get(path, handler);
      else if (m === "POST") app.post(path, handler);
      else if (m === "PUT") app.put(path, handler);
      else if (m === "DELETE") app.delete(path, handler);
      else throw new Error("Méthode HTTP non supportée");
    }
  };
}
