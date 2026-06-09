"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dumbbell, Plus, Search, X, Save, Loader2,
  Upload, Play, Trash2, Video, Globe, User,
  CheckCircle, AlertCircle, Eye, RefreshCw,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Exercise = {
  id: string;
  name: string;
  description?: string;
  muscle_groups: string[];
  equipment?: string;
  video_url?: string | null;
  is_public: boolean;
  created_by?: string;
};

type Tab = "todos" | "com-video" | "sem-video" | "customizados";

/* ─────────────────────────────────────────────
   Normaliza grupos EN → PT
───────────────────────────────────────────── */
const NORM: Record<string, string> = {
  back: "Costas", biceps: "Bíceps", chest: "Peitoral", core: "Core",
  glutes: "Glúteo", legs: "Pernas", shoulders: "Deltóide",
  triceps: "Tríceps", cardio: "Cardio",
};
const norm = (g: string) => NORM[g.toLowerCase()] ?? g;

const FILTER_GROUPS = [
  "Peitoral", "Costas", "Deltóide", "Bíceps", "Tríceps",
  "Quadríceps", "Posterior de Coxa", "Glúteo",
  "Core", "Cardio", "Full Body", "Pernas",
];

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function ExerciciosPage() {
  const [exercises,   setExercises]   = useState<Exercise[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [userId,      setUserId]      = useState<string | null>(null);
  const [tab,         setTab]         = useState<Tab>("todos");
  const [search,      setSearch]      = useState("");
  const [group,       setGroup]       = useState("Todos");
  const [showNewForm, setShowNewForm] = useState(false);

  /* modal de upload */
  const [modalEx,     setModalEx]     = useState<Exercise | null>(null);
  const [dragOver,    setDragOver]    = useState(false);
  const [uploadFile,  setUploadFile]  = useState<File | null>(null);
  const [videoUrl,    setVideoUrl]    = useState("");
  const [uploading,   setUploading]   = useState(false);
  const [uploadPct,   setUploadPct]   = useState(0);
  const [uploadErr,   setUploadErr]   = useState("");
  const [previewUrl,  setPreviewUrl]  = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* form novo exercício */
  const [fName,   setFName]   = useState("");
  const [fGroups, setFGroups] = useState("");
  const [fEquip,  setFEquip]  = useState("");
  const [fDesc,   setFDesc]   = useState("");
  const [fSaving, setFSaving] = useState(false);
  const [fError,  setFError]  = useState("");

  /* ── Load ── */
  useEffect(() => { load(); }, []);

  async function load() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);

    const { data } = await (supabase.from("exercises") as any)
      .select("id, name, description, muscle_groups, equipment, video_url, is_public, created_by")
      .or(`is_public.eq.true,created_by.eq.${session.user.id}`)
      .order("name", { ascending: true });

    setExercises(data || []);
    setLoading(false);
  }

  /* ── Filtro ── */
  const filtered = exercises.filter(ex => {
    const groups = (ex.muscle_groups || []).map(norm);
    const matchTab =
      tab === "com-video"    ? !!ex.video_url :
      tab === "sem-video"    ? !ex.video_url :
      tab === "customizados" ? !ex.is_public :
      true;
    const matchGroup = group === "Todos" || groups.some(g =>
      g.toLowerCase().includes(group.toLowerCase()) ||
      group.toLowerCase().includes(g.toLowerCase())
    );
    const q = search.toLowerCase();
    const matchSearch = !q
      || ex.name.toLowerCase().includes(q)
      || groups.some(g => g.toLowerCase().includes(q))
      || (ex.equipment || "").toLowerCase().includes(q);
    return matchTab && matchGroup && matchSearch;
  });

  const countVideo  = exercises.filter(e => !!e.video_url).length;
  const countCustom = exercises.filter(e => !e.is_public).length;

  /* grupos disponíveis nos exercícios carregados */
  const availGroups = ["Todos", ...FILTER_GROUPS.filter(g =>
    exercises.some(ex => (ex.muscle_groups || []).map(norm).some(ng =>
      ng.toLowerCase().includes(g.toLowerCase()) ||
      g.toLowerCase().includes(ng.toLowerCase())
    ))
  )];

  /* ── Abrir modal de upload ── */
  function openModal(ex: Exercise) {
    setModalEx(ex);
    setUploadFile(null);
    setVideoUrl(ex.video_url || "");
    setPreviewUrl(ex.video_url || "");
    setUploadPct(0);
    setUploadErr("");
    setUploading(false);
  }
  function closeModal() {
    setModalEx(null);
    setUploadFile(null);
    setPreviewUrl("");
    setVideoUrl("");
    setUploadErr("");
    setUploading(false);
  }

  /* ── Drag & drop ── */
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("video/")) pickFile(f);
    else setUploadErr("Selecione um arquivo de vídeo (MP4, MOV, AVI...)");
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragOver(true); }
  function onDragLeave() { setDragOver(false); }

  function pickFile(f: File) {
    setUploadFile(f);
    setUploadErr("");
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setVideoUrl(""); // limpa campo URL manual
  }

  /* ── Upload para Supabase Storage ── */
  async function handleSave() {
    if (!modalEx) return;
    setUploading(true);
    setUploadErr("");
    setUploadPct(0);
    try {
      const supabase = createClient();
      let finalUrl = videoUrl.trim();

      if (uploadFile) {
        const ext  = uploadFile.name.split(".").pop() || "mp4";
        const path = `${modalEx.id}/${Date.now()}.${ext}`;

        // Simula progresso enquanto envia (sem XHR nativo)
        const progressInterval = setInterval(() => {
          setUploadPct(p => Math.min(p + 8, 90));
        }, 400);

        const { error: upErr } = await supabase.storage
          .from("exercise-videos")
          .upload(path, uploadFile, { upsert: true, contentType: uploadFile.type });

        clearInterval(progressInterval);
        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from("exercise-videos")
          .getPublicUrl(path);
        finalUrl = urlData.publicUrl;
        setUploadPct(100);
      }

      if (!finalUrl) { setUploadErr("Selecione um arquivo ou cole uma URL"); setUploading(false); return; }

      // Atualiza via RPC (funciona para globais e customizados)
      const { error: rpcErr } = await (supabase.rpc as any)("update_exercise_video", {
        p_exercise_id: modalEx.id,
        p_video_url:   finalUrl,
      });
      if (rpcErr) throw rpcErr;

      // Atualiza local
      setExercises(ex => ex.map(e => e.id === modalEx.id ? { ...e, video_url: finalUrl } : e));
      closeModal();
    } catch (e: any) {
      setUploadErr(e?.message || "Erro ao salvar vídeo");
      setUploading(false);
    }
  }

  /* ── Remover vídeo ── */
  async function handleRemoveVideo(ex: Exercise) {
    if (!confirm(`Remover vídeo de "${ex.name}"?`)) return;
    const supabase = createClient();
    await (supabase.rpc as any)("remove_exercise_video", { p_exercise_id: ex.id });
    setExercises(prev => prev.map(e => e.id === ex.id ? { ...e, video_url: null } : e));
  }

  /* ── Criar exercício customizado ── */
  async function handleCreate() {
    if (!fName.trim()) { setFError("Nome é obrigatório"); return; }
    setFSaving(true); setFError("");
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      const groups = fGroups.split(",").map(g => g.trim()).filter(Boolean);
      const { error } = await (supabase.from("exercises") as any).insert({
        name: fName.trim(), muscle_groups: groups.length ? groups : null,
        equipment: fEquip.trim() || null, description: fDesc.trim() || null,
        created_by: session.user.id, is_public: false,
      });
      if (error) throw error;
      setFName(""); setFGroups(""); setFEquip(""); setFDesc("");
      setShowNewForm(false);
      await load();
    } catch (e: any) { setFError(e?.message || "Erro ao criar"); }
    finally { setFSaving(false); }
  }

  /* ── Delete customizado ── */
  async function handleDelete(id: string) {
    const supabase = createClient();
    await (supabase.from("exercises") as any).delete().eq("id", id);
    setExercises(prev => prev.filter(e => e.id !== id));
  }

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
            <Dumbbell size={22} color="var(--accent)" /> Exercícios
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            {exercises.filter(e => e.is_public).length} globais · {countCustom} customizados · <span style={{ color: countVideo > 0 ? "#10b981" : "var(--text-muted)" }}>🎥 {countVideo} com vídeo</span>
          </p>
        </div>
        <button onClick={() => setShowNewForm(v => !v)} className="btn-primary" style={{ fontSize: 13 }}>
          {showNewForm ? <X size={15} /> : <Plus size={15} />}
          {showNewForm ? "Cancelar" : "Novo Exercício"}
        </button>
      </div>

      {/* Formulário: novo exercício */}
      {showNewForm && (
        <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Criar exercício customizado</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>NOME *</label>
              <input value={fName} onChange={e => setFName(e.target.value)} placeholder="Ex: Rosca Spider Unilateral" />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>EQUIPAMENTO</label>
              <input value={fEquip} onChange={e => setFEquip(e.target.value)} placeholder="Ex: Haltere, Barra, Cabo..." />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>GRUPOS MUSCULARES (separados por vírgula)</label>
            <input value={fGroups} onChange={e => setFGroups(e.target.value)} placeholder="Ex: Bíceps, Braquial, Antebraço" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>DESCRIÇÃO / INSTRUÇÃO</label>
            <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Dicas de execução..." rows={2} style={{ resize: "vertical" }} />
          </div>
          {fError && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", color: "#ef4444", fontSize: 12, marginBottom: 10 }}>{fError}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setShowNewForm(false)} className="btn-ghost" style={{ fontSize: 13 }}>Cancelar</button>
            <button onClick={handleCreate} disabled={fSaving} className="btn-primary" style={{ fontSize: 13 }}>
              {fSaving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
              {fSaving ? "Salvando..." : "Criar Exercício"}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar exercício, grupo muscular ou equipamento..." style={{ paddingLeft: 38 }} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
        {([
          { key: "todos",        label: "Todos",         count: exercises.length },
          { key: "com-video",    label: "🎥 Com vídeo",  count: countVideo },
          { key: "sem-video",    label: "Sem vídeo",     count: exercises.length - countVideo },
          { key: "customizados", label: "⚡ Customizados", count: countCustom },
        ] as { key: Tab; label: string; count: number }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, transition: "all 0.15s",
            fontWeight: tab === t.key ? 700 : 400,
            background: tab === t.key ? "rgba(61,189,212,0.12)" : "var(--surface-2)",
            color: tab === t.key ? "var(--accent)" : "var(--text-secondary)",
            borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            {t.label}
            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 8, background: tab === t.key ? "rgba(61,189,212,0.2)" : "rgba(255,255,255,0.05)", color: tab === t.key ? "var(--accent)" : "var(--text-muted)" }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Group filter */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 18 }}>
        {availGroups.map(g => (
          <button key={g} onClick={() => setGroup(g)} style={{
            padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, transition: "all 0.15s",
            fontWeight: group === g ? 700 : 400,
            background: group === g ? "rgba(61,189,212,0.14)" : "var(--surface-2)",
            color: group === g ? "var(--accent)" : "var(--text-secondary)",
            boxShadow: group === g ? "0 0 0 1px rgba(61,189,212,0.3)" : "none",
          }}>
            {g}
          </button>
        ))}
      </div>

      {/* Count */}
      {!loading && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
          {filtered.length} exercício{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
          <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* Exercise list */}
      {!loading && filtered.length > 0 && (
        <div className="glass-card" style={{ overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 180px 120px 100px",
            padding: "10px 20px", background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid var(--border-subtle)",
            fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: "var(--text-muted)",
          }}>
            <span>EXERCÍCIO</span>
            <span>GRUPOS MUSCULARES</span>
            <span>EQUIPAMENTO</span>
            <span style={{ textAlign: "center" }}>VÍDEO</span>
          </div>

          {filtered.map((ex, idx) => {
            const groups  = (ex.muscle_groups || []).map(norm);
            const hasVideo = !!ex.video_url;
            const isOwn   = !ex.is_public && ex.created_by === userId;

            return (
              <div key={ex.id} style={{
                display: "grid", gridTemplateColumns: "1fr 180px 120px 100px",
                padding: "12px 20px", alignItems: "center",
                borderBottom: idx < filtered.length - 1 ? "1px solid var(--border-subtle)" : "none",
                transition: "background 0.12s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {/* Col 1: nome + badge */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{ex.name}</span>
                    {!ex.is_public && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)", background: "rgba(61,189,212,0.1)", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(61,189,212,0.2)" }}>
                        CUSTOM
                      </span>
                    )}
                  </div>
                  {ex.description && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>{ex.description}</div>
                  )}
                </div>

                {/* Col 2: grupos */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {groups.slice(0, 2).map((g, i) => (
                    <span key={i} style={{ fontSize: 10, padding: "2px 7px", background: "rgba(61,189,212,0.07)", color: "var(--accent)", borderRadius: 4 }}>{g}</span>
                  ))}
                  {groups.length > 2 && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>+{groups.length - 2}</span>}
                </div>

                {/* Col 3: equipamento */}
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {ex.equipment || <span style={{ color: "var(--text-muted)" }}>—</span>}
                </div>

                {/* Col 4: vídeo + ações */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  {hasVideo ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#10b981", fontSize: 11, fontWeight: 700 }}>
                        <Video size={13} /> Vídeo
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => openModal(ex)} title="Ver / Atualizar"
                          style={{ background: "rgba(61,189,212,0.1)", border: "1px solid rgba(61,189,212,0.2)", borderRadius: 6, padding: "3px 8px", cursor: "pointer", color: "var(--accent)", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                          <RefreshCw size={11} /> Trocar
                        </button>
                        <button onClick={() => handleRemoveVideo(ex)} title="Remover vídeo"
                          style={{ background: "rgba(239,68,68,0.06)", border: "none", borderRadius: 6, padding: "3px 6px", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center" }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <button onClick={() => openModal(ex)}
                      style={{
                        background: "none", border: "1px dashed rgba(61,189,212,0.25)",
                        borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                        color: "var(--text-muted)", fontSize: 11, transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: 5,
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--accent)"; el.style.color = "var(--accent)"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(61,189,212,0.25)"; el.style.color = "var(--text-muted)"; }}
                    >
                      <Upload size={11} /> Upload
                    </button>
                  )}
                  {isOwn && (
                    <button onClick={() => { if (confirm(`Excluir "${ex.name}"?`)) handleDelete(ex.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 10, padding: 0 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--red)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                    >
                      excluir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
          <Dumbbell size={44} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 15, color: "var(--text-secondary)" }}>Nenhum exercício encontrado</h3>
        </div>
      )}

      {/* ═══════════════════════════════════════
          MODAL DE UPLOAD DE VÍDEO
      ═══════════════════════════════════════ */}
      {modalEx && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>

          <div style={{
            background: "var(--surface)", border: "1px solid rgba(61,189,212,0.15)",
            borderRadius: 20, width: "100%", maxWidth: 560,
            boxShadow: "0 0 80px rgba(61,189,212,0.08), 0 24px 64px rgba(0,0,0,0.7)",
            overflow: "hidden",
          }}>

            {/* Modal header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>Upload de Vídeo</div>
                <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 2 }}>{modalEx.name}</div>
              </div>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 24 }}>

              {/* Preview do vídeo atual / selecionado */}
              {previewUrl && (
                <div style={{ marginBottom: 20, borderRadius: 12, overflow: "hidden", background: "#000", position: "relative", aspectRatio: "16/9" }}>
                  <video
                    key={previewUrl}
                    src={previewUrl}
                    controls
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                  {uploadFile && (
                    <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.7)", color: "#10b981", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>
                      ARQUIVO SELECIONADO
                    </div>
                  )}
                </div>
              )}

              {/* Drop zone */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "var(--accent)" : "rgba(61,189,212,0.2)"}`,
                  borderRadius: 14, padding: "28px 20px", textAlign: "center",
                  cursor: "pointer", marginBottom: 16, transition: "all 0.2s",
                  background: dragOver ? "rgba(61,189,212,0.06)" : "var(--surface-2)",
                }}
              >
                <Upload size={28} color={dragOver ? "var(--accent)" : "var(--text-muted)"} style={{ margin: "0 auto 10px" }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: dragOver ? "var(--accent)" : "var(--text-primary)", marginBottom: 4 }}>
                  {uploadFile ? uploadFile.name : "Arraste o vídeo aqui ou clique para selecionar"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {uploadFile
                    ? `${(uploadFile.size / 1024 / 1024).toFixed(1)} MB · ${uploadFile.type}`
                    : "MP4, MOV, AVI, WebM — máx 500 MB"}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  style={{ display: "none" }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
                />
              </div>

              {/* OU: URL manual */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>OU COLE UMA URL</span>
                <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
              </div>
              <input
                value={videoUrl}
                onChange={e => {
                  setVideoUrl(e.target.value);
                  setUploadFile(null);
                  setPreviewUrl(e.target.value);
                }}
                placeholder="https://... (YouTube, link direto de vídeo...)"
                style={{ width: "100%", marginBottom: 16 }}
              />

              {/* Barra de progresso */}
              {uploading && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Enviando vídeo...</span>
                    <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>{uploadPct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${uploadPct}%`, transition: "width 0.3s ease" }} />
                  </div>
                </div>
              )}

              {/* Erro */}
              {uploadErr && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", color: "#ef4444", fontSize: 12, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertCircle size={13} /> {uploadErr}
                </div>
              )}

              {/* Botões */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={closeModal} className="btn-ghost" disabled={uploading} style={{ fontSize: 13 }}>Cancelar</button>
                <button onClick={handleSave} disabled={uploading || (!uploadFile && !videoUrl.trim())} className="btn-primary" style={{ fontSize: 13 }}>
                  {uploading
                    ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Enviando...</>
                    : <><Save size={14} /> Salvar Vídeo</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
