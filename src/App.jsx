import { useState, useEffect, useRef } from "react";

// ─── STORAGE (localStorage wrapper — works everywhere, not just Claude.ai) ───
const storage = {
  get: (key) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};

// ─── SEED JOURNAL — Apr 4 2026 lawn assessment from Claude conversation ───────
const SEED_JOURNAL = [
  {id:"seed-1",taskId:"26-2-0",taskLabel:"✅ Applied Scotts MAX Crabgrass Preventer",monthName:"April",year:2026,date:"Apr 4, 2026",thumb:null,
   analysis:{score:7,grade:"B",condition:"Good",summary:"Scotts MAX Crabgrass Preventer with Lawn Food applied April 4, 2026. Timely application at or near the 50–55°F soil temp window. One bag covers ~5,000 sq ft — half-acre needs 4–5 total. Water in within 24 hrs. No overseeding for 4 months.",coverage:"Partial",weedPressure:"medium",diseaseRisk:"low",
   positives:["Pre-emergent applied at correct forsythia-bloom window","Crabgrass barrier now active","Fertilizer component provides early spring feed"],
   issues:["1 bag covers only 5,000 of 21,780 sq ft — need more coverage","Must wait until Apr 15 minimum before applying Weed & Feed","No overseeding possible until late August"],
   nextSteps:["Water in within 24 hrs — run sprinkler 20–30 min","Buy Andersons Barricade for May split-app (better residual)","Mark calendar: Weed & Feed earliest = April 15"],urgency:"low"}},

  {id:"seed-2",taskId:"26-3-0",taskLabel:"Lawn Assessment — Ant Mounds (Apr 4)",monthName:"April",year:2026,date:"Apr 4, 2026",thumb:null,
   analysis:{score:2,grade:"F",condition:"Critical",summary:"8–10+ large active ant colonies with extensive sandy mounds and dozens of entry holes found across the lawn on April 4. Colonies are well-established. Immediate treatment with Spectracide Ant Shield Granules required this weekend before colonies expand.",coverage:"N/A",weedPressure:"high",diseaseRisk:"low",
   positives:["Spectracide Ant Shield Granules 3 lb purchased Apr 4","Colonies are identifiable and fully treatable"],
   issues:["8–10+ large ant mounds across half-acre","Sandy mounds smothering grass underneath each colony","Multiple colonies indicate widespread infestation"],
   nextSteps:["Apply Spectracide granules Apr 5–6 without disturbing mounds first","Shake directly on and 2 ft around each mound","Water in lightly after — 10 sec per mound","Re-inspect in 1 week — retreat survivors"],urgency:"critical"}},

  {id:"seed-3",taskId:"26-3-1",taskLabel:"Lawn Assessment — Bittercress & Clover (Apr 4)",monthName:"April",year:2026,date:"Apr 4, 2026",thumb:null,
   analysis:{score:3,grade:"D",condition:"Poor",summary:"Hairy bittercress found in full bloom April 4 — seed pods imminent. Heavy white clover dominating large sections with blue speedwell mixed in. If bittercress pods are not treated within days, hundreds of seeds per plant will explode 3 feet outward, compounding next year's problem dramatically.",coverage:"40% weeds",weedPressure:"high",diseaseRisk:"low",
   positives:["Weed identified before full seed explosion — window still open","Broadleaf herbicide will kill bittercress effectively"],
   issues:["Hairy bittercress in full bloom — seed pods about to explode","Heavy white clover infestation throughout entire lawn","Blue speedwell (Veronica) mixed throughout clover patches","Ground coverage is majority weeds not grass in affected zones"],
   nextSteps:["Buy Ortho WeedClear liquid spray ASAP — Walmart $14","Spray bittercress Apr 10–12 when temps 60°F+, no rain 24 hrs","Do NOT mow bittercress before spraying — spreads seeds","Apply Scotts Weed & Feed Apr 15–25 for clover throughout lawn"],urgency:"critical"}},

  {id:"seed-4",taskId:"26-8-0",taskLabel:"Lawn Assessment — Bare Patches & Overall Health (Apr 4)",monthName:"April",year:2026,date:"Apr 4, 2026",thumb:null,
   analysis:{score:3,grade:"D",condition:"Poor",summary:"Major bare zone issue — estimated 30–40% of lawn is bare or severely thinned as of April 4. One circular dead patch is consistent with past grub damage. Heavy weed pressure in remaining areas. The September aeration and full overseed is the single most important intervention this year.",coverage:"55%",weedPressure:"high",diseaseRisk:"low",
   positives:["Active green grass present in some sections — lawn can recover","Crabgrass preventer applied today sets foundation","GrubEx purchased and ready for May"],
   issues:["30–40% bare soil across lawn — major deficit","Circular dead patch suggests historical grub damage","Dead leaf litter matted on bare areas blocking sunlight","Clover dominating large sections where grass should be","Overall health significantly below Zone 7 standards for April"],
   nextSteps:["Rake dead leaves off bare patches this weekend — let sunlight in","GrubEx application May 15–31 — have 1 bag, need 2 more","Order 2 bags Jonathan Green Black Beauty Ultra in August","Core aeration + FULL overseed September 5–15 — this is the big fix","Consider compost topdress over bare areas after Sept aeration"],urgency:"high"}},
];

function getInitialJournal() {
  const saved = storage.get("lp-journal");
  if (saved && saved.length > 0) return saved;
  // First load — seed with Apr 4 assessment
  storage.set("lp-journal", SEED_JOURNAL);
  return SEED_JOURNAL;
}

const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WMO = {0:["☀️","Clear"],1:["🌤️","Mainly Clear"],2:["⛅","Partly Cloudy"],3:["☁️","Overcast"],45:["🌫️","Fog"],48:["🌫️","Icy Fog"],51:["🌦️","Lt Drizzle"],53:["🌦️","Drizzle"],55:["🌧️","Hvy Drizzle"],61:["🌧️","Lt Rain"],63:["🌧️","Rain"],65:["🌧️","Hvy Rain"],71:["🌨️","Lt Snow"],73:["❄️","Snow"],75:["❄️","Hvy Snow"],80:["🌦️","Showers"],81:["🌧️","Showers"],82:["🌧️","Hvy Showers"],95:["⛈️","T-Storm"],96:["⛈️","T-Storm+Hail"],99:["⛈️","T-Storm+Hail"]};
const wmo = c => WMO[c] || ["🌡️","Unknown"];

// ─── CALENDAR EXPORT ─────────────────────────────────────────────────────────
const APP_URL = "https://cheerful-baklava-1ea392.netlify.app/";
const MONTH_NUM = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
const TASK_EMOJI = {pre:"🛡️",post:"💊",fert:"🌿",lime:"🪨",mow:"✂️",water:"💧",fungicide:"🍄",grub:"🪲",aerate:"🔧",overseed:"🌱",soil:"🧪",prep:"📋",plan:"📅",scout:"🔍",dethatch:"🌾",topdress:"🪣"};

function pad2(n){return String(n).padStart(2,"0");}
function icsDate(y,m,d,delta=0){const dt=new Date(y,m-1,d+delta);return `${dt.getFullYear()}${pad2(dt.getMonth()+1)}${pad2(dt.getDate())}`;}

function parseDateRange(dateStr,year){
  const clean=dateStr.replace(/\s*\(.*?\)/g,"").trim();
  const range=clean.match(/^(\w{3})\s+(\d{1,2})[–\-](\d{1,2})$/);
  if(range){const mon=MONTH_NUM[range[1]];if(!mon)return null;const s=parseInt(range[2]),e=parseInt(range[3]);return{start:icsDate(year,mon,s),end:icsDate(year,mon,e,1)};}
  const single=clean.match(/^(\w{3})\s+(\d{1,2})$/);
  if(single){const mon=MONTH_NUM[single[1]];if(!mon)return null;const s=parseInt(single[2]);return{start:icsDate(year,mon,s),end:icsDate(year,mon,s,1)};}
  return null;
}

function buildICS(years){
  const lines=[
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Zone7LawnPlanner//EN",
    "CALSCALE:GREGORIAN","METHOD:PUBLISH",
    `X-WR-CALNAME:🌿 Lawn Care ${years.join(" & ")}`,
    `X-WR-CALDESC:Zone 7 Half-Acre Lawn Care Schedule — ${APP_URL}`,
  ];
  years.forEach(year=>{
    PLAN[year].forEach(month=>{
      month.tasks.forEach(task=>{
        if(!task.date) return;
        const dr=parseDateRange(task.date,year);
        if(!dr) return;
        const emoji=TASK_EMOJI[task.type]||"📌";
        const desc=[
          task.detail.replace(/[,;\\]/g,m=>"\\"+m).replace(/\n/g,"\\n"),
          "",`Month: ${month.month} ${year}`,`Date: ${task.date}`,"",
          `Open Lawn Planner: ${APP_URL}`,
        ].join("\\n");
        lines.push(
          "BEGIN:VEVENT",`UID:lawn-${task.id}-${year}@lawnplanner`,
          `DTSTART;VALUE=DATE:${dr.start}`,`DTEND;VALUE=DATE:${dr.end}`,
          `SUMMARY:${emoji} ${task.label}`,
          `DESCRIPTION:${desc}`,
          `URL:${APP_URL}`,
          "CATEGORIES:Lawn Care",
          "BEGIN:VALARM","TRIGGER:-P1D","ACTION:DISPLAY",
          `DESCRIPTION:Reminder: ${task.label} — tap URL to open planner`,
          "END:VALARM","END:VEVENT"
        );
      });
    });
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadICS(years){
  const blob=new Blob([buildICS(years)],{type:"text/calendar;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=`lawn-care-zone7-${years.join("-")}.ics`;
  document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(url);
}

// ─── CALENDAR EXPORT MODAL ────────────────────────────────────────────────────
function CalendarModal({onClose}){
  const [done,setDone]=useState(null);
  const go=years=>{downloadICS(years);setDone(years);};
  const opts=[
    {years:[2026,2027],label:"Both Years — 2026 & 2027",sub:"Full 2-year program, all tasks",rec:true},
    {years:[2026],label:"2026 Only",sub:"26 tasks across all 12 months"},
    {years:[2027],label:"2027 Only",sub:"24 tasks across all 12 months"},
  ];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#1a2e1a",border:"1px solid rgba(76,175,80,0.45)",borderRadius:18,padding:"20px",maxWidth:370,width:"100%"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:"700",color:"#c8e6c9"}}>📅 Add to Calendar</div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.08)",border:"none",color:"#a5d6a7",borderRadius:20,padding:"3px 9px",cursor:"pointer",fontSize:14}}>✕</button>
        </div>
        {done?(
          <div style={{textAlign:"center",padding:"12px 0"}}>
            <div style={{fontSize:38,marginBottom:10}}>✅</div>
            <div style={{fontSize:14,fontWeight:"700",color:"#c8e6c9",marginBottom:8}}>Calendar file downloaded!</div>
            <div style={{background:"rgba(255,193,7,0.1)",border:"1px solid rgba(255,193,7,0.3)",borderRadius:10,padding:"12px",fontSize:11,color:"#fff9c4",lineHeight:1.7,textAlign:"left",marginBottom:14}}>
              <b>iPhone / Mac:</b> Open the .ics file → tap "Add All" → every event appears in your calendar with a link back to the app.<br/><br/>
              <b>Google Calendar:</b> Settings → Import → upload the file.<br/><br/>
              <b>Outlook:</b> Double-click the .ics file to import.
            </div>
            <div style={{fontSize:11,color:"#81c784",marginBottom:14,lineHeight:1.6}}>
              Tap any event → scroll to the URL field → opens <b style={{color:"#c8e6c9"}}>{APP_URL}</b>
            </div>
            <button onClick={onClose} style={{padding:"9px 24px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:"700",background:"linear-gradient(135deg,#4caf50,#388e3c)",color:"#fff"}}>Done</button>
          </div>
        ):(
          <div>
            <div style={{fontSize:12,color:"#a5d6a7",marginBottom:14,lineHeight:1.6}}>
              Downloads a <code>.ics</code> file with all lawn care tasks. Every event links back to your app — tap any calendar event to open the planner instantly.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
              {opts.map(o=>(
                <button key={o.years.join()} onClick={()=>go(o.years)} style={{padding:"12px 14px",borderRadius:12,border:o.rec?"2px solid rgba(76,175,80,0.6)":"1px solid rgba(76,175,80,0.25)",background:o.rec?"rgba(76,175,80,0.15)":"rgba(255,255,255,0.04)",cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.2s"}}>
                  {o.rec&&<div style={{fontSize:9,color:"#69f0ae",fontWeight:"700",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Recommended</div>}
                  <div style={{fontSize:13,fontWeight:"700",color:"#c8e6c9"}}>{o.label}</div>
                  <div style={{fontSize:11,color:"#81c784",marginTop:2}}>{o.sub}</div>
                </button>
              ))}
            </div>
            <div style={{fontSize:10,color:"#66bb6a",textAlign:"center"}}>Works with Apple Calendar, Google Calendar & Outlook</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LIVE WEATHER via Open-Meteo (free, no API key, CORS-enabled) ─────────────
async function fetchWeather() {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=39.27&longitude=-76.75&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,precipitation_probability_max&timezone=America%2FNew_York&past_days=3&forecast_days=7&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch";
  const r = await fetch(url);
  if (!r.ok) throw new Error("Weather fetch failed");
  return r.json();
}
function todayIdx(times) { const t = new Date().toISOString().split("T")[0]; const i = times.findIndex(d=>d===t); return i>=0?i:3; }
function getLawnAdvice(cur, daily) {
  const ti = todayIdx(daily.time), temp = Math.round(cur.temperature_2m), wind = Math.round(cur.wind_speed_10m), code = cur.weather_code;
  const rain = code>=51, todayRain = daily.precipitation_sum[ti]||0, tomRain = daily.precipitation_sum[ti+1]||0, rainPct = daily.precipitation_probability_max[ti]||0;
  const pastRain = (daily.precipitation_sum[ti-1]||0)+(daily.precipitation_sum[ti-2]||0), moist = pastRain>0.3;
  const A = [];
  if(!rain&&todayRain<0.1&&temp>=45&&temp<92&&wind<20) A.push({task:"Mow Lawn",icon:"✂️",status:"go",reason:`Good conditions — ${temp}°F, dry, ${wind}mph winds.`});
  else if(rain||todayRain>0.1) A.push({task:"Mow Lawn",icon:"✂️",status:"stop",reason:"Skip — wet grass spreads disease and clogs blades."});
  else if(temp>=92) A.push({task:"Mow Lawn",icon:"✂️",status:"caution",reason:"Mow before 9 AM only — high heat stresses freshly-cut grass."});
  else A.push({task:"Mow Lawn",icon:"✂️",status:"caution",reason:"Marginal conditions — check again later."});
  if(!rain&&todayRain<0.05&&rainPct<30&&temp>=60&&temp<=85&&wind<=10) A.push({task:"Spray Herbicide",icon:"💊",status:"go",reason:`Ideal window — ${temp}°F, ${wind}mph, low rain risk.`});
  else if(rain||todayRain>0.1||rainPct>40) A.push({task:"Spray Herbicide",icon:"💊",status:"stop",reason:"Do NOT spray — rain will wash herbicide away."});
  else if(wind>10) A.push({task:"Spray Herbicide",icon:"💊",status:"stop",reason:`Too windy (${wind}mph) — drift risk. Wait for calm.`});
  else if(temp>85) A.push({task:"Spray Herbicide",icon:"💊",status:"stop",reason:`Too hot (${temp}°F) — herbicide volatilizes above 85°F.`});
  else A.push({task:"Spray Herbicide",icon:"💊",status:"caution",reason:"Marginal — check conditions again soon."});
  if(!rain&&rainPct<50&&temp>=50&&temp<=88) A.push({task:"Fertilize",icon:"🌿",status:"go",reason:tomRain>0.1?"Rain tomorrow will water it in — great timing.":"Good conditions. Water in if no rain in 48 hrs."});
  else if(todayRain>0.5) A.push({task:"Fertilize",icon:"🌿",status:"stop",reason:"Heavy rain expected — fertilizer will run off."});
  else A.push({task:"Fertilize",icon:"🌿",status:"caution",reason:"Marginal — wait for a dry, mild window."});
  const m = new Date().getMonth();
  if(m>=7&&m<=9) {
    if(moist&&!rain&&temp<85) A.push({task:"Aerate/Overseed",icon:"🔧",status:"go",reason:"Moist soil from recent rain — perfect aeration window!"});
    else if(!moist) A.push({task:"Aerate/Overseed",icon:"🔧",status:"caution",reason:"Water lawn 24 hrs before aerating — soil too dry."});
    else A.push({task:"Aerate/Overseed",icon:"🔧",status:"stop",reason:"Wait for rain to stop and lawn to dry slightly."});
  }
  if(!rain&&todayRain<0.1&&tomRain<0.1&&temp>=65) A.push({task:"Irrigate",icon:"💧",status:"go",reason:"No rain in forecast — run irrigation at 5–7 AM."});
  else if(todayRain>0.5||rainPct>60) A.push({task:"Irrigate",icon:"💧",status:"stop",reason:"Skip — rain covers watering needs today."});
  else A.push({task:"Irrigate",icon:"💧",status:"caution",reason:"Check soil first — water only if top 2\" feel dry."});
  return A;
}

// ─── AI ANALYSIS (requires Anthropic API key — optional) ─────────────────────
function resizeImage(file, maxDim=900) {
  return new Promise(res => {
    const img = new Image(), reader = new FileReader();
    reader.onload = e => { img.src = e.target.result; img.onload = () => {
      const rat = Math.min(maxDim/img.width, maxDim/img.height, 1);
      const c = document.createElement("canvas"); c.width = Math.round(img.width*rat); c.height = Math.round(img.height*rat);
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      const full = c.toDataURL("image/jpeg",0.82).split(",")[1];
      const tc = document.createElement("canvas"), tr = Math.min(240/img.width,240/img.height,1);
      tc.width = Math.round(img.width*tr); tc.height = Math.round(img.height*tr);
      tc.getContext("2d").drawImage(img,0,0,tc.width,tc.height);
      res({full, thumb: tc.toDataURL("image/jpeg",0.55)});
    }; }; reader.readAsDataURL(file);
  });
}
async function analyzeLawn(base64, taskLabel, monthName, year, apiKey) {
  if (!apiKey) throw new Error("API key required");
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type":"application/json", "x-api-key": apiKey, "anthropic-version":"2023-06-01" },
    body: JSON.stringify({ model:"claude-opus-4-5", max_tokens:1000, messages:[{ role:"user", content:[
      {type:"image", source:{type:"base64", media_type:"image/jpeg", data:base64}},
      {type:"text", text:`You are a certified lawn care expert for Zone 7 (Ellicott City, Maryland). Analyze this lawn photo taken after completing: "${taskLabel}" in ${monthName} ${year}.\n\nRespond ONLY with a valid JSON object — no markdown, no backticks:\n{"score":7,"grade":"B","condition":"Good","summary":"Two sentence assessment.","coverage":"80%","weedPressure":"low","diseaseRisk":"low","positives":["Good color"],"issues":["Some crabgrass"],"nextSteps":["Apply pre-emergent next spring"],"urgency":"low"}`}
    ]}] })
  });
  const data = await resp.json();
  if (data.type === "error") throw new Error(data.error?.message || "API error");
  return JSON.parse((data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());
}

// ─── STYLE MAPS ───────────────────────────────────────────────────────────────
const TC={pre:{bg:"#fff3e0",b:"#ff9800",icon:"🛡️",label:"Pre-Emergent"},post:{bg:"#fce4ec",b:"#e91e63",icon:"💊",label:"Post-Emergent"},fert:{bg:"#e8f5e9",b:"#4caf50",icon:"🌿",label:"Fertilizer"},lime:{bg:"#e3f2fd",b:"#2196f3",icon:"🪨",label:"Lime"},mow:{bg:"#f3e5f5",b:"#9c27b0",icon:"✂️",label:"Mowing"},water:{bg:"#e0f7fa",b:"#00bcd4",icon:"💧",label:"Irrigation"},fungicide:{bg:"#fff8e1",b:"#ffc107",icon:"🍄",label:"Fungicide"},grub:{bg:"#fbe9e7",b:"#ff5722",icon:"🪲",label:"Grub Control"},aerate:{bg:"#e8eaf6",b:"#3f51b5",icon:"🔧",label:"Aeration"},overseed:{bg:"#f1f8e9",b:"#8bc34a",icon:"🌱",label:"Overseeding"},soil:{bg:"#efebe9",b:"#795548",icon:"🧪",label:"Soil Test"},prep:{bg:"#eceff1",b:"#607d8b",icon:"📋",label:"Prep"},plan:{bg:"#f5f5f5",b:"#9e9e9e",icon:"📅",label:"Planning"},scout:{bg:"#fff9c4",b:"#f9a825",icon:"🔍",label:"Scouting"},dethatch:{bg:"#e0f2f1",b:"#009688",icon:"🌾",label:"Dethatch"},topdress:{bg:"#efebe9",b:"#6d4c41",icon:"🪣",label:"Topdress"}};
const ST={go:{bg:"rgba(76,175,80,0.15)",b:"rgba(76,175,80,0.5)",dot:"#4caf50",label:"✅ Go"},caution:{bg:"rgba(255,193,7,0.15)",b:"rgba(255,193,7,0.5)",dot:"#ffc107",label:"⚠️ Caution"},stop:{bg:"rgba(244,67,54,0.15)",b:"rgba(244,67,54,0.5)",dot:"#f44336",label:"🚫 Skip"}};
const UC={none:"#4caf50",low:"#4caf50",medium:"#ffc107",high:"#ff9800",critical:"#f44336"};
const GC={"A+":"#2e7d32","A":"#388e3c","A-":"#43a047","B+":"#558b2f","B":"#7cb342","B-":"#9ccc65","C+":"#f9a825","C":"#ffb300","C-":"#fb8c00","D":"#e64a19","F":"#c62828"};
const PC={Essential:{bg:"rgba(244,67,54,0.15)",b:"#f44336",t:"#ef9a9a"},Recommended:{bg:"rgba(255,152,0,0.15)",b:"#ff9800",t:"#ffcc80"},Optional:{bg:"rgba(76,175,80,0.15)",b:"#4caf50",t:"#a5d6a7"},Conditional:{bg:"rgba(33,150,243,0.15)",b:"#2196f3",t:"#90caf9"},Alternative:{bg:"rgba(156,39,176,0.15)",b:"#9c27b0",t:"#ce93d8"}};
const SC2={"Costco":"#005DAA","Home Depot":"#F96302","Lowes":"#004990","Walmart":"#0071CE","Amazon":"#FF9900","DoMyOwn.com":"#2e7d32","SiteOne":"#1565C0","Ace Hardware":"#CC0000"};
const sc2=n=>SC2[n]||"#78909c";

// ─── PLAN DATA ────────────────────────────────────────────────────────────────
const PLAN={
 2026:[
  {month:"January",season:"Winter",icon:"❄️",notes:"Lawn dormant. Avoid foot traffic on frosted grass. Do NOT fertilize.",
   tasks:[{id:"26-0-0",type:"prep",label:"Equipment prep",date:"Jan 3–10",detail:"Sharpen mower blades, change oil, service spreader and sprayer"},{id:"26-0-1",type:"soil",label:"Soil sample",date:"Jan 10–17",detail:"Mail soil to extension lab. Target pH 6.0–6.5 for fescue"},{id:"26-0-2",type:"plan",label:"Order spring supplies",date:"Jan 15–31",detail:"Order pre-emergent, grub control, fertilizer before spring rush"}],products:[]},
  {month:"February",season:"Winter",icon:"🌬️",notes:"Check soil temps daily in late Feb. Pre-emergent window opens soon.",
   tasks:[{id:"26-1-0",type:"lime",label:"Apply lime if needed",date:"Feb 1–15",detail:"If pH < 6.0: 40 lbs pelletized lime per 1,000 sq ft"},{id:"26-1-1",type:"prep",label:"Finalize spring supplies",date:"Feb 15–28",detail:"Confirm pre-emergent on hand. Opens at 50°F soil temp"}],
   products:[{name:"Pennington Fast Acting Lime",type:"Lime",rate:"40 lbs/1,000 sq ft",notes:"Only if pH test shows need"},{name:"Encap Fast Acting Lime",type:"Lime",rate:"40 lbs/1,000 sq ft",notes:"Alternative pelletized option"}]},
  {month:"March",season:"Early Spring",icon:"🌱",notes:"✅ DONE Apr 4: Scotts MAX Crabgrass Preventer applied! Water in if not already done. ⚠️ Pre-emergent and overseeding are now mutually exclusive until late Aug.",
   tasks:[{id:"26-2-0",type:"pre",label:"✅ Applied pre-emergent — Apr 4",date:"DONE Apr 4, 2026",detail:"✅ COMPLETED: Scotts MAX Crabgrass Preventer with Lawn Food applied April 4, 2026. Water in within 24 hrs of application. No overseeding for 4 months."},{id:"26-2-1",type:"fert",label:"Water in crabgrass preventer",date:"Apr 4–5",detail:"Run sprinkler 20–30 min or let rain do it. Granules must reach soil to activate. This is critical — do not skip."},{id:"26-2-2",type:"mow",label:"First mow of season",date:"Apr 5–10",detail:"Mow at 3.5–4\"; bag clippings to remove winter debris. Do NOT mow the day you apply granular products."}],
   products:[{name:"Scotts MAX Crabgrass Preventer with Lawn Food",type:"Pre-Emergent (Pendimethalin)",rate:"Applied Apr 4 ✅",notes:"YOU OWN & APPLIED — covers 5,000 sq ft. Need 2nd bag for rest of half-acre + split app in May"},{name:"Andersons Barricade 0.38% Prodiamine",type:"Pre-Emergent (Prodiamine)",rate:"3.2 lbs/1,000 sq ft",notes:"Better option for May split-app — longer residual than Scotts MAX"}]},
  {month:"April",season:"Spring",icon:"🌼",notes:"🚨 URGENT: Ant mounds & bittercress need attention this week. Wait until Apr 15+ for Weed & Feed (4 weeks after crabgrass preventer).",
   tasks:[
    {id:"26-3-0",type:"scout",label:"🐜 Treat ant mounds — THIS WEEKEND",date:"Apr 5–6",detail:"URGENT — multiple large ant colonies found Apr 4. Shake Spectracide Ant Shield Granules directly on each mound without disturbing them. Water in lightly. You own this product — use it NOW."},
    {id:"26-3-1",type:"post",label:"🌿 Spray bittercress before seeds explode",date:"Apr 10–12",detail:"URGENT — hairy bittercress spotted in full bloom Apr 4. Pods will shoot seeds 3 feet if you wait. Spray liquid Ortho WeedClear or 3-way herbicide at 60°F+, no rain forecast 24 hrs. Do NOT mow first."},
    {id:"26-3-2",type:"fert",label:"Apply Scotts Weed & Feed",date:"Apr 15–25",detail:"YOU OWN THIS — Scotts Turf Builder Weed & Feed. Apply on wet morning grass (after dew or light water). Kills clover, dandelions, bittercress while feeding lawn. Must wait 4 weeks after crabgrass preventer = Apr 15 earliest. Covers 12,000 sq ft — you need 2 bags for full half-acre."},
    {id:"26-3-3",type:"mow",label:"Rake dead leaves off bare patches",date:"Apr 5–10",detail:"Matted leaves visible in photos — rake off bare areas this weekend so sunlight reaches soil. Do not mow yet if still wet from any rain."}
   ],
   products:[
    {name:"Spectracide Ant Shield Insect Killer Granules 3 lb",type:"Insecticide (lambda-cyhalothrin)",rate:"Shake directly on each mound + 2 ft around. Water in lightly.",notes:"✅ YOU OWN — bought Apr 4. Use immediately on all mounds this weekend."},
    {name:"Scotts Turf Builder Weed & Feed",type:"Fertilizer + Post-Emergent",rate:"Per label — apply on wet grass. Covers 12,000 sq ft.",notes:"✅ YOU OWN — apply Apr 15–25. Need 2 bags for full half-acre. Kills clover & bittercress."},
    {name:"Ortho WeedClear Lawn Weed Killer (liquid)",type:"Post-Emergent (3-way)",rate:"Spot spray bittercress areas Apr 10–12",notes:"Buy 1 bottle — needed urgently for bittercress before seed pods burst. Available at Walmart ~$14."}
   ]},
  {month:"May",season:"Late Spring",icon:"🌿",notes:"Raise mowing height to 4\" as temps rise. GrubEx in hand — apply May 15–31.",
   tasks:[{id:"26-4-0",type:"pre",label:"2nd pre-emergent (split)",date:"May 10–20",detail:"Half-rate split app 8–10 weeks after April 4 application. Use Andersons Barricade prodiamine for this app — longer residual than Scotts MAX."},{id:"26-4-1",type:"grub",label:"Apply GrubEx — water in same day",date:"May 15–31",detail:"✅ YOU HAVE 1 BAG (28.7 lb = 10,000 sq ft). Need 2 more bags for full half-acre. Apply evenly with broadcast spreader. MUST water in within 24 hrs — critical for activation. Kills grubs all season."},{id:"26-4-2",type:"mow",label:"Raise height to 4\"",date:"May 1–10",detail:"Taller grass shades soil, retains moisture, suppresses weeds through summer heat"}],
   products:[{name:"Scotts GrubEx Season-Long Grub Killer 28.7 lb",type:"Grub Control (Chlorantraniliprole)",rate:"2.87 lbs/1,000 sq ft — need 3 bags total for half-acre",notes:"✅ YOU OWN 1 BAG — bought Apr 4 at Costco. Buy 2 more bags before May. MUST water in within 24 hrs."},{name:"Andersons Barricade (split app)",type:"Pre-Emergent (Prodiamine)",rate:"1.6 lbs/1,000 sq ft (half rate)",notes:"Buy online at DoMyOwn.com — better for May split-app than Scotts pendimethalin"}]},
  {month:"June",season:"Summer",icon:"☀️",notes:"Avoid fertilizing in June/July heat — increases disease risk.",
   tasks:[{id:"26-5-0",type:"water",label:"Begin irrigation schedule",date:"Jun 1–7",detail:"1–1.5\" per week; water 5–6 AM. Deep & infrequent (2–3x/week)"},{id:"26-5-1",type:"fungicide",label:"Monitor & treat brown patch",date:"Jun 15–30",detail:"Brown patch = circular tan patches. Treat immediately"},{id:"26-5-2",type:"mow",label:"Mow high at 4\"",date:"Jun 1–30",detail:"Keep at 4\". Never remove >1/3 of blade at once"}],
   products:[{name:"Scotts DiseaseEx Lawn Fungicide",type:"Fungicide (azoxystrobin)",rate:"3 lbs/1,000 sq ft",notes:"Broad-spectrum; brown patch, dollar spot, rust"},{name:"Eagle 20EW (Myclobutanil)",type:"Fungicide — Pro Grade",rate:"1.2 oz/gallon",notes:"Rotate with azoxystrobin to prevent resistance"}]},
  {month:"July",season:"Summer",icon:"🔥",notes:"July = hold on. Keep mowing high, water consistently, no new chemicals.",
   tasks:[{id:"26-6-0",type:"water",label:"Maintain deep watering",date:"Jul 1–31",detail:"Fescue may semi-dormant — do NOT let it fully dry out"},{id:"26-6-1",type:"fungicide",label:"2nd fungicide if humid",date:"Jul 10–20",detail:"Rotate active ingredient from June app"},{id:"26-6-2",type:"scout",label:"Scout for pests weekly",date:"Jul 1–31",detail:"Check for armyworms, chinch bugs. Drag white cloth to spot larvae"}],
   products:[{name:"Bifen IT (bifenthrin)",type:"Insecticide",rate:"Per label",notes:"Targets chinch bugs, webworms, armyworms"},{name:"Spectracide Triazicide",type:"Insecticide",rate:"Per label",notes:"Granular; good for surface feeders"}]},
  {month:"August",season:"Late Summer",icon:"🌤️",notes:"⚠️ Do NOT aerate or overseed until soil temps drop below 70°F.",
   tasks:[{id:"26-7-0",type:"prep",label:"Book aeration & order seed",date:"Aug 1–15",detail:"Order 50–55 lbs seed + starter fert. Book aerator rental now"},{id:"26-7-1",type:"post",label:"Nutsedge & summer weeds",date:"Aug 1–20",detail:"Hit nutsedge, goosegrass, crabgrass before they drop seed"},{id:"26-7-2",type:"soil",label:"Optional 2nd soil test",date:"Aug 15–25",detail:"Useful before heavy fall amendment program"}],
   products:[{name:"Ortho Nutsedge Killer",type:"Post-Emergent",rate:"Per label",notes:"Targets yellow and purple nutsedge"},{name:"Drive XLR8 (quinclorac)",type:"Post-Emergent",rate:"Per label",notes:"Targets mature crabgrass pre-emergent missed"}]},
  {month:"September",season:"Early Fall 🔑",icon:"🍂",notes:"🌟 MOST IMPORTANT month. Aerate → Seed → Starter Fert same day.",
   tasks:[{id:"26-8-0",type:"aerate",label:"Core aeration",date:"Sep 5–15",detail:"Most critical task of the year. Aerate when moist. Leave plugs on surface"},{id:"26-8-1",type:"overseed",label:"Broadcast overseed entire lawn",date:"Sep 5–15",detail:"50–55 lbs tall fescue for half-acre (2.5 lbs/1,000 sq ft)"},{id:"26-8-2",type:"fert",label:"Starter fertilizer",date:"Sep 5–15",detail:"Apply same day as seeding. High phosphorus drives seedling roots"},{id:"26-8-3",type:"water",label:"2x daily germination watering",date:"Sep 5–25",detail:"Light watering 7 AM + 4 PM until germination (7–14 days). Then taper"},{id:"26-8-4",type:"topdress",label:"Topdress with compost",date:"Sep 5–15",detail:"Optional: 1/4\" fine compost over seed. Dramatically improves germination"}],
   products:[{name:"Jonathan Green Black Beauty Ultra",type:"Grass Seed (Tall Fescue)",rate:"2.5–3 lbs/1,000 sq ft",notes:"Endophyte-enhanced; drought tolerant"},{name:"Scotts Starter Fertilizer for New Grass",type:"Starter Fertilizer (24-25-4)",rate:"3 lbs/1,000 sq ft",notes:"High phosphorus for seedling roots"},{name:"Lesco 18-24-12",type:"Starter Fertilizer — Pro Grade",rate:"Per label",notes:"Best professional-grade starter available"}]},
  {month:"October",season:"Fall",icon:"🍁",notes:"Ideal weed spray: 50–80°F, no rain 24 hrs, dry leaves.",
   tasks:[{id:"26-9-0",type:"fert",label:"Fall nitrogen feed",date:"Oct 5–15",detail:"1 lb N/1,000 sq ft. High-K formula builds winter roots"},{id:"26-9-1",type:"post",label:"Fall broadleaf weed spray",date:"Oct 10–25",detail:"Best time all year — herbicide translocates deep into roots"},{id:"26-9-2",type:"mow",label:"Keep mowing; bag leaves",date:"Oct 1–31",detail:"Bag leaves weekly — mats smother seedlings and cause snow mold"}],
   products:[{name:"Scotts Turf Builder WinterGuard 32-0-10",type:"Fertilizer (Winterizer)",rate:"3 lbs/1,000 sq ft",notes:"High K for winter hardening"},{name:"Trimec Classic Broadleaf Herbicide",type:"Post-Emergent",rate:"1.5 oz/gallon",notes:"Fall application most effective for dandelion, clover, plantain"}]},
  {month:"November",season:"Late Fall",icon:"🍃",notes:"Clean up leaves fully. Store liquid chemicals above freezing.",
   tasks:[{id:"26-10-0",type:"pre",label:"Poa annua pre-emergent",date:"Nov 1–10",detail:"Low-rate prodiamine before soil drops to 50°F"},{id:"26-10-1",type:"fert",label:"Winterizer fertilizer",date:"Nov 1–15",detail:"Final feed before dormancy. Lawn stores carbs for spring"},{id:"26-10-2",type:"mow",label:"Final mow at 3\"",date:"Nov 15–30",detail:"Lower to 3\" for last cut. Bag all leaf debris"}],
   products:[{name:"Quali-Pro Prodiamine 65 WDG",type:"Pre-Emergent (Poa annua)",rate:"0.5 oz/1,000 sq ft",notes:"Low rate; skip if overseeding after Sept 15"},{name:"Scotts Turf Builder WinterGuard",type:"Winterizer Fertilizer",rate:"Per label",notes:"Apply before first hard freeze"}]},
  {month:"December",season:"Winter",icon:"🌨️",notes:"Avoid de-icing salts near lawn edges — use sand or CMA instead.",
   tasks:[{id:"26-11-0",type:"prep",label:"Full equipment service",date:"Dec 1–15",detail:"Drain gas, change oil, fog cylinders, sharpen blades for 2027"},{id:"26-11-1",type:"plan",label:"Review 2026 & plan 2027",date:"Dec 15–31",detail:"Note thin areas; plan targeted overseeding for fall 2027"}],products:[]},
 ],
 2027:[
  {month:"January",season:"Winter",icon:"❄️",notes:"Use extension lab or Luster Leaf Rapitest for pH, N, P, K, organic matter.",tasks:[{id:"27-0-0",type:"soil",label:"Soil test (year 2)",date:"Jan 10–20",detail:"Test every other year. Results calibrate 2027 program"},{id:"27-0-1",type:"plan",label:"Review 2026 results",date:"Jan 5–15",detail:"Note thin areas — plan 2027 targeted overseeding"}],products:[]},
  {month:"February",season:"Winter",icon:"🌬️",notes:"Watch for forsythia bloom — crabgrass window opens soon after.",tasks:[{id:"27-1-0",type:"lime",label:"Lime if needed",date:"Feb 1–20",detail:"Based on 2027 soil test. Target pH 6.0–6.5"},{id:"27-1-1",type:"prep",label:"Order pre-emergent supplies",date:"Feb 15–28",detail:"Barricade/prodiamine for split-app; GrubEx sells out in spring"}],products:[{name:"Pennington Fast Acting Lime",type:"Lime",rate:"40 lbs/1,000 sq ft if needed",notes:"Based on soil test"}]},
  {month:"March",season:"Early Spring",icon:"🌱",notes:"If thin patches remain from 2026, skip pre-emergent there and overseed instead.",tasks:[{id:"27-2-0",type:"pre",label:"Pre-emergent Round 1",date:"Mar 10–20",detail:"Same 50–55°F trigger. Year-2 lawn is denser — same protocol"},{id:"27-2-1",type:"fert",label:"Optional light spring feed",date:"Mar 20–31",detail:"0.5 lb N/1,000 sq ft only. Denser turf needs less early push"},{id:"27-2-2",type:"mow",label:"Resume mowing at 3.5–4\"",date:"Mar 20–31",detail:"Bag first cuts to remove debris and Poa annua seed heads"}],products:[{name:"Andersons Barricade 0.38% Prodiamine",type:"Pre-Emergent",rate:"3.2 lbs/1,000 sq ft",notes:"Preferred; longer residual"},{name:"Espoma Organic Lawn Booster",type:"Fertilizer",rate:"Per label",notes:"Rotate organic years to build soil biology"}]},
  {month:"April",season:"Spring",icon:"🌼",notes:"Year 2 turf is denser — expect noticeably lighter weed pressure.",tasks:[{id:"27-3-0",type:"post",label:"Broadleaf weed control",date:"Apr 5–20",detail:"Treat remaining weeds before they flower"},{id:"27-3-1",type:"fert",label:"Spring fertilizer",date:"Apr 10–25",detail:"0.75–1 lb N/1,000 sq ft slow-release"},{id:"27-3-2",type:"dethatch",label:"Dethatch if thatch >0.5\"",date:"Apr 1–15",detail:"Check with a knife. Dethatch before fertilizing if needed"}],products:[{name:"PBI Gordon T-Zone SE",type:"Post-Emergent",rate:"0.75 oz/gallon",notes:"Best for wild violet and ground ivy"},{name:"Milorganite 6-4-0",type:"Organic Fertilizer",rate:"32 lbs/2,500 sq ft",notes:"Safe, organic, slow-release"}]},
  {month:"May",season:"Late Spring",icon:"🌿",notes:"Denser year-2 turf crowds out weeds naturally. Trust the program.",tasks:[{id:"27-4-0",type:"pre",label:"Pre-emergent Round 2",date:"May 10–20",detail:"Half-rate 8–10 weeks after March app"},{id:"27-4-1",type:"grub",label:"Preventive grub control",date:"May 15–31",detail:"Annual application before June beetle egg hatch"},{id:"27-4-2",type:"mow",label:"Raise deck to 4\"",date:"May 1–10",detail:"Skip fert if lawn looks dense — let roots work"}],products:[{name:"Scotts GrubEx Season-Long Grub Killer",type:"Grub Control",rate:"2.87 lbs/1,000 sq ft",notes:"Water in within 24 hrs"},{name:"Andersons Barricade (half-rate)",type:"Pre-Emergent",rate:"1.6 lbs/1,000 sq ft",notes:"Half rate of March application"}]},
  {month:"June",season:"Summer",icon:"☀️",notes:"Rotate fungicide actives year over year to prevent resistance.",tasks:[{id:"27-5-0",type:"water",label:"Begin irrigation program",date:"Jun 1–7",detail:"1–1.5\" per week, early morning"},{id:"27-5-1",type:"fungicide",label:"Preventive fungicide",date:"Jun 10–20",detail:"If 2026 had brown patch in same areas, go preventive this year"},{id:"27-5-2",type:"mow",label:"Mow high & sharp",date:"Jun 1–30",detail:"4\" for fescue. Sharpen blade mid-season if needed"}],products:[{name:"Headway G Fungicide",type:"Fungicide",rate:"3 lbs/1,000 sq ft",notes:"Dual-mode granular; excellent brown patch & dollar spot prevention"}]},
  {month:"July",season:"Summer",icon:"🔥",notes:"July = maintenance only. No experiments in summer heat.",tasks:[{id:"27-6-0",type:"water",label:"Maintain deep watering",date:"Jul 1–31",detail:"Full dormancy > partial — go all-in or none"},{id:"27-6-1",type:"scout",label:"Scout for armyworms",date:"Jul 1–31",detail:"Armyworms devour a lawn in 3–4 days. Birds pecking = warning sign"}],products:[{name:"Bifen LP Granules (bifenthrin)",type:"Insecticide",rate:"Per label",notes:"Armyworms, chinch bugs, sod webworms"}]},
  {month:"August",season:"Late Summer",icon:"🌤️",notes:"Book aerator rentals now — they fill up fast.",tasks:[{id:"27-7-0",type:"prep",label:"Book aeration & order seed",date:"Aug 1–15",detail:"Year 2 touch-up: order 25–30 lbs seed (1–1.5 lbs/1,000 sq ft)"},{id:"27-7-1",type:"post",label:"Nutsedge cleanup",date:"Aug 1–20",detail:"2–3 treatments, 3 weeks apart for full suppression"}],products:[{name:"Ortho Nutsedge Killer",type:"Post-Emergent",rate:"Per label",notes:"3 treatments for full suppression"}]},
  {month:"September",season:"Early Fall 🔑",icon:"🍂",notes:"Year 2: same aerate → seed → starter fert ritual. Lawn should visibly thicken.",tasks:[{id:"27-8-0",type:"aerate",label:"Core aeration",date:"Sep 5–15",detail:"Annual event. Year 2 still benefits greatly"},{id:"27-8-1",type:"overseed",label:"Touch-up overseeding",date:"Sep 5–15",detail:"1–1.5 lbs/1,000 sq ft — focus on thin areas. ~22–32 lbs total"},{id:"27-8-2",type:"fert",label:"Starter fertilizer",date:"Sep 5–15",detail:"Same magic trio: aerate → seed → starter fert"},{id:"27-8-3",type:"water",label:"Germination watering",date:"Sep 5–25",detail:"2x daily until germination (7–14 days), then taper"}],products:[{name:"Jonathan Green Black Beauty Ultra",type:"Grass Seed",rate:"1–1.5 lbs/1,000 sq ft",notes:"Touch-up rate — 50% less than year 1"},{name:"Scotts Starter Fertilizer",type:"Starter Fertilizer",rate:"3 lbs/1,000 sq ft",notes:"High phosphorus for seedling roots"}]},
  {month:"October",season:"Fall",icon:"🍁",notes:"October is second only to September. Do not skip the fall feed.",tasks:[{id:"27-9-0",type:"fert",label:"Fall nitrogen feed",date:"Oct 5–15",detail:"1 lb N/1,000 sq ft high-K for root hardening"},{id:"27-9-1",type:"post",label:"Fall broadleaf spray",date:"Oct 10–25",detail:"Best time all year — systemic herbicide goes straight to roots"},{id:"27-9-2",type:"mow",label:"Lower height gradually",date:"Oct 15–31",detail:"From 4\" to 3\" over last 3 cuts. Bag all leaf debris"}],products:[{name:"Scotts Turf Builder WinterGuard 32-0-10",type:"Fertilizer",rate:"Per label",notes:"High K for winter prep"},{name:"PBI Gordon SpeedZone",type:"Post-Emergent",rate:"Per label",notes:"Fast results on stubborn perennial weeds"}]},
  {month:"November",season:"Late Fall",icon:"🍃",notes:"Store all liquid chemicals above freezing.",tasks:[{id:"27-10-0",type:"pre",label:"Poa annua pre-emergent",date:"Nov 1–10",detail:"Low-rate prodiamine. Skip if overseeding after Sept 20"},{id:"27-10-1",type:"mow",label:"Final mow at 3\"",date:"Nov 15–30",detail:"Bag all leaf cleanup. Clean lawn going into winter"},{id:"27-10-2",type:"prep",label:"Winterize irrigation",date:"Nov 1–15",detail:"Blow out system before hard freeze"}],products:[{name:"Quali-Pro Prodiamine 65 WDG",type:"Pre-Emergent",rate:"0.5 oz/1,000 sq ft",notes:"Low rate; skip if late overseeding"}]},
  {month:"December",season:"Winter",icon:"🌨️",notes:"2 full years done. Your lawn should look dramatically better. 🏡",tasks:[{id:"27-11-0",type:"prep",label:"Full equipment service",date:"Dec 1–15",detail:"Sharpen blades, change oil, fog cylinders"},{id:"27-11-1",type:"plan",label:"Review 2027 & plan 2028",date:"Dec 15–31",detail:"Plan soil biology amendments for 2028"}],products:[]},
 ]
};

// ─── SHOPPING DATA ────────────────────────────────────────────────────────────
const SHOP=[
 {id:"s0",cat:"Grub & Insect Control",icon:"🪲",name:"🚨 Ortho WeedClear Lawn Weed Killer 32 oz — BUY THIS WEEK",season:"Spring — URGENT",purpose:"Need NOW to kill bittercress before seed pods explode (spotted Apr 4)",qty:"1–2 bottles this week",priority:"Essential",stores:[{name:"Walmart",price:14,total:28,best:true,product:"Ortho WeedClear 32 oz RTU ×2"},{name:"Home Depot",price:17,total:34,product:"Ortho WeedClear 32 oz RTU ×2"},{name:"Lowes",price:16,total:32,product:"Ortho WeedClear 32 oz RTU ×2"}],note:"🚨 URGENT — hairy bittercress spotted Apr 4 in full bloom. Pods will shoot seeds 3 feet if you wait. Spray Apr 10–12 when temps hit 60°F+."},
 {id:"s_ant",cat:"Grub & Insect Control",icon:"🪲",name:"✅ Spectracide Ant Shield Insect Killer Granules 3 lb — OWNED",season:"Spring — USE THIS WEEKEND",purpose:"Treat multiple large ant mounds found Apr 4 across lawn",qty:"1 bag — use immediately",priority:"Essential",stores:[{name:"Home Depot",price:12,total:12,best:true,product:"Spectracide Ant Shield Granules 3 lb — IN YOUR POSSESSION"}],note:"✅ PURCHASED Apr 4 at Home Depot. Apply this weekend (Apr 5–6). Shake directly on each mound without disturbing. Water in lightly. Kills queen & colony."},
 {id:"s_weedfeed",cat:"Fertilizer",icon:"🌿",name:"✅ Scotts Turf Builder Weed & Feed — OWNED (1 bag)",season:"Apply Apr 15–25",purpose:"Kills clover + dandelions while feeding lawn. You own 1 bag — need 2 for full coverage",qty:"Own 1 bag (covers 12K sq ft) — need 1 more bag",priority:"Essential",stores:[{name:"Walmart",price:40,total:40,best:true,product:"Scotts Turf Builder Weed & Feed 14.29 lb"},{name:"Home Depot",price:45,total:45,product:"Scotts Turf Builder Weed & Feed"},{name:"Lowes",price:43,total:43,product:"Scotts Turf Builder Weed & Feed"}],note:"✅ YOU OWN 1 BAG — bought previously. Apply Apr 15–25 on wet grass morning. Need 1 more bag to cover full half-acre. Do NOT apply before Apr 15 (4-week wait after crabgrass preventer)."},
 {id:"s_preemerg",cat:"Pre-Emergent",icon:"🛡️",name:"✅ Scotts MAX Crabgrass Preventer — APPLIED Apr 4",season:"DONE",purpose:"Crabgrass prevention — APPLIED April 4, 2026",qty:"Applied — need 2nd bag + Barricade for May split-app",priority:"Essential",stores:[{name:"Home Depot",price:26,total:26,best:true,product:"Scotts MAX Crabgrass Preventer — APPLIED"}],note:"✅ APPLIED April 4, 2026. Water in within 24 hrs. For the May split-app buy Andersons Barricade prodiamine instead — longer residual."},
 {id:"s_grubex",cat:"Grub & Insect Control",icon:"🪲",name:"✅ Scotts GrubEx 28.7 lb — OWNED (1 bag). Need 2 more",season:"Apply May 15–31",purpose:"Preventive grub control for full half-acre — 1 bag covers 10,000 sq ft only",qty:"Own 1 bag — need 2 more bags before May",priority:"Essential",stores:[{name:"Costco",price:68,total:136,best:true,product:"Scotts GrubEx twin-pack — buy at Costco"},{name:"Walmart",price:48,total:96,product:"GrubEx 28.85 lb ×2 more bags"},{name:"Home Depot",price:52,total:104,product:"GrubEx 28.85 lb ×2 more bags"}],note:"✅ OWNED 1 BAG — bought Apr 4 at Costco. Your lawn is 21,780 sq ft = 3 bags total. Buy 2 more before May. Apply May 15–31. MUST water in within 24 hrs."},
 {id:"s_ammokill",cat:"Grub & Insect Control",icon:"🪲",name:"✅ Ammo Kill Lawn Insect Killer Granules — OWNED",season:"May 15–31",purpose:"Surface insect killer — chinch bugs, armyworms, sod webworms",qty:"1 bag at home — use May–July as needed",priority:"Recommended",stores:[{name:"Home Depot",price:20,total:20,best:true,product:"Ammo Kill Lawn Insect Killer — IN YOUR POSSESSION"}],note:"✅ YOU OWN — at home. Use May–July for surface pests. This is NOT grub control — it targets insects above ground. Use GrubEx for underground grubs."},
 {id:"s1",cat:"Pre-Emergent",icon:"🛡️",name:"Andersons Barricade 0.38% Prodiamine — for May split-app",season:"Buy before May 10",purpose:"May split-application — longer residual than Scotts pendimethalin you already used",qty:"1×50 lb bag for May split-app",priority:"Essential",stores:[{name:"DoMyOwn.com",price:65,total:65,best:true,product:"Andersons Barricade 50 lb"},{name:"Amazon",price:68,total:68,product:"Andersons Barricade 50 lb"}],note:"Buy online now — order before May 1 for delivery. Much better for the May split-app than using more Scotts pendimethalin."},
 {id:"s2",cat:"Pre-Emergent",icon:"🛡️",name:"Quali-Pro Prodiamine 65 WDG 5 lb",season:"Fall/Winter",purpose:"Low-rate Poa annua prevention in Nov",qty:"1×5 lb bag (lasts 2–3 seasons)",priority:"Recommended",stores:[{name:"DoMyOwn.com",price:58,total:58,best:true,product:"Quali-Pro Prodiamine 65 WDG 5 lb"},{name:"Amazon",price:62,total:62,product:"Quali-Pro Prodiamine 65 WDG 5 lb"}],note:"One 5 lb bag lasts 2–3 years at prevention rates. Order online — not in stores."},
 {id:"s3",cat:"Post-Emergent",icon:"💊",name:"PBI Gordon T-Zone SE 32 oz",season:"Spring/Fall",purpose:"Kills wild violet, ground ivy, clover — best broadleaf formula",qty:"2 bottles/year",priority:"Essential",stores:[{name:"DoMyOwn.com",price:40,total:80,best:true,product:"T-Zone SE 32 oz"},{name:"Amazon",price:44,total:88,product:"T-Zone SE 32 oz"}],note:"Professional-grade — best for the heavy clover infestation visible in your lawn photos."},
 {id:"s5",cat:"Post-Emergent",icon:"💊",name:"Ortho Nutsedge Killer for Lawns 24 oz",season:"Summer",purpose:"Kills yellow and purple nutsedge (halosulfuron)",qty:"2 bottles/year",priority:"Recommended",stores:[{name:"Walmart",price:17,total:34,best:true,product:"Ortho Nutsedge Killer 24 oz"},{name:"Home Depot",price:20,total:40,product:"Ortho Nutsedge Killer 24 oz"},{name:"Lowes",price:19,total:38,product:"Ortho Nutsedge Killer 24 oz"}],note:"Must treat 2–3 times, 3 weeks apart. Buy in late July."},
 {id:"s6",cat:"Fertilizer",icon:"🌿",name:"Milorganite 6-4-0 Organic Fertilizer 50 lb",season:"Spring/Summer",purpose:"Spring & summer slow-release organic feed — won't burn in heat",qty:"6 bags/year",priority:"Essential",stores:[{name:"Costco",price:27,total:162,best:true,product:"Milorganite 50 lb"},{name:"Walmart",price:30,total:180,product:"Milorganite 50 lb"},{name:"Home Depot",price:34,total:204,product:"Milorganite 50 lb"}],note:"🏆 Costco is $5–8/bag cheaper. Buy 6 bags in one trip — saves $40+ vs HD/Lowes."},
 {id:"s7",cat:"Fertilizer",icon:"🌿",name:"Scotts Turf Builder WinterGuard 32-0-10",season:"Fall — buy Sept",purpose:"Fall & winterizer fert — high K for winter root hardening",qty:"2–3 bags/year",priority:"Essential",stores:[{name:"Costco",price:38,total:76,best:true,product:"WinterGuard 44.17 lb (seasonal Sept–Oct)"},{name:"Walmart",price:40,total:80,product:"WinterGuard 32 lb"},{name:"Home Depot",price:45,total:90,product:"WinterGuard 32 lb"}],note:"Costco stocks seasonally. Check early September — sells out fast."},
 {id:"s8",cat:"Grass Seed & Starter",icon:"🌱",name:"Jonathan Green Black Beauty Ultra 50 lb — buy in August",season:"Order Aug, apply Sep",purpose:"Full overseed Sept — pure tall fescue for Zone 7. Your lawn needs major overseeding.",qty:"2 bags for half-acre (heavy bare patch coverage)",priority:"Essential",stores:[{name:"Amazon",price:130,total:260,best:true,product:"Jonathan Green Black Beauty Ultra 50 lb ×2"},{name:"Home Depot",price:138,total:276,product:"Jonathan Green Black Beauty Ultra 50 lb ×2"}],note:"Your lawn has major bare areas — buy 2 bags. Order in August before September rush."},
 {id:"s9",cat:"Grass Seed & Starter",icon:"🌱",name:"Scotts Starter Fertilizer for New Grass 36 lb",season:"Buy Aug, apply Sep",purpose:"Applied same day as overseeding — high phosphorus for seedling roots",qty:"2 bags — apply day of overseeding",priority:"Essential",stores:[{name:"Walmart",price:36,total:72,best:true,product:"Scotts Starter Fertilizer 36 lb"},{name:"Home Depot",price:42,total:84,product:"Scotts Starter Fertilizer 36 lb"}],note:"Walmart is consistently $4–8/bag cheaper than HD/Lowes."},
 {id:"s12",cat:"Fungicide",icon:"🍄",name:"Scotts DiseaseEx Lawn Fungicide 10 lb",season:"Summer — buy June",purpose:"Broad-spectrum (azoxystrobin) — brown patch, dollar spot, rust",qty:"2–3 bags/year",priority:"Recommended",stores:[{name:"Walmart",price:30,total:90,best:true,product:"Scotts DiseaseEx 10 lb"},{name:"Home Depot",price:36,total:108,product:"Scotts DiseaseEx 10 lb"}],note:"Buy in June before humid season. Walmart $5–6/bag less than HD/Lowes."},
 {id:"s13",cat:"Fungicide",icon:"🍄",name:"Eagle 20EW Myclobutanil 1.6 oz",season:"Summer — rotate with DiseaseEx",purpose:"Systemic fungicide — rotate with azoxystrobin to prevent resistance",qty:"1 bottle/year",priority:"Recommended",stores:[{name:"DoMyOwn.com",price:27,total:27,best:true,product:"Eagle 20EW 1.6 oz"},{name:"Amazon",price:30,total:30,product:"Eagle 20EW 1.6 oz"}],note:"Always alternate: use DiseaseEx one application, Eagle 20EW the next."},
 {id:"s14",cat:"Lime & Soil",icon:"🪨",name:"Pennington Fast Acting Lime 40 lb",season:"Winter/Spring",purpose:"Raises soil pH — only if soil test shows pH below 6.0",qty:"4–5 bags if severely acidic",priority:"Conditional",stores:[{name:"Walmart",price:9,total:45,best:true,product:"Pennington Fast Acting Lime 40 lb"},{name:"Home Depot",price:13,total:65,product:"Pennington Fast Acting Lime 40 lb"}],note:"Walmart best lime prices. Only apply after soil test confirms need."},
 {id:"s15",cat:"Lime & Soil",icon:"🧪",name:"Luster Leaf Rapitest 1663 Complete Soil Test Kit",season:"Year-Round",purpose:"Test pH, N, P, K before each season's amendments",qty:"1 kit lasts 2–3 years",priority:"Essential",stores:[{name:"Amazon",price:22,total:22,best:true,product:"Luster Leaf Rapitest 1663"},{name:"Home Depot",price:26,total:26,product:"Luster Leaf Rapitest 1663"}],note:"The 1663 model tests all 4 parameters. Do this before any major amendments."},
 {id:"s16",cat:"Equipment",icon:"⚙️",name:"Scotts EdgeGuard DLX Broadcast Spreader",season:"One-Time",purpose:"Spreads fertilizer, seed, GrubEx, and granular pre-emergent evenly",qty:"1 spreader",priority:"Essential",stores:[{name:"Walmart",price:52,total:52,best:true,product:"Scotts EdgeGuard DLX"},{name:"Amazon",price:58,total:58,product:"Scotts EdgeGuard DLX"},{name:"Home Depot",price:65,total:65,product:"Scotts EdgeGuard DLX"}],note:"EdgeGuard prevents product landing on beds/driveways. Needed for GrubEx in May."},
 {id:"s17",cat:"Equipment",icon:"⚙️",name:"Chapin 61800 4-Gallon Backpack Sprayer",season:"One-Time",purpose:"Apply liquid herbicides and fungicides across half-acre",qty:"1 sprayer",priority:"Essential",stores:[{name:"Amazon",price:65,total:65,best:true,product:"Chapin 61800 4-gal backpack sprayer"},{name:"Home Depot",price:75,total:75,product:"Chapin backpack sprayer 4 gal"}],note:"Essential for bittercress spray and weed control. 4-gallon covers half-acre."},
 {id:"s18",cat:"Equipment",icon:"⚙️",name:"Soil Thermometer 6\" Probe",season:"One-Time",purpose:"Monitor soil temp for pre-emergent timing (apply at 50–55°F)",qty:"1 thermometer",priority:"Essential",stores:[{name:"Amazon",price:12,total:12,best:true,product:"Atree Soil Thermometer 6\""},{name:"Home Depot",price:16,total:16,product:"Soil thermometer 6\""}],note:"Critical — would have confirmed your Apr 4 pre-emergent was still within window."},
 {id:"s19",cat:"Equipment",icon:"⚙️",name:"Rain Gauge 5\" Standard",season:"One-Time",purpose:"Track rainfall to know when to irrigate",qty:"1 gauge",priority:"Recommended",stores:[{name:"Walmart",price:6,total:6,best:true,product:"Standard 5\" rain gauge"},{name:"Home Depot",price:10,total:10,product:"Standard 5\" rain gauge"}],note:"Cheapest useful lawn tool. Tells you exactly when irrigation is needed."},
];

const SHOP_CATS=["All","Pre-Emergent","Post-Emergent","Fertilizer","Grass Seed & Starter","Grub & Insect Control","Fungicide","Lime & Soil","Equipment"];
const CAT_ORDER=["Pre-Emergent","Post-Emergent","Fertilizer","Grass Seed & Starter","Grub & Insect Control","Fungicide","Lime & Soil","Equipment"];

// ─── WEATHER TAB ──────────────────────────────────────────────────────────────
function WeatherTab({weather,loading,error}) {
  if(loading) return <div style={{textAlign:"center",padding:"40px 20px",color:"#81c784"}}><div style={{fontSize:36,marginBottom:12}}>🌤️</div><div style={{fontSize:14}}>Loading live weather for Ellicott City, MD…</div></div>;
  if(error) return <div style={{textAlign:"center",padding:"30px",color:"#ef9a9a"}}><div style={{fontSize:32,marginBottom:10}}>❌</div><div style={{fontSize:13,marginBottom:6}}>{error}</div><div style={{fontSize:11,color:"#a5d6a7"}}>Check your internet connection and refresh the page.</div></div>;
  if(!weather) return null;
  const {current,daily}=weather, ti=todayIdx(daily.time), [icon,label]=wmo(current.weather_code), advice=getLawnAdvice(current,daily);
  const fmt=d=>{const dt=new Date(d+"T12:00:00");return dt.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});};
  return (
    <div>
      <div style={{background:"linear-gradient(135deg,rgba(33,150,243,0.2),rgba(0,188,212,0.1))",border:"1px solid rgba(33,150,243,0.3)",borderRadius:16,padding:"14px 16px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:10,color:"#64b5f6",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>📍 Ellicott City, MD — Right Now <span style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:"rgba(76,175,80,0.2)",border:"1px solid rgba(76,175,80,0.5)",color:"#69f0ae",marginLeft:6}}>🟢 Live</span></div>
            <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:40}}>{icon}</span>
              <div><div style={{fontSize:34,fontWeight:"700",color:"#e8f5e9",lineHeight:1}}>{Math.round(current.temperature_2m)}°F</div>
                <div style={{fontSize:12,color:"#81c784"}}>Feels {Math.round(current.apparent_temperature)}°F · {label}</div></div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px 14px",fontSize:11,color:"#a5d6a7"}}>
            <div>💧 Humidity: <b style={{color:"#c8e6c9"}}>{current.relative_humidity_2m}%</b></div>
            <div>💨 Wind: <b style={{color:"#c8e6c9"}}>{Math.round(current.wind_speed_10m)} mph</b></div>
            <div>🌡️ High: <b style={{color:"#c8e6c9"}}>{Math.round(daily.temperature_2m_max[ti])}°F</b></div>
            <div>🌡️ Low: <b style={{color:"#c8e6c9"}}>{Math.round(daily.temperature_2m_min[ti])}°F</b></div>
            <div>☀️ UV: <b style={{color:"#c8e6c9"}}>{Math.round(current.uv_index||0)}</b></div>
            <div>🌧️ Rain: <b style={{color:"#c8e6c9"}}>{(daily.precipitation_sum[ti]||0).toFixed(2)}"</b></div>
          </div>
        </div>
      </div>
      <div style={{fontSize:11,fontWeight:"700",color:"#81c784",textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>🌱 Today's Lawn Recommendations</div>
      <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
        {advice.map((a,i)=>{const s=ST[a.status];return(
          <div key={i} style={{background:s.bg,border:`1px solid ${s.b}`,borderLeft:`4px solid ${s.dot}`,borderRadius:10,padding:"9px 12px",display:"flex",gap:9}}>
            <span style={{fontSize:18,lineHeight:1,marginTop:1}}>{a.icon}</span>
            <div><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
              <span style={{fontWeight:"700",color:"#c8e6c9",fontSize:13}}>{a.task}</span>
              <span style={{fontSize:9,padding:"1px 7px",borderRadius:20,background:s.bg,border:`1px solid ${s.dot}`,color:s.dot,fontWeight:"700"}}>{s.label}</span>
            </div><div style={{fontSize:11,color:"#a5d6a7",lineHeight:1.5}}>{a.reason}</div></div>
          </div>);})}
      </div>
      <div style={{fontSize:11,fontWeight:"700",color:"#81c784",textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>📅 10-Day Forecast</div>
      <div style={{display:"flex",overflowX:"auto",gap:6,paddingBottom:6,scrollbarWidth:"none",marginBottom:12}}>
        {daily.time.map((d,i)=>{const [wi]=wmo(daily.weather_code[i]),past=i<ti,today=i===ti,rain=(daily.precipitation_sum[i]||0).toFixed(2),rp=daily.precipitation_probability_max[i]||0;return(
          <div key={d} style={{flex:"0 0 auto",minWidth:68,background:today?"rgba(76,175,80,0.2)":past?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.05)",border:today?"1px solid rgba(76,175,80,0.5)":past?"1px dashed rgba(255,255,255,0.08)":"1px solid rgba(255,255,255,0.1)",borderRadius:11,padding:"9px 5px",textAlign:"center",opacity:past?0.55:1}}>
            <div style={{fontSize:9,color:today?"#69f0ae":"#81c784",fontWeight:today?"700":"400",marginBottom:3}}>{today?"Today":fmt(d).split(",")[0]}</div>
            <div style={{fontSize:9,color:"#a5d6a7",marginBottom:3}}>{fmt(d).split(",")[1]?.trim()}</div>
            <div style={{fontSize:20,marginBottom:4}}>{wi}</div>
            <div style={{fontSize:13,fontWeight:"700",color:"#c8e6c9"}}>{Math.round(daily.temperature_2m_max[i])}°</div>
            <div style={{fontSize:10,color:"#66bb6a"}}>{Math.round(daily.temperature_2m_min[i])}°</div>
            {parseFloat(rain)>0&&<div style={{fontSize:9,color:"#64b5f6",marginTop:3}}>{rain}"</div>}
            {rp>20&&<div style={{fontSize:9,color:"#90caf9"}}>{rp}%</div>}
          </div>);})}
      </div>
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:11,padding:"11px 13px"}}>
        <div style={{fontSize:10,color:"#81c784",fontWeight:"700",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🌧️ Precipitation Context</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,textAlign:"center"}}>
          {[{l:"Past 3 Days",v:daily.precipitation_sum.slice(0,3).reduce((a,b)=>a+b,0).toFixed(2)+'"'},{l:"Today",v:(daily.precipitation_sum[ti]||0).toFixed(2)+'"'},{l:"Next 7 Days",v:daily.precipitation_sum.slice(ti+1,ti+8).reduce((a,b)=>a+b,0).toFixed(2)+'"'}].map(x=>(
            <div key={x.l} style={{background:"rgba(33,150,243,0.1)",borderRadius:8,padding:"8px 4px"}}>
              <div style={{fontSize:15,fontWeight:"700",color:"#90caf9"}}>{x.v}</div>
              <div style={{fontSize:9,color:"#64b5f6"}}>{x.l}</div>
            </div>))}
        </div>
      </div>
    </div>
  );
}

// ─── IMAGE MODAL ──────────────────────────────────────────────────────────────
function ImageModal({task,monthName,year,onClose,onSaved,apiKey}) {
  const [step,setStep]=useState("upload");const [preview,setPreview]=useState(null);const [imgData,setImgData]=useState(null);const [result,setResult]=useState(null);const [err,setErr]=useState(null);const fileRef=useRef();
  const handleFile=async f=>{if(!f||!f.type.startsWith("image/"))return;const d=await resizeImage(f);setPreview(d.thumb);setImgData(d);};
  const analyze=async()=>{if(!imgData)return;setStep("analyzing");setErr(null);try{const r=await analyzeLawn(imgData.full,task.label,monthName,year,apiKey);setResult(r);setStep("result");}catch(e){setErr(e.message||"Analysis failed");setStep("upload");}};
  const save=()=>{if(!result||!imgData)return;onSaved({id:Date.now().toString(),taskId:task.id,taskLabel:task.label,monthName,year,date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),thumb:imgData.thumb,analysis:result});onClose();};
  const sc3=s=>s>=8?"#4caf50":s>=6?"#8bc34a":s>=4?"#ffc107":s>=2?"#ff9800":"#f44336";
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:14}} onClick={onClose}>
      <div style={{background:"#1a2e1a",border:"1px solid rgba(76,175,80,0.4)",borderRadius:18,padding:"18px",maxWidth:400,width:"100%",maxHeight:"88vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div><div style={{fontSize:15,fontWeight:"700",color:"#c8e6c9"}}>📸 Lawn Photo Analysis</div><div style={{fontSize:10,color:"#81c784"}}>After: {task.label} · {monthName} {year}</div></div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.08)",border:"none",color:"#a5d6a7",borderRadius:20,padding:"3px 9px",cursor:"pointer",fontSize:14}}>✕</button>
        </div>
        {!apiKey&&step==="upload"&&(<div style={{background:"rgba(255,193,7,0.1)",border:"1px solid rgba(255,193,7,0.3)",borderRadius:9,padding:"10px 12px",marginBottom:12,fontSize:11,color:"#fff9c4",lineHeight:1.6}}>⚠️ AI analysis requires an Anthropic API key. Add it in Settings (⚙️ tab) to enable this feature.</div>)}
        {step==="upload"&&(<div>
          <div onClick={()=>fileRef.current.click()} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}} onDragOver={e=>e.preventDefault()} style={{border:"2px dashed rgba(76,175,80,0.4)",borderRadius:12,padding:"22px",textAlign:"center",cursor:"pointer",marginBottom:10,background:preview?"rgba(0,0,0,0.2)":"rgba(76,175,80,0.05)"}}>
            {preview?<img src={preview} alt="preview" style={{maxWidth:"100%",maxHeight:180,borderRadius:9,objectFit:"cover"}}/>:<><div style={{fontSize:34,marginBottom:7}}>📷</div><div style={{color:"#81c784",fontSize:12}}>Tap to upload or drag & drop lawn photo</div></>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])} capture="environment"/>
          {err&&<div style={{background:"rgba(244,67,54,0.1)",border:"1px solid rgba(244,67,54,0.3)",borderRadius:8,padding:"7px 11px",fontSize:11,color:"#ef9a9a",marginBottom:9}}>{err}</div>}
          {preview&&apiKey&&<button onClick={analyze} style={{width:"100%",padding:"11px",borderRadius:11,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:"700",background:"linear-gradient(135deg,#4caf50,#388e3c)",color:"#fff"}}>🤖 Analyze My Lawn with AI</button>}
        </div>)}
        {step==="analyzing"&&<div style={{textAlign:"center",padding:"28px 0"}}><div style={{fontSize:38,marginBottom:12}}>🔬</div><div style={{color:"#a5d6a7",fontSize:13}}>Analyzing your lawn…</div></div>}
        {step==="result"&&result&&(<div>
          {preview&&<img src={preview} alt="lawn" style={{width:"100%",maxHeight:170,objectFit:"cover",borderRadius:9,marginBottom:12}}/>}
          <div style={{background:"rgba(0,0,0,0.3)",borderRadius:12,padding:"12px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
            <div style={{textAlign:"center",flexShrink:0}}><div style={{fontSize:34,fontWeight:"700",color:sc3(result.score),lineHeight:1}}>{result.score}</div><div style={{fontSize:9,color:"#66bb6a"}}>/10</div></div>
            <div style={{flex:1}}><div style={{display:"flex",gap:6,marginBottom:5,flexWrap:"wrap"}}>
              <span style={{fontSize:13,fontWeight:"700",color:GC[result.grade]||"#81c784"}}>Grade: {result.grade}</span>
              <span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"rgba(255,255,255,0.1)",color:"#c8e6c9"}}>{result.condition}</span>
            </div><div style={{fontSize:11,color:"#a5d6a7",lineHeight:1.5}}>{result.summary}</div></div>
          </div>
          {result.positives?.length>0&&<div style={{marginBottom:8}}><div style={{fontSize:10,color:"#4caf50",fontWeight:"700",textTransform:"uppercase",marginBottom:4}}>✅ Looking Good</div>{result.positives.map((p,i)=><div key={i} style={{fontSize:11,color:"#a5d6a7",padding:"2px 0"}}>• {p}</div>)}</div>}
          {result.issues?.length>0&&<div style={{marginBottom:8}}><div style={{fontSize:10,color:"#ff9800",fontWeight:"700",textTransform:"uppercase",marginBottom:4}}>⚠️ Issues</div>{result.issues.map((p,i)=><div key={i} style={{fontSize:11,color:"#ffcc80",padding:"2px 0"}}>• {p}</div>)}</div>}
          {result.nextSteps?.length>0&&<div style={{marginBottom:12}}><div style={{fontSize:10,color:"#2196f3",fontWeight:"700",textTransform:"uppercase",marginBottom:4}}>🎯 Next Steps</div>{result.nextSteps.map((p,i)=><div key={i} style={{fontSize:11,color:"#90caf9",padding:"2px 0"}}>• {p}</div>)}</div>}
          <button onClick={save} style={{width:"100%",padding:"11px",borderRadius:11,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:"700",background:"linear-gradient(135deg,#4caf50,#388e3c)",color:"#fff"}}>💾 Save to Lawn Journal</button>
        </div>)}
      </div>
    </div>
  );
}

// ─── JOURNAL TAB ──────────────────────────────────────────────────────────────
function JournalTab({journal,onAnalyzeNew,onDelete}) {
  const sc3=s=>s>=8?"#4caf50":s>=6?"#8bc34a":s>=4?"#ffc107":s>=2?"#ff9800":"#f44336";
  return(<div>
    <button onClick={onAnalyzeNew} style={{width:"100%",padding:"12px",borderRadius:11,border:"1px dashed rgba(76,175,80,0.4)",background:"rgba(76,175,80,0.07)",color:"#81c784",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:"700",marginBottom:12}}>📸 Analyze Any Lawn Photo</button>
    {journal.length===0?(<div style={{textAlign:"center",padding:"40px 20px",color:"#4a6b4a"}}><div style={{fontSize:34,marginBottom:9}}>🌿</div><div style={{fontSize:12}}>No lawn photos yet. Complete a task and tap 📸 to analyze your lawn.</div></div>):(
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {[...journal].reverse().map(entry=>(
          <div key={entry.id} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(76,175,80,0.2)",borderRadius:13,overflow:"hidden"}}>
            <div style={{display:"flex"}}>
              {entry.thumb&&<img src={entry.thumb} alt="lawn" style={{width:88,minHeight:88,objectFit:"cover",flexShrink:0}}/>}
              <div style={{flex:1,padding:"9px 11px"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:5}}>
                  <div><div style={{fontSize:11,fontWeight:"700",color:"#c8e6c9"}}>{entry.taskLabel}</div><div style={{fontSize:9,color:"#66bb6a"}}>{entry.monthName} {entry.year} · {entry.date}</div></div>
                  <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:17,fontWeight:"700",color:sc3(entry.analysis.score)}}>{entry.analysis.score}/10</div><div style={{fontSize:9,color:GC[entry.analysis.grade]||"#81c784"}}>{entry.analysis.grade}</div></div>
                </div>
                <div style={{fontSize:10,color:"#a5d6a7",marginTop:4,lineHeight:1.4}}>{entry.analysis.summary}</div>
              </div>
            </div>
            <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",padding:"4px 11px",display:"flex",justifyContent:"flex-end"}}>
              <button onClick={()=>onDelete(entry.id)} style={{background:"none",border:"none",color:"#4a6b4a",cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>🗑 Remove</button>
            </div>
          </div>))}
      </div>)}
  </div>);
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab({apiKey,setApiKey}) {
  const [inputKey,setInputKey]=useState(apiKey||"");
  const [saved,setSaved]=useState(false);
  const save=()=>{setApiKey(inputKey.trim());storage.set("lp-apikey",inputKey.trim());setSaved(true);setTimeout(()=>setSaved(false),2500);};
  return(<div>
    <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(76,175,80,0.2)",borderRadius:14,padding:"16px",marginBottom:12}}>
      <div style={{fontSize:13,fontWeight:"700",color:"#c8e6c9",marginBottom:4}}>🤖 AI Lawn Analysis</div>
      <div style={{fontSize:11,color:"#a5d6a7",marginBottom:12,lineHeight:1.6}}>
        AI photo analysis uses the Anthropic Claude API. It costs ~$0.01 per analysis.
        You need your own API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{color:"#64b5f6"}}>console.anthropic.com</a>. Without a key, weather + planner + shopping list all still work fine.
      </div>
      <div style={{fontSize:11,color:"#81c784",marginBottom:6,fontWeight:"700"}}>Anthropic API Key</div>
      <input
        type="password"
        value={inputKey}
        onChange={e=>setInputKey(e.target.value)}
        placeholder="sk-ant-..."
        style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1px solid rgba(76,175,80,0.3)",background:"rgba(0,0,0,0.3)",color:"#c8e6c9",fontFamily:"monospace",fontSize:12,marginBottom:9,boxSizing:"border-box"}}
      />
      <button onClick={save} style={{padding:"9px 20px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:"700",background:saved?"linear-gradient(135deg,#388e3c,#2e7d32)":"linear-gradient(135deg,#4caf50,#388e3c)",color:"#fff",transition:"all 0.2s"}}>
        {saved?"✅ Saved!":"Save API Key"}
      </button>
      {apiKey&&<span style={{fontSize:11,color:"#69f0ae",marginLeft:10}}>✓ Key active — AI analysis enabled</span>}
    </div>
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"14px"}}>
      <div style={{fontSize:12,fontWeight:"700",color:"#c8e6c9",marginBottom:8}}>📍 App Info</div>
      <div style={{fontSize:11,color:"#a5d6a7",lineHeight:1.8}}>
        <div>📍 Location: Ellicott City, MD (USDA Zone 7)</div>
        <div>🌿 Grass type: Tall Fescue / Cool-Season</div>
        <div>📐 Lawn size: ½ Acre (21,780 sq ft)</div>
        <div>🌤️ Weather: Open-Meteo (free, live, no key needed)</div>
        <div>💾 Data saved: browser localStorage (per-device)</div>
      </div>
    </div>
  </div>);
}

// ─── SHOPPING TAB ─────────────────────────────────────────────────────────────
function ShoppingTab({bought,setBought}) {
  const [catF,setCatF]=useState("All"),[storeF,setStoreF]=useState("All Stores"),[search,setSearch]=useState(""),[expandedId,setExpandedId]=useState(null);
  const STORES=["All Stores","Costco","Home Depot","Lowes","Walmart","Amazon","DoMyOwn.com","SiteOne","Ace Hardware"];
  const toggle=(id,e)=>{e&&e.stopPropagation();setBought(p=>({...p,[id]:!p[id]}));};
  const bestOf=item=>item.stores.find(s=>s.best&&s.price!=null)||item.stores[0];
  const matchStore=(item,sf)=>sf==="All Stores"||item.stores.some(s=>s.name===sf&&s.price!=null);
  const filtered=SHOP.filter(it=>(catF==="All"||it.cat===catF)&&matchStore(it,storeF)&&(!search||it.name.toLowerCase().includes(search.toLowerCase())));
  const totalLeft=SHOP.filter(i=>!bought[i.id]).reduce((s,i)=>{const b=bestOf(i);return s+(b?.total||0);},0);
  const boughtN=SHOP.filter(i=>bought[i.id]).length;
  const grouped={};filtered.forEach(it=>{if(!grouped[it.cat])grouped[it.cat]=[];grouped[it.cat].push(it);});
  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
      {[{l:"Total",v:SHOP.length,c:"#9fa8da"},{l:"Purchased",v:boughtN,c:"#69f0ae"},{l:"Remaining",v:SHOP.length-boughtN,c:"#ff8a65"},{l:"Budget Left",v:`~$${totalLeft.toLocaleString()}`,c:"#ffcc02"}].map(x=>(
        <div key={x.l} style={{background:"rgba(255,255,255,0.05)",borderRadius:9,padding:"7px 5px",textAlign:"center",border:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{fontSize:13,fontWeight:"700",color:x.c}}>{x.v}</div><div style={{fontSize:9,color:"#7986cb"}}>{x.l}</div>
        </div>))}
    </div>
    <div style={{background:"rgba(0,0,0,0.25)",borderRadius:20,height:6,overflow:"hidden",marginBottom:10}}>
      <div style={{height:"100%",borderRadius:20,width:`${SHOP.length>0?Math.round(boughtN/SHOP.length*100):0}%`,background:"linear-gradient(90deg,#3f51b5,#7c83d3)",transition:"width 0.4s"}}/>
    </div>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search products…" style={{width:"100%",padding:"8px 11px",borderRadius:9,border:"1px solid rgba(63,81,181,0.35)",background:"rgba(255,255,255,0.06)",color:"#c5cae9",fontFamily:"inherit",fontSize:12,marginBottom:9,boxSizing:"border-box"}}/>
    <div style={{display:"flex",overflowX:"auto",gap:4,marginBottom:9,scrollbarWidth:"none"}}>
      {STORES.map(s=><button key={s} onClick={()=>setStoreF(s)} style={{flex:"0 0 auto",padding:"4px 9px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:9,fontWeight:"700",background:storeF===s?(sc2(s)||"#3f51b5"):"rgba(255,255,255,0.06)",color:storeF===s?"#fff":"#9fa8da",whiteSpace:"nowrap"}}>{s}</button>)}
    </div>
    <div style={{display:"flex",overflowX:"auto",gap:4,marginBottom:12,scrollbarWidth:"none"}}>
      {SHOP_CATS.map(c=><button key={c} onClick={()=>setCatF(c)} style={{flex:"0 0 auto",padding:"4px 9px",borderRadius:8,border:catF===c?"1px solid rgba(63,81,181,0.7)":"1px solid rgba(63,81,181,0.2)",cursor:"pointer",fontFamily:"inherit",fontSize:9,fontWeight:"700",background:catF===c?"rgba(63,81,181,0.25)":"rgba(255,255,255,0.03)",color:catF===c?"#c5cae9":"#7986cb",whiteSpace:"nowrap"}}>{c}</button>)}
    </div>
    {CAT_ORDER.filter(cat=>grouped[cat]?.length>0).map(cat=>(
      <div key={cat} style={{marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7,borderBottom:"1px solid rgba(63,81,181,0.2)",paddingBottom:5}}>
          <span style={{fontSize:13}}>{SHOP.find(i=>i.cat===cat)?.icon||"📦"}</span>
          <span style={{fontSize:11,fontWeight:"700",color:"#9fa8da",textTransform:"uppercase",letterSpacing:1}}>{cat}</span>
          <span style={{fontSize:9,color:"#5c6bc0",marginLeft:"auto"}}>{grouped[cat].filter(i=>bought[i.id]).length}/{grouped[cat].length} done</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {grouped[cat].map(item=>{
            const best=bestOf(item),done=!!bought[item.id],exp=expandedId===item.id,p=PC[item.priority]||PC.Optional;
            const storeSpecific=storeF!=="All Stores"?item.stores.find(s=>s.name===storeF):null;
            return(<div key={item.id} style={{background:done?"rgba(76,175,80,0.06)":"rgba(255,255,255,0.04)",border:done?"1px solid rgba(76,175,80,0.35)":`1px solid ${p.b}30`,borderLeft:`4px solid ${done?"#4caf50":p.b}`,borderRadius:10,overflow:"hidden",transition:"all 0.2s"}}>
              <div style={{padding:"10px 12px",display:"flex",alignItems:"flex-start",gap:9,cursor:"pointer"}} onClick={()=>setExpandedId(exp?null:item.id)}>
                <div onClick={e=>toggle(item.id,e)} style={{width:20,height:20,borderRadius:4,flexShrink:0,marginTop:1,border:`2px solid ${done?"#4caf50":p.b}`,background:done?"#4caf50":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s"}}>
                  {done&&<span style={{color:"#fff",fontSize:11,fontWeight:"900"}}>✓</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:5,marginBottom:3,flexWrap:"wrap"}}>
                    <span style={{fontWeight:"700",color:done?"#66bb6a":"#c5cae9",fontSize:12,textDecoration:done?"line-through":"none",flex:1,minWidth:0}}>{item.name}</span>
                    <span style={{fontSize:8,padding:"2px 6px",borderRadius:20,fontWeight:"700",background:p.bg,color:p.t,border:`1px solid ${p.b}`,whiteSpace:"nowrap",flexShrink:0}}>{item.priority}</span>
                  </div>
                  <div style={{fontSize:10,color:done?"#4a7c5c":"#9fa8da",marginBottom:5,lineHeight:1.4,textDecoration:done?"line-through":"none"}}>{item.purpose}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    {storeSpecific?(
                      <span style={{fontSize:10,padding:"2px 7px",borderRadius:7,background:`${sc2(storeSpecific.name)}22`,border:`1px solid ${sc2(storeSpecific.name)}55`,color:sc2(storeSpecific.name)}}>🏪 {storeSpecific.name}: <b>${storeSpecific.total}</b></span>
                    ):best&&(
                      <span style={{fontSize:10,padding:"2px 7px",borderRadius:7,background:`${sc2(best.name)}22`,border:`1px solid ${sc2(best.name)}55`,color:sc2(best.name),fontWeight:"700"}}>🏆 {best.name} ~${best.total}</span>
                    )}
                    <span style={{fontSize:9,color:"#5c6bc0",marginLeft:"auto"}}>{item.season}</span>
                  </div>
                </div>
                <span style={{fontSize:10,color:"#5c6bc0",flexShrink:0}}>{exp?"▲":"▼"}</span>
              </div>
              {exp&&(<div style={{borderTop:"1px solid rgba(63,81,181,0.2)",padding:"10px 12px 12px"}}>
                <div style={{background:"rgba(255,193,7,0.08)",border:"1px solid rgba(255,193,7,0.2)",borderRadius:7,padding:"6px 9px",marginBottom:9,fontSize:10,color:"#fff9c4",lineHeight:1.5}}>💡 {item.note}</div>
                <div style={{fontSize:10,color:"#9fa8da",marginBottom:9}}><b style={{color:"#c5cae9"}}>½ Acre qty:</b> {item.qty}</div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {item.stores.map((s,si)=>(
                    <div key={si} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 9px",borderRadius:8,background:s.best?"rgba(76,175,80,0.1)":"rgba(255,255,255,0.02)",border:s.best?"1px solid rgba(76,175,80,0.3)":"1px solid rgba(255,255,255,0.06)"}}>
                      <span style={{width:14}}>{s.best?"🏆":""}</span>
                      <span style={{flex:"0 0 90px",fontSize:10,fontWeight:"700",color:sc2(s.name)}}>{s.name}</span>
                      <span style={{flex:1,fontSize:10,color:"#9fa8da",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.product}</span>
                      {s.price!=null?<div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:11,fontWeight:"700",color:s.best?"#69f0ae":"#c5cae9"}}>${s.total}</div><div style={{fontSize:8,color:"#5c6bc0"}}>${s.price}/{s.per||"unit"}</div></div>:<span style={{fontSize:9,color:"#5c6bc0"}}>N/A</span>}
                    </div>))}
                </div>
              </div>)}
            </div>);})}
        </div>
      </div>))}
  </div>);
}

// ─── PLANNER TAB ──────────────────────────────────────────────────────────────
function PlannerTab({year,setYear,checked,setChecked,journal,setJournal,apiKey}) {
  const [activeMonth,setActiveMonth]=useState(null),[imageModal,setImageModal]=useState(null);
  const data=PLAN[year];
  const toggleCheck=(id,e)=>{e&&e.stopPropagation();setChecked(p=>({...p,[id]:!p[id]}));};
  const getMP=tasks=>{const t=tasks.length,d=tasks.filter(x=>checked[x.id]).length;return{done:d,total:t,pct:t?Math.round(d/t*100):0};};
  const getYP=()=>{let t=0,d=0;data.forEach(m=>m.tasks.forEach(x=>{t++;if(checked[x.id])d++;}));return{done:d,total:t,pct:t?Math.round(d/t*100):0};};
  const yp=getYP();
  const [showCal,setShowCal]=useState(false);
  return(<div>
    {showCal&&<CalendarModal onClose={()=>setShowCal(false)}/>}
    {imageModal&&<ImageModal task={imageModal.task} monthName={imageModal.monthName} year={imageModal.year} onClose={()=>setImageModal(null)} onSaved={e=>setJournal(p=>[...p,e])} apiKey={apiKey}/>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
      <div style={{display:"inline-flex",background:"rgba(0,0,0,0.3)",borderRadius:50,padding:3,border:"1px solid rgba(76,175,80,0.3)"}}>
        {[2026,2027].map(y=><button key={y} onClick={()=>{setYear(y);setActiveMonth(null);}} style={{padding:"6px 18px",borderRadius:50,border:"none",cursor:"pointer",fontSize:13,fontWeight:"700",fontFamily:"inherit",transition:"all 0.2s",background:year===y?"linear-gradient(135deg,#4caf50,#388e3c)":"transparent",color:year===y?"#fff":"#81c784"}}>{y}</button>)}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{fontSize:10,color:yp.pct===100?"#69f0ae":"#a5d6a7",fontWeight:"700"}}>{yp.done}/{yp.total} tasks {yp.pct===100?"✅ Complete!":`(${yp.pct}%)`}</div>
        <button onClick={()=>setShowCal(true)} style={{padding:"6px 12px",borderRadius:20,border:"1px solid rgba(76,175,80,0.45)",background:"rgba(76,175,80,0.12)",color:"#81c784",cursor:"pointer",fontFamily:"inherit",fontSize:10,fontWeight:"700",display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap",transition:"all 0.2s"}}>
          📅 Add to Calendar
        </button>
      </div>
    </div>
    <div style={{background:"rgba(0,0,0,0.25)",borderRadius:20,height:6,overflow:"hidden",marginBottom:10}}><div style={{height:"100%",borderRadius:20,width:`${yp.pct}%`,background:yp.pct===100?"linear-gradient(90deg,#69f0ae,#00e676)":"linear-gradient(90deg,#4caf50,#81c784)",transition:"width 0.4s"}}/></div>
    <div style={{display:"flex",overflowX:"auto",gap:5,marginBottom:10,scrollbarWidth:"none"}}>
      {data.map((m,i)=>{const p=getMP(m.tasks);return(
        <button key={m.month} onClick={()=>setActiveMonth(activeMonth===i?null:i)} style={{flex:"0 0 auto",padding:"6px 8px",borderRadius:10,minWidth:50,border:activeMonth===i?"2px solid #4caf50":"2px solid rgba(76,175,80,0.2)",background:activeMonth===i?"rgba(76,175,80,0.25)":p.pct===100?"rgba(76,175,80,0.1)":"rgba(255,255,255,0.04)",color:activeMonth===i?"#c8e6c9":"#81c784",cursor:"pointer",fontFamily:"inherit",fontSize:10,fontWeight:"600",textAlign:"center",transition:"all 0.2s"}}>
          <div style={{fontSize:14}}>{m.icon}</div><div>{MON[i]}</div>
          {p.total>0&&<div style={{fontSize:9,color:p.pct===100?"#69f0ae":"#66bb6a",marginTop:1}}>{p.pct===100?"✅":`${p.done}/${p.total}`}</div>}
        </button>);})}
    </div>
    {activeMonth===null?(
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(245px,1fr))",gap:8}}>
        {data.map((m,i)=>{const p=getMP(m.tasks);return(
          <div key={m.month} onClick={()=>setActiveMonth(i)} style={{background:"rgba(255,255,255,0.05)",borderRadius:12,padding:"11px",cursor:"pointer",border:p.pct===100?"1px solid rgba(105,240,174,0.4)":"1px solid rgba(76,175,80,0.2)",position:"relative",overflow:"hidden",transition:"all 0.2s"}}>
            <div style={{position:"absolute",top:0,right:0,background:"rgba(76,175,80,0.1)",borderRadius:"0 0 0 24px",padding:"5px 10px",fontSize:17}}>{m.icon}</div>
            <div style={{fontSize:14,fontWeight:"700",color:"#c8e6c9"}}>{m.month}</div>
            <div style={{fontSize:9,color:"#66bb6a",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{m.season}</div>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
              <div style={{flex:1,background:"rgba(255,255,255,0.1)",borderRadius:10,height:4}}><div style={{height:"100%",borderRadius:10,width:`${p.pct}%`,background:p.pct===100?"#69f0ae":"#4caf50",transition:"width 0.3s"}}/></div>
              <span style={{fontSize:9,color:p.pct===100?"#69f0ae":"#81c784"}}>{p.pct===100?"✅":`${p.done}/${p.total}`}</span>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
              {m.tasks.map(t=>{const tc=TC[t.type]||TC.prep,done=!!checked[t.id];return(
                <span key={t.id} style={{fontSize:9,padding:"2px 6px",borderRadius:20,fontWeight:"600",background:done?"rgba(76,175,80,0.2)":tc.bg,border:`1px solid ${done?"#4caf50":tc.b}`,color:done?"#81c784":"#333",textDecoration:done?"line-through":"none",opacity:done?0.7:1}}>{tc.icon} {t.label}</span>);})}
            </div>
          </div>);})}
      </div>
    ):(()=>{
      const m=data[activeMonth],p=getMP(m.tasks);
      return(<div>
        <button onClick={()=>setActiveMonth(null)} style={{background:"rgba(76,175,80,0.15)",border:"1px solid rgba(76,175,80,0.3)",borderRadius:8,color:"#81c784",padding:"5px 11px",cursor:"pointer",fontFamily:"inherit",fontSize:10,marginBottom:10}}>← All Months</button>
        <div style={{background:"linear-gradient(135deg,rgba(76,175,80,0.2),rgba(56,142,60,0.1))",border:"1px solid rgba(76,175,80,0.35)",borderRadius:13,padding:"12px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}><span style={{fontSize:36}}>{m.icon}</span><div><h2 style={{margin:0,fontSize:18,color:"#c8e6c9",fontWeight:"700"}}>{m.month} {year}</h2><div style={{color:"#81c784",fontSize:10}}>{m.season}</div></div></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#81c784",marginBottom:3}}><span>Progress</span><span style={{fontWeight:"700",color:p.pct===100?"#69f0ae":"#a5d6a7"}}>{p.done}/{p.total} {p.pct===100?"✅ Complete!":`(${p.pct}%)`}</span></div>
          <div style={{background:"rgba(0,0,0,0.3)",borderRadius:20,height:7}}><div style={{height:"100%",borderRadius:20,width:`${p.pct}%`,background:p.pct===100?"linear-gradient(90deg,#69f0ae,#00e676)":"linear-gradient(90deg,#4caf50,#81c784)",transition:"width 0.4s"}}/></div>
        </div>
        {m.notes&&<div style={{background:"rgba(255,193,7,0.1)",border:"1px solid rgba(255,193,7,0.3)",borderRadius:8,padding:"7px 11px",marginBottom:10,fontSize:10,color:"#fff9c4",lineHeight:1.6}}>📌 {m.notes}</div>}
        <div style={{fontSize:10,fontWeight:"700",color:"#81c784",textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>Tasks &amp; Scheduled Dates</div>
        <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
          {m.tasks.map(t=>{const tc=TC[t.type]||TC.prep,done=!!checked[t.id],hasJ=journal.some(j=>j.taskId===t.id);return(
            <div key={t.id} style={{background:done?"rgba(76,175,80,0.08)":"rgba(255,255,255,0.04)",border:done?"1px solid rgba(76,175,80,0.4)":`1px solid ${tc.b}30`,borderLeft:`4px solid ${done?"#4caf50":tc.b}`,borderRadius:10,padding:"10px 12px",transition:"all 0.2s"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:9}}>
                <div onClick={e=>toggleCheck(t.id,e)} style={{width:20,height:20,borderRadius:4,flexShrink:0,marginTop:1,border:`2px solid ${done?"#4caf50":tc.b}`,background:done?"#4caf50":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s",boxShadow:done?"0 0 5px rgba(76,175,80,0.4)":"none"}}>
                  {done&&<span style={{color:"#fff",fontSize:11,fontWeight:"900"}}>✓</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3,flexWrap:"wrap"}}>
                    <span onClick={e=>toggleCheck(t.id,e)} style={{fontWeight:"700",color:done?"#66bb6a":"#c8e6c9",fontSize:12,textDecoration:done?"line-through":"none",cursor:"pointer"}}>{tc.icon} {t.label}</span>
                    {hasJ&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:20,background:"rgba(76,175,80,0.2)",color:"#69f0ae",border:"1px solid rgba(76,175,80,0.4)"}}>📸 Analyzed</span>}
                  </div>
                  <div style={{display:"flex",gap:5,marginBottom:4,flexWrap:"wrap"}}>
                    {t.date&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:20,fontWeight:"700",background:done?"rgba(76,175,80,0.15)":"rgba(255,204,2,0.12)",color:done?"#69f0ae":"#ffcc02",border:`1px solid ${done?"rgba(76,175,80,0.35)":"rgba(255,204,2,0.3)"}`}}>📅 {t.date}</span>}
                    <span style={{fontSize:8,padding:"2px 6px",borderRadius:20,fontWeight:"600",background:`${tc.b}18`,color:tc.b,border:`1px solid ${tc.b}30`}}>{tc.label}</span>
                  </div>
                  <div style={{fontSize:10,color:done?"#557755":"#a5d6a7",lineHeight:1.55,textDecoration:done?"line-through":"none",marginBottom:6}}>{t.detail}</div>
                  <button onClick={e=>{e.stopPropagation();if(!checked[t.id])toggleCheck(t.id,null);setImageModal({task:t,monthName:m.month,year});}} style={{padding:"4px 9px",borderRadius:7,border:"1px solid rgba(76,175,80,0.35)",background:"rgba(76,175,80,0.1)",color:"#81c784",cursor:"pointer",fontFamily:"inherit",fontSize:9,fontWeight:"700",display:"inline-flex",alignItems:"center",gap:3}}>
                    📸 {done?"Re-analyze":"Mark Done + Photo"}
                  </button>
                </div>
              </div>
            </div>);})}
        </div>
        {m.products.length>0&&(<div>
          <div style={{fontSize:10,fontWeight:"700",color:"#81c784",textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>Recommended Products</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {m.products.map((p,pi)=>{
              const colors={"Pre-Emergent":"#ff9800","Post-Emergent":"#e91e63","Fertilizer":"#4caf50","Lime":"#2196f3","Fungicide":"#ffc107","Grub Control":"#ff5722","Grass Seed":"#8bc34a","Starter Fertilizer":"#66bb6a","Insecticide":"#f44336"};
              const pc=Object.entries(colors).find(([k])=>p.type.includes(k))?.[1]||"#78909c";
              return(<div key={pi} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"9px 11px",position:"relative"}}>
                <div style={{position:"absolute",top:7,right:9,fontSize:8,padding:"2px 6px",borderRadius:20,background:`${pc}20`,border:`1px solid ${pc}50`,color:pc,fontWeight:"700",textTransform:"uppercase"}}>{p.type.split("(")[0].trim()}</div>
                <div style={{fontWeight:"700",color:"#c8e6c9",fontSize:12,paddingRight:75,marginBottom:4}}>{p.name}</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <div><div style={{fontSize:8,color:"#66bb6a",textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Rate</div><div style={{fontSize:10,color:"#e8f5e9"}}>{p.rate}</div></div>
                  <div style={{flex:1,minWidth:110}}><div style={{fontSize:8,color:"#66bb6a",textTransform:"uppercase",letterSpacing:0.5,marginBottom:2}}>Notes</div><div style={{fontSize:10,color:"#a5d6a7",lineHeight:1.5}}>{p.notes}</div></div>
                </div>
              </div>);})}
          </div>
        </div>)}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:12,gap:6}}>
          <button onClick={()=>setActiveMonth(Math.max(0,activeMonth-1))} disabled={activeMonth===0} style={{flex:1,padding:"8px",borderRadius:8,background:activeMonth===0?"rgba(255,255,255,0.03)":"rgba(76,175,80,0.15)",border:"1px solid rgba(76,175,80,0.25)",color:activeMonth===0?"#4a6b4a":"#81c784",cursor:activeMonth===0?"default":"pointer",fontFamily:"inherit",fontSize:11}}>← {activeMonth>0?data[activeMonth-1].month:""}</button>
          <button onClick={()=>setActiveMonth(Math.min(11,activeMonth+1))} disabled={activeMonth===11} style={{flex:1,padding:"8px",borderRadius:8,background:activeMonth===11?"rgba(255,255,255,0.03)":"rgba(76,175,80,0.15)",border:"1px solid rgba(76,175,80,0.25)",color:activeMonth===11?"#4a6b4a":"#81c784",cursor:activeMonth===11?"default":"pointer",fontFamily:"inherit",fontSize:11}}>{activeMonth<11?data[activeMonth+1].month:""} →</button>
        </div>
      </div>);
    })()}
  </div>);
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("weather");
  const [year,setYear]=useState(2026);
  const [checked,setChecked]=useState(()=>storage.get("lp-checked")||{});
  const [journal,setJournal]=useState(()=>getInitialJournal());
  const [bought,setBought]=useState(()=>storage.get("lp-bought")||{});
  const [apiKey,setApiKey]=useState(()=>storage.get("lp-apikey")||"");
  const [weather,setWeather]=useState(null);
  const [wLoad,setWLoad]=useState(true);
  const [wErr,setWErr]=useState(null);

  useEffect(()=>{
    fetchWeather().then(setWeather).catch(e=>setWErr(e.message||"Weather unavailable")).finally(()=>setWLoad(false));
  },[]);
  useEffect(()=>{storage.set("lp-checked",checked);},[checked]);
  useEffect(()=>{storage.set("lp-journal",journal);},[journal]);
  useEffect(()=>{storage.set("lp-bought",bought);},[bought]);

  const data=PLAN[year];
  const doneTasks=data.reduce((s,m)=>s+m.tasks.filter(t=>checked[t.id]).length,0);
  const totalTasks=data.reduce((s,m)=>s+m.tasks.length,0);
  const boughtN=SHOP.filter(i=>bought[i.id]).length;

  const TABS=[
    {id:"weather",icon:"🌤️",label:"Weather"},
    {id:"planner",icon:"📋",label:`Planner (${doneTasks}/${totalTasks})`},
    {id:"journal",icon:"🌿",label:`Journal${journal.length>0?` (${journal.length})`:""}`},
    {id:"shop",icon:"🛒",label:`Shop (${boughtN}/${SHOP.length})`},
    {id:"settings",icon:"⚙️",label:"Settings"},
  ];

  return (
    <div style={{fontFamily:"'Georgia','Times New Roman',serif",background:"linear-gradient(135deg,#1a2e1a 0%,#0d1f0d 50%,#162416 100%)",minHeight:"100vh",color:"#e8f5e9"}}>
      <div style={{background:"linear-gradient(180deg,rgba(46,80,46,0.97),rgba(26,46,26,0.97))",borderBottom:"2px solid #4a7c4a",padding:"14px 14px 0"}}>
        <div style={{textAlign:"center",marginBottom:10}}>
          <div style={{fontSize:28,marginBottom:3}}>🌿</div>
          <h1 style={{fontSize:"clamp(16px,4vw,24px)",fontWeight:"700",color:"#c8e6c9",margin:"0 0 2px 0"}}>Zone 7 Lawn Care Planner</h1>
          <p style={{color:"#a5d6a7",fontSize:10,margin:0}}>½ Acre · Tall Fescue · Ellicott City, MD · 2026–2027</p>
        </div>
        <div style={{display:"flex",borderTop:"1px solid rgba(76,175,80,0.2)"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"9px 2px",border:"none",background:"transparent",cursor:"pointer",fontFamily:"inherit",fontSize:"clamp(8px,1.8vw,10px)",fontWeight:"700",color:tab===t.id?"#69f0ae":"#66bb6a",borderBottom:tab===t.id?"2px solid #69f0ae":"2px solid transparent",transition:"all 0.2s",whiteSpace:"nowrap"}}>
              {t.icon} {t.label}
            </button>))}
        </div>
      </div>
      <div style={{padding:"11px"}}>
        {tab==="weather"&&<WeatherTab weather={weather} loading={wLoad} error={wErr}/>}
        {tab==="planner"&&<PlannerTab year={year} setYear={setYear} checked={checked} setChecked={setChecked} journal={journal} setJournal={setJournal} apiKey={apiKey}/>}
        {tab==="journal"&&<JournalTab journal={journal} onAnalyzeNew={()=>{setTab("planner");}} onDelete={id=>setJournal(p=>p.filter(e=>e.id!==id))}/>}
        {tab==="shop"&&<ShoppingTab bought={bought} setBought={setBought}/>}
        {tab==="settings"&&<SettingsTab apiKey={apiKey} setApiKey={setApiKey}/>}
        <div style={{marginTop:10,fontSize:8,color:"#3d5c3d",textAlign:"center",lineHeight:1.5}}>
          Weather via Open-Meteo (live) · AI analysis via Anthropic · Prices approximate 2025–2026 · Zone 7, Ellicott City MD
        </div>
      </div>
    </div>
  );
}
