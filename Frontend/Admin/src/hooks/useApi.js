import { useCallback, useEffect, useRef, useState } from 'react';
import { extractErrorMessage } from '../api/client.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('useApi');

/**
 * Runs `fetcher` whenever `deps` change, exposing loading/error/data and a
 * manual `reload` function. `fetcher` must return a Promise resolving to
 * the value to store in `data`.
 */
export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (currentRequestId !== requestId.current) return; // stale response, ignore
        setData(result);
      })
      .catch((err) => {
        if (currentRequestId !== requestId.current) return;
        logger.error('Request failed', err);
        setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (currentRequestId !== requestId.current) return;
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
