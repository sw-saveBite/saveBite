export const hasBlank = (value) => /\s/.test(value);

export const isBlank = (value) => {
  return value === undefined || value === null || String(value).trim() === "";
};

export const isEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const isPositiveInteger = (value) => {
  return Number.isInteger(Number(value)) && Number(value) > 0;
};

export const isNonNegativeNumber = (value) => {
  return Number.isFinite(Number(value)) && Number(value) >= 0;
};
