function log(msg) {
  const el = document.getElementById('log');
  el.textContent += msg + "\n";
  el.scrollTop = el.scrollHeight;
}

document.getElementById('run').addEventListener('click', async () => {
  const domainsInput = document.getElementById('domains').value.trim();
  if (!domainsInput) {
    log("❗ Introduce al menos un dominio.");
    return;
  }
  const domains = domainsInput
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map(d => d.toLowerCase());

  const maxResults = Math.max(100, Number(document.getElementById('maxResults').value || 50000));

  let startTime = 0;
  const df = document.getElementById('dateFrom').value;
  const dt = document.getElementById('dateTo').value;

  if (df) startTime = new Date(df + 'T00:00:00').getTime();
  let endTime = Date.now();
  if (dt) endTime = new Date(dt + 'T23:59:59').getTime();

  log(`▶️ Buscando hasta ${maxResults.toLocaleString()} entradas...`);

  const results = await chrome.history.search({
    text: '',
    maxResults,
    startTime
  });

  const shouldDelete = (url) => {
    try {
      const u = new URL(url);
      const host = (u.hostname || '').toLowerCase();
      return domains.some(d => host === d || host.endsWith('.' + d));
    } catch {
      return false;
    }
  };

  const toDelete = results.filter(item => {
    if (dt && item.lastVisitTime && item.lastVisitTime > endTime) return false;
    return shouldDelete(item.url);
  });

  log(`🔎 Encontradas ${toDelete.length.toLocaleString()} entradas de ${domains.join(', ')}`);

  let ok = 0, fail = 0;
  for (const it of toDelete) {
    try {
      await chrome.history.deleteUrl({ url: it.url });
      ok++;
      if (ok % 500 === 0) log(`✅ Borradas ${ok.toLocaleString()}...`);
    } catch (e) {
      fail++;
      log(`⚠️ Error en ${it.url}`);
    }
  }

  log(`🏁 Terminado. Borradas: ${ok} | Errores: ${fail}`);
});
