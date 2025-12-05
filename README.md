# Torsion Rings Generator - Web Interface

A modern web application that executes Fortran code to generate protein conformation ring diagrams from PDB (Protein Data Bank) data files.

## Overview

This project provides an interactive web interface for generating torsion rings visualizations. The Fortran backend processes protein structural data (PDB files) to extract backbone torsion angles and generates SVG graphics that visualize dihedral angle conformations in concentric ring format, based on the classic Srinivasan & Olson (1980) visualization method.

### Features

- **Modern Web Interface**: React-based frontend with intuitive UI
- **PDB File Processing**: Direct reading of PDB files to extract backbone coordinates
- **Backbone Torsion Angles**: Automatic calculation of all 7 backbone angles:
  - α (alpha): P(n-1) - O5'(n) - C5'(n) - C4'(n)
  - β (beta): O5'(n) - C5'(n) - C4'(n) - C3'(n)
  - γ (gamma): C5'(n) - C4'(n) - C3'(n) - O3'(n)
  - δ (delta): C4'(n) - C3'(n) - O3'(n) - P(n+1)
  - ε (epsilon): C3'(n) - O3'(n) - P(n+1) - O5'(n+1)
  - ζ (zeta): O3'(n) - P(n+1) - O5'(n+1) - C5'(n+1)
  - χ (chi): O4'(n) - C1'(n) - N - C(base)
- **SVG Visualization**: 7 concentric rings (one per torsion type) with residue segments
- **Color-Coded Rings**: Each torsion angle has a distinct color for easy identification
- **File Upload**: Support for `.dat` (pre-calculated angles), `.pdb` (protein structure) files
- **Real-time Processing**: Fast Fortran backend execution

## Project Structure

```
fortranweb/
├── server/               # Node.js/Express backend
│   └── index.js         # API endpoints and Fortran integration
├── client/              # React frontend
│   ├── src/
│   │   ├── App.jsx      # Main application component
│   │   ├── App.css      # Application styles
│   │   ├── index.css    # Global styles
│   │   └── main.jsx     # React entry point
│   ├── index.html       # HTML template
│   ├── vite.config.js   # Vite configuration
│   └── package.json     # Client dependencies
├── fortran/             # Fortran source code
│   ├── pdb_torsion.f90      # PDB parser and torsion angle calculator
│   ├── nrings_svg.f90       # SVG concentric rings generator
│   ├── nrings.f             # Original PostScript generator (reference)
│   └── test data files
├── uploads/             # Temporary upload directory
├── package.json         # Project dependencies
└── README.md            # This file
```

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **gfortran** (GNU Fortran compiler)

### Install gfortran

**macOS (Homebrew):**
```bash
brew install gcc
```

**Ubuntu/Debian:**
```bash
sudo apt-get install gfortran
```

**Fedora/RHEL:**
```bash
sudo dnf install gcc-fortran
```

## Installation & Setup

1. **Navigate to project directory:**
```bash
cd /Users/esguerra/development/fortranweb
```

2. **Install dependencies:**
```bash
npm install
cd client && npm install && cd ..
```

3. **Compile Fortran code:**
```bash
npm run compile:fortran
```

This compiles the Fortran source into an executable binary that the server uses.

## Running the Application

### Development Mode

Start both the backend server and frontend development server:

```bash
npm run dev
```

This will:
- Start the Node.js server on `http://localhost:3001`
- Start the React dev server (usually on `http://localhost:5173`)
- Open the application in your default browser

### Production Build

Build the React frontend for production:

```bash
npm run build
```

Then start the server:

```bash
npm start
```

The application will be available at `http://localhost:3001`

## API Endpoints

### POST /api/process

Process a pre-calculated torsion angles data file and generate SVG visualization.

**Request:**
- Form data with multipart/form-data encoding
- `file`: Data file (.dat format with angle values)

**Response:**
```json
{
  "success": true,
  "svgContent": "<svg>...</svg>",
  "torsionData": {...}
}
```

### POST /api/process-pdb

Process a PDB file to extract coordinates, calculate backbone torsion angles, and generate SVG visualization.

**Request:**
- Form data with multipart/form-data encoding
- `file`: PDB structure file

**Response:**
```json
{
  "success": true,
  "svgContent": "<svg>...</svg>",
  "torsionContent": "Residue  Alpha  Beta  Gamma  Delta  Epsilon  Zeta  Chi...",
  "residueCount": 62
}
```

## Input Data Format

### Option 1: Pre-calculated Torsion Angles (.dat)

Tab-separated or space-separated format with residue number and angle values:

```
Residue  Alpha    Beta    Gamma   Delta  Epsilon   Zeta      Chi
------- -------- ------- ------- ------- -------- ------- -------
      1     0.0    45.0    90.0   135.0   180.0  -135.0   -90.0
      2     5.0    50.0    95.0   140.0  -175.0  -130.0   -85.0
      3   999.0    55.0   100.0   145.0  -170.0  -125.0   999.0
```

Use `999.0` for missing or undefined torsion values.

### Option 2: Protein Structure File (.pdb)

Standard Protein Data Bank format. The application will:
1. Parse all ATOM records
2. Extract backbone atom coordinates
3. Calculate all 7 backbone torsion angles automatically
4. Generate visualization directly

## Usage Guide

1. **Upload a Data File**: Click the upload area to select either a `.dat` file or `.pdb` file
2. **For .dat files**: Torsion angles are extracted and visualized directly
3. **For .pdb files**: Backbone coordinates are parsed, torsion angles calculated, then visualized
4. **View Result**: SVG visualization shows 7 concentric rings (one per torsion angle) with color-coded segments
5. **Download**: The visualization is displayed in-browser and can be saved as SVG

## Fortran Code Details

The project includes specialized Fortran programs for processing protein structures:

### pdb_torsion.f90

Parses PDB files and calculates backbone torsion angles.

**Features:**
- Reads standard PDB ATOM records with fixed-format columns
- Extracts backbone atom coordinates (P, O5', C5', C4', C3', O3', C1', O4', N, base carbons)
- Calculates all 7 backbone torsion angles with proper dihedral geometry
- Handles missing atoms gracefully (outputs 999.0 for undefined angles)
- Outputs tab-separated angle values for each residue

**Usage:**
```bash
./pdb_torsion input.pdb output.dat
```

### nrings_svg.f90

Generates SVG visualization of torsion angles in concentric ring format.

**Features:**
- Reads tab-separated torsion angle data
- Creates 7 concentric rings (one per angle type)
- Each ring divided into segments for residues
- Color-coded by angle type (red=α, green=β, blue=γ, etc.)
- Generates standard SVG format for browser display
- Reference circles and center point for angle reference

**Usage:**
```bash
./nrings_svg input.dat output.svg "Title"
```

### nrings.f

Original PostScript generator (provided for reference). Can be compiled standalone with:

```bash
gfortran -o nrings nrings.f
```

## Troubleshooting

### "gfortran: command not found"

Install gfortran using your package manager (see Prerequisites section)

### "Fortran compilation failed"

Ensure the Fortran source files exist in `fortran/pdb_torsion.f90` and `fortran/nrings_svg.f90`

### "Port 3001 already in use"

Change the port by setting the PORT environment variable:

```bash
PORT=3002 npm start
```

### "File upload fails"

Ensure the `uploads/` directory exists and is writable. The server creates it automatically on first upload.

## Development

### Project Stack

- **Frontend**: React 18, Vite, CSS3
- **Backend**: Express.js, Node.js
- **Compiler**: gfortran (Fortran 77/90)
- **Build Tools**: npm, Vite
- **Package Manager**: npm

### Key Algorithm: Dihedral Angle Calculation

The torsion angles are computed using the dihedral angle formula. For atoms A-B-C-D:

$$\phi = \text{atan2}((\vec{BA} \times \vec{BC}) \cdot \vec{CD}, (\vec{BC} \times \vec{CD}) \cdot \vec{BA})$$

Where cross products and dot products are used to determine the angle and proper quadrant.

### Adding New Features

1. Backend changes: Modify `server/index.js`
2. Frontend changes: Update `client/src/App.jsx` and styles
3. Fortran PDB parser: Edit `fortran/pdb_torsion.f90` and recompile
4. Fortran SVG generator: Edit `fortran/nrings_svg.f90` and recompile

## References

Original Paper:
> Yeast trna phe conformation wheels: a novel probe of the monoclinic and orthorhombic models.
> A. R. Srinivasan and Wilma K. Olson
> Nucleic Acids Research 8, 2307-2330 (1980).

## License

This project integrates legacy Fortran code. Check original source for licensing information.

## Support & Contact

For issues or questions about the web interface, please check the README or review the error messages provided by the application.

---

**Last Updated**: December 2025
