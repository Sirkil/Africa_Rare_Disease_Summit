// Set this to the /exec URL after deploying Code.gs as an Apps Script web app.
window.SUMMIT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx14uTzX4L2LZEthOJKaseHXukNPX6ZMdKCO_lxFiFutr9KPHzFhvEEeBm86aMUY_5T/exec';

window.SummitApi = (() => {
  function url() {
    const value = String(window.SUMMIT_WEB_APP_URL || '').trim();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(value)) {
      throw new Error('Set SUMMIT_WEB_APP_URL in SummitApi.js to the deployed /exec URL.');
    }
    return value;
  }

  function events(after) {
    return new Promise((resolve, reject) => {
      let done = false;
      const callback = 'summitCallback_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      const timer = setTimeout(() => finish(new Error('Sheet connection timed out.')), 15000);
      function finish(error, data) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        delete window[callback];
        script.remove();
        if (error) reject(error);
        else if (!data || !data.ok) reject(new Error(data && data.error || 'Sheet read failed.'));
        else resolve(data);
      }
      window[callback] = data => finish(null, data);
      script.onerror = () => finish(new Error('Could not reach the sheet web app.'));
      script.src = url() + '?after=' + encodeURIComponent(after) + '&callback=' + callback + '&t=' + Date.now();
      document.head.appendChild(script);
    });
  }

  async function submit(data) {
    // Apps Script redirects POST responses. The scanner verifies the saved row
    // through events() instead of treating an opaque response as confirmation.
    await fetch(url(), {
      method: 'POST', mode: 'no-cors', cache: 'no-store',
      body: new URLSearchParams(data)
    });
  }

  function parseQr(raw) {
    const text = String(raw || '').trim();
    if (!text) return null;
    let result;
    if (text[0] === '{') {
      try {
        const data = JSON.parse(text);
        result = {name: data.name || data.memberName, role: data.role,
          country: data.country, condition: data.condition};
      } catch (_) { return null; }
    } else if (text.includes('|')) {
      const parts = text.split('|').map(part => part.trim());
      // Current badges: Name|Role|Country|Condition.
      // Older badges: Name|Country|Condition.
      result = parts.length === 3
        ? {name: parts[0], role: 'Attendee', country: parts[1], condition: parts[2]}
        : {name: parts[0], role: parts[1], country: parts[2], condition: parts[3]};
    } else if (text.includes('name=')) {
      try {
        const params = new URL(text, location.href).searchParams;
        result = {name: params.get('name'), role: params.get('role'),
          country: params.get('country'), condition: params.get('condition')};
      } catch (_) { return null; }
    } else {
      result = {name: text, role: 'Attendee', country: '', condition: ''};
    }
    result.name = String(result.name || '').trim().slice(0, 120);
    result.role = String(result.role || 'Attendee').trim().slice(0, 60);
    result.country = String(result.country || '').trim().slice(0, 80);
    result.condition = String(result.condition || '').trim().slice(0, 120);
    return result.name ? result : null;
  }

  return {events, submit, parseQr, configured: () => { try { url(); return true; } catch (_) { return false; } }};
})();
