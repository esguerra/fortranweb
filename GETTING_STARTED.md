# Torsion Rings Generator - Getting Started Guide

## 🎉 Project Successfully Created!

Your web application for generating torsion rings from Fortran code is now ready to use. The server is currently running on **http://localhost:3001**.

## ✅ What's Included

### Project Structure
```
fortranweb/
├── server/                   # Node.js/Express backend
│   └── index.js             # API server with Fortran execution
├── client/                  # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main application component
│   │   ├── index.css       # Styling
│   │   └── main.jsx        # React entry point
│   └── dist/               # Built production files
├── fortran/                # Fortran source & compiled binary
│   ├── nrings.f           # Original Fortran source
│   ├── nrings_web.f90     # Modernized version for web
│   └── nrings             # Compiled executable
├── uploads/               # Temporary upload directory
└── sample_data.dat       # Example data file
```

### Technology Stack
- **Backend**: Node.js, Express.js
- **Frontend**: React 18, Vite, CSS3
- **Fortran**: gfortran-mp-14 compiler
- **File Upload**: Multer middleware
- **API**: RESTful with multipart/form-data support

## 🚀 Running the Application

### Current Status
✅ Server is running on http://localhost:3001
✅ Frontend is built and served by Express
✅ Fortran binary compiled and ready

### To Stop & Restart
```bash
# Stop the server (Ctrl+C in terminal)

# Restart the server
cd /Users/esguerra/development/fortranweb
npm start
```

### For Development (with auto-reload)
```bash
cd /Users/esguerra/development/fortranweb
npm run dev
```

## 📊 How to Use the Web Interface

1. **Open the Application**
   - Visit http://localhost:3001 in your web browser

2. **Upload a Data File**
   - Click the upload area or drag & drop
   - Supported formats: `.dat`, `.pdb`, `.txt`, `.in`
   - Example file: `sample_data.dat` in the project root

3. **Configure Parameters**
   - Select number of torsion types (1-7)
   - Add descriptive labels for each ring (α, β, γ, etc.)
   - Enter a title for your diagram

4. **Generate Visualization**
   - Click "⚡ Generate Rings"
   - The server processes the data with the Fortran program
   - A PostScript file is generated

5. **Download Results**
   - Click "📥 Download PostScript"
   - Save the `.ps` file for viewing

## 📁 Input Data Format

Your data file should contain torsion angles (one record per line):

```
   1     0.0    45.0    90.0   135.0   180.0  -135.0   -90.0
   2     5.0    50.0    95.0   140.0  -175.0  -130.0   -85.0
   3   999.0    55.0   100.0   145.0  -170.0  -125.0   999.0
```

**Format Rules:**
- First column: record number (can be any integer ID)
- Columns 2-8: Seven torsion angle values in degrees
- Use `999.0` for missing/undefined values
- Angles can be -180 to 180 or 0 to 360

## 🖨️ Viewing PostScript Output

### macOS
- **Preview**: Double-click the `.ps` file
- **Ghostview**: Install via Homebrew (`brew install ghostscript`)

### Convert to PDF
```bash
ps2pdf rings.ps rings.pdf
```

## 🔧 API Endpoints

### POST /api/process
Process a data file and generate torsion rings.

**Parameters:**
- `file`: Data file (multipart)
- `torsionCount`: Number (1-7)
- `labels`: JSON array of strings
- `title`: String (max 25 chars)

**Example using curl:**
```bash
curl -F "file=@sample_data.dat" \
     -F "torsionCount=3" \
     -F "labels=[\"α\",\"β\",\"γ\"]" \
     -F "title=Protein Structure" \
     http://localhost:3001/api/process
```

### GET /api/health
Check server status.

```bash
curl http://localhost:3001/api/health
```

## 📝 File Locations

| File | Purpose |
|------|---------|
| `/server/index.js` | Express API server |
| `/client/src/App.jsx` | React frontend component |
| `/fortran/nrings` | Compiled executable |
| `/fortran/nrings_web.f90` | Fortran 90 source |
| `/uploads/` | Temporary upload storage |
| `sample_data.dat` | Example input file |

## 🧪 Testing

### Test with Sample Data
1. Visit http://localhost:3001
2. Upload `sample_data.dat`
3. Set torsion count to 3
4. Add labels: α, β, γ
5. Set title: "Test Rings"
6. Click "Generate Rings"
7. Download the PostScript file

### Command-Line Testing
```bash
# Test Fortran binary directly
cd /Users/esguerra/development/fortranweb/uploads
echo -e "/Users/esguerra/development/fortranweb/sample_data.dat\n3\n1\n2\n3\nα\nβ\nγ\nTest" | \
  /Users/esguerra/development/fortranweb/fortran/nrings
```

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Use a different port
PORT=3002 npm start
```

### Fortran compilation errors
```bash
# Recompile manually
cd fortran/
gfortran-mp-14 -o nrings nrings_web.f90
```

### File upload fails
```bash
# Ensure uploads directory exists
mkdir -p /Users/esguerra/development/fortranweb/uploads
chmod 755 /Users/esguerra/development/fortranweb/uploads
```

### PostScript file is empty
- Check that data file format is correct
- Verify torsion indices match your data columns
- Check server logs for error messages

## 📚 Further Development

### Adding New Features
1. **Backend**: Edit `/server/index.js`
2. **Frontend**: Edit `/client/src/App.jsx`
3. **Styling**: Update `/client/src/index.css`
4. **Fortran**: Edit `/fortran/nrings_web.f90` and recompile

### Rebuilding Frontend
```bash
cd client
npm run build
cd ..
npm start
```

### Development with Hot Reload
```bash
npm run dev
```
Then access on http://localhost:5173 (React dev server)

## 📖 References

**Original Paper:**
> Yeast trna phe conformation wheels: a novel probe of the monoclinic and orthorhombic models.
> A. R. Srinivasan and Wilma K. Olson
> Nucleic Acids Research 8, 2307-2330 (1980).

**PostScript Documentation:**
- [PostScript Language Reference Manual](https://www.adobe.io/content/dam/udp/assets/open/ps/sdk/PostScript%20Language%20Reference%20Manual.pdf)

## 💡 Tips

1. **Generate multiple visualizations**: Upload different data files to compare
2. **Batch processing**: The API can be called programmatically from scripts
3. **Custom labels**: Use Greek letters (α, β, γ, δ, ε, ζ, η) for scientific notation
4. **Print quality**: PostScript files are resolution-independent and ideal for printing

## 🆘 Need Help?

- Check the console logs (server terminal output)
- Review browser console for frontend errors (F12)
- Verify data file format matches the expected structure
- Ensure all dependencies are installed: `npm install` in both root and client directories

---

**Project Created**: December 4, 2025
**Server Status**: ✅ Running on http://localhost:3001
