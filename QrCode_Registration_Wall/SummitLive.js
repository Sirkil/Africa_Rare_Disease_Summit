// Live scanner/display helpers. The old Google Sheet integration remains in
// SummitApi.js but is not loaded while the live display is in use.
window.SummitLive = (() => {
  const ROOM_PREFIX = 'ards-wall-';

  function roomCode() {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[byte % 32]).join('');
  }

  function cleanGuest(data) {
    if (!data || typeof data !== 'object') return null;
    const guest = {
      name: String(data.name || '').trim().slice(0, 120),
      role: String(data.role || 'Attendee').trim().slice(0, 60),
      country: String(data.country || '').trim().slice(0, 80)
    };
    return guest.name ? guest : null;
  }

  function parseQr(raw) {
    const text = String(raw || '').trim();
    if (!text) return null;
    let result;
    if (text[0] === '{') {
      try {
        const data = JSON.parse(text);
        result = {name: data.name || data.memberName, role: data.role, country: data.country};
      } catch (_) { return null; }
    } else if (text.includes('|')) {
      const parts = text.split('|').map(part => part.trim());
      result = parts.length === 3
        ? {name: parts[0], role: 'Attendee', country: parts[1]}
        : {name: parts[0], role: parts[1], country: parts[2]};
    } else if (text.includes('name=')) {
      try {
        const params = new URL(text, location.href).searchParams;
        result = {name: params.get('name'), role: params.get('role'), country: params.get('country')};
      } catch (_) { return null; }
    } else {
      result = {name: text, role: 'Attendee', country: ''};
    }
    return cleanGuest(result);
  }

  return {ROOM_PREFIX, roomCode, cleanGuest, parseQr};
})();
