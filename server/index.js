import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept .dat, .pdb, and text files
    const allowedExtensions = ['.dat', '.pdb', '.txt', '.in'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .dat, .pdb, .txt, and .in files are allowed'));
    }
  }
});

/**
 * POST /api/process
 * Upload a data file and process it with SVG visualization
 */
app.post('/api/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { torsionCount, labels, title } = req.body;
    const inputFile = req.file.path;
    const uploadDir = path.dirname(inputFile);
    const outputFile = path.join(uploadDir, 'rings.svg');

    // Validate parameters
    if (!torsionCount || isNaN(parseInt(torsionCount))) {
      return res.status(400).json({ error: 'Invalid torsion count' });
    }

    const titleStr = title || 'Torsion Rings';

    // Check if nrings_svg binary exists
    const nringsSvgBinary = path.join(__dirname, '../fortran/nrings_svg');
    if (!fs.existsSync(nringsSvgBinary)) {
      return res.status(500).json({
        error: 'nrings_svg binary not found. Please compile it first.'
      });
    }

    // Execute nrings_svg program to generate SVG
    const { stdout, stderr } = await execAsync(
      `${nringsSvgBinary} ${inputFile} ${outputFile} "${titleStr}"`,
      { cwd: uploadDir, timeout: 30000 }
    );

    // Check if output was created
    if (!fs.existsSync(outputFile)) {
      return res.status(500).json({
        error: 'Failed to generate SVG visualization',
        stderr: stderr || stdout
      });
    }

    // Read the SVG file
    const svgContent = fs.readFileSync(outputFile, 'utf-8');

    // Clean up temporary files
    fs.unlinkSync(inputFile);

    res.json({
      success: true,
      svgContent: svgContent,
      filename: `rings_${Date.now()}.svg`
    });

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({
      error: 'Processing failed',
      details: error.message
    });
  }
});

/**
 * POST /api/process-pdb
 * Upload a PDB file and process it with pdb_torsion to extract angles,
 * then optionally send to nrings_web for visualization
 */
app.post('/api/process-pdb', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { generateVisualization, labels, title } = req.body;
    const pdbFile = req.file.path;
    const uploadDir = path.dirname(pdbFile);
    const torsionFile = path.join(uploadDir, 'torsion_angles.dat');

    // Check if pdb_torsion binary exists
    const pdbTorsionBinary = path.join(__dirname, '../fortran/pdb_torsion');
    if (!fs.existsSync(pdbTorsionBinary)) {
      throw new Error('pdb_torsion binary not found. Please compile it first.');
    }

    // Execute pdb_torsion to extract angles
    const { stdout, stderr } = await execAsync(
      `${pdbTorsionBinary} ${pdbFile} ${torsionFile}`,
      { cwd: uploadDir, timeout: 30000 }
    );

    // Check if torsion file was created
    if (!fs.existsSync(torsionFile)) {
      return res.status(500).json({
        error: 'Failed to extract torsion angles from PDB',
        stderr: stderr || stdout
      });
    }

    // Read the torsion angles file
    const torsionContent = fs.readFileSync(torsionFile, 'utf-8');

    // If visualization is requested, generate SVG with nrings_svg
    let svgContent = null;
    if (generateVisualization === 'true' || generateVisualization === true) {
      try {
        const nringsSvgBinary = path.join(__dirname, '../fortran/nrings_svg');
        if (!fs.existsSync(nringsSvgBinary)) {
          throw new Error('nrings_svg binary not found. Please compile it first.');
        }

        const svgFile = path.join(uploadDir, 'rings_pdb.svg');
        const titleStr = title || 'PDB Torsion Rings';

        // Execute nrings_svg to generate SVG
        const { stdout: nringStdout, stderr: nringStderr } = await execAsync(
          `${nringsSvgBinary} ${torsionFile} ${svgFile} "${titleStr}"`,
          { cwd: uploadDir, timeout: 30000 }
        );

        // Check if SVG was created
        if (fs.existsSync(svgFile)) {
          svgContent = fs.readFileSync(svgFile, 'utf-8');
        }
      } catch (vizError) {
        console.warn('SVG visualization generation failed:', vizError.message);
        // Continue without visualization
      }
    }

    // Clean up temporary files
    fs.unlinkSync(pdbFile);
    if (fs.existsSync(torsionFile)) {
      fs.unlinkSync(torsionFile);
    }

    res.json({
      success: true,
      torsionAngles: torsionContent,
      svgContent: svgContent,
      filename: `pdb_rings_${Date.now()}.svg`,
      message: 'PDB processed successfully'
    });

  } catch (error) {
    console.error('PDB processing error:', error);
    res.status(500).json({
      error: 'PDB processing failed',
      details: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

/**
 * Compile Fortran source if binary doesn't exist
 */
async function compileFortran() {
  try {
    const sourceFile = path.join(__dirname, '../fortran/nrings_web.f90');
    const binaryPath = path.join(__dirname, '../fortran/nrings');

    if (!fs.existsSync(sourceFile)) {
      throw new Error('Fortran source file not found');
    }

    console.log('Compiling Fortran source...');
    const { stdout, stderr } = await execAsync(`gfortran-mp-14 -o ${binaryPath} ${sourceFile}`);
    console.log('Fortran compilation successful');
    return binaryPath;
  } catch (error) {
    console.error('Fortran compilation failed:', error);
    throw error;
  }
}

// Catch-all for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.join(__dirname, '../uploads')}`);
});
