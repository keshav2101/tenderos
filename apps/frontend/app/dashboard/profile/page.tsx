"use client";

import { useState, useEffect } from "react";
import {
  Building2, Shield, Upload, FileText, CheckCircle, AlertTriangle,
  Award, FileCheck2, Loader2, Sparkles, Plus, Trash2
} from "lucide-react";
import { companyApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Profile {
  company_name: string;
  gstin: string;
  cin: string;
  pan: string;
  udyam_no: string;
  dpiit_no: string;
  gem_seller_id: string;
  dsc_available: boolean;
  annual_turnover_lakhs: number;
  experience_years: number;
  certifications: string[];
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploaded_at: string;
}

export default function CompanyProfilePage() {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<Profile>({
    company_name: "",
    gstin: "",
    cin: "",
    pan: "",
    udyam_no: "",
    dpiit_no: "",
    gem_seller_id: "",
    dsc_available: false,
    annual_turnover_lakhs: 0,
    experience_years: 0,
    certifications: [],
  });
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // New certification input
  const [newCert, setNewCert] = useState("");

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    
    async function loadProfile() {
      try {
        const [profRes, scoreRes, docRes] = await Promise.all([
          companyApi.getProfile(userId as string),
          companyApi.getScore(userId as string),
          companyApi.listDocuments(userId as string)
        ]);
        
        if (profRes.data) {
          const d = profRes.data;
          setProfile({
            company_name: d.legal_name || d.company_name || "",
            gstin: d.gstin || "",
            cin: d.cin || "",
            pan: d.pan || "",
            udyam_no: d.udyam_no || d.udyam_registration_no || "",
            dpiit_no: d.dpiit_no || "",
            gem_seller_id: d.gem_seller_id || "",
            dsc_available: d.dsc_available || false,
            annual_turnover_lakhs: d.avg_turnover_3yr_lakhs || d.annual_turnover_lakhs || 0,
            experience_years: d.total_experience_years || d.experience_years || 0,
            certifications: d.certifications || [],
          });
        }
        if (scoreRes.data) setScore(scoreRes.data.completeness_score || scoreRes.data.profile_score || 0);
        setDocuments(docRes.data.documents || docRes.data || []);
      } catch (err: any) {
        console.error("Failed to load profile", err);
        setProfile({
          company_name: "",
          gstin: "",
          cin: "",
          pan: "",
          udyam_no: "",
          dpiit_no: "",
          gem_seller_id: "",
          dsc_available: false,
          annual_turnover_lakhs: 0,
          experience_years: 0,
          certifications: [],
        });
        setScore(0);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user?.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const userId = user?.id;
    if (!userId) {
      setMsg("You must be logged in to save your profile");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        user_id: userId,
        legal_name: profile.company_name,
        gstin: profile.gstin,
        cin: profile.cin,
        pan: profile.pan,
        udyam_no: profile.udyam_no,
        dpiit_no: profile.dpiit_no,
        gem_seller_id: profile.gem_seller_id,
        dsc_available: profile.dsc_available,
        avg_turnover_3yr_lakhs: profile.annual_turnover_lakhs,
        total_experience_years: profile.experience_years,
        certifications: profile.certifications,
      };
      await companyApi.upsertProfile(payload);
      setMsg("Profile saved successfully");
      
      // Re-fetch score
      const { data } = await companyApi.getScore(userId as string);
      setScore(data.completeness_score || data.profile_score || 0);
    } catch (err) {
      setMsg("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const addCertification = () => {
    if (newCert.trim() && !profile.certifications.includes(newCert.trim())) {
      setProfile(p => ({
        ...p,
        certifications: [...p.certifications, newCert.trim()]
      }));
      setNewCert("");
    }
  };

  const removeCertification = (cert: string) => {
    setProfile(p => ({
      ...p,
      certifications: p.certifications.filter(c => c !== cert)
    }));
  };

  // Real document upload
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const userId = user?.id;
    if (!file || !userId) return;

    setSaving(true);
    setMsg(null);
    try {
      const type = file.name.toLowerCase().includes("gst")
        ? "gst"
        : file.name.toLowerCase().includes("msme") || file.name.toLowerCase().includes("udyam")
        ? "msme"
        : "certification";

      await companyApi.uploadDocument(userId, type, file);
      
      // Re-fetch documents
      const docsRes = await companyApi.listDocuments(userId);
      setDocuments(docsRes.data.documents || docsRes.data || []);

      // Re-fetch score
      const scoreRes = await companyApi.getScore(userId);
      setScore(scoreRes.data.completeness_score || scoreRes.data.profile_score || 0);

      // Re-fetch profile in case metadata was extracted (GSTIN, etc.)
      const profRes = await companyApi.getProfile(userId);
      if (profRes.data) {
        const d = profRes.data;
        setProfile({
          company_name: d.legal_name || d.company_name || "",
          gstin: d.gstin || "",
          cin: d.cin || "",
          pan: d.pan || "",
          udyam_no: d.udyam_no || d.udyam_registration_no || "",
          dpiit_no: d.dpiit_no || "",
          gem_seller_id: d.gem_seller_id || "",
          dsc_available: d.dsc_available || false,
          annual_turnover_lakhs: d.avg_turnover_3yr_lakhs || d.annual_turnover_lakhs || 0,
          experience_years: d.total_experience_years || d.experience_years || 0,
          certifications: d.certifications || [],
        });
      }

      setMsg("Document uploaded & processed successfully");
    } catch (err) {
      console.error("Failed to upload document", err);
      setMsg("Failed to upload document");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const userId = user?.id;
    if (!userId) return;

    try {
      await companyApi.deleteDocument(docId, userId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      
      // Re-fetch score
      const scoreRes = await companyApi.getScore(userId);
      setScore(scoreRes.data.completeness_score || scoreRes.data.profile_score || 0);
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto flex gap-6">
      {/* ─── Profile details form ────────────────────────────────────────────── */}
      <form onSubmit={handleSave} className="flex-1 space-y-6">
        <div className="card p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-subtle pb-3">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-primary">Company Profile & Digital Twin</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-semibold text-muted uppercase">Company Registered Name</label>
              <input
                type="text"
                value={profile.company_name}
                onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))}
                className="input text-xs"
                required
              />
            </div>

            {/* GSTIN */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted uppercase">GST Identification Number (GSTIN)</label>
              <input
                type="text"
                value={profile.gstin}
                onChange={e => setProfile(p => ({ ...p, gstin: e.target.value }))}
                className="input text-xs font-mono"
              />
            </div>

            {/* CIN */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted uppercase">Corporate Identification Number (CIN)</label>
              <input
                type="text"
                value={profile.cin}
                onChange={e => setProfile(p => ({ ...p, cin: e.target.value }))}
                className="input text-xs font-mono"
              />
            </div>

            {/* Udyam No */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted uppercase">Udyam MSME Number</label>
              <input
                type="text"
                value={profile.udyam_no}
                onChange={e => setProfile(p => ({ ...p, udyam_no: e.target.value }))}
                className="input text-xs font-mono"
                placeholder="UDYAM-XX-00-0000000"
              />
            </div>

            {/* DPIIT No */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted uppercase">DPIIT Startup Recognition No</label>
              <input
                type="text"
                value={profile.dpiit_no}
                onChange={e => setProfile(p => ({ ...p, dpiit_no: e.target.value }))}
                className="input text-xs font-mono"
                placeholder="DPIIT-XXXXX"
              />
            </div>

            {/* GeM Seller ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted uppercase">GeM Seller ID</label>
              <input
                type="text"
                value={profile.gem_seller_id}
                onChange={e => setProfile(p => ({ ...p, gem_seller_id: e.target.value }))}
                className="input text-xs font-mono"
              />
            </div>

            {/* DSC checkbox */}
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                checked={profile.dsc_available}
                onChange={e => setProfile(p => ({ ...p, dsc_available: e.target.checked }))}
                className="accent-indigo-500 w-4 h-4"
                id="dsc_check"
              />
              <label htmlFor="dsc_check" className="text-xs text-secondary cursor-pointer select-none">
                Digital Signature Certificate (DSC) Available
              </label>
            </div>

            {/* Turnover */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted uppercase">Annual Turnover (₹ Lakhs)</label>
              <input
                type="number"
                value={profile.annual_turnover_lakhs}
                onChange={e => setProfile(p => ({ ...p, annual_turnover_lakhs: parseFloat(e.target.value) || 0 }))}
                className="input text-xs"
              />
            </div>

            {/* Experience */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted uppercase">Core Industry Experience (Years)</label>
              <input
                type="number"
                value={profile.experience_years}
                onChange={e => setProfile(p => ({ ...p, experience_years: parseInt(e.target.value) || 0 }))}
                className="input text-xs"
              />
            </div>
          </div>

          {/* Certifications list */}
          <div className="space-y-3 pt-4 border-t border-subtle">
            <label className="text-[10px] font-semibold text-muted uppercase">Industry Certifications</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCert}
                onChange={e => setNewCert(e.target.value)}
                placeholder="e.g. ISO 27001, CMMI Level 5"
                className="input text-xs flex-1"
              />
              <button type="button" onClick={addCertification} className="btn btn-secondary text-xs px-3">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.certifications.map(cert => (
                <span key={cert} className="badge badge-gray text-xs flex items-center gap-1.5 py-1 px-2.5">
                  <Award className="w-3.5 h-3.5" />
                  {cert}
                  <button type="button" onClick={() => removeCertification(cert)} className="text-red-400 hover:text-red-300 font-bold ml-1">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center justify-between pt-4 border-t border-subtle">
            {msg && <span className="text-xs text-indigo-400 font-medium">{msg}</span>}
            <button type="submit" disabled={saving} className="btn btn-primary text-xs px-6 py-2 ml-auto">
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </form>

      {/* ─── Sidebar completeness checklist + documents ─────────────────────── */}
      <aside className="w-80 flex-shrink-0 space-y-4">
        {/* Completeness Score */}
        <div className="card p-5 space-y-4 text-center">
          <div className="flex items-center gap-2 border-b border-subtle pb-2 justify-center">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-primary uppercase">Digital Twin Completeness</span>
          </div>

          <div className="relative w-28 h-28 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" stroke="rgba(255,255,255,0.06)" />
              <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6"
                stroke="#6172f3" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 - (score / 100) * 2 * Math.PI * 42}
                style={{ transition: "stroke-dashoffset 1s ease" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-primary">{score}%</span>
              <span className="text-[8px] text-muted">Complete</span>
            </div>
          </div>

          <div className="space-y-1.5 text-left text-xs text-secondary mt-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>GSTIN / CIN Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Financial parameters set</span>
            </div>
            {score < 100 ? (
              <div className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Upload certification certificates</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Profile verified for auto-qualify!</span>
              </div>
            )}
          </div>
        </div>

        {/* Document Twins */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-subtle pb-2">
            <span className="text-xs font-semibold text-primary uppercase flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-400" /> Document Twins
            </span>
            <label className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer">
              <Upload className="w-3 h-3" /> Upload
              <input type="file" onChange={handleUploadDocument} className="hidden" accept=".pdf" />
            </label>
          </div>

          <div className="space-y-2.5">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between py-2 px-2.5 rounded-lg"
                style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-muted flex-shrink-0" />
                  <span className="text-xs text-primary truncate" title={doc.name}>{doc.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="text-muted hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
