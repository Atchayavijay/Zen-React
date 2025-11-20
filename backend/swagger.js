// swagger.js
const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Zen-Live API",
    description: "Auto-generated Swagger docs",
    version: "1.0.0",
  },
  host: "api.zen-urbancode.in",
  schemes: ["https"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description:
        'JWT via Bearer scheme. e.g. "Authorization: Bearer <token>"',
    },
  },
  security: [{ bearerAuth: [] }],
};

const outputFile = "./swagger-output.json";
// glob your entire source tree + entry point:
const endpointsFiles = [
  "./server.js", // wherever you do `app.listen(...)`
  "./src/**/*.js", // every .js under src (routes, controllers, utils, etc)
];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log("✅ swagger-output.json generated");
  require("./server.js"); // start your server (optional)
});
