# Development Guide

## Project Architecture

### Backend (Node.js/Express)
The backend server handles:
- HTTP API endpoints
- File upload management
- Fortran program execution
- PostScript file generation

**Key Features:**
- Multer middleware for file uploads
- CORS support for cross-origin requests
- Dynamic Fortran compilation if binary missing
- Error handling and validation

### Frontend (React/Vite)
Modern React application with:
- File upload with drag-and-drop
- Form validation
- API integration
- PostScript download
- Responsive design

**Components:**
- App.jsx: Main component with state management
- index.css: Global styling and responsive design
- Vite configuration for development/production builds

### Fortran Backend
Modern Fortran 90 program that:
- Reads structured torsion angle data
- Generates concentric circle diagrams
- Renders data points colored by torsion type
- Outputs publication-quality PostScript graphics

## Setup for Development

### Prerequisites
```bash
# Install Node.js (if not already installed)
# Install gfortran-mp-14
brew install gcc

# Verify installations
node --version
npm --version
gfortran-mp-14 --version
```

### First-Time Setup
```bash
cd /Users/esguerra/development/fortranweb

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..

# Compile Fortran
cd fortran
gfortran-mp-14 -o nrings nrings_web.f90
cd ..

# Build frontend
cd client
npm run build
cd ..
```

## Running in Development Mode

### Start with Auto-Reload
```bash
npm run dev
```

This runs:
- Backend with nodemon (auto-restarts on file changes)
- Frontend with Vite dev server (hot module replacement)

### Start Production Server
```bash
npm start
```

Runs on http://localhost:3001 (or PORT env var)

## File Structure

```
fortranweb/
├── server/
│   └── index.js                 # Express server (150 lines)
│       ├── POST /api/process   # Main processing endpoint
│       ├── GET /api/health     # Health check
│       └── compileFortran()    # On-demand compilation
│
├── client/
│   ├── src/
│   │   ├── App.jsx             # React component (320 lines)
│   │   ├── App.css             # Component styles (20 lines)
│   │   ├── index.css           # Global styles (380 lines)
│   │   └── main.jsx            # Entry point (10 lines)
│   ├── index.html              # HTML template
│   ├── vite.config.js          # Vite configuration
│   └── package.json            # Client dependencies
│
├── fortran/
│   ├── nrings.f                # Original Fortran (329 lines)
│   ├── nrings_web.f90          # Web version (290 lines)
│   └── nrings                  # Compiled binary
│
├── server/index.js             # Backend server
├── package.json                # Backend dependencies
├── README.md                   # Full documentation
├── GETTING_STARTED.md          # User guide
├── DEVELOPMENT.md              # This file
├── sample_data.dat             # Example data file
└── uploads/                    # Upload directory (auto-created)
```

## API Development

### Adding New Endpoints

Example: Add a status endpoint
```javascript
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

### Modifying the Process Endpoint

Current flow:
1. Validate input
2. Save uploaded file
3. Create stdin with parameters
4. Execute Fortran binary
5. Read output file
6. Return PostScript content

To modify, edit `/server/index.js` around line 50-100.

## Frontend Development

### Adding New UI Elements

The App component uses React hooks:
- `useState`: State management
- Event handlers: Form submission, file input
- Conditional rendering: Show/hide based on state

### Styling
Global styles in `client/src/index.css`:
- CSS Grid for layouts
- Flexbox for components
- CSS variables for colors
- Mobile-responsive breakpoints

### Building for Production
```bash
cd client
npm run build
```

Creates optimized bundle in `client/dist/`

## Fortran Development

### Current Implementation (nrings_web.f90)
- Modern Fortran 90 syntax
- Modular structure with contained subroutines
- Error handling with iostat
- 290 lines of code

### Key Subroutines
- `set_color(ring_num, col)`: Maps ring number to color code
- `colnum(col, c1, c2, c3)`: Converts color name to RGB values

### Modifying Fortran Code

1. Edit `fortran/nrings_web.f90`
2. Recompile:
   ```bash
   cd fortran
   gfortran-mp-14 -o nrings nrings_web.f90
   ```
3. Test with sample data
4. Restart Node server if needed

### Adding New Features to Fortran
- Input validation
- Multiple output formats (SVG, PDF)
- Additional visualization options
- Statistical calculations

## Testing

### Manual Testing
1. Upload `sample_data.dat`
2. Set different torsion counts (1-7)
3. Verify output PostScript files
4. Test edge cases (999.0 values, negative angles)

### Automated Testing
Create `test.js`:
```javascript
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function test() {
  const form = new FormData();
  form.append('file', fs.createReadStream('sample_data.dat'));
  form.append('torsionCount', 3);
  form.append('labels', JSON.stringify(['α', 'β', 'γ']));
  form.append('title', 'Test');
  
  const response = await axios.post(
    'http://localhost:3001/api/process',
    form,
    { headers: form.getHeaders() }
  );
  
  console.log('Success:', response.data.success);
  fs.writeFileSync('output.ps', response.data.psContent);
}

test();
```

## Debugging

### Server Debugging
```bash
# Start with verbose logging
DEBUG=* npm start

# Or manually add logs in server/index.js
console.log('Input:', req.body);
```

### Frontend Debugging
- Open browser DevTools (F12)
- Check Console tab for errors
- Network tab to inspect API calls
- React DevTools browser extension

### Fortran Debugging
```bash
# Add debug symbols during compilation
gfortran-mp-14 -g -o nrings nrings_web.f90

# Run with debugger
gdb ./nrings
```

## Performance Optimization

### Backend
- Cache compiled Fortran binary
- Implement request queuing for large files
- Add result caching
- Optimize file I/O

### Frontend
- Code splitting with Vite
- Lazy load components
- Optimize images/assets
- Implement progressive uploads

### Fortran
- Algorithm optimization
- Memory management
- Parallel processing (OpenMP)

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Port 3001 in use | Another process | `lsof -i :3001` then kill process or use different port |
| Fortran not found | Wrong compiler | `which gfortran-mp-14` and verify installation |
| Upload fails | Permission denied | `chmod 755 uploads/` |
| Blank output | Bad data format | Verify data file format matches spec |
| Slow startup | npm cache issues | `npm cache clean --force` |

## Deployment

### Production Build
```bash
# Build frontend
cd client
npm run build
cd ..

# Start production server
PORT=80 npm start
```

### Docker (Optional)
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN cd client && npm install && npm run build && cd ..
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t fortran-web-rings .
docker run -p 3001:3001 fortran-web-rings
```

## Git Workflow

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Torsion rings web application"

# Useful ignore patterns are in .gitignore
```

## Code Standards

### JavaScript
- Use ES6+ syntax
- Consistent indentation (2 spaces)
- Meaningful variable names
- Comments for complex logic

### React
- Functional components with hooks
- Props validation
- Separate concerns
- Reusable components

### Fortran
- Modern Fortran 90 syntax
- Proper indentation
- Meaningful variable names
- Comments above complex sections

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Fortran 90 Reference](https://fortran.io/)
- [PostScript Reference](https://www.adobe.io/)

## Contributing

When making changes:
1. Create a feature branch
2. Make focused changes
3. Test thoroughly
4. Update documentation
5. Commit with clear messages

---

**Last Updated**: December 4, 2025
