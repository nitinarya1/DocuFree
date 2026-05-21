import { useState, useRef } from 'react'
import { PDFDocument } from 'pdf-lib'
import SignatureCanvas from 'react-signature-canvas'

function App() {
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfName, setPdfName] = useState('')
  const [loading, setLoading] = useState(false)
  const [signed, setSigned] = useState(false)
  const sigCanvas = useRef(null)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPdfFile(new Uint8Array(e.target.result))
        setPdfName(file.name)
        setSigned(false)
      }
      reader.readAsArrayBuffer(file)
    } else {
      alert('Please upload a valid PDF file.')
    }
  }

  const handleClearSignature = () => {
    sigCanvas.current.clear()
  }

  const handleSignAndDownload = async () => {
    if (!pdfFile) {
      alert('Please upload a PDF first.')
      return
    }
    if (sigCanvas.current.isEmpty()) {
      alert('Please draw your signature.')
      return
    }

    setLoading(true)
    try {
      // 1. Get signature image
      const sigDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
      
      // 2. Load PDF
      const pdfDoc = await PDFDocument.load(pdfFile)
      
      // 3. Embed signature image
      const base64Data = sigDataUrl.split(',')[1]
      const sigImageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
      const embeddedImage = await pdfDoc.embedPng(sigImageBytes)
      const { width, height } = embeddedImage.scale(0.5) // scale it down a bit

      // 4. Get first page (or all pages) and stamp
      const pages = pdfDoc.getPages()
      const firstPage = pages[0]
      
      // Stamp at bottom right corner (adjust coordinates as needed)
      firstPage.drawImage(embeddedImage, {
        x: firstPage.getWidth() - width - 50,
        y: 50,
        width,
        height,
      })

      // 5. Save and download
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `signed_${pdfName}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setSigned(true)
    } catch (error) {
      console.error(error)
      alert('An error occurred while signing the PDF.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 font-sans text-slate-900">
      <header className="w-full max-w-4xl flex justify-between items-center mb-10 py-4 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-blue-600 flex items-center gap-2">
          <span className="text-4xl">📄</span> DocuFree
        </h1>
        <div className="text-sm text-slate-500 font-medium">Local-First PDF Signer</div>
      </header>

      <main className="w-full max-w-4xl grid md:grid-cols-2 gap-8 flex-1">
        
        {/* Left Column: Upload */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h2 className="text-xl font-bold mb-4">1. Upload Document</h2>
          
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50 p-6 relative hover:bg-blue-50 transition-colors">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-5xl mb-4">📁</div>
            <p className="font-semibold text-blue-800 text-center">
              {pdfName ? pdfName : "Drag & Drop your PDF here"}
            </p>
            {!pdfName && <p className="text-sm text-blue-600 mt-2">or click to browse</p>}
          </div>

          {pdfName && (
            <div className="mt-4 text-sm text-emerald-600 font-medium flex items-center gap-2">
              <span>✅</span> Document loaded securely in your browser.
            </div>
          )}
        </div>

        {/* Right Column: Signature */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h2 className="text-xl font-bold mb-4">2. Draw Signature</h2>
          
          <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50 mb-4">
            <SignatureCanvas 
              ref={sigCanvas}
              penColor="blue"
              canvasProps={{className: "w-full h-48 cursor-crosshair"}}
            />
          </div>
          
          <div className="flex justify-between items-center mb-8">
            <button 
              onClick={handleClearSignature}
              className="text-sm text-slate-500 hover:text-slate-800 font-medium"
            >
              Clear Signature
            </button>
            <span className="text-xs text-slate-400">Signs bottom-right of first page</span>
          </div>

          <button 
            onClick={handleSignAndDownload}
            disabled={!pdfFile || loading}
            className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all
              ${!pdfFile 
                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30 hover:-translate-y-1'
              }
            `}
          >
            {loading ? 'Processing...' : signed ? 'Signed & Downloaded! 🎉' : 'Sign & Download PDF'}
          </button>
          
          <p className="text-center text-xs text-slate-400 mt-4">
            🔒 100% Client-Side. No files are uploaded to any server.
          </p>
        </div>

      </main>

      <footer className="mt-auto pt-10 pb-4 text-slate-400 text-xs text-center w-full">
        &copy; {new Date().getFullYear()} All rights reserved Nitin Arya
      </footer>
    </div>
  )
}

export default App
