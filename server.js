const express = require('express');
require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const requestIp = require('request-ip');
const winston = require('./config/winston');
const cuenta_usuario = require('./controllers/cuenta_usuario');
const autenticacion = require('./middleware/autenticacion');
const swaggerjsdoc = require('swagger-jsdoc');
const swaggerui = require('swagger-ui-express');
require('tls').DEFAULT_MIN_VERSION = 'TLSv1';
const rutas = require('./routes');

const env = process.env.NODE_ENV || 'development';
const app = express();

// Swagger
const specs = swaggerjsdoc({
  swaggerDefinition: {
    openapi: '3.1.0',
    info: {
      title: 'API',
      version: '1.0.0',
      description: 'Documentación de la API',
    },
    components: {
      schemas: {},
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          name: 'Authorization',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8000}`,
        description: 'Local server',
      },
    ],
  },

  apis: ['./routes/Menu/**/*.js'],
});

app.use('/api-docs', swaggerui.serve, swaggerui.setup(specs));

// Configuracion de CORS
app.use(cors());
app.all('*', (req, res, next) => {
  const token = req.header('Authorization')
    ? req.header('Authorization').split(' ')[1]
    : 'Sin token';
  winston.log('info', {
    message: JSON.stringify({
      token,
      ip_cliente: requestIp.getClientIp(req),
      url: req.url,
      method: req.method,
      headers: req.headers,
    }),
  });
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, ,Authorization, DevId');
  next();
});

app.set('winston', winston);

//  PARSER REQUEST
app.use(bodyParser.json());

//  =============== SOLO PARA TEST MOCHA, CHAI ================
//  NO MUESTRA EL LOG CUANDO ESTA EN TEST
if (JSON.stringify(env) === JSON.stringify('development')) {
  app.use(morgan('dev'));
} else if (env !== 'test') {
  //  muestra los log al estilo apache
  app.use(morgan('combined'));
}

//  app.use(express.static(path.join(__dirname, "public")));
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});
app.post('/login', cuenta_usuario.validar);

//  ===================== MIDDLEWARES =========================
/**
 * ================== LOGIN ===================
 * Verifica si el usuario se encuentra logueado
 */
app.use(autenticacion());

//  =======================  RUTAS  ===========================
//  RUTAS API
app.use('/', rutas);

// =============== INICIAR EL SERVIDOR  ======================
//  Crear el servidor
const server = http.createServer(app);

const io = socketIo(server, {
  upgradeTimeout: 30000,
});

io.on('connection', (socket) => {
  socket.on('disconnect', () => {});
});

app.use((err, req, res) => {
  winston.log('error', { message: { mensaje: err.message, tracestack: err.stack } });
  res.status(500).send({ Error: 'Error' });
});

server.listen(process.env.PORT || 8000, () => {
  const host = server.address().address;
  const { port } = server.address();
  // eslint-disable-next-line no-console
  console.log(`API en: https:// ${host}:${port}`);
});

app.set('socketio', io);

module.exports = server; //  for testing
