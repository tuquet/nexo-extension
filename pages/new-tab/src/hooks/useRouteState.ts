import { useEffect } from 'react';

type RouteState = {
  view?: 'script' | 'assets';
  scriptId?: number | null;
  actIndex?: number | null;
  sceneIndex?: number | null;
};

const parseNumber = (v: string | null) => {
  if (!v) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export const readRouteState = (): RouteState => {
  if (typeof window === 'undefined') return {};
  const p = new URLSearchParams(window.location.search);
  const view = (p.get('view') as 'script' | 'assets') || undefined;
  const scriptId = parseNumber(p.get('scriptId'));
  const actIndex = parseNumber(p.get('act'));
  const sceneIndex = parseNumber(p.get('scene'));
  return { view, scriptId, actIndex, sceneIndex };
};

export const writeRouteState = (state: RouteState, replace = true) => {
  if (typeof window === 'undefined') return;
  const p = new URLSearchParams(window.location.search);
  if (state.view) p.set('view', state.view);
  else p.delete('view');

  if (state.scriptId != null) p.set('scriptId', String(state.scriptId));
  else p.delete('scriptId');

  if (state.actIndex != null) p.set('act', String(state.actIndex));
  else p.delete('act');

  if (state.sceneIndex != null) p.set('scene', String(state.sceneIndex));
  else p.delete('scene');

  const url = `${window.location.pathname}?${p.toString()}`;
  if (replace) window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
};

// Hook that initializes route -> app state on mount and wires simple popstate listener
export const useRouteSync = (onInit: (state: RouteState) => void, onPop?: (state: RouteState) => void) => {
  useEffect(() => {
    const initial = readRouteState();
    onInit(initial);

    const handler = () => {
      const s = readRouteState();
      if (onPop) {
        onPop(s);
      } else {
        onInit(s);
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export default useRouteSync;
