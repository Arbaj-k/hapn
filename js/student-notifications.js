(function(){
'use strict';
function start(){
 const db=window.sb,head=document.querySelector('.site-header .header-inner');
 if(!db||!head||head.querySelector('.hapn-notif-wrap'))return;
 const wrap=document.createElement('div');wrap.className='hapn-notif-wrap';
 wrap.innerHTML='<button class="hapn-notif-bell" type="button" aria-label="Notifications" aria-expanded="false" title="Notifications"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span class="hapn-notif-count" hidden></span></button><section class="hapn-notif-panel" hidden aria-label="Notifications"><div class="hapn-notif-panel-head"><div><strong>Notifications</strong><small class="hapn-notif-subtitle">Updates from your campus</small></div><button type="button" class="hapn-notif-readall">Mark all read</button></div><div class="hapn-notif-items"><div class="hapn-notif-empty">Checking for updates…</div></div><a class="hapn-notif-viewall" href="/connect/notifications/">View all notifications</a></section>';
 head.insertBefore(wrap,head.querySelector('.nav-toggle')||head.lastElementChild);
 const style=document.createElement('style');
 style.textContent='.hapn-notif-wrap{position:relative;z-index:1200;flex:0 0 auto;margin-left:auto;margin-right:12px}.hapn-notif-bell{width:42px;height:42px;border:1px solid #e4e8f7;border-radius:13px;background:#fff;color:#2637b8;display:grid;place-items:center;position:relative;cursor:pointer;box-shadow:0 3px 12px rgba(25,38,110,.07)}.hapn-notif-bell:hover{background:#f4f6ff;border-color:#cbd2ff}.hapn-notif-bell svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.hapn-notif-count{position:absolute;top:-5px;right:-5px;min-width:19px;height:19px;padding:0 5px;border-radius:99px;background:#ff405d;color:#fff;border:2px solid #fff;font:700 10px/15px system-ui;text-align:center}.hapn-notif-panel{position:absolute;top:calc(100% + 12px);right:0;width:min(360px,calc(100vw - 28px));background:#fff;border:1px solid #e5e8f3;border-radius:18px;box-shadow:0 18px 55px rgba(20,30,80,.18);overflow:hidden;color:#17203c}.hapn-notif-panel-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px 17px;border-bottom:1px solid #edf0f7}.hapn-notif-panel-head strong{display:block;font-size:15px}.hapn-notif-subtitle{display:block;color:#7b839a;font-size:11px;margin-top:3px}.hapn-notif-readall{border:0;background:transparent;color:#3448e8;font:600 11px system-ui;cursor:pointer;padding:6px}.hapn-notif-items{max-height:360px;overflow:auto}.hapn-notif-item{display:flex;gap:11px;padding:13px 16px;text-decoration:none;color:inherit;border-bottom:1px solid #f0f2f8}.hapn-notif-item:hover{background:#f7f8ff}.hapn-notif-item.unread{background:#f4f6ff}.hapn-notif-dot{width:9px;height:9px;flex:0 0 9px;border-radius:50%;background:#394cff;margin-top:5px}.hapn-notif-item:not(.unread) .hapn-notif-dot{background:#d7dbea}.hapn-notif-copy{min-width:0}.hapn-notif-copy strong{display:block;font-size:12px;line-height:1.45;font-weight:650}.hapn-notif-copy small{display:block;color:#8991a7;font-size:10px;margin-top:4px}.hapn-notif-empty{padding:28px 18px;text-align:center;color:#8991a7;font-size:13px}.hapn-notif-viewall{display:block;padding:13px;text-align:center;color:#3448e8;text-decoration:none;font-size:12px;font-weight:700;background:#fbfcff}@media(max-width:767px){.hapn-notif-wrap{margin-left:auto;margin-right:9px}.hapn-notif-bell{width:39px;height:39px;border-radius:12px}.hapn-notif-panel{right:-48px;top:calc(100% + 10px)}}';
 document.head.appendChild(style);
 const btn=wrap.querySelector('.hapn-notif-bell'),panel=wrap.querySelector('.hapn-notif-panel'),items=wrap.querySelector('.hapn-notif-items'),count=wrap.querySelector('.hapn-notif-count');
 let uid=null,channel=null,rows=[];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function time(v){const d=new Date(v),ms=Date.now()-d.getTime();if(!Number.isFinite(ms))return '';if(ms<60000)return 'Just now';if(ms<3600000)return Math.floor(ms/60000)+'m ago';if(ms<86400000)return Math.floor(ms/3600000)+'h ago';return d.toLocaleDateString(undefined,{day:'numeric',month:'short'});}
 function paint(){
  const unread=rows.filter(x=>!x.read_at).length;count.hidden=!unread;count.textContent=unread>99?'99+':String(unread);
  btn.setAttribute('aria-label',unread?unread+' unread notifications':'Notifications');
  items.innerHTML=rows.length?rows.slice(0,8).map(n=>'<a class="hapn-notif-item '+(!n.read_at?'unread':'')+'" href="'+esc(n.target_url||'/connect/notifications/')+'" data-notification="'+esc(n.id)+'"><span class="hapn-notif-dot"></span><span class="hapn-notif-copy"><strong>'+esc(n.message)+'</strong><small>'+esc(time(n.created_at))+'</small></span></a>').join(''):'<div class="hapn-notif-empty">You are all caught up. New campus updates will appear here.</div>';
 }
 async function refresh(){
  if(!uid)return;const {data,error}=await db.from('campus_notifications').select('id,notification_type,message,target_url,read_at,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(30);
  if(error){console.warn('Could not load Hapn notifications:',error.message);return;}rows=data||[];paint();
 }
 async function init(){
  try{
   const {data:{session}}=await db.auth.getSession();if(!session?.user){wrap.remove();return;}uid=session.user.id;
   const {data:member,error}=await db.from('campus_members').select('college_id').eq('user_id',uid).maybeSingle();
   if(error||!member){wrap.remove();return;}
   await refresh();
   channel=db.channel('hapn-student-notifications-'+uid).on('postgres_changes',{event:'*',schema:'public',table:'campus_notifications',filter:'user_id=eq.'+uid},()=>refresh()).subscribe();
  }catch(e){console.warn('Hapn notification bell unavailable.',e);}
 }
 btn.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;btn.setAttribute('aria-expanded',String(open));});
 document.addEventListener('click',e=>{if(!wrap.contains(e.target)){panel.hidden=true;btn.setAttribute('aria-expanded','false');}});
 items.addEventListener('click',async e=>{const a=e.target.closest('[data-notification]');if(!a)return;const row=rows.find(x=>x.id===a.dataset.notification);if(row&&!row.read_at){await db.from('campus_notifications').update({read_at:new Date().toISOString()}).eq('id',row.id).eq('user_id',uid);}});
 wrap.querySelector('.hapn-notif-readall').addEventListener('click',async()=>{if(!uid)return;await db.from('campus_notifications').update({read_at:new Date().toISOString()}).eq('user_id',uid).is('read_at',null);await refresh();});
 window.addEventListener('beforeunload',()=>{if(channel)db.removeChannel(channel);});
 init();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();