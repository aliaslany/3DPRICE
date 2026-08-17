import {useMemo,useState} from "react";

type Settings={material:string;layerHeight:number;infill:number;walls:number;supports:boolean;supportAngle:number;printer:string;currency:string;filamentPerKg:number;machinePerHour:number;labor:number;markup:number;delivery:number};
type Slice={volume_cm3:number;weight_g:number;print_time_sec:number;material_cost:number;machine_cost:number;support_weight_g:number;layers:number;total:number;warnings:string[]};
const API=import.meta.env.VITE_API_URL||"http://localhost:8000";
const initial:Settings={material:"PLA",layerHeight:.2,infill:20,walls:3,supports:true,supportAngle:55,printer:"generic_fdm_220",currency:"Toman",filamentPerKg:900000,machinePerHour:65000,labor:150000,markup:20,delivery:0};
const money=(n:number)=>new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(n)+" تومان";

export default function App(){
 const [file,setFile]=useState<File|null>(null),[s,setS]=useState(initial),[busy,setBusy]=useState(false),[slice,setSlice]=useState<Slice|null>(null),[quote,setQuote]=useState(false),[error,setError]=useState("");
 const set=(k:keyof Settings,v:any)=>setS(x=>({...x,[k]:v}));
 const choose=(f?:File)=>{if(!f)return; if(!/\.(stl|3mf|obj)$/i.test(f.name)){setError("Only STL, 3MF and OBJ are supported.");return}setError("");setFile(f);setSlice(null)};
 const run=async()=>{if(!file)return;setBusy(true);setError("");try{const fd=new FormData();fd.append("file",file);Object.entries(s).forEach(([k,v])=>fd.append(k,String(v)));const r=await fetch(API+"/api/slice", {method:"POST",body:fd});if(!r.ok)throw new Error(await r.text());setSlice(await r.json())}catch(e){setError(e instanceof Error?e.message:"Slicing failed. Check the backend URL.")}finally{setBusy(false)}};
 const quoteReady=useMemo(()=>!!slice,[slice]);
 return <main>
  <header><div className="brand"><b>PC</b><span><strong>PrintCost</strong><small>V2 QUOTE ENGINE</small></span></div><span className="status">ACTUAL SLICING · CURAENGINE</span></header>
  <section className="hero"><div><small>3D PRINTING QUOTATION</small><h1>From model<br/><i>to a real quote.</i></h1><p>Upload a model, choose print quality and support strategy, then run a real slicer to calculate material and print time.</p></div><div className="steps"><span>01</span>MODEL <span>02</span>SLICE <span>03</span>QUOTE</div></section>
  <section className="layout">
   <div className="main">
    <label className={"drop "+(file?"filled":"")} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();choose(e.dataTransfer.files[0])}}>
      <input type="file" accept=".stl,.3mf,.obj" onChange={e=>choose(e.target.files?.[0])}/>
      <strong>{file?file.name:"Drop STL / 3MF / OBJ here"}</strong><span>{file?"Ready for slicing":"Click to browse or drag a model"}</span>
    </label>
    <div className="preview"><div className="preview-top">SLICE PREVIEW <span>{slice?"SLICED":"NOT SLICED"}</span></div><div className="wire"><div className="cube"></div><div className="ring"></div></div></div>
    {slice&&<div className="metrics"><div><small>PRINT TIME</small><b>{Math.ceil(slice.print_time_sec/60)} min</b></div><div><small>MATERIAL</small><b>{slice.weight_g.toFixed(1)} g</b></div><div><small>LAYERS</small><b>{slice.layers}</b></div><div><small>SUPPORT</small><b>{slice.support_weight_g.toFixed(1)} g</b></div></div>}
   </div>
   <aside>
    <div className="panel-title"><div><small>PROFILE</small><h2>Print settings</h2></div><button onClick={()=>setS(initial)}>Reset</button></div>
    <section><h3>Quality</h3><label>Layer height <b>{s.layerHeight} mm</b><select value={s.layerHeight} onChange={e=>set("layerHeight",+e.target.value)}><option value=".08">0.08 · Ultra fine</option><option value=".12">0.12 · Fine</option><option value=".16">0.16 · Detail</option><option value=".2">0.20 · Standard</option><option value=".28">0.28 · Draft</option></select></label><label>Infill <b>{s.infill}%</b><input type="range" min="0" max="100" value={s.infill} onChange={e=>set("infill",+e.target.value)}/></label><label>Walls <b>{s.walls}</b><input type="range" min="1" max="8" value={s.walls} onChange={e=>set("walls",+e.target.value)}/></label></section>
    <section><h3>Supports</h3><div className="toggle"><span>Automatic supports</span><input type="checkbox" checked={s.supports} onChange={e=>set("supports",e.target.checked)}/></div><label>Overhang threshold <b>{s.supportAngle}°</b><input type="range" min="40" max="70" value={s.supportAngle} onChange={e=>set("supportAngle",+e.target.value)}/></label></section>
    <section><h3>Material & cost</h3><div className="two"><label>Material<select value={s.material} onChange={e=>set("material",e.target.value)}><option>PLA</option><option>PETG</option><option>ABS</option><option>TPU</option></select></label><label>Filament / kg<input type="number" value={s.filamentPerKg} onChange={e=>set("filamentPerKg",+e.target.value)}/></label></div><div className="two"><label>Machine / hour<input type="number" value={s.machinePerHour} onChange={e=>set("machinePerHour",+e.target.value)}/></label><label>Labor<input type="number" value={s.labor} onChange={e=>set("labor",+e.target.value)}/></label></div><label>Markup <b>{s.markup}%</b><input type="range" min="0" max="100" value={s.markup} onChange={e=>set("markup",+e.target.value)}/></label></section>
    <button className="slice" disabled={!file||busy} onClick={run}>{busy?"SLICING MODEL…":slice?"RE-SLICE MODEL":"SLICE & CALCULATE"}</button>
    {slice&&<div className="quote"><small>ESTIMATED CUSTOMER PRICE</small><strong>{money(slice.total)}</strong><div><span>Material</span><b>{money(slice.material_cost)}</b></div><div><span>Machine</span><b>{money(slice.machine_cost)}</b></div><div><span>Labor + markup</span><b>{money(slice.total-slice.material_cost-slice.machine_cost)}</b></div><button onClick={()=>setQuote(true)}>CREATE QUOTE →</button></div>}
   </aside>
  </section>
  {quote&&<div className="modal"><div className="quote-card"><button className="x" onClick={()=>setQuote(false)}>×</button><small>PRINTCOST / QUOTE</small><h2>Professional print quote</h2><div className="quote-file">{file?.name}<span>{s.material} · {s.layerHeight} mm · {s.infill}% infill</span></div><div className="big">{money(slice!.total)}</div><div className="quote-grid"><span>Print time<b>{Math.ceil(slice!.print_time_sec/60)} min</b></span><span>Material<b>{slice!.weight_g.toFixed(1)} g</b></span><span>Supports<b>{s.supports?"Automatic":"Off"}</b></span><span>Layers<b>{slice!.layers}</b></span></div><form onSubmit={e=>{e.preventDefault();alert("Demo order submitted. Connect this form to your order API/email in production.")}}><input required placeholder="Customer name"/><input required type="tel" placeholder="Phone number"/><textarea placeholder="Delivery notes"></textarea><button>REQUEST THIS PRINT →</button></form></div></div>}
  <footer>PrintCost V2 · Client UI on GitHub Pages · Slicer API required for real slicing</footer>
 </main>
}