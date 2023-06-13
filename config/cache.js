require('dotenv').config();

const startCache = () => {
  if (!process.env.CACHE) {
    process.env.CACHE = '{}';
  }
};

const setValue = (key, value, lifetime = 43200) => {
  // lifetime en segundos, 12h (43200s) por defecto
  startCache();
  const expires = Date.now() + lifetime * 1000;
  const cache = JSON.parse(process.env.CACHE);
  process.env.CACHE = JSON.stringify({ ...cache, [key]: { value, expires } });
};

const getValue = (key) => {
  startCache();
  const cache = JSON.parse(process.env.CACHE);
  const item = cache[key];
  if (!item) return null;
  if (item.expires <= Date.now()) {
    delete cache[key];
    process.env.CACHE = JSON.stringify({ ...cache });
    return null;
  }
  return item.value;
};

const delValue = (key) => {
  startCache();
  const cache = JSON.parse(process.env.CACHE);
  delete cache[key];
  process.env.CACHE = JSON.stringify({ ...cache });
};

const incrValue = (key) => {
  //  Incrementar valor de key en 1
  const value = getValue(key);
  const incr = Number(value) + 1;
  if (Number.isNaN(incr)) return null;
  setValue(key, incr.toString());
  return incr;
};

module.exports = {
  setValue,
  getValue,
  delValue,
  incrValue,
};
