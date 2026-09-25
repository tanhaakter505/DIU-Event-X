(function(){
'use strict';
/* ================= helpers ================= */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=s=>{s=String(s||'').trim();return /^https?:\/\/[^\s"'<>]+$/i.test(s)?s:'';};
const plural=(n,w,p)=>n+' '+(n===1?w:(p||w+'s'));
const rand=n=>{const a=new Uint8Array(n);try{crypto.getRandomValues(a);}catch(e){for(let i=0;i<n;i++)a[i]=Math.floor(Math.random()*256);}return [...a].map(b=>b.toString(16).padStart(2,'0')).join('');};

/* ================= storage (works even if browser storage is blocked) ================= */
const KEY='diu-eventx-demo-v1';
const mem={};
const ls={
  get(k){try{const v=localStorage.getItem(k);if(v!==null)return v;}catch(e){}return k in mem?mem[k]:null;},
  set(k,v){mem[k]=v;try{localStorage.setItem(k,v);}catch(e){}},
  del(k){delete mem[k];try{localStorage.removeItem(k);}catch(e){}}
};
const ss={
  get(k){try{const v=sessionStorage.getItem(k);if(v!==null)return v;}catch(e){}return ('s:'+k) in mem?mem['s:'+k]:null;},
  set(k,v){mem['s:'+k]=v;try{sessionStorage.setItem(k,v);}catch(e){}},
  del(k){delete mem['s:'+k];try{sessionStorage.removeItem(k);}catch(e){}}
};

/* ================= passwords (salted SHA-256; demo-grade, see notes in footer) ================= */
async function sha256hex(str){
  if(window.crypto&&crypto.subtle){
    const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  let h1=0xdeadbeef,h2=0x41c6ce57;
  for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677);}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return 'f'+(4294967296*(2097151&h2)+(h1>>>0)).toString(16);
}
async function hashPw(pw,salt){salt=salt||rand(8);return salt+':'+await sha256hex(salt+':'+pw);}
async function checkPw(pw,stored){const salt=String(stored).split(':')[0];return (await hashPw(pw,salt))===stored;}

/* ================= dates ================= */
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>ymd(new Date());
const addDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return ymd(d);};
const parseYmd=s=>{const p=String(s).split('-').map(Number);return new Date(p[0],p[1]-1,p[2]);};
const daysBetween=(a,b)=>Math.round((parseYmd(b)-parseYmd(a))/86400000);
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const fmtDate=s=>{const d=parseYmd(s);return DOW[d.getDay()]+', '+d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear();};
const fmtShort=s=>{const d=parseYmd(s);return d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear();};
const fmtTime=t=>{if(!t)return 'Time to be announced';const p=t.split(':').map(Number);return (((p[0]+11)%12)+1)+':'+pad(p[1])+' '+(p[0]>=12?'PM':'AM');};
const fmtStamp=iso=>{const d=new Date(iso);return d.getDate()+' '+MON[d.getMonth()]+', '+(((d.getHours()+11)%12)+1)+':'+pad(d.getMinutes())+' '+(d.getHours()>=12?'PM':'AM');};

/* ================= icons ================= */
const ICON={
calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
pin:'<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
search:'<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
bookmark:'<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
grid:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
check:'<path d="M20 6L9 17l-5-5"/>',
checkc:'<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="M22 4L12 14l-3-3"/>',
x:'<path d="M18 6L6 18M6 6l12 12"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
trash:'<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
clip:'<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
news:'<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>',
chart:'<path d="M18 20V10M12 20V4M6 20v-6"/>',
logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
ext:'<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>',
menu:'<path d="M3 12h18M3 6h18M3 18h18"/>',
heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
mic:'<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>',
trophy:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
mail:'<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M22 6l-10 7L2 6"/>',
lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
eyeoff:'<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/>',
chevd:'<path d="M6 9l6 6 6-6"/>',
arrowr:'<path d="M5 12h14M12 5l7 7-7 7"/>',
home:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
userplus:'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>',
percent:'<path d="M19 5L5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
back:'<path d="M19 12H5M12 19l-7-7 7-7"/>'
};
const ic=(n,s)=>{s=s||18;return '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICON[n]||'')+'</svg>';};
const LOGO='<img class="logo" src="./diulogo.jpeg" alt="DIU LOGO">';
const brandText='<span class="bw"><b>DIU <em>EVENT-X</em></b><small>Discover \u2022 Participate \u2022 Grow</small></span>';
const MARK=LOGO;

/* ================= database (browser only) ================= */
let db=null;
const save=()=>ls.set(KEY,JSON.stringify(db));
const nid=t=>(db.seq[t]=(db.seq[t]||0)+1);
const cat=id=>db.cats.find(c=>c.id===id);
const dept=id=>db.depts.find(d=>d.id===id);
const user=id=>db.users.find(u=>u.id===id);
const evt=id=>db.events.find(e=>e.id===id);
const stu=uid=>db.students.find(s=>s.user_id===uid);
const pref=uid=>db.prefs.find(p=>p.user_id===uid);
const catName=id=>(cat(id)||{}).name||'';
const deptName=id=>id?((dept(id)||{}).name||''):'All departments';
const CATCOLOR={'Event':'#3B6FE0','Seminar':'#8B5CF6','Workshop':'#E07A1F','Volunteer':'#17A673','Competition':'#D9425F','News':'#6B7A90','External Opportunity':'#0E9AA7'};
const catColor=id=>CATCOLOR[catName(id)]||'#6B7A90';

function notify(uid,title,message){db.notes.push({id:nid('notes'),user_id:uid,title,message,read:false,at:new Date().toISOString()});}
const unread=uid=>db.notes.filter(n=>n.user_id===uid&&!n.read).length;

async function seed(){
  const pw=await hashPw('password');
  const d={v:1,seq:{},depts:[],cats:[],users:[],students:[],prefs:[],events:[],regs:[],vols:[],saved:[],subs:[],news:[],notes:[],otps:[]};
  const id=t=>(d.seq[t]=(d.seq[t]||0)+1);
  const at=h=>new Date(Date.now()-h*3600e3).toISOString();
  ['CSE','SWE','EEE','BBA','Civil','Pharmacy','English','Law','Architecture'].forEach((n,i)=>d.depts.push({id:i+1,name:n}));
  ['Event','Seminar','Workshop','Volunteer','Competition','News','External Opportunity'].forEach((n,i)=>d.cats.push({id:i+1,name:n}));
  const addUser=(name,email,role,sid,dep,interests,catId,status)=>{
    const uid=id('users');
    d.users.push({id:uid,name,email,pw,role,status:status||'active',created:at(300+uid*20)});
    if(role==='student'){d.students.push({user_id:uid,student_id:sid});d.prefs.push({user_id:uid,department_id:dep||null,interests:interests||'',category_id:catId||null});}
    return uid;
  };
  addUser('DIU Manager','manager@diueventx.test','manager');
  addUser('DIU Admin','admin@diueventx.test','admin');
  addUser('Demo Student','student@diueventx.test','student','DEMO-001',2,'Programming, Hackathon',5);
  addUser('Ayesha Rahman','ayesha.rahman@diueventx.test','student','232-35-1187',1,'AI, Robotics',3);
  addUser('Tanvir Hasan','tanvir.hasan@diueventx.test','student','232-15-2044',4,'Startups, Public speaking',1);
  addUser('Nusrat Jahan','nusrat.jahan@diueventx.test','student','231-35-0932',7,'Writing, Volunteering',4);
  addUser('Rakib Chowdhury','rakib.chowdhury@diueventx.test','student','231-33-0418',3,'Circuits, Robotics',3,'inactive');
  const E=(title,c,dp,org,desc,off,time,loc,dl,link,type,status)=>{
    const eid=id('events');
    d.events.push({id:eid,title,category_id:c,department_id:dp,organizer:org,description:desc,date:addDays(off),time,location:loc,deadline:dl==null?'':addDays(dl),link:link||'',type:type||'diu',status:status||'published',created_by:1,created:at(200-eid*4)});
    return eid;
  };
  E('DIU Tech Innovation Hackathon',5,2,'DIU Tech Club','Build, learn and compete in a university-wide technology challenge. Teams of three to four get 24 hours to prototype a working product, with mentors from industry on hand.\n\nBring a laptop, a team and a problem worth solving.',12,'10:00','DIU Auditorium',9);
  E('Career Development Seminar',2,null,'Career Development Center','Career preparation, CV guidance and interview practice with recruiters from leading companies. Open to every department.',7,'14:00','Main Auditorium',5);
  E('Volunteer Leadership Workshop',4,null,'DIU Volunteer Team','Learn practical volunteer leadership and event coordination skills. Volunteers who complete the workshop are first in line for crew roles at upcoming DIU events.',18,'11:00','DIU Campus',14);
  E('Inter-University Programming Contest',5,1,'DIU Programming Club','A team contest with problem sets in the ICPC style. Top teams qualify for the regional round. Register your team of three by the deadline.',21,'09:00','Computer Lab Complex',14,'https://example.com/programming-contest');
  E('Bangladesh Youth Leadership Fellowship',7,null,'Partner NGO (external)','A four-month fellowship for undergraduates with mentoring, a community project and a small stipend. Applications are handled on the organizer\'s own site.',30,'','Online',25,'https://example.com/youth-fellowship','external');
  E('Startup Pitch Night',1,4,'Entrepreneurship Club','Ten student teams pitch to a panel of founders and investors. Come to watch, vote for the audience prize or register a team of your own.',15,'17:00','Seminar Hall 2',12);
  E('Circuit Design Workshop',3,3,'EEE Society','A hands-on workshop on schematic capture, PCB layout and testing. Kits are provided for the first 40 registrants.',9,'11:00','EEE Lab 3',7);
  E('Blood Donation Drive: volunteers needed',4,null,'DIU Red Crescent Youth','Help run registration, guide donors and manage refreshments during the campus blood donation drive. Two shifts available.',5,'09:30','Ground Floor Lobby',3);
  E('Research Writing Masterclass',3,7,'Department of English','Structure a research paper, write a clear abstract and handle citations. Bring a draft you are working on.',18,'15:00','Room 402',16);
  E('Legal Aid Awareness Seminar',2,8,'Law Society','Practising lawyers explain how legal aid works in Bangladesh and how students can volunteer at legal aid clinics.',26,'13:00','Room 210',22);
  E('Green Campus Design Challenge',5,9,'Department of Architecture','Propose a low-energy pavilion for the campus lawn. Submissions are judged on sustainability, buildability and drawing quality.',33,'10:00','Design Studio A',28);
  E('Pharmacy Community Health Camp',4,6,'Pharmacy Society','Volunteer to run blood pressure checks and health education stalls at a partner community clinic. Training is provided on the day.',11,'10:00','Partner Community Clinic',8);
  E('Freshers\' Orientation 2026',1,null,'Office of Student Affairs','Welcome session for new students: campus tour, club fair and a meet-and-greet with faculty.',-10,'10:00','Main Auditorium',-12);
  E('Cloud Computing Bootcamp',3,1,'DIU Tech Club','Three days of hands-on cloud labs. Waiting for final venue confirmation before it is published.',40,'10:00','To be confirmed',34,'','diu','pending');
  [['Spring Career Fair',2,-35],['Inter-Department Football',1,-52],['AI Workshop Series',3,-70],['Blood Donation Drive (Spring)',4,-93],['Cultural Night',1,-118],['Mid-Term Study Camp',3,-141],['Robotics Expo',5,-165],['Alumni Meetup',1,-190],['Debate Championship',5,-40],['Leadership Talk',2,-80],['Campus Clean-up Day',4,-100]].forEach(x=>E(x[0],x[1],null,'DIU Student Affairs','Past event kept for reporting.',x[2],'10:00','DIU Campus',x[2]-3));
  const R=(t,s,e,st,h)=>d[t].push({id:id(t),student_id:s,event_id:e,status:st,at:at(h)});
  R('regs',3,1,'approved',70);R('regs',3,7,'pending',30);R('regs',4,1,'pending',26);R('regs',4,7,'approved',60);R('regs',5,6,'approved',48);R('regs',5,2,'approved',40);R('regs',6,2,'pending',12);R('regs',3,13,'approved',300);
  R('vols',3,8,'pending',20);R('vols',6,8,'approved',44);R('vols',6,12,'pending',10);R('vols',4,3,'pending',8);
  d.saved.push({id:id('saved'),student_id:3,event_id:2,at:at(50)},{id:id('saved'),student_id:3,event_id:6,at:at(36)});
  d.subs.push(
    {id:id('subs'),submitter_id:3,event_id:null,title:'Cybersecurity Awareness Seminar',category_id:2,department_id:1,organizer:'DIU Cyber Club',description:'An introductory seminar on phishing, password hygiene and safe browsing, led by two security engineers.',date:addDays(20),time:'15:00',location:'Room 505',deadline:addDays(16),link:'',status:'pending',reviewed_by:null,note:'',at:at(5),reviewed_at:null},
    {id:id('subs'),submitter_id:4,event_id:null,title:'Photography Walk at Ashulia',category_id:1,department_id:null,organizer:'DIU Photography Society',description:'A guided photo walk with a professional photographer. Bring a phone or camera; tips on composition and light included.',date:addDays(24),time:'08:00',location:'Ashulia Lakeside',deadline:addDays(20),link:'',status:'approved',reviewed_by:2,note:'Looks good. Forwarding to the manager for publishing.',at:at(30),reviewed_at:at(18)},
    {id:id('subs'),submitter_id:5,event_id:null,title:'Weekend Coding Meetup',category_id:1,department_id:1,organizer:'Tanvir Hasan',description:'Casual meetup to code together.',date:addDays(9),time:'',location:'',deadline:'',link:'',status:'rejected',reviewed_by:2,note:'Please add a venue, a start time and a bit more detail about what will happen.',at:at(90),reviewed_at:at(80)}
  );
  d.news.push(
    {id:id('news'),title:'Welcome to DIU EVENT-X',content:'Find DIU events, seminars, competitions, volunteer opportunities and external opportunities in one place. Register for what interests you, save events for later, and post your own for approval.',status:'published',created_by:1,at:at(120)},
    {id:id('news'),title:'Volunteers wanted for the blood donation drive',content:'The DIU Red Crescent Youth team needs volunteers for two shifts. Apply from the event page and watch your applications for approval.',status:'published',created_by:2,at:at(40)},
    {id:id('news'),title:'How to get your post approved quickly',content:'Include a clear title, the venue, the start time and a registration deadline. Posts are reviewed by an admin first and then published by the manager.',status:'published',created_by:2,at:at(20)},
    {id:id('news'),title:'Draft: exam week schedule notes',content:'Internal draft, not yet published.',status:'draft',created_by:2,at:at(4)}
  );
  d.notes.push(
    {id:id('notes'),user_id:3,title:'Welcome to DIU EVENT-X',message:'Browse events, register, volunteer and save what you like.',read:true,at:at(200)},
    {id:id('notes'),user_id:3,title:'Registration approved',message:'Your registration for DIU Tech Innovation Hackathon was approved.',read:false,at:at(60)},
    {id:id('notes'),user_id:2,title:'New post to review',message:'Demo Student submitted "Cybersecurity Awareness Seminar".',read:false,at:at(5)}
  );
  return d;
}
async function loadDb(){
  try{const raw=ls.get(KEY);if(raw){const d=JSON.parse(raw);if(d&&d.v===1&&Array.isArray(d.events))return d;}}catch(e){}
  const d=await seed();ls.set(KEY,JSON.stringify(d));return d;
}

/* ================= shared ui bits ================= */
const BADGE={pending:['warn','Pending'],approved:['ok','Approved'],rejected:['bad','Rejected'],published:['ok','Published'],active:['ok','Active'],inactive:['bad','Inactive'],draft:['muted','Draft'],awaiting:['info','Awaiting publish']};
const badge=s=>{const b=BADGE[s]||['muted',s];return '<span class="badge b-'+b[0]+'">'+esc(b[1])+'</span>';};
const subState=s=>s.event_id?'published':(s.status==='approved'?'awaiting':s.status);
const upcoming=()=>db.events.filter(e=>e.status==='published'&&e.date>=today()).sort((a,b)=>(a.date+(a.time||'99')).localeCompare(b.date+(b.time||'99')));
const regOpen=e=>e.date>=today()&&(!e.deadline||e.deadline>=today());
function deadlineNote(e){
  if(!e.deadline)return '';
  const n=daysBetween(today(),e.deadline);
  if(n<0)return '<span class="closed">Registration closed</span>';
  if(n===0)return '<span class="soon">Registration closes today</span>';
  if(n===1)return '<span class="soon">Registration closes tomorrow</span>';
  return '<span class="'+(n<=3?'soon':'open')+'">Registration closes in '+n+' days</span>';
}
const chipCat=e=>'<div class="tags"><span class="chip" style="--c:'+catColor(e.category_id)+'"><i></i>'+esc(catName(e.category_id))+'</span><span class="dept">'+esc(deptName(e.department_id))+'</span></div>';
const fmtUS=s=>{const d=parseYmd(s);return MON[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear();};
const catText=id=>'color-mix(in srgb, '+catColor(id)+' 68%, var(--ink))';
const CATICON={'Event':'calendar','Seminar':'mic','Workshop':'edit','Volunteer':'users','Competition':'trophy','News':'news','External Opportunity':'globe'};
const initials=n=>n.split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase();
function ago(iso){const h=(Date.now()-new Date(iso).getTime())/3600e3;if(h<1)return 'just now';if(h<24)return Math.round(h)+(Math.round(h)===1?' hour ago':' hours ago');const d=Math.round(h/24);return d+(d===1?' day ago':' days ago');}
function cover(e,h){
  let s=(e.id*2654435761)>>>0;const r=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
  const c=catColor(e.category_id);let g='';
  for(let i=0;i<11;i++)g+='<circle cx="'+Math.round(r()*400)+'" cy="'+Math.round(r()*110)+'" r="'+Math.round(4+r()*14)+'" fill="'+(r()>.6?'#FFD98A':'#fff')+'" opacity="'+(0.10+r()*0.22).toFixed(2)+'"/>';
  let sk='';let x=-10;while(x<410){const w=24+Math.round(r()*30),hh=22+Math.round(r()*62);sk+='<rect x="'+x+'" y="'+(180-hh)+'" width="'+w+'" height="'+hh+'" fill="#061537" opacity="0.5"/>';x+=w+3;}
  const ico=CATICON[catName(e.category_id)]||'calendar';
  return '<svg class="cover" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="cv'+e.id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+c+'"/><stop offset="1" stop-color="#0A1D4B"/></linearGradient></defs><rect width="400" height="180" fill="url(#cv'+e.id+')"/>'+g+sk+'<g transform="translate(146 30) scale(4.5)" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" opacity=".32">'+(ICON[ico]||'')+'</g></svg>';
}
function cardAction(e,u){
  const isVol=catName(e.category_id)==='Volunteer';
  if(u&&u.role==='student'&&regOpen(e)){
    const reg=db.regs.some(r=>r.student_id===u.id&&r.event_id===e.id),vol=db.vols.some(r=>r.student_id===u.id&&r.event_id===e.id);
    if(isVol&&!vol)return '<button class="btn btn-outline btn-block" data-act="volunteer" data-id="'+e.id+'">Apply</button>';
    if(!isVol&&!reg)return '<button class="btn btn-outline btn-block" data-act="register" data-id="'+e.id+'">Register</button>';
  }
  return '<a class="btn btn-outline btn-block" href="#/event/'+e.id+'">Details</a>';
}
function ecard(e,why){
  return '<article class="ecard"><div class="ec-img">'+cover(e)+'<span class="ec-chip" style="--c:'+catColor(e.category_id)+'">'+esc(catName(e.category_id))+'</span></div><div class="ec-body"><h3><a class="stretch" href="#/event/'+e.id+'">'+esc(e.title)+'</a></h3>'+
  '<div class="ec-meta"><span>'+ic('calendar',15)+fmtUS(e.date)+'</span><span>'+ic('pin',15)+esc(e.location||'Venue to be announced')+'</span></div>'+
  (why?'<p class="ec-why">'+esc(why)+'</p>':(e.deadline?'<p class="ec-dl">'+deadlineNote(e)+'</p>':''))+
  '<div class="ec-foot">'+cardAction(e,me())+'</div></div></article>';
}
const table=(heads,rows,empty)=>rows.length?
  '<div class="table-wrap"><table><thead><tr>'+heads.map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map((c,i)=>(i===r.length-1&&heads[heads.length-1]==='Actions'?'<td><div class="act">'+c+'</div></td>':'<td>'+c+'</td>')).join('')+'</tr>').join('')+'</tbody></table></div>'
  :'<div class="empty"><h3>'+esc(empty||'Nothing here yet')+'</h3></div>';

function toast(msg,type){
  const box=$('#toasts');while(box.children.length>=2)box.firstChild.remove();
  const t=document.createElement('div');t.className='toast t-'+(type||'ok');t.textContent=msg;box.appendChild(t);
  setTimeout(()=>t.remove(),type==='danger'?6500:3800);
}
function openDlg(html){
  const d=$('#dlg');$('#dlgBody').innerHTML=html;d.returnValue='';
  if(!d.open){if(d.showModal)d.showModal();else d.setAttribute('open','');}
  const f=$('#dlgBody [autofocus]')||$('#dlgBody input:not([type=hidden]), #dlgBody textarea, #dlgBody select');if(f)f.focus();
}
function closeDlg(){const d=$('#dlg');if(d.open){if(d.close)d.close();else d.removeAttribute('open');}}
function confirmBox(title,msg,ok,danger){
  return new Promise(res=>{
    openDlg('<form method="dialog" class="dlg"><h2>'+esc(title)+'</h2><p>'+esc(msg)+'</p><div class="dlg-actions"><button class="btn" value="0">Cancel</button><button class="btn '+(danger?'btn-danger':'btn-primary')+'" value="1" autofocus>'+esc(ok||'Confirm')+'</button></div></form>');
    const d=$('#dlg');const h=()=>{d.removeEventListener('close',h);res(d.returnValue==='1');};d.addEventListener('close',h);
  });
}

/* ================= session + router ================= */
const me=()=>{const id=Number(ss.get('uid')||ls.get('uid'));if(!id||!db)return null;const u=user(id);return u&&u.status==='active'?u:null;};
const dashPath=r=>({student:'/student',admin:'/admin',manager:'/manager'}[r]||'/');
const catId=n=>(db.cats.find(c=>c.name===n)||{}).id||0;
const ROUTES=[];
const route=(pat,fn,roles)=>ROUTES.push({re:new RegExp('^'+pat.replace(/:(\w+)/g,'(?<$1>[^/]+)')+'$'),fn,roles});
function parseHash(){const h=(location.hash||'#/').slice(1)||'/';const i=h.indexOf('?');return {path:i<0?h:h.slice(0,i),q:new URLSearchParams(i<0?'':h.slice(i+1))};}
function go(path){if(location.hash==='#'+path)render();else location.hash='#'+path;}
const notFound=()=>'<div class="wrap"><div class="auth-card" style="margin:60px auto"><h1>Page not found</h1><p class="muted">That page does not exist or is not published.</p><a class="btn btn-primary" href="#/events">Browse events</a></div></div>';
const AUTH_PATHS=['/login','/register','/forgot','/verify','/reset'];

function render(keep){
  if(!db)return;
  const {path,q}=parseHash();const u=me();
  let out=null;
  for(const r of ROUTES){
    const m=r.re.exec(path);if(!m)continue;
    if(r.roles&&(!u||r.roles.indexOf(u.role)<0)){
      if(!u)toast('Please log in first.','danger');
      out={redirect:u?dashPath(u.role):'/login?next='+encodeURIComponent(path)};
    }else out=r.fn(m.groups||{},q,u);
    break;
  }
  if(out==null)out=notFound();
  if(out&&out.redirect){go(out.redirect);return;}
  const isApp=out.indexOf('<!--APP-->')===0;
  document.body.className=(isApp?'shell-app':'shell-public')+(path==='/'?' is-home':'')+(AUTH_PATHS.indexOf(path)>=0?' is-auth':'');
  const y=window.scrollY;
  $('#app').innerHTML=out;
  if(!isApp){renderChrome(u,path,q);renderTabbar(u,path);renderFoot();}
  if(keep)window.scrollTo(0,y);else{window.scrollTo(0,0);$('#app').focus({preventScroll:true});}
  document.title=($('#app h1')?$('#app h1').textContent.replace(/\s+/g,' ').trim()+' | ':'')+'DIU EVENT-X';
}
const brand=(cls)=>'<a class="brand '+(cls||'')+'" href="#/">'+LOGO+brandText+'</a>';
function renderChrome(u,path,q){
  const cq=+q.get('category')||0,isCat=n=>path==='/events'&&cq===catId(n);
  const items=[['/','Home',path==='/'],['/events','Events',(path==='/events'&&!cq)||path.indexOf('/event/')===0],['/events?category='+catId('Seminar'),'Seminars',isCat('Seminar')],['/events?category='+catId('Competition'),'Competitions',isCat('Competition')],['/events?category='+catId('Volunteer'),'Volunteer',isCat('Volunteer')],['/news','News',path==='/news']];
  const more=[['Workshops','/events?category='+catId('Workshop')],['External opportunities','/events?category='+catId('External Opportunity')]];
  const n=u?unread(u.id):0;
  $('#topbar').innerHTML='<div class="wrap in">'+brand()+
   '<nav class="nav" id="nav" aria-label="Main">'+items.map(x=>'<a href="#'+x[0]+'"'+(x[2]?' aria-current="page"':'')+'>'+x[1]+'</a>').join('')+
   '<details class="more d-only"><summary>More '+ic('chevd',14)+'</summary><div class="menu">'+more.map(x=>'<a href="#'+x[1]+'">'+x[0]+'</a>').join('')+'</div></details>'+
   more.map(x=>'<a class="m-only" href="#'+x[1]+'">'+x[0]+'</a>').join('')+
   (u?'<a class="m-only" href="#'+dashPath(u.role)+'">Dashboard</a><button class="m-only" data-act="logout">Log out</button>':'<a class="m-only" href="#/login">Log in</a><a class="m-only" href="#/register">Register</a>')+'</nav>'+
   '<div class="tools"><a class="icon-link" href="#/events" aria-label="Search events">'+ic('search',20)+'</a>'+(u?
     '<a class="bell" href="#/notifications" aria-label="Notifications'+(n?', '+n+' unread':'')+'">'+ic('bell',20)+(n?'<span class="n">'+n+'</span>':'')+'</a><a class="btn btn-violet btn-sm" href="#'+dashPath(u.role)+'">Dashboard</a>'
     :'<a class="btn btn-ghost-light btn-sm" href="#/login">Login</a><a class="btn btn-violet btn-sm" href="#/register">Register</a>')+'</div>'+
   '<button class="menu-btn" data-act="menu" aria-label="Menu" aria-expanded="false" aria-controls="nav">'+ic('menu',22)+'</button></div>';
}
function renderTabbar(u,path){
  const t=[['/','Home','home',path==='/'],['/events','Events','calendar',path==='/events'||path.indexOf('/event/')===0],[u&&u.role==='student'?'/student/saved':'/login','Saved','bookmark',false],['/news','News','news',path==='/news'],[u?dashPath(u.role):'/login','Profile','user',false]];
  $('#tabbar').innerHTML=t.map(x=>'<a href="#'+x[0]+'"'+(x[3]?' aria-current="page"':'')+'>'+ic(x[2],22)+'<span>'+x[1]+'</span></a>').join('');
}
function renderFoot(){
  $('#foot').innerHTML='<div class="wrap foot-in">'+brand()+'<p>Demo version: accounts and posts are saved in this browser only.</p><button type="button" data-act="reset-demo">Reset demo data</button></div>';
}

/* ================= home ================= */
function heroBg(){
  const trees=[[60,585,60],[130,600,48],[210,590,66],[300,606,50],[1330,590,58],[1420,602,72],[1510,592,54],[1580,606,46],[880,596,44],[760,606,38]].map(t=>'<circle cx="'+t[0]+'" cy="'+t[1]+'" r="'+t[2]+'" fill="#0F3B22" opacity=".92"/><circle cx="'+(t[0]+t[2]*.4)+'" cy="'+(t[1]-t[2]*.35)+'" r="'+(t[2]*.7)+'" fill="#17532F" opacity=".9"/>').join('');
  return '<svg class="hero-svg" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>'+
   '<linearGradient id="hSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A2158"/><stop offset=".45" stop-color="#2A5CB0"/><stop offset=".75" stop-color="#E8945A"/><stop offset=".9" stop-color="#F7C27A"/></linearGradient>'+
   '<linearGradient id="hGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8FB4DB"/><stop offset="1" stop-color="#3D5E86"/></linearGradient>'+
   '<linearGradient id="hGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F7D3A"/><stop offset="1" stop-color="#123C20"/></linearGradient>'+
   '<linearGradient id="hOv" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#061A45" stop-opacity=".94"/><stop offset=".5" stop-color="#061A45" stop-opacity=".62"/><stop offset="1" stop-color="#061A45" stop-opacity=".08"/></linearGradient>'+
   '<pattern id="hWin" width="24" height="28" patternUnits="userSpaceOnUse"><rect x="3" y="4" width="18" height="20" fill="#CFE2F5" opacity=".5"/><rect x="3" y="4" width="18" height="7" fill="#fff" opacity=".22"/></pattern></defs>'+
   '<rect width="1600" height="700" fill="url(#hSky)"/><ellipse cx="1250" cy="90" rx="220" ry="26" fill="#fff" opacity=".16"/><ellipse cx="520" cy="150" rx="260" ry="22" fill="#fff" opacity=".1"/><ellipse cx="1500" cy="200" rx="160" ry="18" fill="#fff" opacity=".12"/>'+
   '<rect x="760" y="270" width="200" height="330" fill="url(#hGlass)"/><rect x="760" y="270" width="200" height="330" fill="url(#hWin)"/>'+
   '<polygon points="950,150 1270,120 1270,600 950,600" fill="url(#hGlass)"/><polygon points="950,150 1270,120 1270,600 950,600" fill="url(#hWin)"/><polygon points="940,150 1280,116 1280,132 940,168" fill="#1C2F4F"/>'+
   '<rect x="1270" y="230" width="270" height="370" fill="#6F93B8"/><rect x="1270" y="230" width="270" height="370" fill="url(#hWin)"/><rect x="1270" y="222" width="270" height="14" fill="#1C2F4F"/>'+
   '<path d="M980 500 Q1180 452 1420 500 L1420 528 Q1180 486 980 528Z" fill="#B9713E"/><rect x="1000" y="528" width="10" height="72" fill="#7B4A2A"/><rect x="1400" y="528" width="10" height="72" fill="#7B4A2A"/>'+
   '<rect y="590" width="1600" height="110" fill="url(#hGrass)"/>'+trees+'<rect width="1600" height="700" fill="url(#hOv)"/></svg>';
}
route('/',vHome);
function vHome(p,q,u){
  const up=upcoming(),feat=up.slice(0,6);
  const news=db.news.filter(n=>n.status==='published').sort((a,b)=>b.at.localeCompare(a.at)).slice(0,3);
  const tiles=[['Events','/events','calendar','blue'],['Seminars','/events?category='+catId('Seminar'),'mic','violet'],['Competitions','/events?category='+catId('Competition'),'trophy','gold'],['Volunteer','/events?category='+catId('Volunteer'),'users','teal'],['News','/news','doc','violet'],['External','/events?category='+catId('External Opportunity'),'globe','blue']];
  const pubEvents=db.events.filter(e=>e.status==='published');
  const strip=[[pubEvents.length,'Events','c-blue'],[db.students.length,'Students','c-violet'],[db.depts.length,'Departments','c-teal'],[pubEvents.filter(e=>['Volunteer','External Opportunity'].indexOf(catName(e.category_id))>=0).length,'Opportunities','c-blue']];
  return '<section class="hero">'+heroBg()+'<div class="wrap hero-in">'+
   '<h1>All DIU Opportunities in One <span class="grad">Place</span></h1>'+
   '<p class="hero-sub">Find events, seminars, competitions, volunteer opportunities and news \u2014 all in one platform.</p>'+
   '<form class="hero-search" data-form="search" role="search"><span class="hs-ic">'+ic('search',20)+'</span><input name="q" type="search" placeholder="'+(window.innerWidth<600?'Search events...':'Search events, seminars, competitions...')+'" aria-label="Search events"><button class="hs-btn" aria-label="Search">'+ic('search',22)+'</button></form>'+
   '<div class="tiles">'+tiles.map(t=>'<a class="tile" href="#'+t[1]+'"><span class="tl-ic tl-'+t[3]+'">'+ic(t[2],26)+'</span>'+t[0]+'</a>').join('')+'</div>'+
   '<div class="hero-bottom"><div class="strip">'+strip.map(x=>'<div><b class="'+x[2]+'">'+x[0]+'</b><span>'+x[1]+'</span></div>').join('')+'</div>'+
   '<a class="cta-card" href="#'+(u?dashPath(u.role):'/register')+'"><span class="cc-ic">'+ic('users',24)+'</span><b>Be a part of a<br>greater community</b>'+ic('arrowr',22)+'</a></div></div></section>'+
   '<section class="wrap section"><div class="sec-head"><h2>Upcoming Events</h2><a class="link" href="#/events">See All</a></div>'+(feat.length?'<div class="egrid">'+feat.map(e=>ecard(e)).join('')+'</div>':'<div class="empty"><h3>No upcoming events</h3><p>Check back soon, or post one yourself.</p></div>')+'</section>'+
   '<section class="wrap section"><div class="sec-head"><h2>How a post gets published</h2></div><ol class="steps">'+
     '<li><h3>A student submits</h3><p>Any student can post an event or opportunity with the date, venue and registration details.</p></li>'+
     '<li><h3>An admin reviews</h3><p>Admins check the details and either approve the post or send it back with a note.</p></li>'+
     '<li><h3>The manager publishes</h3><p>Approved posts go live for every student to find, save and register for.</p></li></ol></section>'+
   (news.length?'<section class="wrap section"><div class="sec-head"><h2>Latest News</h2><a class="link" href="#/news">All news</a></div><div class="grid-3">'+news.map(n=>'<article class="news-item"><time>'+fmtStamp(n.at)+'</time><h3>'+esc(n.title)+'</h3><p class="clip">'+esc(n.content)+'</p></article>').join('')+'</div></section>':'');
}

/* ================= events, event page, news ================= */
route('/events',vEvents);
function vEvents(p,q){
  const s=(q.get('q')||'').trim(),dp=+q.get('department')||0,ct=+q.get('category')||0,ty=q.get('type')||'';
  let list=upcoming();
  if(s){const k=s.toLowerCase();list=list.filter(e=>[e.title,e.description,e.organizer,e.location].join(' ').toLowerCase().indexOf(k)>=0);}
  if(dp)list=list.filter(e=>e.department_id===dp||!e.department_id);
  if(ct)list=list.filter(e=>e.category_id===ct);
  if(ty)list=list.filter(e=>e.type===ty);
  const filtered=s||dp||ct||ty;
  const opt=(arr,sel,all)=>'<option value="">'+all+'</option>'+arr.map(o=>'<option value="'+o.id+'"'+(sel===o.id?' selected':'')+'>'+esc(o.name)+'</option>').join('');
  return '<div class="wrap page"><div class="page-head"><h1>'+(ct?esc(catName(ct))+' events':'Events and opportunities')+'</h1><p>Upcoming events, seminars, workshops, competitions and volunteer roles.</p></div>'+
   '<form class="filters" data-form="filters" role="search"><div class="f-q"><input name="q" type="search" value="'+esc(s)+'" placeholder="Search by title, organizer or venue" aria-label="Search events"></div>'+
   '<select name="department" aria-label="Department" data-autosubmit>'+opt(db.depts,dp,'All departments')+'</select>'+
   '<select name="category" aria-label="Category" data-autosubmit>'+opt(db.cats,ct,'All categories')+'</select>'+
   '<select name="type" aria-label="Source" data-autosubmit><option value="">DIU and external</option><option value="diu"'+(ty==='diu'?' selected':'')+'>DIU events</option><option value="external"'+(ty==='external'?' selected':'')+'>External opportunities</option></select>'+
   '<button class="btn btn-primary">Search</button></form>'+
   '<div class="results-bar"><span>'+plural(list.length,'upcoming event')+(filtered?' match your filters':'')+'</span>'+(filtered?'<a class="link" href="#/events">Clear filters</a>':'')+'</div>'+
   (list.length?'<div class="egrid">'+list.map(e=>ecard(e)).join('')+'</div>':'<div class="empty"><h3>No matching events</h3><p>Try a different search, or remove a filter.</p><a class="btn" href="#/events">Clear filters</a></div>')+'</div>';
}

route('/event/:id',vEvent);
function eventActions(e,u){
  const link=safeUrl(e.link);
  const ext=link?'<a class="btn btn-block" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">'+ic('ext',16)+'Open registration page</a>':'';
  if(!u)return '<a class="btn btn-primary btn-block" href="#/login?next='+encodeURIComponent('/event/'+e.id)+'">Log in to register</a>'+ext+'<p class="hint">New here? <a href="#/register">Create a student account</a>.</p>';
  if(u.role!=='student')return '<p class="hint">You are signed in as '+esc(u.role)+'. Only students can register, volunteer or save events.</p>'+ext;
  const reg=db.regs.find(r=>r.student_id===u.id&&r.event_id===e.id);
  const vol=db.vols.find(r=>r.student_id===u.id&&r.event_id===e.id);
  const sv=db.saved.find(r=>r.student_id===u.id&&r.event_id===e.id);
  const open=regOpen(e);
  let h='';
  if(reg)h+='<div class="notice ok">'+ic('checkc')+'<div><b>You are registered.</b><br>Status: '+badge(reg.status)+'</div></div>';
  else if(!open)h+='<button class="btn btn-primary btn-block" disabled>Registration closed</button>';
  else h+='<button class="btn btn-primary btn-block" data-act="register" data-id="'+e.id+'">Register for this event</button>';
  if(catName(e.category_id)==='Volunteer'){
    if(vol)h+='<div class="notice ok">'+ic('heart')+'<div><b>Volunteer application sent.</b><br>Status: '+badge(vol.status)+'</div></div>';
    else if(open)h+='<button class="btn btn-outline btn-block" data-act="volunteer" data-id="'+e.id+'">'+ic('heart',16)+'Apply as volunteer</button>';
  }
  h+='<button class="btn btn-block" data-act="save" data-id="'+e.id+'" aria-pressed="'+(sv?'true':'false')+'">'+ic('bookmark',16)+(sv?'Saved. Remove from saved':'Save for later')+'</button>'+ext;
  return h;
}
function vEvent(p,q,u){
  const e=evt(+p.id);
  const staff=u&&(u.role==='admin'||u.role==='manager');
  if(!e||(e.status!=='published'&&!staff))return notFound();
  const dl=deadlineNote(e);
  return '<div class="wrap page"><div class="detail-grid"><div><a class="crumb" href="#/events">'+ic('back',16)+'All events</a>'+
   '<article class="detail-card"><div class="dc-cover">'+cover(e)+'<span class="ec-chip" style="--c:'+catColor(e.category_id)+'">'+esc(catName(e.category_id))+'</span></div><div class="detail-body">'+
   (e.status!=='published'?'<div class="notice warn">'+ic('info')+'<div>This event is <b>'+esc(e.status)+'</b> and not visible to students yet.</div></div>':'')+
   '<p class="dept">'+esc(deptName(e.department_id))+'</p><h1>'+esc(e.title)+'</h1><p class="muted">Organized by '+esc(e.organizer)+(e.type==='external'?' (external opportunity)':'')+'</p>'+
   '<dl class="facts"><div><dt>Date</dt><dd>'+fmtDate(e.date)+'</dd></div><div><dt>Time</dt><dd>'+fmtTime(e.time)+'</dd></div><div><dt>Location</dt><dd>'+esc(e.location||'To be announced')+'</dd></div>'+(e.deadline?'<div><dt>Register by</dt><dd>'+fmtShort(e.deadline)+'</dd></div>':'')+'</dl>'+
   '<div class="prose">'+esc(e.description)+'</div></div></article></div>'+
   '<aside class="side-actions"><div class="panel"><h2>'+(dl?'Join this event':'Take part')+'</h2>'+(dl?'<p class="tfoot">'+dl+'</p>':'')+'<div class="stack" style="gap:10px">'+eventActions(e,u)+'</div></div></aside></div></div>';
}
route('/news',vNews);
function vNews(){
  const list=db.news.filter(n=>n.status==='published').sort((a,b)=>b.at.localeCompare(a.at));
  return '<div class="wrap page"><div class="page-head"><h1>DIU news</h1><p>Announcements from the DIU EVENT-X team.</p></div><div class="stack" style="margin-top:20px;max-width:760px">'+
   (list.length?list.map(n=>'<article class="news-item"><time>'+fmtStamp(n.at)+' by '+esc((user(n.created_by)||{}).name||'DIU')+'</time><h3>'+esc(n.title)+'</h3><p>'+esc(n.content)+'</p></article>').join(''):'<div class="empty"><h3>No news yet</h3></div>')+'</div></div>';
}

/* ================= auth pages ================= */
const msgBox='<div class="form-msg" role="alert" hidden></div>';
const authShell=(inner,foot)=>'<div class="auth"><div class="auth-card"><a class="auth-logo" href="#/" aria-label="DIU EVENT-X home">'+LOGO+'<span class="bw"><b>DIU <em>EVENT-X</em></b><small>Discover \u2022 Participate \u2022 Grow</small></span></a>'+inner+(foot?'<p class="auth-foot">'+foot+'</p>':'')+'</div></div>';
const inp=(icon,id,name,type,ph,extra,eye)=>'<div class="inp"><span class="inp-ic">'+ic(icon,18)+'</span><input id="'+id+'" name="'+name+'" type="'+type+'" placeholder="'+ph+'" '+(extra||'')+'>'+(eye?'<button type="button" class="eye" data-act="toggle-pw" aria-label="Show or hide password">'+ic('eyeoff',18)+'</button>':'')+'</div>';
const G_ICON='<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3-3A10 10 0 0 0 12 2 10 10 0 0 0 3.2 7.4l3.5 2.7A6 6 0 0 1 12 5z"/><path fill="#34A853" d="M12 22a10 10 0 0 0 6.9-2.7l-3.3-2.6A6 6 0 0 1 6.7 13.9l-3.5 2.7A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.7 13.9a6 6 0 0 1 0-3.8L3.2 7.4a10 10 0 0 0 0 9.2z"/><path fill="#4285F4" d="M21.8 10H12v4h5.6a4.8 4.8 0 0 1-2 3.1l3.3 2.6c1.9-1.8 3-4.4 3-7.7 0-.7-.1-1.4-.2-2z"/></svg>';
const M_ICON='<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="9.5" height="9.5" fill="#F25022"/><rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00"/><rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF"/><rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900"/></svg>';
route('/login',vLogin);
function vLogin(p,q,u){
  if(u)return {redirect:dashPath(u.role)};
  const n=+ss.get('attempts')||0;
  return authShell('<h1>Welcome Back</h1><p class="muted">Login to your DIU EVENT-X account.</p>'+
   (n>=3?'<div class="notice bad">'+ic('info')+'<div><b>3 login attempts failed.</b> You can reset your password with a one-time code sent to your registered email.<div style="margin-top:10px"><a class="btn btn-primary btn-sm" href="#/forgot">Reset password</a></div></div></div>':'')+
   '<form data-form="login" novalidate>'+msgBox+inp('mail','l-email','email','email','Email address','autocomplete="username" required')+inp('lock','l-pw','password','password','Password','autocomplete="current-password" required',true)+
   '<div class="row-between"><label class="chk"><input type="checkbox" name="remember"> Remember me</label><a href="#/forgot">Forgot Password?</a></div>'+
   '<button class="btn btn-primary btn-block btn-lg">Login '+ic('arrowr',18)+'</button></form>'+
   '<div class="or"><span>OR</span></div>'+
   '<button class="btn btn-block sso" data-act="sso" data-p="Google">'+G_ICON+'Continue with Google</button><button class="btn btn-block sso" data-act="sso" data-p="Microsoft">'+M_ICON+'Continue with Microsoft</button>'+
   '<div class="demo"><p class="lbl">Try a demo account</p><div class="demo-btns"><button class="btn btn-sm" data-act="demo" data-role="student">Student</button><button class="btn btn-sm" data-act="demo" data-role="admin">Admin</button><button class="btn btn-sm" data-act="demo" data-role="manager">Manager</button></div><p class="hint">Every demo account uses the password <b>password</b>.</p></div>',
   'Don\'t have an account? <a href="#/register"><b>Register</b></a>');
}
route('/register',vRegister);
function vRegister(p,q,u){
  if(u)return {redirect:dashPath(u.role)};
  return authShell('<h1>Create your account</h1><p class="muted">Register as a DIU student. Your email must be unique.</p>'+
   '<form data-form="register" novalidate>'+msgBox+
   '<div class="field"><label for="r-name">Full name</label>'+inp('user','r-name','name','text','Your full name','autocomplete="name" required')+'</div>'+
   '<div class="field"><label for="r-sid">Student ID</label>'+inp('doc','r-sid','student_id','text','e.g. 232-15-1234','required')+'</div>'+
   '<div class="field"><label for="r-email">Email</label>'+inp('mail','r-email','email','email','you@example.com','autocomplete="email" required')+'</div>'+
   '<div class="field"><label for="r-dept">Department</label><select id="r-dept" name="department_id" required><option value="">Select a department</option>'+db.depts.map(d=>'<option value="'+d.id+'">'+esc(d.name)+'</option>').join('')+'</select></div>'+
   '<div class="field"><label for="r-pw">Password</label>'+inp('lock','r-pw','password','password','At least 8 characters','minlength="8" autocomplete="new-password" required',true)+'</div>'+
   '<div class="field"><label for="r-pw2">Confirm password</label>'+inp('lock','r-pw2','confirm_password','password','Repeat your password','autocomplete="new-password" required')+'</div>'+
   '<button class="btn btn-primary btn-block btn-lg">Create account '+ic('arrowr',18)+'</button></form>','Already registered? <a href="#/login"><b>Log in</b></a>');
}
route('/forgot',vForgot);
function vForgot(){
  return authShell('<h1>Forgot password</h1><p class="muted">Enter the email you registered with. We will generate a 6-digit code that expires in 10 minutes.</p>'+
   '<form data-form="forgot" novalidate>'+msgBox+'<div class="field"><label for="f-email">Email</label>'+inp('mail','f-email','email','email','Email address','autocomplete="email" required')+'</div><button class="btn btn-primary btn-block btn-lg">Send verification code</button></form>','<a href="#/login">Back to log in</a>');
}
route('/verify',vVerify);
function vVerify(){
  if(!ss.get('reset_email'))return {redirect:'/forgot'};
  const code=ss.get('demo_otp');
  return authShell('<h1>Verify your email</h1><p class="muted">Enter the 6-digit code for <b>'+esc(ss.get('reset_email'))+'</b>.</p>'+
   (code?'<div class="notice">'+ic('info')+'<div><b>Demo mode.</b> A web page cannot send email, so your code is shown here instead:<br><span class="code-box">'+esc(code)+'</span></div></div>':'')+
   '<form data-form="verify" novalidate>'+msgBox+'<div class="field"><label for="v-otp">Verification code</label><input id="v-otp" name="otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required class="otp"></div><button class="btn btn-primary btn-block btn-lg">Verify code</button></form>','<a href="#/forgot">Send a new code</a>');
}
route('/reset',vReset);
function vReset(){
  if(!ss.get('reset_uid'))return {redirect:'/forgot'};
  return authShell('<h1>Create a new password</h1><p class="muted">Choose a password with at least 8 characters.</p>'+
   '<form data-form="reset" novalidate>'+msgBox+'<div class="field"><label for="p-pw">New password</label>'+inp('lock','p-pw','password','password','New password','minlength="8" autocomplete="new-password" required',true)+'</div>'+
   '<div class="field"><label for="p-pw2">Confirm password</label>'+inp('lock','p-pw2','confirm_password','password','Repeat the password','autocomplete="new-password" required')+'</div><button class="btn btn-primary btn-block btn-lg">Update password</button></form>');
}

/* ================= dashboard shell ================= */
const pendingSubs=()=>db.subs.filter(s=>s.status==='pending');
const awaitingSubs=()=>db.subs.filter(s=>s.status==='approved'&&!s.event_id);
const pendingRegs=()=>db.regs.filter(r=>r.status==='pending').length;
const pendingVols=()=>db.vols.filter(r=>r.status==='pending').length;
function sideItems(u){
  const N=unread(u.id);
  if(u.role==='student')return [['/student','Dashboard','home'],['/student/applications','My Applications','doc'],['/student/saved','Saved Events','bookmark'],['/student/submit','Submit Post','edit'],['/notifications','Notifications','bell',N],['/student/profile','Profile','user'],['/settings','Settings','gear']];
  if(u.role==='admin')return [['/admin','Dashboard','home'],['/admin/review','Pending Posts','doc',pendingSubs().length],['/admin/events','Manage Events','calendar'],['/admin/seminars','Manage Seminars','mic'],['/admin/competitions','Manage Competitions','trophy'],['/admin/volunteers','Manage Volunteers','users',pendingVols()],['/admin/registrations','Registrations','clip',pendingRegs()],['/admin/news','Manage News','news'],['/admin/external','External Opportunities','globe'],['/notifications','Notifications','bell',N],['/settings','Profile','user']];
  return [['/manager','Dashboard','home'],['/manager/approvals','Approvals','checkc',pendingSubs().length+awaitingSubs().length],['/manager/students','Manage Students','users'],['/manager/admins','Manage Admins','shield'],['/manager/events','Manage Events','calendar'],['/manager/seminars','Manage Seminars','mic'],['/manager/competitions','Manage Competitions','trophy'],['/manager/volunteers','Manage Volunteers','users',pendingVols()],['/manager/registrations','Registrations','clip',pendingRegs()],['/manager/news','Manage News','news'],['/manager/reports','Reports','chart'],['/settings','Settings','gear']];
}
function dash(u,path,title,sub,body){
  const N=unread(u.id),role=u.role.charAt(0).toUpperCase()+u.role.slice(1);
  const subline=u.role==='student'?deptName((pref(u.id)||{}).department_id)||'Student':role;
  return '<!--APP--><div class="app"><aside class="sidebar" id="sidebar"><div class="sb-head">'+brand('on-dark')+'<button class="icon-btn sb-x" data-act="sb-close" aria-label="Close menu">'+ic('x',20)+'</button></div><nav aria-label="'+esc(role)+' menu">'+
   sideItems(u).map(l=>'<a class="sb-item" href="#'+l[0]+'"'+(path===l[0]?' aria-current="page"':'')+'>'+ic(l[2],20)+'<span>'+l[1]+'</span>'+(l[3]?'<em class="cnt">'+l[3]+'</em>':'')+'</a>').join('')+'</nav>'+
   '<button class="sb-item sb-out" data-act="logout">'+ic('logout',20)+'<span>Logout</span></button></aside><div class="scrim" data-act="sb-close"></div>'+
   '<div class="app-main"><header class="app-top"><button class="icon-btn menu-btn2" data-act="sb-open" aria-label="Open menu">'+ic('menu',22)+'</button><span class="grow"></span>'+
   '<a class="top-ic" href="#/notifications" aria-label="Notifications'+(N?', '+N+' unread':'')+'">'+ic('bell',21)+(N?'<i class="dot"></i>':'')+'</a>'+
   '<details class="user-menu"><summary><span class="avatar">'+esc(initials(u.name))+'</span><span class="um-text"><b>'+esc(u.name.split(' ')[0])+'</b><small>'+esc(subline)+'</small></span>'+ic('chevd',16)+'</summary><div class="um-pop"><a href="#/">View public site</a><a href="#/settings">Settings</a><button data-act="logout">Log out</button></div></details></header>'+
   '<div class="app-content"><div class="dash-head"><h1>'+esc(title)+'</h1>'+(sub?'<p>'+esc(sub)+'</p>':'')+'</div>'+body+'</div></div></div>';
}
const stat=(label,value,icon,tone)=>'<div class="stat"><span class="st-ic t-'+(tone||'blue')+'">'+ic(icon||'grid',26)+'</span><div><b>'+esc(value)+'</b><span>'+esc(label)+'</span></div></div>';
const evLink=e=>e?'<a href="#/event/'+e.id+'">'+esc(e.title)+'</a>':'<span class="muted">Removed event</span>';
const who=id=>{const x=user(id);if(!x)return '<span class="muted">Unknown</span>';const s=stu(id);return esc(x.name)+(s?'<span class="sub">'+esc(s.student_id)+'</span>':'');};
const bars=items=>{const max=Math.max(1,...items.map(i=>i.value));return '<div class="bars">'+items.map(i=>'<div class="bar"><span>'+esc(i.label)+'</span><div class="track"><div class="fill" style="width:'+Math.round(i.value/max*100)+'%"></div></div><em>'+i.value+'</em></div>').join('')+'</div>';};
const secHead=(t,link)=>'<div class="sec-head"><h2>'+t+'</h2>'+(link||'')+'</div>';

/* ================= student ================= */
function recommend(u){
  const p=pref(u.id)||{};
  const words=(p.interests||'').toLowerCase().split(/[,;\n]+/).map(s=>s.trim()).filter(s=>s.length>=3);
  const joined=new Set(db.regs.filter(r=>r.student_id===u.id).map(r=>r.event_id));
  return upcoming().filter(e=>!joined.has(e.id)&&regOpen(e)).map(e=>{
    let score=0;const why=[];
    if(p.department_id&&e.department_id===p.department_id){score+=3;why.push('Your department: '+deptName(e.department_id));}
    else if(!e.department_id)score+=1;
    if(p.category_id&&e.category_id===p.category_id){score+=3;why.push('Your preferred category: '+catName(e.category_id));}
    const hay=(e.title+' '+e.description+' '+e.organizer).toLowerCase();
    words.forEach(k=>{if(hay.indexOf(k)>=0){score+=2;why.push('Matches your interest: '+k);}});
    if(daysBetween(today(),e.date)<=14)score+=1;
    return {e,score,why};
  }).filter(x=>x.why.length).sort((a,b)=>b.score-a.score||a.e.date.localeCompare(b.e.date)).slice(0,3);
}
const noteList=(list)=>list.length?'<div class="list">'+list.map(n=>'<div class="note-item'+(n.read?'':' unread')+'"><span class="dot"></span><div><b>'+esc(n.title)+'</b><span class="muted">'+esc(n.message)+'</span><br><time>'+fmtStamp(n.at)+'</time></div>'+(n.read?'':'<button class="btn btn-sm btn-ghost" data-act="note-read" data-id="'+n.id+'">Mark read</button>')+'</div>').join('')+'</div>':'<div class="empty"><h3>No notifications yet</h3><p>Updates about your registrations and posts show up here.</p></div>';

route('/student',vStuDash,['student']);
function vStuDash(p,q,u){
  const reco=recommend(u);
  const recIds=new Set(reco.map(x=>x.e.id));
  const more=upcoming().filter(e=>!recIds.has(e.id)).slice(0,3);
  const notes=db.notes.filter(n=>n.user_id===u.id).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,3);
  return dash(u,'/student','Welcome back, '+u.name.split(' ')[0]+'! \uD83D\uDC4B','Explore new opportunities and make the most of your university life.',
   '<div class="stats s3">'+stat('Registered Events',db.regs.filter(r=>r.student_id===u.id).length,'calendar','violet')+stat('Volunteer Applications',db.vols.filter(r=>r.student_id===u.id).length,'bookmark','mint')+stat('Saved Events',db.saved.filter(r=>r.student_id===u.id).length,'heart','violet')+'</div>'+
   '<div class="blk">'+secHead('Recommended for You','<a class="link" href="#/events">See All</a>')+(reco.length?'<div class="egrid">'+reco.map(x=>ecard(x.e,x.why[0])).join('')+'</div>':'<div class="empty"><h3>No matches yet</h3><p>Add your interests and preferred category in your profile to get suggestions.</p><a class="btn" href="#/student/profile">Update profile</a></div>')+'</div>'+
   (more.length?'<div class="blk">'+secHead('More upcoming events','<a class="link" href="#/events">See All</a>')+'<div class="egrid">'+more.map(e=>ecard(e)).join('')+'</div></div>':'')+
   '<div class="blk">'+secHead('Recent notifications')+noteList(notes)+'</div>');
}
route('/student/applications',vApplicationsMine,['student']);
function vApplicationsMine(p,q,u){
  const R=db.regs.filter(r=>r.student_id===u.id).sort((a,b)=>b.at.localeCompare(a.at));
  const V=db.vols.filter(r=>r.student_id===u.id).sort((a,b)=>b.at.localeCompare(a.at));
  const row=r=>{const e=evt(r.event_id);return [evLink(e),e?fmtShort(e.date):'',badge(r.status),fmtStamp(r.at)];};
  return dash(u,'/student/applications','My Applications','Track registrations and volunteer applications.',
   secHead('Event registrations')+table(['Event','Date','Status','Applied'],R.map(row),'You have not registered for any event yet')+
   '<div class="blk">'+secHead('Volunteer applications')+table(['Opportunity','Date','Status','Applied'],V.map(row),'No volunteer applications yet')+'</div>');
}
route('/student/saved',vSaved,['student']);
function vSaved(p,q,u){
  const list=db.saved.filter(s=>s.student_id===u.id).map(s=>evt(s.event_id)).filter(Boolean);
  return dash(u,'/student/saved','Saved Events','Events you bookmarked for later.',
   list.length?'<div class="egrid">'+list.map(e=>'<div class="stack" style="gap:8px">'+ecard(e)+'<div><button class="btn btn-sm" data-act="save" data-id="'+e.id+'">'+ic('x',14)+'Remove from saved</button></div></div>').join('')+'</div>':'<div class="empty"><h3>Nothing saved yet</h3><p>Use "Save for later" on an event page.</p><a class="btn" href="#/events">Browse events</a></div>');
}
const catOpts=(sel)=>db.cats.map(c=>'<option value="'+c.id+'"'+(sel===c.id?' selected':'')+'>'+esc(c.name)+'</option>').join('');
const deptOpts=(sel,all)=>(all?'<option value="">'+all+'</option>':'')+db.depts.map(d=>'<option value="'+d.id+'"'+(sel===d.id?' selected':'')+'>'+esc(d.name)+'</option>').join('');
route('/student/submit',vSubmit,['student']);
function vSubmit(p,q,u){
  const mine=db.subs.filter(s=>s.submitter_id===u.id).sort((a,b)=>b.at.localeCompare(a.at));
  return dash(u,'/student/submit','Submit Post','An admin reviews your post, then the manager publishes it.',
   '<div class="panel"><form data-form="submit" novalidate>'+msgBox+'<div class="row">'+
   '<div class="field full"><label for="s-title">Event name</label><input id="s-title" name="title" required></div>'+
   '<div class="field"><label for="s-cat">Category</label><select id="s-cat" name="category_id">'+catOpts(1)+'</select></div>'+
   '<div class="field"><label for="s-dept">Department</label><select id="s-dept" name="department_id">'+deptOpts(null,'All departments')+'</select></div>'+
   '<div class="field full"><label for="s-org">Organizer</label><input id="s-org" name="organizer" required></div>'+
   '<div class="field full"><label for="s-desc">Description</label><textarea id="s-desc" name="description" required></textarea></div>'+
   '<div class="field"><label for="s-date">Date</label><input id="s-date" name="event_date" type="date" min="'+today()+'" required></div>'+
   '<div class="field"><label for="s-time">Start time</label><input id="s-time" name="event_time" type="time"></div>'+
   '<div class="field"><label for="s-loc">Location</label><input id="s-loc" name="location"></div>'+
   '<div class="field"><label for="s-dl">Registration deadline</label><input id="s-dl" name="registration_deadline" type="date"></div>'+
   '<div class="field full"><label for="s-link">Registration link</label><input id="s-link" name="registration_link" type="url" placeholder="https://"></div></div>'+
   '<button class="btn btn-primary">Submit for approval</button></form></div>'+
   '<div class="blk">'+secHead('Your submissions')+table(['Post','Event date','Status','Reviewer note'],mine.map(s=>['<b>'+esc(s.title)+'</b><span class="sub">'+esc(catName(s.category_id))+'</span>',fmtShort(s.date),badge(subState(s)),esc(s.note||'')||'<span class="muted">None</span>']),'You have not submitted anything yet')+'</div>');
}
route('/student/profile',vProfile,['student']);
function vProfile(p,q,u){
  const pf=pref(u.id)||{},s=stu(u.id)||{};
  return dash(u,'/student/profile','Profile','Your details help us recommend events.',
   '<div class="panel" style="max-width:640px"><form data-form="profile" novalidate>'+msgBox+
   '<div class="field"><label for="pf-name">Full name</label><input id="pf-name" name="name" value="'+esc(u.name)+'" required></div>'+
   '<div class="row"><div class="field"><label for="pf-mail">Email</label><input id="pf-mail" value="'+esc(u.email)+'" disabled></div><div class="field"><label for="pf-sid">Student ID</label><input id="pf-sid" value="'+esc(s.student_id||'')+'" disabled></div></div>'+
   '<div class="field"><label for="pf-dept">Department</label><select id="pf-dept" name="department_id">'+deptOpts(pf.department_id,'Not set')+'</select></div>'+
   '<div class="field"><label for="pf-int">Interests</label><input id="pf-int" name="interests" value="'+esc(pf.interests||'')+'" placeholder="Programming, volunteering, robotics"><span class="hint">Separate interests with commas. We match them against event titles and descriptions.</span></div>'+
   '<div class="field"><label for="pf-cat">Preferred category</label><select id="pf-cat" name="category_id"><option value="">No preference</option>'+catOpts(pf.category_id)+'</select></div>'+
   '<button class="btn btn-primary">Save profile</button></form></div>');
}
route('/notifications',vNotes,['student','admin','manager']);
function vNotes(p,q,u){
  const list=db.notes.filter(n=>n.user_id===u.id).sort((a,b)=>b.at.localeCompare(a.at));
  return dash(u,'/notifications','Notifications',unread(u.id)?plural(unread(u.id),'unread notification')+'.':'You are all caught up.',
   (unread(u.id)?'<div class="tools-row"><button class="btn btn-sm" data-act="note-read-all">Mark all as read</button></div>':'')+noteList(list));
}
route('/settings',vSettings,['student','admin','manager']);
function vSettings(p,q,u){
  const th=ls.get('diu-theme')||'system';
  return dash(u,'/settings',u.role==='admin'?'Profile':'Settings','Manage your account, password and appearance.',
   '<div class="two"><div class="panel"><h2>Account</h2><form data-form="settings-name" novalidate>'+msgBox+'<div class="field"><label for="st-name">Full name</label><input id="st-name" name="name" value="'+esc(u.name)+'" required></div><div class="field"><label for="st-mail">Email</label><input id="st-mail" value="'+esc(u.email)+'" disabled></div><button class="btn btn-primary">Save name</button></form></div>'+
   '<div class="panel"><h2>Change password</h2><form data-form="password" novalidate>'+msgBox+'<div class="field"><label for="pw-old">Current password</label><input id="pw-old" name="current" type="password" autocomplete="current-password" required></div><div class="field"><label for="pw-new">New password</label><input id="pw-new" name="password" type="password" minlength="8" autocomplete="new-password" required></div><div class="field"><label for="pw-c">Confirm new password</label><input id="pw-c" name="confirm_password" type="password" autocomplete="new-password" required></div><button class="btn btn-primary">Update password</button></form></div></div>'+
   '<div class="panel"><h2>Appearance</h2><div class="seg" role="group" aria-label="Theme">'+[['system','System'],['light','Light'],['dark','Dark']].map(t=>'<button class="btn'+(th===t[0]?' btn-primary':'')+'" data-act="theme" data-v="'+t[0]+'" aria-pressed="'+(th===t[0])+'">'+t[1]+'</button>').join('')+'</div></div>');
}

/* ================= shared staff pieces ================= */
function eventFormHtml(e,pre){
  const v=e||{title:'',category_id:pre||1,department_id:null,organizer:'',type:pre===catId('External Opportunity')?'external':'diu',description:'',date:'',time:'',location:'',deadline:'',link:'',status:'published'};
  const st=['published','pending','approved','rejected'];
  return '<form class="dlg" data-form="event" data-id="'+(e?e.id:0)+'" novalidate><div class="dlg-top"><h2>'+(e?'Edit event':'New event')+'</h2><button type="button" class="icon-btn" data-act="dlg-close" aria-label="Close">'+ic('x')+'</button></div>'+msgBox+'<div class="row">'+
   '<div class="field full"><label for="e-title">Title</label><input id="e-title" name="title" value="'+esc(v.title)+'" required></div>'+
   '<div class="field"><label for="e-cat">Category</label><select id="e-cat" name="category_id">'+catOpts(v.category_id)+'</select></div>'+
   '<div class="field"><label for="e-dept">Department</label><select id="e-dept" name="department_id">'+deptOpts(v.department_id,'All departments')+'</select></div>'+
   '<div class="field"><label for="e-org">Organizer</label><input id="e-org" name="organizer" value="'+esc(v.organizer)+'" required></div>'+
   '<div class="field"><label for="e-type">Source</label><select id="e-type" name="type"><option value="diu"'+(v.type==='diu'?' selected':'')+'>DIU event</option><option value="external"'+(v.type==='external'?' selected':'')+'>External opportunity</option></select></div>'+
   '<div class="field"><label for="e-date">Date</label><input id="e-date" name="date" type="date" value="'+esc(v.date)+'" required></div>'+
   '<div class="field"><label for="e-time">Start time</label><input id="e-time" name="time" type="time" value="'+esc(v.time)+'"></div>'+
   '<div class="field"><label for="e-loc">Location</label><input id="e-loc" name="location" value="'+esc(v.location)+'"></div>'+
   '<div class="field"><label for="e-dl">Registration deadline</label><input id="e-dl" name="deadline" type="date" value="'+esc(v.deadline)+'"></div>'+
   '<div class="field"><label for="e-link">Registration link</label><input id="e-link" name="link" type="url" value="'+esc(v.link)+'" placeholder="https://"></div>'+
   '<div class="field"><label for="e-status">Status</label><select id="e-status" name="status">'+st.map(s=>'<option value="'+s+'"'+(v.status===s?' selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>').join('')+'</select></div>'+
   '<div class="field full"><label for="e-desc">Description</label><textarea id="e-desc" name="description" required>'+esc(v.description)+'</textarea></div></div>'+
   '<div class="dlg-actions"><button type="button" class="btn" data-act="dlg-close">Cancel</button><button class="btn btn-primary">'+(e?'Save changes':'Create event')+'</button></div></form>';
}
function subDetailHtml(s,canAct,role){
  const sub=user(s.submitter_id)||{};
  const st=subState(s);
  return '<div class="dlg"><div class="dlg-top"><h2>'+esc(s.title)+'</h2><button type="button" class="icon-btn" data-act="dlg-close" aria-label="Close">'+ic('x')+'</button></div><p>'+badge(st)+'</p><dl class="kv">'+
   '<dt>Submitted by</dt><dd>'+esc(sub.name||'Unknown')+(stu(s.submitter_id)?' ('+esc(stu(s.submitter_id).student_id)+')':'')+'</dd>'+
   '<dt>Category</dt><dd>'+esc(catName(s.category_id))+'</dd><dt>Department</dt><dd>'+esc(deptName(s.department_id))+'</dd><dt>Organizer</dt><dd>'+esc(s.organizer)+'</dd>'+
   '<dt>Date and time</dt><dd>'+fmtDate(s.date)+', '+fmtTime(s.time)+'</dd><dt>Location</dt><dd>'+esc(s.location||'Not provided')+'</dd>'+
   '<dt>Register by</dt><dd>'+(s.deadline?fmtShort(s.deadline):'Not provided')+'</dd><dt>Registration link</dt><dd>'+esc(s.link||'Not provided')+'</dd>'+
   '<dt>Description</dt><dd>'+esc(s.description)+'</dd>'+(s.note?'<dt>Reviewer note</dt><dd>'+esc(s.note)+'</dd>':'')+'</dl>'+
   (canAct?'<div class="dlg-actions"><button class="btn btn-danger" data-act="sub-reject" data-id="'+s.id+'">Reject</button><button class="btn btn-primary" data-act="'+(role==='manager'?'sub-publish':'sub-approve')+'" data-id="'+s.id+'">'+(role==='manager'?'Approve and publish':'Approve')+'</button></div>':'')+'</div>';
}
function rejectFormHtml(id){
  return '<form class="dlg" data-form="reject" data-id="'+id+'" novalidate><div class="dlg-top"><h2>Reject this post</h2><button type="button" class="icon-btn" data-act="dlg-close" aria-label="Close">'+ic('x')+'</button></div><p class="muted">The student sees your note, so say what to fix.</p>'+msgBox+
   '<div class="field"><label for="rj-note">Note to the student</label><textarea id="rj-note" name="note" required placeholder="For example: please add the venue and a start time."></textarea></div>'+
   '<div class="dlg-actions"><button type="button" class="btn" data-act="dlg-close">Cancel</button><button class="btn btn-danger">Reject post</button></div></form>';
}
function subTable(list,role,withActions){
  return table(['Post','Submitted by','Status','Actions'],list.map(s=>[
    '<b>'+esc(s.title)+'</b><span class="sub">'+esc(catName(s.category_id))+', '+fmtShort(s.date)+(s.location?', '+esc(s.location):'')+'</span>',
    who(s.submitter_id)+'<span class="sub">'+fmtStamp(s.at)+'</span>',badge(subState(s)),
    '<button class="btn btn-sm" data-act="sub-view" data-id="'+s.id+'">Details</button>'+(withActions?'<button class="btn btn-sm btn-primary" data-act="'+(role==='manager'?'sub-publish':'sub-approve')+'" data-id="'+s.id+'">'+(role==='manager'?'Approve and publish':'Approve')+'</button><button class="btn btn-sm" data-act="sub-reject" data-id="'+s.id+'">Reject</button>':'')
  ]),withActions?'No posts are waiting':'Nothing to show');
}
function recentSubs(list){
  const short=iso=>{const d=new Date(iso);return MON[d.getMonth()]+' '+d.getDate();};
  return table(['Title','Type','Submitted By','Date','Status','Action'],list.map(s=>{
    const st=s.status==='pending'?'pending':(s.status==='rejected'?'rejected':'approved');
    return ['<b>'+esc(s.title)+'</b>','<span class="ty" style="color:'+catText(s.category_id)+'">'+esc(catName(s.category_id))+'</span>',esc((user(s.submitter_id)||{}).name||'Unknown'),short(s.at),badge(st),
     '<button class="btn btn-primary btn-sm" data-act="sub-view" data-id="'+s.id+'">'+(s.status==='pending'?'Review':'View')+'</button>'];
  }),'No submissions yet');
}
function eventsPage(u,path,q,opt){
  opt=opt||{};
  const isMgr=u.role==='manager',f=q.get('status')||'';
  const cid=opt.cat?catId(opt.cat):0;
  const list=db.events.filter(e=>(!f||e.status===f)&&(!cid||e.category_id===cid)).sort((a,b)=>b.date.localeCompare(a.date));
  const tabs=[['','All'],['published','Published'],['pending','Pending'],['approved','Approved'],['rejected','Rejected']];
  return dash(u,path,opt.title||'Manage Events',opt.sub||'Create, edit and publish events.',
   '<div class="tools-row"><button class="btn btn-primary" data-act="ev-new" data-cat="'+cid+'">'+ic('plus',16)+'New event</button></div>'+
   '<div class="tabs">'+tabs.map(t=>'<a href="#'+path+(t[0]?'?status='+t[0]:'')+'"'+(f===t[0]?' aria-current="page"':'')+'>'+t[1]+'</a>').join('')+'</div>'+
   table(['Event','Category','Date','Source','Status','Actions'],list.map(e=>[
     '<b>'+esc(e.title)+'</b><span class="sub">'+esc(e.organizer)+'</span>','<span class="ty" style="color:'+catText(e.category_id)+'">'+esc(catName(e.category_id))+'</span>',fmtShort(e.date),e.type==='external'?'External':'DIU',badge(e.status),
     '<a class="btn btn-sm" href="#/event/'+e.id+'">'+ic('eye',14)+'View</a><button class="btn btn-sm" data-act="ev-edit" data-id="'+e.id+'">'+ic('edit',14)+'Edit</button>'+(e.status!=='published'?'<button class="btn btn-sm btn-primary" data-act="ev-publish" data-id="'+e.id+'">Publish</button>':'')+(isMgr?'<button class="btn btn-sm" data-act="ev-delete" data-id="'+e.id+'" aria-label="Delete '+esc(e.title)+'">'+ic('trash',14)+'</button>':'')
   ]),'No events here yet'));
}
function applicationsPage(u,path,q,opt){
  const type=opt.type,f=q.get('status')||'';
  const all=db[type].slice().sort((a,b)=>b.at.localeCompare(a.at));
  const list=all.filter(r=>!f||r.status===f);
  return dash(u,path,opt.title,opt.sub,
   '<div class="tabs">'+[['','All ('+all.length+')'],['pending','Pending'],['approved','Approved'],['rejected','Rejected']].map(t=>'<a href="#'+path+(t[0]?'?status='+t[0]:'')+'"'+(f===t[0]?' aria-current="page"':'')+'>'+t[1]+'</a>').join('')+'</div>'+
   table(['Student','Event','Event date','Applied','Status','Actions'],list.map(r=>{const e=evt(r.event_id);return [who(r.student_id),evLink(e),e?fmtShort(e.date):'',fmtStamp(r.at),badge(r.status),
     (r.status!=='approved'?'<button class="btn btn-sm btn-primary" data-act="app-set" data-type="'+type+'" data-id="'+r.id+'" data-status="approved">Approve</button>':'')+(r.status!=='rejected'?'<button class="btn btn-sm" data-act="app-set" data-type="'+type+'" data-id="'+r.id+'" data-status="rejected">Reject</button>':'')];}),'No applications match'));
}
function newsPage(u,path){
  const list=db.news.slice().sort((a,b)=>b.at.localeCompare(a.at));
  return dash(u,path,'Manage News','Publish announcements for every visitor.',
   '<div class="panel"><form data-form="news" novalidate>'+msgBox+'<div class="field"><label for="n-title">Title</label><input id="n-title" name="title" required></div><div class="field"><label for="n-body">Content</label><textarea id="n-body" name="content" required></textarea></div><div class="field" style="max-width:220px"><label for="n-st">Visibility</label><select id="n-st" name="status"><option value="published">Publish now</option><option value="draft">Save as draft</option></select></div><button class="btn btn-primary">Add news</button></form></div>'+
   '<div class="blk">'+secHead('All news')+table(['Title','Status','Posted','Actions'],list.map(n=>['<b>'+esc(n.title)+'</b>',badge(n.status),fmtStamp(n.at),'<button class="btn btn-sm" data-act="news-toggle" data-id="'+n.id+'">'+(n.status==='published'?'Unpublish':'Publish')+'</button><button class="btn btn-sm" data-act="news-delete" data-id="'+n.id+'" aria-label="Delete '+esc(n.title)+'">'+ic('trash',14)+'</button>']),'No news yet')+'</div>');
}
const ROLE_PAGES=(role,R)=>{
  const b='/'+role;
  route(b+'/events',(p,q,u)=>eventsPage(u,b+'/events',q),[role]);
  route(b+'/seminars',(p,q,u)=>eventsPage(u,b+'/seminars',q,{cat:'Seminar',title:'Manage Seminars',sub:'Seminars only.'}),[role]);
  route(b+'/competitions',(p,q,u)=>eventsPage(u,b+'/competitions',q,{cat:'Competition',title:'Manage Competitions',sub:'Competitions only.'}),[role]);
  route(b+'/volunteers',(p,q,u)=>applicationsPage(u,b+'/volunteers',q,{type:'vols',title:'Manage Volunteers',sub:'Approve or reject volunteer applications.'}),[role]);
  route(b+'/registrations',(p,q,u)=>applicationsPage(u,b+'/registrations',q,{type:'regs',title:'Registrations',sub:'Approve or reject event registrations.'}),[role]);
  route(b+'/news',(p,q,u)=>newsPage(u,b+'/news'),[role]);
};
ROLE_PAGES('admin');ROLE_PAGES('manager');

/* ================= admin ================= */
route('/admin',vAdminDash,['admin']);
function vAdminDash(p,q,u){
  const m=today().slice(0,7);
  const recent=db.subs.slice().sort((a,b)=>b.at.localeCompare(a.at)).slice(0,6);
  return dash(u,'/admin','Admin Dashboard','Review and manage submitted posts.',
   '<div class="stats">'+stat('Pending Posts',pendingSubs().length,'doc','orange')+stat('Published Events',db.events.filter(e=>e.status==='published').length,'calendar','mint')+stat('Total Users',db.users.length,'users','blue')+stat('This Month',db.events.filter(e=>e.status==='published'&&e.date.slice(0,7)===m).length,'chart','violet')+'</div>'+
   '<div class="blk" style="margin-top:0">'+secHead('Recent Submissions')+recentSubs(recent)+'</div>');
}
route('/admin/review',vReview,['admin']);
function vReview(p,q,u){
  const done=db.subs.filter(s=>s.status!=='pending').sort((a,b)=>(b.reviewed_at||'').localeCompare(a.reviewed_at||'')).slice(0,8);
  return dash(u,'/admin/review','Pending Posts','Approve posts to send them to the manager for publishing, or reject them with a note.',
   subTable(pendingSubs(),'admin',true)+'<div class="blk">'+secHead('Recently reviewed')+subTable(done,'admin',false)+'</div>');
}
route('/admin/external',(p,q,u)=>eventsPage(u,'/admin/external',q,{cat:'External Opportunity',title:'External Opportunities',sub:'Opportunities from outside DIU.'}),['admin']);

/* ================= manager ================= */
function monthlyCounts(n){
  const out=[],now=new Date();
  for(let i=n-1;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1),key=d.getFullYear()+'-'+pad(d.getMonth()+1);out.push({label:MON[d.getMonth()],count:db.events.filter(e=>e.status==='published'&&e.date.slice(0,7)===key).length});}
  return out;
}
function lineChart(pts){
  const W=640,H=270,L=42,R=18,T=18,B=34,iw=W-L-R,ih=H-T-B;
  const max=Math.max(1,...pts.map(p=>p.count)),step=Math.max(1,Math.ceil(max/4)),top=step*4;
  const X=i=>L+(pts.length===1?iw/2:i*iw/(pts.length-1)),Y=v=>T+ih-(v/top)*ih;
  let g='';for(let k=0;k<=4;k++){const y=Y(k*step);g+='<line class="ch-g" x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'"/><text class="ch-t" x="'+(L-8)+'" y="'+(y+4)+'" text-anchor="end">'+(k*step)+'</text>';}
  const line=pts.map((p,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(p.count).toFixed(1)).join(' ');
  const area=line+' L'+X(pts.length-1).toFixed(1)+' '+(T+ih)+' L'+X(0).toFixed(1)+' '+(T+ih)+' Z';
  const pk=pts.reduce((b,p,i)=>p.count>pts[b].count?i:b,0);
  const tx=Math.min(Math.max(X(pk)-58,L),W-R-116),ty=Math.max(Y(pts[pk].count)-48,2);
  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Published events per month"><defs><linearGradient id="chA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F6FEB" stop-opacity=".28"/><stop offset="1" stop-color="#1F6FEB" stop-opacity="0"/></linearGradient></defs>'+g+
   '<path d="'+area+'" fill="url(#chA)"/><path d="'+line+'" fill="none" stroke="#1F6FEB" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>'+
   pts.map((p,i)=>'<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(p.count).toFixed(1)+'" r="'+(i===pk?6:4)+'" class="ch-dot"><title>'+p.label+': '+plural(p.count,'event')+'</title></circle><text class="ch-t" x="'+X(i).toFixed(1)+'" y="'+(H-10)+'" text-anchor="middle">'+p.label+'</text>').join('')+
   '<g><rect x="'+tx+'" y="'+ty+'" width="116" height="38" rx="8" class="ch-tip"/><text x="'+(tx+58)+'" y="'+(ty+16)+'" text-anchor="middle" class="ch-tt">'+pts[pk].count+' Events</text><text x="'+(tx+58)+'" y="'+(ty+30)+'" text-anchor="middle" class="ch-tt2">in '+pts[pk].label+'</text></g></svg>';
}
function activities(){
  const a=[];
  db.subs.forEach(s=>{a.push({t:s.at,icon:'doc',tone:'blue',title:'New event submitted'});if(s.status==='approved'&&s.reviewed_at)a.push({t:s.reviewed_at,icon:'check',tone:'mint',title:'Post approved'});});
  db.regs.forEach(r=>a.push({t:r.at,icon:'user',tone:'mint',title:'Student registered'}));
  db.vols.forEach(r=>a.push({t:r.at,icon:'users',tone:'orange',title:'New volunteer application'}));
  return a.sort((x,y)=>y.t.localeCompare(x.t)).slice(0,4);
}
route('/manager',vMgrDash,['manager']);
function vMgrDash(p,q,u){
  const range=[4,8,12].indexOf(+q.get('range'))>=0?+q.get('range'):8;
  const byCat=n=>db.events.filter(e=>e.status==='published'&&catName(e.category_id)===n).length;
  const dec=db.regs.concat(db.vols,db.subs).filter(r=>r.status==='approved'||r.status==='rejected'),ok=dec.filter(r=>r.status==='approved').length;
  const rate=dec.length?Math.round(ok/dec.length*100)+'%':'n/a';
  return dash(u,'/manager','Manager Dashboard','Overall system statistics and management.',
   '<div class="stats s4">'+stat('Students',db.users.filter(x=>x.role==='student').length,'users','blue')+stat('Events',db.events.filter(e=>e.status==='published').length,'calendar','violet')+stat('Competitions',byCat('Competition'),'trophy','mint')+stat('Seminars',byCat('Seminar'),'mic','pink')+
   stat('Volunteer Opp.',byCat('Volunteer'),'heart','violet')+stat('Pending Posts',pendingSubs().length+awaitingSubs().length,'edit','pink')+stat('Active Admins',db.users.filter(x=>x.role==='admin'&&x.status==='active').length,'shield','blue')+stat('Approval Rate',rate,'percent','mint')+'</div>'+
   '<div class="ov"><div class="panel"><div class="ov-head"><h2>System Overview</h2><select data-nav aria-label="Range">'+[4,8,12].map(n=>'<option value="/manager?range='+n+'"'+(n===range?' selected':'')+'>Last '+n+' Months</option>').join('')+'</select></div>'+lineChart(monthlyCounts(range))+'</div>'+
   '<div class="panel"><h2>Recent Activities</h2><ul class="acts">'+activities().map(a=>'<li><span class="st-ic sm t-'+a.tone+'">'+ic(a.icon,18)+'</span><div><b>'+a.title+'</b><small>'+ago(a.t)+'</small></div></li>').join('')+'</ul></div></div>');
}
route('/manager/approvals',vApprovals,['manager']);
function vApprovals(p,q,u){
  const wait=pendingSubs().concat(awaitingSubs()).sort((a,b)=>b.at.localeCompare(a.at));
  const done=db.subs.filter(s=>s.status==='rejected'||s.event_id).sort((a,b)=>(b.reviewed_at||'').localeCompare(a.reviewed_at||'')).slice(0,8);
  return dash(u,'/manager/approvals','Approvals','Approving a post publishes it as an event straight away.',
   subTable(wait,'manager',true)+'<div class="blk">'+secHead('Recent decisions')+subTable(done,'manager',false)+'</div>');
}
route('/manager/students',vStudents,['manager']);
function vStudents(p,q,u){
  const list=db.users.filter(x=>x.role==='student').sort((a,b)=>b.created.localeCompare(a.created));
  return dash(u,'/manager/students','Manage Students','Deactivate an account to block log in without deleting history.',
   '<div class="tools-row"><input type="search" placeholder="Filter by name, email or ID" aria-label="Filter students" data-filter="stu-table"></div><div id="stu-table">'+
   table(['Student','Student ID','Department','Registrations','Status','Joined','Actions'],list.map(x=>{const s=stu(x.id)||{},pf=pref(x.id)||{};return ['<b>'+esc(x.name)+'</b><span class="sub">'+esc(x.email)+'</span>',esc(s.student_id||''),esc(pf.department_id?deptName(pf.department_id):'Not set'),String(db.regs.filter(r=>r.student_id===x.id).length),badge(x.status),fmtShort(x.created.slice(0,10)),
     '<button class="btn btn-sm" data-act="stu-toggle" data-id="'+x.id+'">'+(x.status==='active'?'Deactivate':'Activate')+'</button>'];}),'No students yet')+'</div>');
}
route('/manager/admins',vAdmins,['manager']);
function vAdmins(p,q,u){
  const list=db.users.filter(x=>x.role==='admin'),active=list.filter(x=>x.status==='active').length,full=active>=3;
  return dash(u,'/manager/admins','Manage Admins','At most 3 admins can be active at the same time.',
   '<div class="notice'+(full?' warn':'')+'">'+ic('info')+'<div>Active admins: <b>'+active+' of 3</b>.'+(full?' Deactivate an admin before adding another.':'')+'</div></div>'+
   '<div class="panel"><h2>Add an admin</h2><form data-form="admin-add" novalidate>'+msgBox+'<div class="row"><div class="field"><label for="a-name">Name</label><input id="a-name" name="name" required></div><div class="field"><label for="a-email">Email</label><input id="a-email" name="email" type="email" required></div></div><div class="field" style="max-width:320px"><label for="a-pw">Starting password</label><input id="a-pw" name="password" type="text" minlength="8" value="password" required><span class="hint">Share it with the new admin. At least 8 characters.</span></div><button class="btn btn-primary"'+(full?' disabled':'')+'>Add admin</button></form></div>'+
   '<div class="blk">'+secHead('All admins')+table(['Name','Email','Status','Added','Actions'],list.map(x=>['<b>'+esc(x.name)+'</b>',esc(x.email),badge(x.status),fmtShort(x.created.slice(0,10)),'<button class="btn btn-sm" data-act="admin-toggle" data-id="'+x.id+'">'+(x.status==='active'?'Deactivate':'Reactivate')+'</button>']),'No admins')+'</div>');
}
route('/manager/reports',vReports,['manager']);
function vReports(p,q,u){
  const cnt=(a,s)=>a.filter(r=>r.status===s).length;
  const perEvent=db.events.map(e=>({label:e.title,value:db.regs.filter(r=>r.event_id===e.id).length})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value).slice(0,6);
  const perCat=db.cats.map(c=>({label:c.name,value:db.events.filter(e=>e.status==='published'&&e.category_id===c.id).length}));
  const perDept=db.depts.map(d=>({label:d.name,value:db.prefs.filter(pf=>pf.department_id===d.id&&(user(pf.user_id)||{}).role==='student').length}));
  return dash(u,'/manager/reports','Reports','Registrations, events and students at a glance.',
   '<div class="stats s5">'+stat('Registrations',db.regs.length,'clip','blue')+stat('Approved',cnt(db.regs,'approved'),'checkc','mint')+stat('Pending',cnt(db.regs,'pending'),'clock','orange')+stat('Rejected',cnt(db.regs,'rejected'),'x','pink')+stat('Volunteer applications',db.vols.length,'heart','violet')+'</div>'+
   '<div class="two"><div class="panel"><h2>Published events by category</h2>'+bars(perCat)+'</div><div class="panel"><h2>Most registered events</h2>'+(perEvent.length?bars(perEvent):'<p class="muted">No registrations yet.</p>')+'</div></div>'+
   '<div class="two blk"><div class="panel"><h2>Students by department</h2>'+bars(perDept)+'</div><div class="panel"><h2>Post pipeline</h2><div class="stats s2" style="margin:0">'+stat('Pending review',pendingSubs().length,'doc','orange')+stat('Awaiting publish',awaitingSubs().length,'clock','blue')+stat('Published',db.subs.filter(s=>s.event_id).length,'checkc','mint')+stat('Rejected',cnt(db.subs,'rejected'),'x','pink')+'</div></div></div>');
}

/* ================= form handlers ================= */
const F={};
const formError=(f,m)=>{const b=$('.form-msg',f);if(b){b.textContent=m;b.hidden=false;b.scrollIntoView({block:'nearest'});}else toast(m,'danger');return false;};
const need=(...roles)=>{const u=me();if(!u||roles.indexOf(u.role)<0){toast('You do not have access to that action.','danger');return null;}return u;};
const val=(fd,k)=>String(fd.get(k)||'').trim();
const emailOk=s=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

F.search=(f,fd)=>{const s=val(fd,'q');go('/events'+(s?'?q='+encodeURIComponent(s):''));};
F.filters=(f,fd)=>{const p=new URLSearchParams();['q','department','category','type'].forEach(k=>{const v=val(fd,k);if(v&&v!=='0')p.set(k,v);});const s=p.toString();go('/events'+(s?'?'+s:''));};

F.login=async(f,fd)=>{
  const email=val(fd,'email').toLowerCase(),pw=String(fd.get('password')||'');
  if(!email||!pw)return formError(f,'Enter your email and password.');
  const u=db.users.find(x=>x.email===email);
  let ok=false;if(u&&u.status==='active')ok=await checkPw(pw,u.pw);
  if(ok){
    ss.set('attempts','0');
    if(fd.get('remember')){ls.set('uid',String(u.id));ss.del('uid');}else{ss.set('uid',String(u.id));ls.del('uid');}
    const next=new URLSearchParams((location.hash.split('?')[1])||'').get('next');
    toast('Welcome back, '+u.name.split(' ')[0]+'.');
    go(next&&next.charAt(0)==='/'&&next.charAt(1)!=='/'?next:dashPath(u.role));return;
  }
  const n=(+ss.get('attempts')||0)+1;ss.set('attempts',String(n));
  if(u&&u.status!=='active')toast('This account is inactive. Ask the DIU EVENT-X manager to reactivate it.','danger');
  else toast(n>=3?'3 login attempts failed. Reset your password to continue.':'Email or password is incorrect. Attempt '+n+' of 3.','danger');
  if(n===3)render(true);
  else formError(f,n>=3?'Email or password is incorrect.':'Email or password is incorrect. Attempt '+n+' of 3.');
};
F.register=async(f,fd)=>{
  const name=val(fd,'name'),sid=val(fd,'student_id'),email=val(fd,'email').toLowerCase(),dp=+fd.get('department_id'),pw=String(fd.get('password')||''),c=String(fd.get('confirm_password')||'');
  if(!name||!sid||!email||!dp||!pw)return formError(f,'Fill in every field.');
  if(!emailOk(email))return formError(f,'Enter a valid email address.');
  if(pw.length<8)return formError(f,'Your password needs at least 8 characters.');
  if(pw!==c)return formError(f,'The two passwords do not match.');
  if(db.users.some(x=>x.email===email))return formError(f,'This email is already registered. Log in or use another email.');
  if(db.students.some(s=>s.student_id.toLowerCase()===sid.toLowerCase()))return formError(f,'This student ID is already registered.');
  const uid=nid('users');
  db.users.push({id:uid,name,email,pw:await hashPw(pw),role:'student',status:'active',created:new Date().toISOString()});
  db.students.push({user_id:uid,student_id:sid});db.prefs.push({user_id:uid,department_id:dp,interests:'',category_id:null});
  notify(uid,'Welcome to DIU EVENT-X','Add your interests in your profile to get event recommendations.');save();
  toast('Account created. Log in to continue.');go('/login');
};
F.forgot=async(f,fd)=>{
  const email=val(fd,'email').toLowerCase();
  const u=db.users.find(x=>x.email===email&&x.status==='active');
  if(!u)return formError(f,'No active account uses that email.');
  const a=new Uint32Array(1);try{crypto.getRandomValues(a);}catch(e){a[0]=Math.floor(Math.random()*4e9);}
  const otp=String(100000+a[0]%900000);
  db.otps.forEach(o=>{if(o.user_id===u.id)o.used=true;});
  db.otps.push({id:nid('otps'),user_id:u.id,hash:await hashPw(otp),expires:Date.now()+10*60000,used:false,tries:0});save();
  ss.set('reset_email',email);ss.set('demo_otp',otp);ss.del('reset_uid');
  toast('Verification code generated. It expires in 10 minutes.');go('/verify');
};
F.verify=async(f,fd)=>{
  const email=ss.get('reset_email'),code=val(fd,'otp');
  const u=db.users.find(x=>x.email===email);if(!u)return formError(f,'Start again from Forgot password.');
  const row=db.otps.filter(o=>o.user_id===u.id&&!o.used&&o.expires>Date.now()).pop();
  if(!row)return formError(f,'That code is invalid or expired. Request a new one.');
  if(!/^\d{6}$/.test(code))return formError(f,'Enter the 6-digit code.');
  if(await checkPw(code,row.hash)){row.used=true;save();ss.set('reset_uid',String(u.id));ss.del('demo_otp');go('/reset');return;}
  row.tries=(row.tries||0)+1;if(row.tries>=5)row.used=true;save();
  formError(f,row.tries>=5?'Too many wrong codes. Request a new code.':'That code is invalid or expired.');
};
F.reset=async(f,fd)=>{
  const pw=String(fd.get('password')||''),c=String(fd.get('confirm_password')||'');
  if(pw.length<8)return formError(f,'Your password needs at least 8 characters.');
  if(pw!==c)return formError(f,'The two passwords do not match.');
  const u=user(Number(ss.get('reset_uid')));if(!u)return formError(f,'Start again from Forgot password.');
  u.pw=await hashPw(pw);save();
  ['reset_uid','reset_email','demo_otp','attempts'].forEach(k=>ss.del(k));
  toast('Password updated. Log in with your new password.');go('/login');
};
F.profile=(f,fd)=>{
  const u=need('student');if(!u)return;
  const name=val(fd,'name');if(!name)return formError(f,'Your name cannot be empty.');
  u.name=name;const pf=pref(u.id);
  pf.department_id=+fd.get('department_id')||null;pf.interests=val(fd,'interests');pf.category_id=+fd.get('category_id')||null;
  save();toast('Profile saved.');render(true);
};
F.submit=(f,fd)=>{
  const u=need('student');if(!u)return;
  const v={title:val(fd,'title'),category_id:+fd.get('category_id'),department_id:+fd.get('department_id')||null,organizer:val(fd,'organizer'),description:val(fd,'description'),date:val(fd,'event_date'),time:val(fd,'event_time'),location:val(fd,'location'),deadline:val(fd,'registration_deadline'),link:val(fd,'registration_link')};
  if(!v.title||!v.organizer||!v.description||!v.date)return formError(f,'Event name, organizer, description and date are required.');
  if(v.date<today())return formError(f,'The event date cannot be in the past.');
  if(v.deadline&&v.deadline>v.date)return formError(f,'The registration deadline must be on or before the event date.');
  if(v.link&&!safeUrl(v.link))return formError(f,'The registration link must start with http:// or https://.');
  db.subs.push(Object.assign({id:nid('subs'),submitter_id:u.id,event_id:null,status:'pending',reviewed_by:null,note:'',at:new Date().toISOString(),reviewed_at:null},v));
  db.users.filter(x=>x.role==='admin'&&x.status==='active').forEach(a=>notify(a.id,'New post to review',u.name+' submitted "'+v.title+'".'));
  notify(u.id,'Post submitted','"'+v.title+'" is waiting for admin review.');
  save();toast('Submitted for approval.');render(true);
};
F.event=(f,fd)=>{
  const u=need('admin','manager');if(!u)return;
  const id=+f.dataset.id;
  const v={title:val(fd,'title'),category_id:+fd.get('category_id'),department_id:+fd.get('department_id')||null,organizer:val(fd,'organizer'),type:fd.get('type')==='external'?'external':'diu',date:val(fd,'date'),time:val(fd,'time'),location:val(fd,'location'),deadline:val(fd,'deadline'),link:val(fd,'link'),status:val(fd,'status'),description:val(fd,'description')};
  if(!v.title||!v.organizer||!v.description||!v.date)return formError(f,'Title, organizer, date and description are required.');
  if(v.deadline&&v.deadline>v.date)return formError(f,'The registration deadline must be on or before the event date.');
  if(v.link&&!safeUrl(v.link))return formError(f,'The registration link must start with http:// or https://.');
  if(['published','pending','approved','rejected'].indexOf(v.status)<0)v.status='pending';
  if(id){const e=evt(id);if(!e)return formError(f,'This event no longer exists.');Object.assign(e,v);}
  else db.events.push(Object.assign({id:nid('events'),created_by:u.id,created:new Date().toISOString()},v));
  save();closeDlg();toast(id?'Event updated.':'Event created.');render(true);
};
F.reject=(f,fd)=>{
  const u=need('admin','manager');if(!u)return;
  const s=db.subs.find(x=>x.id===+f.dataset.id);if(!s)return;
  const note=val(fd,'note');if(note.length<3)return formError(f,'Add a short note so the student knows what to fix.');
  s.status='rejected';s.reviewed_by=u.id;s.reviewed_at=new Date().toISOString();s.note=note;
  notify(s.submitter_id,'Post rejected','"'+s.title+'" was rejected. Note: '+note);
  save();closeDlg();toast('Post rejected.');render(true);
};
F.news=(f,fd)=>{
  const u=need('admin','manager');if(!u)return;
  const t=val(fd,'title'),c=val(fd,'content');if(!t||!c)return formError(f,'Add a title and some content.');
  db.news.push({id:nid('news'),title:t,content:c,status:fd.get('status')==='draft'?'draft':'published',created_by:u.id,at:new Date().toISOString()});
  save();toast(fd.get('status')==='draft'?'Saved as draft.':'News published.');render(true);
};
F['admin-add']=async(f,fd)=>{
  const u=need('manager');if(!u)return;
  const name=val(fd,'name'),email=val(fd,'email').toLowerCase(),pw=String(fd.get('password')||'');
  if(db.users.filter(x=>x.role==='admin'&&x.status==='active').length>=3)return formError(f,'Maximum admin limit reached. Deactivate an active admin first.');
  if(!name||!emailOk(email))return formError(f,'Enter a name and a valid email.');
  if(pw.length<8)return formError(f,'The starting password needs at least 8 characters.');
  if(db.users.some(x=>x.email===email))return formError(f,'That email already has an account.');
  const uid=nid('users');db.users.push({id:uid,name,email,pw:await hashPw(pw),role:'admin',status:'active',created:new Date().toISOString()});
  notify(uid,'Welcome, admin','You can now review posts and manage events and news.');save();toast('Admin added.');render(true);
};


F['settings-name']=(f,fd)=>{
  const u=need('student','admin','manager');if(!u)return;
  const name=val(fd,'name');if(!name)return formError(f,'Your name cannot be empty.');
  u.name=name;save();toast('Name saved.');render(true);
};
F.password=async(f,fd)=>{
  const u=need('student','admin','manager');if(!u)return;
  const cur=String(fd.get('current')||''),pw=String(fd.get('password')||''),c=String(fd.get('confirm_password')||'');
  if(!await checkPw(cur,u.pw))return formError(f,'Your current password is not correct.');
  if(pw.length<8)return formError(f,'Your new password needs at least 8 characters.');
  if(pw!==c)return formError(f,'The two new passwords do not match.');
  u.pw=await hashPw(pw);save();toast('Password updated.');render(true);
};

/* ================= click actions ================= */
const A={};
A.menu=el=>{const n=$('#nav');const o=n.classList.toggle('open');el.setAttribute('aria-expanded',o?'true':'false');};
A.logout=()=>{ss.del('uid');ls.del('uid');toast('You are logged out.');go('/');};
A['dlg-close']=()=>closeDlg();
A.demo=el=>{
  const em={student:'student@diueventx.test',admin:'admin@diueventx.test',manager:'manager@diueventx.test'}[el.dataset.role];
  $('#l-email').value=em;$('#l-pw').value='password';$('#l-pw').focus();
};
A['reset-demo']=async()=>{
  if(!await confirmBox('Reset demo data?','This removes every account, post and registration you created here and restores the sample data.','Reset',true))return;
  ls.del(KEY);ls.del('uid');['uid','attempts','reset_email','reset_uid','demo_otp'].forEach(k=>ss.del(k));
  db=await loadDb();toast('Demo data restored.');go('/');render();
};
A.register=(el,id)=>{
  const u=need('student');if(!u)return;const e=evt(id);
  if(!e||e.status!=='published')return;
  if(!regOpen(e))return toast('Registration for this event is closed.','danger');
  if(db.regs.some(r=>r.student_id===u.id&&r.event_id===id))return;
  db.regs.push({id:nid('regs'),student_id:u.id,event_id:id,status:'pending',at:new Date().toISOString()});
  notify(u.id,'Registration submitted','Your registration for "'+e.title+'" is pending approval.');save();
  toast('Registration submitted.');render(true);
};
A.volunteer=(el,id)=>{
  const u=need('student');if(!u)return;const e=evt(id);
  if(!e||e.status!=='published'||catName(e.category_id)!=='Volunteer')return;
  if(!regOpen(e))return toast('Applications for this role are closed.','danger');
  if(db.vols.some(r=>r.student_id===u.id&&r.event_id===id))return;
  db.vols.push({id:nid('vols'),student_id:u.id,event_id:id,status:'pending',at:new Date().toISOString()});
  notify(u.id,'Volunteer application submitted','Your application for "'+e.title+'" is pending approval.');save();
  toast('Volunteer application submitted.');render(true);
};
A.save=(el,id)=>{
  const u=need('student');if(!u)return;
  const i=db.saved.findIndex(r=>r.student_id===u.id&&r.event_id===id);
  if(i>=0){db.saved.splice(i,1);toast('Removed from saved events.');}
  else{db.saved.push({id:nid('saved'),student_id:u.id,event_id:id,at:new Date().toISOString()});toast('Event saved.');}
  save();render(true);
};
A['note-read']=(el,id)=>{const u=me();const n=db.notes.find(x=>x.id===id&&u&&x.user_id===u.id);if(n){n.read=true;save();render(true);}};
A['note-read-all']=()=>{const u=me();if(!u)return;db.notes.forEach(n=>{if(n.user_id===u.id)n.read=true;});save();render(true);};
A['sub-view']=(el,id)=>{
  const u=need('admin','manager');if(!u)return;const s=db.subs.find(x=>x.id===id);if(!s)return;
  const can=u.role==='manager'?(s.status==='pending'||subState(s)==='awaiting'):s.status==='pending';
  openDlg(subDetailHtml(s,can,u.role));
};
A['sub-reject']=(el,id)=>{
  const u=need('admin','manager');if(!u)return;const s=db.subs.find(x=>x.id===id);if(!s)return;
  if(s.event_id||s.status==='rejected')return;
  openDlg(rejectFormHtml(id));
};
A['sub-approve']=(el,id)=>{
  const u=need('admin');if(!u)return;const s=db.subs.find(x=>x.id===id);if(!s||s.status!=='pending')return;
  s.status='approved';s.reviewed_by=u.id;s.reviewed_at=new Date().toISOString();
  notify(s.submitter_id,'Post approved by admin','"'+s.title+'" passed admin review and is waiting for the manager to publish it.');
  db.users.filter(x=>x.role==='manager'&&x.status==='active').forEach(m=>notify(m.id,'Post ready to publish','"'+s.title+'" was approved by an admin.'));
  save();closeDlg();toast('Approved and sent to the manager.');render(true);
};
A['sub-publish']=(el,id)=>{
  const u=need('manager');if(!u)return;const s=db.subs.find(x=>x.id===id);
  if(!s||s.event_id||s.status==='rejected')return;
  const eid=nid('events');
  db.events.push({id:eid,title:s.title,category_id:s.category_id,department_id:s.department_id,organizer:s.organizer,description:s.description,date:s.date,time:s.time,location:s.location,deadline:s.deadline,link:s.link,type:catName(s.category_id)==='External Opportunity'?'external':'diu',status:'published',created_by:u.id,created:new Date().toISOString()});
  s.status='approved';s.event_id=eid;s.reviewed_by=u.id;s.reviewed_at=new Date().toISOString();
  notify(s.submitter_id,'Post published','"'+s.title+'" is now live on DIU EVENT-X.');
  save();closeDlg();toast('Approved and published.');render(true);
};
A['ev-new']=el=>{if(need('admin','manager'))openDlg(eventFormHtml(null,Number(el.dataset.cat)||0));};
A['ev-edit']=(el,id)=>{if(!need('admin','manager'))return;const e=evt(id);if(e)openDlg(eventFormHtml(e));};
A['ev-publish']=(el,id)=>{if(!need('admin','manager'))return;const e=evt(id);if(!e)return;e.status='published';save();toast('Event published.');render(true);};
A['ev-delete']=async(el,id)=>{
  if(!need('manager'))return;const e=evt(id);if(!e)return;
  if(!await confirmBox('Delete this event?','"'+e.title+'" and all of its registrations, volunteer applications and saved bookmarks will be removed.','Delete event',true))return;
  db.events=db.events.filter(x=>x.id!==id);db.regs=db.regs.filter(x=>x.event_id!==id);db.vols=db.vols.filter(x=>x.event_id!==id);db.saved=db.saved.filter(x=>x.event_id!==id);
  save();toast('Event deleted.');render(true);
};
A['app-set']=(el,id)=>{
  if(!need('admin','manager'))return;
  const t=el.dataset.type==='vols'?'vols':'regs',st=el.dataset.status==='approved'?'approved':'rejected';
  const r=db[t].find(x=>x.id===id);if(!r)return;const e=evt(r.event_id);
  r.status=st;
  notify(r.student_id,(t==='vols'?'Volunteer application ':'Registration ')+st,'Your '+(t==='vols'?'volunteer application':'registration')+' for "'+(e?e.title:'an event')+'" was '+st+'.');
  save();toast('Marked '+st+'.');render(true);
};
A['news-toggle']=(el,id)=>{if(!need('admin','manager'))return;const n=db.news.find(x=>x.id===id);if(!n)return;n.status=n.status==='published'?'draft':'published';save();toast(n.status==='published'?'News published.':'News moved to drafts.');render(true);};
A['news-delete']=async(el,id)=>{
  if(!need('admin','manager'))return;const n=db.news.find(x=>x.id===id);if(!n)return;
  if(!await confirmBox('Delete this news item?','"'+n.title+'" will be removed for everyone.','Delete',true))return;
  db.news=db.news.filter(x=>x.id!==id);save();toast('News deleted.');render(true);
};
A['stu-toggle']=async(el,id)=>{
  if(!need('manager'))return;const x=user(id);if(!x||x.role!=='student')return;
  if(x.status==='active'&&!await confirmBox('Deactivate '+x.name+'?','They will not be able to log in until you activate the account again.','Deactivate',true))return;
  x.status=x.status==='active'?'inactive':'active';save();toast(x.name+' is now '+x.status+'.');render(true);
};
A['admin-toggle']=async(el,id)=>{
  if(!need('manager'))return;const x=user(id);if(!x||x.role!=='admin')return;
  if(x.status==='active'){
    if(!await confirmBox('Deactivate '+x.name+'?','They will lose access to admin tools.','Deactivate',true))return;
    x.status='inactive';
  }else{
    if(db.users.filter(a=>a.role==='admin'&&a.status==='active').length>=3)return toast('Maximum of 3 active admins. Deactivate another admin first.','danger');
    x.status='active';
  }
  save();toast(x.name+' is now '+x.status+'.');render(true);
};

A['sb-open']=()=>{const a=$('#sidebar');if(a)a.classList.add('open');document.body.classList.add('sb-on');};
A['sb-close']=()=>{const a=$('#sidebar');if(a)a.classList.remove('open');document.body.classList.remove('sb-on');};
A['toggle-pw']=el=>{const i=el.parentElement.querySelector('input');if(i)i.type=i.type==='password'?'text':'password';};
A.sso=el=>openDlg('<div class="dlg"><div class="dlg-top"><h2>'+esc(el.dataset.p)+' sign-in</h2><button type="button" class="icon-btn" data-act="dlg-close" aria-label="Close">'+ic('x')+'</button></div><p>Signing in with '+esc(el.dataset.p)+' needs a real server (OAuth), so it is not connected in this browser-only demo.</p><p class="muted">Use your email and password, or one of the demo accounts on the login page.</p><div class="dlg-actions"><button class="btn btn-primary" data-act="dlg-close">Got it</button></div></div>');
A.theme=el=>{const v=el.dataset.v;ls.set('diu-theme',v);applyTheme();render(true);};
function applyTheme(){const t=ls.get('diu-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.removeAttribute('data-theme');}

/* ================= wiring ================= */
document.addEventListener('click',async e=>{
  const el=e.target.closest('[data-act]');if(!el)return;
  const fn=A[el.dataset.act];if(!fn)return;
  e.preventDefault();
  try{await fn(el,Number(el.dataset.id)||0,e);}catch(err){console.error(err);toast('Something went wrong. Please try again.','danger');}
});
document.addEventListener('submit',async e=>{
  const f=e.target.closest('form[data-form]');if(!f)return;
  e.preventDefault();
  const h=F[f.dataset.form];if(!h)return;
  const b=$('.form-msg',f);if(b)b.hidden=true;
  try{await h(f,new FormData(f));}catch(err){console.error(err);formError(f,'Something went wrong. Please try again.');}
});
document.addEventListener('change',e=>{
  const s=e.target.closest('select[data-autosubmit]');
  if(s&&s.form){if(s.form.requestSubmit)s.form.requestSubmit();else s.form.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));}
});
document.addEventListener('change',e=>{const s=e.target.closest('select[data-nav]');if(s)go(s.value);});
document.addEventListener('click',e=>{$$('details.more[open],details.user-menu[open]').forEach(d=>{if(!d.contains(e.target))d.removeAttribute('open');});});
document.addEventListener('input',e=>{
  const i=e.target.closest('input[data-filter]');if(!i)return;
  const k=i.value.trim().toLowerCase();
  $$('#'+i.dataset.filter+' tbody tr').forEach(r=>{r.hidden=k&&r.textContent.toLowerCase().indexOf(k)<0;});
});

async function main(){
  applyTheme();
  db=await loadDb();
  window.addEventListener('hashchange',()=>render());
  render();
}
main();
})();
