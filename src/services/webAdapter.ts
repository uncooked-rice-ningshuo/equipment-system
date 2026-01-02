// Remove sql.js and bcryptjs from web adapter as we are moving away from them
// and they are causing build errors if not installed.
// The webAdapter was a fallback for running in browser without Electron.
// Since we removed sql.js and bcryptjs packages, this file is now broken.

// However, to keep the project compilable if this file is imported, we should stub it out
// or remove the imports.
// But wait, if we are in Electron, this file is NOT used (invoke calls window.api.invoke).
// It's only used if window.api is missing (e.g. pure web mode).

// If the user wants to run in pure web mode, they need sql.js.
// But we removed sql.js package.
// So we should probably disable the web adapter functionality or mock it
// to prevent build errors.

export async function invoke(channel: string, ...args: any[]): Promise<any> {
  console.warn(
    'Web adapter is disabled because sql.js was removed. Please run in Electron.',
  );
  return {
    success: false,
    message: 'Web adapter disabled. Please use Electron environment.',
  };
}
