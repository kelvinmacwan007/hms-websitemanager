import { Country, State, City } from "country-state-city";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const country = params.get("country");
  const state = params.get("state");
  if (country && !Country.getCountryByCode(country))
    return Response.json({ error: "Invalid country." }, { status: 400 });
  if (state && (!country || !State.getStateByCodeAndCountry(state, country)))
    return Response.json({ error: "Invalid state." }, { status: 400 });
  const data = !country
    ? Country.getAllCountries().map((x) => ({ code: x.isoCode, name: x.name }))
    : !state
      ? State.getStatesOfCountry(country).map((x) => ({ code: x.isoCode, name: x.name }))
      : City.getCitiesOfState(country, state).map((x) => ({ code: x.name, name: x.name }));
  return Response.json({ data }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
