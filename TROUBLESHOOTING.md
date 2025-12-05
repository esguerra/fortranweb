# Troubleshooting Guide

## Issue: "PDB processing unavailable" Error

### What's happening?
You're trying to upload a `.pdb` file, but the Fortran compiler (`gfortran`) is not available in the production environment on Render.com. The `pdb_torsion` binary, which extracts torsion angles from PDB files, requires Fortran compilation and cannot be compiled on Render's Linux environment.

### Why?
- **Local development**: Your machine has gfortran installed, so everything works
- **Render.com**: The Linux environment doesn't have Fortran tools available, so the binary can't be compiled

### Solution: Use `.dat` files instead

You have two options:

#### Option 1: Convert locally and upload `.dat` file (Recommended)
1. On your local machine, run the `pdb_torsion` binary yourself:
   ```bash
   cd fortran
   ./pdb_torsion your_file.pdb output.dat
   ```

2. Upload the generated `output.dat` file to the web application
3. The visualization will be generated successfully

#### Option 2: Use online PDB tools
1. Visit https://www.rcsb.org/structure/XXXX (replace XXXX with your PDB ID)
2. Download the structure and process locally using Step 1 above

### Testing the `.dat` workflow
1. Go to https://conformation-wheels.onrender.com
2. Upload any `.dat` file (e.g., from the `test_data` folder)
3. Click "Process"
4. PNG and PDF visualizations should be generated successfully

### For developers: Enabling PDB processing on Render

To enable PDB file processing on production, you would need to:

1. **Option A: Docker approach** - Configure Render to use a Docker container with gfortran pre-installed
2. **Option B: Pre-compiled binary** - Commit a pre-compiled `pdb_torsion` binary (risky due to Linux compatibility)
3. **Option C: Alternative tool** - Use a different method to extract PDB angles that doesn't require Fortran compilation

### Local development
`.dat` and `.pdb` files both work locally since gfortran is available:
```bash
npm run dev
# Both endpoints work:
# - /api/process (for .dat files)
# - /api/process-pdb (for .pdb files)
```

### Workaround if you only have `.pdb` files
If you need to process PDB files without local Fortran tools:
1. Use an online Ramachandran plot tool or PDB analysis tool to extract torsion angles
2. Create a `.dat` file with the format: `<residue_number> <phi> <psi> <omega> <alpha> <beta> <gamma> <delta> <epsilon> <zeta> <chi>`
3. Upload the `.dat` file

---

## Other issues?

### "File not uploaded" error
- Make sure you selected a file
- Supported formats: `.dat`, `.pdb`, `.txt`, `.in`

### "Processing failed" error
- Check file format matches expected format
- Try with a `.dat` file first to test
- Check browser console for detailed error messages

### Visualization not showing
- Ensure the file has valid torsion angle data
- PNG might take a few seconds to generate
- Try refreshing the page

