-- Seed data for local development and first deployment.
-- Services, durations, prices and texts come from the current website
-- (docs/sito-attuale.md), with the brief taking precedence (docs/decisioni.md).
-- Test clients are obviously fake (example.test domain, "Test" names).

-- ---------------------------------------------------------------------------
-- Business settings
-- ---------------------------------------------------------------------------
insert into public.business_settings (
  id, name, tagline, email, instagram_url, logo_url,
  address_line1, postal_code, city, country_code,
  home_content
) values (
  true,
  'Lady A Beauty',
  'Lash maker & brow artist à Annemasse',
  'alessiarubu98@gmail.com',
  'https://www.instagram.com/lady.a_beauty/',
  '/brand/logo-actuel.jpg',
  'Avenue de Verdun', '74100', 'Annemasse', 'FR',
  jsonb_build_object(
    'heroTitle', 'Lady A Beauty',
    'heroSubtitle', 'Lash maker & brow artist à Annemasse',
    'aboutTitle', 'Je suis Alessia',
    'aboutParagraphs', jsonb_build_array(
      'Bienvenue chez Lady A Beauty, votre espace beauté.',
      'Je suis Alessia, lash maker et brow artist. Diplômée depuis 2019 dans le secteur de l''esthétique, je me suis spécialisée dans la beauté du regard en 2021, en Italie.',
      'Je suis prête à sublimer votre regard, à l''écoute pour vous offrir des prestations sur mesure selon vos préférences, tout en partageant mes conseils dans une atmosphère douce et chaleureuse.'
    )
  )
);

-- ---------------------------------------------------------------------------
-- Opening hours (brief): Mon–Fri 10:00–14:00 & 14:30–20:00, Sat 10:00–14:30
-- ---------------------------------------------------------------------------
insert into public.opening_hours (weekday, opens, closes)
select d, w.opens, w.closes
from generate_series(1, 5) as d
cross join (values (time '10:00', time '14:00'), (time '14:30', time '20:00')) as w (opens, closes);

insert into public.opening_hours (weekday, opens, closes) values (6, '10:00', '14:30');

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
insert into public.service_categories (id, name, sort_order)
values ('6f1d7c1e-0000-4000-8000-000000000001', 'Prestations', 1);

insert into public.services
  (category_id, slug, name, description, duration_min, price_cents, price_is_from, deposit_cents, sort_order)
values
  ('6f1d7c1e-0000-4000-8000-000000000001', 'extension-cils', 'Extension cils',
   E'Le prix de 20 € est l''acompte pour la réservation + 0,94 € de frais de transaction.\n\nMerci de me contacter en DM pour m''indiquer la pose choisie.\n\nL''acompte n''est pas remboursable.',
   105, null, false, 2000, 1),
  ('6f1d7c1e-0000-4000-8000-000000000001', 'extension-cils-remplissage', 'Extension cils – remplissage',
   E'Le remplissage est possible uniquement dans les 3 semaines suivant la pose complète. Après ce délai, il faudra payer la pose complète.\n\nLe prix de 20 € est l''acompte pour la réservation + 0,94 € de frais de transaction.\n\nL''acompte n''est pas remboursable.',
   90, null, false, 2000, 2),
  ('6f1d7c1e-0000-4000-8000-000000000001', 'depose', 'Dépose',
   E'Le prix de la dépose est de 20 €.\n\nPour qui effectue la dépose et ensuite une nouvelle pose d''extensions de cils, le prix de la dépose est réduit à 10 €.',
   20, 1000, true, null, 3),
  ('6f1d7c1e-0000-4000-8000-000000000001', 'epilation-sourcils', 'Épilation sourcils',
   E'Si vous annulez le rendez-vous, le paiement n''est pas remboursable.',
   15, 1600, false, null, 4),
  ('6f1d7c1e-0000-4000-8000-000000000001', 'browlift', 'Browlift',
   E'Le prix de 20 € est l''acompte pour la réservation + 0,94 € de frais de transaction.\n\nL''acompte n''est pas remboursable.',
   60, null, false, 2000, 5),
  ('6f1d7c1e-0000-4000-8000-000000000001', 'browlift-avec-teinture', 'Browlift avec teinture',
   E'Le prix de 20 € est l''acompte pour la réservation + 0,94 € de frais de transaction.',
   70, null, false, 2000, 6),
  ('6f1d7c1e-0000-4000-8000-000000000001', 'rehaussement-cils', 'Rehaussement de cils',
   E'Le prix de 20 € est l''acompte pour la réservation + 0,94 € de frais de transaction.\n\nL''acompte n''est pas remboursable.',
   60, null, false, 2000, 7),
  ('6f1d7c1e-0000-4000-8000-000000000001', 'rehaussement-cils-avec-teinture', 'Rehaussement de cils avec teinture',
   E'Le prix de 20 € est l''acompte pour la réservation + 0,94 € de frais de transaction.\n\nL''acompte n''est pas remboursable.',
   60, null, false, 2000, 8),
  ('6f1d7c1e-0000-4000-8000-000000000001', 'shading-microblading', 'Shading / Microblading',
   E'Le prix de 50 € est l''acompte pour la réservation.\n\nL''acompte n''est pas remboursable.',
   120, null, false, 5000, 9),
  ('6f1d7c1e-0000-4000-8000-000000000001', 'blanchiment-dentaire', 'Blanchiment dentaire',
   E'Le prix de 20 € est l''acompte pour la réservation + 0,94 € de frais de transaction.\n\nL''acompte n''est pas remboursable.',
   60, null, false, 2000, 10),
  ('6f1d7c1e-0000-4000-8000-000000000001', 'taches-de-rousseur', 'Taches de rousseur',
   E'Le prix de 20 € est l''acompte pour la réservation + 0,94 € de frais de transaction.\n\nL''acompte n''est pas remboursable.',
   70, null, false, 2000, 11),
  ('6f1d7c1e-0000-4000-8000-000000000001', 'teinture-sourcils', 'Teinture sourcils',
   '', 30, 2500, false, null, 12),
  ('6f1d7c1e-0000-4000-8000-000000000001', 'epilation-moustache', 'Épilation moustache',
   '', 10, 1000, false, null, 13);

-- The brief's main services, highlighted on the home page.
update public.services set is_featured = true
where slug in ('extension-cils', 'extension-cils-remplissage', 'rehaussement-cils', 'browlift');

-- ---------------------------------------------------------------------------
-- Gallery (photos from the current website, optimised in public/galerie)
-- ---------------------------------------------------------------------------
insert into public.gallery_images (image_url, alt, width, height, sort_order) values
  ('/galerie/regard-01.jpg', 'Extension de cils, vue rapprochée d''un œil vert', 900, 1200, 1),
  ('/galerie/regard-02.jpg', 'Extension de cils sur une cliente, de profil', 900, 1200, 2),
  ('/galerie/regard-03.jpg', 'Regard sublimé par une extension de cils', 900, 1200, 3),
  ('/galerie/regard-04.jpg', 'Extension de cils et sourcils structurés', 900, 1200, 4),
  ('/galerie/regard-05.jpg', 'Résultat d''une pose de cils, regard de trois quarts', 900, 1200, 5),
  ('/galerie/regard-06.jpg', 'Pose de cils volume, regard vers l''objectif', 900, 1200, 6);

-- ---------------------------------------------------------------------------
-- Fake clients and appointments (development only)
-- Appointments are placed on next week's Tuesday and Wednesday, Paris time.
-- ---------------------------------------------------------------------------
insert into public.clients (id, full_name, email, phone, privacy_accepted_at) values
  ('c0000000-0000-4000-8000-000000000001', 'Cliente Test Un', 'cliente.un@example.test', '+33 6 00 00 00 01', now()),
  ('c0000000-0000-4000-8000-000000000002', 'Cliente Test Deux', 'cliente.deux@example.test', '+33 6 00 00 00 02', now()),
  ('c0000000-0000-4000-8000-000000000003', 'Cliente Test Trois', null, '+33 6 00 00 00 03', null);

with next_week as (
  select (date_trunc('week', current_date)::date + 7) as monday
)
insert into public.appointments
  (client_id, service_id, service_name, duration_min, period, source)
select c.client_id, s.id, s.name, s.duration_min,
       tstzrange(
         ((nw.monday + c.day_offset) + c.start_time) at time zone 'Europe/Paris',
         ((nw.monday + c.day_offset) + c.start_time + make_interval(mins => s.duration_min)) at time zone 'Europe/Paris'
       ),
       c.source::public.appointment_source
from next_week nw
cross join (values
  ('c0000000-0000-4000-8000-000000000001'::uuid, 1, time '10:00', 'extension-cils', 'online'),
  ('c0000000-0000-4000-8000-000000000002'::uuid, 1, time '14:30', 'rehaussement-cils', 'online'),
  ('c0000000-0000-4000-8000-000000000003'::uuid, 2, time '12:00', 'extension-cils-remplissage', 'admin')
) as c (client_id, day_offset, start_time, slug, source)
join public.services s on s.slug = c.slug;
