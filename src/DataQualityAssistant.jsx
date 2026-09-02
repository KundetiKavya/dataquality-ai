import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const C = {
  bg:"#0A0F1E", surface:"#111827", card:"#161D2F", border:"#1E293B",
  primary:"#4F46E5", cyan:"#06B6D4", emerald:"#10B981", amber:"#F59E0B",
  rose:"#F43F5E", violet:"#8B5CF6", textPri:"#F8FAFC", textSec:"#94A3B8", textMut:"#475569",
};

const QUALITY_TREND = [
  {month:"Jan",score:71},{month:"Feb",score:74},{month:"Mar",score:68},
  {month:"Apr",score:79},{month:"May",score:83},{month:"Jun",score:88},{month:"Jul",score:92},
];
const ISSUE_BREAKDOWN = [
  {name:"Missing Values",value:38,color:C.amber},{name:"Duplicates",value:22,color:C.rose},
  {name:"Invalid Format",value:18,color:C.violet},{name:"Outliers",value:14,color:C.cyan},
  {name:"Inconsistent",value:8,color:C.primary},
];
const COLUMN_HEALTH = [
  {col:"customer_email",score:72,issues:8,type:"email"},{col:"phone_number",score:58,issues:21,type:"phone"},
  {col:"created_at",score:91,issues:3,type:"date"},{col:"revenue",score:84,issues:6,type:"numeric"},
  {col:"customer_id",score:99,issues:0,type:"id"},{col:"region",score:67,issues:14,type:"text"},
  {col:"product_category",score:88,issues:4,type:"text"},{col:"age",score:76,issues:9,type:"numeric"},
];
const RECENT_DATASETS = [
  {name:"customer_data_june.csv",records:12480,score:92,status:"excellent",time:"2 min ago",size:"4.2 MB"},
  {name:"transactions_q2.xlsx",records:48200,score:78,status:"good",time:"1 hr ago",size:"18.7 MB"},
  {name:"product_catalog.csv",records:3210,score:61,status:"fair",time:"3 hrs ago",size:"1.1 MB"},
  {name:"vendor_contacts.xlsx",records:890,score:44,status:"poor",time:"Yesterday",size:"0.4 MB"},
  {name:"marketing_leads_may.csv",records:22100,score:85,status:"good",time:"2 days ago",size:"8.9 MB"},
];
const AI_RECS = [
  {severity:"high",column:"phone_number",icon:"📞",title:"21% of phone numbers fail validation",detail:"The phone_number column contains 4,381 records with non-standard formats. Standardize at point-of-entry using a validation library. Estimated impact: reduces CRM sync errors by ~60%.",tag:"Format Issue"},
  {severity:"medium",column:"customer_email",icon:"✉️",title:"8% invalid email addresses detected",detail:"The customer_email column has 998 invalid entries — missing '@' symbols and invalid TLDs. Implement real-time email validation during customer onboarding.",tag:"Data Entry"},
  {severity:"medium",column:"region",icon:"🗺️",title:"Inconsistent region naming conventions",detail:"14 records mix abbreviations (e.g. 'NY', 'New York', 'new york'). Normalize using a lookup table or dropdown. Affects 3 downstream BI reports.",tag:"Consistency"},
  {severity:"low",column:"revenue",icon:"💰",title:"6 statistical outliers in revenue column",detail:"Values like $0.00 and $999,999.99 appear atypical. Review whether these are data entry errors before including in financial models.",tag:"Outlier"},
];

// Data aliases — shorthand names used across all page components
const ISSUES = ISSUE_BREAKDOWN;
const COL_HEALTH = COLUMN_HEALTH;
const DATASETS = RECENT_DATASETS;
const TREND = QUALITY_TREND;

const scoreColor = s => s>=85?C.emerald:s>=70?C.cyan:s>=55?C.amber:C.rose;
const scoreLabel = s => s>=85?"Excellent":s>=70?"Good":s>=55?"Fair":"Poor";
const sevColor = {high:C.rose,medium:C.amber,low:C.cyan};

function Badge({children,color}){
  return <span style={{padding:"2px 10px",borderRadius:99,fontSize:11,fontWeight:600,background:color+"22",color,border:`1px solid ${color}44`,letterSpacing:0.4}}>{children}</span>;
}

function ScoreRing({score,size=120,stroke=10}){
  const r=(size-stroke)/2, circ=2*Math.PI*r;
  const [anim,setAnim]=useState(0);
  useEffect(()=>{
    let start=null;
    const step=ts=>{if(!start)start=ts;const p=Math.min((ts-start)/1200,1);setAnim(Math.round(p*score));if(p<1)requestAnimationFrame(step);};
    requestAnimationFrame(step);
  },[score]);
  const color=scoreColor(anim);
  return(
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ-(anim/100)*circ} strokeLinecap="round"
        style={{transition:"stroke-dashoffset 0.05s linear,stroke 0.3s"}}/>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        style={{fill:color,fontSize:size*0.22,fontWeight:700,fontFamily:"Inter,sans-serif",transform:"rotate(90deg)",transformOrigin:"center"}}>
        {anim}
      </text>
    </svg>
  );
}

// ── AUTH INPUT ──
function AuthInput({label,type="text",value,onChange,placeholder,icon,rightEl}){
  const [focused,setFocused]=useState(false);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      <label style={{fontSize:12,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:0.8}}>{label}</label>
      <div style={{display:"flex",alignItems:"center",background:"#1E293B",border:`1.5px solid ${focused?C.primary:"#2E3F55"}`,borderRadius:10,padding:"0 14px",gap:10,transition:"border-color 0.2s"}}>
        {icon&&<span style={{fontSize:16,color:focused?C.primary:"#475569",flexShrink:0}}>{icon}</span>}
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{flex:1,background:"none",border:"none",outline:"none",color:"#F1F5F9",fontSize:14,padding:"12px 0",fontFamily:"inherit"}}/>
        {rightEl}
      </div>
    </div>
  );
}

// ── AUTH SHELL ──
function AuthShell({children}){
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",fontFamily:"Inter,system-ui,sans-serif",color:C.textPri,position:"relative",overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}input,button,textarea,select{font-family:inherit}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse2{0%,100%{opacity:0.15}50%{opacity:0.3}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        <div style={{position:"absolute",top:"-20%",left:"-10%",width:600,height:600,borderRadius:"50%",background:C.primary,opacity:0.08,filter:"blur(80px)",animation:"pulse2 6s ease infinite"}}/>
        <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:500,height:500,borderRadius:"50%",background:C.cyan,opacity:0.06,filter:"blur(80px)",animation:"pulse2 8s ease infinite 2s"}}/>
      </div>
      {/* Left panel */}
      <div style={{width:"45%",padding:"48px 56px",display:"flex",flexDirection:"column",justifyContent:"space-between",position:"relative"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:42,height:42,borderRadius:12,background:`linear-gradient(135deg,${C.primary},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",flexShrink:0}}>✦</div>
          <div><div style={{fontWeight:800,fontSize:16,letterSpacing:-0.3}}>DataQuality AI</div><div style={{color:C.textSec,fontSize:11,letterSpacing:1,textTransform:"uppercase"}}>Enterprise Platform</div></div>
        </div>
        <div style={{animation:"fadeIn 0.6s ease"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:C.primary+"18",border:`1px solid ${C.primary}33`,borderRadius:99,padding:"5px 14px",marginBottom:24}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:C.emerald}}/>
            <span style={{fontSize:12,color:C.cyan,fontWeight:600}}>Trusted by 500+ enterprises</span>
          </div>
          <h1 style={{fontSize:42,fontWeight:900,lineHeight:1.15,letterSpacing:-1.5,marginBottom:20}}>
            Turn messy data into{" "}
            <span style={{background:`linear-gradient(135deg,${C.primary},${C.cyan})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>reliable insights</span>
          </h1>
          <p style={{color:C.textSec,fontSize:15,lineHeight:1.7,maxWidth:380,marginBottom:40}}>Automatically detect missing values, duplicates, invalid formats, and outliers — then get AI-powered recommendations to fix them.</p>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[{icon:"🔍",label:"Automated quality scanning in seconds"},{icon:"✦",label:"AI recommendations in plain business language"},{icon:"📊",label:"Real-time dashboards & governance tracking"}].map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:C.primary+"18",border:`1px solid ${C.primary}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{f.icon}</div>
                <span style={{color:C.textSec,fontSize:14}}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:32}}>
          {[["500+","Enterprises"],["99.9%","Uptime"],["2.1B+","Records scanned"]].map(([val,lbl],i)=>(
            <div key={i}>
              <div style={{fontSize:22,fontWeight:800,background:`linear-gradient(135deg,${C.primary},${C.cyan})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{val}</div>
              <div style={{fontSize:11,color:C.textMut}}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Right panel */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 40px"}}>
        <div style={{width:"100%",maxWidth:420,background:"#111827",border:"1px solid #1E293B",borderRadius:20,padding:"40px 36px",boxShadow:"0 24px 64px rgba(0,0,0,0.5)",animation:"fadeIn 0.4s ease"}}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── SIGN IN ──
function SignInPage({onSignIn,goSignUp,goForgot}){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [showPw,setShowPw]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const handleSubmit=()=>{
    setError("");
    if(!email||!password){setError("Please fill in all fields.");return;}
    if(!email.includes("@")){setError("Please enter a valid email address.");return;}
    setLoading(true);
    setTimeout(()=>{setLoading(false);onSignIn({name:"Kavya Kundeti",email});},1400);
  };
  const handleGoogle=()=>{
    setLoading(true);
    setTimeout(()=>{setLoading(false);onSignIn({name:"Kavya Kundeti",email:"kavya.kundeti@company.com"});},1200);
  };

  return(
    <AuthShell>
      <div style={{marginBottom:28}}>
        <h2 style={{fontSize:26,fontWeight:800,letterSpacing:-0.5,marginBottom:6}}>Welcome back</h2>
        <p style={{color:"#64748B",fontSize:14}}>Sign in to your DataQuality AI account</p>
      </div>
      <button onClick={handleGoogle} disabled={loading} style={{width:"100%",background:"#1E293B",border:"1.5px solid #2E3F55",borderRadius:10,color:"#F1F5F9",padding:"12px 16px",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:20}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=C.primary} onMouseLeave={e=>e.currentTarget.style.borderColor="#2E3F55"}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continue with Google
      </button>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <div style={{flex:1,height:1,background:"#1E293B"}}/><span style={{fontSize:12,color:"#475569"}}>or sign in with email</span><div style={{flex:1,height:1,background:"#1E293B"}}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:16}}>
        <AuthInput label="Email Address" type="email" value={email} onChange={setEmail} placeholder="kavya@company.com" icon="✉️"/>
        <AuthInput label="Password" type={showPw?"text":"password"} value={password} onChange={setPassword} placeholder="••••••••••" icon="🔒"
          rightEl={<button onClick={()=>setShowPw(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",color:"#475569",fontSize:14,padding:"0 2px"}}>{showPw?"🙈":"👁"}</button>}/>
      </div>
      <div style={{textAlign:"right",marginBottom:16}}>
        <button onClick={goForgot} style={{background:"none",border:"none",color:C.primary,fontSize:13,cursor:"pointer",fontWeight:600}}>Forgot password?</button>
      </div>
      {error&&<div style={{background:C.rose+"15",border:`1px solid ${C.rose}33`,borderRadius:8,padding:"10px 14px",color:C.rose,fontSize:13,marginBottom:16}}>⚠️ {error}</div>}
      <button onClick={handleSubmit} disabled={loading} style={{width:"100%",background:loading?"#1E293B":`linear-gradient(135deg,${C.primary},${C.cyan})`,border:"none",borderRadius:10,color:"#fff",padding:"13px",fontSize:15,fontWeight:700,cursor:loading?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        {loading?<><div style={{width:16,height:16,borderRadius:"50%",border:"2px solid #ffffff44",borderTopColor:"#fff",animation:"spin 0.7s linear infinite"}}/>Signing in…</>:"Sign In →"}
      </button>
      <p style={{textAlign:"center",marginTop:24,color:"#64748B",fontSize:13}}>
        Don't have an account?{" "}<button onClick={goSignUp} style={{background:"none",border:"none",color:C.primary,fontWeight:700,cursor:"pointer",fontSize:13}}>Create one free</button>
      </p>
    </AuthShell>
  );
}

// ── SIGN UP ──
function SignUpPage({onSignUp,goSignIn}){
  const [form,setForm]=useState({firstName:"",lastName:"",email:"",org:"",password:"",confirm:""});
  const [showPw,setShowPw]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [agree,setAgree]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const handleSubmit=()=>{
    setError("");
    if(!form.firstName||!form.lastName||!form.email||!form.password){setError("Please fill in all required fields.");return;}
    if(!form.email.includes("@")){setError("Please enter a valid email address.");return;}
    if(form.password.length<8){setError("Password must be at least 8 characters.");return;}
    if(form.password!==form.confirm){setError("Passwords do not match.");return;}
    if(!agree){setError("Please accept the Terms of Service to continue.");return;}
    setLoading(true);
    setTimeout(()=>{setLoading(false);onSignUp({name:`${form.firstName} ${form.lastName}`,email:form.email});},1600);
  };
  const pwStrength=form.password.length===0?0:form.password.length<6?1:form.password.length<10?2:3;
  const pwColors=["transparent",C.rose,C.amber,C.emerald];
  const pwLabels=["","Weak","Fair","Strong"];

  return(
    <AuthShell>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:24,fontWeight:800,letterSpacing:-0.5,marginBottom:6}}>Create your account</h2>
        <p style={{color:"#64748B",fontSize:13}}>Start your free trial — no credit card required</p>
      </div>
      <button onClick={()=>{setLoading(true);setTimeout(()=>{setLoading(false);onSignUp({name:"Kavya Kundeti",email:"kavya@company.com"});},1200);}}
        style={{width:"100%",background:"#1E293B",border:"1.5px solid #2E3F55",borderRadius:10,color:"#F1F5F9",padding:"11px 16px",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:18}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=C.primary} onMouseLeave={e=>e.currentTarget.style.borderColor="#2E3F55"}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Sign up with Google
      </button>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <div style={{flex:1,height:1,background:"#1E293B"}}/><span style={{fontSize:12,color:"#475569"}}>or with email</span><div style={{flex:1,height:1,background:"#1E293B"}}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <AuthInput label="First Name" value={form.firstName} onChange={v=>set("firstName",v)} placeholder="Kavya" icon="👤"/>
          <AuthInput label="Last Name" value={form.lastName} onChange={v=>set("lastName",v)} placeholder="Kundeti"/>
        </div>
        <AuthInput label="Work Email" type="email" value={form.email} onChange={v=>set("email",v)} placeholder="kavya@company.com" icon="✉️"/>
        <AuthInput label="Organization (optional)" value={form.org} onChange={v=>set("org",v)} placeholder="Acme Corp" icon="🏢"/>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <AuthInput label="Password" type={showPw?"text":"password"} value={form.password} onChange={v=>set("password",v)} placeholder="Min. 8 characters" icon="🔒"
            rightEl={<button onClick={()=>setShowPw(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",color:"#475569",fontSize:14}}>{showPw?"🙈":"👁"}</button>}/>
          {form.password.length>0&&(
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              {[1,2,3].map(i=><div key={i} style={{flex:1,height:4,borderRadius:99,background:i<=pwStrength?pwColors[pwStrength]:"#1E293B",transition:"background 0.3s"}}/>)}
              <span style={{fontSize:11,color:pwColors[pwStrength],fontWeight:600,marginLeft:4,width:40}}>{pwLabels[pwStrength]}</span>
            </div>
          )}
        </div>
        <AuthInput label="Confirm Password" type="password" value={form.confirm} onChange={v=>set("confirm",v)} placeholder="Re-enter password" icon="🔒"/>
      </div>
      <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:14,cursor:"pointer"}} onClick={()=>setAgree(o=>!o)}>
        <div style={{width:18,height:18,borderRadius:5,flexShrink:0,marginTop:1,background:agree?C.primary:"#1E293B",border:`1.5px solid ${agree?C.primary:"#2E3F55"}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
          {agree&&<span style={{color:"#fff",fontSize:11,fontWeight:800}}>✓</span>}
        </div>
        <span style={{fontSize:12,color:"#64748B",lineHeight:1.5}}>I agree to the <span style={{color:C.primary,fontWeight:600}}>Terms of Service</span> and <span style={{color:C.primary,fontWeight:600}}>Privacy Policy</span></span>
      </div>
      {error&&<div style={{background:C.rose+"15",border:`1px solid ${C.rose}33`,borderRadius:8,padding:"10px 14px",color:C.rose,fontSize:13,marginBottom:12}}>⚠️ {error}</div>}
      <button onClick={handleSubmit} disabled={loading} style={{width:"100%",background:loading?"#1E293B":`linear-gradient(135deg,${C.primary},${C.cyan})`,border:"none",borderRadius:10,color:"#fff",padding:"13px",fontSize:15,fontWeight:700,cursor:loading?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        {loading?<><div style={{width:16,height:16,borderRadius:"50%",border:"2px solid #ffffff44",borderTopColor:"#fff",animation:"spin 0.7s linear infinite"}}/>Creating account…</>:"Create Account →"}
      </button>
      <p style={{textAlign:"center",marginTop:18,color:"#64748B",fontSize:13}}>
        Already have an account?{" "}<button onClick={goSignIn} style={{background:"none",border:"none",color:C.primary,fontWeight:700,cursor:"pointer",fontSize:13}}>Sign in</button>
      </p>
    </AuthShell>
  );
}

// ── FORGOT PASSWORD ──
function ForgotPage({goSignIn}){
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [loading,setLoading]=useState(false);
  const handleReset=()=>{if(!email.includes("@"))return;setLoading(true);setTimeout(()=>{setLoading(false);setSent(true);},1400);};
  return(
    <AuthShell>
      {!sent?(
        <>
          <div style={{marginBottom:28}}>
            <div style={{fontSize:40,marginBottom:14}}>🔑</div>
            <h2 style={{fontSize:24,fontWeight:800,letterSpacing:-0.5,marginBottom:8}}>Forgot your password?</h2>
            <p style={{color:"#64748B",fontSize:14,lineHeight:1.6}}>No problem. Enter your email and we'll send you a reset link.</p>
          </div>
          <div style={{marginBottom:20}}><AuthInput label="Email Address" type="email" value={email} onChange={setEmail} placeholder="kavya@company.com" icon="✉️"/></div>
          <button onClick={handleReset} disabled={loading||!email.includes("@")} style={{width:"100%",background:(!email.includes("@")||loading)?"#1E293B":`linear-gradient(135deg,${C.primary},${C.cyan})`,border:"none",borderRadius:10,color:(!email.includes("@")||loading)?"#475569":"#fff",padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16}}>
            {loading?<><div style={{width:16,height:16,borderRadius:"50%",border:"2px solid #ffffff44",borderTopColor:"#fff",animation:"spin 0.7s linear infinite"}}/>Sending…</>:"Send Reset Link"}
          </button>
          <button onClick={goSignIn} style={{background:"none",border:"none",color:"#64748B",cursor:"pointer",fontSize:13,width:"100%",textAlign:"center"}}>← Back to Sign In</button>
        </>
      ):(
        <div style={{textAlign:"center",animation:"fadeIn 0.4s ease"}}>
          <div style={{fontSize:56,marginBottom:20}}>📬</div>
          <h2 style={{fontSize:22,fontWeight:800,marginBottom:10}}>Check your inbox</h2>
          <p style={{color:"#64748B",fontSize:14,lineHeight:1.7,marginBottom:24}}>We've sent a reset link to <strong style={{color:C.cyan}}>{email}</strong>. It expires in 30 minutes.</p>
          <button onClick={goSignIn} style={{background:`linear-gradient(135deg,${C.primary},${C.cyan})`,border:"none",borderRadius:10,color:"#fff",padding:"12px 32px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Back to Sign In</button>
        </div>
      )}
    </AuthShell>
  );
}

// ── UPLOAD ZONE ──
function UploadZone({onAnalyze}){
  const [dragging,setDragging]=useState(false);
  const [file,setFile]=useState(null);
  const [scanning,setScanning]=useState(false);
  const [progress,setProgress]=useState(0);
  const inputRef=useRef();
  const handleDrop=useCallback(e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f)setFile(f);},[]);
  const startScan=()=>{
    setScanning(true);setProgress(0);
    [5,15,28,44,58,70,82,91,97,100].forEach((p,i)=>setTimeout(()=>{setProgress(p);if(p===100)setTimeout(()=>{setScanning(false);onAnalyze(file);},500);},i*320));
  };
  const scanSteps=[
    {label:"Parsing file structure",done:progress>=20},{label:"Detecting column types",done:progress>=40},
    {label:"Scanning missing values",done:progress>=58},{label:"Checking duplicates",done:progress>=72},
    {label:"Validating formats",done:progress>=84},{label:"Running outlier detection",done:progress>=94},
    {label:"Generating AI insights",done:progress>=100},
  ];
  return(
    <div style={{padding:"32px 0"}}>
      {!file&&!scanning&&(
        <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={handleDrop} onClick={()=>inputRef.current.click()}
          style={{border:`2px dashed ${dragging?C.primary:C.border}`,borderRadius:16,padding:"56px 32px",textAlign:"center",cursor:"pointer",background:dragging?C.primary+"08":"transparent",transition:"all 0.2s"}}>
          <div style={{fontSize:48,marginBottom:16}}>📂</div>
          <div style={{color:C.textPri,fontWeight:600,fontSize:18,marginBottom:8}}>Drop your dataset here</div>
          <div style={{color:C.textSec,fontSize:14,marginBottom:24}}>Supports CSV and Excel (.xlsx) — up to 500MB</div>
          <button style={{background:C.primary,color:"#fff",border:"none",borderRadius:8,padding:"10px 28px",fontWeight:600,cursor:"pointer",fontSize:14}}>Browse Files</button>
          <input ref={inputRef} type="file" accept=".csv,.xlsx" style={{display:"none"}} onChange={e=>setFile(e.target.files[0])}/>
        </div>
      )}
      {file&&!scanning&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:24}}>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
            <div style={{width:48,height:48,borderRadius:12,background:C.primary+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{file.name.endsWith(".xlsx")?"📗":"📄"}</div>
            <div style={{flex:1}}><div style={{color:C.textPri,fontWeight:600}}>{file.name}</div><div style={{color:C.textSec,fontSize:13}}>{(file.size/1024/1024).toFixed(2)} MB</div></div>
            <button onClick={()=>setFile(null)} style={{background:"none",border:"none",color:C.textSec,cursor:"pointer",fontSize:18}}>✕</button>
          </div>
          <button onClick={startScan} style={{background:`linear-gradient(135deg,${C.primary},${C.cyan})`,color:"#fff",border:"none",borderRadius:8,padding:"11px 28px",fontWeight:700,cursor:"pointer",fontSize:14,width:"100%"}}>🔍 Run Quality Analysis</button>
        </div>
      )}
      {scanning&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:32}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{color:C.textPri,fontWeight:600}}>Analyzing dataset…</span>
            <span style={{color:C.primary,fontWeight:700}}>{progress}%</span>
          </div>
          <div style={{height:6,borderRadius:99,background:C.border,overflow:"hidden",marginBottom:28}}>
            <div style={{height:"100%",borderRadius:99,background:`linear-gradient(90deg,${C.primary},${C.cyan})`,width:`${progress}%`,transition:"width 0.3s ease"}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {scanSteps.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,opacity:s.done?1:0.4}}>
                <div style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,background:s.done?C.emerald+"22":C.border,color:s.done?C.emerald:C.textMut,border:`1px solid ${s.done?C.emerald:C.border}`,flexShrink:0}}>{s.done?"✓":"○"}</div>
                <span style={{color:s.done?C.textPri:C.textMut,fontSize:13}}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const NAV_ITEMS=[
  {id:"dashboard",icon:"⬡",label:"Dashboard"},{id:"upload",icon:"↑",label:"Upload Dataset"},
  {id:"analysis",icon:"◈",label:"Analysis Results"},{id:"recommendations",icon:"✦",label:"AI Recommendations"},
  {id:"history",icon:"◷",label:"Report History"},{id:"governance",icon:"⊞",label:"Data Governance"},
  {id:"settings",icon:"⚙",label:"Settings"},
];

// ── DASHBOARD ──
function DashboardPage({setPage}){
  return(
    <div style={{animation:"fadeIn 0.35s ease",display:"flex",flexDirection:"column",gap:24}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,letterSpacing:-0.5}}>Good morning, Kavya 👋</h1>
          <p style={{color:C.textSec,fontSize:14,marginTop:4}}>Your data quality is <span style={{color:C.emerald,fontWeight:600}}>up 4 points</span> since last week.</p>
        </div>
        <button onClick={()=>setPage("upload")} style={{background:`linear-gradient(135deg,${C.primary},${C.cyan})`,color:"#fff",border:"none",borderRadius:10,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontSize:13,flexShrink:0}}>+ Analyze New Dataset</button>
      </div>

      {/* Stat Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
        {[
          {label:"Total Records",value:"12,480",delta:"+3.2%",up:true,icon:"📊",color:C.cyan},
          {label:"Missing Values",value:"847",delta:"-18.4%",up:false,icon:"⚠️",color:C.amber},
          {label:"Duplicate Records",value:"124",delta:"-42.1%",up:false,icon:"🔁",color:C.rose},
          {label:"Outliers Found",value:"31",delta:"-11.4%",up:false,icon:"📈",color:C.violet},
        ].map((s,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"20px 20px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:s.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{s.icon}</div>
              <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,background:(s.up?C.rose:C.emerald)+"22",color:s.up?C.rose:C.emerald}}>{s.delta}</span>
            </div>
            <div style={{fontSize:26,fontWeight:800,letterSpacing:-1}}>{s.value}</div>
            <div style={{color:C.textSec,fontSize:12,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:16}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Quality Score Trend</div>
          <div style={{color:C.textSec,fontSize:12,marginBottom:16}}>Last 7 months</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={QUALITY_TREND}>
              <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={C.primary} stopOpacity={0}/>
              </linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="month" tick={{fill:C.textMut,fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis domain={[60,100]} tick={{fill:C.textMut,fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.textPri,fontSize:12}}/>
              <Area type="monotone" dataKey="score" stroke={C.primary} strokeWidth={2.5} fill="url(#sg)" dot={{fill:C.primary,r:4}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Issue Breakdown</div>
          <div style={{color:C.textSec,fontSize:12,marginBottom:12}}>By category</div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={ISSUE_BREAKDOWN} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                {ISSUE_BREAKDOWN.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Pie>
              <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.textPri,fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexDirection:"column",gap:5,marginTop:8}}>
            {ISSUE_BREAKDOWN.map((d,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:8,height:8,borderRadius:2,background:d.color,flexShrink:0}}/>
                  <span style={{fontSize:11,color:C.textSec}}>{d.name}</span>
                </div>
                <span style={{fontSize:11,fontWeight:600,color:d.color}}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Datasets */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:C.textPri}}>Recent Datasets</div>
            <div style={{color:C.textSec,fontSize:12,marginTop:2}}>Your latest quality analyses</div>
          </div>
          <button onClick={()=>setPage("history")} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,color:C.textSec,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>View All</button>
        </div>

        {/* Column Headers */}
        <div style={{display:"grid",gridTemplateColumns:"2.5fr 1.8fr 1.2fr 1.2fr",gap:16,padding:"0 16px 10px",borderBottom:`1px solid ${C.border}`,marginBottom:6}}>
          {["Dataset","Quality Score","Status","Uploaded"].map(h=>(
            <div key={h} style={{fontSize:11,fontWeight:700,color:C.textMut,textTransform:"uppercase",letterSpacing:0.7}}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        <div style={{display:"flex",flexDirection:"column",gap:2}}>
          {RECENT_DATASETS.map((d,i)=>(
            <div key={i}
              style={{display:"grid",gridTemplateColumns:"2.5fr 1.8fr 1.2fr 1.2fr",gap:16,alignItems:"center",padding:"13px 16px",borderRadius:10,cursor:"pointer",transition:"background 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#1E293B"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>

              {/* Dataset Name */}
              <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                <span style={{fontSize:20,flexShrink:0}}>{d.name.endsWith(".xlsx")?"📗":"📄"}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.textPri,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</div>
                  <div style={{fontSize:11,color:C.textMut,marginTop:2}}>{d.time}</div>
                </div>
              </div>

              {/* Quality Score */}
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:14,fontWeight:800,color:scoreColor(d.score)}}>{d.score}<span style={{fontSize:10,fontWeight:500,color:C.textMut}}>/100</span></span>
                </div>
                <div style={{width:"100%",height:6,borderRadius:99,background:C.border,overflow:"hidden"}}>
                  <div style={{width:`${d.score}%`,height:"100%",borderRadius:99,background:scoreColor(d.score)}}/>
                </div>
              </div>

              {/* Status */}
              <div>
                <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:99,fontSize:11,fontWeight:700,background:scoreColor(d.score)+"22",color:scoreColor(d.score),border:`1px solid ${scoreColor(d.score)}44`}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:scoreColor(d.score),display:"inline-block",flexShrink:0}}/>
                  {scoreLabel(d.score)}
                </span>
              </div>

              {/* Uploaded */}
              <div style={{fontSize:12,color:C.textSec}}>{d.time}</div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ── UPLOAD PAGE ──
function UploadPage({onAnalyze,setLastFile}){
  return(
    <div style={{animation:"fadeIn 0.35s ease",maxWidth:680,margin:"0 auto"}}>
      <h1 style={{fontSize:22,fontWeight:800,marginBottom:4}}>Upload Dataset</h1>
      <p style={{color:C.textSec,fontSize:14,marginBottom:8}}>Upload a CSV or Excel file for automated quality analysis.</p>
      <UploadZone onAnalyze={(f)=>{if(f&&setLastFile)setLastFile(f);onAnalyze(f);}}/>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:22,marginTop:8}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>💡 What gets analyzed?</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["Missing Values","Null, empty, or placeholder cells",C.amber],["Duplicate Records","Exact and near-duplicate rows",C.rose],["Email Validation","RFC-compliant format check",C.violet],["Phone Numbers","International format validation",C.cyan],["Date Formats","Consistency across ISO standards",C.primary],["Outlier Detection","IQR and z-score analysis",C.emerald]].map(([title,desc,color],i)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{width:8,height:8,borderRadius:2,background:color,marginTop:5,flexShrink:0}}/>
              <div><div style={{fontSize:13,fontWeight:600}}>{title}</div><div style={{fontSize:11,color:C.textSec,marginTop:1}}>{desc}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ANALYSIS PAGE ──
function AnalysisPage({fileName,fileSize,fileRecords}){
  const [tab,setTab]=useState("overview");
  const [selIdx,setSelIdx]=useState(null);
  const [rerun,setRerun]=useState("idle");
  const [rerunP,setRerunP]=useState(0);
  const [exported,setExported]=useState(false);
  const ALL=[...(fileName?[{name:fileName,size:fileSize||"–",records:fileRecords||"–",score:92,isNew:true}]:[]),
    {name:"customer_data_june.csv",size:"4.2 MB",records:"12,480",score:92},{name:"transactions_q2.xlsx",size:"18.7 MB",records:"48,200",score:78},
    {name:"product_catalog.csv",size:"1.1 MB",records:"3,210",score:61},{name:"vendor_contacts.xlsx",size:"0.4 MB",records:"890",score:44},{name:"marketing_leads_may.csv",size:"8.9 MB",records:"22,100",score:85}];
  const seen=new Set();
  const FILES=ALL.filter(f=>{if(seen.has(f.name))return false;seen.add(f.name);return true;});
  const active=FILES[selIdx!=null?selIdx:0];
  const doRerun=()=>{if(rerun!=="idle")return;setRerun("scanning");setRerunP(0);[10,25,42,60,78,92,100].forEach((p,i)=>setTimeout(()=>{setRerunP(p);if(p===100)setTimeout(()=>{setRerun("done");setTimeout(()=>setRerun("idle"),2500);},400);},i*340));};
  const doExport=()=>{const rows=[["Column","Type","Score","Issues"],["customer_email","email","72","8"],["phone_number","phone","58","21"],["created_at","date","91","3"],["revenue","numeric","84","6"],["customer_id","id","99","0"],["region","text","67","14"],["product_category","text","88","4"],["age","numeric","76","9"]];const uri="data:text/csv;charset=utf-8,"+encodeURIComponent(rows.map(r=>r.map(v=>'"'+v+'"').join(",")).join("\n"));const a=document.createElement("a");a.href=uri;a.download="quality-report-"+((active.name||"dataset").replace(/\.[^.]+$/,""))+".csv";document.body.appendChild(a);a.click();document.body.removeChild(a);setExported(true);setTimeout(()=>setExported(false),3000);};
  return(<div style={{animation:"fadeIn 0.35s ease",display:"flex",flexDirection:"column",gap:18}}>
    {rerun==="scanning"&&<div style={{background:C.card,border:`1px solid ${C.primary}44`,borderRadius:12,padding:"14px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:13,height:13,borderRadius:"50%",border:`2px solid ${C.primary}44`,borderTopColor:C.primary,animation:"spin 0.7s linear infinite"}}/><span style={{fontSize:13,fontWeight:600,color:C.textPri}}>Re-running analysis…</span></div><span style={{color:C.primary,fontWeight:700}}>{rerunP}%</span></div>
      <div style={{height:5,borderRadius:99,background:C.border,overflow:"hidden"}}><div style={{height:"100%",borderRadius:99,background:`linear-gradient(90deg,${C.primary},${C.cyan})`,width:`${rerunP}%`,transition:"width 0.3s"}}/></div>
    </div>}
    {rerun==="done"&&<div style={{background:C.emerald+"15",border:`1px solid ${C.emerald}44`,borderRadius:12,padding:"12px 18px",display:"flex",gap:9,alignItems:"center",animation:"fadeIn 0.2s ease"}}><span>✅</span><span style={{fontSize:13,fontWeight:600}}>Analysis complete!</span></div>}
    {exported&&<div style={{background:C.cyan+"15",border:`1px solid ${C.cyan}44`,borderRadius:12,padding:"12px 18px",display:"flex",gap:9,alignItems:"center",animation:"fadeIn 0.2s ease"}}><span>📥</span><span style={{fontSize:13,fontWeight:600}}>Report downloaded!</span></div>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
      <div><h1 style={{fontSize:22,fontWeight:800}}>Analysis Results</h1><p style={{color:C.textSec,fontSize:13,marginTop:3}}>Select a dataset to view its quality report</p></div>
      <div style={{display:"flex",gap:9}}>
        <button onClick={doExport} style={{background:exported?C.cyan+"22":C.card,border:`1px solid ${exported?C.cyan:C.border}`,borderRadius:8,color:exported?C.cyan:C.textSec,padding:"8px 16px",fontSize:12,cursor:"pointer",fontWeight:exported?600:400,transition:"all 0.2s"}}>{exported?"✓ Downloaded":"⬇ Export Report"}</button>
        <button onClick={doRerun} disabled={rerun!=="idle"} style={{background:rerun!=="idle"?C.border:`linear-gradient(135deg,${C.primary},${C.cyan})`,border:"none",borderRadius:8,color:"#fff",padding:"8px 16px",fontSize:12,cursor:rerun==="idle"?"pointer":"default",fontWeight:600}}>{rerun==="scanning"?"Scanning…":rerun==="done"?"✓ Done":"↺ Re-run"}</button>
      </div>
    </div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16}}>
      <div style={{fontSize:11,fontWeight:700,color:C.textMut,textTransform:"uppercase",letterSpacing:0.6,marginBottom:9}}>Select Dataset</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {FILES.map((f,i)=>{const isSel=(selIdx===i||(selIdx===null&&i===0));return(<div key={i} onClick={()=>setSelIdx(i)} style={{display:"flex",alignItems:"center",gap:11,padding:"10px 13px",borderRadius:9,cursor:"pointer",background:isSel?C.primary+"18":"#1A2235",border:`1.5px solid ${isSel?C.primary+"66":C.border}`,transition:"all 0.15s"}}>
          <span style={{fontSize:17,flexShrink:0}}>{f.name.endsWith(".xlsx")?"📗":"📄"}</span>
          <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:13,fontWeight:600,color:C.textPri,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>{f.isNew&&<span style={{fontSize:10,fontWeight:800,background:C.cyan+"22",color:C.cyan,border:`1px solid ${C.cyan}44`,borderRadius:99,padding:"1px 7px",flexShrink:0}}>NEW</span>}</div><div style={{fontSize:11,color:C.textMut,marginTop:1}}>{f.records} · {f.size}</div></div>
          <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:14,fontWeight:800,color:scoreColor(f.score)}}>{f.score}<span style={{fontSize:10,color:C.textMut}}>/100</span></div></div>
          {isSel&&<div style={{width:17,height:17,borderRadius:"50%",background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:"#fff",fontSize:9,fontWeight:800}}>✓</span></div>}
        </div>);})}
      </div>
    </div>
    <div style={{background:`linear-gradient(135deg,${C.card},${C.primary}14)`,border:`1px solid ${C.primary}33`,borderRadius:16,padding:"20px 22px"}}>
      <div style={{fontSize:11,fontWeight:700,color:C.textMut,textTransform:"uppercase",letterSpacing:0.6,marginBottom:12}}>Analyzing: <span style={{color:C.cyan,fontFamily:"monospace",fontSize:12}}>{active.name}</span></div>
      <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:14}}>
        <div style={{textAlign:"center",flexShrink:0}}><ScoreRing score={active.score} size={110} stroke={10}/><div style={{color:scoreColor(active.score),fontWeight:700,fontSize:12,marginTop:4}}>{scoreLabel(active.score)}</div></div>
        <div style={{flex:1,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,minWidth:0}}>
          {[{l:"Records",v:active.records,c:C.cyan},{l:"Passed",v:"11,633",c:C.emerald},{l:"Issues",v:"847",c:C.amber},{l:"Columns",v:"18",c:C.violet}].map((m,i)=>(
            <div key={i} style={{background:C.bg+"99",borderRadius:9,padding:"10px",border:`1px solid ${C.border}`}}><div style={{fontSize:16,fontWeight:800,color:m.c,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.v}</div><div style={{fontSize:10,color:C.textSec,marginTop:2}}>{m.l}</div></div>
          ))}
        </div>
      </div>
      <div style={{background:C.bg+"99",borderRadius:10,padding:"13px 16px",border:`1px solid ${C.border}`}}>
        <div style={{fontWeight:700,fontSize:11,color:C.textPri,marginBottom:9,textTransform:"uppercase",letterSpacing:0.5}}>Issue Breakdown</div>
        {ISSUES.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<ISSUES.length-1?7:0}}>
          <div style={{display:"flex",alignItems:"center",gap:5,width:118,flexShrink:0}}><div style={{width:7,height:7,borderRadius:2,background:d.color,flexShrink:0}}/><span style={{fontSize:11,color:C.textSec,whiteSpace:"nowrap"}}>{d.name}</span></div>
          <div style={{flex:1,height:6,borderRadius:99,background:C.border,overflow:"hidden"}}><div style={{width:`${d.value}%`,height:"100%",borderRadius:99,background:d.color}}/></div>
          <span style={{fontSize:11,fontWeight:700,color:d.color,width:30,textAlign:"right",flexShrink:0}}>{d.value}%</span>
        </div>)}
      </div>
    </div>
    <div style={{display:"flex",borderBottom:`1px solid ${C.border}`}}>
      {["overview","columns","duplicates","outliers"].map(t=><button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",padding:"10px 20px",cursor:"pointer",color:tab===t?C.primary:C.textSec,fontWeight:tab===t?700:400,fontSize:13,borderBottom:`2px solid ${tab===t?C.primary:"transparent"}`,textTransform:"capitalize",whiteSpace:"nowrap"}}>{t}</button>)}
    </div>
    {tab==="overview"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:22}}><div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Issues by Category</div><ResponsiveContainer width="100%" height={180}><BarChart data={ISSUES} layout="vertical" margin={{left:0,right:10}}><CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false}/><XAxis type="number" tick={{fill:C.textMut,fontSize:11}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" tick={{fill:C.textSec,fontSize:11}} axisLine={false} tickLine={false} width={110}/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.textPri,fontSize:12}}/><Bar dataKey="value" radius={[0,6,6,0]}>{ISSUES.map((d,i)=><Cell key={i} fill={d.color}/>)}</Bar></BarChart></ResponsiveContainer></div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:22}}><div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Completeness by Type</div><ResponsiveContainer width="100%" height={180}><BarChart data={[{t:"Email",v:92},{t:"Phone",v:79},{t:"Date",v:97},{t:"Numeric",v:95},{t:"Text",v:88},{t:"ID",v:100}]} margin={{right:8}}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="t" tick={{fill:C.textMut,fontSize:11}} axisLine={false} tickLine={false}/><YAxis domain={[70,100]} tick={{fill:C.textMut,fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.textPri,fontSize:12}}/><Bar dataKey="v" fill={C.primary} radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>
    </div>}
    {tab==="columns"&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed",minWidth:540}}>
        <colgroup><col style={{width:"28%"}}/><col style={{width:"12%"}}/><col style={{width:"25%"}}/><col style={{width:"18%"}}/><col style={{width:"17%"}}/></colgroup>
        <thead><tr style={{background:C.bg+"88",borderBottom:`1px solid ${C.border}`}}>{["Column","Type","Score","Issues","Status"].map(h=><th key={h} style={{padding:"10px 13px",textAlign:"left",fontSize:11,color:C.textMut,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
        <tbody>{COL_HEALTH.map((col,i)=><tr key={i} style={{borderBottom:`1px solid ${C.border}33`,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#1E293B66"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <td style={{padding:"10px 13px"}}><div style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:C.cyan,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{col.col}</div></td>
          <td style={{padding:"10px 13px"}}><span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:"#1E293B",color:C.textSec,border:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{col.type}</span></td>
          <td style={{padding:"10px 13px"}}><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{flex:1,height:5,borderRadius:99,background:C.border,overflow:"hidden"}}><div style={{width:`${col.score}%`,height:"100%",borderRadius:99,background:scoreColor(col.score)}}/></div><span style={{fontSize:12,fontWeight:800,color:scoreColor(col.score),flexShrink:0,minWidth:24,textAlign:"right"}}>{col.score}</span></div></td>
          <td style={{padding:"10px 13px",whiteSpace:"nowrap"}}><span style={{fontSize:11,fontWeight:600,color:col.issues>0?C.amber:C.emerald}}>{col.issues>0?`⚠ ${col.issues}`:"+  Clean"}</span></td>
          <td style={{padding:"10px 13px"}}><span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700,background:scoreColor(col.score)+"22",color:scoreColor(col.score),border:`1px solid ${scoreColor(col.score)}44`,whiteSpace:"nowrap"}}><span style={{width:5,height:5,borderRadius:"50%",background:scoreColor(col.score),display:"inline-block"}}/>{scoreLabel(col.score)}</span></td>
        </tr>)}</tbody>
      </table></div>
    </div>}
    {tab==="duplicates"&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:22}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Duplicate Analysis</div>
      <div style={{color:C.textSec,fontSize:13,marginBottom:16}}>124 duplicate records — 0.99% of dataset</div>
      {[{key:"customer_email",count:84,pct:67,desc:"Exact email matches"},{key:"customer_id",count:31,pct:25,desc:"Same ID appearing multiple times"},{key:"Full Row",count:9,pct:7,desc:"Identical records across all columns"}].map((d,i)=><div key={i} style={{background:"#1A2235",border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 15px",marginBottom:9}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}><div><div style={{fontFamily:"monospace",color:C.cyan,fontSize:13,fontWeight:700}}>{d.key}</div><div style={{color:C.textSec,fontSize:12,marginTop:2}}>{d.desc}</div></div><div style={{textAlign:"right",marginLeft:14}}><div style={{color:C.rose,fontWeight:800,fontSize:18}}>{d.count}</div><div style={{color:C.textMut,fontSize:11}}>{d.pct}%</div></div></div>
        <div style={{height:5,borderRadius:99,background:C.border,overflow:"hidden"}}><div style={{width:`${d.pct}%`,height:"100%",borderRadius:99,background:C.rose}}/></div>
      </div>)}
    </div>}
    {tab==="outliers"&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:22}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Outlier Detection</div>
      <div style={{color:C.textSec,fontSize:13,marginBottom:16}}>31 outliers via IQR & z-score</div>
      <ResponsiveContainer width="100%" height={200}><BarChart data={[{col:"revenue",low:3,high:2},{col:"age",low:5,high:1},{col:"quantity",low:0,high:4},{col:"discount",low:7,high:3},{col:"tax_rate",low:2,high:4}]} margin={{right:14}}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="col" tick={{fill:C.textMut,fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.textMut,fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.textPri,fontSize:12}}/><Legend wrapperStyle={{fontSize:12,color:C.textSec}}/><Bar dataKey="low" name="Below" fill={C.cyan} radius={[4,4,0,0]} stackId="a"/><Bar dataKey="high" name="Above" fill={C.rose} radius={[4,4,0,0]} stackId="a"/></BarChart></ResponsiveContainer>
    </div>}
  </div>);
}

function RecommendationsPage(){
  const [dataset,setDataset]=useState(0);
  const [applied,setApplied]=useState([]);
  const [history,setHistory]=useState([]); // version history snapshots
  const [showHistory,setShowHistory]=useState(false);
  const [loading,setLoading]=useState(false);
  const [aiHistory,setAiHistory]=useState([]);
  const [userQ,setUserQ]=useState("");
  const [applyAnim,setApplyAnim]=useState(null);
  const [exported,setExported]=useState(false);

  const ALL_FILES=[
    {name:"customer_data_june.csv",score:92,records:"12,480",recs:[
      {id:0,sev:"high",icon:"📞",col:"phone_number",title:"Invalid phone numbers",summary:"4,381 records (21%) have phone numbers that don't match any valid international format.",fix:"Standardize all numbers to E.164 format using libphonenumber.",effort:"Medium",impact:"Fixes CRM sync failures and SMS delivery errors."},
      {id:1,sev:"medium",icon:"✉️",col:"customer_email",title:"Bad email addresses",summary:"998 records contain emails with typos, missing @ symbols, or completely blank entries.",fix:"Add real-time email validation at sign-up. Run a bulk cleanup via ZeroBounce.",effort:"Low",impact:"Reduces bounce rate and protects sender reputation."},
      {id:2,sev:"medium",icon:"🗺️",col:"region",title:"Inconsistent region names",summary:"14 records use mixed formats for the same region — 'NY', 'New York', and 'new york'.",fix:"Normalize all values to a standard list using a lookup table or dropdown.",effort:"Low",impact:"Fixes broken segmentation in 3 downstream BI reports."},
      {id:3,sev:"low",icon:"💰",col:"revenue",title:"Unusual revenue values",summary:"6 records have revenue of $0.00 or $999,999.99 — far outside the expected range.",fix:"Review each record manually and add a validation rule to flag extreme values.",effort:"Low",impact:"Prevents skewed averages in financial reports."},
    ]},
    {name:"transactions_q2.xlsx",score:78,records:"48,200",recs:[
      {id:0,sev:"high",icon:"📅",col:"transaction_date",title:"Missing transaction dates",summary:"1,446 records (3%) are missing a transaction date, making them untrackable.",fix:"Back-fill from related order records where possible. Flag remaining for manual review.",effort:"Medium",impact:"Required for accurate quarterly revenue reporting."},
      {id:1,sev:"high",icon:"💳",col:"payment_method",title:"Invalid payment method codes",summary:"892 records contain unrecognised payment method codes not in the approved list.",fix:"Map unknown codes to the closest valid value. Add validation on future imports.",effort:"Medium",impact:"Causes reconciliation failures in the finance system."},
      {id:2,sev:"medium",icon:"🔁",col:"transaction_id",title:"Duplicate transaction IDs",summary:"317 transaction IDs appear more than once, suggesting double-processing.",fix:"Deduplicate by keeping the earliest record per ID. Investigate root cause.",effort:"High",impact:"Prevents double-counting in revenue totals."},
      {id:3,sev:"low",icon:"💱",col:"currency_code",title:"Mixed currency codes",summary:"23 records use 'USD' and 'US Dollar' interchangeably instead of the ISO standard.",fix:"Standardize all values to ISO 4217 currency codes (e.g. USD, EUR).",effort:"Low",impact:"Ensures consistent currency handling in reports."},
    ]},
    {name:"product_catalog.csv",score:61,records:"3,210",recs:[
      {id:0,sev:"high",icon:"🏷️",col:"product_name",title:"Missing product names",summary:"482 records (15%) have a blank product name, making them invisible in search.",fix:"Fill from SKU lookup table or flag for the product team to complete.",effort:"Medium",impact:"Blank names break product search and catalog displays."},
      {id:1,sev:"high",icon:"💲",col:"price",title:"Zero or negative prices",summary:"67 products have a price of $0.00 or a negative value — likely data entry errors.",fix:"Review each record. Set a validation rule to reject prices below $0.01.",effort:"Low",impact:"Prevents customers from checking out at $0 and revenue being miscounted."},
      {id:2,sev:"medium",icon:"📦",col:"category",title:"Inconsistent category names",summary:"Categories like 'Electronics', 'electronic', and 'ELECTRONICS' all refer to the same group.",fix:"Normalise all category values to Title Case using a canonical list.",effort:"Low",impact:"Fixes broken category filters and navigation on the storefront."},
      {id:3,sev:"medium",icon:"📏",col:"stock_quantity",title:"Missing stock quantities",summary:"214 products (6.7%) have no stock quantity, so inventory levels are unknown.",fix:"Set missing values to 0 and trigger a stock audit for those SKUs.",effort:"Low",impact:"Prevents overselling out-of-stock items."},
      {id:4,sev:"low",icon:"🖼️",col:"image_url",title:"Broken product image URLs",summary:"139 products link to images that return a 404 error.",fix:"Re-upload missing images and update the URLs. Add a broken-link checker.",effort:"Medium",impact:"Improves conversion rate — products without images sell ~40% less."},
    ]},
    {name:"vendor_contacts.xlsx",score:44,records:"890",recs:[
      {id:0,sev:"high",icon:"📞",col:"contact_phone",title:"Unformatted phone numbers",summary:"412 records (46%) have phone numbers in inconsistent formats with no country code.",fix:"Standardize to E.164 format. Request updated contacts from vendors where needed.",effort:"High",impact:"Prevents automated vendor outreach and contract renewal alerts from firing."},
      {id:1,sev:"high",icon:"✉️",col:"contact_email",title:"Invalid or missing emails",summary:"198 vendor records either have no email or contain an invalid address.",fix:"Cross-reference vendor records and reach out to update contact information.",effort:"High",impact:"Blocks automated PO confirmations and invoice notifications."},
      {id:2,sev:"medium",icon:"🏢",col:"company_name",title:"Duplicate vendor entries",summary:"34 vendors appear more than once under slightly different company names.",fix:"Merge duplicates keeping the most recently updated record.",effort:"Medium",impact:"Prevents sending duplicate POs and confusing payment runs."},
      {id:3,sev:"low",icon:"🌍",col:"country",title:"Missing country codes",summary:"77 vendor records have no country specified.",fix:"Fill from postal code or vendor address where available.",effort:"Low",impact:"Required for tax compliance and export regulation checks."},
    ]},
    {name:"marketing_leads_may.csv",score:85,records:"22,100",recs:[
      {id:0,sev:"medium",icon:"✉️",col:"email",title:"Unsubscribed emails still active",summary:"340 leads are marked as unsubscribed but still appear in active campaign lists.",fix:"Filter out unsubscribed contacts before every campaign export.",effort:"Low",impact:"Avoids regulatory fines and spam complaints under GDPR/CAN-SPAM."},
      {id:1,sev:"medium",icon:"📍",col:"lead_source",title:"Unknown lead sources",summary:"1,105 records (5%) have no lead source, making attribution impossible.",fix:"Require lead source on all intake forms. Mark existing unknowns as 'Unattributed'.",effort:"Low",impact:"Fixes marketing ROI reporting and channel budget decisions."},
      {id:2,sev:"low",icon:"👤",col:"first_name",title:"Missing first names",summary:"489 leads have no first name, so personalised emails will show blank greetings.",fix:"Use a fallback greeting like 'there' in email templates until names are collected.",effort:"Low",impact:"Improves email open rates and avoids awkward 'Hi ,' greetings."},
    ]},
  ];
  const SC={high:C.rose,medium:C.amber,low:C.cyan};
  const file=ALL_FILES[dataset];
  const RECS=file.recs;
  const openCount=RECS.filter(r=>!applied.includes(r.id)).length;

  const handleApply=(id)=>{
    // Save snapshot to version history before applying
    if(!applied.includes(id)){
      const rec=RECS.find(r=>r.id===id);
      setHistory(h=>[{id:Date.now(),appliedId:id,recTitle:rec.title,dataset:file.name,time:new Date().toLocaleTimeString()}, ...h]);
      setApplyAnim(id);
      setTimeout(()=>{setApplied(p=>[...p,id]);setApplyAnim(null);},600);
    }
  };

  const handleUndo=(snap)=>{
    setApplied(p=>p.filter(id=>id!==snap.appliedId));
    setHistory(h=>h.filter(s=>s.id!==snap.id));
  };

  const handleExport=()=>{
    const appliedRecs=RECS.filter(r=>applied.includes(r.id));
    const rows=[
      ["Dataset","Column","Issue","Fix Applied","Effort","Impact","Applied At"],
      ...appliedRecs.map(r=>{
        const snap=history.find(h=>h.appliedId===r.id);
        return [file.name,r.col,r.title,r.fix,r.effort,r.impact,snap?snap.time:"–"];
      }),
    ];
    const csv=rows.map(row=>row.map(v=>'"'+v+'"').join(",")).join("\n");
    const uri="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
    const a=document.createElement("a");a.href=uri;
    a.download="recommendations-applied-"+(file.name.replace(/\.[^.]+$/,""))+".csv";
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    setExported(true);setTimeout(()=>setExported(false),3000);
  };

  const askAI=async(q)=>{
    const question=q||userQ;if(!question.trim())return;
    setLoading(true);const newH=[...aiHistory,{role:"user",content:question}];setAiHistory(newH);setUserQ("");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,system:`You are a data quality analyst helping a user understand issues in their dataset. Dataset: ${file.name}, ${file.records} records, quality score ${file.score}/100. Current open issues: invalid phone numbers (21%), bad emails (8%), inconsistent regions (14 records), revenue outliers (6 records). Give clear, plain-English answers in 3-4 sentences. Be friendly and practical.`,messages:newH})});
      const data=await res.json();
      const reply=data.content?.map(b=>b.text||"").join("")||"Unable to respond.";
      setAiHistory([...newH,{role:"assistant",content:reply}]);
    }catch{setAiHistory([...newH,{role:"assistant",content:"Connection error. Please try again."}]);}
    setLoading(false);
  };

  return(<div style={{animation:"fadeIn 0.35s ease",display:"flex",flexDirection:"column",gap:20}}>

    {/* Header */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
      <div>
        <h1 style={{fontSize:22,fontWeight:800,letterSpacing:-0.3}}>AI Recommendations</h1>
        <p style={{color:C.textSec,fontSize:13,marginTop:3}}>Review and apply data quality fixes for your selected dataset</p>
      </div>
      <div style={{display:"flex",gap:9}}>
        {applied.length>0&&<button onClick={handleExport} style={{background:exported?C.emerald+"22":C.card,border:`1px solid ${exported?C.emerald:C.border}`,borderRadius:8,color:exported?C.emerald:C.textSec,padding:"8px 16px",fontSize:12,cursor:"pointer",fontWeight:exported?700:400,transition:"all 0.2s"}}>
          {exported?"✓ Downloaded":"⬇ Export Applied Fixes"}
        </button>}
        <button onClick={()=>setShowHistory(h=>!h)} style={{background:showHistory?C.violet+"22":C.card,border:`1px solid ${showHistory?C.violet+"55":C.border}`,borderRadius:8,color:showHistory?C.violet:C.textSec,padding:"8px 16px",fontSize:12,cursor:"pointer",fontWeight:showHistory?700:400}}>
          🕐 History {history.length>0&&`(${history.length})`}
        </button>
      </div>
    </div>

    {/* Dataset selector */}
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}>
      <div style={{fontSize:11,fontWeight:700,color:C.textMut,textTransform:"uppercase",letterSpacing:0.7,marginBottom:10}}>Showing recommendations for</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {ALL_FILES.map((f,i)=>(
          <button key={i} onClick={()=>{setDataset(i);setApplied([]);setHistory([]);setAiHistory([]);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:9,cursor:"pointer",border:`1.5px solid ${dataset===i?C.primary+"66":C.border}`,background:dataset===i?C.primary+"18":"#1A2235",transition:"all 0.15s"}}>
            <span style={{fontSize:15}}>{f.name.endsWith(".xlsx")?"📗":"📄"}</span>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:12,fontWeight:dataset===i?700:500,color:dataset===i?C.textPri:C.textSec,whiteSpace:"nowrap"}}>{f.name}</div>
              <div style={{fontSize:10,color:C.textMut}}>{f.records} records · <span style={{color:scoreColor(f.score),fontWeight:600}}>{f.score}/100</span></div>
            </div>
            {dataset===i&&<div style={{width:16,height:16,borderRadius:"50%",background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:"#fff",fontSize:9,fontWeight:800}}>✓</span></div>}
          </button>
        ))}
      </div>
    </div>

    {/* Summary bar */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
      {[{label:"Total Issues",value:RECS.length,color:C.textPri,icon:"📋"},{label:"High Priority",value:RECS.filter(r=>r.sev==="high").length,color:C.rose,icon:"🔴"},{label:"Fixes Applied",value:applied.length,color:C.emerald,icon:"✅"},{label:"Still Open",value:openCount,color:openCount>0?C.amber:C.emerald,icon:openCount>0?"⏳":"🎉"}].map((s,i)=>(
        <div key={i} style={{background:C.card,border:`1px solid ${s.color==="textPri"?C.border:s.color+"22"}`,borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22}}>{s.icon}</span>
          <div><div style={{fontSize:22,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div><div style={{fontSize:11,color:C.textSec,marginTop:2}}>{s.label}</div></div>
        </div>
      ))}
    </div>

    {/* Version history panel */}
    {showHistory&&<div style={{background:C.card,border:`1.5px solid ${C.violet}44`,borderRadius:14,padding:18,animation:"fadeIn 0.2s ease"}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:4,color:C.textPri}}>🕐 Applied Fix History</div>
      <div style={{color:C.textSec,fontSize:12,marginBottom:14}}>Undo any applied fix to revert your dataset to its previous state.</div>
      {history.length===0?<div style={{textAlign:"center",padding:"20px 0",color:C.textMut,fontSize:13}}>No fixes applied yet. Apply a recommendation to see it here.</div>:
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {history.map((snap,i)=>(
          <div key={snap.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:"#1A2235",borderRadius:10,border:`1px solid ${C.border}`}}>
            <div style={{width:32,height:32,borderRadius:8,background:C.emerald+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>✅</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:C.textPri,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{snap.recTitle}</div>
              <div style={{fontSize:11,color:C.textMut,marginTop:1}}>{snap.dataset} · Applied at {snap.time}</div>
            </div>
            <button onClick={()=>handleUndo(snap)} style={{background:C.rose+"18",border:`1px solid ${C.rose}33`,borderRadius:7,color:C.rose,padding:"5px 13px",fontSize:12,cursor:"pointer",fontWeight:600,flexShrink:0}}>↩ Undo</button>
          </div>
        ))}
      </div>}
    </div>}

    {/* Recommendation cards */}
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {RECS.map((r)=>{
        const isApplied=applied.includes(r.id);
        const isAnimating=applyAnim===r.id;
        return(
          <div key={r.id} style={{background:isApplied?"#0A1628":C.card,border:`1.5px solid ${isApplied?C.emerald+"44":SC[r.sev]+"55"}`,borderRadius:14,padding:"18px 20px",opacity:isApplied?0.7:1,transition:"all 0.4s",display:"flex",alignItems:"flex-start",gap:16}}>
            {/* Left: icon + severity */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flexShrink:0}}>
              <div style={{width:46,height:46,borderRadius:12,background:isApplied?C.emerald+"18":SC[r.sev]+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,transition:"all 0.4s"}}>{isApplied?"✅":r.icon}</div>
              <span style={{fontSize:10,fontWeight:800,padding:"2px 7px",borderRadius:99,background:SC[r.sev]+"22",color:SC[r.sev],textTransform:"uppercase",letterSpacing:0.5,border:`1px solid ${SC[r.sev]}44`}}>{r.sev}</span>
            </div>
            {/* Middle: content */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                <span style={{fontWeight:700,fontSize:15,color:isApplied?C.textSec:C.textPri}}>{r.title}</span>
                <code style={{fontSize:11,color:C.cyan,background:C.bg+"88",padding:"2px 8px",borderRadius:5}}>{r.col}</code>
                {isApplied&&<span style={{fontSize:11,fontWeight:700,color:C.emerald,background:C.emerald+"18",border:`1px solid ${C.emerald}33`,borderRadius:99,padding:"1px 9px"}}>✓ Applied</span>}
              </div>
              <p style={{fontSize:13,color:C.textSec,lineHeight:1.65,margin:"0 0 10px"}}>{r.summary}</p>
              <div style={{display:"flex",alignItems:"flex-start",gap:8,background:C.bg+"88",borderRadius:9,padding:"10px 13px",border:`1px solid ${C.border}`}}>
                <span style={{fontSize:14,flexShrink:0,marginTop:1}}>🔧</span>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:C.emerald,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>Suggested Fix</div>
                  <div style={{fontSize:12,color:C.textPri,lineHeight:1.6}}>{r.fix}</div>
                  <div style={{fontSize:11,color:C.textMut,marginTop:5}}>Effort: <span style={{color:C.textSec,fontWeight:600}}>{r.effort}</span> · {r.impact}</div>
                </div>
              </div>
            </div>
            {/* Right: action */}
            <div style={{flexShrink:0,display:"flex",flexDirection:"column",gap:7,alignItems:"flex-end"}}>
              {!isApplied?
                <button onClick={()=>handleApply(r.id)} style={{background:isAnimating?C.emerald:`linear-gradient(135deg,${C.primary},${C.cyan})`,border:"none",borderRadius:9,color:"#fff",padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.3s",whiteSpace:"nowrap",minWidth:110}}>
                  {isAnimating?"Applying…":"Apply Fix ✓"}
                </button>:
                <button onClick={()=>handleUndo({id:history.find(h=>h.appliedId===r.id)?.id,appliedId:r.id})} style={{background:"none",border:`1px solid ${C.rose}44`,borderRadius:9,color:C.rose,padding:"9px 18px",fontSize:12,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>↩ Undo</button>
              }
            </div>
          </div>
        );
      })}
    </div>

    {/* Ask AI */}
    <div style={{background:C.card,border:`1.5px solid ${C.primary}44`,borderRadius:14,overflow:"hidden"}}>
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,background:C.primary+"0A"}}>
        <div style={{width:38,height:38,borderRadius:10,background:`linear-gradient(135deg,${C.primary},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>✦</div>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:C.textPri}}>Ask AI About Your Data</div>
          <div style={{color:C.textSec,fontSize:12,marginTop:1}}>Ask anything about <span style={{color:C.cyan,fontFamily:"monospace"}}>{file.name}</span></div>
        </div>
      </div>
      <div style={{padding:"10px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:6,flexWrap:"wrap"}}>
        {["Which issue should I fix first?","How long will fixes take?","What's the business impact?","How do I fix the phone numbers?"].map((q,i)=>(
          <button key={i} onClick={()=>askAI(q)} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,color:C.textSec,padding:"4px 12px",fontSize:11,cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.color=C.primary;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textSec;}}>{q}</button>
        ))}
      </div>
      {aiHistory.length>0&&<div style={{maxHeight:280,overflowY:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:10}}>
        {aiHistory.map((msg,i)=>(
          <div key={i} style={{display:"flex",gap:9,justifyContent:msg.role==="user"?"flex-end":"flex-start"}}>
            {msg.role==="assistant"&&<div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${C.primary},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0,marginTop:2}}>✦</div>}
            <div style={{maxWidth:"78%",padding:"9px 13px",borderRadius:msg.role==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px",background:msg.role==="user"?C.primary+"33":"#1A2235",border:`1px solid ${msg.role==="user"?C.primary+"44":C.border}`,fontSize:13,color:C.textPri,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{msg.content}</div>
            {msg.role==="user"&&<div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${C.violet},${C.primary})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,marginTop:2}}>KK</div>}
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:9}}><div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${C.primary},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>✦</div><div style={{padding:"10px 14px",background:"#1A2235",border:`1px solid ${C.border}`,borderRadius:"12px 12px 12px 4px",display:"flex",gap:5,alignItems:"center"}}>{[0,1,2].map(d=><div key={d} style={{width:6,height:6,borderRadius:"50%",background:C.primary,animation:`pulse 1.2s ease ${d*0.2}s infinite`}}/>)}</div></div>}
      </div>}
      {aiHistory.length===0&&<div style={{padding:"24px 18px",textAlign:"center"}}><div style={{fontSize:30,marginBottom:8}}>💬</div><div style={{color:C.textSec,fontSize:13}}>Pick a question above or type your own below</div></div>}
      <div style={{padding:"12px 18px",borderTop:`1px solid ${C.border}`,display:"flex",gap:9,background:C.bg+"44"}}>
        <input value={userQ} onChange={e=>setUserQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!loading&&askAI()} placeholder="Type a question and press Enter…" disabled={loading} style={{flex:1,background:"#1E293B",border:`1.5px solid ${C.border}`,borderRadius:9,color:"#F1F5F9",padding:"10px 14px",fontSize:13,outline:"none"}} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
        <button onClick={()=>askAI()} disabled={loading||!userQ.trim()} style={{background:(!userQ.trim()||loading)?C.border:`linear-gradient(135deg,${C.primary},${C.cyan})`,border:"none",borderRadius:9,color:"#fff",padding:"10px 20px",fontWeight:700,cursor:(!userQ.trim()||loading)?"default":"pointer",fontSize:13,flexShrink:0}}>{loading?"Thinking…":"Ask →"}</button>
      </div>
    </div>

  </div>);
}

function HistoryPage(){
  const [filter,setFilter]=useState("all");
  const filtered=filter==="all"?RECENT_DATASETS:RECENT_DATASETS.filter(d=>d.status===filter);
  return(
    <div style={{animation:"fadeIn 0.35s ease",display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><h1 style={{fontSize:22,fontWeight:800}}>Report History</h1><p style={{color:C.textSec,fontSize:13,marginTop:3}}>All your past data quality analyses</p></div>
        <button style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSec,padding:"8px 16px",fontSize:12,cursor:"pointer"}}>⬇ Export All</button>
      </div>
      <div style={{display:"flex",gap:8}}>
        {["all","excellent","good","fair","poor"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{background:filter===f?C.primary+"22":C.card,border:`1px solid ${filter===f?C.primary+"55":C.border}`,borderRadius:8,color:filter===f?C.primary:C.textSec,padding:"6px 16px",fontSize:12,cursor:"pointer",fontWeight:filter===f?600:400,textTransform:"capitalize"}}>{f}</button>
        ))}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>Score History</div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={QUALITY_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="month" tick={{fill:C.textMut,fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis domain={[60,100]} tick={{fill:C.textMut,fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.textPri,fontSize:12}}/>
            <Line type="monotone" dataKey="score" stroke={C.cyan} strokeWidth={2.5} dot={{fill:C.cyan,r:4}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map((d,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:16}}>
            <span style={{fontSize:24}}>{d.name.endsWith(".xlsx")?"📗":"📄"}</span>
            <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{d.name}</div><div style={{color:C.textSec,fontSize:12,marginTop:2}}>{d.records.toLocaleString()} records · {d.size} · {d.time}</div></div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:scoreColor(d.score)}}>{d.score}</div><div style={{fontSize:10,color:C.textSec}}>Score</div></div>
              <Badge color={scoreColor(d.score)}>{scoreLabel(d.score)}</Badge>
              <button style={{background:C.primary+"22",border:`1px solid ${C.primary}44`,borderRadius:7,color:C.primary,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:600}}>View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── GOVERNANCE PAGE ──
function GovernancePage(){
  const [selDataset,setSelDataset]=useState(null);
  const DATASETS_GOV=[
    {name:"customer_data_june.csv",owner:"Kavya Kundeti",initials:"KK",dept:"Marketing",deptColor:C.cyan,reviewed:"Today",reviewedDays:0,score:92,sla:"Met",issues:2,records:"12,480",desc:"Primary customer database used for CRM, email campaigns, and revenue reporting."},
    {name:"transactions_q2.xlsx",owner:"Marcus Smith",initials:"MS",dept:"Finance",deptColor:C.emerald,reviewed:"2 days ago",reviewedDays:2,score:78,sla:"Met",issues:4,records:"48,200",desc:"All Q2 financial transactions. Used for quarterly reporting and reconciliation."},
    {name:"product_catalog.csv",owner:"Aisha Jones",initials:"AJ",dept:"Product",deptColor:C.violet,reviewed:"1 week ago",reviewedDays:7,score:61,sla:"At Risk",issues:5,records:"3,210",desc:"Master list of all products, prices, and inventory. Powers the storefront and warehouse."},
    {name:"vendor_contacts.xlsx",owner:"Ryan Chen",initials:"RC",dept:"Operations",deptColor:C.amber,reviewed:"3 weeks ago",reviewedDays:21,score:44,sla:"Breached",issues:4,records:"890",desc:"Supplier contact details used for procurement, POs, and contract renewals."},
    {name:"marketing_leads_may.csv",owner:"Kavya Kundeti",initials:"KK",dept:"Marketing",deptColor:C.cyan,reviewed:"2 days ago",reviewedDays:2,score:85,sla:"Met",issues:3,records:"22,100",desc:"May campaign leads pipeline. Used for outreach scoring and attribution reporting."},
  ];
  const sla=d=>d.sla==="Met"?C.emerald:d.sla==="At Risk"?C.amber:C.rose;
  const slaIcon=d=>d.sla==="Met"?"✅":d.sla==="At Risk"?"⚠️":"🚨";
  const needsReview=DATASETS_GOV.filter(d=>d.reviewedDays>=7);
  const breached=DATASETS_GOV.filter(d=>d.sla==="Breached");
  const atRisk=DATASETS_GOV.filter(d=>d.sla==="At Risk");
  const avgScore=Math.round(DATASETS_GOV.reduce((a,d)=>a+d.score,0)/DATASETS_GOV.length);

  return(<div style={{animation:"fadeIn 0.35s ease",display:"flex",flexDirection:"column",gap:20}}>

    {/* Header */}
    <div>
      <h1 style={{fontSize:22,fontWeight:800,letterSpacing:-0.3}}>Data Governance</h1>
      <p style={{color:C.textSec,fontSize:13,marginTop:4,lineHeight:1.6,maxWidth:600}}>
        This page shows <strong style={{color:C.textPri}}>who is responsible</strong> for each dataset, <strong style={{color:C.textPri}}>how healthy</strong> it is, and <strong style={{color:C.textPri}}>whether it meets your quality standards</strong>. Think of it as your data health checklist.
      </p>
    </div>

    {/* 4 plain-English KPI cards */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      {[
        {icon:"🗂️",value:DATASETS_GOV.length,label:"Datasets being tracked",sub:"across all departments",color:C.cyan},
        {icon:"📈",value:avgScore+"/100",label:"Average quality score",sub:avgScore>=80?"Healthy overall":"Needs attention",color:scoreColor(avgScore)},
        {icon:"⏰",value:needsReview.length,label:"Need review now",sub:"Not checked in 7+ days",color:needsReview.length>0?C.amber:C.emerald},
        {icon:"🚨",value:breached.length,label:"SLA breached",sub:"Quality standard not met",color:breached.length>0?C.rose:C.emerald},
      ].map((k,i)=>(
        <div key={i} style={{background:C.card,border:`1.5px solid ${k.color}33`,borderRadius:14,padding:"18px 16px"}}>
          <div style={{fontSize:26,marginBottom:10}}>{k.icon}</div>
          <div style={{fontSize:26,fontWeight:900,color:k.color,lineHeight:1,marginBottom:4}}>{k.value}</div>
          <div style={{fontSize:13,fontWeight:600,color:C.textPri,marginBottom:2}}>{k.label}</div>
          <div style={{fontSize:11,color:C.textMut}}>{k.sub}</div>
        </div>
      ))}
    </div>

    {/* Attention banner — only shows if action needed */}
    {(breached.length>0||atRisk.length>0)&&(
      <div style={{background:C.rose+"0F",border:`1.5px solid ${C.rose}33`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"flex-start",gap:12}}>
        <span style={{fontSize:22,flexShrink:0}}>🚨</span>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:C.textPri,marginBottom:4}}>Action needed</div>
          <div style={{fontSize:13,color:C.textSec,lineHeight:1.7}}>
            {breached.length>0&&<><strong style={{color:C.rose}}>{breached.map(d=>d.name).join(", ")}</strong> {breached.length===1?"has":"have"} breached its quality SLA — the data is below the minimum standard and should be reviewed immediately. </>}
            {atRisk.length>0&&<><strong style={{color:C.amber}}>{atRisk.map(d=>d.name).join(", ")}</strong> {atRisk.length===1?"is":"are"} at risk of breaching. Schedule a review soon.</>}
          </div>
        </div>
      </div>
    )}

    {/* Dataset cards — one per dataset, clear and scannable */}
    <div>
      <div style={{fontSize:12,fontWeight:700,color:C.textMut,textTransform:"uppercase",letterSpacing:0.7,marginBottom:12}}>All Datasets — Ownership & Health</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {DATASETS_GOV.map((d,i)=>{
          const isOpen=selDataset===i;
          return(
            <div key={i} style={{background:C.card,border:`1.5px solid ${isOpen?sla(d)+"66":sla(d)+"22"}`,borderRadius:14,overflow:"hidden",transition:"all 0.2s",cursor:"pointer"}} onClick={()=>setSelDataset(isOpen?null:i)}>
              {/* Row summary — always visible */}
              <div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:16}}>
                {/* File icon */}
                <span style={{fontSize:24,flexShrink:0}}>{d.name.endsWith(".xlsx")?"📗":"📄"}</span>
                {/* Name + description */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                    <span style={{fontSize:14,fontWeight:700,color:C.textPri,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</span>
                    <Badge color={d.deptColor}>{d.dept}</Badge>
                  </div>
                  <div style={{fontSize:12,color:C.textSec}}>{d.desc}</div>
                </div>
                {/* Owner */}
                <div style={{textAlign:"center",flexShrink:0}}>
                  <div style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${d.deptColor}88,${d.deptColor})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"#fff",margin:"0 auto 3px"}}>{d.initials}</div>
                  <div style={{fontSize:10,color:C.textMut,whiteSpace:"nowrap"}}>{d.owner.split(" ")[0]}</div>
                </div>
                {/* Score */}
                <div style={{textAlign:"center",flexShrink:0,minWidth:52}}>
                  <div style={{fontSize:20,fontWeight:900,color:scoreColor(d.score),lineHeight:1}}>{d.score}</div>
                  <div style={{fontSize:10,color:C.textMut,marginTop:2}}>Quality</div>
                </div>
                {/* SLA status */}
                <div style={{textAlign:"center",flexShrink:0}}>
                  <div style={{fontSize:20}}>{slaIcon(d)}</div>
                  <div style={{fontSize:10,fontWeight:700,color:sla(d),marginTop:1,whiteSpace:"nowrap"}}>{d.sla}</div>
                </div>
                {/* Expand arrow */}
                <div style={{color:C.textMut,fontSize:14,flexShrink:0,transition:"transform 0.2s",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>▼</div>
              </div>

              {/* Expanded detail — visible on click */}
              {isOpen&&<div style={{borderTop:`1px solid ${C.border}`,padding:"16px 20px",background:"#0D1625",animation:"fadeIn 0.2s ease"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
                  {[
                    {icon:"👤",label:"Dataset Owner",value:d.owner,sub:"Responsible for quality",color:d.deptColor},
                    {icon:"📅",label:"Last Reviewed",value:d.reviewed,sub:d.reviewedDays>=7?"⚠️ Overdue for review":"✓ Recently checked",color:d.reviewedDays>=7?C.amber:C.emerald},
                    {icon:"📋",label:"Open Issues",value:d.issues+" issue"+(d.issues!==1?"s":""),sub:"Pending fixes needed",color:d.issues>3?C.rose:d.issues>1?C.amber:C.emerald},
                  ].map((item,j)=>(
                    <div key={j} style={{background:C.card,borderRadius:10,padding:"13px 14px",border:`1px solid ${item.color}22`}}>
                      <div style={{fontSize:18,marginBottom:6}}>{item.icon}</div>
                      <div style={{fontSize:14,fontWeight:700,color:item.color,marginBottom:2}}>{item.value}</div>
                      <div style={{fontSize:11,fontWeight:600,color:C.textSec,marginBottom:1}}>{item.label}</div>
                      <div style={{fontSize:11,color:C.textMut}}>{item.sub}</div>
                    </div>
                  ))}
                </div>
                {/* Quality bar */}
                <div style={{background:C.card,borderRadius:10,padding:"13px 16px",border:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:12,fontWeight:600,color:C.textSec}}>Quality Score</span>
                    <span style={{fontSize:14,fontWeight:800,color:scoreColor(d.score)}}>{d.score}/100 — {scoreLabel(d.score)}</span>
                  </div>
                  <div style={{height:8,borderRadius:99,background:C.border,overflow:"hidden"}}>
                    <div style={{width:`${d.score}%`,height:"100%",borderRadius:99,background:`linear-gradient(90deg,${scoreColor(d.score)}88,${scoreColor(d.score)})`,transition:"width 0.6s ease"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                    <span style={{fontSize:11,color:C.textMut}}>0 — Critical</span>
                    <span style={{fontSize:11,color:C.textMut}}>100 — Perfect</span>
                  </div>
                </div>
              </div>}
            </div>
          );
        })}
      </div>
    </div>

    {/* What these terms mean — plain English glossary */}
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20}}>
      <div style={{fontWeight:700,fontSize:14,color:C.textPri,marginBottom:4}}>📖 What do these terms mean?</div>
      <div style={{fontSize:12,color:C.textSec,marginBottom:14}}>New to data governance? Here's a plain-English guide to what you're looking at.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[
          {term:"Dataset Owner",icon:"👤",meaning:"The person responsible for keeping this data accurate and up to date. If something is wrong, they are the first point of contact."},
          {term:"Quality Score",icon:"📈",meaning:"A number from 0–100 showing how clean and complete the data is. Above 80 is healthy. Below 60 needs urgent attention."},
          {term:"SLA (Service Level Agreement)",icon:"📋",meaning:"A quality standard the team has agreed to meet. 'Met' means it's fine. 'At Risk' means it's slipping. 'Breached' means it's failed."},
          {term:"Last Reviewed",icon:"📅",meaning:"How recently someone actually opened and checked this dataset. If it hasn't been checked in over a week, it might have unnoticed problems."},
        ].map((item,i)=>(
          <div key={i} style={{background:"#1A2235",borderRadius:10,padding:"13px 15px",border:`1px solid ${C.border}`,display:"flex",gap:11,alignItems:"flex-start"}}>
            <span style={{fontSize:20,flexShrink:0}}>{item.icon}</span>
            <div><div style={{fontSize:12,fontWeight:700,color:C.textPri,marginBottom:4}}>{item.term}</div><div style={{fontSize:12,color:C.textSec,lineHeight:1.65}}>{item.meaning}</div></div>
          </div>
        ))}
      </div>
    </div>

  </div>);
}

// ── SETTINGS PAGE ──

function SettingsPage(){
  const [activeTab,setActiveTab]=useState("profile");
  const [saved,setSaved]=useState(false);
  const [profile,setProfile]=useState({firstName:"Kavya",lastName:"Kundeti",email:"kavya.kundeti@company.com",phone:"+1 (555) 012-3456",role:"Data Analyst",org:"Acme Corporation",dept:"Marketing & Analytics",tz:"America/New_York",bio:"Data quality specialist."});
  const [thresh,setThresh]=useState(75);
  const [toggles,setToggles]=useState({email:true,slack:true,weekly:true,auto:false});
  const [integrations,setIntegrations]=useState([{name:"Power BI",icon:"📊",on:true},{name:"Google Sheets",icon:"📗",on:false},{name:"Slack",icon:"💬",on:true},{name:"Jira",icon:"🎯",on:false},{name:"Teams",icon:"🟦",on:false},{name:"Webhook",icon:"🔗",on:false}]);
  const up=(k,v)=>setProfile(p=>({...p,[k]:v}));
  const Toggle=({on,onChange})=>(<div onClick={onChange} style={{width:42,height:22,borderRadius:11,background:on?C.primary:"#2A3347",cursor:"pointer",position:"relative",transition:"background 0.2s",border:`1px solid ${on?C.primary:C.border}`,flexShrink:0}}><div style={{width:16,height:16,borderRadius:"50%",background:on?"#fff":"#64748B",position:"absolute",top:2,left:on?22:2,transition:"left 0.2s"}}/></div>);
  const FI=({label,value,onChange,type="text"})=>(<div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:0.7}}>{label}</label><input type={type} value={value} onChange={e=>onChange&&onChange(e.target.value)} style={{background:"#1E293B",border:"1.5px solid #2E3F55",borderRadius:8,color:"#F1F5F9",padding:"9px 11px",fontSize:13,outline:"none"}} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor="#2E3F55"}/></div>);
  const TABS=[{id:"profile",label:"Profile",icon:"👤"},{id:"security",label:"Security",icon:"🔒"},{id:"alerts",label:"Alerts",icon:"🔔"},{id:"integrations",label:"Integrations",icon:"🔗"}];
  return(<div style={{animation:"fadeIn 0.35s ease"}}>
    {saved&&<div style={{position:"fixed",top:20,right:28,zIndex:9999,background:C.emerald,color:"#fff",borderRadius:10,padding:"10px 18px",fontWeight:700,fontSize:13,animation:"fadeIn 0.2s ease"}}>✓ Changes saved</div>}
    <div style={{marginBottom:18}}><h1 style={{fontSize:22,fontWeight:800}}>Settings</h1><p style={{color:C.textSec,fontSize:13,marginTop:3}}>Manage your account and preferences</p></div>
    <div style={{display:"flex",gap:18,alignItems:"flex-start"}}>
      <div style={{width:176,flexShrink:0,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:7,display:"flex",flexDirection:"column",gap:2}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 11px",borderRadius:7,cursor:"pointer",border:"none",background:activeTab===t.id?C.primary+"22":"transparent",color:activeTab===t.id?C.primary:"#94A3B8",fontWeight:activeTab===t.id?700:400,fontSize:12,textAlign:"left"}}><span>{t.icon}</span>{t.label}</button>)}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:14}}>
        {activeTab==="profile"&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:18}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${C.violet},${C.primary})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:22,color:"#fff",flexShrink:0}}>{profile.firstName[0]}{profile.lastName[0]}</div>
            <div><div style={{fontWeight:700,fontSize:16}}>{profile.firstName} {profile.lastName}</div><div style={{color:"#94A3B8",fontSize:13,marginTop:1}}>{profile.email}</div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FI label="First Name" value={profile.firstName} onChange={v=>up("firstName",v)}/>
            <FI label="Last Name" value={profile.lastName} onChange={v=>up("lastName",v)}/>
            <FI label="Email" value={profile.email} onChange={v=>up("email",v)} type="email"/>
            <FI label="Phone" value={profile.phone} onChange={v=>up("phone",v)}/>
            <FI label="Role" value={profile.role} onChange={v=>up("role",v)}/>
            <FI label="Organization" value={profile.org} onChange={v=>up("org",v)}/>
          </div>
          <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:0.7}}>Bio</label><textarea value={profile.bio} onChange={e=>up("bio",e.target.value)} rows={2} style={{background:"#1E293B",border:"1.5px solid #2E3F55",borderRadius:8,color:"#F1F5F9",padding:"9px 11px",fontSize:13,outline:"none",resize:"vertical",fontFamily:"inherit"}} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor="#2E3F55"}/></div>
        </div>}
        {activeTab==="security"&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Active Sessions</div>
          {[{d:"Chrome on macOS",l:"Philadelphia, PA",t:"Now",cur:true},{d:"Safari on iPhone",l:"New York, NY",t:"2 days ago",cur:false},{d:"Chrome on Windows",l:"Remote",t:"5 days ago",cur:false}].map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:i<2?`1px solid ${C.border}44`:"none"}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:17}}>{s.d.includes("iPhone")?"📱":"💻"}</span><div><div style={{fontSize:13,fontWeight:500,color:C.textPri}}>{s.d}{s.cur&&<span style={{marginLeft:7,fontSize:10,background:C.emerald+"22",color:C.emerald,borderRadius:99,padding:"1px 7px"}}>Current</span>}</div><div style={{fontSize:12,color:"#64748B"}}>{s.l} · {s.t}</div></div></div>
            {!s.cur&&<button style={{background:C.rose+"15",border:`1px solid ${C.rose}33`,borderRadius:7,color:C.rose,padding:"4px 11px",fontSize:11,cursor:"pointer",fontWeight:600}}>Revoke</button>}
          </div>)}
        </div>}
        {activeTab==="alerts"&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Notification Preferences</div>
          {[{k:"email",l:"Email Alerts",d:"When quality drops below threshold",icon:"✉️"},{k:"slack",l:"Slack",d:"Post alerts to Slack workspace",icon:"💬"},{k:"weekly",l:"Weekly Report",d:"Summary every Monday",icon:"📊"},{k:"auto",l:"Auto Scans",d:"Run scheduled scans automatically",icon:"🔄"}].map((item,i,arr)=><div key={item.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<arr.length-1?`1px solid ${C.border}44`:"none"}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{width:34,height:34,borderRadius:8,background:"#1A2235",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{item.icon}</div><div><div style={{fontSize:13,fontWeight:600}}>{item.l}</div><div style={{fontSize:11,color:"#64748B",marginTop:1}}>{item.d}</div></div></div>
            <Toggle on={toggles[item.k]} onChange={()=>setToggles(t=>({...t,[item.k]:!t[item.k]}))}/>
          </div>)}
          <div style={{marginTop:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:13,fontWeight:600}}>Alert Threshold</span><span style={{fontSize:18,fontWeight:800,color:scoreColor(thresh)}}>{thresh}</span></div><input type="range" min={0} max={100} value={thresh} onChange={e=>setThresh(+e.target.value)} style={{width:"100%",accentColor:scoreColor(thresh)}}/></div>
        </div>}
        {activeTab==="integrations"&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Connected Apps</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {integrations.map((int,i)=><div key={i} style={{background:"#1A2235",border:`1.5px solid ${int.on?C.primary+"44":C.border}`,borderRadius:10,padding:"13px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>{int.icon}</span><div style={{fontSize:13,fontWeight:700}}>{int.name}</div></div><Toggle on={int.on} onChange={()=>setIntegrations(list=>list.map((item,idx)=>idx===i?{...item,on:!item.on}:item))}/></div>
              <div style={{fontSize:11,color:int.on?C.emerald:"#475569",fontWeight:600}}>{int.on?"● Connected":"○ Disconnected"}</div>
            </div>)}
          </div>
        </div>}
        <div style={{display:"flex",gap:9}}><button onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2500);}} style={{background:`linear-gradient(135deg,${C.primary},${C.cyan})`,border:"none",borderRadius:9,color:"#fff",padding:"10px 26px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Save Changes</button><button style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:9,color:"#64748B",padding:"10px 18px",fontSize:14,cursor:"pointer"}}>Discard</button></div>
      </div>
    </div>
  </div>);
}

function ManagePlanModal({onClose,onEnterprise}){
  const [view,setView]=useState("main");
  const [downloaded,setDownloaded]=useState([]);
  const [cancelStep,setCancelStep]=useState(1);
  const [cancelReason,setCancelReason]=useState("");
  const [cardForm,setCardForm]=useState({number:"",expiry:"",cvv:"",name:""});
  const W=({ch,w=500})=>(<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}><div onClick={e=>e.stopPropagation()} style={{width:w,background:"#161D2F",border:"1px solid #1E293B",borderRadius:18,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.6)",maxHeight:"88vh",overflowY:"auto"}}>{ch}</div></div>);
  const H=({t,s,back})=>(<div style={{background:"linear-gradient(135deg,#4F46E533,#06B6D418)",padding:"18px 22px",borderBottom:"1px solid #1E293B",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>{back&&<button onClick={()=>setView("main")} style={{background:"#1E293B",border:"1px solid #1E293B",borderRadius:7,color:"#94A3B8",width:28,height:28,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>}<div><div style={{fontWeight:800,fontSize:15,color:"#F8FAFC"}}>{t}</div>{s&&<div style={{color:"#94A3B8",fontSize:12,marginTop:2}}>{s}</div>}</div></div>
    <button onClick={onClose} style={{background:"#1E293B",border:"1px solid #1E293B",borderRadius:7,color:"#94A3B8",width:28,height:28,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
  </div>);
  if(view==="upgrade")return(<W ch={<><H t="Upgrade to Annual" s="Save 20%" back/><div style={{padding:"20px 22px",display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div style={{background:"#1A2235",border:"1px solid #1E293B",borderRadius:10,padding:14}}><div style={{fontSize:11,color:"#64748B",fontWeight:700,marginBottom:7}}>CURRENT</div><div style={{fontSize:24,fontWeight:900,color:"#F8FAFC"}}>$49<span style={{fontSize:12,color:"#64748B"}}>/mo</span></div><div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>$588/year</div></div>
      <div style={{background:"linear-gradient(135deg,#4F46E522,#06B6D418)",border:"2px solid #4F46E555",borderRadius:10,padding:14,position:"relative"}}><div style={{position:"absolute",top:-10,right:10,background:"linear-gradient(135deg,#10B981,#06B6D4)",borderRadius:99,padding:"2px 9px",fontSize:10,fontWeight:800,color:"#fff"}}>SAVE 20%</div><div style={{fontSize:11,color:"#10B981",fontWeight:700,marginBottom:7}}>ANNUAL</div><div style={{fontSize:24,fontWeight:900,color:"#F8FAFC"}}>$39<span style={{fontSize:12,color:"#64748B"}}>/mo</span></div><div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>$470/year</div></div>
    </div>
    <div style={{background:"#10B98118",border:"1px solid #10B98133",borderRadius:9,padding:"10px 13px",display:"flex",gap:8,alignItems:"center"}}><span>💰</span><span style={{fontSize:13,color:"#F8FAFC"}}>You save <strong style={{color:"#10B981"}}>$118/year</strong></span></div>
    <div style={{display:"flex",gap:10}}><button onClick={()=>setView("success-upgrade")} style={{flex:1,background:"linear-gradient(135deg,#4F46E5,#06B6D4)",border:"none",borderRadius:9,color:"#fff",padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Confirm — Pay $470</button><button onClick={()=>setView("main")} style={{background:"none",border:"1px solid #1E293B",borderRadius:9,color:"#94A3B8",padding:"11px 14px",fontSize:13,cursor:"pointer"}}>Cancel</button></div>
  </div></>}/>);
  if(view==="success-upgrade")return(<W w={420} ch={<div style={{padding:"44px 28px",textAlign:"center"}}><div style={{fontSize:52,marginBottom:14}}>🎉</div><div style={{fontSize:19,fontWeight:800,marginBottom:8}}>You\'re on Annual!</div><div style={{fontSize:13,color:"#94A3B8",lineHeight:1.7,maxWidth:300,margin:"0 auto 22px"}}>Upgraded! $470 charged to Visa ****4242. Next renewal June 10, 2027.</div><button onClick={onClose} style={{background:"linear-gradient(135deg,#4F46E5,#06B6D4)",border:"none",borderRadius:9,color:"#fff",padding:"10px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Done</button></div>}/>);
  if(view==="updateCard")return(<W ch={<><H t="Update Payment Method" s="Enter your new card details" back/><div style={{padding:"20px 22px",display:"flex",flexDirection:"column",gap:12}}>
    {[{label:"Cardholder Name",k:"name",ph:"Kavya Kundeti",t:"text"},{label:"Card Number",k:"number",ph:"1234 5678 9012 3456",t:"text"},{label:"Expiry",k:"expiry",ph:"MM/YY",t:"text"},{label:"CVV",k:"cvv",ph:"•••",t:"password"}].map((f,i)=><div key={i} style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:0.7}}>{f.label}</label><input type={f.t} value={cardForm[f.k]} onChange={e=>setCardForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{background:"#1E293B",border:"1.5px solid #2E3F55",borderRadius:8,color:"#F1F5F9",padding:"10px 12px",fontSize:13,outline:"none"}} onFocus={e=>e.target.style.borderColor="#4F46E5"} onBlur={e=>e.target.style.borderColor="#2E3F55"}/></div>)}
    <div style={{display:"flex",gap:10,marginTop:4}}><button onClick={()=>setView("success-card")} style={{flex:1,background:"linear-gradient(135deg,#4F46E5,#06B6D4)",border:"none",borderRadius:9,color:"#fff",padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save Card ✓</button><button onClick={()=>setView("main")} style={{background:"none",border:"1px solid #1E293B",borderRadius:9,color:"#94A3B8",padding:"11px 14px",fontSize:13,cursor:"pointer"}}>Cancel</button></div>
  </div></>}/>);
  if(view==="success-card")return(<W w={420} ch={<div style={{padding:"44px 28px",textAlign:"center"}}><div style={{fontSize:52,marginBottom:14}}>✅</div><div style={{fontSize:19,fontWeight:800,marginBottom:8}}>Card Updated!</div><div style={{fontSize:13,color:"#94A3B8",lineHeight:1.7,maxWidth:300,margin:"0 auto 22px"}}>Your new card is saved for billing on July 10, 2026.</div><button onClick={onClose} style={{background:"linear-gradient(135deg,#4F46E5,#06B6D4)",border:"none",borderRadius:9,color:"#fff",padding:"10px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Done</button></div>}/>);
  if(view==="cancel")return(<W ch={<><H t="Cancel Subscription" back/><div style={{padding:"20px 22px"}}>
    {cancelStep===1&&<><div style={{background:"#F43F5E15",border:"1px solid #F43F5E33",borderRadius:10,padding:14,marginBottom:14}}><div style={{fontWeight:700,fontSize:13,color:"#F8FAFC",marginBottom:8}}>You\'ll lose access to:</div>{["AI recommendations","Automated scans","Report history","500 datasets/month"].map((item,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:5,alignItems:"center"}}><span style={{color:"#F43F5E",fontSize:11}}>✕</span><span style={{fontSize:12,color:"#94A3B8"}}>{item}</span></div>)}</div><div style={{display:"flex",gap:10}}><button onClick={()=>setCancelStep(2)} style={{flex:1,background:"#F43F5E22",border:"1px solid #F43F5E44",borderRadius:9,color:"#F43F5E",padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Continue</button><button onClick={()=>setView("main")} style={{flex:1,background:"linear-gradient(135deg,#4F46E5,#06B6D4)",border:"none",borderRadius:9,color:"#fff",padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Keep Plan</button></div></>}
    {cancelStep===2&&<><div style={{fontSize:13,color:"#94A3B8",marginBottom:12}}>Why are you leaving?</div><div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>{["Too expensive","Not using enough","Missing features","Switching tools","Other"].map((r,i)=><div key={i} onClick={()=>setCancelReason(r)} style={{display:"flex",gap:10,padding:"9px 12px",borderRadius:8,cursor:"pointer",background:cancelReason===r?"#4F46E522":"#1A2235",border:`1px solid ${cancelReason===r?"#4F46E555":"#2E3F55"}`}}><div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${cancelReason===r?"#4F46E5":"#475569"}`,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1,flexShrink:0}}>{cancelReason===r&&<div style={{width:6,height:6,borderRadius:"50%",background:"#4F46E5"}}/>}</div><span style={{fontSize:13,color:cancelReason===r?"#F8FAFC":"#94A3B8"}}>{r}</span></div>)}</div><div style={{display:"flex",gap:10}}><button onClick={()=>setView("success-cancel")} disabled={!cancelReason} style={{flex:1,background:cancelReason?"#F43F5E22":"#1A2235",border:`1px solid ${cancelReason?"#F43F5E44":"#2E3F55"}`,borderRadius:9,color:cancelReason?"#F43F5E":"#475569",padding:"10px",fontSize:13,fontWeight:700,cursor:cancelReason?"pointer":"default"}}>Confirm Cancel</button><button onClick={()=>setView("main")} style={{flex:1,background:"linear-gradient(135deg,#4F46E5,#06B6D4)",border:"none",borderRadius:9,color:"#fff",padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Keep Plan</button></div></>}
  </div></>}/>);
  if(view==="success-cancel")return(<W w={420} ch={<div style={{padding:"44px 28px",textAlign:"center"}}><div style={{fontSize:52,marginBottom:14}}>👋</div><div style={{fontSize:19,fontWeight:800,marginBottom:8}}>Plan Cancelled</div><div style={{fontSize:13,color:"#94A3B8",lineHeight:1.7,maxWidth:300,margin:"0 auto 22px"}}>Access until July 10, 2026. You\'re welcome back anytime!</div><button onClick={onClose} style={{background:"#1E293B",border:"1px solid #2E3F55",borderRadius:9,color:"#94A3B8",padding:"10px 28px",fontSize:14,cursor:"pointer"}}>Close</button></div>}/>);
  return(<W ch={<>
    <H t="Manage Plan & Billing" s="Your subscription and payment details"/>
    <div style={{padding:"18px 22px",display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:"#1A2235",border:"1px solid #10B98133",borderRadius:10,padding:"13px 17px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:11,alignItems:"center"}}><div style={{width:38,height:38,borderRadius:9,background:"linear-gradient(135deg,#4F46E5,#06B6D4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>⭐</div><div><div style={{fontWeight:700,fontSize:14,color:"#F8FAFC"}}>Pro Plan</div><div style={{fontSize:11,color:"#10B981",marginTop:1,fontWeight:600}}>● Active</div></div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:19,fontWeight:900,color:"#F8FAFC"}}>$49<span style={{fontSize:12,color:"#94A3B8"}}>/mo</span></div><div style={{fontSize:11,color:"#475569"}}>Next: Jul 10, 2026</div></div>
      </div>
      <div style={{background:"#1A2235",border:"1px solid #1E293B",borderRadius:9,padding:"11px 15px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:22,background:"#1E3A5F",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#60A5FA"}}>VISA</div><div><div style={{fontSize:13,fontWeight:600,color:"#F8FAFC"}}>Visa ****4242</div><div style={{fontSize:11,color:"#475569"}}>Exp 08/2027</div></div></div>
        <button onClick={()=>setView("updateCard")} style={{background:"none",border:"1px solid #1E293B",borderRadius:7,color:"#94A3B8",padding:"4px 11px",fontSize:12,cursor:"pointer"}}>Update Card</button>
      </div>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:0.6,marginBottom:8}}>Recent Invoices</div>
        {[{date:"Jun 10, 2026",amt:"$49.00"},{date:"May 10, 2026",amt:"$49.00"},{date:"Apr 10, 2026",amt:"$49.00"}].map((inv,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<2?"1px solid #1E293B44":"none"}}>
          <span style={{fontSize:13,color:"#94A3B8"}}>{inv.date}</span>
          <div style={{display:"flex",alignItems:"center",gap:9}}><span style={{fontSize:13,fontWeight:600,color:"#F8FAFC"}}>{inv.amt}</span><span style={{fontSize:11,fontWeight:700,color:"#10B981",background:"#10B98118",borderRadius:99,padding:"2px 7px"}}>Paid</span><button onClick={()=>setDownloaded(p=>[...p,inv.date])} style={{background:downloaded.includes(inv.date)?"#06B6D422":"none",border:"none",color:downloaded.includes(inv.date)?"#06B6D4":"#4F46E5",fontSize:12,cursor:"pointer",fontWeight:600,borderRadius:5,padding:"2px 6px"}}>{downloaded.includes(inv.date)?"✓ Downloaded":"⬇ PDF"}</button></div>
        </div>)}
      </div>
      <div style={{display:"flex",gap:9}}><button onClick={()=>setView("upgrade")} style={{flex:1,background:"linear-gradient(135deg,#4F46E5,#06B6D4)",border:"none",borderRadius:9,color:"#fff",padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Upgrade to Annual — Save 20%</button><button onClick={()=>setView("cancel")} style={{background:"none",border:"1px solid #F43F5E44",borderRadius:9,color:"#F43F5E",padding:"10px 13px",fontSize:12,cursor:"pointer",fontWeight:600}}>Cancel</button></div>
      <button onClick={onEnterprise} style={{background:"none",border:"1px solid #1E293B",borderRadius:9,color:"#94A3B8",padding:"8px",fontSize:12,cursor:"pointer",textAlign:"center"}}>View Enterprise Plans →</button>
    </div>
  </>}/>);
}

function EnterprisePlansModal({onClose}){
  const [sub,setSub]=useState(null);
  const [cForm,setCForm]=useState({name:"Kavya Kundeti",email:"kavya.kundeti@company.com",company:"Acme Corporation",size:"",message:""});
  const [dForm,setDForm]=useState({name:"Kavya Kundeti",email:"kavya.kundeti@company.com",company:"",date:"",time:""});
  const W=({ch,w=600})=>(<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}><div onClick={e=>e.stopPropagation()} style={{width:w,background:"#161D2F",border:"1px solid #1E293B",borderRadius:18,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.6)",maxHeight:"88vh",overflowY:"auto"}}>{ch}</div></div>);
  const H=({t,s,back})=>(<div style={{background:"linear-gradient(135deg,#8B5CF633,#4F46E522)",padding:"18px 22px",borderBottom:"1px solid #1E293B",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>{back&&<button onClick={()=>setSub(null)} style={{background:"#1E293B",border:"1px solid #1E293B",borderRadius:7,color:"#94A3B8",width:28,height:28,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>}<div><div style={{fontWeight:800,fontSize:15,color:"#F8FAFC"}}>{t}</div>{s&&<div style={{color:"#94A3B8",fontSize:12,marginTop:2}}>{s}</div>}</div></div>
    <button onClick={onClose} style={{background:"#1E293B",border:"1px solid #1E293B",borderRadius:7,color:"#94A3B8",width:28,height:28,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
  </div>);
  const FI=({label,value,onChange,type="text",ph})=>(<div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:0.7}}>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} style={{background:"#1E293B",border:"1.5px solid #2E3F55",borderRadius:8,color:"#F1F5F9",padding:"10px 12px",fontSize:13,outline:"none"}} onFocus={e=>e.target.style.borderColor="#8B5CF6"} onBlur={e=>e.target.style.borderColor="#2E3F55"}/></div>);
  if(sub==="team")return(<W w={440} ch={<><H t="Upgrade to Team" s="$149/month" back/><div style={{padding:"20px 22px",display:"flex",flexDirection:"column",gap:13}}>
    <div style={{background:"#1A2235",border:"1px solid #4F46E544",borderRadius:10,padding:13}}><div style={{fontSize:13,fontWeight:700,color:"#F8FAFC",marginBottom:8}}>Team plan includes:</div>{["Unlimited datasets","200 GB storage","Unlimited AI credits","Priority support","Up to 10 users","Role-based access"].map((f,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:6}}><span style={{color:"#4F46E5",fontSize:11}}>✓</span><span style={{fontSize:12,color:"#94A3B8"}}>{f}</span></div>)}</div>
    <div style={{background:"#F59E0B15",border:"1px solid #F59E0B33",borderRadius:9,padding:"10px 13px",fontSize:12,color:"#F8FAFC"}}>You\'ll be charged <strong style={{color:"#F59E0B"}}>$149.00</strong> today to Visa ****4242.</div>
    <div style={{display:"flex",gap:10}}><button onClick={()=>setSub("success-team")} style={{flex:1,background:"linear-gradient(135deg,#4F46E5,#06B6D4)",border:"none",borderRadius:9,color:"#fff",padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Confirm ✓</button><button onClick={()=>setSub(null)} style={{background:"none",border:"1px solid #1E293B",borderRadius:9,color:"#94A3B8",padding:"10px 14px",fontSize:13,cursor:"pointer"}}>Back</button></div>
  </div></>}/>);
  if(sub==="success-team")return(<W w={400} ch={<div style={{padding:"44px 28px",textAlign:"center"}}><div style={{fontSize:52,marginBottom:14}}>🚀</div><div style={{fontSize:19,fontWeight:800,marginBottom:8}}>Welcome to Team!</div><div style={{fontSize:13,color:"#94A3B8",lineHeight:1.7,maxWidth:280,margin:"0 auto 22px"}}>Upgraded! $149 charged to Visa ****4242. Invite up to 10 team members.</div><button onClick={onClose} style={{background:"linear-gradient(135deg,#4F46E5,#06B6D4)",border:"none",borderRadius:9,color:"#fff",padding:"10px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Get Started →</button></div>}/>);
  if(sub==="contact")return(<W w={440} ch={<><H t="Contact Sales" s="Tell us about your needs" back/><div style={{padding:"18px 22px",display:"flex",flexDirection:"column",gap:11}}>
    <FI label="Full Name" value={cForm.name} onChange={v=>setCForm(p=>({...p,name:v}))} ph="Your name"/>
    <FI label="Work Email" value={cForm.email} onChange={v=>setCForm(p=>({...p,email:v}))} type="email" ph="you@company.com"/>
    <FI label="Company" value={cForm.company} onChange={v=>setCForm(p=>({...p,company:v}))} ph="Company name"/>
    <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:0.7}}>Team Size</label><select value={cForm.size} onChange={e=>setCForm(p=>({...p,size:e.target.value}))} style={{background:"#1E293B",border:"1.5px solid #2E3F55",borderRadius:8,color:cForm.size?"#F1F5F9":"#475569",padding:"10px 12px",fontSize:13,outline:"none",cursor:"pointer"}}><option value="">Select…</option>{["1–10","11–50","51–200","201–1000","1000+"].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
    <button onClick={()=>setSub("success-contact")} style={{background:"linear-gradient(135deg,#8B5CF6,#4F46E5)",border:"none",borderRadius:9,color:"#fff",padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:4}}>Send Message →</button>
  </div></>}/>);
  if(sub==="success-contact")return(<W w={400} ch={<div style={{padding:"44px 28px",textAlign:"center"}}><div style={{fontSize:52,marginBottom:14}}>📬</div><div style={{fontSize:19,fontWeight:800,marginBottom:8}}>Message Sent!</div><div style={{fontSize:13,color:"#94A3B8",lineHeight:1.7,maxWidth:280,margin:"0 auto 22px"}}>Our team will reach out to <strong style={{color:"#06B6D4"}}>{cForm.email}</strong> within 24 hours.</div><button onClick={onClose} style={{background:"linear-gradient(135deg,#8B5CF6,#4F46E5)",border:"none",borderRadius:9,color:"#fff",padding:"10px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Done</button></div>}/>);
  if(sub==="demo")return(<W w={440} ch={<><H t="Book a Demo" s="30-minute walkthrough" back/><div style={{padding:"18px 22px",display:"flex",flexDirection:"column",gap:11}}>
    <FI label="Full Name" value={dForm.name} onChange={v=>setDForm(p=>({...p,name:v}))} ph="Your name"/>
    <FI label="Work Email" value={dForm.email} onChange={v=>setDForm(p=>({...p,email:v}))} type="email" ph="you@company.com"/>
    <FI label="Company" value={dForm.company} onChange={v=>setDForm(p=>({...p,company:v}))} ph="Company name"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:0.7}}>Date</label><input type="date" value={dForm.date} onChange={e=>setDForm(p=>({...p,date:e.target.value}))} style={{background:"#1E293B",border:"1.5px solid #2E3F55",borderRadius:8,color:"#F1F5F9",padding:"10px 12px",fontSize:13,outline:"none",colorScheme:"dark"}}/></div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}><label style={{fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:0.7}}>Time</label><select value={dForm.time} onChange={e=>setDForm(p=>({...p,time:e.target.value}))} style={{background:"#1E293B",border:"1.5px solid #2E3F55",borderRadius:8,color:dForm.time?"#F1F5F9":"#475569",padding:"10px 12px",fontSize:13,outline:"none",cursor:"pointer"}}><option value="">Select…</option>{["9:00 AM","10:00 AM","11:00 AM","1:00 PM","2:00 PM","3:00 PM","4:00 PM"].map(t=><option key={t} value={t}>{t} EST</option>)}</select></div>
    </div>
    <button onClick={()=>setSub("success-demo")} style={{background:"linear-gradient(135deg,#8B5CF6,#4F46E5)",border:"none",borderRadius:9,color:"#fff",padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:4}}>Confirm Booking →</button>
  </div></>}/>);
  if(sub==="success-demo")return(<W w={400} ch={<div style={{padding:"44px 28px",textAlign:"center"}}><div style={{fontSize:52,marginBottom:14}}>📅</div><div style={{fontSize:19,fontWeight:800,marginBottom:8}}>Demo Booked!</div><div style={{fontSize:13,color:"#94A3B8",lineHeight:1.7,maxWidth:280,margin:"0 auto 22px"}}>Confirmed{dForm.date?` for ${dForm.date}${dForm.time?" at "+dForm.time:""}`:""}.  Invite sent to <strong style={{color:"#06B6D4"}}>{dForm.email}</strong>.</div><button onClick={onClose} style={{background:"linear-gradient(135deg,#8B5CF6,#4F46E5)",border:"none",borderRadius:9,color:"#fff",padding:"10px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Done</button></div>}/>);
  return(<W ch={<>
    <H t="Enterprise Plans" s="Scale across your organization"/>
    <div style={{padding:"18px 22px",display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,paddingTop:12}}>
        {[{name:"Pro",price:"$49",period:"/mo",color:"#06B6D4",current:true,features:["500 datasets/mo","50 GB storage","1,000 AI credits","Email support","1 user"]},{name:"Team",price:"$149",period:"/mo",color:"#4F46E5",popular:true,features:["Unlimited datasets","200 GB storage","Unlimited AI","Priority support","10 users","Role-based access"]},{name:"Enterprise",price:"Custom",period:"",color:"#8B5CF6",features:["Unlimited everything","Custom storage","Dedicated AI","24/7 support","Unlimited users","SSO & SAML","SLA"]}].map((plan,i)=>(
          <div key={i} style={{background:plan.current?"#06B6D410":"#1A2235",border:`2px solid ${plan.current?"#06B6D4":plan.popular?"#4F46E5":"#2E3F55"}`,borderRadius:12,padding:"16px 14px",position:"relative",display:"flex",flexDirection:"column",boxShadow:plan.current?"0 0 0 3px #06B6D422":"none"}}>
            {plan.current&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"#06B6D4",borderRadius:99,padding:"3px 11px",fontSize:10,fontWeight:800,color:"#0A0F1E",whiteSpace:"nowrap"}}>✦ YOUR PLAN</div>}
            {plan.popular&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#4F46E5,#06B6D4)",borderRadius:99,padding:"3px 11px",fontSize:10,fontWeight:800,color:"#fff",whiteSpace:"nowrap"}}>⭐ POPULAR</div>}
            <div style={{fontWeight:800,fontSize:13,color:plan.color,marginBottom:4,marginTop:4}}>{plan.name}</div>
            <div style={{marginBottom:12}}><span style={{fontSize:22,fontWeight:900,color:"#F8FAFC"}}>{plan.price}</span><span style={{fontSize:11,color:"#64748B"}}>{plan.period}</span></div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14,flex:1}}>{plan.features.map((f,j)=><div key={j} style={{display:"flex",gap:6,alignItems:"flex-start"}}><span style={{color:plan.color,fontSize:10,marginTop:2,flexShrink:0}}>✓</span><span style={{fontSize:11,color:"#CBD5E1",lineHeight:1.3}}>{f}</span></div>)}</div>
            {plan.current?<div style={{background:"#06B6D418",border:"1.5px solid #06B6D444",borderRadius:7,padding:"8px",fontSize:12,fontWeight:700,color:"#06B6D4",textAlign:"center"}}>✓ Active</div>:<button onClick={()=>setSub(plan.name==="Enterprise"?"contact":"team")} style={{background:plan.popular?"linear-gradient(135deg,#4F46E5,#06B6D4)":"#252F42",border:plan.popular?"none":"1px solid #2E3F55",borderRadius:7,color:"#fff",padding:"8px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{plan.name==="Enterprise"?"Contact Sales":"Upgrade →"}</button>}
          </div>
        ))}
      </div>
      <div style={{background:"#1A2235",border:"1px solid #1E293B",borderRadius:10,padding:"12px 15px",display:"flex",alignItems:"center",gap:11}}>
        <div style={{width:36,height:36,borderRadius:8,background:"#8B5CF622",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>🏢</div>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#F8FAFC"}}>Need a custom solution?</div><div style={{fontSize:11,color:"#94A3B8",marginTop:1}}>Volume pricing, custom integrations, dedicated support.</div></div>
        <div style={{display:"flex",gap:6,flexShrink:0}}><button onClick={()=>setSub("contact")} style={{background:"none",border:"1px solid #8B5CF644",borderRadius:7,color:"#8B5CF6",padding:"6px 11px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Contact</button><button onClick={()=>setSub("demo")} style={{background:"linear-gradient(135deg,#8B5CF6,#4F46E5)",border:"none",borderRadius:7,color:"#fff",padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Book Demo</button></div>
      </div>
      <div style={{textAlign:"center",fontSize:11,color:"#475569"}}>14-day free trial · No credit card · Cancel anytime</div>
    </div>
  </>}/>);
}

export default function App(){
  const [authScreen,setAuthScreen]=useState("signin");
  const [user,setUser]=useState(null);
  const [page,setPage]=useState("dashboard");
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [searchVal,setSearchVal]=useState("");
  const [searchOpen,setSearchOpen]=useState(false);
  const searchRef=useRef();
  const [notifs,setNotifs]=useState([
    {id:1,icon:"⚠️",msg:"product_catalog.csv quality dropped to 61%",time:"5 min ago",read:false,color:"#F59E0B"},
    {id:2,icon:"✅",msg:"Scheduled scan completed for transactions_q2.xlsx",time:"1 hr ago",read:false,color:"#10B981"},
    {id:3,icon:"✦",msg:"New AI recommendations are available for your data",time:"2 hrs ago",read:false,color:"#4F46E5"},
    {id:4,icon:"🔁",msg:"124 duplicate records found in customer_data.csv",time:"Yesterday",read:true,color:"#F43F5E"},
    {id:5,icon:"📊",msg:"Weekly quality report is ready to download",time:"2 days ago",read:true,color:"#06B6D4"},
  ]);
  const [notifOpen,setNotifOpen]=useState(false);
  const unreadCount=notifs.filter(n=>!n.read).length;
  const markAllRead=()=>setNotifs(n=>n.map(x=>({...x,read:true})));
  const dismissNotif=(id)=>setNotifs(n=>n.filter(x=>x.id!==id));
  const markRead=(id)=>setNotifs(n=>n.map(x=>x.id===id?{...x,read:true}:x));
  const [proOpen,setProOpen]=useState(false);
  const [modal,setModal]=useState(null);
  const [lastFile,setLastFile]=useState(null);
  const gotoAnalysis=(f)=>{if(f)setLastFile(f);setPage("analysis");};
  const searchResults=searchVal.trim().length>0?RECENT_DATASETS.filter(d=>d.name.toLowerCase().startsWith(searchVal.toLowerCase())):[];

  if(!user){
    if(authScreen==="signup") return <SignUpPage onSignUp={u=>setUser(u)} goSignIn={()=>setAuthScreen("signin")}/>;
    if(authScreen==="forgot") return <ForgotPage goSignIn={()=>setAuthScreen("signin")}/>;
    return <SignInPage onSignIn={u=>setUser(u)} goSignUp={()=>setAuthScreen("signup")} goForgot={()=>setAuthScreen("forgot")}/>;
  }

  const initials=user.name.split(" ").map(n=>n[0]).join("");

  return(
    <div style={{display:"flex",height:"100vh",background:C.bg,fontFamily:"Inter,system-ui,sans-serif",color:C.textPri,overflow:"hidden"}}
      onClick={()=>{setSearchOpen(false);setNotifOpen(false);setProOpen(false);}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:99px}input,button,textarea,select{font-family:inherit}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}.navbtn:hover{background:${C.primary}18!important;color:${C.textPri}!important}`}</style>
      <aside style={{width:sidebarOpen?240:64,flexShrink:0,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",transition:"width 0.25s ease",overflow:"hidden"}}>
        <div style={{padding:"20px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${C.border}`}}>
          <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:`linear-gradient(135deg,${C.primary},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff"}}>✦</div>
          {sidebarOpen&&<div><div style={{fontWeight:800,fontSize:13,letterSpacing:-0.3}}>DataQuality</div><div style={{color:C.textSec,fontSize:10,letterSpacing:1,textTransform:"uppercase"}}>AI Platform</div></div>}
        </div>
        <nav style={{flex:1,padding:"12px 8px",display:"flex",flexDirection:"column",gap:2}}>
          {NAV_ITEMS.map(item=>(
            <button key={item.id} className="navbtn" onClick={()=>setPage(item.id)} style={{display:"flex",alignItems:"center",gap:12,padding:sidebarOpen?"10px 12px":"10px 0",justifyContent:sidebarOpen?"flex-start":"center",background:page===item.id?C.primary+"25":"transparent",color:page===item.id?C.primary:C.textSec,border:`1px solid ${page===item.id?C.primary+"44":"transparent"}`,borderRadius:8,cursor:"pointer",fontWeight:page===item.id?600:400,fontSize:13,whiteSpace:"nowrap",transition:"all 0.15s",width:"100%"}}>
              <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
              {sidebarOpen&&item.label}
            </button>
          ))}
        </nav>
        <div style={{padding:"12px 8px",borderTop:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px"}}>
            <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${C.violet},${C.primary})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13}}>{initials}</div>
            {sidebarOpen&&<div style={{overflow:"hidden",flex:1}}><div style={{fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>{user.name}</div><div style={{color:C.textSec,fontSize:11,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.email}</div></div>}
            {sidebarOpen&&<button onClick={()=>setUser(null)} title="Sign out" style={{background:"none",border:"none",color:C.textMut,cursor:"pointer",fontSize:16,padding:4,flexShrink:0}}>⏻</button>}
          </div>
        </div>
      </aside>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <header style={{height:60,background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 24px",gap:16,flexShrink:0,zIndex:50,position:"relative"}}>
          <button onClick={e=>{e.stopPropagation();setSidebarOpen(o=>!o);}} style={{background:"none",border:"none",color:C.textSec,cursor:"pointer",fontSize:18,padding:4}}>☰</button>
          <div style={{flex:1}}><span style={{color:C.textSec,fontSize:13}}>{NAV_ITEMS.find(n=>n.id===page)?.label||"Dashboard"}</span></div>
          {/* Search */}
          <div style={{position:"relative"}} onClick={e=>e.stopPropagation()} ref={searchRef}>
            <div style={{display:"flex",alignItems:"center",gap:8,background:C.card,border:`1px solid ${searchOpen?C.primary:C.border}`,borderRadius:8,padding:"7px 14px",width:240,transition:"border-color 0.2s"}}>
              <span style={{color:C.textMut,fontSize:14,flexShrink:0}}>🔍</span>
              <input value={searchVal} onChange={e=>{setSearchVal(e.target.value);setSearchOpen(true);}} onFocus={()=>setSearchOpen(true)} placeholder="Search datasets…" style={{background:"none",border:"none",outline:"none",color:C.textPri,fontSize:13,width:"100%"}}/>
              {searchVal&&<button onClick={()=>{setSearchVal("");setSearchOpen(false);}} style={{background:"none",border:"none",color:C.textMut,cursor:"pointer",fontSize:14,padding:0,flexShrink:0}}>✕</button>}
            </div>
            {searchOpen&&(
              <div style={{position:"absolute",top:44,left:0,width:320,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 20px 40px rgba(0,0,0,0.5)",zIndex:200,overflow:"hidden",animation:"fadeIn 0.15s ease"}}>
                {searchVal.trim()===""?(
                  <div style={{padding:16}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.textMut,textTransform:"uppercase",letterSpacing:0.7,marginBottom:10}}>Recent Files</div>
                    {RECENT_DATASETS.slice(0,4).map((d,i)=>(
                      <div key={i} onClick={()=>{setPage("analysis");setSearchOpen(false);setSearchVal("");}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 8px",borderRadius:8,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#1E293B"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span style={{fontSize:16,flexShrink:0}}>{d.name.endsWith(".xlsx")?"📗":"📄"}</span>
                        <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:500,color:C.textPri,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</div><div style={{fontSize:11,color:C.textMut,marginTop:1}}>{d.time} · Score: {d.score}/100</div></div>
                        <span style={{fontSize:11,fontWeight:700,color:scoreColor(d.score),flexShrink:0}}>{scoreLabel(d.score)}</span>
                      </div>
                    ))}
                  </div>
                ):searchResults.length>0?(
                  <div style={{padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.textMut,textTransform:"uppercase",letterSpacing:0.7,marginBottom:10,padding:"0 4px"}}>Matching Datasets</div>
                    {searchResults.map((d,i)=>(
                      <div key={i} onClick={()=>{setPage("analysis");setSearchOpen(false);setSearchVal("");}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 8px",borderRadius:8,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#1E293B"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span style={{fontSize:18,flexShrink:0}}>{d.name.endsWith(".xlsx")?"📗":"📄"}</span>
                        <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:C.textPri,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{color:C.primary}}>{d.name.slice(0,searchVal.length)}</span>{d.name.slice(searchVal.length)}</div><div style={{fontSize:11,color:C.textMut,marginTop:2}}>{d.records.toLocaleString()} records · {d.size} · {d.time}</div></div>
                        <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:13,fontWeight:800,color:scoreColor(d.score)}}>{d.score}</div><span style={{fontSize:10,fontWeight:700,color:scoreColor(d.score)}}>{scoreLabel(d.score)}</span></div>
                      </div>
                    ))}
                  </div>
                ):(
                  <div style={{padding:"24px 16px",textAlign:"center"}}>
                    <div style={{fontSize:28,marginBottom:8}}>🔍</div>
                    <div style={{fontSize:13,color:C.textSec}}>No datasets match <strong style={{color:C.textPri}}>"{searchVal}"</strong></div>
                    <div style={{fontSize:12,color:C.textMut,marginTop:4}}>Try a different filename</div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Notifications */}
          <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>{setNotifOpen(o=>!o);setProOpen(false);}} style={{background:C.card,border:`1px solid ${notifOpen?C.primary:C.border}`,borderRadius:8,color:C.textSec,cursor:"pointer",padding:"6px 10px",fontSize:15,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",transition:"border-color 0.2s"}}>
              🔔
              {unreadCount>0&&<span style={{position:"absolute",top:-6,right:-6,width:18,height:18,borderRadius:"50%",background:C.rose,border:`2px solid ${C.surface}`,fontSize:10,fontWeight:800,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{unreadCount}</span>}
            </button>
            {notifOpen&&(
              <div style={{position:"absolute",top:48,right:0,width:340,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:"0 20px 48px rgba(0,0,0,0.5)",zIndex:200,overflow:"hidden",animation:"fadeIn 0.15s ease"}}>
                <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><span style={{fontWeight:700,fontSize:14,color:C.textPri}}>Notifications</span>{unreadCount>0&&<span style={{marginLeft:8,fontSize:11,fontWeight:700,background:C.rose+"22",color:C.rose,border:`1px solid ${C.rose}44`,borderRadius:99,padding:"1px 8px"}}>{unreadCount} new</span>}</div>
                  {unreadCount>0&&<button onClick={markAllRead} style={{background:"none",border:"none",color:C.primary,fontSize:12,cursor:"pointer",fontWeight:600}}>Mark all read</button>}
                </div>
                <div style={{maxHeight:320,overflowY:"auto"}}>
                  {notifs.map((n,i)=>(
                    <div key={n.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 16px",borderBottom:i<notifs.length-1?`1px solid ${C.border}44`:"none",background:n.read?"transparent":C.primary+"08",cursor:"pointer"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#1E293B"} onMouseLeave={e=>e.currentTarget.style.background=n.read?"transparent":C.primary+"08"} onClick={()=>markRead(n.id)}>
                      <div style={{width:36,height:36,borderRadius:10,background:n.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{n.icon}</div>
                      <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,color:n.read?C.textSec:C.textPri,fontWeight:n.read?400:600,lineHeight:1.5}}>{n.msg}</div><div style={{fontSize:11,color:C.textMut,marginTop:3}}>{n.time}</div></div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                        {!n.read&&<div style={{width:7,height:7,borderRadius:"50%",background:C.primary}}/>}
                        <button onClick={e=>{e.stopPropagation();dismissNotif(n.id);}} style={{background:"none",border:"none",color:C.textMut,cursor:"pointer",fontSize:13,padding:0}} onMouseEnter={e=>e.currentTarget.style.color=C.rose} onMouseLeave={e=>e.currentTarget.style.color=C.textMut}>✕</button>
                      </div>
                    </div>
                  ))}
                  {notifs.length===0&&<div style={{padding:"32px 16px",textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>🎉</div><div style={{fontSize:13,color:C.textSec,fontWeight:600}}>All caught up!</div><div style={{fontSize:12,color:C.textMut,marginTop:4}}>No new notifications</div></div>}
                </div>
                {notifs.length>0&&<div style={{padding:"10px 16px",borderTop:`1px solid ${C.border}`,textAlign:"center"}}><button onClick={()=>setNotifs([])} style={{background:"none",border:"none",color:C.textMut,fontSize:12,cursor:"pointer"}}>Clear all</button></div>}
              </div>
            )}
          </div>
          {/* PRO */}
          <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>{setProOpen(o=>!o);setNotifOpen(false);}} style={{background:proOpen?C.emerald+"33":C.emerald+"22",border:`1px solid ${C.emerald}${proOpen?"88":"44"}`,borderRadius:8,padding:"5px 14px",fontSize:12,color:C.emerald,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all 0.2s"}}>⭐ PRO</button>
            {proOpen&&(
              <div style={{position:"absolute",top:48,right:0,width:300,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:"0 20px 48px rgba(0,0,0,0.5)",zIndex:200,overflow:"hidden",animation:"fadeIn 0.15s ease"}}>
                <div style={{background:`linear-gradient(135deg,${C.primary}33,${C.cyan}18)`,padding:"20px 20px 16px",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:38,height:38,borderRadius:10,background:`linear-gradient(135deg,${C.primary},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⭐</div>
                    <div><div style={{fontWeight:800,fontSize:15,color:C.textPri}}>Pro Plan</div><div style={{fontSize:11,color:C.emerald,fontWeight:600}}>● Active — renews Jul 10, 2026</div></div>
                  </div>
                </div>
                <div style={{padding:"16px 20px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.textMut,textTransform:"uppercase",letterSpacing:0.7,marginBottom:12}}>Usage This Month</div>
                  {[{label:"Datasets Analyzed",used:47,total:500,color:C.cyan},{label:"Storage Used",used:2.4,total:50,unit:"GB",color:C.violet},{label:"AI Recommendations",used:124,total:1000,color:C.primary}].map((u,i)=>(
                    <div key={i} style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:C.textSec}}>{u.label}</span><span style={{fontSize:12,fontWeight:700,color:C.textPri}}>{u.used}{u.unit||""} <span style={{color:C.textMut,fontWeight:400}}>/ {u.total}{u.unit||""}</span></span></div>
                      <div style={{height:5,borderRadius:99,background:C.border,overflow:"hidden"}}><div style={{width:`${(u.used/u.total)*100}%`,height:"100%",borderRadius:99,background:u.color}}/></div>
                    </div>
                  ))}
                  <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:14}}>
                    <div style={{fontSize:11,color:C.textMut,marginBottom:2}}>Next billing date</div>
                    <div style={{fontSize:13,fontWeight:700,color:C.textPri}}>July 10, 2026 · <span style={{color:C.cyan}}>$49/month</span></div>
                  </div>
                  <button onClick={()=>{setModal("manage");setProOpen(false);}} style={{width:"100%",background:`linear-gradient(135deg,${C.primary},${C.cyan})`,border:"none",borderRadius:9,color:"#fff",padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Manage Plan & Billing →</button>
                  <button onClick={()=>{setModal("enterprise");setProOpen(false);}} style={{width:"100%",background:"none",border:`1px solid ${C.border}`,borderRadius:9,color:C.textSec,padding:"8px",fontSize:12,cursor:"pointer",marginTop:8}}>View Enterprise Plans</button>
                </div>
              </div>
            )}
          </div>
        </header>
        <main style={{flex:1,overflowY:"auto",padding:"28px"}}>
          {page==="dashboard"&&<DashboardPage setPage={setPage}/>}
          {page==="upload"&&<UploadPage onAnalyze={gotoAnalysis} setLastFile={setLastFile}/>}
          {page==="analysis"&&<AnalysisPage fileName={lastFile?lastFile.name:null} fileSize={lastFile?(lastFile.size/1024/1024).toFixed(1)+" MB":null} fileRecords={lastFile?Math.floor(lastFile.size/400).toLocaleString():null}/>}
          {page==="recommendations"&&<RecommendationsPage/>}
          {page==="history"&&<HistoryPage/>}
          {page==="governance"&&<GovernancePage/>}
          {page==="settings"&&<SettingsPage/>}
        </main>
      </div>
      {modal==="manage"&&<ManagePlanModal onClose={()=>setModal(null)} onEnterprise={()=>setModal("enterprise")}/>}
      {modal==="enterprise"&&<EnterprisePlansModal onClose={()=>setModal(null)}/>}
    </div>
  );
}
