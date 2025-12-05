import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine Python executable based on environment
const getPythonExecutable = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'python3'; // Use system python3 in production
  }
  // Local development - try conda environment first, fall back to system
  try {
    execSync('which /Users/esguerra/miniforge3/envs/pubchempy/bin/python3', { stdio: 'ignore' });
    return '/Users/esguerra/miniforge3/envs/pubchempy/bin/python3';
  } catch {
    return 'python3';
  }
};

const PYTHON_EXECUTABLE = getPythonExecutable();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from client dist
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
} else {
  console.warn(`⚠️  Client dist not found at ${clientDistPath}`);
}

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

    const { title } = req.body;
    const inputFile = req.file.path;
    const uploadDir = path.dirname(inputFile);
    const outputFilePng = path.join(uploadDir, 'rings.png');
    const outputFilePdf = path.join(uploadDir, 'rings.pdf');

    const titleStr = title || 'Torsion Rings';

    // Check if Python script exists
    const torsionRingsScript = path.join(__dirname, '../fortran/torsion_rings.py');
    if (!fs.existsSync(torsionRingsScript)) {
      return res.status(500).json({
        error: 'torsion_rings.py script not found.'
      });
    }

    // Execute Python script to generate PNG
    const { stdout: stdoutPng, stderr: stderrPng } = await execAsync(
      `${PYTHON_EXECUTABLE} ${torsionRingsScript} ${inputFile} -o ${outputFilePng} -t "${titleStr}" -f png`,
      { cwd: uploadDir, timeout: 30000 }
    );

    // Check if PNG output was created
    if (!fs.existsSync(outputFilePng)) {
      return res.status(500).json({
        error: 'Failed to generate PNG visualization',
        stderr: stderrPng || stdoutPng
      });
    }

    // Execute Python script to generate PDF
    const { stdout: stdoutPdf, stderr: stderrPdf } = await execAsync(
      `${PYTHON_EXECUTABLE} ${torsionRingsScript} ${inputFile} -o ${outputFilePdf} -t "${titleStr}" -f pdf`,
      { cwd: uploadDir, timeout: 30000 }
    );

    // Check if PDF output was created
    if (!fs.existsSync(outputFilePdf)) {
      return res.status(500).json({
        error: 'Failed to generate PDF visualization',
        stderr: stderrPdf || stdoutPdf
      });
    }

    // Read the PNG and PDF files as base64
    const pngContent = fs.readFileSync(outputFilePng, 'base64');
    const pdfContent = fs.readFileSync(outputFilePdf, 'base64');

    // Clean up temporary files
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFilePng);
    fs.unlinkSync(outputFilePdf);

    res.json({
      success: true,
      pngContent: pngContent,
      pdfContent: pdfContent,
      filename: `rings_${Date.now()}.png`
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
      return res.status(503).json({
        error: 'PDB processing unavailable',
        message: 'The Fortran compiler (gfortran) is not available in this environment. Please convert your PDB file to a .dat torsion angles file locally and upload that instead.',
        workaround: 'Extract torsion angles from your PDB file locally using pdb_torsion, save as .dat, and upload the .dat file.'
      });
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

    // If visualization is requested, generate PNG and PDF with torsion_rings.py
    let pngContent = null;
    let pdfContent = null;
    if (generateVisualization === 'true' || generateVisualization === true) {
      try {
        const torsionRingsScript = path.join(__dirname, '../fortran/torsion_rings.py');
        if (!fs.existsSync(torsionRingsScript)) {
          throw new Error('torsion_rings.py script not found.');
        }

        const pngFile = path.join(uploadDir, 'rings_pdb.png');
        const pdfFile = path.join(uploadDir, 'rings_pdb.pdf');
        const titleStr = title || 'PDB Torsion Rings';

        // Execute Python script to generate PNG
        const { stdout: pngStdout, stderr: pngStderr } = await execAsync(
          `${PYTHON_EXECUTABLE} ${torsionRingsScript} ${torsionFile} -o ${pngFile} -t "${titleStr}" -f png`,
          { cwd: uploadDir, timeout: 30000 }
        );

        // Check if PNG was created
        if (fs.existsSync(pngFile)) {
          pngContent = fs.readFileSync(pngFile, 'base64');
        }

        // Execute Python script to generate PDF
        const { stdout: pdfStdout, stderr: pdfStderr } = await execAsync(
          `${PYTHON_EXECUTABLE} ${torsionRingsScript} ${torsionFile} -o ${pdfFile} -t "${titleStr}" -f pdf`,
          { cwd: uploadDir, timeout: 30000 }
        );

        // Check if PDF was created
        if (fs.existsSync(pdfFile)) {
          pdfContent = fs.readFileSync(pdfFile, 'base64');
        }
      } catch (vizError) {
        console.warn('Visualization generation failed:', vizError.message);
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
      pngContent: pngContent,
      pdfContent: pdfContent,
      filename: `pdb_rings_${Date.now()}.png`,
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
  const indexPath = path.join(__dirname, '../client/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      error: 'index.html not found',
      path: indexPath,
      lookingFor: req.path
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.join(__dirname, '../uploads')}`);
});
