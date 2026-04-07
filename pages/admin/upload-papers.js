import { useState, useEffect, useRef } from "react";
import { examsApi, contentApi } from "../../lib/api";
import { Btn, C, Spinner, Tag } from "../../components/ui";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/router";

export default function UploadPapers() {
  const { user } = useAuth();
  const router   = useRouter();
  const [subjects, setSubs]  = useState([]);
  const [selSub, setSelSub]  = useState(null);
  const [papers, setPapers]  = useState([]);
  const [loading, setLoad]   = useState(true);
  const [uploading, setUpl]  = useState({});
  const paperRef             = useRef({});
  const msRef                = useRef({});

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/dashboard");
  }, [user]);

  useEffect(() => {
    contentApi.subjects().then(setSubs).finally(()=>setLoad(false));
  }, []);

  useEffect(() => {
    if (!selSub) return;
    examsApi.papersBySubject(selSub.id).then(setPapers).catch(()=>{});
  }, [selSub]);

  const upload = async (paperId, type, file) => {
    setUpl(p => ({...p, [`${paperId}-${type}`]: true }));
    try {
      const fd = new FormData();
      fd.append(type === "paper" ? "paper" : "markScheme", file);
      if (type === "paper") await examsApi.uploadPaper(paperId, fd);
      else await examsApi.uploadMarkScheme(paperId, fd);
      const updated = await examsApi.papersBySubject(selSub.id);
      setPapers(updated);
      alert(`${type === "paper" ? "Paper" : "Mark scheme"} uploaded successfully!`);
    } catch (e) { alert("Upload failed: " + e.message); }
    finally { setUpl(p => ({...p, [`${paperId}-${type}`]: false})); }
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={32}/></div>;

  // Group by year
  const byYear = {};
  for (const p of papers) {
    if (!byYear[p.year]) byYear[p.year] = [];
    byYear[p.year].push(p);
  }
  const years = Object.keys(byYear).sort((a,b) => b-a);

  return (
    <div style={{ padding:"20px 16px 100px" }}>
      <Link href="/admin"><button style={{ background:"none", border:"none", color:C.accent, fontSize:14, cursor:"pointer", marginBottom:20 }}>← Admin Panel</button></Link>
      <h1 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4, fontFamily:"var(--font-serif)" }}>Upload Past Papers</h1>
      <p style={{ fontSize:13, color:C.textSec, marginBottom:20 }}>Upload PDF question papers and mark schemes for each exam</p>

      {/* Subject selector */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:24, paddingBottom:4 }}>
        {subjects.map(s => (
          <button key={s.id} onClick={() => setSelSub(s)} style={{
            padding:"8px 16px", borderRadius:100, fontSize:13, fontWeight:600,
            cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
            background: selSub?.id===s.id ? "var(--accent-soft)" : C.surface,
            border:`1px solid ${selSub?.id===s.id ? C.accent : C.border}`,
            color: selSub?.id===s.id ? C.accent : C.textSec,
          }}>{s.name}</button>
        ))}
      </div>

      {!selSub && <p style={{ color:C.textSec, textAlign:"center", padding:40 }}>Select a subject to upload papers</p>}

      {selSub && years.length === 0 && <p style={{ color:C.textSec, textAlign:"center", padding:40 }}>No papers found. Run seed_exams.js first.</p>}

      {selSub && years.map(year => (
        <div key={year} style={{ marginBottom:24 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:12 }}>{year}</div>
          {byYear[year].map(paper => (
            <div key={paper.id} style={{ padding:"16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:10 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:12 }}>{paper.title}</div>

              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {/* Upload paper */}
                <div style={{ flex:1, minWidth:180 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Question Paper</div>
                  {paper.paper_url ? (
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <Tag color={C.green}>✓ Uploaded</Tag>
                      <button onClick={() => { paperRef.current[paper.id]?.click(); }} style={{ background:"none", border:"none", color:C.accent, fontSize:12, cursor:"pointer" }}>Replace</button>
                    </div>
                  ) : (
                    <Btn onClick={() => paperRef.current[paper.id]?.click()} disabled={uploading[`${paper.id}-paper`]} variant="ghost" style={{ padding:"8px 16px", fontSize:12, width:"100%" }}>
                      {uploading[`${paper.id}-paper`] ? "Uploading…" : "⬆ Upload PDF"}
                    </Btn>
                  )}
                  <input ref={el => paperRef.current[paper.id] = el} type="file" accept=".pdf" onChange={e => e.target.files[0] && upload(paper.id, "paper", e.target.files[0])} style={{ display:"none" }} />
                </div>

                {/* Upload mark scheme */}
                <div style={{ flex:1, minWidth:180 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Mark Scheme</div>
                  {paper.mark_scheme_url ? (
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <Tag color={C.green}>✓ Uploaded</Tag>
                      <button onClick={() => msRef.current[paper.id]?.click()} style={{ background:"none", border:"none", color:C.accent, fontSize:12, cursor:"pointer" }}>Replace</button>
                    </div>
                  ) : (
                    <Btn onClick={() => msRef.current[paper.id]?.click()} disabled={uploading[`${paper.id}-markScheme`]} variant="ghost" style={{ padding:"8px 16px", fontSize:12, width:"100%" }}>
                      {uploading[`${paper.id}-markScheme`] ? "Uploading…" : "⬆ Upload PDF"}
                    </Btn>
                  )}
                  <input ref={el => msRef.current[paper.id] = el} type="file" accept=".pdf" onChange={e => e.target.files[0] && upload(paper.id, "markScheme", e.target.files[0])} style={{ display:"none" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
