import { useState, useEffect } from 'react';
import exportedItemsService from '../services/exportedItemsService';

const G = '#2a7a2a';
const GD = '#1e5a1e';
const GL = '#e8f5e8';

export default function ExportedItemsPanel({ sessionUser }) {
  const [exportedItems, setExportedItems] = useState([]);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => { if (sessionUser) loadExportedItems(); }, [sessionUser]);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const loadExportedItems = async () => {
    if (!sessionUser) return;
    setIsLoading(true);
    try {
      const backendItems = await exportedItemsService.getExportedItems();
      const demoItem = {
        id: 'demo-neitclem',
        filename: 'Property Review NeitClem Wholesale Insurance Brokerage.pdf',
        project_name: 'NeitClem Wholesale Insurance Brokerage',
        file_size: 1551492,
        export_date: '2025-09-11T16:45:00Z',
        file_path: 'Property Review NeitClem Wholesale Insurance Brokerage.pdf',
        isDemoItem: true
      };
      setExportedItems([...backendItems, demoItem]);
    } catch (e) {
      console.error('Error loading exported items:', e);
      setExportedItems([]);
    } finally { setIsLoading(false); }
  };

  const handleViewPDF = async (item) => {
    try {
      let pdfUrl = null;
      if (item.isDemoItem) {
        pdfUrl = `/Completed PRs/${item.file_path}`;
      } else if (item.url) {
        const res = await fetch(item.url, { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
        pdfUrl = URL.createObjectURL(await res.blob());
      }
      if (pdfUrl) {
        if (isMobile) { window.open(pdfUrl, '_blank'); }
        else { setSelectedPDF({ ...item, dataUrl: pdfUrl, isBlobUrl: !item.isDemoItem }); setShowPreview(true); }
      } else { alert('PDF file is not available for preview.'); }
    } catch (e) { console.error('Error loading PDF:', e); alert('Failed to load PDF preview.'); }
  };

  const handleDownloadPDF = async (item) => {
    try {
      let pdfUrl = null;
      if (item.isDemoItem) {
        pdfUrl = `/Completed PRs/${item.file_path}`;
      } else if (item.url) {
        const res = await fetch(item.url, { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
        pdfUrl = URL.createObjectURL(await res.blob());
      }
      if (pdfUrl) {
        let filename = item.filename;

        const dateToUse = item.project_created_at || item.export_date;
        const createdDate = new Date(dateToUse);
        const dateStr = `${createdDate.getMonth() + 1}-${createdDate.getDate()}-${createdDate.getFullYear()}`;

        if (!filename.match(/\d{1,2}-\d{1,2}-\d{4}/)) {
          filename = filename.replace('.pdf', ` ${dateStr}.pdf`);
        }

        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = filename;
        a.click();
        // Clean up blob URL after download
        if (!item.isDemoItem) setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      } else {
        alert('PDF file is not available for download.');
      }
    } catch (e) {
      console.error('Error downloading PDF:', e);
      alert('Failed to download PDF.');
    }
  };

  const handleClosePDF = () => {
    if (selectedPDF?.isBlobUrl && selectedPDF?.dataUrl) URL.revokeObjectURL(selectedPDF.dataUrl);
    setShowPreview(false); setSelectedPDF(null);
  };

  const fmtSize = (b) => {
    if (!b) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
  };

  const cardStyle = {
    background: '#fff', borderRadius: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    overflow: 'hidden', position: 'sticky', top: 80,
  };

  if (isLoading) {
    return (
      <div style={cardStyle}>
        <div style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: `linear-gradient(135deg, ${G}, ${GD})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="bi bi-file-earmark-pdf-fill" style={{ color: '#fff', fontSize: 14 }}></i>
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1a202c' }}>Exports</span>
          </div>
        </div>
        <div style={{ padding: '30px 20px', textAlign: 'center' }}>
          <div className="spinner-border" role="status" style={{ color: G, width: 28, height: 28 }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: 10, color: '#a0aec0', fontSize: 12 }}>Loading exports...</p>
        </div>
      </div>
    );
  }

  if (exportedItems.length === 0) {
    return (
      <div style={cardStyle}>
        <div style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: `linear-gradient(135deg, ${G}, ${GD})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-file-earmark-pdf-fill" style={{ color: '#fff', fontSize: 14 }}></i>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1a202c' }}>Exports</span>
            </div>
            <span style={{ background: '#edf2f7', borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#a0aec0' }}>0</span>
          </div>
        </div>
        <div style={{ height: 1, background: '#f0f0f0' }} />
        <div style={{ padding: '36px 20px', textAlign: 'center' }}>
          <i className="bi bi-file-earmark-pdf" style={{ fontSize: 32, color: '#e2e8f0', display: 'block', marginBottom: 10 }}></i>
          <p style={{ color: '#a0aec0', fontSize: 13, margin: 0 }}>No exports yet</p>
          <p style={{ color: '#cbd5e0', fontSize: 11, margin: '4px 0 0' }}>Export a project to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: `linear-gradient(135deg, ${G}, ${GD})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-file-earmark-pdf-fill" style={{ color: '#fff', fontSize: 14 }}></i>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1a202c' }}>Exports</span>
            </div>
            <span style={{
              background: GL, borderRadius: 8, padding: '2px 8px',
              fontSize: 11, fontWeight: 700, color: G,
            }}>{exportedItems.length}</span>
          </div>
        </div>

        <div style={{ height: 1, background: '#f0f0f0' }} />

        {/* Items */}
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {exportedItems.map((item) => (
            <div
              key={`${item.id}-${item.export_date}`}
              style={{
                padding: '14px 20px', borderBottom: '1px solid #f7fafc',
                transition: 'background .15s', cursor: 'default',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f7fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: '#fff5f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: 16, color: '#e53e3e' }}></i>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: '#2d3748',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.project_name || 'Untitled'}
                  </div>
                  <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>
                    {fmtSize(item.file_size)} &middot; {new Date(item.export_date).toLocaleDateString()}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewPDF(item); }}
                    style={{
                      background: GL, color: G, border: 'none', borderRadius: 10,
                      padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                      transition: 'all .2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(42,122,42,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = GL; e.currentTarget.style.color = G; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <i className="bi bi-eye" style={{ fontSize: 12 }}></i>View
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownloadPDF(item); }}
                    style={{
                      background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: 10,
                      padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                      transition: 'all .2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#4a5568'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#edf2f7'; e.currentTarget.style.color = '#4a5568'; e.currentTarget.style.boxShadow = 'none'; }}
                    title="Download PDF"
                  >
                    <i className="bi bi-download" style={{ fontSize: 12 }}></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && selectedPDF && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24,
        }} onClick={handleClosePDF}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 960,
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: '#fff5f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: 16, color: '#e53e3e' }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a202c' }}>{selectedPDF.project_name || selectedPDF.filename}</div>
                  <div style={{ fontSize: 12, color: '#a0aec0' }}>Exported {new Date(selectedPDF.export_date).toLocaleString()}</div>
                </div>
              </div>
              <button onClick={handleClosePDF} style={{
                background: '#f7fafc', border: 'none', borderRadius: 10, width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                fontSize: 18, color: '#a0aec0', transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#edf2f7'; e.currentTarget.style.color = '#4a5568'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f7fafc'; e.currentTarget.style.color = '#a0aec0'; }}
              >&times;</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {selectedPDF.dataUrl ? (
                <iframe src={selectedPDF.dataUrl} width="100%" style={{ border: 'none', minHeight: '70vh' }} title={selectedPDF.filename} />
              ) : (
                <div style={{ padding: 60, textAlign: 'center' }}>
                  <i className="bi bi-exclamation-triangle" style={{ fontSize: 40, color: '#eab308', marginBottom: 12, display: 'block' }}></i>
                  <p style={{ color: '#718096', fontSize: 13 }}>Preview not available</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={handleClosePDF} style={{
                background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: 12,
                padding: '9px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#edf2f7'}
              >Close</button>
              {selectedPDF.dataUrl && (
                <button onClick={() => {
                  let filename = selectedPDF.filename;
                  const dateToUse = selectedPDF.project_created_at || selectedPDF.export_date;
                  const createdDate = new Date(dateToUse);
                  const dateStr = `${createdDate.getMonth() + 1}-${createdDate.getDate()}-${createdDate.getFullYear()}`;
                  if (!filename.match(/\d{1,2}-\d{1,2}-\d{4}/)) {
                    filename = filename.replace('.pdf', ` ${dateStr}.pdf`);
                  }
                  const a = document.createElement('a'); a.href = selectedPDF.dataUrl; a.download = filename; a.click();
                }} style={{
                  background: `linear-gradient(135deg, ${G}, ${GD})`, color: '#fff', border: 'none',
                  borderRadius: 12, padding: '9px 20px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 4px 12px rgba(42,122,42,0.25)', transition: 'all .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 16px rgba(42,122,42,0.35)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(42,122,42,0.25)'}
                ><i className="bi bi-download" style={{ fontSize: 13 }}></i>Download</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}