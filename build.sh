#!/bin/bash
set -e

echo "🔨 Installing root dependencies..."
npm install --legacy-peer-deps

echo "🔨 Building React client..."
cd client
npm install --legacy-peer-deps --include=dev
npm run build
cd ..

echo "🔨 Compiling Fortran..."
cd fortran
gfortran -o pdb_torsion pdb_torsion.f90 2>/dev/null || echo "⚠️  Fortran compilation skipped (may not be available)"
cd ..

echo "✅ Build complete!"
ls -lah client/dist/index.html || echo "⚠️  Warning: client/dist/index.html not found"
