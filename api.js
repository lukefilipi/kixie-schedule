/* KIXIE pages talk to the Apps Script backend anonymously (no Google cookies),
   which avoids Google's multi-account "unable to open the file" bug. */
const KIXIE_API = 'https://script.google.com/macros/s/AKfycbyN6JEhProo6M3wygQQmNMs1nB3VkT4ajQlIHJEdzxplcD-t4Jz9_xTNQ10LBwh2owLoA/exec';
const KX = Object.fromEntries(new URLSearchParams(location.hash.slice(1)));

function kxCall(fn, args) {
  return fetch(KIXIE_API, {
    method: 'POST', credentials: 'omit', redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, args })
  }).then(r => {
    if (!r.ok) throw new Error('The server did not respond (' + r.status + '). Try again in a minute.');
    return r.json();
  }).then(j => {
    if (!j.ok) throw new Error(j.error || 'Something went wrong.');
    return j.result;
  }, e => { throw e instanceof Error ? e : new Error(String(e)); });
}

/* Same shape as google.script.run so page code stays simple. */
window.google = { script: { get run() {
  let ok = () => {}, bad = e => alert(e.message);
  const p = new Proxy({}, { get(_, name) {
    if (name === 'withSuccessHandler') return f => { ok = f; return p; };
    if (name === 'withFailureHandler') return f => { bad = f; return p; };
    return (...args) => { kxCall(name, args).then(ok, bad); };
  } });
  return p;
} } };
