const { build } = require('esbuild');
const { dependencies } = require('./package.json');

// Consider all dependencies as external to avoid bundling them
const external = Object.keys(dependencies);

async function runBuild() {
  try {
    await build({
      entryPoints: ['src/server.ts'],
      bundle: true,
      platform: 'node',
      target: 'node16', 
      outfile: 'dist/server.js',
      external,
      minify: process.env.NODE_ENV === 'production',
      sourcemap: process.env.NODE_ENV !== 'production',
    });
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

runBuild();
