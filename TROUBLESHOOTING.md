# Troubleshooting Guide

## Issue: "PDB processing unavailable" Error

### Status: FIXED ✅

As of the latest deployment, PDB file processing has been enabled on Render.com by converting the `pdb_torsion` tool from Fortran to C. Both `.dat` and `.pdb` files should now work on the production website.

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

