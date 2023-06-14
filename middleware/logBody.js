// VERIFICAR SI SE ENCUENTRA LOGUEADO
const logbody = () => (req, res, next) => {
    const logger = req.app.get('winston');
    logger.log('info', { message: JSON.stringify({ body: req.body }) });
    next();
  };

module.exports = logbody;
