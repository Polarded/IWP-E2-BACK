import { env } from '../config/env.config.js';

const SERP_API_URL = 'https://serpapi.com/search.json';

const fetchSerpApi = async (params: Record<string, string>): Promise<unknown> => {
  const searchParams = new URLSearchParams({
    ...params,
    api_key: env.SERPAPI_API_KEY
  });

  const response = await fetch(`${SERP_API_URL}?${searchParams.toString()}`);

  if (!response.ok) {
    throw Object.assign(new Error('Error al consultar SerpApi'), { statusCode: response.status });
  }

  return response.json();
};

export const searchFlightsService = async (
  origin: string,
  destination: string,
  outboundDate: string
): Promise<unknown> => {
  return fetchSerpApi({
    engine: 'google_flights',
    departure_id: origin,
    arrival_id: destination,
    outbound_date: outboundDate,
    hl: 'es'
  });
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
