#!/bin/bash
# Quick Start Script for Fortran Web Rings Application

echo "🔗 Torsion Rings Web Application - Quick Start"
echo "=============================================="
echo ""

# Check if server is running
if nc -z localhost 3001 2>/dev/null; then
  echo "✅ Server is already running on http://localhost:3001"
  echo ""
  echo "You can now:"
  echo "1. Open http://localhost:3001 in your browser"
  echo "2. Upload a data file (sample_data.dat is included)"
  echo "3. Configure torsion rings parameters"
  echo "4. Generate and download PostScript visualization"
  echo ""
  echo "To stop the server: Press Ctrl+C in the terminal"
  exit 0
fi

# Start server if not running
echo "📦 Checking dependencies..."
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js first."
  exit 1
fi

if ! command -v gfortran-mp-14 &> /dev/null; then
  echo "❌ gfortran-mp-14 not found. Please install GCC with Fortran support."
  exit 1
fi

echo "✅ Dependencies found"
echo ""

# Check if Fortran binary exists
if [ ! -f "fortran/nrings" ]; then
  echo "🔨 Compiling Fortran code..."
  cd fortran
  gfortran-mp-14 -o nrings nrings_web.f90
  if [ $? -eq 0 ]; then
    echo "✅ Fortran compilation successful"
  else
    echo "❌ Fortran compilation failed"
    exit 1
  fi
  cd ..
fi

# Check if client is built
if [ ! -d "client/dist" ]; then
  echo "🏗️  Building React frontend..."
  cd client
  npm run build
  if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
  else
    echo "❌ Frontend build failed"
    exit 1
  fi
  cd ..
fi

echo ""
echo "🚀 Starting server..."
npm start
