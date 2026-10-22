// Same Apps Script deployment URL as the former sheet integration. Redeploy
// Code.gs before using it: old deployments still write to the sheet.
window.SUMMIT_RELAY_URL = 'https://script.google.com/macros/s/AKfycbx14uTzX4L2LZEthOJKaseHXukNPX6ZMdKCO_lxFiFutr9KPHzFhvEEeBm86aMUY_5T/exec';

window.SummitRelay = (() => {
  function url() {
    const value = String(window.SUMMIT_RELAY_URL || '').trim();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(value)) {
      throw new Error('Set the live relay /exec URL in SummitRelay.js.');
    }
    return value;
  }

  function read(room, after = -1, id = '') {
    return new Promise((resolve, reject) => {
      const callback = 'summitRelay_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      let done = false;
      const timer = setTimeout(() => finish(new Error('Live relay timed out.')), 12000);
      function finish(error, data) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        delete window[callback];
        script.remove();
        if (error) reject(error);
        else if (data?.mode !== 'relay') reject(new Error('Deploy the new Code.gs version to Apps Script before scanning.'));
        else if (!data.ok) reject(new Error(data.error || 'Live relay error.'));
        else resolve(data);
      }
      window[callback] = data => finish(null, data);
      script.onerror = () => finish(new Error('Could not reach the live relay.'));
      script.src = url() + '?room=' + encodeURIComponent(room) + '&after=' + encodeURIComponent(after)
        + '&id=' + encodeURIComponent(id) + '&callback=' + callback + '&t=' + Date.now();
      document.head.appendChild(script);
    });
  }

  async function post(data) {
    await fetch(url(), {
      method:'POST', mode:'no-cors', cache:'no-store',
      body:new URLSearchParams(data)
    });
  }

  return {read, post};
})();
