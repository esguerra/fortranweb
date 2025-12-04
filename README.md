# Torsion Rings Generator - Web Interface

A modern web application that executes Fortran code to generate protein conformation ring diagrams from PDB (Protein Data Bank) data files.

## Overview

This project provides an interactive web interface for generating torsion rings visualizations. The Fortran backend processes protein structural data and generates PostScript graphics that visualize dihedral angle conformations.

### Features

- **Modern Web Interface**: React-based frontend with intuitive UI
- **File Upload**: Support for `.dat`, `.pdb`, `.txt`, and `.in` file formats
- **Configurable Parameters**: Customize number of torsion types (1-7)
- **Custom Labels**: Add descriptive labels for each torsion ring
- **PostScript Export**: Generate publication-quality graphics
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
│   ├── nrings.f         # Original torsion rings generator
│   └── nrings_web.f90   # Web-optimized version
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

Process a data file and generate torsion rings visualization.

**Request:**
- Form data with multipart/form-data encoding
- `file`: Data file (.dat, .pdb, .txt, or .in)
- `torsionCount`: Number of torsion types (1-7)
- `labels`: JSON array of labels for each ring
- `title`: Title for the diagram

**Response:**
```json
{
  "success": true,
  "psContent": "PostScript content...",
  "filename": "rings_1234567890.ps"
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## Input Data Format

The input data file should contain torsion angle values in a tabular format:

```
   1     0.0    45.0    90.0   135.0   180.0  -135.0   -90.0
   2     5.0    50.0    95.0   140.0  -175.0  -130.0   -85.0
   3   999.0    55.0   100.0   145.0  -170.0  -125.0   999.0
```

- Each row represents a structure/frame
- Each column (after the first) represents a torsion type
- Use `999.0` for missing or undefined torsion values
- Values should be in degrees (-180 to 180 or 0 to 360)

## Usage Guide

1. **Upload a Data File**: Click the upload area and select your data file
2. **Set Torsion Count**: Choose how many different torsion types to visualize (1-7)
3. **Add Labels**: Enter descriptive labels for each torsion ring (e.g., α, β, γ)
4. **Set Title**: Give your diagram a descriptive title
5. **Generate**: Click "Generate Rings" to process the data
6. **Download**: Download the PostScript file for viewing/printing

## Viewing PostScript Output

The generated PostScript files can be viewed with:

- **macOS**: Preview, Ghostview
- **Linux**: Ghostview, Evince, PDF viewer (after conversion)
- **Windows**: GSview, Ghostscript

### Convert PostScript to PDF

```bash
ps2pdf rings.ps rings.pdf
```

## Fortran Code Details

The project includes two Fortran implementations:

### nrings.f
Original interactive version with command-line prompts. Used as reference and can be compiled standalone.

### nrings_web.f90
Modern Fortran 90 version optimized for programmatic input/output. Used by the web application.

**Key differences:**
- Reads all input from stdin
- Writes output to `rings.ps` directly
- Improved error handling
- Better code structure with subroutines

## Troubleshooting

### "gfortran: command not found"
Install gfortran using your package manager (see Prerequisites section)

### "Fortran compilation failed"
Ensure the Fortran source file exists at `fortran/nrings_web.f90`

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

### Adding New Features

1. Backend changes: Modify `server/index.js`
2. Frontend changes: Update `client/src/App.jsx` and styles
3. Fortran changes: Edit `fortran/nrings_web.f90` and recompile

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
