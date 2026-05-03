#!/usr/bin/env node

import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join } from 'path';


// Helper to count files in directory
function countFiles(dir, extension) {
  try {
    if (!existsSync(dir)) return 0;
    return readdirSync(dir).filter((f) => f.endsWith(extension)).length;
  } catch {
    return 0;
  }
}

// Helper to count directories
function countDirs(dir) {
  try {
    if (!existsSync(dir)) return 0;
    return readdirSync(dir).filter((f) => {
      try {
        return statSync(join(dir, f)).isDirectory();
      } catch {
        return false;
      }
    }).length;
  } catch {
    return 0;
  }
}

// Check Build System
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  const viteConfig =
    existsSync('vite.config.ts') || existsSync('vite.config.js');

    packageJson.scripts?.build
      ? '  ✅ Build script present'
      : '  ❌ Build script missing'
  );
    `  Status: ${viteConfig && packageJson.scripts?.build ? 'CONFIGURED' : 'INCOMPLETE'}\n`
  );
} catch (error) {
}

// Check Supabase
try {
  const envContent = existsSync('.env') ? readFileSync('.env', 'utf-8') : '';
  const hasUrl = envContent.includes('VITE_SUPABASE_URL=');
  const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY=');

    hasKey ? '  ✅ Anon key configured' : '  ❌ Anon key not configured'
  );

  const migrations = countFiles('supabase/migrations', '.sql');

  const functions = countDirs('supabase/functions');

} catch (error) {
}

// Check AWS ECS deployment config
try {
  const hasTaskDef = existsSync('aws/ecs-task-lms.json') && existsSync('aws/ecs-task-admin.json');
  const hasDockerfile = existsSync('Dockerfile.package');
  const hasWorkflow = existsSync('.github/workflows/deploy-aws.yml');
  console.log(hasTaskDef && hasDockerfile && hasWorkflow
    ? '  ✅ AWS ECS deployment configured'
    : '  ❌ AWS ECS deployment incomplete');
} catch (error) {
}

// Check Cloudflare Workers
try {
  const wranglerToml = existsSync('wrangler.toml')
    ? readFileSync('wrangler.toml', 'utf-8')
    : '';
  const hasWorker = wranglerToml.includes('name = ');
  const hasAccountId = wranglerToml.includes('account_id = ');

  // Check for worker file in multiple locations
  const workerFile =
    existsSync('src/worker.js') ||
    existsSync('workers/autopilot-deploy-worker.ts') ||
    wranglerToml.includes('main = ');

    hasWorker ? '  ✅ Worker configured' : '  ❌ Worker not configured'
  );
    hasAccountId ? '  ✅ Account ID present' : '  ❌ Account ID missing'
  );
    workerFile ? '  ✅ Worker file exists' : '  ❌ Worker file missing'
  );

    `  Status: ${hasWorker && hasAccountId && workerFile ? 'CONFIGURED' : 'INCOMPLETE'}\n`
  );
} catch (error) {
}

// Check Environment Variables
try {
  const envContent = existsSync('.env') ? readFileSync('.env', 'utf-8') : '';

  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'JWT_SECRET',
  ];

  const optionalVars = [
    'STRIPE_SECRET_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'OPENAI_API_KEY',
    'CLOUDFLARE_API_TOKEN',
  ];

  requiredVars.forEach((varName) => {
    const hasVar = envContent.includes(`${varName}=`);
  });

  optionalVars.forEach((varName) => {
    const hasVar = envContent.includes(`${varName}=`);
  });

  const allRequired = requiredVars.every((v) => envContent.includes(`${v}=`));
} catch (error) {
}

// Final Summary

try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  const viteConfig =
    existsSync('vite.config.ts') || existsSync('vite.config.js');
  const buildConfigured = viteConfig && packageJson.scripts?.build;

  const envContent = existsSync('.env') ? readFileSync('.env', 'utf-8') : '';
  const supabaseConfigured =
    envContent.includes('VITE_SUPABASE_URL=') &&
    envContent.includes('VITE_SUPABASE_ANON_KEY=');

  const awsConfigured = existsSync('aws/ecs-task-lms.json') && existsSync('Dockerfile.package');

  const wranglerToml = existsSync('wrangler.toml')
    ? readFileSync('wrangler.toml', 'utf-8')
    : '';
  const workerFile =
    existsSync('src/worker.js') ||
    existsSync('workers/autopilot-deploy-worker.ts') ||
    wranglerToml.includes('main = ');
  const cloudflareConfigured =
    wranglerToml.includes('name = ') &&
    wranglerToml.includes('account_id = ') &&
    workerFile;

  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'JWT_SECRET',
  ];
  const envConfigured = requiredVars.every((v) => envContent.includes(`${v}=`));

    `${buildConfigured ? '✅' : '❌'} Build System: ${buildConfigured ? 'CONFIGURED' : 'INCOMPLETE'}`
  );
    `${supabaseConfigured ? '✅' : '❌'} Supabase: ${supabaseConfigured ? 'CONFIGURED' : 'INCOMPLETE'}`
  );
    `${awsConfigured ? '✅' : '❌'} AWS ECS: ${awsConfigured ? 'CONFIGURED' : 'INCOMPLETE'}`
  );
    `${cloudflareConfigured ? '✅' : '❌'} Cloudflare Workers: ${cloudflareConfigured ? 'CONFIGURED' : 'INCOMPLETE'}`
  );
    `${envConfigured ? '✅' : '❌'} Environment Variables: ${envConfigured ? 'CONFIGURED' : 'INCOMPLETE'}`
  );

  const allConfigured =
    buildConfigured &&
    supabaseConfigured &&
    awsConfigured &&
    cloudflareConfigured &&
    envConfigured;

  if (allConfigured) {
    process.exit(0);
  } else {
    process.exit(1);
  }
} catch (error) {
  process.exit(1);
}
