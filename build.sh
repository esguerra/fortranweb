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
if command -v gfortran &> /dev/null; then
  gfortran -o pdb_torsion pdb_torsion.f90
  if [ -f pdb_torsion ]; then
    echo "✅ pdb_torsion compiled successfully"
  else
    echo "❌ Fortran compilation failed"
    exit 1
  fi
else
  echo "⚠️  gfortran not found - PDB processing will not be available"
fi
cd ..

echo "✅ Build complete!"
ls -lah client/dist/index.html || echo "⚠️  Warning: client/dist/index.html not found"
