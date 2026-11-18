-- Content updates decided on 18/11/2026, for databases created before them
-- (seed of a Codespace or of a first deployment). Each statement only
-- changes the old value, so it is safe to run on any database.

-- The old « Lady A Cils » logo is retired: typographic wordmark instead.
update public.business_settings
set logo_url = null
where logo_url = '/brand/logo-actuel.jpg';

-- Address and legal details from the public register (INSEE / RNE).
update public.business_settings
set address_line1 = '49 avenue de Verdun'
where address_line1 = 'Avenue de Verdun';

update public.business_settings
set legal_name = 'Alessia Rubulotta, entrepreneur individuel (EI)',
    siret = '98404011300016',
    latitude = 46.1826218514486,
    longitude = 6.24021231874929
where siret is null and postal_code = '74100';

-- Deposit texts: no more Book in Beautiful card fee (no online payment here).
update public.services set description = replace(description,
  E'Le prix de 20 € est l''acompte pour la réservation + 0,94 € de frais de transaction.\n\nMerci de me contacter en DM pour m''indiquer la pose choisie.\n\nL''acompte n''est pas remboursable.',
  E'Un acompte de 20 € est demandé à la réservation. Il n''est pas remboursable.\n\nIndiquez la pose souhaitée dans la note de réservation, ou par message sur Instagram.');
update public.services set description = replace(description,
  E'Le prix de 20 € est l''acompte pour la réservation + 0,94 € de frais de transaction.\n\nL''acompte n''est pas remboursable.',
  E'Un acompte de 20 € est demandé à la réservation. Il n''est pas remboursable.');
update public.services set description = replace(description,
  E'Le prix de 20 € est l''acompte pour la réservation + 0,94 € de frais de transaction.',
  E'Un acompte de 20 € est demandé à la réservation. Il n''est pas remboursable.');
update public.services set description = replace(description,
  E'Le prix de 50 € est l''acompte pour la réservation.\n\nL''acompte n''est pas remboursable.',
  E'Un acompte de 50 € est demandé à la réservation. Il n''est pas remboursable.');
