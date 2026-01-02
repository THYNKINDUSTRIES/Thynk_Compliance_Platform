import { supabase } from '../lib/supabase';
import { MOCK_REGULATIONS } from '../data/regulations';
import { EXTENDED_REGULATIONS } from '../data/extendedRegulations';
import { ADDITIONAL_REGULATIONS } from '../data/moreRegulations';

const allRegulations = [
  ...MOCK_REGULATIONS,
  ...EXTENDED_REGULATIONS,
  ...ADDITIONAL_REGULATIONS,
];

export async function migrateRegulations() {
  console.log('Starting migration...');

  for (const reg of allRegulations) {
    try {
      // Get or create jurisdiction
      let { data: jurisdiction } = await supabase
        .from('jurisdiction')
        .select('id')
        .eq('name', reg.jurisdiction)
        .single();

      if (!jurisdiction) {
        const { data: newJuris, error: jurisError } = await supabase
          .from('jurisdiction')
          .insert({
            name: reg.jurisdiction,
            type: reg.jurisdiction === 'Federal' ? 'federal' : 'state',
            slug: reg.jurisdiction.toLowerCase().replace(/\s+/g, '-'),
          })
          .select('id')
          .single();

        if (jurisError) throw jurisError;
        jurisdiction = newJuris;
      }

      // Get or create authority
      let { data: authority } = await supabase
        .from('authority')
        .select('id')
        .eq('acronym', reg.authority)
        .single();

      if (!authority) {
        const { data: newAuth, error: authError } = await supabase
          .from('authority')
          .insert({
            name: reg.authority,
            acronym: reg.authority,
            jurisdiction_id: jurisdiction?.id,
          })
          .select('id')
          .single();

        if (authError) throw authError;
        authority = newAuth;
      }

      // Insert regulation
      const { error: regError } = await supabase.from('instrument').insert({
        title: reg.title,
        summary: reg.summary,
        jurisdiction_id: jurisdiction?.id,
        authority_id: authority?.id,
        status: reg.status,
        products: reg.products,
        stages: reg.stages,
        instrument_type: reg.instrumentType,
        published_at: reg.publishedAt,
        effective_at: reg.effectiveAt || null,
        citation: reg.citation,
        url: reg.url,
        impact: reg.impact,
      });

      if (regError) throw regError;
      console.log(`✓ Migrated: ${reg.title}`);
    } catch (error) {
      console.error(`✗ Failed to migrate: ${reg.title}`, error);
    }
  }

  console.log('Migration complete!');
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateRegulations();
}
