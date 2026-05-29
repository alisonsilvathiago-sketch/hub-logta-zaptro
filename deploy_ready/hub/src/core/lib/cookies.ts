
const isBrowser = typeof window !== 'undefined';

export const setSharedCookie = (key: string, value: string) => {
  if (!isBrowser) return;
  const hostname = window.location.hostname;
  let domain = '';
  
  if (hostname.includes('logta.com.br')) domain = '; domain=.logta.com.br';
  else if (hostname.includes('zaptro.com.br')) domain = '; domain=.zaptro.com.br';
  
  const domainAttr = domain ? domain : '';
  document.cookie = `${key}=${value}; path=/; SameSite=Lax; Secure${domainAttr}; max-age=31536000`;
};

export const getSharedCookie = (key: string) => {
  if (!isBrowser) return null;
  const name = key + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
      const c = ca[i].trim();
      if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
  }
  return null;
};

export const removeSharedCookie = (key: string) => {
  if (!isBrowser) return;
  const hostname = window.location.hostname;
  let domain = '';
  
  if (hostname.includes('logta.com.br')) domain = '; domain=.logta.com.br';
  else if (hostname.includes('zaptro.com.br')) domain = '; domain=.zaptro.com.br';
  
  const domainAttr = domain ? domain : '';
  document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC${domainAttr}`;
};
