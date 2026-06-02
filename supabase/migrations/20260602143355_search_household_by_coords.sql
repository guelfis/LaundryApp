CREATE OR REPLACE FUNCTION public.search_household_by_coords(
  search_lat NUMERIC,
  search_lng NUMERIC
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  access_code TEXT,
  timezone TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if a household already exists within a ~30 meter box
  RETURN QUERY
  SELECT h.id, h.name, h.address, h.access_code, h.timezone
  FROM public.household h
  WHERE 
    h.latitude BETWEEN (search_lat - 0.0003) AND (search_lat + 0.0003)
    AND h.longitude BETWEEN (search_lng - 0.0003) AND (search_lng + 0.0003)
  --  Sort the results so the single closest point is always index #1
  ORDER BY (
    ((h.latitude - search_lat) ^ 2) + ((h.longitude - search_lng) ^ 2)
  ) ASC
  LIMIT 1;
END;
$$;
