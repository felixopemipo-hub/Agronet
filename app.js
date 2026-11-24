'use strict';
const KEY='agronet-demo-v1',$=s=>document.querySelector(s);
let S=JSON.parse(localStorage.getItem(KEY)||'null'),loc=null,KIND='produce';
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=n=>'₦'+Number(n).toLocaleString();
const uid=()=>Math.random().toString(36).slice(2,9);
const usr=id=>S.users.find(u=>u.id===id),port=id=>S.ports.find(p=>p.id===id);
const me=()=>usr(S.me);
const here=()=>loc||(S&&me()?{lat:me().lat,lng:me().lng}:{lat:7.2986,lng:5.1394});
const km=(a,b)=>{const r=Math.PI/180,x=(b.lng-a.lng)*r*Math.cos((a.lat+b.lat)*r/2),y=(b.lat-a.lat)*r;return Math.hypot(x,y)*6371};
const map=(l)=>`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`;
const avg=u=>u.ratings.length?u.ratings.reduce((a,b)=>a+b,0)/u.ratings.length:0;
const badge=u=>!u.ratings.length?'':(u.ratings.length>=3&&avg(u)>=4.5?'<span class=bdg>Top rated</span>':`<span class=bdg>★ ${avg(u).toFixed(1)}</span>`);
const pq=p=>S.orders.filter(o=>o.port===p.id&&o.status==='pending').reduce((a,o)=>a+o.qty,0);
const NUT={tomato:'Per 100 g: about 18 kcal. Vitamin C, potassium, lycopene.',pepper:'Per 100 g: about 40 kcal. Very high in vitamin C and A.',egusi:'Per 100 g: about 560 kcal. Protein, healthy fats, zinc, magnesium.',yam:'Per 100 g: about 118 kcal. Carbohydrate, potassium, vitamin C.',ugu:'Per 100 g: about 24 kcal. Iron, vitamin A, vitamin C, calcium.',beans:'Per 100 g cooked: about 130 kcal. Protein, fibre, iron.',maize:'Per 100 g: about 96 kcal. Carbohydrate, fibre, B vitamins.',cassava:'Per 100 g: about 160 kcal. Carbohydrate, vitamin C.',plantain:'Per 100 g: about 122 kcal. Potassium, vitamin A and C.',egg:'Per egg: about 70 kcal. Protein, vitamin B12, choline.'};
const nut=n=>{const k=Object.keys(NUT).find(k=>n.toLowerCase().includes(k));return k?NUT[k]:'No nutrition details added for this item yet.'};
const needLogin=()=>`<div class=msg>Please <a href="#register">register or log in</a> first.</div>`;

function seed(){
  const o=here(),at=(dx,dy)=>({lat:o.lat+dy/111,lng:o.lng+dx/111});
  const u=(id,name,phone,role,skills,p)=>({id,name,phone,age:40,field:'Farmer',role,skills,photo:'',...p,strikes:0,reports:0,banned:false,ratings:[]});
  S={me:null,orders:[],reports:[],users:[
    u('d1','Mama Tola','08011110001','seller',[],at(1,1)),
    u('d2','Alhaji Musa','08011110002','seller',[],at(3,-2)),
    u('d3','Engr. Bisi','08011110003','seller',['Tractor mechanic'],at(2,4)),
    u('d4','Dr. Ife','08011110004','seller',['Veterinary doctor'],at(-6,3))],
  ports:[
    {id:'p1',seller:'d1',kind:'produce',name:'Fresh tomatoes',unit:'kg',price:1800,qty:20,mins:120,on:true,emoji:'🍅'},
    {id:'p2',seller:'d1',kind:'produce',name:'Egusi (melon seed)',unit:'congo',price:1500,qty:5,mins:120,on:true,emoji:'🌰'},
    {id:'p3',seller:'d2',kind:'produce',name:'Yam tubers',unit:'tuber',price:2500,qty:30,mins:180,on:true,emoji:'🍠'},
    {id:'p4',seller:'d2',kind:'produce',name:'Ugu leaves',unit:'bunch',price:300,qty:40,mins:60,on:true,emoji:'🥬'},
    {id:'p5',seller:'d3',kind:'service',name:'Tractor repair',unit:'day',price:15000,qty:3,mins:240,on:true,emoji:'🚜'},
    {id:'p6',seller:'d4',kind:'service',name:'Livestock vet visit',unit:'visit',price:8000,qty:5,mins:240,on:true,emoji:'🩺'}]};
  save();
}

function head(){
  const m=S.me&&me();
  $('#who').innerHTML=m?`${esc(m.name)} <button onclick="logout()">Log out</button>`:'<a href="#register">Register / log in</a>';
  const h=location.hash.slice(1)||'home';
  document.querySelectorAll('#nav a').forEach(a=>a.toggleAttribute('aria-current',a.hash==='#'+h));
}
function logout(){S.me=null;save();location.hash='home';route()}

function route(){
  const h=location.hash.slice(1)||'home';
  ({home,register,market:()=>listing('produce'),hire:()=>listing('service'),sell,orders,complaint,report}[h]||home)();
  head();
}

function home(){
  const L=S.ports.filter(p=>p.kind==='produce'&&p.on).map(p=>({p,d:km(here(),usr(p.seller))})).sort((a,b)=>a.d-b.d).slice(0,5);
  $('#app').innerHTML=`<section class=hero><div><h1>Buy and sell farm produce from people near you.</h1>
  <p>List your harvest, reserve what you need, and walk to the seller. Need a tractor mechanic or a vet? Hire one from the same map.</p>
  <p><a class=btn href="#market">Browse the market</a> <a class="btn" style="background:var(--maize);color:var(--ink)" href="#register">Create an account</a></p></div>
  <div class=board><h3>Nearest to you today</h3>${L.map(x=>`<div><span>${esc(x.p.name)}</span><span>${N(x.p.price)}/${esc(x.p.unit)} · ${x.d.toFixed(1)} km</span></div>`).join('')}</div></section>
  <h2>Everything in one place</h2><p><b>Market</b> for produce, <b>Hire</b> for labour, equipment and advice, and <b>Complaints</b> to reach the right agency.</p>`;
}

/* ---------- Registration ---------- */
function register(){
  const m=me();
  if(m){$('#app').innerHTML=`<h1>Hello, ${esc(m.name)}</h1><p>You are registered as a ${esc(m.role)}.</p><p><a class=btn href="#market">Go to the market</a></p>`;return}
  const l=loc||{lat:'',lng:''};
  $('#app').innerHTML=`<h1>Register</h1><form onsubmit="reg(event)">
  <label>Photo of you</label><input id=ph type=file accept="image/*" capture="user" required>
  <label>Full name</label><input id=nm required>
  <label>Phone number</label><input id=tel type=tel required>
  <label>Age</label><input id=age type=number min=16 max=100 required>
  <label>Field or job</label><input id=fld placeholder="e.g. Vegetable farmer" required>
  <label>I want to</label><div class=radio><label><input type=radio name=role value=buyer checked> Buy</label><label><input type=radio name=role value=seller> Sell</label><label><input type=radio name=role value=both> Both</label></div>
  <label>Agricultural skills you can be hired for (optional)</label><input id=sk placeholder="e.g. Tractor mechanic, Land clearing">
  <label>Location</label><button type=button class=alt onclick="getLoc()">Use my phone's location</button>
  <p id=ll class=sub>${l.lat?'Location captured.':'Location not captured yet.'}</p>
  <input type=hidden id=lat value="${l.lat}"><input type=hidden id=lng value="${l.lng}">
  <p><button>Create account</button></p></form>
  <h2>Already registered?</h2><form onsubmit="login(event)"><label>Phone number</label><input id=lt type=tel required><p><button class=alt>Log in</button></p></form>`;
}
function getLoc(){
  if(!navigator.geolocation)return alert('Location is not available on this device.');
  navigator.geolocation.getCurrentPosition(p=>{loc={lat:p.coords.latitude,lng:p.coords.longitude};$('#lat').value=loc.lat;$('#lng').value=loc.lng;$('#ll').textContent='Location captured.'},()=>alert('Allow location access in your browser, then try again.'));
}
function shrink(file){return new Promise((res,rej)=>{const r=new FileReader();r.onerror=rej;r.onload=()=>{const i=new Image();i.onerror=rej;i.onload=()=>{const k=Math.min(1,480/i.width),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.7))};i.src=r.result};r.readAsDataURL(file)})}
async function reg(e){
  e.preventDefault();
  const tel=$('#tel').value.trim();
  if(S.users.some(u=>u.phone===tel))return alert('This phone number already has an account. Log in instead. One person can only have one account.');
  if(!$('#lat').value)return alert('Tap "Use my phone\'s location" so we can show what is near you.');
  const u={id:uid(),name:$('#nm').value.trim(),phone:tel,age:+$('#age').value,field:$('#fld').value.trim(),role:document.querySelector('[name=role]:checked').value,skills:$('#sk').value.split(',').map(s=>s.trim()).filter(Boolean),photo:await shrink($('#ph').files[0]),lat:+$('#lat').value,lng:+$('#lng').value,strikes:0,reports:0,banned:false,ratings:[]};
  S.users.push(u);S.me=u.id;save();location.hash=u.role==='buyer'?'market':'sell';route();
}
function login(e){e.preventDefault();const u=S.users.find(u=>u.phone===$('#lt').value.trim());if(!u)return alert('No account with this phone number.');S.me=u.id;save();location.hash='market';route()}

/* ---------- Market and Hire ---------- */
function listing(kind){
  KIND=kind;const svc=kind==='service';
  $('#app').innerHTML=`<h1>${svc?'Hire help':'Market'}</h1><div class=ctl>
  <input id=q type=search placeholder="${svc?'Search skills or names':'Search produce or sellers'}" aria-label=Search oninput=results()>
  <select id=r aria-label="Distance" onchange=results()><option value=2>Within 2 km</option><option value=1>Within 1 km</option><option value=5>Within 5 km</option><option value=10>Within 10 km</option><option value=50>Within 50 km</option><option value=0>Any distance</option></select></div><div id=res class=grid></div>`;
  results();
}
function results(){
  const q=$('#q').value.toLowerCase(),r=+$('#r').value,o=here();
  const L=S.ports.filter(p=>p.kind===KIND&&p.on&&!usr(p.seller).banned&&(!q||(p.name+usr(p.seller).name).toLowerCase().includes(q))).map(p=>({p,d:km(o,usr(p.seller))})).filter(x=>!r||x.d<=r).sort((a,b)=>a.d-b.d);
  $('#res').innerHTML=L.map(x=>card(x.p,x.d)).join('')||'<p class=empty>Nothing within this distance. Widen the distance or try another search.</p>';
}
function card(p,d){
  const s=usr(p.seller),pend=S.orders.filter(o=>o.port===p.id&&o.status==='pending'),q=pq(p),svc=p.kind==='service';
  return `<article class=card>${p.img?`<img src="${p.img}" alt="${esc(p.name)}">`:`<div class=ph aria-hidden=true>${p.emoji||'🌾'}</div>`}<div class=cb>
  <h3>${esc(p.name)}</h3><p class=sub>${esc(s.name)} ${badge(s)} · ${d.toFixed(1)} km</p>
  <p><b>${N(p.price)}</b> per ${esc(p.unit)}</p><p>${p.qty} ${esc(p.unit)} ${svc?'available':'in stock'}${q?` · ${q} pending`:''}</p>
  ${pend.length?`<ul class=pend>${pend.map(o=>`<li>${o.qty} ${esc(p.unit)} pending until ${new Date(o.deadline).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</li>`).join('')}</ul>`:''}
  <details><summary>Nutrition</summary><p>${nut(p.name)}</p></details>
  <div class=row><span class=sub>${p.qty-q} left to reserve</span><button onclick="openOrder('${p.id}')">${svc?'Book':'Order'}</button></div></div></article>`;
}
function openOrder(id){
  const m=me();if(!m){location.hash='register';return}
  if(m.banned)return alert('Your account is restricted after repeated reports.');
  const p=port(id),svc=p.kind==='service',free=p.qty-pq(p);
  if(p.seller===m.id)return alert('You cannot order from your own listing.');
  if(free<=0)return alert('Everything is already reserved. Check back when pending orders expire.');
  $('#dlg').innerHTML=`<h3>${svc?'Book':'Order'} ${esc(p.name)}</h3><p class=sub>${N(p.price)} per ${esc(p.unit)} · ${free} ${esc(p.unit)} left to reserve</p>
  <label>How many ${esc(p.unit)}?</label><input id=oq type=number min=1 max=${free} value=1>
  <label>${svc?'Where':'How'}</label><select id=ot><option value=pickup>${svc?'I go to the provider (no extra charge)':'I pick it up (no extra charge)'}</option><option value=delivery>${svc?'Provider comes to me (extra charge)':'Deliver to me (extra charge)'}</option></select>
  <p class=sub>Pay the seller directly. Delivery adds ₦200 plus ₦100 per km. Not collecting after ordering gets you reported.</p>
  <div class=row><button class=alt onclick="$('#dlg').close()">Cancel</button><button onclick="placeOrder('${id}')">Place order</button></div>`;
  $('#dlg').showModal();
}
function placeOrder(id){
  const p=port(id),m=me(),q=+$('#oq').value,t=$('#ot').value,d=km(m,usr(p.seller)),free=p.qty-pq(p);
  if(!(q>0)||q>free)return alert(`You can reserve at most ${free} ${p.unit}.`);
  const pend=S.orders.filter(o=>o.port===id&&o.status==='pending').length;
  if(pend>=(t==='delivery'&&d>10?2:5))return alert('Too many pending orders on this listing. Try again later.');
  S.orders.push({id:uid(),port:id,buyer:m.id,qty:q,type:t,fee:t==='delivery'?Math.round(200+100*d):0,deadline:Date.now()+p.mins*60000,status:'pending',rated:{}});
  save();$('#dlg').close();location.hash='orders';route();
}

/* ---------- Orders ---------- */
function orders(){
  const m=me();if(!m){$('#app').innerHTML=needLogin();return}
  const mine=S.orders.filter(o=>o.buyer===m.id),inc=S.orders.filter(o=>port(o.port).seller===m.id);
  $('#app').innerHTML=`<h1>Orders</h1><h2>Things I ordered</h2>${mine.map(o=>row(o,'buyer')).join('')||'<p class=empty>No orders yet. Browse the market to reserve something.</p>'}
  <h2>Orders on my listings</h2>${inc.map(o=>row(o,'seller')).join('')||'<p class=empty>No one has ordered from you yet.</p>'}`;
}
function row(o,role){
  const p=port(o.port),s=usr(p.seller),b=usr(o.buyer),due=o.status==='pending'&&Date.now()>o.deadline;
  const target=role==='buyer'?s:b,link=o.type==='delivery'&&role==='seller'?b:s;
  const stat={pending:due?'Time is up. Waiting for the seller to confirm.':'Pending until '+new Date(o.deadline).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),completed:'Completed',cancelled:'Cancelled'}[o.status];
  return `<div class="ord${due?' due':''}"><p><b>${o.qty} ${esc(p.unit)} of ${esc(p.name)}</b> · ${N(o.qty*p.price+o.fee)}${o.fee?` (includes ${N(o.fee)} delivery)`:''}</p>
  <p class=sub>${role==='buyer'?'Seller: '+esc(s.name)+' · '+esc(s.phone):'Buyer: '+esc(b.name)+' · '+esc(b.phone)} · ${o.type==='delivery'?'Delivery':'Pickup'} · ID ${o.id}</p><p>${stat}</p>
  ${o.status==='pending'?`<p><a href="${map(link)}" target=_blank rel=noopener>Open ${o.type==='delivery'&&role==='seller'?'buyer':'seller'} location in Google Maps</a></p>`:''}
  ${role==='seller'&&o.status==='pending'?`${due?`<p class=sms>SMS to you: Did ${esc(b.name)} collect ${o.qty} ${esc(p.unit)} of ${esc(p.name)} (${N(p.price)} each, order ${o.id})?</p>`:''}<button onclick="conf('${o.id}',true)">Yes, collected</button> <button class=bad onclick="conf('${o.id}',false)">No, cancel</button>`:''}
  ${o.status==='completed'&&!o.rated[role]?`<p>Rate ${esc(target.name)}: ${[1,2,3,4,5].map(n=>`<button class=alt onclick="rate('${o.id}','${role}',${n})">${n}</button>`).join(' ')}</p>`:''}</div>`;
}
function conf(id,ok){
  const o=S.orders.find(x=>x.id===id),p=port(o.port),b=usr(o.buyer);
  if(ok){o.status='completed';p.qty=Math.max(0,p.qty-o.qty)}
  else{o.status='cancelled';b.strikes++;if(b.strikes>=3)b.banned=true}
  save();orders();
}
function rate(id,role,n){const o=S.orders.find(x=>x.id===id);usr(role==='buyer'?port(o.port).seller:o.buyer).ratings.push(n);o.rated[role]=1;save();orders()}

/* ---------- My listings ---------- */
function sell(){
  const m=me();if(!m){$('#app').innerHTML=needLogin();return}
  if(m.role==='buyer'){$('#app').innerHTML=`<h1>My listings</h1><p class=msg>Your account is set up as a buyer. Register a seller account to list produce or services.</p>`;return}
  const mine=S.ports.filter(p=>p.seller===m.id);
  $('#app').innerHTML=`<h1>My listings</h1>${mine.map(p=>`<div class=ord><p><b>${esc(p.name)}</b> · ${N(p.price)} per ${esc(p.unit)} · ${p.qty} left</p><button class=alt onclick="del('${p.id}')">Remove</button></div>`).join('')||'<p class=empty>You have no listings yet.</p>'}
  <h2>Add a listing</h2><p class=sub>One listing is one product or one service. A small listing fee applies (demo: no real payment).</p>
  <form onsubmit="addPort(event)"><label>Type</label><select id=pk><option value=produce>Produce</option><option value=service>Service (hire)</option></select>
  <label>Name</label><input id=pn required><label>Real photo (no stock images, even if it looks plain)</label><input id=pi type=file accept="image/*" required>
  <label>Price (₦)</label><input id=pp type=number min=1 required><label>Unit (e.g. cup, congo, kg, day)</label><input id=pu required>
  <label>Quantity available</label><input id=pqty type=number min=1 required><label>Minutes a buyer has to collect</label><input id=pm type=number min=15 value=120 required>
  <p><button>Pay listing fee and publish</button></p></form>`;
}
async function addPort(e){
  e.preventDefault();const m=me();
  if(m.banned)return alert('Your account is restricted.');
  if(!confirm('Pay the ₦500 listing fee? (Demo: no money is charged.)'))return;
  S.ports.push({id:uid(),seller:m.id,kind:$('#pk').value,name:$('#pn').value.trim(),img:await shrink($('#pi').files[0]),price:+$('#pp').value,unit:$('#pu').value.trim(),qty:+$('#pqty').value,mins:+$('#pm').value,on:true});
  save();sell();
}
function del(id){S.ports=S.ports.filter(p=>p.id!==id);save();sell()}

/* ---------- Complaints ---------- */
const ADV=[[/pest|worm|insect|locust|armyworm|aphid/,'Pests','Scout early in the morning, remove and destroy badly hit plants, and use a registered pesticide at the labelled rate. Do not mix chemicals yourself.','Nigeria Agricultural Quarantine Service (NAQS)'],[/wilt|blight|disease|fung|rot|leaf spot|mildew/,'Crop disease','Remove infected plants, avoid working in wet fields, rotate crops next season, and keep tools clean.','State Agricultural Development Programme (ADP)'],[/fake|expired|fertili[sz]er|seed|chemical|nafdac/,'Product quality','Keep the receipt and packaging, photograph the label and batch number, and stop using the product.','NAFDAC'],[/land|boundary|dispute|herder|encroach/,'Land','Write down dates and witnesses, keep copies of land documents, and report to your community head before any confrontation.','State Ministry of Agriculture / Lands'],[/flood|drought|rain|dry/,'Weather','Drain or mulch the field, protect seed stock, and consider quick-growing crops for the rest of the season.','State Agricultural Development Programme (ADP)']];
function complaint(){
  const m=me();if(!m){$('#app').innerHTML=needLogin();return}
  $('#app').innerHTML=`<h1>Complaints</h1><form onsubmit="adv(event)"><label>What is the problem?</label><textarea id=ct rows=5 required placeholder="Describe what happened, the crop or animal, and when it started."></textarea><p><button>Get advice</button></p></form><div id=out></div>`;
}
function adv(e){
  e.preventDefault();const t=$('#ct').value,m=me(),a=ADV.find(x=>x[0].test(t.toLowerCase()))||[0,'General','We could not match this to a known problem, so it is best sent to an agency.','State Agricultural Development Programme (ADP)'];
  const body=`${t}\n\nFarmer: ${m.name}\nPhone: ${m.phone}\nLocation: https://www.google.com/maps?q=${m.lat},${m.lng}`;
  $('#out').innerHTML=`<div class=msg><h3>${a[1]}: first steps</h3><p>${a[2]}</p><p>Still not solved? Send it to <b>${a[3]}</b> with your phone number and location attached.</p>
  <a class=btn href="mailto:?subject=${encodeURIComponent('Farmer complaint: '+a[1])}&body=${encodeURIComponent(body)}">Write email to agency</a></div>`;
}

/* ---------- Reports ---------- */
function report(){
  const m=me();if(!m){$('#app').innerHTML=needLogin();return}
  $('#app').innerHTML=`<h1>Report or comment</h1><form onsubmit="rep(event)"><label>Who are you reporting?</label><select id=rt>${S.users.filter(u=>u.id!==m.id).map(u=>`<option value=${u.id}>${esc(u.name)} (${esc(u.phone)})</option>`).join('')}</select>
  <label>What happened?</label><select id=rr><option>Listed unavailable goods</option><option>Poor quality produce</option><option>Ordered but never came</option><option>Used a fake photo</option><option>Other</option></select>
  <label>Details</label><textarea id=rd rows=4></textarea><p><button>Send report</button></p></form><div id=out></div>`;
}
function rep(e){
  e.preventDefault();const u=usr($('#rt').value);
  S.reports.push({by:S.me,on:u.id,why:$('#rr').value,text:$('#rd').value});
  u.reports++;if(u.reports>=3)u.banned=true;save();
  $('#out').innerHTML='<p class=msg>Report sent. Accounts with repeated reports are suspended.</p>';
}

/* ---------- Start ---------- */
const go=()=>{if(!S)seed();route()};
addEventListener('hashchange',route);
navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>{loc={lat:p.coords.latitude,lng:p.coords.longitude};go()},go,{timeout:6000}):go();
