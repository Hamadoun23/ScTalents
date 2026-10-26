// Client Supabase partagé : créé une seule fois, importé partout ailleurs.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Tant que les clés ne sont pas renseignées, on exporte null au lieu de planter la page.
export const configured = SUPABASE_URL.startsWith('https://');

export const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

if (!configured) console.warn('Supabase non configuré : renseignez site/js/config.js');
