import React, { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('dat') // 'dat' or 'pdb'
  const [torsionCount, setTorsionCount] = useState(1)
  const [labels, setLabels] = useState([])
  const [currentLabel, setCurrentLabel] = useState('')
  const [title, setTitle] = useState('Torsion Rings')
  const [generateVisualization, setGenerateVisualization] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [svgContent, setSvgContent] = useState('')
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

  const handleAddLabel = () => {
    if (currentLabel.trim() && labels.length < torsionCount) {
      setLabels([...labels, currentLabel.trim()])
      setCurrentLabel('')
      setError('')
    } else if (labels.length >= torsionCount) {
      setError(`Maximum ${torsionCount} labels allowed`)
    }
  }

  const handleRemoveLabel = (index) => {
    setLabels(labels.filter((_, i) => i !== index))
  }

  const handleTorsionCountChange = (e) => {
    const count = Math.min(7, Math.max(1, parseInt(e.target.value) || 1))
    setTorsionCount(count)
    if (labels.length > count) {
      setLabels(labels.slice(0, count))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSvgContent('')
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
        if (response.data.svgContent) {
          setSvgContent(response.data.svgContent)
          setDownloadFilename(response.data.filename)
        }
        setSuccess(true)
      } catch (err) {
        setError(err.response?.data?.error || 'PDB processing failed. Please try again.')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    } else {
      // Original .dat file processing
      if (labels.length !== torsionCount) {
        setError(`Please provide ${torsionCount} labels`)
        return
      }

      if (!title.trim()) {
        setError('Please enter a title')
        return
      }

      setLoading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('torsionCount', torsionCount)
        formData.append('labels', JSON.stringify(labels))
        formData.append('title', title)

        const response = await axios.post('/api/process', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        setSvgContent(response.data.svgContent)
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
    if (svgContent) {
      const element = document.createElement('a')
      const file = new Blob([svgContent], { type: 'image/svg+xml' })
      element.href = URL.createObjectURL(file)
      element.download = downloadFilename
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  const handleReset = () => {
    setFile(null)
    setFileName('')
    setFileType('dat')
    setTorsionCount(1)
    setLabels([])
    setCurrentLabel('')
    setTitle('Torsion Rings')
    setGenerateVisualization(false)
    setError('')
    setSuccess(false)
    setSvgContent('')
    setTorsionContent('')
  }

  return (
    <div className="container">
      <h1>🔗 Torsion Rings Generator</h1>
      <p className="subtitle">Generate conformation rings from protein data</p>

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
            <label htmlFor="torsionCount">Number of Torsion Types (1-7)</label>
            <input
              id="torsionCount"
              type="number"
              min="1"
              max="7"
              value={torsionCount}
              onChange={handleTorsionCountChange}
            />
          </div>

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
                When checked, a PostScript visualization will be generated from the extracted torsion angles
              </div>
            </div>
          )}

          {fileType === 'dat' && (
            <div className="form-group">
              <label>Labels for Each Ring</label>
              <div className="labels-input">
                <input
                  type="text"
                  value={currentLabel}
                  onChange={(e) => setCurrentLabel(e.target.value)}
                  placeholder="Enter label (e.g., α, β, γ)"
                  maxLength="3"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                />
                <button type="button" onClick={handleAddLabel}>
                  Add
                </button>
              </div>
              {labels.length > 0 && (
                <div className="labels-list">
                  {labels.map((label, index) => (
                    <div key={index} className="label-badge">
                      {label}
                      <button type="button" onClick={() => handleRemoveLabel(index)}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="info-box">
                Labels added: <strong>{labels.length}/{torsionCount}</strong>
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
          {svgContent && (
            <button type="button" className="btn btn-primary" onClick={handleDownload}>
              📥 Download SVG
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
      
      {svgContent && (
        <div className="results">
          <h3>✓ Visualization Generated</h3>
          <p>Your torsion rings diagram has been generated successfully!</p>
          <div className="svg-viewer" dangerouslySetInnerHTML={{ __html: svgContent }} />
          <button className="download-btn" onClick={handleDownload}>
            📥 Download SVG File
          </button>
          <div className="info-box">
            <strong>💡 Tip:</strong> You can view the SVG directly in your browser, download it, or convert to PDF. 
            Click and drag to interact with the visualization in compatible viewers.
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="info-box" style={{ marginTop: '30px' }}>
        <strong>📖 How to use:</strong>
        <ol style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li>Prepare a data file with torsion angle values (one record per line, 7 columns)</li>
          <li>Upload the data file using the upload button</li>
          <li>Specify the number of torsion types to visualize</li>
          <li>Add descriptive labels for each ring</li>
          <li>Click "Generate Rings" to create the visualization</li>
          <li>Download the PostScript file for viewing or printing</li>
        </ol>
      </div>
    </div>
  )
}

export default App
