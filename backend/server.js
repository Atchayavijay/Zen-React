const app = require("./src/app");
const PORT = process.env.PORT || 3001;
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger-output.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


