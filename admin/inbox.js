(function(){
'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let profile=null,rows=[],collegeNames={};
function notice(t,bad){const n=$('inbox-notice');n.hidden=false;n.textContent=t;n.className='notice'+(bad?' notice-warn':'');}
async function init(){
 if(!window.sb){$('gate').textContent=window.CE?.setupProblem?.()||'Supabase unavailable.';return;}
 const {data:{session}}=await sb.auth.getSession();if(!session){location.replace('login.html');return;}
 const {data:u,error:ue}=await sb.auth.getUser();if(ue||!u.user){location.replace('login.html');return;}
 const {data:p,error}=await sb.from('profiles').select('role,college_id,is_active').eq('user_id',u.user.id).maybeSingle();
 if(error||!p||!p.is_active||!['college_admin','super_admin'].includes(p.role)){$('gate').textContent='Access denied. Admin permission required.';return;}
 profile=p;const {data:collegeRows}=await sb.from('colleges').select('id,name');(collegeRows||[]).forEach(c=>collegeNames[c.id]=c.name);
 $('gate').hidden=true;$('admin-content').hidden=false;
 $('inbox-scope').textContent=p.role==='super_admin'?'Platform-wide inbox · all colleges':'College inbox · only your assigned college';
 $('logout-btn').addEventListener('click',async()=>{await sb.auth.signOut();location.replace('login.html')});
 $('refresh-inbox').addEventListener('click',load);['status-filter','type-filter','search-filter'].forEach(id=>$(id).addEventListener(id==='search-filter'?'input':'change',render));
 $('inbox-list').addEventListener('click',actions);await load();
}
async function load(){
 $('inbox-list').innerHTML='<div class="inbox-empty">Loading inbox…</div>';
 let q=sb.from('hapn_inbox').select('id,college_id,user_id,first_name,last_name,email,phone,message,source_type,source_id,source_label,status,admin_reply,created_at').order('created_at',{ascending:false}).limit(300);
 if(profile.role==='college_admin')q=q.eq('college_id',profile.college_id);
 const {data,error}=await q;
 if(error){notice('Could not load inbox: '+error.message,true);$('inbox-list').innerHTML='<div class="inbox-empty">Inbox could not be loaded.</div>';return;}
 rows=data||[];render();
}
function render(){
 $('stat-total').textContent=rows.length;
 $('stat-new').textContent=rows.filter(r=>r.status==='new').length;
 $('stat-review').textContent=rows.filter(r=>r.status==='in_review').length;
 $('stat-resolved').textContent=rows.filter(r=>r.status==='resolved').length;
 const status=$('status-filter').value,type=$('type-filter').value,term=$('search-filter').value.trim().toLowerCase();
 const list=rows.filter(r=>(!status||r.status===status)&&(!type||r.source_type===type)&&(!term||[r.first_name,r.last_name,r.email,r.message,r.source_label,collegeNames[r.college_id]].join(' ').toLowerCase().includes(term)));
 $('inbox-count').textContent=list.length+' item'+(list.length===1?'':'s');
 $('inbox-list').innerHTML=list.length?list.map(r=>{
  const isChat=r.source_type==='chat_report'||r.source_type==='private_chat_report';
  const label=r.source_type.replaceAll('_',' ');
  return '<article class="inbox-item" data-id="'+r.id+'"><div class="page-title-row"><h3>'+esc(isChat?'Chat moderation report':r.first_name+' '+r.last_name)+'</h3><span class="status">'+esc(r.status.replace('_',' '))+'</span></div><p class="inbox-meta">'+esc(isChat?'Reported by a chat participant':r.email+(r.phone?' · '+r.phone:''))+' · '+esc(collegeNames[r.college_id]||'Platform-wide / unassigned')+' · '+new Date(r.created_at).toLocaleString()+'</p><p class="inbox-meta"><b>'+esc(label)+'</b>'+(r.source_label?' · '+esc(r.source_label):'')+'</p>'+(isChat?'<p class="privacy-note">Only the message explicitly reported by a user is shown here. The rest of the private conversation is not accessible to moderators.</p>':'')+'<div class="inbox-message">'+esc(r.message)+'</div><label for="reply-'+r.id+'">Admin response / internal note</label><textarea class="inbox-reply" id="reply-'+r.id+'" maxlength="5000" placeholder="Write an internal note…">'+esc(r.admin_reply||'')+'</textarea><div class="inbox-actions"><select data-status="'+r.id+'"><option value="new" '+(r.status==='new'?'selected':'')+'>New</option><option value="in_review" '+(r.status==='in_review'?'selected':'')+'>In review</option><option value="replied" '+(r.status==='replied'?'selected':'')+'>Replied</option><option value="resolved" '+(r.status==='resolved'?'selected':'')+'>Resolved</option></select><button class="btn btn-primary btn-sm" data-save="'+r.id+'">Save note & status</button></div></article>';
 }).join(''):'<div class="inbox-empty"><div class="inbox-empty-icon">✉</div><strong>No matching items</strong>Try another category or clear your search filters.</div>';
}
async function actions(e){
 const btn=e.target.closest('[data-save]');if(!btn)return;
 const id=btn.dataset.save,card=btn.closest('.inbox-item'),reply=card.querySelector('textarea').value.trim(),status=card.querySelector('select').value;
 btn.disabled=true;btn.textContent='Saving…';
 const user=(await sb.auth.getUser()).data.user;
 const payload={admin_reply:reply||null,status,updated_at:new Date().toISOString(),replied_by:reply?user.id:null,replied_at:reply?new Date().toISOString():null};
 const {error}=await sb.from('hapn_inbox').update(payload).eq('id',id);
 btn.disabled=false;btn.textContent='Save note & status';
 if(error){notice('Could not save: '+error.message,true);return;}
 notice('Inbox item updated.');await load();
}
init().catch(()=>{$('gate').textContent='Could not verify admin access. Please refresh.';});
})();