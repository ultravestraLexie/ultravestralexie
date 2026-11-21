-- Nomatic score correction (2026-11-20): the batch-8 load stored components 22/14/18/12/8/4 = 78;
-- the research file and pinned batch-8 SQL carry 29/19/20/9/10/5 = 92. Restore the file values.
do $$
declare bid uuid;
begin
  select id into bid from public.brands where name = 'Nomatic';
  delete from public.brand_scores where brand_id = bid;
  insert into public.brand_scores (brand_id, niche_fit, ugc_evidence, compensation, contact_access, opportunity_availability, credibility, explanation) values (bid, 29, 19, 20, 9, 10, 5, '{"compensation": "Highest published rate in the batch: 20% on every sale with $250+ AOV.", "contact_access": "Open Awin application page published, but no contact email on the fetched page.", "credibility": "Rate and terms come from the affiliate network''s own merchant profile.", "niche_fit": "Core travel gear brand: travel bags, backpacks and camera gear for travelers and commuters.", "opportunity_availability": "Joinable now via the Awin merchant profile.", "ugc_evidence": "Awin profile explicitly names Instagram/TikTok creators, YouTubers and gear-review bloggers as best fit."}'::jsonb);
end $$;
