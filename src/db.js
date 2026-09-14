import {createClient} from '@supabase/supabase-js';
import {createTimedFetch} from './network';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const db=url&&key?createClient(url,key,{auth:{persistSession:false},global:{fetch:createTimedFetch()}}):null;
