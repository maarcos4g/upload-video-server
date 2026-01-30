import { server } from "./app";

server.listen({
  port: 8080,
  host: '0.0.0.0'
})
.then(() => console.log('Server Running on port 8080'))