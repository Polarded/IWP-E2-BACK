import { env } from '../config/env.config.js';

const SERP_API_URL = 'https://serpapi.com/search.json';

const fetchSerpApi = async (params: Record<string, string>): Promise<unknown> => {
  const searchParams = new URLSearchParams({
    ...params,
    api_key: env.SERPAPI_API_KEY
  });

  const response = await fetch(`${SERP_API_URL}?${searchParams.toString()}`);
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    const providerMessage =
      (typeof payload?.error === 'string' && payload.error) ||
      (typeof payload?.message === 'string' && payload.message) ||
      'Error al consultar SerpApi';

    throw Object.assign(new Error(providerMessage), { statusCode: response.status });
  }

  return payload;
};

export const searchFlightsService = async (
  origin: string,
  destination: string,
  outboundDate: string,
  returnDate?: string
): Promise<unknown> => {
  const params: Record<string, string> = {
    engine: 'google_flights',
    departure_id: origin,
    arrival_id: destination,
    outbound_date: outboundDate,
    hl: 'es'
  };

  if (returnDate) {
    params.return_date = returnDate;
    params.type = '1';
  } else {
    // SerpApi defaults to round-trip if type is omitted.
    params.type = '2';
  }

  return fetchSerpApi(params);
};

export const searchHotelsService = async (
  query: string,
  checkInDate: string,
  checkOutDate: string
): Promise<unknown> => {
  return fetchSerpApi({
    engine: 'google_hotels',
    q: query,
    check_in_date: checkInDate,
    check_out_date: checkOutDate,
    hl: 'es'
  });
};
