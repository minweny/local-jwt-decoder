/**
 * Local JWT Decoder — local-only, no external dependencies.
 * Decodes header and payload from a JWT using manual Base64URL decoding.
 */

// ── DOM references ──────────────────────────────────────────────
const jwtInput = document.getElementById('jwt-input');
const statusBar = document.getElementById('status-bar');
const statusText = document.getElementById('status-text');
const headerOutput = document.getElementById('header-output');
const payloadOutput = document.getElementById('payload-output');
const signatureOutput = document.getElementById('signature-output');
const headerBlock = document.getElementById('header-block');
const payloadBlock = document.getElementById('payload-block');
const clearBtn = document.getElementById('clear-btn');
const toast = document.getElementById('toast');
const copyButtons = document.querySelectorAll('.btn-copy');

// ── Base64URL alphabet (standard Base64) ────────────────────────
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Convert a Base64URL-encoded string to standard Base64.
 * Replaces URL-safe characters and adds required padding.
 */
function base64UrlToBase64(base64Url) {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  return base64 + '='.repeat(padLength);
}

/**
 * Decode a Base64 (standard) string to a UTF-8 text string.
 * Implemented manually without atob() to satisfy the requirement,
 * though atob would also work for valid input.
 */
function base64DecodeToString(base64) {
  // Strip padding for processing
  const cleaned = base64.replace(/=+$/, '');
  const bytes = [];

  for (let i = 0; i < cleaned.length; i += 4) {
    const chunk = cleaned.slice(i, i + 4);
    const values = [];

    for (const char of chunk) {
      const index = BASE64_CHARS.indexOf(char);
      if (index === -1) {
        throw new Error(`Invalid Base64 character: "${char}"`);
      }
      values.push(index);
    }

    // Reconstruct bytes from 6-bit groups
    const b0 = (values[0] << 2) | (values[1] >> 4);
    bytes.push(b0);

    if (chunk.length > 2) {
      const b1 = ((values[1] & 0x0f) << 4) | (values[2] >> 2);
      bytes.push(b1);
    }

    if (chunk.length > 3) {
      const b2 = ((values[2] & 0x03) << 6) | values[3];
      bytes.push(b2);
    }
  }

  // Convert byte array to UTF-8 string
  return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
}

/**
 * Decode a Base64URL segment and parse it as JSON.
 * Returns the pretty-printed JSON string on success.
 */
function decodeJwtPart(base64UrlPart) {
  if (!base64UrlPart || !base64UrlPart.trim()) {
    throw new Error('Segment is empty');
  }

  const base64 = base64UrlToBase64(base64UrlPart.trim());
  const jsonText = base64DecodeToString(base64);
  const parsed = JSON.parse(jsonText);
  return JSON.stringify(parsed, null, 2);
}

/**
 * Validate basic JWT structure and return the three segments.
 */
function splitJwt(token) {
  const trimmed = token.trim();

  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split('.');

  if (parts.length !== 3) {
    throw new Error(
      `Invalid JWT format: expected 3 dot-separated segments, found ${parts.length}`
    );
  }

  const [header, payload, signature] = parts;

  if (!header || !payload || !signature) {
    throw new Error('Invalid JWT format: one or more segments are empty');
  }

  // Reject segments that contain characters outside Base64URL
  const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
  if (!base64UrlPattern.test(header)) {
    throw new Error('Header contains invalid Base64URL characters');
  }
  if (!base64UrlPattern.test(payload)) {
    throw new Error('Payload contains invalid Base64URL characters');
  }
  if (!base64UrlPattern.test(signature)) {
    throw new Error('Signature contains invalid Base64URL characters');
  }

  return { header, payload, signature };
}

// ── UI helpers ──────────────────────────────────────────────────

function setStatus(type, message) {
  statusBar.className = `status-bar status-bar--${type}`;
  statusText.textContent = message;
}

function setOutput(element, block, text, { isError = false, isEmpty = false } = {}) {
  element.textContent = text;

  // Preserve layout modifiers when resetting state classes
  const preserved = [...element.classList].filter(
    (c) => c === 'signature-output'
      || (c.startsWith('json-output--') && c !== 'json-output--empty' && c !== 'json-output--error')
  );
  element.className = 'json-output';
  preserved.forEach((c) => element.classList.add(c));

  if (isEmpty) {
    element.classList.add('json-output--empty');
  }
  if (isError) {
    element.classList.add('json-output--error');
    block.classList.add('decode-block--error');
  } else {
    block.classList.remove('decode-block--error');
  }
}

function resetOutputs() {
  setOutput(headerOutput, headerBlock, '—', { isEmpty: true });
  setOutput(payloadOutput, payloadBlock, '—', { isEmpty: true });
  setOutput(signatureOutput, document.getElementById('signature-block'), '—', { isEmpty: true });
  copyButtons.forEach((btn) => { btn.disabled = true; });
}

function enableCopyButtons() {
  copyButtons.forEach((btn) => { btn.disabled = false; });
}

function decodeJwt() {
  const token = jwtInput.value;

  // Empty input — idle state
  if (!token.trim()) {
    jwtInput.classList.remove('jwt-textarea--error');
    setStatus('idle', 'Enter a JWT to decode');
    resetOutputs();
    return;
  }

  try {
    const parts = splitJwt(token);
    if (!parts) {
      resetOutputs();
      return;
    }

    let headerJson;
    let payloadJson;

    try {
      headerJson = decodeJwtPart(parts.header);
    } catch (err) {
      throw new Error(`Header decode failed: ${err.message}`);
    }

    try {
      payloadJson = decodeJwtPart(parts.payload);
    } catch (err) {
      throw new Error(`Payload decode failed: ${err.message}`);
    }

    // Success
    jwtInput.classList.remove('jwt-textarea--error');
    setOutput(headerOutput, headerBlock, headerJson);
    setOutput(payloadOutput, payloadBlock, payloadJson);
    setOutput(
      signatureOutput,
      document.getElementById('signature-block'),
      parts.signature
    );
    enableCopyButtons();
    setStatus('success', 'JWT decoded successfully');
  } catch (err) {
    jwtInput.classList.add('jwt-textarea--error');
    const message = err.message || 'Unknown decode error';
    setStatus('error', message);
    setOutput(headerOutput, headerBlock, `Error: ${message}`, { isError: true });
    setOutput(payloadOutput, payloadBlock, '—', { isEmpty: true });
    setOutput(signatureOutput, document.getElementById('signature-block'), '—', { isEmpty: true });
    copyButtons.forEach((btn) => { btn.disabled = true; });
  }
}

// ── Copy to clipboard ───────────────────────────────────────────

let toastTimeout;

function showToast(message = 'Copied to clipboard') {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.hidden = true;
  }, 2000);
}

async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    button.classList.add('copied');
    button.textContent = 'Copied!';
    showToast();
    setTimeout(() => {
      button.classList.remove('copied');
      button.textContent = 'Copy';
    }, 1500);
  } catch {
    showToast('Copy failed — check browser permissions');
  }
}

copyButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const targetId = button.dataset.copyTarget;
    const target = document.getElementById(targetId);
    if (target && !target.classList.contains('json-output--empty')) {
      copyToClipboard(target.textContent, button);
    }
  });
});

// ── Event listeners ─────────────────────────────────────────────

jwtInput.addEventListener('input', decodeJwt);

clearBtn.addEventListener('click', () => {
  jwtInput.value = '';
  jwtInput.classList.remove('jwt-textarea--error');
  jwtInput.focus();
  decodeJwt();
});

// Decode on load if URL hash contains a token (optional convenience)
window.addEventListener('DOMContentLoaded', decodeJwt);
