require("dotenv").config(); // this is important!

const startCache = () => {
  if (!process.env.CACHE) {
    process.env.CACHE = "{}";
  }
};

const setValue = (key, value, lifetime = 43200) => {
  //lifetime in seconds, 12h (43200s) by default
  startCache();
  const expires = Date.now() + lifetime * 1000;
  const cache = JSON.parse(process.env.CACHE);
  process.env.CACHE = JSON.stringify({ ...cache, [key]: { value, expires } });
};

const getValue = key => {
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

const delValue = key => {
  startCache();
  const cache = JSON.parse(process.env.CACHE);
  delete cache[key];
  process.env.CACHE = JSON.stringify({ ...cache });
};

module.exports = {
  setValue,
  delValue,
  getValue,
};
