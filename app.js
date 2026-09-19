const $=s=>document.querySelector(s),app=$('#app');
const LS=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
const SV=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const bank=Q.map((q,i)=>({id:i+1,subj:q[0],topic:q[1],diff:q[2],q:q[3],o:q[4],a:q[5],e:q[6]}));
const subjects=[...new Set(bank.map(q=>q.subj))],topics=[...new Set(bank.map(q=>q.topic))];
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
// Shuffle answer order while keeping the correct-answer index mapped correctly
const prep=(q,sh)=>{if(!sh)return{...q};const s=shuf(q.o.map((t,i)=>({t,c:i===q.a})));return{...q,o:s.map(x=>x.t),a:s.findIndex(x=>x.c)}};
const def=()=>({ans:0,ok:0,wrong:[],book:[],tests:[],viewed:[],by:{}});
let st=Object.assign(def(),LS('cpa',{})),S=null,timer=null,card={list:[],i:0,flip:false};
const save=()=>SV('cpa',st),go=h=>location.hash==='#'+h?route():(location.hash=h);
const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
const ni=s=>NOTES.findIndex(n=>n.s===s);
const pct=(a,b)=>b?Math.round(100*a/b):0;
const V={};

function start(mode,pool,mins,sh){
  clearInterval(timer);
  S={mode,pool,mins,sh,qs:shuf(pool).map(q=>prep(q,sh)),i:0,ans:[],mark:[],t0:Date.now(),end:mins?Date.now()+mins*60000:0,done:0};
  if(mins)timer=setInterval(tick,500);
  go('quiz');
}
function tick(){
  if(!S||S.done||!S.end){clearInterval(timer);return}
  const l=Math.max(0,Math.round((S.end-Date.now())/1000)),t=$('#tm');
  if(t){t.textContent=fmt(l)+(l<=60&&l>0?' – under 1 minute left':'');t.className='tm'+(l<=60?' warn':'')}
  if(l<=0)finish();
}
function finish(){
  if(!S||S.done)return;
  S.done=1;clearInterval(timer);
  const r={by:{},top:{},ok:0,bad:0,skip:0,time:Math.round((Date.now()-S.t0)/1000)};
  const add=(m,k,c)=>{const b=m[k]=m[k]||[0,0];b[1]++;if(c)b[0]++};
  S.qs.forEach((q,i)=>{
    const a=S.ans[i];
    if(a==null){r.skip++;add(r.by,q.subj,0);add(r.top,q.topic,0);return}
    const c=a===q.a;
    add(r.by,q.subj,c);add(r.top,q.topic,c);add(st.by,q.subj,c);
    st.ans++;
    if(c){r.ok++;st.ok++;st.wrong=st.wrong.filter(x=>x!==q.id)}
    else{r.bad++;if(!st.wrong.includes(q.id))st.wrong.push(q.id)}
  });
  r.pct=pct(r.ok,S.qs.length);
  if(S.mode==='mock'){st.tests.push({name:'Comprehensive mock test',ok:r.ok,n:S.qs.length,pct:r.pct,date:new Date().toLocaleDateString()});}
  S.r=r;save();go('result');
}

V.home=()=>{
  app.innerHTML=`<section class=hero><h1>Clinical Psychology Academy</h1><p>Learn • Revise • Practice • Test</p><div class=row style="justify-content:flex-start"><a class=btn href="#notes/0">Start Studying</a><a class=btn href="#practice">Practice MCQs</a><a class=btn href="#mock">Take a Mock Test</a><a class=btn href="#notes">View Notes</a></div></section>
  <div class=stats><div class=stat><b>${bank.length}</b>MCQs with explanations</div><div class=stat><b>${NOTES.length}</b>Study notes</div><div class=stat><b>${GLOSS.length}</b>Glossary terms and flashcards</div><div class=stat><b>${st.ans?pct(st.ok,st.ans)+'%':'–'}</b>Your accuracy so far</div></div>
  <h2>Subjects</h2><div class=stats>${NOTES.map((n,i)=>`<a class=stat href="#notes/${i}"><b>${n.s}</b>${bank.filter(q=>q.subj===n.s).length} questions</a>`).join('')}</div>`;
};

V.notes=p=>{
  app.innerHTML=`<h1>Study notes</h1><p class=row><span>Use Print notes, then choose “Save as PDF” in your browser.</span><button data-dl>Download all notes (.txt)</button></p>`+NOTES.map((n,i)=>`<details class=note ${p!==''&&+p===i?'open':''}><summary data-view=${i}>${n.t}</summary><h3>Overview</h3><p>${n.o}</p><h3>Key concepts</h3><ul>${n.k.map(x=>`<li>${x}</li>`).join('')}</ul><h3>Exam summary</h3><p>${n.x}</p><h3>Common misconception</h3><p>${n.m}</p><p class=row><button data-print=${i}>Print notes</button><button data-prac="${n.s}">Practise ${n.s} MCQs</button></p></details>`).join('');
  if(p!=='')markViewed(+p);
};
function markViewed(i){if(i<0||i>=NOTES.length)return;st.viewed=st.viewed.filter(x=>x!==i);st.viewed.push(i);save()}

V.practice=()=>{
  const opt=(a,all)=>`<option value="">${all}</option>`+a.map(x=>`<option>${x}</option>`).join('');
  app.innerHTML=`<h1>MCQ practice</h1><section class=card><div class=form><label>Subject<select id=fs>${opt(subjects,'All subjects')}</select></label><label>Topic<select id=ft>${opt(topics,'Any topic')}</select></label><label>Difficulty<select id=fd>${opt(['Easy','Medium'],'Any difficulty')}</select></label><label>Questions<select id=fc><option value=5>5</option><option value=10>10</option><option value=0>All matching</option></select></label><label>Mode<select id=fm><option value=practice>Practice (instant feedback)</option><option value=exam>Exam (answers at the end)</option><option value=timed>Timed (1 minute per question)</option><option value=weak>Weak areas (previously missed)</option></select></label></div><label><input type=checkbox id=fa checked> Shuffle answer order</label><p id=msg role=status class=meta></p><button class=pri data-start>Start quiz</button></section>`;
};

V.mock=()=>{
  const n=Math.min(20,bank.length);
  app.innerHTML=`<h1>Mock tests</h1><section class=card><h2>Comprehensive Clinical Psychology Mock</h2><p>${n} questions drawn at random from every subject · ${n} minutes</p><ul><li>The timer counts down and the test submits automatically at 0:00.</li><li>Answers and explanations appear only after you submit.</li><li>Use Mark for review and the question navigator to move around.</li></ul><label><input type=checkbox id=fa checked> Shuffle answer order</label>${S&&!S.done&&S.mode==='mock'?'<p><a class=btn href="#quiz">Resume test in progress</a></p>':''}<p><button class=pri data-mock>Start test</button></p><p class=meta>Scores are educational practice results only.</p></section>`;
};

V.quiz=()=>{
  if(!S||S.done)return go('practice');
  const q=S.qs[S.i],a=S.ans[S.i],n=S.qs.length,show=S.mode==='practice'&&a!=null;
  app.innerHTML=`<section class=card><div class=row><h2>Question ${S.i+1} of ${n}</h2>${S.end?'<span id=tm class=tm role=timer></span>':''}</div><progress value=${S.i+1} max=${n} aria-label="Progress"></progress><p class=meta>${q.subj}, ${q.topic}, ${q.diff}</p><p class=q>${q.q}</p><div>${q.o.map((t,k)=>`<button class="opt ${show?(k===q.a?'ok':k===a?'bad':''):(k===a?'sel':'')}" data-k=${k} ${show?'disabled':''}>${'ABCD'[k]}. ${t}</button>`).join('')}</div>${show?`<p class=ex><b>${a===q.a?'Correct!':'Incorrect.'}</b> Explanation: ${q.e}</p>`:''}<div class=row><button data-nav=-1>Previous</button><button data-mark>${S.mark[S.i]?'Remove review mark':'Mark for review'}</button><button data-bm>${st.book.includes(q.id)?'★ Bookmarked':'☆ Bookmark'}</button><button data-nav=1>Next</button><button class=pri data-submit>Submit</button></div>${S.mode==='mock'?`<h3>Question navigator</h3><div class=navg>${S.qs.map((_,k)=>`<button data-go=${k} class="${S.mark[k]?'fl':S.ans[k]!=null?'an':'un'}${k===S.i?' cur':''}" aria-label="Question ${k+1}, ${S.mark[k]?'marked for review':S.ans[k]!=null?'answered':'unanswered'}">${k+1}</button>`).join('')}</div><p class=meta>Blue = answered. Grey = unanswered. Amber = marked for review.</p>`:''}</section>`;
  tick();
};

V.result=()=>{
  if(!S||!S.done)return go('practice');
  const r=S.r,n=S.qs.length;
  const rows=m=>Object.entries(m).map(([k,v])=>`<li>${k}: ${pct(v[0],v[1])}% (${v[0]}/${v[1]})</li>`).join('');
  const rev=Object.entries(r.by).filter(([k,v])=>pct(v[0],v[1])<70).map(([k])=>`<a href="#notes/${ni(k)}">${k}</a>`).join(', ');
  app.innerHTML=`<section class=card><h1>${S.mode==='mock'?'Test complete':'Quiz complete'}</h1><p class=big>Score: ${r.ok} / ${n} — ${r.pct}%</p><p>Correct: ${r.ok}. Incorrect: ${r.bad}. Unanswered: ${r.skip}. Time used: ${fmt(r.time)}.</p><h2>Performance by subject</h2><ul>${rows(r.by)}</ul><h2>Performance by topic</h2><ul>${rows(r.top)}</ul><h2>Recommended revision</h2><p>${rev||'Every subject is at 70% or above. Keep practising.'}</p><div class=row><button class=pri data-retake>Retake</button><a class=btn href="#dash">Back to dashboard</a></div><p class=meta>These are educational practice scores only. They do not indicate professional competence or clinical qualification.</p></section><h2>Review answers</h2>`+S.qs.map((q,i)=>{const a=S.ans[i];return `<article class=card><p><b>${i+1}. ${q.q}</b></p><p>Your answer: ${a==null?'Not answered':q.o[a]} ${a==null?'':a===q.a?'(correct)':'(incorrect)'}</p><p>Correct answer: ${q.o[q.a]}</p><p class=ex>${q.e}</p></article>`}).join('');
};

V.cards=()=>{
  if(!card.list.length)card.list=GLOSS.slice();
  const c=card.list[card.i],n=card.list.length;
  app.innerHTML=`<h1>Flashcards</h1><p>Card ${card.i+1} of ${n}. ${card.flip?'Definition':'Term'}: press the card to flip.</p><progress value=${card.i+1} max=${n}></progress><button class=fc data-c=flip aria-live=polite>${card.flip?c[1]:'<b>'+c[0]+'</b>'}</button><div class=row><button data-c=prev>Previous</button><button data-c=next>Next</button><button data-c=shuf>Shuffle</button></div>`;
};

V.gloss=()=>{
  app.innerHTML=`<h1>Glossary</h1><label>Search terms <input id=gq type=search></label><dl id=gl></dl>`;
  const f=()=>{const q=$('#gq').value.toLowerCase();$('#gl').innerHTML=GLOSS.filter(g=>(g[0]+g[1]).toLowerCase().includes(q)).map(g=>`<dt><b>${g[0]}</b></dt><dd>${g[1]}</dd>`).join('')||'<p>No matching terms. Try a shorter search.</p>'};
  $('#gq').oninput=f;f();
};

V.search=q=>{
  const t=q.toLowerCase(),h=x=>x.toLowerCase().includes(t);
  const n=NOTES.map((x,i)=>[x,i]).filter(([x])=>h(x.t+x.o+x.k.join(' '))),g=GLOSS.filter(x=>h(x[0]+x[1])),m=bank.filter(x=>h(x.q+x.topic+x.subj));
  app.innerHTML=`<h1>Results for “${esc(q)}”</h1><h2>Notes (${n.length})</h2>${n.map(([x,i])=>`<p><a href="#notes/${i}">${x.t}</a></p>`).join('')}<h2>Glossary (${g.length})</h2>${g.map(x=>`<p><b>${x[0]}</b>: ${x[1]}</p>`).join('')}<h2>MCQs (${m.length})</h2>${m.map(x=>`<p>${x.q} <em>(${x.topic})</em></p>`).join('')}`;
};

V.dash=()=>{
  const best=st.tests.length?Math.max(...st.tests.map(t=>t.pct)):null;
  const weak=Object.entries(st.by).map(([k,v])=>[k,pct(v[0],v[1]),v[1]]).filter(x=>x[1]<70).sort((a,b)=>a[1]-b[1]);
  app.innerHTML=`<h1>Your progress</h1><div class=stats>${[['Questions answered',st.ans],['Correct',st.ok],['Accuracy',st.ans?pct(st.ok,st.ans)+'%':'–'],['Mock tests completed',st.tests.length],['Best mock score',best==null?'–':best+'%'],['Notes viewed',st.viewed.length],['Bookmarked questions',st.book.length]].map(([a,b])=>`<div class=stat><b>${b}</b>${a}</div>`).join('')}</div>
  <h2>Weak areas</h2>${weak.length?`<ul>${weak.map(w=>`<li>${w[0]}: ${w[1]}% over ${w[2]} answers. <a href="#notes/${ni(w[0])}">Revise notes</a></li>`).join('')}</ul>`:'<p>No weak areas yet. Answer questions to see where to focus.</p>'}<p>Missed questions saved: ${st.wrong.length}. Use “Weak areas” mode in <a href="#practice">MCQ practice</a>.</p>
  <h2>Recent tests</h2>${st.tests.length?`<ul>${st.tests.slice(-5).reverse().map(t=>`<li>${t.date}: ${t.ok}/${t.n} (${t.pct}%)</li>`).join('')}</ul>`:'<p>No mock tests yet. <a href="#mock">Take a mock test</a>.</p>'}
  <h2>Continue studying</h2>${st.viewed.length?`<ul>${st.viewed.slice(-3).reverse().map(i=>`<li><a href="#notes/${i}">${NOTES[i].t}</a></li>`).join('')}</ul>`:'<p>Open a note and it will appear here.</p>'}
  <p><button data-reset>Reset my progress</button></p>`;
};

V.about=()=>{
  app.innerHTML=`<h1>About</h1><p>Clinical Psychology Academy is a free, static study site: notes, MCQs, timed mock tests, flashcards and a glossary. Progress is stored only in your browser.</p>
  <h2 id=disclaimer>Disclaimer</h2><p>This is an educational resource. It is not a substitute for professional training, supervision, diagnosis or treatment. Practice scores do not measure professional competence. If you or someone else is in crisis, contact local emergency services or a crisis line.</p>
  <h2>Copyright</h2><p>The notes, questions, explanations and glossary are original writing for this site. No textbook or commercial question bank has been copied.</p>
  <h2>Privacy</h2><p>The site has no accounts, analytics or server. Your scores, bookmarks and theme are saved with localStorage on your own device. Clearing your browser data removes them.</p>
  <h2>Terms</h2><p>Use the material for personal study. It is provided as is, without warranty. Always confirm clinical facts against current professional guidelines.</p>
  <h2>Further reading</h2><ul><li><a href="https://www.apa.org" rel="noopener">American Psychological Association</a></li><li><a href="https://www.bps.org.uk" rel="noopener">British Psychological Society</a></li><li><a href="https://www.nimh.nih.gov" rel="noopener">National Institute of Mental Health</a></li><li><a href="https://www.who.int" rel="noopener">World Health Organization</a></li></ul>`;
};

function route(){
  const [h,p]=(location.hash.slice(1)||'home').split('/');
  document.querySelectorAll('nav a').forEach(a=>a.getAttribute('href')==='#'+h?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));
  $('#nav').classList.remove('open');$('#mt').setAttribute('aria-expanded','false');
  (V[h]||V.home)(decodeURIComponent(p||''));
  window.scrollTo(0,0);
}

app.addEventListener('click',e=>{
  const sm=e.target.closest('summary');
  if(sm&&sm.dataset.view!=null)markViewed(+sm.dataset.view);
  const b=e.target.closest('button');if(!b)return;
  const d=b.dataset,g=id=>$('#'+id).value;
  if(d.k!=null&&S){S.ans[S.i]=+d.k;V.quiz()}
  else if(d.nav!=null){S.i=Math.min(S.qs.length-1,Math.max(0,S.i+ +d.nav));V.quiz()}
  else if(d.go!=null){S.i=+d.go;V.quiz()}
  else if(d.mark!=null){S.mark[S.i]=!S.mark[S.i];V.quiz()}
  else if(d.bm!=null){const id=S.qs[S.i].id,i=st.book.indexOf(id);i<0?st.book.push(id):st.book.splice(i,1);save();V.quiz()}
  else if(d.submit!=null){const u=S.qs.length-S.ans.filter(x=>x!=null).length;if(!u||confirm(u+' unanswered. Submit anyway?'))finish()}
  else if(d.retake!=null)start(S.mode,S.pool,S.mins,S.sh);
  else if(d.mock!=null)start('mock',shuf(bank).slice(0,Math.min(20,bank.length)),Math.min(20,bank.length),$('#fa').checked);
  else if(d.start!=null){
    let l=bank.filter(q=>(!g('fs')||q.subj===g('fs'))&&(!g('ft')||q.topic===g('ft'))&&(!g('fd')||q.diff===g('fd')));
    const m=g('fm');if(m==='weak')l=l.filter(q=>st.wrong.includes(q.id));
    if(!l.length){$('#msg').textContent=m==='weak'?'No missed questions yet. Answer some questions first.':'No questions match these filters. Try a broader selection.';return}
    l=shuf(l).slice(0,+g('fc')||l.length);
    start(m==='exam'||m==='timed'?'exam':'practice',l,m==='timed'?l.length:0,$('#fa').checked);
  }
  else if(d.prac!=null)start('practice',bank.filter(q=>q.subj===d.prac),0,true);
  else if(d.print!=null){const el=b.closest('details');el.open=true;el.classList.add('pr');window.print();el.classList.remove('pr')}
  else if(d.dl!=null){
    const t=NOTES.map(n=>n.t+'\n\nOverview: '+n.o+'\n\nKey concepts:\n- '+n.k.join('\n- ')+'\n\nExam summary: '+n.x+'\nCommon misconception: '+n.m).join('\n\n----------\n\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/plain'}));a.download='clinical-psychology-notes.txt';a.click();
  }
  else if(d.c!=null){
    if(d.c==='flip')card.flip=!card.flip;
    else{card.flip=false;if(d.c==='shuf'){card.list=shuf(card.list);card.i=0}else card.i=(card.i+(d.c==='next'?1:-1)+card.list.length)%card.list.length}
    V.cards();
  }
  else if(d.reset!=null&&confirm('Delete all saved progress on this device?')){st=def();save();V.dash()}
});

$('#sf').addEventListener('submit',e=>{e.preventDefault();const q=$('#sq').value.trim();if(q)location.hash='search/'+encodeURIComponent(q)});
$('#mt').onclick=()=>{const o=$('#nav').classList.toggle('open');$('#mt').setAttribute('aria-expanded',o)};
document.documentElement.dataset.theme=LS('theme',matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
$('#tt').onclick=()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;SV('theme',t)};
addEventListener('hashchange',route);route();
