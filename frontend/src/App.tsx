import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

type Metrics = {
  weight_g: number;
  print_time_sec: number;
  material_cost: number;
  machine_cost: number;
  total: number;
  layers?: number;
};

function formatTime(sec: number) {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function money(v: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);
}

function Viewer({ file, wireframe, onMetrics }: {
  file: File | null; wireframe: boolean; onMetrics: (m: {x:number,y:number,z:number}) => void;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mount.current) return;
    const host = mount.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#08090d");

    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, 0.1, 10000);
    camera.position.set(180, 150, 220);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;

    scene.add(new THREE.HemisphereLight(0xdfe7ff, 0x171923, 2.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(120, 220, 160);
    scene.add(key);
    const rim = new THREE.PointLight(0x9b8cff, 20, 700);
    rim.position.set(-180, 120, -120);
    scene.add(rim);

    const grid = new THREE.GridHelper(400, 40, 0x353946, 0x1b1d25);
    grid.position.y = -1;
    scene.add(grid);

    let object: THREE.Object3D | null = null;
    let frame: number;

    const dispose = () => {
      if (!object) return;
      object.traverse((node: any) => {
        node.geometry?.dispose?.();
        if (Array.isArray(node.material)) node.material.forEach((m:any) => m.dispose?.());
        else node.material?.dispose?.();
      });
    };

    const fit = (obj: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      obj.position.sub(center);
      const max = Math.max(size.x, size.y, size.z);
      const distance = max / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.55;
      camera.position.set(distance, distance * .7, distance);
      camera.near = Math.max(max / 1000, .01);
      camera.far = Math.max(max * 20, 1000);
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();
      onMetrics({ x:size.x, y:size.y, z:size.z });
    };

    const material = new THREE.MeshStandardMaterial({
      color: 0xaaa0ff,
      roughness: .28,
      metalness: .08,
      wireframe
    });

    const load = async () => {
      if (!file) return;
      setLoading(true);
      dispose();
      const url = URL.createObjectURL(file);
      try {
        let obj: THREE.Object3D;
        if (file.name.toLowerCase().endsWith(".stl")) {
          const geometry = await new STLLoader().loadAsync(url);
          geometry.computeVertexNormals();
          obj = new THREE.Mesh(geometry, material.clone());
        } else if (file.name.toLowerCase().endsWith(".obj")) {
          obj = await new OBJLoader().loadAsync(url);
          obj.traverse((n:any) => { if (n.isMesh) n.material = material.clone(); });
        } else {
          obj = await new ThreeMFLoader().loadAsync(url);
          obj.traverse((n:any) => { if (n.isMesh) n.material = material.clone(); });
        }
        object = obj;
        scene.add(obj);
        fit(obj);
      } catch (e) {
        console.error(e);
      } finally {
        URL.revokeObjectURL(url);
        setLoading(false);
      }
    };
    load();

    const resize = () => {
      if (!host.clientWidth || !host.clientHeight) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [file, wireframe, onMetrics]);

  return <div className="viewer">
    <div ref={mount} className="canvas"/>
    {!file && <div className="empty-view">
      <div className="model-glyph">◇</div>
      <strong>Drop a 3D model here</strong>
      <span>STL · OBJ · 3MF</span>
    </div>}
    {loading && <div className="viewer-loading">Loading geometry…</div>}
    {file && <div className="viewer-hud">
      <span>3D WORKSPACE</span>
      <span>ORBIT · ZOOM · PAN</span>
    </div>}
  </div>;
}

export default function App() {
  const [file, setFile] = useState<File|null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [dims, setDims] = useState({x:0,y:0,z:0});
  const [drag, setDrag] = useState(false);
  const [material, setMaterial] = useState("PLA");
  const [layer, setLayer] = useState(.2);
  const [infill, setInfill] = useState(20);
  const [walls, setWalls] = useState(3);
  const [supports, setSupports] = useState(true);
  const [markup, setMarkup] = useState(20);
  const [machine, setMachine] = useState(65000);
  const [filament, setFilament] = useState(900000);
  const [labor, setLabor] = useState(150000);
  const [result, setResult] = useState<Metrics|null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const choose = (f: File) => {
    if (/\.(stl|obj|3mf)$/i.test(f.name)) setFile(f);
  };

  const slice = async () => {
    if (!file) return;
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    form.append("material", material);
    form.append("layerHeight", String(layer));
    form.append("infill", String(infill));
    form.append("walls", String(walls));
    form.append("supports", String(supports));
    form.append("markup", String(markup));
    form.append("machinePerHour", String(machine));
    form.append("filamentPerKg", String(filament));
    form.append("labor", String(labor));
    try {
      const r = await fetch(`${API}/api/slice`, { method:"POST", body:form });
      if (!r.ok) throw new Error(await r.text());
      setResult(await r.json());
    } catch {
      setResult(null);
      alert("The slicer API is not reachable. Start the FastAPI/CuraEngine backend or configure VITE_API_URL.");
    } finally { setBusy(false); }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0]; if (f) choose(f);
  };

  return <main>
    <header className="topbar">
      <div className="brand"><span>PC</span><strong>PrintCost</strong></div>
      <div className="status"><i/> CURA ENGINE <b>READY</b></div>
    </header>

    <section className="hero">
      <div>
        <div className="eyebrow">3D PRINT QUOTATION ENGINE</div>
        <h1>From model<br/><em>to a real quote.</em></h1>
        <p>Inspect your model, configure the print, slice it, and turn the result into a transparent production price.</p>
      </div>
      <div className="steps"><span className="active">01 MODEL</span><span>02 SLICE</span><span>03 QUOTE</span></div>
    </section>

    <section className="workspace">
      <div className="stage-wrap" onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={onDrop}>
        <Viewer file={file} wireframe={wireframe} onMetrics={setDims}/>
        {drag && <div className="drop-overlay">DROP MODEL TO LOAD</div>}
        <div className="stage-actions">
          <button onClick={()=>input.current?.click()}>{file ? "CHANGE MODEL" : "UPLOAD MODEL"}</button>
          <button onClick={()=>setWireframe(!wireframe)}>{wireframe ? "SOLID" : "WIREFRAME"}</button>
          <input ref={input} hidden type="file" accept=".stl,.obj,.3mf" onChange={e=>e.target.files?.[0]&&choose(e.target.files[0])}/>
        </div>
        {file && <div className="model-info">
          <strong>{file.name}</strong>
          <span>{dims.x.toFixed(1)} × {dims.y.toFixed(1)} × {dims.z.toFixed(1)} mm</span>
        </div>}
      </div>

      <aside className="panel">
        <div className="panel-head"><span>PRINT SETTINGS</span><small>FDM</small></div>
        <label>Material<select value={material} onChange={e=>setMaterial(e.target.value)}><option>PLA</option><option>PETG</option><option>ABS</option><option>TPU</option></select></label>
        <label>Layer height <output>{layer.toFixed(2)} mm</output><input type="range" min=".08" max=".28" step=".01" value={layer} onChange={e=>setLayer(+e.target.value)}/></label>
        <label>Infill <output>{infill}%</output><input type="range" min="0" max="100" step="5" value={infill} onChange={e=>setInfill(+e.target.value)}/></label>
        <label>Walls <output>{walls}</output><input type="range" min="1" max="8" value={walls} onChange={e=>setWalls(+e.target.value)}/></label>
        <div className="toggle"><span>Automatic supports</span><button className={supports?"on":""} onClick={()=>setSupports(!supports)}><i/></button></div>
        <div className="divider"/>
        <div className="panel-head"><span>COST MODEL</span><small>LOCAL</small></div>
        <label>Filament / kg<input type="number" value={filament} onChange={e=>setFilament(+e.target.value)}/></label>
        <label>Machine / hour<input type="number" value={machine} onChange={e=>setMachine(+e.target.value)}/></label>
        <label>Labor<input type="number" value={labor} onChange={e=>setLabor(+e.target.value)}/></label>
        <label>Profit markup <output>{markup}%</output><input type="range" min="0" max="100" value={markup} onChange={e=>setMarkup(+e.target.value)}/></label>
        <button className="slice" disabled={!file||busy} onClick={slice}>{busy ? "SLICING MODEL…" : "SLICE & CALCULATE →"}</button>
      </aside>
    </section>

    <section className="metrics">
      <div><small>DIMENSIONS</small><strong>{dims.x ? `${dims.x.toFixed(1)} × ${dims.y.toFixed(1)} × ${dims.z.toFixed(1)}` : "—"}</strong><span>millimeters</span></div>
      <div><small>PRINT TIME</small><strong>{result ? formatTime(result.print_time_sec) : "—"}</strong><span>from G-code</span></div>
      <div><small>MATERIAL</small><strong>{result ? `${result.weight_g.toFixed(1)} g` : "—"}</strong><span>actual sliced usage</span></div>
      <div><small>LAYERS</small><strong>{result?.layers || "—"}</strong><span>sliced layers</span></div>
    </section>

    <section className="quote">
      <div><small>ESTIMATED CUSTOMER PRICE</small><strong>{result ? `${money(result.total)} تومان` : "Awaiting slice"}</strong><span>Transparent calculation · material + machine + labor + markup</span></div>
      {result && <div className="quote-details"><span>Material <b>{money(result.material_cost)}</b></span><span>Machine <b>{money(result.machine_cost)}</b></span></div>}
    </section>
  </main>
}
