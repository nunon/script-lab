import { parse } from 'query-string';
import { localStorageKeys } from '../constants';
import { editorUrls } from '../environment';
import ensureFreshLocalStorage from './ensure.fresh.local.storage';

/** Checks (and redirects) if needs to go to a different environment.
 * Returns `true` if will be redirecting away
 */
function redirectIfNeeded(): boolean {
  try {
    const params = parse(window.location.search) as {
      originEnvironment?: string;
      targetEnvironment?: string;
    };

    const originUrl = (params.originEnvironment || '').trim();
    let targetUrl = (params.targetEnvironment || '').trim();

    const urlsAreOk = isAllowedUrl(originUrl) && isAllowedUrl(targetUrl);
    if (!urlsAreOk) {
      throw new Error('Invalid query parameters for target or origin environments');
    }

    // If there is a target environment specified, set it in local storage
    if (targetUrl.length > 0) {
      targetUrl = decodeURIComponent(targetUrl);

      // The exception: clear the redirect key if already on the target (i.e.,
      // the user has returned back to the root site)
      if (window.location.href.toLowerCase().indexOf(targetUrl) === 0) {
        window.localStorage.removeItem(localStorageKeys.editor.redirectEnvironmentUrl);
        return false;
      }

      // If hasn't quit above, then set the redirect URL into storage
      window.localStorage.setItem(
        localStorageKeys.editor.redirectEnvironmentUrl,
        targetUrl,
      );
    }

    // Store the root site origin, if provided
    if (originUrl.length > 0) {
      window.localStorage.setItem(
        localStorageKeys.editor.originEnvironmentUrl,
        decodeURIComponent(originUrl).toLowerCase(),
      );
    }

    ensureFreshLocalStorage();
    const redirectUrl = window.localStorage.getItem(
      localStorageKeys.editor.redirectEnvironmentUrl,
    );

    if (redirectUrl) {
      const originParam = [
        window.location.search ? '&' : '?',
        'originEnvironment=',
        encodeURIComponent(window.location.origin),
      ].join('');

      window.location.replace(
        [
          redirectUrl,
          window.location.pathname,
          window.location.search,
          originParam,
          window.location.hash,
        ].join(''),
      );

      return true;
    }

    // If reached here, environment is already configured. No need to redirect anywhere.
    return false;
  } catch (e) {
    console.error('Error redirecting the environments, staying on current page', e);
  }

  return false;
}

export default redirectIfNeeded;

///////////////////////////////////////

function isAllowedUrl(url: string) {
  if (url.length === 0) {
    return true;
  }

  for (const key in editorUrls) {
    const value = (editorUrls as any)[key];
    if (value.indexOf(url) === 0) {
      return true;
    }
  }

  return false;
}
