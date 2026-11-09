'use strict';
// Dead Scribble: independent, dependency-free HTML5 Canvas version for GitHub Pages.
const cv=document.getElementById('game'),g=cv.getContext('2d');
const overlay=document.getElementById('overlay'),side=document.getElementById('sidePanel'),hud=document.getElementById('hud');
const statusLeft=document.getElementById('statusLeft'),statusRight=document.getElementById('statusRight'),gearStatus=document.getElementById('gearStatus'),keyStatus=document.getElementById('keyStatus');
const uiToggle=document.getElementById('uiToggle'),toastBox=document.getElementById('toast');
const CW=1100,CH=670,WW=2110,WH=1530;cv.width=CW;cv.height=CH;
const SHOP={x:882,y:210,w:375,h:255,doorX:1069,doorW:94};
const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),rnd=(a,b)=>a+Math.random()*(b-a),irnd=(a,b)=>Math.floor(rnd(a,b+1));
const norm=(x,y)=>{let n=Math.hypot(x,y)||1;return{x:x/n,y:y/n}};
const KEYS=new Set();let firing=false,mouse={x:CW/2,y:CH/2},lastTime=0,now=0,toastUntil=0,hudLast=0,hideHud=false;
const MAT={wood:'🪵',metal:'🔩',cloth:'🧶',gear:'⚙',stone:'🪨'};
const WEAPONS={
 fists:{label:'Fists',damage:13,rate:.36,range:50,melee:true,arc:1.35,color:'#f9a25c'},
 bat:{label:'Wood Bat',damage:51,rate:.37,range:83,melee:true,arc:1.45,color:'#9b703f'},
 spear:{label:'Spear',damage:68,rate:.52,range:116,melee:true,arc:.66,color:'#a88242'},
 spiked:{label:'Spiked Bat',damage:98,rate:.40,range:91,melee:true,arc:1.45,color:'#bd9a6e'},
 pistol:{label:'Pistol',damage:57,rate:.29,mag:12,reload:1.15,speed:920,color:'#525c68'},
 shotgun:{label:'Shotgun',damage:24,rate:.75,mag:7,reload:1.55,pellets:6,spread:.45,speed:790,color:'#685a51'},
 smg:{label:'SMG',damage:23,rate:.10,mag:34,reload:1.3,spread:.10,speed:970,color:'#596b71'},
 rifle:{label:'Ranger Rifle',damage:120,rate:.54,mag:15,reload:1.5,pierce:1,speed:1100,color:'#4b666b'},
 storm:{label:'Storm Shotgun',damage:27,rate:.47,mag:10,reload:1.5,pellets:10,spread:.39,speed:970,color:'#586e5b'},
 laser:{label:'PRISM ERASER',damage:245,rate:.11,mag:Infinity,reload:0,laser:true,color:'#d93cba'}
};
const RECIPES=[
 {id:'spear',group:'weapons',name:'Carved Spear',desc:'Long-reaching stabbing weapon.',cost:{wood:4,metal:1}},
 {id:'spiked',group:'weapons',name:'Spiked Bat',desc:'A heavier, meaner bat.',cost:{wood:3,metal:2}},
 {id:'pistol',group:'weapons',name:'Scrap Pistol',desc:'Reliable handgun.',cost:{metal:4,gear:2}},
 {id:'shotgun',group:'weapons',name:'Scrap Shotgun',desc:'Devastating at close range.',cost:{metal:5,gear:2,wood:1}},
 {id:'smg',group:'weapons',name:'Rattle SMG',desc:'Very fast fire rate.',cost:{metal:7,gear:4}},
 {id:'rifle',group:'weapons',name:'Ranger Rifle',desc:'Long range and piercing.',cost:{metal:8,gear:4,wood:2}},
 {id:'storm',group:'weapons',name:'Storm Shotgun',desc:'Even more pellets.',cost:{metal:10,gear:6}},
 {id:'woodwall',group:'defenses',name:'Wood Barricade',desc:'Simple blocking wall.',cost:{wood:4,cloth:1}},
 {id:'wire',group:'defenses',name:'Barbed-Wire Fence',desc:'Slows and damages zombies.',cost:{wood:3,metal:2}},
 {id:'stonewall',group:'defenses',name:'Stone Wall',desc:'Very tough protection.',cost:{stone:6,metal:2}},
 {id:'sentry',group:'defenses',name:'Sentry Turret',desc:'Auto-targeting little turret.',cost:{metal:4,gear:3}},
 {id:'sentry2',group:'defenses',name:'Sentry Mk II',desc:'Faster upgraded turret.',cost:{metal:7,gear:5}},
 {id:'bandage',group:'supplies',name:'Bandage × 2',desc:'Heal on the move.',cost:{cloth:3}},
 {id:'ammo',group:'supplies',name:'Ammo Pack',desc:'Restock both players.',cost:{metal:1,gear:1}},
 {id:'materials',group:'supplies',name:'Field Salvage',desc:'Trade wood for metal and gears.',cost:{wood:8}}
];
const UPGRADE_POOL=[
 {id:'damage',title:'BIGGER BONK',emoji:'💥',text:'+20% weapon damage.'},
 {id:'health',title:'TOUGH COOKIE',emoji:'❤️',text:'+30 max HP and heal 30.'},
 {id:'armor',title:'RUSTY ARMOUR',emoji:'🛡',text:'Take 15% less damage.'},
 {id:'speed',title:'QUICK FEET',emoji:'👟',text:'+15% run speed.'},
 {id:'rate',title:'TRIGGER HAPPY',emoji:'⚡',text:'Weapons attack 17% faster.'},
 {id:'reload',title:'FAST HANDS',emoji:'🔁',text:'Reload 23% faster.'},
 {id:'swing',title:'WIDE SWING',emoji:'🏏',text:'Melee strikes have more reach.'},
 {id:'lifesteal',title:'SECOND HELPINGS',emoji:'🩹',text:'Heal when you defeat a zombie.'},
 {id:'pierce',title:'PUNCH THROUGH',emoji:'🎯',text:'Bullets pierce one extra zombie.'},
 {id:'turret',title:'TINKERER',emoji:'🔧',text:'Turrets deal 30% more damage.'},
 {id:'dash',title:'SKETCHY DODGE',emoji:'💨',text:'Dash cooldown 25% shorter.'},
 {id:'heal',title:'FIELD MEDIC',emoji:'💊',text:'Heal everyone fully; +1 bandage.'},
 {id:'ammo',title:'BULLET BONANZA',emoji:'📦',text:'+50 spare rounds each.'},
 {id:'stone',title:'STONE STASH',emoji:'🪨',text:'+7 stone and +2 wood.'},
 {id:'scrap',title:'LUCKY SCAVENGER',emoji:'🔩',text:'+2 metal and +3 gears.'},
 {id:'focus',title:'INK RUSH BOOST',emoji:'✨',text:'Ink Rush lasts 4 seconds longer.'}
];
const ENEMY={
 walker:{name:'Wobbler',hp:74,speed:74,dmg:13,rad:17,color:'#9bc476',score:40},
 runner:{name:'Scribble Sprinter',hp:52,speed:138,dmg:11,rad:13,color:'#83bd69',score:60},
 brute:{name:'Big Blob',hp:230,speed:55,dmg:25,rad:26,color:'#71926c',score:120},
 armored:{name:'Tin-Head',hp:178,speed:65,dmg:15,rad:18,color:'#8ba2a3',score:90,armor:.60},
 spitter:{name:'Acid Splat',hp:98,speed:77,dmg:9,rad:17,color:'#abd06f',score:90},
 exploder:{name:'Popper',hp:85,speed:107,dmg:22,rad:20,color:'#e3ad68',score:105},
 scrapjaw:{name:'SCRAPJAW',hp:2400,speed:68,dmg:26,rad:48,color:'#a87965',score:1700,boss:true},
 inkking:{name:'THE INK KING',hp:3900,speed:87,dmg:35,rad:57,color:'#7c6c9c',score:3200,boss:true}
};
let s={screen:'home',players:[],zombies:[],bullets:[],pickups:[],crates:[],structures:[],particles:[],hazards:[],materials:{wood:0,metal:0,cloth:0,gear:0,stone:0},kits:{woodwall:0,wire:0,stonewall:0,sentry:0,sentry2:0},unlocked:new Set(['bat']),mode:1,wave:1,queue:0,spawnTimer:0,bossPending:false,clock:0,roundWait:0,combo:0,comboTime:0,bestCombo:0,rush:0,kills:0,score:0,drops:0,supply:null,rolls:0,upgrades:[],tab:'weapons',crafter:0,craftOpen:false,cheatOpen:false,countdown:0,cheats:{speed:false,invuln:false,guns:false,laser:false,defenses:false},buff:{damage:1,armor:0,speed:1,rate:1,reload:1,melee:1,pierce:0,turret:1,dash:1,lifesteal:0,rush:0},cam:{x:0,y:0},placeIndex:0,ambush:0};
const DEF_KEYS=['woodwall','wire','stonewall','sentry','sentry2'],DEF_LABEL={woodwall:'Wood',wire:'Wire',stonewall:'Stone',sentry:'Sentry',sentry2:'Mk II'};
function player(num){return{id:num,x:1025+num*52,y:750+num*24,r:16,hp:115,maxHp:115,angle:0,weapon:'bat',ammo:{},reserve:180,bandages:1,atk:0,atkd:0,anim:0,reload:0,dash:0,dashFx:0,hitCd:0,down:false,revive:0,moveX:0,moveY:0};}
function say(msg,duration=2300){toastBox.textContent=msg;toastBox.classList.add('show');toastUntil=performance.now()+duration}
function showOverlay(html,wide=false){overlay.classList.add('visible');overlay.innerHTML=`<div class="sheet ${wide?'wide':''}">${html}</div>`}
function hideOverlay(){overlay.classList.remove('visible');overlay.innerHTML=''}
function btn(label,action,kind=''){return `<button class="button ${kind}" data-action="${action}">${label}</button>`}
function readBest(){try{return Number(localStorage.getItem('deadScribbleBest')||0)}catch{return 0}}
function saveBest(){try{localStorage.setItem('deadScribbleBest',Math.max(s.score,readBest()))}catch{}}
function showHome(){s.screen='home';firing=false;showOverlay(`<div class="tagline">✎ hand-drawn survival game ✎</div><h1>DEAD SCRIBBLE</h1><p class="subtitle">A very sketchy apocalypse. The undead have terrible handwriting.</p><div class="row">${btn('🧟 SOLO SURVIVAL','solo','primary')}${btn('🧟‍♂️🧟 TWO PLAYER CO-OP','coop','orange')}${s.players.length?btn('▶ CONTINUE','continue'):''}${btn('HOW TO PLAY','help')}</div><div class="rule"></div><p class="help"><strong>Start with a bat.</strong> Find supplies, enter the safe Scrap & Stitch workshop to craft stronger weapons and defenses, survive 10 waves, and beat two bosses. Each round earns one upgrade. Zombies are waiting!</p><span class="pill">🏆 BEST SCORE ${readBest().toLocaleString()}</span><span class="pill">🌅 DAWN AFTER WAVE 10</span>`)}
function showHelp(){showOverlay(`<h2>HOW TO SURVIVE</h2><p class="section-note">Play side-by-side with a friend on the same keyboard, or go solo.</p><div class="grid"><div><h3 class="color-1">PLAYER 1</h3><p class="help"><b>WASD</b> Move<br><b>Mouse + click / J</b> Aim and attack<br><b>Space</b> Dash<br><b>R</b> Reload<br><b>E</b> Open crate / enter workbench / revive<br><b>C</b> Craft at workshop<br><b>F</b> Bandage<br><b>B</b> Place defense<br><b>V</b> Switch defense<br><b>1–9</b> Switch weapon</p></div><div><h3 class="color-2">PLAYER 2</h3><p class="help"><b>Arrow keys</b> Move<br><b>Enter</b> Auto-aim attack<br><b>Right Shift</b> Dash<br><b>K</b> Reload<br><b>M</b> Interact / revive / craft<br><b>L</b> Bandage<br><b>,</b> Place defense<br><b>.</b> Switch defense<br><b>N</b> Switch weapon</p></div><div><h3>FIELD NOTES</h3><p class="help"><b>H</b> Hide/show HUD<br><b>Esc</b> Pause game<br><b>Workshop</b> The marked building. Walk inside for total safety.<br><b>Upgrade shop</b> Between waves: one free choice, reroll with metal.<br><b>Crates</b> Open nearby with interact. Supply drops vanish quickly.<br><b>Teammate down?</b> Hold interact nearby to revive.</p></div></div><div class="rule"></div>${btn('← BACK','home','primary')}`,true)}
function startGame(mode=1){
 s={...s,screen:'play',mode,players:[player(0),...(mode===2?[player(1)]:[])],zombies:[],bullets:[],pickups:[],crates:[],structures:[],particles:[],hazards:[],materials:{wood:5,metal:0,cloth:2,gear:0,stone:2},kits:{woodwall:0,wire:0,stonewall:0,sentry:0,sentry2:0},unlocked:new Set(['bat']),wave:1,queue:0,bossPending:false,clock:0,roundWait:0,combo:0,comboTime:0,bestCombo:0,rush:0,kills:0,score:0,drops:0,supply:null,rolls:0,upgrades:[],tab:'weapons',crafter:0,craftOpen:false,cheatOpen:false,countdown:0,cheats:{speed:false,invuln:false,guns:false,laser:false,defenses:false},buff:{damage:1,armor:0,speed:1,rate:1,reload:1,melee:1,pierce:0,turret:1,dash:1,lifesteal:0,rush:0},cam:{x:490,y:480},placeIndex:0,ambush:0};
 for(const p of s.players) for(const [name,w] of Object.entries(WEAPONS)) if(w.mag) p.ammo[name]=w.mag;
 for(let i=0;i<22;i++)spawnPickup();for(let i=0;i<8;i++)spawnCrate();
 hideOverlay();side.hidden=true;startWave(1);say('WAVE 1 — THEY’RE ALREADY HERE!',2800);
}
function spawnPickup(x,y,type){const types=['wood','wood','wood','stone','stone','stone','cloth','cloth','gear','metal'];type=type||types[irnd(0,types.length-1)];if(!Number.isFinite(x)||!Number.isFinite(y)){x=rnd(120,WW-120);y=rnd(100,WH-100)} if(insideShop(x,y)||dist({x,y},{x:1100,y:780})<85){return spawnPickup(undefined,undefined,type)}s.pickups.push({x,y,type,life:Infinity,bob:rnd(0,7)});}
function spawnCrate(){let x=rnd(130,WW-140),y=rnd(100,WH-100);if(insideShop(x,y))return spawnCrate();s.crates.push({x,y,opened:false});}
function startWave(num){s.wave=num;s.screen='play';s.queue=8+num*5+(s.mode===2?Math.floor(num*1.5):0);s.spawnTimer=.4;s.bossPending=[5,10].includes(num);s.waveTimer=0;s.roundWait=0;s.ambush=0;s.supply={x:clamp(1080+rnd(-340,340),120,WW-130),y:clamp(760+rnd(-275,275),100,WH-100),ttl:25};if(insideShop(s.supply.x,s.supply.y))s.supply.y=SHOP.y+SHOP.h+100;for(let i=0;i<Math.min(5,s.queue);i++)spawnZombie();for(let i=0;i<4;i++)spawnPickup();}
function spawnZombie(type){if(!type){let bag=['walker','walker','walker','walker',s.wave>1?'runner':'walker',s.wave>2?'armored':'runner',s.wave>3?'spitter':'walker',s.wave>4?'exploder':'runner',s.wave>5?'brute':'walker'];type=bag[irnd(0,bag.length-1)];s.queue--;}
 let focus=s.players.find(p=>!p.down)||{x:1050,y:780},a=rnd(0,TAU),r=rnd(460,710),x=clamp(focus.x+Math.cos(a)*r,38,WW-38),y=clamp(focus.y+Math.sin(a)*r,38,WH-38);if(insideShop(x,y))y=SHOP.y+SHOP.h+70;
 const t=ENEMY[type],scale=(type==='scrapjaw'||type==='inkking')?1:1+Math.max(0,s.wave-1)*.085;
 s.zombies.push({id:Math.random(),type,x,y,r:t.rad,hp:t.hp*scale,maxHp:t.hp*scale,spd:t.speed*(1+Math.max(0,s.wave-1)*.012),cool:rnd(.1,1),shoot:rnd(.4,2),special:rnd(2,4),specialWarn:0,exploding:0,hit:0,slow:0,phase:0,angle:0});}
function insideShop(x,y){return x>SHOP.x+6&&x<SHOP.x+SHOP.w-6&&y>SHOP.y+8&&y<SHOP.y+SHOP.h-6}
function isNearShop(p){return insideShop(p.x,p.y)}
function withinCamera(x,y,pad=70){return x>=s.cam.x-pad&&x<=s.cam.x+CW+pad&&y>=s.cam.y-pad&&y<=s.cam.y+CH+pad}
function playerById(id){return s.players.find(p=>p.id===id)}
function nextWeapon(p){const available=Object.keys(WEAPONS).filter(k=>s.unlocked.has(k)||(k==='laser'&&s.cheats.laser));const k=available.indexOf(p.weapon);p.weapon=available[(k+1)%available.length]||'bat';say(`${p.id?'P2':'P1'}: ${WEAPONS[p.weapon].label}`,750)}
function equipSlot(p,slot){let list=Object.keys(WEAPONS).filter(k=>s.unlocked.has(k));if(slot>=1&&slot<=list.length){p.weapon=list[slot-1];say(`${WEAPONS[p.weapon].label}`,600)}}
function availableDefense(id){return s.cheats.defenses||s.kits[id]>0}
function cycleDefense(){s.placeIndex=(s.placeIndex+1)%DEF_KEYS.length;say(`BUILD: ${DEF_LABEL[DEF_KEYS[s.placeIndex]]}${s.cheats.defenses?' ∞':` ×${s.kits[DEF_KEYS[s.placeIndex]]}`}`,950)}
function placeDefense(p){if(!p||p.down)return;const type=DEF_KEYS[s.placeIndex];if(!availableDefense(type)){say('Craft a defense kit in the workshop!',1100);return}const x=p.x+Math.cos(p.angle)*65,y=p.y+Math.sin(p.angle)*65;if(x<50||y<50||x>WW-50||y>WH-50||insideShop(x,y)||s.structures.some(v=>dist(v,{x,y})<56)){say('Can’t place that here!',800);return}let stats={woodwall:[260,29],wire:[140,31],stonewall:[790,31],sentry:[230,23],sentry2:[370,25]}[type];s.structures.push({type,x,y,hp:stats[0],maxHp:stats[0],r:stats[1],angle:0,cd:rnd(0,.3),hitCd:0});if(!s.cheats.defenses)s.kits[type]--;say(`${DEF_LABEL[type]} placed!`,850)}
function spend(cost){return Object.entries(cost).every(([k,v])=>(s.materials[k]||0)>=v)}
function pay(cost){for(let [k,v] of Object.entries(cost))s.materials[k]-=v}
function craft(id){const recipe=RECIPES.find(r=>r.id===id);if(!recipe||!spend(recipe.cost))return;pay(recipe.cost);const p=s.players[s.crafter]||s.players[0];if(recipe.group==='weapons'){s.unlocked.add(id);p.weapon=id;for(let q of s.players){if(WEAPONS[id].mag)q.ammo[id]=WEAPONS[id].mag;q.reserve+=30}}else if(recipe.group==='defenses')s.kits[id]++;else if(id==='bandage')p.bandages+=2;else if(id==='ammo'){for(let q of s.players){q.reserve+=60;const w=WEAPONS[q.weapon];if(w.mag)q.ammo[q.weapon]=w.mag}}else if(id==='materials'){s.materials.metal+=2;s.materials.gear+=1}say(`Crafted ${recipe.name}!`,1200);showCraft();}
function costHTML(cost){return Object.entries(cost).map(([k,n])=>`${MAT[k]}${n}`).join('  ')}
function showCraft(tab=s.tab){s.tab=tab;s.craftOpen=true;const p=s.players[s.crafter]||s.players[0];let list=RECIPES.filter(r=>r.group===tab);showOverlay(`<h2>🛠 SCRAP & STITCH</h2><p class="section-note">SAFE WORKSHOP • Craft for Player ${p.id+1}. Zombies cannot enter.</p><div class="row">${['weapons','defenses','supplies'].map(t=>btn(t.toUpperCase(),`tab:${t}`,t===tab?'primary':'' )).join('')}</div><p class="help">YOUR MATERIALS: ${Object.keys(MAT).map(k=>`${MAT[k]} ${s.materials[k]}`).join(' &nbsp; ')}</p><div class="grid">${list.map(r=>`<button class="recipe" data-action="craft:${r.id}" ${!spend(r.cost)?'disabled':''}><strong>${r.name} ${s.unlocked.has(r.id)&&r.group==='weapons'?'✓':''}</strong><span>${r.desc}</span><span><em>${costHTML(r.cost)}</em></span></button>`).join('')}</div><div class="shop-footer">${btn('← EXIT WORKSHOP','closeCraft')}<span class="muted help">Defenses are placed outside with B or comma</span></div>`,true)}
function showShop(){s.screen='shop';s.upgrades=pickUpgrades();renderShop()}
function pickUpgrades(){const pool=[...UPGRADE_POOL];let picks=[];for(let i=0;i<6&&pool.length;i++){let j=irnd(0,pool.length-1);picks.push(pool.splice(j,1)[0])}return picks}
function renderShop(){showOverlay(`<div class="row" style="justify-content:space-between"><h2>WAVE ${s.wave} CLEARED!</h2><span class="pill">🎁 CHOOSE ONE FREE UPGRADE</span></div><p class="section-note">Nice work! Make your survivor stronger before the next wave.</p><div class="grid">${s.upgrades.map(u=>`<button class="upgrade-card" data-action="upgrade:${u.id}"><strong>${u.emoji} ${u.title}</strong><span>${u.text}</span></button>`).join('')}</div><div class="shop-footer"><span class="pill">🔩 METAL ${s.materials.metal}</span><button class="button orange" data-action="reroll" ${s.materials.metal<2*(s.rolls+1)?'disabled':''}>🎲 REROLL — ${2*(s.rolls+1)} METAL</button><span class="muted help">Price rises by 2 every time, even next round.</span></div>`,true)}
function applyUpgrade(id){const b=s.buff;switch(id){case'damage':b.damage*=1.2;break;case'health':for(let p of s.players){p.maxHp+=30;p.hp=Math.min(p.maxHp,p.hp+30)}break;case'armor':b.armor=clamp(b.armor+.15,0,.75);break;case'speed':b.speed*=1.15;break;case'rate':b.rate*=1.17;break;case'reload':b.reload*=.77;break;case'swing':b.melee*=1.21;break;case'lifesteal':b.lifesteal+=5;break;case'pierce':b.pierce++;break;case'turret':b.turret*=1.3;break;case'dash':b.dash*=.75;break;case'heal':for(let p of s.players){p.hp=p.maxHp;p.bandages++}break;case'ammo':for(let p of s.players)p.reserve+=50;break;case'stone':s.materials.stone+=7;s.materials.wood+=2;break;case'scrap':s.materials.metal+=2;s.materials.gear+=3;break;case'focus':b.rush+=4;break;}}
function finishWave(){if(s.wave>=10){s.screen='win';saveBest();showOverlay(`<h1>🌅 DAWN!</h1><p class="subtitle">You survived ten terrifying waves and lived to tell the tale!</p><h3>🏆 SCORE ${s.score.toLocaleString()}</h3><p>Kills: <b>${s.kills}</b> &nbsp;•&nbsp; Best chain: <b>${s.bestCombo}</b> &nbsp;•&nbsp; Supply drops: <b>${s.drops}</b></p><div class="row">${btn('🔁 PLAY AGAIN','restart','primary')}${btn('♾ ENDLESS MODE','endless','orange')}${btn('HOME','home')}</div>`)}else showShop()}
function endRun(){if(s.screen==='lose')return;s.screen='lose';saveBest();showOverlay(`<h1>YOU GOT SCRIBBLED!</h1><p class="subtitle">The horde got you on wave ${s.wave}. Try a different build next time!</p><h3>SCORE ${s.score.toLocaleString()}</h3><p>${s.kills} zombies defeated • Best chain ${s.bestCombo} • ${s.drops} supply drops</p><div class="row">${btn('TRY AGAIN','restart','primary')}${btn('HOME','home')}</div>`)}
function toggleCheats(){if(s.screen!=='play'&&s.screen!=='pause')return;s.cheatOpen=!s.cheatOpen;side.hidden=!s.cheatOpen;if(s.cheatOpen)renderCheats()}
function renderCheats(){side.innerHTML=`<h3>✦ DEV SCRIBBLES ✦</h3><small>Shh. The eraser has secrets. Close with / or Esc.</small>${[['speed','⚡ SUPER SPEED'],['invuln','🛡 INVINCIBILITY'],['guns','🔫 ALL WEAPONS + AMMO'],['laser','✨ PRISM ERASER'],['defenses','♾ INFINITE DEFENSES']].map(([key,label])=>`<button data-action="cheat:${key}" class="${s.cheats[key]?'on':''}">${label} <span style="float:right">${s.cheats[key]?'ON':'OFF'}</span></button>`).join('')}`}
function cheatToggle(id){s.cheats[id]=!s.cheats[id];if(id==='guns'&&s.cheats[id]){Object.keys(WEAPONS).filter(k=>k!=='laser').forEach(k=>s.unlocked.add(k));for(let p of s.players){p.reserve=999;for(let w in WEAPONS)if(WEAPONS[w].mag)p.ammo[w]=WEAPONS[w].mag;}}
if(id==='laser'&&s.cheats[id]){s.unlocked.add('laser');for(let p of s.players)p.weapon='laser'}
if(id==='invuln'&&s.cheats[id])for(let p of s.players){p.hp=p.maxHp;p.down=false}
renderCheats()}
function interact(p){if(!p||p.down)return;let partner=s.players.find(q=>q!==p&&q.down&&dist(p,q)<82);if(partner)return;
let turret=s.structures.find(x=>x.type==='sentry'&&dist(x,p)<70);if(turret&&availableDefense('sentry2')){turret.type='sentry2';turret.maxHp=370;turret.hp=370;if(!s.cheats.defenses)s.kits.sentry2--;say('Sentry upgraded to Mk II!',1000);return}
let crate=s.crates.find(x=>!x.opened&&dist(x,p)<58);if(crate){crate.opened=true;let type=['wood','cloth','gear','stone','metal'][irnd(0,4)];s.materials[type]+=(type==='metal'?1:irnd(1,3));p.reserve+=13;if(Math.random()<.3)p.bandages++;say(`CRATE: ${MAT[type]} salvage + ammo!`);return}
if(s.supply&&dist(p,s.supply)<74){collectSupply(p);return}
if(isNearShop(p)){s.crafter=p.id;showCraft();return}say('Find crates, the golden drop, or Scrap & Stitch!',900)}
function collectSupply(p){if(!s.supply)return;s.supply=null;s.drops++;s.score+=400;s.materials.wood+=3;s.materials.cloth+=2;s.materials.gear+=2;s.materials.metal+=2;s.materials.stone+=3;for(let q of s.players){q.reserve+=40;q.hp=Math.min(q.maxHp,q.hp+30)}s.rush=Math.max(s.rush,5+s.buff.rush);say('📦 SUPPLY DROP! LOOT + INK RUSH!',1800)}
function useBandage(p){if(p?.bandages>0&&!p.down&&p.hp<p.maxHp){p.bandages--;p.hp=Math.min(p.maxHp,p.hp+52);say(`PLAYER ${p.id+1}: PATCHED UP`,650)}}
function reload(p){const w=WEAPONS[p.weapon];if(!w.mag||w.laser||p.reload>0||p.ammo[p.weapon]>=w.mag||p.reserve<=0)return;p.reload=w.reload*s.buff.reload;sfx('reload')}
function newToast(msg){say(msg)}
function insideRectPoint(x,y,r){return x>SHOP.x-r&&x<SHOP.x+SHOP.w+r&&y>SHOP.y-r&&y<SHOP.y+SHOP.h+r}
function collideShop(p,ox,oy,enemy=false){const r=p.r||12;const left=SHOP.x,right=SHOP.x+SHOP.w,top=SHOP.y,bottom=SHOP.y+SHOP.h;if(!insideRectPoint(p.x,p.y,r))return;
 if(enemy){let dx=Math.min(Math.abs(p.x-(left-r)),Math.abs(p.x-(right+r)));let dy=Math.min(Math.abs(p.y-(top-r)),Math.abs(p.y-(bottom+r)));if(dx<dy)p.x=p.x<(left+right)/2?left-r:right+r;else p.y=p.y<(top+bottom)/2?top-r:bottom+r;return;}
 // The door is in the south wall: players can walk into the room, but not through its other three walls.
 const inDoor=p.x>SHOP.doorX-SHOP.doorW/2+r*.2&&p.x<SHOP.doorX+SHOP.doorW/2-r*.2;
 if(oy>=bottom-r-3&&p.y<bottom+r&&!inDoor){p.y=bottom+r;return}
 if(oy<=top+r&&p.y>top-r){p.y=top-r;return}
 if(ox<=left+r&&p.x>left-r){p.x=left-r;return}
 if(ox>=right-r&&p.x<right+r){p.x=right+r;return}
 if(p.y>bottom-r&&p.y<bottom+r&&!inDoor){p.y=oy<bottom?bottom-r:bottom+r;return}
 if(p.x<left+r)p.x=left+r;if(p.x>right-r)p.x=right-r;if(p.y<top+r)p.y=top+r;
}
function sfx(type){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!s.audio)s.audio=new AC();if(s.audio.state==='suspended')s.audio.resume();const ac=s.audio,o=ac.createOscillator(),v=ac.createGain(),t=ac.currentTime;o.type=type==='laser'?'sawtooth':'triangle';o.frequency.setValueAtTime(({shoot:130,hit:180,death:70,reload:490,laser:680})[type]||270,t);o.frequency.exponentialRampToValueAtTime(type==='laser'?280:75,t+.1);v.gain.setValueAtTime(.019,t);v.gain.exponentialRampToValueAtTime(.0001,t+.12);o.connect(v);v.connect(ac.destination);o.start();o.stop(t+.13)}catch{}}
function pauseGame(){if(s.screen==='play'){s.screen='pause';firing=false;showOverlay(`<h2>PAUSED</h2><p>Even the zombies need a breather.</p><div class="row">${btn('▶ RESUME','resume','primary')}${btn('HOW TO PLAY','help')}${btn('🏠 HOME','home')}</div>`)}else if(s.screen==='pause'){s.screen='play';hideOverlay()}}
function handleKeyDown(e){const k=e.code;if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Slash','Comma','Period'].includes(k))e.preventDefault();if(KEYS.has(k))return;KEYS.add(k);
 if(k==='KeyH'){hideHud=!hideHud;hud.style.display=hideHud?'none':'';uiToggle.textContent=hideHud?'SHOW UI [H]':'HIDE UI [H]';return}
 if(k==='Slash'){toggleCheats();return}
 if(k==='Escape'){if(s.cheatOpen){toggleCheats();return}if(s.craftOpen){s.craftOpen=false;hideOverlay();return}pauseGame();return}
 if(s.screen!=='play'||s.craftOpen||s.cheatOpen)return;
 if(k==='KeyC'&&s.players[0]&&isNearShop(s.players[0])){s.crafter=0;showCraft();return}
 if(k==='KeyE')interact(s.players[0]);if(k==='KeyM')interact(s.players[1]);
 if(k==='KeyB')placeDefense(s.players[0]);if(k==='Comma')placeDefense(s.players[1]);
 if(k==='KeyV'||k==='Period')cycleDefense();
 if(k==='KeyF')useBandage(s.players[0]);if(k==='KeyL')useBandage(s.players[1]);
 if(k==='KeyR')reload(s.players[0]);if(k==='KeyK')reload(s.players[1]);
 if(k==='KeyN'&&s.players[1])nextWeapon(s.players[1]);
 if(k==='Space')dash(s.players[0]);if(k==='ShiftRight')dash(s.players[1]);
 if(/^Digit[1-9]$/.test(k))equipSlot(s.players[0],Number(k.slice(-1)));
}
document.addEventListener('keydown',handleKeyDown);document.addEventListener('keyup',e=>KEYS.delete(e.code));window.addEventListener('blur',()=>{KEYS.clear();firing=false});
uiToggle.addEventListener('click',()=>{hideHud=!hideHud;hud.style.display=hideHud?'none':'';uiToggle.textContent=hideHud?'SHOW UI [H]':'HIDE UI [H]' });
function pointer(e){const b=cv.getBoundingClientRect();mouse.x=(e.clientX-b.left)/b.width*CW;mouse.y=(e.clientY-b.top)/b.height*CH}
cv.addEventListener('pointermove',pointer);cv.addEventListener('pointerdown',e=>{pointer(e);firing=true;cv.setPointerCapture(e.pointerId)});cv.addEventListener('pointerup',()=>firing=false);cv.addEventListener('pointercancel',()=>firing=false);
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const [action,arg]=b.dataset.action.split(':');if(action==='solo'||action==='coop'){startGame(action==='solo'?1:2);return}if(action==='home'){showHome();return}if(action==='help'){showHelp();return}if(action==='continue'||action==='resume'){s.screen='play';hideOverlay();return}if(action==='restart'){startGame(s.mode);return}if(action==='endless'){s.screen='play';hideOverlay();s.wave=10;startWave(11);return}if(action==='tab')showCraft(arg);if(action==='closeCraft'){s.craftOpen=false;hideOverlay()}if(action==='craft')craft(arg);if(action==='cheat')cheatToggle(arg);if(action==='reroll'){let cost=2*(s.rolls+1);if(s.materials.metal>=cost){s.materials.metal-=cost;s.rolls++;s.upgrades=pickUpgrades();renderShop();sfx('reload')}}if(action==='upgrade'){applyUpgrade(arg);s.screen='play';hideOverlay();s.countdown=5;s.wave++;say(`UPGRADED! WAVE ${s.wave} IN 5...`,1400)}});
function dash(p){if(!p||p.down||p.dash>0)return;p.dash=2.7*s.buff.dash;p.dashFx=.22;p.hitCd=Math.max(p.hitCd,.24);sfx('hit')}
function damagePlayer(p,damage){if(!p||p.down||insideShop(p.x,p.y)||s.cheats.invuln||p.hitCd>0||p.dashFx>0)return;p.hp-=damage*(1-s.buff.armor);p.hitCd=.42;sfx('hit');for(let i=0;i<7;i++)spark(p.x,p.y,'#e76f5b');if(p.hp<=0){p.hp=0;p.down=true;say(`PLAYER ${p.id+1} IS DOWN!`,1750);if(s.players.every(v=>v.down))endRun()}}
function spark(x,y,color='#555',count=1){for(let i=0;i<count;i++)s.particles.push({x,y,vx:rnd(-150,150),vy:rnd(-160,90),life:rnd(.18,.7),maxLife:.7,color,r:rnd(2,5)})}
function aimPlayer(p){if(p.id===0){let x=s.cam.x+mouse.x,y=s.cam.y+mouse.y;p.angle=Math.atan2(y-p.y,x-p.x)}else{let target=nearestEnemy(p,670);if(target)p.angle=Math.atan2(target.y-p.y,target.x-p.x);else if(Math.abs(p.moveX)+Math.abs(p.moveY)>.01)p.angle=Math.atan2(p.moveY,p.moveX)}}
function nearestEnemy(from,maxRange=Infinity){let best=null,d=maxRange;for(let z of s.zombies){let v=dist(from,z);if(v<d){d=v;best=z}}return best}
function killZombie(z,p){let i=s.zombies.indexOf(z);if(i<0)return;s.zombies.splice(i,1);s.kills++;s.combo++;s.comboTime=3.5;s.bestCombo=Math.max(s.combo,s.bestCombo);let value=ENEMY[z.type].score||40;s.score+=Math.round(value*(1+Math.floor(s.combo/5)*.3));if(s.combo%10===0){s.rush=8+s.buff.rush;say(`✨ ${s.combo} KILL CHAIN — INK RUSH!`,1200)}if(p&&s.buff.lifesteal)p.hp=Math.min(p.maxHp,p.hp+s.buff.lifesteal);spark(z.x,z.y,ENEMY[z.type].color,16);sfx('death');if(Math.random()<.09){let type=['cloth','wood','stone','gear','metal'][irnd(0,4)];s.pickups.push({x:z.x,y:z.y,type,bob:0,life:35})}if(z.type==='exploder')explode(z.x,z.y,63,20,true);if(ENEMY[z.type].boss){say(`${ENEMY[z.type].name} DEFEATED!`,1850);s.score+=1300}}
function hitZombie(z,dmg,p){let resistance=ENEMY[z.type].armor||1;z.hp-=Math.round(dmg*resistance);z.hit=.16;if(z.hp<=0)killZombie(z,p)}
function explode(x,y,r,dmg,fromZombie=false){s.hazards.push({x,y,r,dmg,ttl:.25,blast:true,hit:false});spark(x,y,fromZombie?'#d47f51':'#e4bd71',23);}
function shootPlayer(p){if(!p||p.down||p.reload>0||p.atk>0)return;const w=WEAPONS[p.weapon];if(!w)return;let speedMult=s.buff.rate*(s.rush>0?2:1);p.atk=w.rate/speedMult;p.atkd=w.melee?.31:.11;p.anim=p.atkd;
 const dmg=w.damage*s.buff.damage*(s.rush>0?1.25:1);
 if(w.melee){let range=w.range*s.buff.melee,arc=w.arc+Math.max(0,s.buff.melee-1)*.34;for(let z of [...s.zombies]){let d=dist(p,z);let ang=Math.atan2(z.y-p.y,z.x-p.x);let delta=Math.atan2(Math.sin(ang-p.angle),Math.cos(ang-p.angle));if(d<range+z.r&&Math.abs(delta)<arc/2+.16)hitZombie(z,dmg,p)}spark(p.x+Math.cos(p.angle)*50,p.y+Math.sin(p.angle)*50,'#b8a78b',3);sfx('hit');return}
 if(w.laser){let ux=Math.cos(p.angle),uy=Math.sin(p.angle),length=1000;let x2=p.x+ux*length,y2=p.y+uy*length;for(let z of [...s.zombies]){let dx=z.x-p.x,dy=z.y-p.y,along=dx*ux+dy*uy,side=Math.abs(dx*uy-dy*ux);if(along>=0&&along<=length&&side<z.r+10)hitZombie(z,dmg,p)}s.bullets.push({x:p.x,y:p.y,x2,y2,ray:true,life:.13,color:'#dc40d4'});spark(x2,y2,'#e66ad7',3);sfx('laser');return}
 if(p.ammo[p.weapon]<=0){p.atk=.21;reload(p);return}p.ammo[p.weapon]--;
 for(let j=0;j<(w.pellets||1);j++){let ang=p.angle+rnd(-(w.spread||0),(w.spread||0)),vel=w.speed||900;s.bullets.push({x:p.x+Math.cos(p.angle)*19,y:p.y+Math.sin(p.angle)*19,vx:Math.cos(ang)*vel,vy:Math.sin(ang)*vel,life:1.25,dmg,owner:p.id,enemy:false,pierce:(w.pierce||0)+s.buff.pierce,hitIds:[],rad:4,color:w.color})}
 spark(p.x+Math.cos(p.angle)*23,p.y+Math.sin(p.angle)*23,'#f0c46b',3);sfx('shoot')}
function hitStructure(st,dmg){st.hp-=dmg;st.hitCd=.22;if(st.hp<=0){s.structures.splice(s.structures.indexOf(st),1);spark(st.x,st.y,'#686666',12)}}
function enemyBite(z,p,damage){if(z.cool>0)return;damagePlayer(p,damage);z.cool=.75}
function enemyProjectile(z,p){const dx=p.x-z.x,dy=p.y-z.y,n=norm(dx,dy);s.bullets.push({x:z.x,y:z.y,vx:n.x*300,vy:n.y*300,dmg:11+Math.floor(s.wave/2),enemy:true,life:2.7,rad:8,color:'#a7c42d'});spark(z.x,z.y,'#8aab35',4)}
function spawnBoss(type){spawnZombie(type);say(type==='inkking'?'👑 THE INK KING ARRIVES!':'⚙️ SCRAPJAW APPROACHES!',2600)}
function movePlayer(p,dt){if(p.down)return;let x=0,y=0;if(p.id===0){x=Number(KEYS.has('KeyD'))-Number(KEYS.has('KeyA'));y=Number(KEYS.has('KeyS'))-Number(KEYS.has('KeyW'))}else{x=Number(KEYS.has('ArrowRight'))-Number(KEYS.has('ArrowLeft'));y=Number(KEYS.has('ArrowDown'))-Number(KEYS.has('ArrowUp'))}
 let v=norm(x,y);p.moveX=x?v.x:0;p.moveY=y?v.y:0;let speed=220*s.buff.speed*(s.cheats.speed?3:1)*(p.dashFx>0?2.8:1);let ox=p.x,oy=p.y;p.x=clamp(p.x+v.x*speed*dt*(x||y?1:0),p.r,WW-p.r);p.y=clamp(p.y+v.y*speed*dt*(x||y?1:0),p.r,WH-p.r);collideShop(p,ox,oy);for(let st of s.structures){if(st.type==='wire')continue;let d=dist(p,st);if(d<st.r+p.r+3){let n=norm(p.x-st.x,p.y-st.y);p.x=st.x+n.x*(st.r+p.r+3);p.y=st.y+n.y*(st.r+p.r+3)}}
 aimPlayer(p);}
function update(dt){if(s.screen!=='play'||s.craftOpen||s.cheatOpen)return;s.clock+=dt;
 if(s.countdown>0){s.countdown-=dt;if(s.countdown<=0){s.countdown=0;startWave(s.wave);say(`WAVE ${s.wave} — INCOMING!`,1400)}}
 if(s.comboTime>0){s.comboTime-=dt;if(s.comboTime<=0)s.combo=0}if(s.rush>0)s.rush-=dt;
 for(let p of s.players){p.atk=Math.max(0,p.atk-dt);p.anim=Math.max(0,p.anim-dt);p.dash=Math.max(0,p.dash-dt);p.dashFx=Math.max(0,p.dashFx-dt);p.hitCd=Math.max(0,p.hitCd-dt);if(p.reload>0){p.reload-=dt;if(p.reload<=0){let w=WEAPONS[p.weapon];if(w.mag){let n=Math.min(w.mag-(p.ammo[p.weapon]||0),p.reserve);p.ammo[p.weapon]=(p.ammo[p.weapon]||0)+n;p.reserve-=n}}}movePlayer(p,dt);
 if(!p.down&&((p.id===0&&(firing||KEYS.has('KeyJ')))||(p.id===1&&KEYS.has('Enter'))))shootPlayer(p);
 for(let it of s.pickups){if(dist(p,it)<28){s.materials[it.type]++;it.life=0;sfx('reload');spark(it.x,it.y,'#83a05f',3)}}
 if(s.supply&&dist(p,s.supply)<43)collectSupply(p);
 }
 // Revive: hold interact near your downed teammate for two seconds.
 for(let p of s.players){if(!p.down)continue;let helper=s.players.find(q=>!q.down&&dist(q,p)<81&&KEYS.has(q.id===0?'KeyE':'KeyM'));if(helper){p.revive+=dt;if(p.revive>=2){p.revive=0;p.down=false;p.hp=Math.round(p.maxHp*.45);p.hitCd=1.5;say(`PLAYER ${p.id+1} REVIVED!`,1100)}}else p.revive=Math.max(0,p.revive-.45*dt)}
 if(s.countdown<=0){if(s.bossPending&&s.waveTimer>=4){spawnBoss(s.wave===10?'inkking':'scrapjaw');s.bossPending=false}if(s.queue>0){s.spawnTimer-=dt;if(s.spawnTimer<=0){spawnZombie();s.spawnTimer=Math.max(.19,.68-s.wave*.032)}}s.waveTimer+=dt;
 if(s.supply){s.supply.ttl-=dt;if(s.supply.ttl<=0){s.supply=null;say('The supply drop vanished!',900)}}
 for(let z of [...s.zombies])updateZombie(z,dt);
 updateStructures(dt);updateBullets(dt);updateHazards(dt);
 if(s.queue===0&&!s.bossPending&&s.zombies.length===0){s.roundWait+=dt;if(s.roundWait>1.4){s.roundWait=0;finishWave()}}else s.roundWait=0;
 }
 for(let it of s.pickups)if(it.life!==Infinity)it.life-=dt;s.pickups=s.pickups.filter(it=>it.life>0);
 for(let pt of s.particles){pt.x+=pt.vx*dt;pt.y+=pt.vy*dt;pt.vy+=260*dt;pt.life-=dt}s.particles=s.particles.filter(pt=>pt.life>0);
 const alive=s.players.filter(p=>!p.down);let tx=alive.reduce((v,p)=>v+p.x,0)/(alive.length||1),ty=alive.reduce((v,p)=>v+p.y,0)/(alive.length||1);if(!alive.length){tx=s.players[0]?.x||1000;ty=s.players[0]?.y||800}
 s.cam.x=lerp(s.cam.x,clamp(tx-CW/2,0,WW-CW),Math.min(1,dt*4));s.cam.y=lerp(s.cam.y,clamp(ty-CH/2,0,WH-CH),Math.min(1,dt*4));
 if(performance.now()-hudLast>130){hudLast=performance.now();renderHud()}
}
function updateZombie(z,dt){let spec=ENEMY[z.type];z.hit=Math.max(0,z.hit-dt);z.cool=Math.max(0,z.cool-dt);z.shoot-=dt;z.special-=dt;z.slow=Math.max(0,z.slow-dt);let phase=(spec.boss&&z.hp<z.maxHp*.5)?1:0;z.phase=phase;
 let target=s.players.filter(p=>!p.down&&!insideShop(p.x,p.y)).sort((a,b)=>dist(a,z)-dist(b,z))[0];if(!target){target=s.players.find(p=>!p.down);if(!target)return}
 let toX=target.x,toY=target.y;if(insideShop(toX,toY)){toX=SHOP.doorX;toY=SHOP.y+SHOP.h+46}
 let d=Math.hypot(toX-z.x,toY-z.y),v=norm(toX-z.x,toY-z.y);z.angle=Math.atan2(v.y,v.x);
 if(z.type==='exploder'&&d<86&&!insideShop(target.x,target.y)){z.exploding+=dt;if(z.exploding>=.85){let idx=s.zombies.indexOf(z);if(idx>=0)s.zombies.splice(idx,1);explode(z.x,z.y,90,38,true);return}}else z.exploding=Math.max(0,z.exploding-dt*.4);
 if(z.type==='spitter'&&d<450&&z.shoot<=0&&!insideShop(target.x,target.y)){enemyProjectile(z,target);z.shoot=2.3-rnd(0,.4)}
 if(spec.boss&&z.special<=0&&d<590&&!insideShop(target.x,target.y)){const impact={x:target.x,y:target.y,r:phase?100:85,ttl:1.05,dmg:phase?32:23,blast:false,hit:false};s.hazards.push(impact);z.special=phase?2.35:3.4;sfx('hit');if(phase&&Math.random()<.38){spawnZombie('runner');spawnZombie('walker')}}
 if(d>z.r+target.r+3){let speed=z.spd*(z.slow>0?.40:1)*(phase?1.35:1);let ox=z.x,oy=z.y;z.x+=v.x*speed*dt;z.y+=v.y*speed*dt;collideShop(z,ox,oy,true)}
 let nearby=s.structures.find(st=>dist(st,z)<st.r+z.r+5);if(nearby){if(nearby.type==='wire'){z.slow=.24;if(nearby.hitCd<=0){z.hp-=10;nearby.hitCd=.15;if(z.hp<=0){killZombie(z,null);return}}}else if(z.cool<=0){hitStructure(nearby,phase?20:10);z.cool=.43}}
 for(let p of s.players){if(!p.down&&dist(p,z)<z.r+p.r+4&&!insideShop(p.x,p.y))enemyBite(z,p,spec.dmg+(phase?7:0))}}
function updateStructures(dt){for(let st of [...s.structures]){st.cd=Math.max(0,st.cd-dt);st.hitCd=Math.max(0,st.hitCd-dt);if(!['sentry','sentry2'].includes(st.type))continue;let range=st.type==='sentry2'?410:320;let z=nearestEnemy(st,range);if(z){st.angle=Math.atan2(z.y-st.y,z.x-st.x);if(st.cd<=0){let a=st.angle,sp=920;s.bullets.push({x:st.x,y:st.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1.1,dmg:(st.type==='sentry2'?45:26)*s.buff.turret,owner:-1,enemy:false,pierce:0,hitIds:[],rad:4,color:'#53889c'});st.cd=st.type==='sentry2'?.12:.31;spark(st.x,st.y,'#f6ca75',2)}}}}
function updateBullets(dt){for(let b of [...s.bullets]){b.life-=dt;if(b.ray)continue;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<20||b.y<20||b.x>WW-20||b.y>WH-20){b.life=0;continue}
 if(b.enemy){if(insideShop(b.x,b.y)){b.life=0;continue}for(let p of s.players)if(!p.down&&dist(p,b)<p.r+b.rad){damagePlayer(p,b.dmg);b.life=0;break}}
 else for(let z of [...s.zombies]){if(b.hitIds.includes(z.id))continue;if(dist(z,b)<z.r+b.rad){let player=playerById(b.owner);hitZombie(z,b.dmg,player);b.hitIds.push(z.id);spark(b.x,b.y,'#707666',3);if(b.pierce--<=0){b.life=0;break}}}}
 s.bullets=s.bullets.filter(b=>b.life>0)}
function updateHazards(dt){for(let h of s.hazards){h.ttl-=dt;if(h.blast&&!h.hit){h.hit=true;for(let p of s.players)if(dist(p,h)<h.r)damagePlayer(p,h.dmg)}else if(!h.blast&&h.ttl<=0&&!h.hit){h.hit=true;explode(h.x,h.y,h.r,h.dmg);for(let p of s.players)if(dist(p,h)<h.r)damagePlayer(p,h.dmg)}}s.hazards=s.hazards.filter(h=>h.ttl>-.02)}
function renderHud(){if(s.screen==='home')return;let playerHTML=s.players.map(p=>`<span class="player-chip ${p.id?'two':''}">P${p.id+1} ${p.down?'💀 DOWN':p.weapon==='laser'?'✨ LASER':WEAPONS[p.weapon].label}</span> <span class="health"><i style="width:${clamp(p.hp/p.maxHp*100,0,100)}%"></i></span> ${Math.ceil(p.hp)}HP ${WEAPONS[p.weapon].mag&&!WEAPONS[p.weapon].laser?` · ${p.ammo[p.weapon]||0}/${p.reserve} ammo`:''} · 🩹${p.bandages}`).join('<div style="height:3px"></div>');statusLeft.innerHTML=`<div class="hudbox">${playerHTML}</div>`;
 let boss=s.zombies.find(z=>ENEMY[z.type].boss);statusRight.innerHTML=`<div class="hudbox">🌙 WAVE <b>${s.wave}${s.wave>10?'+':''}/10</b> · 🧟 ${s.queue+s.zombies.length} LEFT · 🏆 ${s.score.toLocaleString()} ${s.rush>0?`· ✨ INK RUSH ${Math.ceil(s.rush)}s`:''} ${s.combo>1?`· 🔥x${s.combo}`:''}${boss?` · 👑 ${Math.ceil(boss.hp/boss.maxHp*100)}%`:''}</div>`;
 const mat=Object.keys(MAT).map(k=>`${MAT[k]}${s.materials[k]}`).join(' ');let selected=DEF_KEYS[s.placeIndex];gearStatus.innerHTML=`<div class="hudbox">${mat} &nbsp;•&nbsp; 🧱 ${DEF_LABEL[selected]} ${s.cheats.defenses?'∞':s.kits[selected]} &nbsp; <small>[V / .] switch, [B / ,] place</small></div>`;
 keyStatus.innerHTML=`<div class="hudbox"><small>P1 WASD • CLICK ATTACK • E INTERACT • C CRAFT • F HEAL · P2 ARROWS • ENTER ATTACK • M INTERACT • L HEAL · ESC PAUSE</small></div>`}
function pathstroke(color='#303133',width=3){g.strokeStyle=color;g.lineWidth=width;g.lineJoin='round';g.lineCap='round'}
function line(x,y,x2,y2,color='#303133',w=3){g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);pathstroke(color,w);g.stroke()}
function circ(x,y,r,fill,stroke='#2c2b2e',w=3){g.beginPath();g.arc(x,y,r,0,TAU);g.fillStyle=fill;g.fill();if(stroke){pathstroke(stroke,w);g.stroke()}}
function rect(x,y,w,h,fill,stroke='#292b2d',weight=3){g.fillStyle=fill;g.fillRect(x,y,w,h);if(stroke){pathstroke(stroke,weight);g.strokeRect(x,y,w,h)}}
function textDraw(t,x,y,size=19,color='#292b2c',align='left'){g.font=`bold ${size}px 'Patrick Hand',sans-serif`;g.textAlign=align;g.fillStyle=color;g.fillText(t,x,y);g.textAlign='left'}
function roughLine(x,y,x2,y2){line(x,y,x2,y2,'#aaa59a',1.3);line(x+2,y-2,x2+3,y2-2,'#d4c7b3',1)}
const decorations=Array.from({length:105},(_,i)=>{let x=(Math.sin(i*75.23)*4124%1+1)%1*WW,y=(Math.sin(i*66.29+13)*3379%1+1)%1*WH;return{x,y,kind:i%6,angle:i*1.4}});
const trees=Array.from({length:52},(_,i)=>({x:90+((Math.sin(i*12.73+5)*1231%1+1)%1)*(WW-180),y:75+((Math.sin(i*42.25+15)*2237%1+1)%1)*(WH-150),r:16+i%4*4})).filter(t=>!insideShop(t.x,t.y)&&Math.hypot(t.x-1050,t.y-780)>130);
const wrecks=[{x:1340,y:350,w:150,h:98,color:'#d4b4a5'},{x:1780,y:1030,w:170,h:110,color:'#b5c5bc'},{x:500,y:1020,w:153,h:99,color:'#e0d096'},{x:1740,y:390,w:175,h:104,color:'#c2b5d2'},{x:200,y:1300,w:145,h:100,color:'#b6c7dd'}];
function drawBackdrop(){g.fillStyle='#f6f0df';g.fillRect(0,0,CW,CH);g.save();g.translate(-s.cam.x,-s.cam.y);
 const fromX=Math.floor(s.cam.x/80)*80,toX=s.cam.x+CW+80,fromY=Math.floor(s.cam.y/80)*80,toY=s.cam.y+CH+80;
 for(let x=fromX;x<toX;x+=80)line(x,s.cam.y-50,x,s.cam.y+CH+50,'#d5dfcd65',1);
 for(let y=fromY;y<toY;y+=80)line(s.cam.x-50,y,s.cam.x+CW+50,y,'#cbd2e065',1);
 rect(890,625,390,290,'#e3dccd',null);rect(920,646,330,252,'#efeadb','#b6ab9a',1);
 line(1040,0,1040,WH,'#dbd0b4',53);line(0,790,WW,790,'#dcd0b9',59);line(1040,0,1040,WH,'#f8eee0',2);line(0,790,WW,790,'#eee0c6',2);
 decorations.forEach(d=>{if(!withinCamera(d.x,d.y))return;g.save();g.translate(d.x,d.y);g.rotate(d.angle);if(d.kind===0){line(-7,-4,8,3,'#c7c1b2',2);line(-2,4,9,-9,'#d3cdc0',1)}else if(d.kind===1){circ(0,0,2,'#bbb8aa',null)}else if(d.kind===2){textDraw('x',0,0,11,'#d4b9ae')}else if(d.kind===3){line(-3,0,7,0,'#cbb6a5',1.5)}else if(d.kind===4){g.beginPath();g.arc(0,0,7,0,Math.PI);pathstroke('#c8c4ae',1);g.stroke()}g.restore()});
 for(let t of trees){if(!withinCamera(t.x,t.y))continue;circ(t.x+2,t.y+4,t.r+2,'#d4ddc0aa',null);circ(t.x,t.y,t.r,'#c9d5a7','#8d9e80',2);line(t.x-t.r/2,t.y+3,t.x+t.r/2,t.y-6,'#98b189',2);circ(t.x-3,t.y-5,3,'#a9c58b',null)}
 for(let b of wrecks){if(!withinCamera(b.x,b.y,180))continue;rect(b.x,b.y,b.w,b.h,b.color,'#484b47',4);for(let i=0;i<3;i++)line(b.x+8,b.y+i*22+12,b.x+b.w-9,b.y+i*22+8,'#767b7985',1.5);rect(b.x+16,b.y+18,49,44,'#9ebcba','#444',2);textDraw('ABANDONED',b.x+30,b.y+b.h-8,13,'#6f5f55')}
 drawShop();g.restore();}
function drawShop(){let {x,y,w,h}=SHOP;g.fillStyle='#eee5cc';g.fillRect(x,y,w,h);g.fillStyle='#e7dfc3';for(let i=0;i<6;i++)g.fillRect(x+18+i*58,y+16,3,h-22);
 rect(x+27,y+33,95,86,'#d6bb8e','#443e38',3);rect(x+36,y+42,78,21,'#ad996f','#625845',2);textDraw('TOOLS',x+48,y+58,19);rect(x+192,y+63,127,74,'#d1ad7f','#544334',3);rect(x+215,y+80,84,44,'#9b7453','#3d3938',2);line(x+222,y+89,x+282,y+112,'#d1c0b4',2);line(x+250,y+87,x+242,y+116,'#d1c0b4',2);
 rect(x+30,y+171,83,38,'#c3a47a','#48413d',3);rect(x+260,y+174,79,40,'#bba68a','#48413d',3);textDraw('⚙',x+283,y+201,28);
 rect(x,y,w,7,'#484a48',null);rect(x,y,7,h,'#484a48',null);rect(x+w-7,y,7,h,'#484a48',null);rect(x,y+h-7,SHOP.doorX-SHOP.doorW/2-x,h?7:7,'#484a48',null);rect(SHOP.doorX+SHOP.doorW/2,y+h-7,x+w-(SHOP.doorX+SHOP.doorW/2),7,'#484a48',null);
 rect(SHOP.doorX-SHOP.doorW/2,y+h-9,SHOP.doorW,13,'#e4cd90',null);line(SHOP.doorX-SHOP.doorW/2,y+h-8,SHOP.doorX-SHOP.doorW/2,y+h+10,'#483e35',2);line(SHOP.doorX+SHOP.doorW/2,y+h-8,SHOP.doorX+SHOP.doorW/2,y+h+10,'#483e35',2);
 rect(x+14,y-41,w-28,40,'#f5df99','#353237',3);textDraw('SCRAP & STITCH — SAFE WORKSHOP',x+w/2,y-12,22,'#393837','center');
 textDraw('WORKBENCH [C / E / M]',x+w/2,y+152,18,'#4d4944','center');textDraw('SAFE ZONE',x+w/2,y+h-22,18,'#7c986d','center');}
function drawPickups(){for(let it of s.pickups){if(!withinCamera(it.x,it.y))continue;let y=it.y+Math.sin(s.clock*4+it.bob)*3;circ(it.x+1,y+5,11,'#bcb8a174',null);g.save();g.translate(it.x,y);if(it.type==='metal'){rect(-9,-7,18,14,'#a9a9a3','#4e555c',2);circ(0,0,4,'#60686c',null)}else if(it.type==='wood'){rect(-12,-6,24,12,'#d0a26e','#6e5742',2);line(-6,-3,6,4,'#916f4d',1.4)}else if(it.type==='stone'){circ(-3,2,10,'#a4a7a4','#696965',2);line(-7,3,1,-3,'#d7d4c9',1.5)}else if(it.type==='cloth'){rect(-10,-9,20,18,'#b99ecf','#655271',2);line(-5,-5,4,5,'#e2d5e8',2)}else{circ(0,0,10,'#a0c5c7','#536d70',3);textDraw('✱',-8,7,21,'#395b60')}g.restore()}}
function drawCrates(){for(let b of s.crates){if(b.opened||!withinCamera(b.x,b.y))continue;g.save();g.translate(b.x,b.y);g.rotate(.06);rect(-19,-17,38,34,'#b99569','#694b33',3);line(-14,-12,15,11,'#866347',2);line(-14,11,16,-13,'#866347',2);rect(-4,-15,8,30,'#f5e2a5','#6b5d4a',1);g.restore()}}
function drawStructure(st){g.save();g.translate(st.x,st.y);if(st.type==='woodwall'){g.rotate(.04);rect(-31,-13,62,26,'#ba946b','#584631',3);line(-25,-12,23,11,'#8f7050',3);line(-25,11,24,-9,'#8f7050',3)}else if(st.type==='stonewall'){rect(-35,-21,70,42,'#a8ada8','#484b4c',4);for(let i=0;i<3;i++)line(-28,-10+i*12,26,-10+i*12,'#737f7c',2);for(let i=0;i<3;i++)line(-20+i*21,-20,-20+i*21,18,'#707976',1)}else if(st.type==='wire'){line(-31,0,31,0,'#66737d',5);for(let i=-27;i<=27;i+=12){line(i-7,-11,i+7,11,'#7e8790',2);line(i-7,11,i+7,-11,'#7e8790',2)}circ(-32,0,4,'#89919b',null);circ(32,0,4,'#89919b',null)}else{circ(1,6,23,'#8f9c9e90',null);rect(-21,-22,42,41,st.type==='sentry2'?'#9fc7b5':'#93b5c9','#3b4c52',3);circ(0,0,13,st.type==='sentry2'?'#73a27c':'#5d849e','#303946',3);g.rotate(st.angle);rect(5,-6,st.type==='sentry2'?40:30,12,st.type==='sentry2'?'#5f8c70':'#476b86','#303841',2);if(st.type==='sentry2'){line(6,-11,41,-11,'#55795f',3);line(6,11,41,11,'#55795f',3)}}g.restore();if(st.hp<st.maxHp){rect(st.x-27,st.y-37,54,5,'#e7cfc0','#41464b',1);rect(st.x-26,st.y-36,52*clamp(st.hp/st.maxHp,0,1),3,'#72bd79',null)}}
function drawEnemy(z){if(!withinCamera(z.x,z.y,z.r+50))return;const t=ENEMY[z.type];g.save();g.translate(z.x,z.y);g.rotate(z.angle*.10);circ(3,6,z.r+2,'#7e755b30',null);circ(0,0,z.r,z.hit>0?'#f1c3b3':t.color,'#34403d',3.2);
 if(z.type==='armored'){rect(-z.r+1,-z.r+1,z.r*2-2,z.r*.67,'#9ba3b1','#4e555d',2);line(-z.r+4,-z.r+2,z.r-5,-z.r+2,'#dae0e4',2)}
 if(z.type==='runner'){line(-7,z.r-4,-17,z.r+10,'#526b4f',3);line(8,z.r-4,19,z.r+9,'#526b4f',3)}
 if(z.type==='brute'){circ(-19,0,10,'#8ba36b','#55664c',2);circ(19,0,10,'#8ba36b','#55664c',2)}
 if(z.type==='spitter'){circ(0,9,8,'#768f2d','#4c6729',2);circ(0,9,3,'#d0ed67',null)}
 if(z.type==='exploder'){circ(-z.r+1,-10,6,'#edc47d','#ba8257',1);circ(z.r-3,7,7,'#efab65','#b97742',1);if(z.exploding>0){circ(0,0,z.r+8+z.exploding*10,'#dd9e6644','#d66751',2);textDraw('!',0,-z.r-18,26,'#cf5442','center')}}
 if(t.boss){for(let j=-1;j<=1;j++){line(j*z.r*.65,-z.r*.6,j*z.r*.85,-z.r*1.26,'#4c444b',8);circ(j*z.r*.85,-z.r*1.26,6,'#b1a6b1','#333',2)}textDraw(z.type==='inkking'?'👑':'⚙',0,-z.r*.48,32,'#3e374c','center')}
 circ(-z.r*.36,-z.r*.16,Math.max(3,z.r*.19),'#faf5d9','#4b5140',1);circ(z.r*.36,-z.r*.16,Math.max(3,z.r*.19),'#faf5d9','#4b5140',1);circ(-z.r*.36,-z.r*.13,Math.max(2,z.r*.09),'#352b37',null);circ(z.r*.36,-z.r*.13,Math.max(2,z.r*.09),'#352b37',null);
 g.beginPath();g.arc(0,z.r*.3,Math.max(5,z.r*.23),0,Math.PI);pathstroke('#4a3740',2);g.stroke();g.restore();
 if(z.hp<z.maxHp||t.boss){let width=t.boss?106:40;rect(z.x-width/2,z.y-z.r-19,width,7,'#ead6cd','#414044',1);rect(z.x-width/2+1,z.y-z.r-18,(width-2)*clamp(z.hp/z.maxHp,0,1),5,t.boss?'#a85a99':'#90b97e',null)}
}
function drawPlayer(p){if(!withinCamera(p.x,p.y,60))return;g.save();g.translate(p.x,p.y);let c=p.id?'#67c6c3':'#ffa65e',lineC='#33323d';circ(2,10,p.r+3,'#45434a28',null);
 if(p.down){g.rotate(Math.PI/2);g.globalAlpha=.67}
 const walk=(Math.sin(s.clock*13+(p.id?2:0))*((p.moveX||p.moveY)?.8:0));line(-7,10,-10+walk,24,lineC,4);line(7,10,10-walk,24,lineC,4);
 circ(0,4,14,c,lineC,3);line(-10,0,-17,-3+walk,lineC,4);line(10,0,16,6-walk,lineC,4);circ(0,-15,12,'#f7d6ac',lineC,3);
 rect(-13,-24,26,8,c,lineC,2);rect(-9,-30,18,7,c,lineC,2);circ(-4,-15,2.1,'#2f3435',null);circ(5,-15,2.1,'#2f3435',null);line(-4,-8,4,-8,'#6b4c3e',1.8);
 if(p.hitCd>0){circ(0,0,23,'#ffffff0a','#d96c66',2)}
 if(!p.down){const w=WEAPONS[p.weapon]||WEAPONS.bat;let angle=p.angle;if(w.melee){let progress=p.atkd?1-p.anim/p.atkd:1;if(p.anim>0){angle=p.angle+lerp(-1.2,1.2,Math.sin(progress*Math.PI*.5));}g.save();g.rotate(angle);line(9,0,21,0,'#f7cfaa',5);if(w===WEAPONS.fists){circ(25,0,7,'#f5c8a5','#62564a',2)}else if(w===WEAPONS.spear){line(15,0,90,0,'#a17750',5);g.beginPath();g.moveTo(93,0);g.lineTo(75,-9);g.lineTo(75,9);g.closePath();g.fillStyle='#8d9ba6';g.fill();pathstroke('#4b5052',2);g.stroke()}else{line(20,0,76,0,'#9c6d4a',10);line(27,-4,27,5,'#5f442f',3);if(w===WEAPONS.spiked)for(let i=39;i<73;i+=10){line(i,-6,i-3,-17,'#a5afb1',4);line(i,6,i+3,17,'#a5afb1',4)}}g.restore()}
 else{g.save();g.rotate(angle);rect(16,-6,w.laser?60:45,12,w.color,'#393c41',3);rect(21,3,13,13,'#555756','#333',2);if(w.laser)for(let i=28;i<69;i+=12)circ(i,0,3,'#f59af0',null);g.restore()}}
 g.restore();if(p.down){textDraw(`P${p.id+1} DOWN`,p.x,p.y-44,22,'#aa4645','center');if(p.revive>0){rect(p.x-27,p.y-40,54,6,'#eee','#333',1);rect(p.x-26,p.y-39,52*p.revive/2,4,'#7cbb8d',null)}}}
function drawSupply(){if(!s.supply)return;const d=s.supply;if(!withinCamera(d.x,d.y,90))return;let sway=Math.sin(s.clock*4)*3;circ(d.x,d.y,41,'#f2c76022','#e9af50',2);g.save();g.translate(d.x,d.y+sway);rect(-22,-18,44,34,'#edbc63','#65503a',3);line(-21,-18,22,16,'#8a6237',2);line(21,-18,-22,16,'#8a6237',2);rect(-7,-19,14,36,'#f7df8b','#8c6d45',1);g.restore();textDraw(`DROP ${Math.ceil(d.ttl)}s`,d.x,d.y-39,18,'#a66935','center')}
function drawBullets(){for(let b of s.bullets){if(b.ray){line(b.x,b.y,b.x2,b.y2,'#d833dc80',23);line(b.x,b.y,b.x2,b.y2,'#fdedff',7);continue}circ(b.x,b.y,b.rad+1,b.color,null);if(b.enemy)circ(b.x,b.y,b.rad+5,'#cbdc3b35',null)}}
function drawParticles(){for(let p of s.particles){g.globalAlpha=clamp(p.life/p.maxLife,0,1);circ(p.x,p.y,p.r,p.color,null)}g.globalAlpha=1}
function drawHazards(){for(let h of s.hazards){g.beginPath();g.arc(h.x,h.y,h.r,0,TAU);g.fillStyle=h.blast?'#e9905a55':'#ed6f6b25';g.fill();pathstroke(h.blast?'#d87943':'#cc5654',h.blast?3:5);g.setLineDash(h.blast?[]:[9,7]);g.stroke();g.setLineDash([]);if(!h.blast)textDraw('!',h.x,h.y+13,36,'#d25446','center')}}
function drawWorld(){drawBackdrop();g.save();g.translate(-s.cam.x,-s.cam.y);drawPickups();drawCrates();drawSupply();for(let st of s.structures)if(withinCamera(st.x,st.y))drawStructure(st);for(let z of s.zombies)drawEnemy(z);for(let p of s.players)drawPlayer(p);drawBullets();drawHazards();drawParticles();g.restore();}
function drawScreenAnnotations(){if(s.screen!=='play')return;if(s.countdown>0){g.save();g.font='bold 45px Patrick Hand, sans-serif';g.textAlign='center';g.fillStyle='#343537';g.fillText(`WAVE ${s.wave} IN ${Math.ceil(s.countdown)}...`,CW/2,CH/2-130);g.restore()}
 if(s.rush>0){g.fillStyle='#f7d95811';g.fillRect(0,0,CW,CH)}
 if(!withinCamera(SHOP.x+SHOP.w/2,SHOP.y+SHOP.h/2)){let wx=SHOP.x+SHOP.w/2-s.cam.x,wy=SHOP.y+SHOP.h/2-s.cam.y;textDraw('🛠 WORKSHOP',clamp(wx,70,CW-85),clamp(wy,108,CH-80),20,'#776045','center')}
 if(s.supply){let x=s.supply.x-s.cam.x,y=s.supply.y-s.cam.y;if(x<30||x>CW-30||y<30||y>CH-30){let sx=clamp(x,48,CW-48),sy=clamp(y,48,CH-48);textDraw('📦',sx,sy,24,'#af743e','center')}}
 if(s.mode===2){let a=s.players[0],b=s.players[1];if(dist(a,b)>480){textDraw('P1',clamp(a.x-s.cam.x,30,CW-30),clamp(a.y-s.cam.y-55,35,CH-30),18,'#bf6839','center');textDraw('P2',clamp(b.x-s.cam.x,30,CW-30),clamp(b.y-s.cam.y-55,35,CH-30),18,'#348f8a','center')}}
}
function frame(timestamp){let dt=clamp((timestamp-lastTime)/1000||.017,0,.045);lastTime=timestamp;now=timestamp;if(timestamp>toastUntil)toastBox.classList.remove('show');update(dt);drawWorld();drawScreenAnnotations();requestAnimationFrame(frame)}
showHome();requestAnimationFrame(frame);