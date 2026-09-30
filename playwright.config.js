import {defineConfig} from '@playwright/test';

// No overrides for remote targets or real credentials: always build and serve locally.
const origin='http://127.0.0.1:4173';
const basePath='/encuesta-moniquira/';
export default defineConfig({
 testDir:'./tests/e2e',
 forbidOnly:!!process.env.CI,
 retries:0,
 workers:1,
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:origin+basePath,browserName:'chromium',serviceWorkers:'block',trace:'retain-on-failure'},
 projects:[
  {name:'desktop',use:{viewport:{width:1366,height:900}}},
  {name:'mobile',use:{viewport:{width:390,height:844}}}
 ],
 webServer:{
  command:'npm run build -- --mode e2e --outDir .e2e-dist && npm run preview -- --outDir .e2e-dist --port 4173 --strictPort',
  url:origin+basePath,
  reuseExistingServer:false,
  env:{
   VITE_BASE_PATH:basePath,
   VITE_SUPABASE_URL:'https://supabase.e2e.invalid',
   VITE_SUPABASE_ANON_KEY:'e2e-public-placeholder-not-a-credential'
  }
 }
});
