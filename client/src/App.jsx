import React, { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('dat') // 'dat' or 'pdb'
  const [title, setTitle] = useState('Torsion Rings')
  const [generateVisualization, setGenerateVisualization] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pngContent, setPngContent] = useState('')
  const [pdfContent, setPdfContent] = useState('')
  const [torsionContent, setTorsionContent] = useState('')
  const [downloadFilename, setDownloadFilename] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase()
      if (['.dat', '.pdb', '.txt', '.in'].includes('.' + ext)) {
        setFile(selectedFile)
        setFileName(selectedFile.name)
        // Auto-detect file type based on extension
        if (ext === 'pdb') {
          setFileType('pdb')
          setGenerateVisualization(true)
        } else {
          setFileType('dat')
          setGenerateVisualization(false)
        }
        setError('')
      } else {
        setError('Please upload a .dat, .pdb, .txt, or .in file')
        setFile(null)
        setFileName('')
      }
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileChange({ target: { files: [droppedFile] } })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setPngContent('')
    setTorsionContent('')

    if (!file) {
      setError('Please upload a file')
      return
    }

    // For PDB files, validation is different
    if (fileType === 'pdb') {
      // PDB files are auto-processed
      setLoading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('generateVisualization', generateVisualization)
        formData.append('labels', JSON.stringify([
          'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Chi'
        ]))
        formData.append('title', title)

        const response = await axios.post('/api/process-pdb', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        setTorsionContent(response.data.torsionAngles)
        if (response.data.pngContent) {
          setPngContent(response.data.pngContent)
        }
        if (response.data.pdfContent) {
          setPdfContent(response.data.pdfContent)
        }
        setDownloadFilename(response.data.filename)
        setSuccess(true)
      } catch (err) {
        const errorData = err.response?.data
        let errorMessage = 'PDB processing failed. Please try again.'
        
        if (errorData?.message) {
          errorMessage = errorData.message
        } else if (errorData?.error) {
          errorMessage = errorData.error
        }
        
        setError(errorMessage)
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    } else {
      // .dat file processing
      setLoading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', title)

        const response = await axios.post('/api/process', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        if (response.data.pngContent) {
          setPngContent(response.data.pngContent)
        }
        if (response.data.pdfContent) {
          setPdfContent(response.data.pdfContent)
        }
        setDownloadFilename(response.data.filename)
        setSuccess(true)
      } catch (err) {
        setError(err.response?.data?.error || 'Processing failed. Please try again.')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDownload = () => {
    if (pngContent) {
      const element = document.createElement('a')
      const binaryString = atob(pngContent)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const file = new Blob([bytes], { type: 'image/png' })
      element.href = URL.createObjectURL(file)
      element.download = downloadFilename.replace('.pdf', '.png') || 'rings.png'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  const handleDownloadPDF = () => {
    if (pdfContent) {
      const element = document.createElement('a')
      const binaryString = atob(pdfContent)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const file = new Blob([bytes], { type: 'application/pdf' })
      element.href = URL.createObjectURL(file)
      element.download = downloadFilename.replace('.png', '.pdf') || 'rings.pdf'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  const handleReset = () => {
    setFile(null)
    setFileName('')
    setFileType('dat')
    setTitle('Torsion Rings')
    setGenerateVisualization(false)
    setError('')
    setSuccess(false)
    setPngContent('')
    setPdfContent('')
    setTorsionContent('')
  }

  return (
    <div className="container">
      <h1>Srinivasan-Olson Conformation Wheels</h1>
      <p className="subtitle">Chi Glycosyl and Backbone Rotations</p>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">✓ Processing completed successfully!</div>}

      <form onSubmit={handleSubmit}>
        {/* File Upload Section */}
        <div className="form-section">
          <h2>1. Upload Data File</h2>
          <div
            className="file-upload"
            onClick={() => document.getElementById('fileInput').click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="upload-icon">📄</div>
            <div className="upload-text">Click to upload or drag and drop</div>
            <div className="upload-subtext">Supported formats: .dat, .pdb, .txt, .in</div>
            <input
              id="fileInput"
              type="file"
              accept=".dat,.pdb,.txt,.in"
              onChange={handleFileChange}
            />
          </div>
          {fileName && (
            <div className="file-info">
              ✓ File selected: <strong>{fileName}</strong>
            </div>
          )}
        </div>

        {/* Configuration Section */}
        <div className="form-section">
          <h2>2. Configuration</h2>

          <div className="form-group">
            <label htmlFor="title">Title for the Diagram</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter diagram title"
              maxLength="25"
            />
          </div>

          {fileType === 'pdb' && (
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={generateVisualization}
                  onChange={(e) => setGenerateVisualization(e.target.checked)}
                />
                Generate Torsion Ring Visualization
              </label>
              <div className="form-hint">
                When checked, a torsion ring visualization will be generated from the extracted torsion angles
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="button-group">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !file}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Processing...
              </>
            ) : (
              '⚡ Generate Rings'
            )}
          </button>
          {pngContent && (
            <button type="button" className="btn btn-primary" onClick={handleDownload}>
              📥 Download PNG
            </button>
          )}
          {pdfContent && (
            <button type="button" className="btn btn-primary" onClick={handleDownloadPDF}>
              📄 Download PDF
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            🔄 Reset
          </button>
        </div>
      </form>

      {/* Results Section */}
      {torsionContent && (
        <div className="results-section">
          <h2>📊 Extracted Torsion Angles</h2>
          <pre className="torsion-output">{torsionContent}</pre>
        </div>
      )}
      
      {pngContent && (
        <div className="results">
          <h3>✓ Visualization Generated</h3>
          <p>Your torsion rings diagram has been generated successfully!</p>
          <div className="png-viewer">
            <img src={`data:image/png;base64,${pngContent}`} alt="Torsion Rings" />
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="info-box" style={{ marginTop: '30px' }}>
        <strong>📖 How to use:</strong>
        <ol style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li><strong>.DAT files:</strong> Upload a data file with torsion angle values (one residue per line, 7 torsion angles per residue)</li>
          <li><strong>.PDB files:</strong> Upload a PDB protein structure file and it will automatically extract all backbone torsion angles</li>
          <li>Customize the title for your diagram (optional)</li>
          <li>Click "Generate Rings" to create the visualization</li>
          <li>View the concentric rings diagram with 7 torsion angles displayed from center (Chi) to outer ring (Alpha)</li>
          <li>Download as PNG or PDF for presentations and publications</li>
        </ol>
      </div>
    </div>
  )
}

export default App
