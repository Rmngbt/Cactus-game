// logUtils.js
export function logAction(msg) {
  const log = document.getElementById("log");
  if (log) {
    log.innerHTML += `<p>${msg}</p>`;
  }
}