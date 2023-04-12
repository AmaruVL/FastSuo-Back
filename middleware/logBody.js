//VERIFICAR SI SE ENCUENTRA LOGUEADO
const logbody = () => {
  return (req, res, next) => {
    var logger = req.app.get("winston");
    logger.log("info", { message: JSON.stringify({ body: req.body }) });
    next();
  };
};

module.exports = logbody;
