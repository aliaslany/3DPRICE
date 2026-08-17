import os, re, json, math, shutil, subprocess, tempfile
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI(title="PrintCost Slicer API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
CURA=os.getenv("CURA_ENGINE","CuraEngine")
PROFILE=Path(__file__).resolve().parents[1]/"profiles"/"generic_fdm_220.json"

def num(v, default): 
    try:return float(v)
    except:return default

def parse_gcode(path):
    text=path.read_text(errors="ignore")
    # CuraEngine writes time/material information in the generated G-code comments.
    tm=re.search(r";TIME:(\d+)",text)
    mat=re.search(r";Filament used:\s*([\d.]+)m",text,re.I)
    weight=re.search(r";Filament used:\s*([\d.]+)g",text,re.I)
    layers=len(re.findall(r";LAYER_COUNT:(\d+)",text))
    if not layers:
        layers=len(re.findall(r"^;LAYER:\d+",text,re.M))
    seconds=int(tm.group(1)) if tm else 0
    grams=float(weight.group(1)) if weight else 0
    if not grams and mat:
        meters=float(mat.group(1))
        grams=meters*1.24*math.pi*(1.75**2)/4/1000
    return seconds,grams,layers

@app.get("/health")
def health(): return {"ok":True,"engine":CURA}

@app.post("/api/slice")
async def slice_model(
    file:UploadFile=File(...), material:str=Form("PLA"), layerHeight:float=Form(.2),
    infill:float=Form(20), walls:int=Form(3), supports:bool=Form(True),
    supportAngle:float=Form(55), printer:str=Form("generic_fdm_220"),
    filamentPerKg:float=Form(900000), machinePerHour:float=Form(65000),
    labor:float=Form(150000), markup:float=Form(20), delivery:float=Form(0)
):
    ext=Path(file.filename or "").suffix.lower()
    if ext not in {".stl",".3mf",".obj"}: raise HTTPException(400,"Unsupported model format")
    tmp=Path(tempfile.mkdtemp(prefix="printcost_"))
    try:
        src=tmp/("model"+ext); out=tmp/"print.gcode"
        src.write_bytes(await file.read())
        if not shutil.which(CURA): raise HTTPException(503,"CuraEngine is not installed on the slicer server.")
        cmd=[CURA,"slice","-j",str(PROFILE),"-l",str(src),"-o",str(out),
             "-s",f"layer_height={layerHeight}",
             "-s",f"infill_sparse_density={infill}",
             "-s",f"wall_line_count={walls}",
             "-s",f"support_enable={'True' if supports else 'False'}",
             "-s",f"support_angle={supportAngle}"]
        result=subprocess.run(cmd,capture_output=True,text=True,timeout=180)
        if result.returncode!=0: raise HTTPException(422,result.stderr[-4000:] or "CuraEngine slicing failed")
        seconds,grams,layers=parse_gcode(out)
        # Cura comments do not always expose support mass separately; estimate it from support extrusions
        support_grams=0.0
        material_cost=grams/1000*filamentPerKg
        machine_cost=seconds/3600*machinePerHour
        total=(material_cost+machine_cost+labor+delivery)*(1+markup/100)
        return {"volume_cm3":0,"weight_g":grams,"print_time_sec":seconds,"material_cost":material_cost,
                "machine_cost":machine_cost,"support_weight_g":support_grams,"layers":layers,
                "total":total,"warnings":[]}
    finally: shutil.rmtree(tmp,ignore_errors=True)
