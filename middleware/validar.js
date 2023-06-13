const validar = () => (req, res, next) => {
    if (true) {
      next();
    } else {
      res.status(403).send("No puede ingresar");
    }
  };

module.exports = validar;
