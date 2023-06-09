const express = require("express");

require("dotenv").config();
const http = require("http");
const socketIo = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const redis = require("redis");

const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const env = process.env.NODE_ENV || "development";
const winston = require("./config/winston");
const cuenta_usuario = require("./controllers/cuenta_usuario");
const autenticacion = require("./middleware/autenticacion");
const requestIp = require("request-ip");
require("tls").DEFAULT_MIN_VERSION = "TLSv1";

const rutas = require("./rutas");
var app = express();

// Configuracion de CORS
app.use(cors());
app.all("*", function(req, res, next) {
  const token = req.header("Authorization") ? req.header("Authorization").split(" ")[1] : "Sin token";
  winston.log("info", {
    message: JSON.stringify({
      token: token,
      ip_cliente: requestIp.getClientIp(req),
      url: req.url,
      method: req.method,
      headers: req.headers
    })
  });
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, ,Authorization, DevId");
  next();
});

app.set("winston", winston);
app.use("/imagenesComprobantes", express.static(__dirname + "/imagenesComprobantes"));
//PARSER REQUEST

app.use(bodyParser.json());

//=============== SOLO PARA TEST MOCHA, CHAI ================
//NO MUESTRA EL LOG CUANDO ESTA EN TEST
if (JSON.stringify(env) === JSON.stringify("development")) {
  app.use(morgan("dev"));
} else if (env !== "test") {
  //muestra los log al estilo apache
  app.use(morgan("combined"));
}

//app.use(express.static(path.join(__dirname, "public")));
app.get("/robots.txt", function(req, res) {
  res.type("text/plain");
  res.send("User-agent: *\nDisallow: /");
});
app.post("/login", cuenta_usuario.validar);
//app.get("/migrar", cliente.migrar);
//app.get("/test", reportesOrdenPago.listaOrdenesPago);
//===================== MIDDLEWARES =========================
/**
 * ================== LOGIN ===================
 * Verifica si el usuario se encuentra logueado
 */
app.use(autenticacion());

//=======================  RUTAS  ===========================
//RUTAS API
app.use("/", rutas);

//redis
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  legacyMode: true
});
const redis_database = process.env.REDIS_DATABASE || 0;
client.connect()
  .then(async ()=>{
    await client.select(redis_database)
    console.log("Servidor REDIS conectado!")
    app.set('redis', client)
    // await client.disconnect()
  })
client.on("error", (err) => {
  console.log('Error al conectarse a REDIS', err.message);
});

//=============== INICIAR EL SERVIDOR  ======================
// Crear el servidor
const server = http.createServer(app);

const io = socketIo(server, {
  upgradeTimeout: 30000
});

const subClient = redis.createClient(process.env.REDIS_URL)
io.adapter(createAdapter(client, subClient))

io.on("connection", function(socket) {
  socket.on("disconnect", function() {});
});

app.use(function(err, req, res, next) {
  winston.log("error", { message: { mensaje: err.message, tracestack: err.stack } });
  res.status(500).send({ Error: "Error" });
});

server.listen(process.env.PORT || 8000, function() {
  const host = server.address().address;
  const port = server.address().port;
  console.log(`API en: https://${host}:${port}`);
});

app.set("socketio", io);

module.exports = server; // for testing
