import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import apiService from "../services/apiService";
import projectSaveService from "../services/projectSaveService";
import { useAuth } from "../contexts/AuthContext";
import exportedItemsService from "../services/exportedItemsService";
import SlideThumbnail from "../components/SlideThumbnail";

const G = '#2a7a2a';
const GD = '#1e5a1e';
const GL = '#e8f5e8';

let mountCount = 0;

export default function Home() {
  mountCount++;
  console.log('🏠 Home component mounted/rendered #', mountCount);

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.is_staff === true;
  const sessionUser = user?.username || user?.email;

  const [activeTab, setActiveTabState] = useState(() => {
    // Restore last active tab from localStorage
    const savedTab = localStorage.getItem('homeActiveTab');
    return savedTab || 'personal_draft';
  });

  // Wrapper to persist tab selection
  const setActiveTab = (tab) => {
    const caller = new Error().stack.split('\n')[2]?.trim();
    console.log(`🔧 setActiveTab(${tab}) called from:`, caller);
    setActiveTabState(tab);
    localStorage.setItem('homeActiveTab', tab);
  };

  const [personalDrafts, setPersonalDrafts] = useState([]);
  const [globalDrafts, setGlobalDrafts] = useState([]);
  const [forReview, setForReview] = useState([]);
  const [approvedProjects, setApprovedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Exported items state
  const [exportedItems, setExportedItems] = useState([]);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  const getProjectName = (p) =>
    p.title || p.name || p.formData?.insuredName || p.insuredName || `Project ${p.id?.substring(0, 8) || '?'}`;
  const getOwnerName = (p) => p.ownerName || p.owner || 'Unknown';

  const sCfg = {
    approved:       { bg: '#dcfce7', c: G,         l: 'Approved',    ic: 'bi-check-circle-fill' },
    denied:         { bg: '#fee2e2', c: '#dc2626',  l: 'Denied',      ic: 'bi-x-circle-fill' },
    conditional:    { bg: '#fef9c3', c: '#b45309',  l: 'Conditional', ic: 'bi-exclamation-triangle-fill' },
    for_review:     { bg: '#dbeafe', c: '#2563eb',  l: 'For Review',  ic: 'bi-send-fill' },
    global_draft:   { bg: '#e0e7ff', c: '#4338ca',  l: 'Global',      ic: 'bi-globe2' },
    personal_draft: { bg: '#f3f4f6', c: '#6b7280',  l: 'Personal',    ic: 'bi-person-fill' },
    editing:        { bg: '#f3f4f6', c: '#6b7280',  l: 'Draft',       ic: 'bi-pencil-fill' },
  };

  const fetchTabData = async (tab) => {
    if (tab === 'exports') {
      loadExportedItems();
      return;
    }
    setIsLoading(true);
    try {
      let d;
      switch (tab) {
        case 'personal_draft': d = await apiService.getPersonalDrafts(); setPersonalDrafts(Array.isArray(d) ? d : d?.results || []); break;
        case 'global_draft':   d = await apiService.getGlobalDrafts();   setGlobalDrafts(Array.isArray(d) ? d : d?.results || []);   break;
        case 'for_review':     d = await apiService.getForReview();      setForReview(Array.isArray(d) ? d : d?.results || []);      break;
        case 'approved':       d = await apiService.getApprovedList();   setApprovedProjects(Array.isArray(d) ? d : d?.results || []); break;
      }
      console.log('📊 Fetched projects:', d);
      console.log('📊 Array check:', Array.isArray(d), 'd.results:', d?.results);
      console.log('📊 First project slidePreview:', d?.[0]?.slidePreview);
    } catch (e) { console.error(`Failed to load ${tab}:`, e); }
    finally { setIsLoading(false); }
  };

  const handleStatusChange = async (id, s) => {
    try {
      let note = '';
      if (s === 'denied' || s === 'conditional') {
        note = prompt(`Add a note for the project owner (reason for ${s === 'denied' ? 'denial' : 'conditional status'}):`);
        if (note === null) return; // User cancelled
      }
      console.log(`📋 Changing project ${id} status to: ${s}`);
      await apiService.updateProjectStatus(id, s, note);

      // CRITICAL: Clear the cached project so next load gets fresh status from database
      if (window.projectSaveService?.projects?.has(id)) {
        console.log(`🗑️ Clearing cached project ${id} to force fresh load`);
        window.projectSaveService.projects.delete(id);
      }

      await fetchTabData(activeTab);
    } catch { alert('Failed to update project status.'); }
  };

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

  const handleClosePDF = () => {
    if (selectedPDF?.isBlobUrl && selectedPDF?.dataUrl) URL.revokeObjectURL(selectedPDF.dataUrl);
    setShowPreview(false); setSelectedPDF(null);
  };

  const handleDeleteExport = async (item) => {
    if (item.isDemoItem) {
      alert('Cannot delete demo items');
      return;
    }

    if (window.confirm(`Delete "${item.filename}"? This cannot be undone.`)) {
      try {
        await exportedItemsService.deleteExportedItem(item.id);
        await loadExportedItems(); // Reload list
      } catch (error) {
        console.error('Error deleting export:', error);
        alert('Failed to delete export');
      }
    }
  };

  const fmtSize = (b) => {
    if (!b) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
  };

  const loadUserProfile = async () => {
    try {
      const profile = await apiService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  useEffect(() => {
    if (sessionUser) {
      projectSaveService.init().then(() => fetchTabData(activeTab));
      updateActiveUser(sessionUser, 'join');
      loadUserProfile();
    }
    return () => { if (sessionUser) updateActiveUser(sessionUser, 'leave'); };
  }, [sessionUser]);

  useEffect(() => { if (sessionUser) fetchTabData(activeTab); }, [activeTab]);
  useEffect(() => {
    let init = true;
    const h = () => { if (!document.hidden && sessionUser && !init) fetchTabData(activeTab); init = false; };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [sessionUser, activeTab]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownOpen && !e.target.closest('[data-user-dropdown]')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userDropdownOpen]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const updateActiveUser = (u, a) => {
    const s = localStorage.getItem('activeUsers') || '[]';
    let users = JSON.parse(s);
    if (a === 'join' && !users.includes(u)) users.push(u);
    else if (a === 'leave') users = users.filter(x => x !== u);
    localStorage.setItem('activeUsers', JSON.stringify(users));
    setActiveUsers(users);
  };

  const handleCreateNew = () => navigate("/editor");
  const handleLogout = async () => { if (sessionUser) updateActiveUser(sessionUser, 'leave'); await logout(); };
  const handleEdit = (id) => {
    localStorage.setItem('homeActiveTab', activeTab);
    navigate(`/editor/${id}`);
  };
  const handleDelete = async (id) => {
    if (window.confirm('Delete this project? This cannot be undone.')) {
      try {
        await projectSaveService.deleteProject(id);
        await fetchTabData(activeTab);
        console.log('✅ Project deleted successfully');
      } catch (error) {
        console.error('❌ Delete failed:', error);
        const errorMsg = error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to delete project.';
        alert(`Failed to delete project: ${errorMsg}`);
      }
    }
  };

  const projects = { personal_draft: personalDrafts, global_draft: globalDrafts, for_review: forReview, approved: approvedProjects }[activeTab] || [];
  const isOwner = (p) => p.owner === user?.id;

  const sidebarItems = [
    { key: 'personal_draft', label: 'My Drafts',  icon: 'bi-journal-text',     count: personalDrafts.length },
    { key: 'global_draft',   label: 'Global Drafts', icon: 'bi-globe',         count: globalDrafts.length },
    { key: 'for_review',     label: 'For Review',  icon: 'bi-clipboard2-check', count: forReview.length },
    { key: 'approved',       label: 'Approved',    icon: 'bi-shield-check',     count: approvedProjects.length },
  ];

  const tabTitles = {
    personal_draft: 'My Drafts',
    global_draft: 'Global Drafts',
    for_review: 'For Review',
    approved: 'Approved Projects',
    exports: 'Exported PDFs',
  };

  const tabDescs = {
    personal_draft: 'Your private drafts, visible only to you.',
    global_draft: 'Shared drafts visible to all team members.',
    for_review: isAdmin ? 'Review and manage submitted projects.' : 'Projects awaiting admin review.',
    approved: 'Approved projects ready for export.',
    exports: 'View and download your exported PDF files.',
  };

  const renderActions = (p) => {
    const btn = (label, icon, onClick, type = 'default') => {
      const styles = {
        primary: { background: G, color: '#fff', border: 'none' },
        default: { background: '#fff', color: G, border: `1px solid ${G}` },
        blue:    { background: '#fff', color: '#2563eb', border: '1px solid #93c5fd' },
        green:   { background: '#f0fdf4', color: G, border: '1px solid #86efac' },
        red:     { background: '#fff', color: '#dc2626', border: '1px solid #fca5a5' },
        yellow:  { background: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d' },
      }[type];
      return (
        <button key={label} onClick={onClick} style={{
          ...styles, borderRadius: 12, padding: '8px 16px', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
          transition: 'all .2s ease', lineHeight: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
        >
          <i className={`bi ${icon}`} style={{ fontSize: 13 }}></i>{label}
        </button>
      );
    };

    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {activeTab === 'personal_draft' && <>
          {btn('Edit', 'bi-pencil-square', () => handleEdit(p.id), 'primary')}
          {btn('Push to Global', 'bi-globe', () => handleStatusChange(p.id, 'global_draft'))}
          {btn('Delete', 'bi-trash3', () => handleDelete(p.id), 'red')}
        </>}
        {activeTab === 'global_draft' && <>
          {btn(isOwner(p) ? 'Edit' : 'View', isOwner(p) ? 'bi-pencil-square' : 'bi-eye', () => handleEdit(p.id), isOwner(p) ? 'primary' : 'default')}
          {btn('Submit for Review', 'bi-send', () => handleStatusChange(p.id, 'for_review'), 'blue')}
          {isAdmin && btn('Delete', 'bi-trash3', () => handleDelete(p.id), 'red')}
        </>}
        {activeTab === 'for_review' && <>
          {btn('View', 'bi-eye', () => handleEdit(p.id))}
          {isAdmin && <>
            {btn('Approve', 'bi-check-lg', () => handleStatusChange(p.id, 'approved'), 'green')}
            {btn('Deny', 'bi-x-lg', () => handleStatusChange(p.id, 'denied'), 'red')}
            {btn('Conditional', 'bi-exclamation-triangle', () => handleStatusChange(p.id, 'conditional'), 'yellow')}
            {btn('Delete', 'bi-trash3', () => handleDelete(p.id), 'red')}
          </>}
        </>}
        {activeTab === 'approved' && <>
          {btn('View', 'bi-eye', () => handleEdit(p.id))}
          {(isOwner(p) || isAdmin) && btn('Delete', 'bi-trash3', () => handleDelete(p.id), 'red')}
        </>}
      </div>
    );
  };

  const getSlideIcon = (slideType) => {
    const icons = {
      'cover': 'bi-file-richtext',
      'slide-2': 'bi-globe',
      'slide-3': 'bi-globe',
      'street_view': 'bi-signpost',
      'interior': 'bi-house-door',
      'online_presence': 'bi-shop',
      'inspection': 'bi-clipboard-check',
      'comments': 'bi-chat-left-text',
      'fire_hazard': 'bi-fire',
      'crime_rate': 'bi-shield-exclamation',
      'nearest_fire_station': 'bi-building',
      'website': 'bi-browser-chrome',
      'ratings': 'bi-star',
    };

    // Normalize street_view_1, street_view_2, etc to street_view
    const normalizedType = slideType?.startsWith('street_view_') ? 'street_view' : slideType;
    return icons[normalizedType] || 'bi-file-earmark';
  };

  const renderCard = (p) => {
    const name = getProjectName(p);
    const owner = getOwnerName(p);
    const s = sCfg[p.status] || sCfg.editing;
    const slidePreview = p.slidePreview || [];

    console.log('🎨 Rendering card:', p.id, 'slidePreview:', slidePreview, 'length:', slidePreview.length);

    return (
      <div key={p.id} style={{
        background: '#fff', borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        transition: 'all .25s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 7px 30px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}
      >
        {/* Slide preview thumbnail - cover only */}
        {slidePreview.length > 0 && slidePreview[0] && (
          <div style={{
            height: 180,
            background: '#f7fafc',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}>
            <SlideThumbnail
              slideType={slidePreview[0].type}
              slideData={slidePreview[0]}
              projectData={p}
              width={280}
              height={158}
            />
          </div>
        )}

        <div style={{ padding: 24 }}>
          {/* Top row: name + status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{
              margin: 0, fontSize: 15, fontWeight: 700, color: '#1a202c',
              flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 12,
            }}>{name}</h3>
            <span style={{
              background: s.bg, color: s.c, fontSize: 11, fontWeight: 700,
              padding: '4px 10px', borderRadius: 8,
              display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
            }}>
              <i className={`bi ${s.ic}`} style={{ fontSize: 10 }}></i>{s.l}
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#f0f0f0', marginBottom: 14 }} />

        {/* Admin note for denied/conditional */}
        {p.status_note && (p.status === 'denied' || p.status === 'conditional') && (
          <div style={{
            background: p.status === 'denied' ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${p.status === 'denied' ? '#fecaca' : '#fde68a'}`,
            borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: '#374151',
          }}>
            <div style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#6b7280', marginBottom: 2 }}>
              <i className="bi bi-chat-left-text" style={{ marginRight: 4 }}></i>Admin Note
            </div>
            {p.status_note}
          </div>
        )}

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Owner</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{owner}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Slides</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{p.slideCount || 1}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Modified</div>
            <div style={{ fontSize: 13, color: '#4a5568' }}>{new Date(p.updated_at).toLocaleDateString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Created</div>
            <div style={{ fontSize: 13, color: '#4a5568' }}>{new Date(p.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Export status for approved tab */}
        {activeTab === 'approved' && (
          <div style={{ marginBottom: 16 }}>
            {p.exported_at ? (
              <span style={{
                background: GL, color: G, borderRadius: 8, padding: '4px 10px',
                fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <i className="bi bi-check-circle-fill" style={{ fontSize: 10 }}></i>Exported
              </span>
            ) : (
              <span style={{
                background: '#fff7ed', color: '#c2410c', borderRadius: 8, padding: '4px 10px',
                fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <i className="bi bi-clock-history" style={{ fontSize: 10 }}></i>Awaiting export
              </span>
            )}
          </div>
        )}

          {/* Actions */}
          {renderActions(p)}
        </div>
      </div>
    );
  };

  const renderExportCard = (item) => {
    return (
      <div key={`${item.id}-${item.export_date}`} style={{
        background: '#fff', borderRadius: 20, padding: 24,
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        transition: 'all .25s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 7px 30px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* PDF Icon */}
          <div style={{
            width: 60, height: 60, borderRadius: 15, background: '#fff5f5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: 28, color: '#e53e3e' }}></i>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#1a202c',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{item.project_name || 'Untitled Project'}</h3>
            <div style={{ fontSize: 13, color: '#718096', marginBottom: 4 }}>
              {item.filename}
            </div>
            <div style={{ fontSize: 12, color: '#a0aec0' }}>
              {fmtSize(item.file_size)} &middot; Exported {new Date(item.export_date).toLocaleDateString()}
              {isAdmin && item.owner_name && !item.isDemoItem && (
                <> &middot; By {item.owner_name}</>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => handleViewPDF(item)} style={{
              background: GL, color: G, border: 'none', borderRadius: 12,
              padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = GL; e.currentTarget.style.color = G; }}
            >
              <i className="bi bi-eye" style={{ fontSize: 14 }}></i>Preview
            </button>
            {item.dataUrl && (
              <button onClick={() => {
                const a = document.createElement('a');
                a.href = item.dataUrl || (item.isDemoItem ? `/Completed PRs/${item.file_path}` : item.url);
                a.download = item.filename;
                a.click();
              }} style={{
                background: '#fff', color: G, border: `1px solid ${G}`, borderRadius: 12,
                padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                <i className="bi bi-download" style={{ fontSize: 14 }}></i>Download
              </button>
            )}
            {isAdmin && !item.isDemoItem && (
              <button onClick={() => handleDeleteExport(item)} style={{
                background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 12,
                padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                <i className="bi bi-trash3" style={{ fontSize: 14 }}></i>Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Poppins', sans-serif", display: 'flex' }}>

      {/* Sidebar */}
      <aside style={{
        width: sidebarCollapsed ? 72 : 240, minHeight: '100vh', background: '#fff',
        borderRight: 'none', boxShadow: '2px 0 20px rgba(0,0,0,0.03)',
        display: 'flex', flexDirection: 'column', transition: 'width .25s ease',
        position: 'fixed', top: 0, left: 0, zIndex: 50, overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: sidebarCollapsed ? '20px 0' : '20px 24px', display: 'flex', alignItems: 'center',
          gap: 10, marginBottom: 8, justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
        }}>
          <img src="/NeitClemLogo.png" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
          {!sidebarCollapsed && <span style={{ fontWeight: 800, fontSize: 14, color: '#1a202c', whiteSpace: 'nowrap' }}>Property Review</span>}
        </div>

        <div style={{ height: 1, background: '#f0f0f0', margin: '0 16px 16px' }} />

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0 12px' }}>
          {sidebarItems.map(item => {
            const active = activeTab === item.key;
            return (
              <button key={item.key} onClick={() => setActiveTab(item.key)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: sidebarCollapsed ? '12px 0' : '12px 16px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                border: 'none', borderRadius: 15, cursor: 'pointer', marginBottom: 4,
                background: active ? `linear-gradient(135deg, ${G}, ${GD})` : 'transparent',
                color: active ? '#fff' : '#718096',
                fontSize: 13, fontWeight: active ? 600 : 500,
                transition: 'all .2s ease',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f7fafc'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <i className={`bi ${item.icon}`} style={{ fontSize: 18, flexShrink: 0, width: 20, textAlign: 'center' }}></i>
                {!sidebarCollapsed && <>
                  <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>{item.label}</span>
                  {item.count > 0 && (
                    <span style={{
                      background: active ? 'rgba(255,255,255,0.25)' : '#edf2f7',
                      color: active ? '#fff' : '#a0aec0',
                      borderRadius: 8, padding: '1px 8px', fontSize: 11, fontWeight: 700,
                    }}>{item.count}</span>
                  )}
                </>}
              </button>
            );
          })}

          {/* Divider with different shade */}
          <div style={{ height: 1, background: '#f0f0f0', margin: '12px 4px' }} />

          {/* Exports button */}
          <button onClick={() => setActiveTab('exports')} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: sidebarCollapsed ? '12px 0' : '12px 16px',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            border: 'none', borderRadius: 15, cursor: 'pointer', marginBottom: 4,
            background: activeTab === 'exports' ? `linear-gradient(135deg, ${G}, ${GD})` : '#f7fafc',
            color: activeTab === 'exports' ? '#fff' : '#718096',
            fontSize: 13, fontWeight: activeTab === 'exports' ? 600 : 500,
            transition: 'all .2s ease',
          }}
          onMouseEnter={e => { if (activeTab !== 'exports') e.currentTarget.style.background = '#edf2f7'; }}
          onMouseLeave={e => { if (activeTab !== 'exports') e.currentTarget.style.background = '#f7fafc'; }}
          >
            <i className="bi bi-file-earmark-pdf" style={{ fontSize: 18, flexShrink: 0, width: 20, textAlign: 'center' }}></i>
            {!sidebarCollapsed && <>
              <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>Exports</span>
              {exportedItems.length > 0 && (
                <span style={{
                  background: activeTab === 'exports' ? 'rgba(255,255,255,0.25)' : GL,
                  color: activeTab === 'exports' ? '#fff' : G,
                  borderRadius: 8, padding: '1px 8px', fontSize: 11, fontWeight: 700,
                }}>{exportedItems.length}</span>
              )}
            </>}
          </button>
        </nav>

        {/* Sidebar toggle */}
        <div style={{ padding: '0 12px 12px' }}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{
            width: '100%', padding: '10px', border: 'none', borderRadius: 12,
            background: '#f7fafc', color: '#a0aec0', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            transition: 'all .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#edf2f7'}
          onMouseLeave={e => e.currentTarget.style.background = '#f7fafc'}
          >
            <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
          </button>
        </div>

        {/* Bottom divider + user section */}
        <div style={{ height: 1, background: '#f0f0f0', margin: '0 16px' }} />
        <div style={{ position: 'relative' }} data-user-dropdown>
          <div
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            style={{
              padding: sidebarCollapsed ? '16px 0' : '16px 20px',
              display: 'flex', alignItems: 'center', gap: 10,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              cursor: 'pointer',
              borderRadius: 12,
              transition: 'background .2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 12, flexShrink: 0,
              backgroundColor: `linear-gradient(135deg, ${G}, ${GD})`,
              backgroundImage: userProfile?.avatar_url ? `url(${userProfile.avatar_url}?t=${Date.now()})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 14, fontWeight: 700,
              overflow: 'hidden',
            }}>{!userProfile?.avatar_url && sessionUser?.charAt(0).toUpperCase()}</div>
            {!sidebarCollapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sessionUser}
                  </div>
                  <div style={{ fontSize: 11, color: '#a0aec0' }}>{isAdmin ? 'Administrator' : 'Member'}</div>
                </div>
                <i className="bi bi-chevron-down" style={{ fontSize: 12, color: '#a0aec0' }}></i>
              </>
            )}
          </div>

          {/* Dropdown menu */}
          {userDropdownOpen && !sidebarCollapsed && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 20,
              right: 20,
              marginBottom: 8,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              zIndex: 1000,
            }}>
              <div
                onClick={() => { navigate('/profile'); setUserDropdownOpen(false); }}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'background .2s',
                  borderBottom: '1px solid #f0f0f0',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <i className="bi bi-person" style={{ fontSize: 16, color: '#6b7280' }}></i>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1a202c' }}>Profile</span>
              </div>

              <div
                onClick={() => { navigate('/settings'); setUserDropdownOpen(false); }}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'background .2s',
                  borderBottom: '1px solid #f0f0f0',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <i className="bi bi-gear" style={{ fontSize: 16, color: '#6b7280' }}></i>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1a202c' }}>Account Settings</span>
              </div>

              <div
                onClick={handleLogout}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'background .2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fee2e2';
                  e.currentTarget.querySelector('i').style.color = '#dc2626';
                  e.currentTarget.querySelector('span').style.color = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.querySelector('i').style.color = '#6b7280';
                  e.currentTarget.querySelector('span').style.color = '#1a202c';
                }}
              >
                <i className="bi bi-box-arrow-right" style={{ fontSize: 16, color: '#6b7280', transition: 'color .2s' }}></i>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1a202c', transition: 'color .2s' }}>Logout</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1, marginLeft: sidebarCollapsed ? 72 : 240,
        transition: 'margin-left .25s ease', minHeight: '100vh',
      }}>
        {/* Top bar */}
        <header style={{
          padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1a202c' }}>{tabTitles[activeTab]}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#a0aec0', fontWeight: 400 }}>{tabDescs[activeTab]}</p>
          </div>
          <button onClick={handleCreateNew} style={{
            background: `linear-gradient(135deg, ${G}, ${GD})`, color: '#fff', border: 'none',
            borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 4px 15px rgba(42,122,42,0.3)', transition: 'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(42,122,42,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(42,122,42,0.3)'; }}
          >
            <i className="bi bi-plus-lg" style={{ fontSize: 14 }}></i>New Project
          </button>
        </header>

        {/* Content area */}
        <div style={{ padding: '0 32px 32px' }}>
          {activeTab === 'exports' ? (
            // Exports view
            <>
              {/* Search bar for exports */}
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  position: 'relative',
                  maxWidth: 400,
                }}>
                  <i className="bi bi-search" style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#a0aec0',
                    fontSize: 14,
                    pointerEvents: 'none',
                  }}></i>
                  <input
                    type="text"
                    placeholder="Search exported PDFs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 16px 10px 40px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      fontSize: 13,
                      outline: 'none',
                      transition: 'all .2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = G;
                      e.target.style.boxShadow = `0 0 0 3px ${GL}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#a0aec0',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <i className="bi bi-x-circle-fill" style={{ fontSize: 16 }}></i>
                    </button>
                  )}
                </div>
              </div>

              {isLoading ? (
              <div style={{
                background: '#fff', borderRadius: 20, padding: '80px 20px', textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              }}>
                <div className="spinner-border" role="status" style={{ color: G, width: 36, height: 36 }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p style={{ marginTop: 16, color: '#a0aec0', fontSize: 14 }}>Loading exports...</p>
              </div>
            ) : exportedItems.length === 0 ? (
              <div style={{
                background: '#fff', borderRadius: 20, padding: '80px 20px', textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  width: 70, height: 70, borderRadius: 20,
                  background: '#fff5f5',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <i className="bi bi-file-earmark-pdf" style={{ fontSize: 30, color: '#e53e3e' }}></i>
                </div>
                <p style={{ color: '#2d3748', fontWeight: 700, fontSize: 16, margin: '0 0 4px' }}>No exported PDFs</p>
                <p style={{ color: '#a0aec0', fontSize: 13, margin: 0 }}>Export a project to see it here.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {exportedItems
                  .filter(item => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      item.filename?.toLowerCase().includes(query) ||
                      item.project_name?.toLowerCase().includes(query)
                    );
                  })
                  .map(item => renderExportCard(item))}
              </div>
            )}
            </>
          ) : (
            // Projects view
            isLoading ? (
              <div style={{
                background: '#fff', borderRadius: 20, padding: '80px 20px', textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              }}>
                <div className="spinner-border" role="status" style={{ color: G, width: 36, height: 36 }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p style={{ marginTop: 16, color: '#a0aec0', fontSize: 14 }}>Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div style={{
                background: '#fff', borderRadius: 20, padding: '80px 20px', textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  width: 70, height: 70, borderRadius: 20,
                  background: `linear-gradient(135deg, ${GL}, #fff)`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <i className="bi bi-folder2-open" style={{ fontSize: 30, color: G }}></i>
                </div>
                <p style={{ color: '#2d3748', fontWeight: 700, fontSize: 16, margin: '0 0 4px' }}>No projects found</p>
                <p style={{ color: '#a0aec0', fontSize: 13, margin: '0 0 24px', maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
                  {activeTab === 'personal_draft' ? 'Start by creating your first property review.' :
                   activeTab === 'global_draft' ? 'No projects have been pushed to global yet.' :
                   activeTab === 'for_review' ? 'No projects are pending review right now.' : 'No approved projects yet.'}
                </p>
                {activeTab === 'personal_draft' && (
                  <button onClick={handleCreateNew} style={{
                    background: `linear-gradient(135deg, ${G}, ${GD})`, color: '#fff', border: 'none',
                    borderRadius: 12, padding: '10px 24px', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
                    boxShadow: '0 4px 15px rgba(42,122,42,0.3)',
                  }}><i className="bi bi-plus-lg"></i>Create Project</button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                {projects.map(p => renderCard(p))}
              </div>
            )
          )}
        </div>
      </main>

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
                  const a = document.createElement('a'); a.href = selectedPDF.dataUrl; a.download = selectedPDF.filename; a.click();
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